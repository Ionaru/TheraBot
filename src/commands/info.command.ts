import { Command } from './command';

export class InfoCommand extends Command {

    public static readonly commands = [
        'info', 'i', 'about', 'help',
    ];

    public static readonly debug = Command.debug.extend('info');

    public static test(command: string) {
        InfoCommand.debug(`Testing ${command} (${InfoCommand.commandRegex})`);
        return InfoCommand.commandRegex.test(command);
    }

    private static readonly commandRegex = Command.createCommandRegex(InfoCommand.commands, true);
    protected initialReply = undefined;

    protected async isCommandValid(): Promise<boolean> {
        return true;
    }

    protected async processCommand(): Promise<void> {
        this.embed.addField('**Info**', [
            'TheraBot is a discord bot that posts notifications of newly scouted wormhole connections to Thera.',
        ]);

        this.embed.addField('**Commands**', [
            '- **info** - Show this info page.',
            '- **notify here** - Notify about new wormholes in this channel.',
            '- **notify stop** - Stop notifying about new wormholes in this channel.',
        ]);

        this.embed.addField('**Examples**', [
            '- !thera info',
            '- !thera notify here',
            '- !thera notify stop',
        ]);

        this.embed.addField('**Disclaimer**', `EVE Online and the EVE logo are the registered trademarks of CCP hf. All rights are reserved worldwide. All other trademarks are the property of their respective owners. EVE Online, the EVE logo, EVE and all associated logos and designs are the intellectual property of CCP hf. All artwork, screenshots, characters, vehicles, storylines, world facts or other recognizable features of the intellectual property relating to these trademarks are likewise the intellectual property of CCP hf.`);
    }
}
