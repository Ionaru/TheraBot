import { EmbedBuilder } from 'discord.js';
import { CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create';

import { ChannelModel, ChannelType } from '../models/channel.model';
import { FilterModel } from '../models/filter.model';
import { FilterTypeService } from '../services/filter-type.service';
import { getPublicESIService } from '../utils/public-esi-service.util';

enum NotifySubCommand {
    INFO = 'info',
    HERE = 'here',
    WHEN = 'when',
    UNDO = 'undo',
    STOP = 'stop',
    HELP = 'help',
}

export class NotifyCommand extends SlashCommand {

    public constructor(creator: SlashCreator) {
        super(creator, {
            description: 'Show information about the notify command and filtering',
            name: 'notify',
            options: [
                {
                    description: 'Show information about notifications and active filters in this channel.',
                    name: 'info',
                    type: CommandOptionType.SUB_COMMAND,
                },
                {
                    description: 'Notify about new wormholes in this channel.',
                    name: 'here',
                    type: CommandOptionType.SUB_COMMAND,
                },
                {
                    description: 'Add a notification filter.',
                    name: 'when',
                    options: [
                        {
                            description: 'Enter a filter, or multiple separated using commas.',
                            name: 'filter',
                            required: true,
                            type: CommandOptionType.STRING,
                        },
                    ],
                    type: CommandOptionType.SUB_COMMAND,
                },
                {
                    description: 'Remove a notification filter.',
                    name: 'undo',
                    options: [
                        {
                            description: 'Enter a filter, or multiple separated using commas.',
                            name: 'filter',
                            required: true,
                            type: CommandOptionType.STRING,
                        },
                    ],
                    type: CommandOptionType.SUB_COMMAND,
                },
                {
                    description: 'Stop notifying about new wormholes in this channel.',
                    name: 'stop',
                    type: CommandOptionType.SUB_COMMAND,
                },
                {
                    description: 'Show information about setting notification settings',
                    name: 'help',
                    type: CommandOptionType.SUB_COMMAND,
                },
            ],
        });
    }

    private static getFilter(channel: ChannelModel, filter: string): Promise<FilterModel | null> {
        return FilterModel.findOne({
            where: [{
                channel: {
                    identifier: channel.identifier,
                }, filter,
            }],
        });
    }

    private static parseFilter(filters: string): string[] {
        return filters.toLowerCase().split(',').map((filter) => filter.trim());
    }

    public override async onError(_: Error, context: CommandContext) {
        await context.send('Something went wrong. Try again later.');
    }

    public override async run(context: CommandContext): Promise<void> {

        const embed = new EmbedBuilder();

        const subCommand = context.subcommands;

        switch (subCommand[0]) {

            case NotifySubCommand.INFO: {

                await this.setNotifyInfo(embed, context);
                break;
            }

            case NotifySubCommand.HERE: {

                await this.setNotifyHere(embed, context);
                break;
            }

            case NotifySubCommand.WHEN: {

                await this.setNotifyWhen(embed, context);
                break;
            }

            case NotifySubCommand.UNDO: {

                await this.setNotifyUndo(embed, context);
                break;
            }

            case NotifySubCommand.STOP: {

                await this.setNotifyStop(embed, context);
                break;
            }

            default: {
                this.setNotifyHelp(embed);
            }
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await context.send({ embeds: [embed] });
    }

    private setNotifyEmbed(embed: EmbedBuilder, text: string) {
        embed.addFields([{ name: '**Notify**', value: text }]);
    }

    private async setNotifyInfo(embed: EmbedBuilder, context: CommandContext) {
        const channel = await this.getChannel(context);

        const channelText = [];

        if (channel) {
            channelText.push(`- **Status** - ${channel.active ? 'Active' : 'Inactive'}`);

            for (const filter of channel.filters) {
                channelText.push(`- **Filter** - ${filter.filter}`);
            }

        } else {
            channelText.push(`- **Status** - Inactive`, '', 'Run `!thera notify here` to enable notifications.');
        }

        embed.addFields([{ name: '**Notifications in this channel**', value: channelText.join('\n') }]);
    }

    private async setNotifyHere(embed: EmbedBuilder, context: CommandContext) {
        const channel = await this.getChannel(context);

        if (channel && channel.active) {
            this.setNotifyEmbed(embed, 'Channel already added');
        } else {
            await this.activateChannel(context, channel);
            this.setNotifyEmbed(embed, 'Channel added');
        }
    }

    private async setNotifyWhen(embed: EmbedBuilder, context: CommandContext) {

        const filters = NotifyCommand.parseFilter(context.options.when.filter);

        for (const filter of filters) {
            // A wormhole from Thera will never connect to Thera.
            if (['thera', 'g-c00324', 'g-r00031'].includes(filter)) {
                embed.setImage('https://media1.tenor.com/images/b073c5af6bf50ffcd80bdb2ae823f8f7/tenor.gif?itemid=13251757');
                return;
            }
        }

        for (const filter of filters) {

            const output = [];

            let channel = await this.getChannel(context);
            if (!channel || !channel.active) {
                await this.activateChannel(context, channel);
                output.push('Channel added');
                channel = await this.getChannel(context);
            }

            if (channel) {

                if (await NotifyCommand.getFilter(channel, filter)) {
                    this.setNotifyEmbed(embed, `Filter **${filter}** already exists on this channel`);
                    continue;
                }

                const filterType = await new FilterTypeService(getPublicESIService()).getFilterType(filter);

                if (filterType === undefined) {
                    this.setNotifyEmbed(embed, `Unknown filter: **${filter}**`);
                    continue;
                }

                const filterModel = new FilterModel();
                filterModel.channel = channel;
                filterModel.type = filterType;
                filterModel.filter = filter;
                await filterModel.save();
                output.push(`Filter **${filter}** added`);

                this.setNotifyEmbed(embed, output.join('\n'));
            }
        }
    }

    private async setNotifyUndo(embed: EmbedBuilder, context: CommandContext) {

        const channel = await this.getChannel(context);

        if (!channel) {
            this.setNotifyEmbed(embed, 'Channel not found');
            return;
        }

        const filters = NotifyCommand.parseFilter(context.options.undo.filter);

        for (const filter of filters) {

            const filterModel = await NotifyCommand.getFilter(channel, filter);

            if (!filterModel) {
                this.setNotifyEmbed(embed, `Filter **${filter}** not found`);
                continue;
            }

            await filterModel.remove();
            this.setNotifyEmbed(embed, `Filter **${filter}** removed`);
        }
    }

    private async setNotifyStop(embed: EmbedBuilder, context: CommandContext) {
        const channel = await this.getChannel(context);

        if (channel) {
            channel.active = false;
            await channel.save();
            this.setNotifyEmbed(embed, 'Channel removed');
        } else {
            this.setNotifyEmbed(embed, 'Channel not found');
        }
    }

    private setNotifyHelp(embed: EmbedBuilder) {
        embed.addFields([
            {
                name: '**Notify**',
                value: [
                    '- **info** - Show information about notifications and active filters in this channel.',
                    '- **here** - Notify about new wormholes in this channel.',
                    '- **when (security, system, constellation, region)** - Notify when a wormhole matches a filter. ' +
                    'The wormhole must match security AND (system OR constellation OR region). ' +
                    'Multiple filters can be active at the same time.',
                    '- **undo (security, system, constellation, region)** - Remove a notification filter.',
                    '- **stop** - Stop notifying about new wormholes in this channel.',
                ].join('\n'),
            }, {
                name: '**Examples**',
                value: [
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
                ].join('\n'),
            }, {
                name: '**Filter examples**',
                value: [
                    '- **Scalding Pass** - Any system in the Scalding Pass region.',
                    '- **Kimotoro** - Any system in the Kimotoro constellation.',
                    '- **lowsec** - Any system with a security rating between 0.1 and 0.4.',
                    '- **0.1, 0.2, 0.3, 0.4** - Same as above.',
                    '- **0.5, 0.7, Domain** - Systems with security rating 0.5 or 0.7 in the Domain region.',
                    '- **highsec, Hek, The Forge** - Systems with security rating 0.5 or higher that are in the Hek system ' +
                    'or The Forge region.',
                    '- **Jita, 0.5** - Will match nothing because Jita has a security rating of 0.9.',
                    '- **Thera** - That\'s... not possible.',
                ].join('\n'),
            },
        ]);
    }

    private async getChannel(context: CommandContext): Promise<ChannelModel | null> {
        const identifier = context.guildID ? context.channelID : context.user.id;
        return ChannelModel.findOne({ where: [{ identifier }] });
    }

    private async activateChannel(context: CommandContext, existingChannel?: ChannelModel | null) {
        if (existingChannel) {
            existingChannel.active = true;
            await existingChannel.save();
        } else {
            if (context.guildID) {
                const newChannel = new ChannelModel();
                newChannel.type = ChannelType.TEXT_CHANNEL;
                newChannel.identifier = context.channelID;
                await newChannel.save();
            } else {
                const newChannel = new ChannelModel();
                newChannel.type = ChannelType.DM_CHANNEL;
                newChannel.identifier = context.user.id;
                await newChannel.save();
            }
        }
    }
}
