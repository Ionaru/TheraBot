import { formatNumber } from '@ionaru/format-number';
import * as countdown from 'countdown';
import { Channel, Client, DiscordAPIError, RichEmbed, TextChannel, User } from 'discord.js';

import { debug } from '../main';
import { ChannelModel } from '../models/channel.model';
import { UserChannelModel } from '../models/user-channel.model';
import { WormholeModel } from '../models/wormhole.model';
import { EveScoutService, IWormholeData } from '../services/eve-scout.service';

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

    // tslint:disable-next-line:no-bitwise
    private readonly countdownUnits = countdown.HOURS | countdown.MINUTES;

    private readonly client: Client;
    private readonly eveScoutService: EveScoutService;
    private readonly debug = debug.extend('watch');

    private knownWormholes: number[] = [];

    constructor(client: Client) {
        this.client = client;
        this.eveScoutService = new EveScoutService();
    }

    public async startWatchCycle() {
        const wormholes = await WormholeModel.find();
        this.knownWormholes = wormholes.map((wormhole) => wormhole.identifier);

        this.debug(`Started watching with ${this.knownWormholes.length} known wormholes`);

        setInterval(() => {
            this.doWatchCycle();
        }, 300000); // 5 minutes
        this.doWatchCycle();
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
            WormholeModel.findOne({where: [{identifier: wormholeId}]}).then((wormhole) => {
                if (wormhole) {
                    wormhole.remove().then();
                }
            });
        });
    }

    public async sendWormholeAddedMessage(channels: supportedChannelType[], wormhole: IWormholeData) {

        const embed = new RichEmbed();
        embed.setTitle('**New Thera connection scouted**');
        embed.setColor(WatchController.getSecurityStatusColour(wormhole.destinationSolarSystem.security));

        embed.addField('**Region**', wormhole.destinationSolarSystem.region.name, true);
        embed.addField('**System**', `${wormhole.destinationSolarSystem.name} (${this.getSecurityStatusText(wormhole.destinationSolarSystem.security)})`, true);

        embed.addBlankField();

        embed.addField('**Signature** (In - Out)', `\`${wormhole.wormholeDestinationSignatureId}\` - \`${wormhole.signatureId}\``, true);
        embed.addField('**Size**', [`${this.getMass(wormhole.sourceWormholeType.jumpMass)}kg`, wormhole.wormholeMass], true);
        embed.addField('**Type**', `\`${wormhole.sourceWormholeType.name}\``, true);

        embed.addBlankField();

        embed.addField('**Estimated Life**', `${countdown(new Date(wormhole.wormholeEstimatedEol), undefined, this.countdownUnits)}`);

        embed.setFooter('Data from https://www.eve-scout.com/', 'http://www.newedenpodcast.de/wp-content/uploads/2019/02/EvE-Scout_Logo-281x300.png');
        embed.setTimestamp();

        this.debug(`Sending messages for WH ${wormhole.sourceWormholeType.name} to ${channels.length} channels`);

        channels.forEach((channel) => {
            channel.send('', {embed}).catch((e) => {
                if (e instanceof DiscordAPIError) {
                    this.debug(`${e.message}: ${channel.toString()}`);
                }
            });
        });
    }

    private async getChannelsToNotify() {
        const usedChannelClasses = [TextChannel];
        const comparator = (channel: Channel) => usedChannelClasses.some((channelClass) => channel instanceof channelClass);

        const channels = this.client.channels.array().filter(comparator) as supportedChannelType[];
        const savedChannels = await ChannelModel.find();
        const savedChannelIds = savedChannels.map((channel) => channel.identifier);
        const channelsToSend = channels.filter((channel) => savedChannelIds.includes(channel.id));

        const users = this.client.users.array();
        const savedUsers = await UserChannelModel.find();
        const savedUserIds = savedUsers.map((user) => user.identifier);
        const usersToSend = users.filter((user) => savedUserIds.includes(user.id));

        return [...channelsToSend, ...usersToSend];
    }

    private getSecurityStatusText = (secStatus: number) => formatNumber(secStatus, 1);

    private getMass = (mass: number) => formatNumber(mass * 1000000, 0);
}
