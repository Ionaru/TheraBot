import { DMChannel, TextChannel } from 'discord.js';
import { ChannelModel, ChannelType } from '../models/channel.model';
import { Command } from './command';

export class NotifyCommand extends Command {

    public static readonly commands = [
        'notify',
    ];

    public static readonly debug = Command.debug.extend('notify');

    public static test(command: string) {
        NotifyCommand.debug(`Testing ${command} (${NotifyCommand.commandRegex})`);
        return NotifyCommand.commandRegex.test(command);
    }

    private static readonly commandRegex = Command.createCommandRegex(NotifyCommand.commands, true);
    protected initialReply = undefined;

    protected async isCommandValid(): Promise<boolean> {
        return true;
    }

    protected async processCommand(): Promise<void> {
        const args = this.message.content.replace(NotifyCommand.commandRegex, '').trim();
        const firstArg = args.toLowerCase().split(' ').shift();

        let channel: ChannelModel | undefined;

        switch (firstArg) {

            case 'here':

                channel = await this.getChannel();

                if (channel && channel.active) {
                    this.setNotifyEmbed('Channel already added');
                } else {
                    this.activateChannel(channel);
                    this.setNotifyEmbed('Channel added');
                }
                break;

            case 'stop':
                channel = await this.getChannel();

                if (channel) {
                    channel.active = false;
                    await channel.save();
                    this.setNotifyEmbed('Channel removed');
                } else {
                    this.setNotifyEmbed('Channel not found');
                }
                break;

            default:
                await this.setNotifyHelp();
        }
    }

    private setNotifyEmbed(text: string) {
        this.embed.addField('**Notify**', text);
    }

    private async setNotifyHelp() {
        this.embed.addField('**Notify**', [
            '- **here** - Notify about new wormholes in this channel.',
            '- **stop** - Stop notifying about new wormholes in this channel.',
        ]);
        this.embed.addField('**Examples**', [
            '- !thera notify here',
            '- !thera notify stop',
        ]);

        const channel = await this.getChannel();
        this.embed.addField('**Notifications in this channel**', [
            `- **Status** - ${channel && channel.active ? 'Active' : 'Inactive'}`,
        ]);
    }

    private async getChannel(): Promise<ChannelModel | undefined> {
        if (this.message.channel instanceof TextChannel) {
            return ChannelModel.findOne({where: [{identifier: this.message.channel.id}]});
        } else if (this.message.channel instanceof DMChannel) {
            return ChannelModel.findOne({where: [{identifier: this.message.author.id}]});
        }
        return;
    }

    private async activateChannel(channel?: ChannelModel) {

        if (channel) {
            channel.active = true;
            await channel.save();
        } else {
            if (this.message.channel instanceof TextChannel) {
                await new ChannelModel(ChannelType.TextChannel, this.message.channel.id).save();
            } else if (this.message.channel instanceof DMChannel) {
                await new ChannelModel(ChannelType.DMChannel, this.message.author.id).save();
            }
        }
    }
}
