import { DMChannel, TextChannel } from 'discord.js';

import { publicESIService } from '../main';
import { ChannelModel, ChannelType } from '../models/channel.model';
import { FilterModel } from '../models/filter.model';
import { FilterTypeService } from '../services/filter-type.service';
import { Command } from './command';

enum NotifySubCommand {
    info = 'info',
    here = 'here',
    when = 'when',
    undo = 'undo',
    stop = 'stop',
    help = 'help',
}

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

    private static async getFilter(channel: ChannelModel, filter: string): Promise<FilterModel | undefined> {
        return FilterModel.findOne({where: [{channel, filter}]});
    }

    private static trimSubCommand(args: string, subCommand: NotifySubCommand) {
        return args.replace(subCommand, '').trim();
    }

    protected initialReply = undefined;

    protected async isCommandValid(): Promise<boolean> {
        return true;
    }

    protected async processCommand(): Promise<void> {
        const args = this.message.content.replace(NotifyCommand.commandRegex, '').trim();
        const firstArg = args.toLowerCase().split(' ').shift();

        switch (firstArg) {

            case NotifySubCommand.info:

                await this.setNotifyInfo();
                break;

            case NotifySubCommand.here:

                await this.setNotifyHere();
                break;

            case NotifySubCommand.when:

                const whenArg = NotifyCommand.trimSubCommand(args, NotifySubCommand.when);

                if (!whenArg.length) {
                    this.setNotifyEmbed('Argument expected.');
                    break;
                }

                await this.setNotifyWhen(whenArg.toLowerCase());
                break;

            case NotifySubCommand.undo:

                const undoArg = NotifyCommand.trimSubCommand(args, NotifySubCommand.undo);

                if (!undoArg.length) {
                    this.setNotifyEmbed('Argument expected.');
                    break;
                }

                await this.setNotifyUndo(undoArg.toLowerCase());
                break;

            case NotifySubCommand.stop:

                await this.setNotifyStop();
                break;

            case NotifySubCommand.help:
            default:

                this.setNotifyHelp();
        }
    }

    private setNotifyEmbed(text: string | string[]) {
        this.embed.addField('**Notify**', text);
    }

    private async setNotifyInfo() {
        const channel = await this.getChannel();

        const channelText = [];

        if (channel) {
            channelText.push(`- **Status** - ${channel.active ? 'Active' : 'Inactive'}`);

            for (const filter of channel.filters) {
                channelText.push(`- **Filter** - ${filter.filter}`);
            }

        } else {
            channelText.push(`- **Status** - Inactive`, '', 'Run \`!thera notify here\` to enable notifications.');
        }

        this.embed.addField('**Notifications in this channel**', channelText);
    }

    private async setNotifyHere() {
        const channel = await this.getChannel();

        if (channel && channel.active) {
            this.setNotifyEmbed('Channel already added');
        } else {
            this.activateChannel(channel);
            this.setNotifyEmbed('Channel added');
        }
    }

    private async setNotifyWhen(filter: string) {

        // A wormhole from Thera will never connect to Thera.
        if (['thera', 'g-c00324', 'g-r00031'].includes(filter)) {
            this.reply.options = {};
            this.reply.text = 'https://tenor.com/view/denhom-clapping-it-crowd-bravo-funny-guy-gif-13251757';
            return;
        }

        const output = [];

        let channel = await this.getChannel();
        if (!channel) {
            await this.activateChannel(channel);
            output.push('Channel added');
            channel = await this.getChannel();
        }

        if (channel) {

            if (await NotifyCommand.getFilter(channel, filter)) {
                this.setNotifyEmbed('Filter already exists on this channel');
                return;
            }

            const filterType = await new FilterTypeService(publicESIService).getFilterType(filter);

            if (filterType === undefined) {
                this.setNotifyEmbed('Unknown filter');
                return;
            }

            const filterModel = new FilterModel(channel, filterType, filter);
            await filterModel.save();
            output.push('Filter added');

            this.setNotifyEmbed(output);
        }
    }

    private async setNotifyUndo(filter: string) {
        const channel = await this.getChannel();

        if (!channel) {
            this.setNotifyEmbed('Channel not found');
            return;
        }

        const filterModel = await NotifyCommand.getFilter(channel, filter);

        if (!filterModel) {
            this.setNotifyEmbed('Filter not found');
            return;
        }

        await filterModel.remove();
        this.setNotifyEmbed('Filter removed');
    }

    private async setNotifyStop() {
        const channel = await this.getChannel();

        if (channel) {
            channel.active = false;
            await channel.save();
            this.setNotifyEmbed('Channel removed');
        } else {
            this.setNotifyEmbed('Channel not found');
        }
    }

    private setNotifyHelp() {
        this.embed.addField('**Notify**', [
            '- **info** - Show information about notifications and active filters in this channel.',
            '- **here** - Notify about new wormholes in this channel.',
            '- **when (security, system, constellation, region)** - Notify when a wormhole matches a filter. ' +
            'The wormhole must match security AND (system OR constellation OR region). Multiple filters can be active at the same time.',
            '- **undo (security, system, constellation, region)** - Remove a notification filter.',
            '- **stop** - Stop notifying about new wormholes in this channel.',
        ]);
        this.embed.addField('**Examples**', [
            '- !thera notify info',
            '- !thera notify here',
            '- !thera notify when wspace',
            '- !thera notify when highsec',
            '- !thera notify when 0.6',
            '- !thera notify when -0.1',
            '- !thera notify when The Forge',
            '- !thera notify when Jita',
            '- !thera notify undo -0.1',
            '- !thera notify undo Jita',
            '- !thera notify stop',
        ]);
        this.embed.addField('**Filter examples**', [
            '- **Scalding Pass** - Any system in the Scalding Pass region.',
            '- **Kimotoro** - Any system in the Kimotoro constellation.',
            '- **lowsec** - Any system with a security rating between 0.1 and 0.4.',
            '- **0.1, 0.2, 0.3, 0.4** - Same as above.',
            '- **0.5, 0.7, Domain** - Systems with security rating 0.5 or 0.7 in the Domain region.',
            '- **highsec, Hek, The Forge** - Systems with security rating 0.5 or higher that are in the Hek system or The Forge region.',
            '- **Jita, 0.5** - Will match nothing because Jita has a security rating of 0.9.',
            '- **Thera** - That\'s... not possible.',
        ]);
    }

    private async getChannel(): Promise<ChannelModel | undefined> {
        if (this.message.channel instanceof TextChannel) {
            return ChannelModel.findOne({where: [{identifier: this.message.channel.id}]});
        } else if (this.message.channel instanceof DMChannel) {
            return ChannelModel.findOne({where: [{identifier: this.message.author.id}], loadEagerRelations: true});
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
