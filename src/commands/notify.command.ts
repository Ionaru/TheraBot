import { DMChannel, TextChannel } from 'discord.js';
import { BaseModel } from '../models/base.model';
import { ChannelModel } from '../models/channel.model';
import { UserChannelModel } from '../models/user-channel.model';
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

        if (args.toLowerCase() === 'here' && this.message.channel instanceof TextChannel) {
            const channel = await ChannelModel.findOne({where: [{identifier: this.message.channel.id}]});
            if (channel) {
                this.setNotifyEmbed('Channel already added');
            } else {
                await new ChannelModel(this.message.channel.id).save();
                this.setNotifyEmbed('Channel added');
            }

        } else if (args.toLowerCase() === 'here' && this.message.channel instanceof DMChannel) {
            const userChannel = await UserChannelModel.findOne({where: [{identifier: this.message.author.id}]});
            if (userChannel) {
                this.setNotifyEmbed('Channel already added');
            } else {
                await new UserChannelModel(this.message.author.id).save();
                this.setNotifyEmbed('Channel added');
            }

        } else if (args.toLowerCase() === 'stop') {
            const model = await this.getModelToRemove();

            if (model) {
                await model.remove();
                this.setNotifyEmbed('Channel removed');
            } else {
                this.setNotifyEmbed('Channel not found');
            }
        } else {
            this.setNotifyHelp();
        }
    }

    private setNotifyEmbed(text: string) {
        this.embed.addField('**Notify**', text);
    }

    private setNotifyHelp() {
        this.embed.addField('**Notify**', [
            '- **here** - Notify about new wormholes in this channel.',
            '- **stop** - Stop notifying about new wormholes in this channel.',
        ], true);
        this.embed.addBlankField(true);
        this.embed.addField('**Examples**', [
            '- !thera notify here',
            '- !thera notify stop',
        ], true);
    }

    private async getModelToRemove(): Promise<BaseModel | undefined> {
        const channel = await ChannelModel.findOne({where: [{identifier: this.message.channel.id}]});
        if (channel) {
            return channel;
        }

        const userChannel = await UserChannelModel.findOne({where: [{identifier: this.message.author.id}]});
        if (userChannel) {
            return userChannel;
        }

        return;
    }
}
