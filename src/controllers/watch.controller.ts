import { PublicESIService } from '@ionaru/esi-service';
import { formatNumber } from '@ionaru/format-number';
import { AxiosInstance } from 'axios';
import * as countdown from 'countdown';
import { Channel, Client, DiscordAPIError, MessageEmbed, TextChannel, User } from 'discord.js';

import { debug } from '../main';
import { ChannelModel, ChannelType } from '../models/channel.model';
import { FilterModel, FilterType } from '../models/filter.model';
import { WormholeModel } from '../models/wormhole.model';
import { EveScoutService, IWormholeData } from '../services/eve-scout.service';
import { NamesService } from '../services/names.service';

type supportedChannelType = TextChannel | User;

export class WatchController {

    private static getSecurityStatusColour(secStatus: number) {
        const roundedSecStatus = Number(secStatus.toPrecision(1));
        switch (true) {
            case secStatus < 0.05:
                return '#F00000';
            case roundedSecStatus === 0.1:
                return '#D73000';
            case roundedSecStatus === 0.2:
                return '#F04800';
            case roundedSecStatus === 0.3:
                return '#F06000';
            case roundedSecStatus === 0.4:
                return '#D77700';
            case roundedSecStatus === 0.5:
                return '#EFEF00';
            case roundedSecStatus === 0.6:
                return '#8FEF2F';
            case roundedSecStatus === 0.7:
                return '#00F000';
            case roundedSecStatus === 0.8:
                return '#00EF47';
            case roundedSecStatus === 0.9:
                return '#48F0C0';
            case roundedSecStatus >= 1:
                return '#2FEFEF';
            default:
                return '#2FEFEF';
        }
    }

    private static getSecurityStatusText(secStatus: number) {
        if (0 < secStatus && secStatus <= 0.05) {
            return '0.1';
        }

        return formatNumber(secStatus, 1);
    }

    // tslint:disable-next-line:no-bitwise
    private readonly countdownUnits = countdown.HOURS | countdown.MINUTES;

    private readonly client: Client;
    private readonly eveScoutService: EveScoutService;
    private readonly namesService: NamesService;
    private readonly debug = debug.extend('watch');
    private readonly wormholeSystemRegex = new RegExp(/^J\d{6}$/);

    private knownWormholes: number[] = [];

    constructor(client: Client, axiosInstance: AxiosInstance, publicESIService: PublicESIService) {
        this.client = client;
        this.eveScoutService = new EveScoutService(axiosInstance);
        this.namesService = new NamesService(publicESIService);
    }

    public async startWatchCycle() {
        const wormholes = await WormholeModel.find();
        this.knownWormholes = wormholes.map((wormhole) => wormhole.id);

        this.debug(`Started watching with ${this.knownWormholes.length} known wormholes`);

        setInterval(() => {
            this.doWatchCycle();
        }, 300000); // 5 minutes
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

        if (!addedWormholes.length) {
            return;
        }

        this.knownWormholes = wormholeNumbers;

        const channelsToNotify = await this.getChannelsToNotify();

        addedWormholes.forEach((wormholeId) => {
            const wormhole = data.find((wormholeData) => wormholeData.id === wormholeId);
            if (wormhole) {
                this.sendWormholeAddedMessage(channelsToNotify, wormhole);
            }
            new WormholeModel(wormholeId).save().then();
        });

        closedWormholes.forEach((wormholeId) => {
            WormholeModel.delete(wormholeId);
        });
    }

    public async sendWormholeAddedMessage(channels: supportedChannelType[], wormhole: IWormholeData) {

        const embed = new MessageEmbed();
        embed.setTitle('**New Thera connection scouted**');
        embed.setColor(WatchController.getSecurityStatusColour(wormhole.destinationSolarSystem.security));

        embed.addField('**Region**', wormhole.destinationSolarSystem.region.name, true);
        const securityStatus = WatchController.getSecurityStatusText(wormhole.destinationSolarSystem.security);
        embed.addField('**System**', `${wormhole.destinationSolarSystem.name} (${securityStatus})`, true);

        embed.addField('\u200b', '\u200b')

        embed.addField('**Signature** (In - Out)', `\`${wormhole.wormholeDestinationSignatureId}\` - \`${wormhole.signatureId}\``, true);
        embed.addField('**Size**', [`${this.getMass(wormhole.sourceWormholeType.jumpMass)}kg`, wormhole.wormholeMass], true);
        embed.addField('**Type**', `\`${wormhole.sourceWormholeType.name}\``, true);

        embed.addField('\u200b', '\u200b')

        embed.addField('**Estimated Life**', `${countdown(new Date(wormhole.wormholeEstimatedEol), undefined, this.countdownUnits)}`);

        embed.setFooter('Data from https://www.eve-scout.com/', 'http://www.newedenpodcast.de/wp-content/uploads/2019/02/EvE-Scout_Logo-281x300.png');
        embed.setTimestamp();

        this.debug(`Sending messages for WH ${wormhole.sourceWormholeType.name} to ${channels.length} channels`);

        return Promise.all(channels.map(async (channel) => {
            const channelModel = await ChannelModel.findOne({where: [{identifier: channel.id}]});
            if (!channelModel) {
                return;
            }

            const filteredBySecurity = await this.isFilteredBySecurity(channelModel.filters, wormhole);
            if (filteredBySecurity) {
                return;
            }

            const filteredBySystem = await this.isFilteredBySystem(channelModel.filters, wormhole);
            if (filteredBySystem) {
                return;
            }

            channel.send('', {embed}).catch((e) => {
                if (e instanceof DiscordAPIError) {
                    this.debug(`${e.message}: ${channel.toString()}`);
                }
            });
        }));
    }

    private async isFilteredBySecurity(filters: FilterModel[], wormhole: IWormholeData): Promise<boolean> {

        if (!filters.length) {
            return false;
        }

        const allowedSecurity = [];
        let wormholeSpace = false;
        let absoluteStatus = false;

        const securityClassFilters = filters.filter((filter) => filter.type === FilterType.SecurityClass);
        for (const securityClassFilter of securityClassFilters) {
            switch (securityClassFilter.filter) {
                case 'highsec':
                    allowedSecurity.push(...['0.5', '0.6', '0.7', '0.8', '0.9', '1.0']);
                    break;
                case 'lowsec':
                    allowedSecurity.push(...['0.1', '0.2', '0.3', '0.4']);
                    break;
                case 'nullsec':
                    allowedSecurity.push(...['-1.0', '-0.9', '-0.8', '-0.7', '-0.6', '-0.5', '-0.4', '-0.3', '-0.2', '-0.1', '0.0']);
                    break;
                case 'wspace':
                    wormholeSpace = true;
                    break;
            }
        }

        const securityStatusFilters = filters.filter((filter) => filter.type === FilterType.SecurityStatus);
        for (const securityStatusFilter of securityStatusFilters) {
            absoluteStatus = true;
            allowedSecurity.push(securityStatusFilter.filter);
        }

        const isWormholeSystem = this.wormholeSystemRegex.test(wormhole.destinationSolarSystem.name);
        if (!allowedSecurity.length && wormholeSpace && !isWormholeSystem) {
            return true;
        }

        if (wormholeSpace && isWormholeSystem) {
            return false;
        }
        if (!absoluteStatus && isWormholeSystem) {
            return true;
        }

        if (!allowedSecurity.length) {
            return false;
        }

        return !allowedSecurity.includes(WatchController.getSecurityStatusText(wormhole.destinationSolarSystem.security));
    }

    private async isFilteredBySystem(filters: FilterModel[], wormhole: IWormholeData): Promise<boolean> {

        if (!filters.length) {
            return false;
        }

        const systemFilters = filters.filter((filter) => filter.type === FilterType.System);
        for (const systemFilter of systemFilters) {
            if (wormhole.destinationSolarSystem.name.toLowerCase() === systemFilter.filter) {
                return false;
            }
        }

        const constellationFilters = filters.filter((filter) => filter.type === FilterType.Constellation);
        for (const constellationFilter of constellationFilters) {
            const constellationName = await this.namesService.getName(wormhole.destinationSolarSystem.constellationID);
            if (constellationName && constellationName.toLowerCase() === constellationFilter.filter) {
                return false;
            }
        }

        const regionFilters = filters.filter((filter) => filter.type === FilterType.Region);
        for (const regionFilter of regionFilters) {
            if (wormhole.destinationSolarSystem.region.name.toLowerCase() === regionFilter.filter) {
                return false;
            }
        }

        return !(!systemFilters.length && !constellationFilters.length && !regionFilters.length);
    }

    private async getChannelsToNotify() {
        const usedChannelClasses = [TextChannel];
        const comparator = (channel: Channel) => usedChannelClasses.some((channelClass) => channel instanceof channelClass);

        const allSavedChannels = await ChannelModel.find({where: [{active: true}]});

        const channels = await this.client.channels.cache.array().filter(comparator) as supportedChannelType[];
        const savedChannels = allSavedChannels.filter((channel) => channel.type === ChannelType.TextChannel);
        const savedChannelIds = savedChannels.map((channel) => channel.identifier);
        const channelsToSend = channels.filter((channel) => savedChannelIds.includes(channel.id));

        const userChannels = this.client.users.cache.array();
        const savedUserChannels = allSavedChannels.filter((channel) => channel.type === ChannelType.DMChannel);
        const savedUserChannelIds = savedUserChannels.map((channel) => channel.identifier);
        const userChannelsToSend = userChannels.filter((channel) => savedUserChannelIds.includes(channel.id));

        return [...channelsToSend, ...userChannelsToSend];
    }

    private getMass = (mass: number) => formatNumber(mass * 1000000, 0);
}
