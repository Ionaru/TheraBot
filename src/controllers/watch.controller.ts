import { PublicESIService } from '@ionaru/esi-service';
import { formatNumber } from '@ionaru/format-number';
import { AxiosInstance } from 'axios';
import * as countdown from 'countdown';
import { Channel, Client, DiscordAPIError, EmbedBuilder, TextChannel, User } from 'discord.js';

import { debug } from '../debug';
import { ChannelModel, ChannelType } from '../models/channel.model';
import { FilterModel, FilterType } from '../models/filter.model';
import { WormholeModel } from '../models/wormhole.model';
import { EveScoutService, IEveScoutSignature } from '../services/eve-scout.service';
import { NamesService } from '../services/names.service';

type SupportedChannelType = TextChannel | User;

interface IEsiSolarSystem {
    constellation_id: number;
    security_status: number;
}

export class WatchController {

    // eslint-disable-next-line no-bitwise
    private readonly countdownUnits = countdown.HOURS | countdown.MINUTES;

    private readonly client: Client;
    private readonly eveScoutService: EveScoutService;
    private readonly namesService: NamesService;
    private readonly publicESIService: PublicESIService;
    private readonly debug = debug.extend('watch');
    private readonly wormholeSystemRegex = new RegExp(/^J\d{6}$/);

    private knownWormholes: number[] = [];

    public constructor(client: Client, axiosInstance: AxiosInstance, publicESIService: PublicESIService) {
        this.client = client;
        this.eveScoutService = new EveScoutService(axiosInstance);
        this.namesService = new NamesService(publicESIService);
        this.publicESIService = publicESIService;
    }

    private static getSecurityStatusColour(secStatus: number) {
        const roundedSecStatus = Number(secStatus.toPrecision(1));
        switch (true) {
            case secStatus < 0.05: {
                return '#F00000';
            }
            case roundedSecStatus === 0.1: {
                return '#D73000';
            }
            case roundedSecStatus === 0.2: {
                return '#F04800';
            }
            case roundedSecStatus === 0.3: {
                return '#F06000';
            }
            case roundedSecStatus === 0.4: {
                return '#D77700';
            }
            case roundedSecStatus === 0.5: {
                return '#EFEF00';
            }
            case roundedSecStatus === 0.6: {
                return '#8FEF2F';
            }
            case roundedSecStatus === 0.7: {
                return '#00F000';
            }
            case roundedSecStatus === 0.8: {
                return '#00EF47';
            }
            case roundedSecStatus === 0.9: {
                return '#48F0C0';
            }
            case roundedSecStatus >= 1: {
                return '#2FEFEF';
            }
            default: {
                return '#2FEFEF';
            }
        }
    }

    private static getSecurityStatusText(secStatus: number) {
        if (0 < secStatus && secStatus <= 0.05) {
            return '0.1';
        }

        return formatNumber(secStatus, 1);
    }

    public async startWatchCycle() {
        const wormholes = await WormholeModel.find();
        this.knownWormholes = wormholes.map((wormhole) => wormhole.id);

        this.debug(`Started watching with ${this.knownWormholes.length} known wormholes`);

        setInterval(() => {
            this.doWatchCycle();
        }, 300_000); // 5 minutes
        this.doWatchCycle().then();
    }

    public async doWatchCycle() {
        const data = await this.eveScoutService.getWH();

        if (!data) {
            return;
        }

        const wormholeNumbers = data.map((wormholeData) => wormholeData.id);
        const addedWormholes = wormholeNumbers.filter((wormholeNumber) => !this.knownWormholes.includes(wormholeNumber));
        const closedWormholes = this.knownWormholes.filter((knownWormhole) => !wormholeNumbers.includes(knownWormhole));

        if (addedWormholes.length === 0) {
            return;
        }

        this.knownWormholes = wormholeNumbers;

        const channelsToNotify = await this.getChannelsToNotify();

        for (const wormholeId of addedWormholes) {
            const wormhole = data.find((wormholeData) => wormholeData.id === wormholeId);
            if (wormhole) {
                await this.sendWormholeAddedMessage(channelsToNotify, wormhole);
            }

            const wormholeModel = new WormholeModel();
            wormholeModel.id = wormholeId;
            await wormholeModel.save();
        }

        for (const wormholeId of closedWormholes) {
            await WormholeModel.delete(wormholeId);
        }
    }

    public async sendWormholeAddedMessage(channels: SupportedChannelType[], wormhole: IEveScoutSignature) {

        const system = await this.publicESIService.fetchESIData<IEsiSolarSystem>(
            `https://esi.evetech.net/v4/universe/systems/${wormhole.in_system_id}`,
        );

        const embed = new EmbedBuilder();
        embed.setTitle('**New Thera connection scouted**');
        embed.setColor(WatchController.getSecurityStatusColour(system.security_status));

        const securityStatus = WatchController.getSecurityStatusText(system.security_status);

        embed.addFields([
            {inline: true, name: '**Region**', value: wormhole.in_region_name},
            {inline: true, name: '**System**', value: `${wormhole.in_system_name} (${securityStatus})`},
            {name: '\u200B', value: '\u200B'},
            {inline: true, name: '**Signature**', value: `\`${wormhole.out_signature}\` - \`${wormhole.in_signature}\``},
            {inline: true, name: '**Size**', value: `\`${wormhole.max_ship_size}\``},
            {inline: true, name: '**Type**', value: `\`${wormhole.wh_type}\``},
            {name: '\u200B', value: '\u200B'},
            {name: '**Estimated Life**', value: `${countdown(new Date(wormhole.expires_at), undefined, this.countdownUnits)}`},
        ]);

        embed.setFooter({
            iconURL: 'https://www.newedenpodcast.de/wp-content/uploads/2019/02/EvE-Scout_Logo-281x300.png',
            text: 'Data from https://www.eve-scout.com/',
        });
        embed.setTimestamp();

        this.debug(`Sending messages for WH ${wormhole.wh_type} to ${channels.length} channels (before filtering).`);

        return Promise.all(channels.map(async (channel) => {
            const channelModel = await ChannelModel.findOne({where: [{identifier: channel.id}]});
            if (!channelModel) {
                return;
            }

            const filteredBySecurity = await this.isFilteredBySecurity(channelModel.filters, wormhole, system);
            if (filteredBySecurity) {
                return;
            }

            const filteredBySystem = await this.isFilteredBySystem(channelModel.filters, wormhole, system);
            if (filteredBySystem) {
                return;
            }

            channel.send({embeds: [embed]}).catch((error) => {
                if (error instanceof DiscordAPIError) {
                    this.debug(`${error.message}: ${channel.toString()}`);
                }
            });
        }));
    }

    private async isFilteredBySecurity(filters: FilterModel[], wormhole: IEveScoutSignature, system: IEsiSolarSystem): Promise<boolean> {

        if (filters.length === 0) {
            return false;
        }

        const allowedSecurity = [];
        let wormholeSpace = false;
        let absoluteStatus = false;

        const securityClassFilters = filters.filter((filter) => filter.type === FilterType.SECURITY_CLASS);
        for (const securityClassFilter of securityClassFilters) {
            switch (securityClassFilter.filter) {
                case 'highsec': {
                    allowedSecurity.push('0.5', '0.6', '0.7', '0.8', '0.9', '1.0');
                    break;
                }
                case 'lowsec': {
                    allowedSecurity.push('0.1', '0.2', '0.3', '0.4');
                    break;
                }
                case 'nullsec': {
                    allowedSecurity.push('-1.0', '-0.9', '-0.8', '-0.7', '-0.6', '-0.5', '-0.4', '-0.3', '-0.2', '-0.1', '0.0');
                    break;
                }
                case 'wspace': {
                    wormholeSpace = true;
                    break;
                }
            }
        }

        const securityStatusFilters = filters.filter((filter) => filter.type === FilterType.SECURITY_STATUS);
        for (const securityStatusFilter of securityStatusFilters) {
            absoluteStatus = true;
            allowedSecurity.push(securityStatusFilter.filter);
        }

        const isWormholeSystem = this.wormholeSystemRegex.test(wormhole.in_system_name);
        if (allowedSecurity.length === 0 && wormholeSpace && !isWormholeSystem) {
            return true;
        }

        if (wormholeSpace && isWormholeSystem) {
            return false;
        }
        if (!absoluteStatus && isWormholeSystem) {
            return true;
        }

        if (allowedSecurity.length === 0) {
            return false;
        }

        return !allowedSecurity.includes(WatchController.getSecurityStatusText(system.security_status));
    }

    private async isFilteredBySystem(filters: FilterModel[], wormhole: IEveScoutSignature, system: IEsiSolarSystem): Promise<boolean> {

        if (filters.length === 0) {
            return false;
        }

        const systemFilters = filters.filter((filter) => filter.type === FilterType.SYSTEM);
        for (const systemFilter of systemFilters) {
            if (wormhole.in_system_name.toLowerCase() === systemFilter.filter) {
                return false;
            }
        }

        const constellationFilters = filters.filter((filter) => filter.type === FilterType.CONSTELLATION);
        for (const constellationFilter of constellationFilters) {
            const constellationName = await this.namesService.getName(system.constellation_id);
            if (constellationName && constellationName.toLowerCase() === constellationFilter.filter) {
                return false;
            }
        }

        const regionFilters = filters.filter((filter) => filter.type === FilterType.REGION);
        for (const regionFilter of regionFilters) {
            if (wormhole.in_region_name.toLowerCase() === regionFilter.filter) {
                return false;
            }
        }

        return !(systemFilters.length === 0 && constellationFilters.length === 0 && regionFilters.length === 0);
    }

    private async getChannelsToNotify() {
        const usedChannelClasses = [TextChannel];
        const comparator = (channel: Channel) => usedChannelClasses.some((channelClass) => channel instanceof channelClass);

        const allSavedChannels = await ChannelModel.find({where: [{active: true}]});

        const channels = [...this.client.channels.cache.values()].filter((element) => comparator(element)) as SupportedChannelType[];
        const savedChannels = allSavedChannels.filter((channel) => channel.type === ChannelType.TEXT_CHANNEL);
        const savedChannelIds = new Set(savedChannels.map((channel) => channel.identifier));
        const channelsToSend = channels.filter((channel) => savedChannelIds.has(channel.id));

        const userChannels = [...this.client.users.cache.values()];
        const savedUserChannels = allSavedChannels.filter((channel) => channel.type === ChannelType.DM_CHANNEL);
        const savedUserChannelIds = new Set(savedUserChannels.map((channel) => channel.identifier));
        const userChannelsToSend = userChannels.filter((channel) => savedUserChannelIds.has(channel.id));

        return [...channelsToSend, ...userChannelsToSend];
    }
}
