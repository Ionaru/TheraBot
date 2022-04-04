import { Message, MessageEmbed } from 'discord.js';
import * as escapeStringRegexp from 'escape-string-regexp';

import { debug } from '../debug';

export abstract class Command {

    public static readonly commandPrefix = '!thera ';

    protected static readonly debug = debug.extend('command');

    protected readonly message: Message;
    protected readonly embed = new MessageEmbed();

    private replyPlaceHolder?: Message;

    protected abstract readonly initialReply?: string;

    public constructor(message: Message) {
        this.message = message;
    }

    public static test(message: string) {
        Command.debug(`Testing ${message}`);
        return message.startsWith(Command.commandPrefix);
    }

    protected static createCommandRegex(commands: string[], rootCommand = false): RegExp {
        const beginning = rootCommand ? '^' : '';

        return new RegExp(`${beginning}(${commands.map((element) =>
            escapeStringRegexp(Command.commandPrefix) + element + '\\b').join('|')})`, 'i'
        );
    }

    public async execute() {
        await this.sendInitialReply();

        if (!this.embed) {
            throw new Error('Embed creation failed.');
        }

        if (await this.isCommandValid()) {
            await this.processCommand();
        }

        await this.sendReply();
    }

    protected async sendReply() {

        if (this.replyPlaceHolder) {
            Command.debug(`Editing initial reply`);
            return this.replyPlaceHolder.edit({embeds: [this.embed]});
        }

        Command.debug(`Sending reply`);
        return this.message.reply({embeds: [this.embed]});
    }

    protected async sendInitialReply() {
        if (this.initialReply) {
            Command.debug(`Sending initial reply`);

            let reply: Message | Message[] | undefined = await this.message.reply(this.initialReply);

            if (Array.isArray(reply)) {
                reply = reply.length ? reply[0] : undefined;
            }

            this.replyPlaceHolder = reply as Message | undefined;
        }
    }

    protected abstract isCommandValid(): Promise<boolean>;
    protected abstract processCommand(): Promise<void>;
}
