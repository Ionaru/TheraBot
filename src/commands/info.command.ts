import { EmbedBuilder } from 'discord.js';
import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';

export class InfoCommand extends SlashCommand {

    public constructor(creator: SlashCreator) {
        super(creator, {
            description: 'Show information about the bot.',
            name: 'info',
        });
    }

    public override async onError(_: Error, context: CommandContext) {
        await context.send('Something went wrong. Try again later.');
    }

    public override async run(context: CommandContext): Promise<void> {

        const embed = new EmbedBuilder().addFields([
            {
                name: '**Info**',
                value: 'TheraBot is a discord bot that posts notifications of newly scouted wormhole connections to Thera.',
            },
            {
                name: '**Commands**',
                value: [
                    '- **/info** - Show this info page.',
                    '- **/notify** - Show information about the notify command and filtering.',
                ].join('\n'),
            },
            {
                name: '**Examples**',
                value: [
                    '- /info',
                    '- /notify',
                ].join('\n'),
            },
            {
                name: '**Code, issues and feature requests**',
                // eslint-disable-next-line max-len
                value: 'The code for this bot is hosted on GitHub, please report issues and feature requests there: <https://github.com/Ionaru/TheraBot>',
            },
            {
                name: '**Disclaimer**',
                // eslint-disable-next-line max-len
                value: 'EVE Online and the EVE logo are the registered trademarks of CCP hf. All rights are reserved worldwide. All other trademarks are the property of their respective owners. EVE Online, the EVE logo, EVE and all associated logos and designs are the intellectual property of CCP hf. All artwork, screenshots, characters, vehicles, storylines, world facts or other recognizable features of the intellectual property relating to these trademarks are likewise the intellectual property of CCP hf.',
            },

        ]);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await context.send({ embeds: [embed] });
    }
}
