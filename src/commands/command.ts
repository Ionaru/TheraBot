import { Message, MessageOptions, RichEmbed } from 'discord.js';
import * as escapeStringRegexp from 'escape-string-regexp';

import { debug } from '../main';

export abstract class Command {

    public static readonly commandPrefix = '!thera ';

    public static test(message: string) {
        Command.debug(`Testing ${message}`);
        return message.startsWith(Command.commandPrefix);
    }

    protected static readonly debug = debug.extend('command');

    protected static createCommandRegex(commands: string[], rootCommand = false): RegExp {
        const beginning = rootCommand ? '^' : '';

        return new RegExp(`${beginning}(${commands.map((element) => {
            return escapeStringRegexp(Command.commandPrefix) + element + '\\b';
        }).join('|')})`, 'i');
    }

    protected readonly message: Message;
    protected readonly reply: {text?: string, options?: MessageOptions} = {};
    protected readonly embed = new RichEmbed();

    protected abstract readonly initialReply?: string;

    private replyPlaceHolder?: Message;

    constructor(message: Message) {
        this.message = message;
    }

    public async execute() {
        await this.sendInitialReply();

        if (!this.embed) {
            throw new Error('Embed creation failed.');
        }

        this.reply.options = {embed: this.embed};

        if (await this.isCommandValid()) {
            await this.processCommand();
        }

        await this.sendReply();
    }

    protected async sendReply() {

        const reply = this.reply.text || '';
        const options = this.reply.options || {};

        if (this.replyPlaceHolder) {
            Command.debug(`Editing initial reply`);
            return this.replyPlaceHolder.edit(reply, options);
        }

        Command.debug(`Sending reply`);
        return this.message.reply(reply, options);
    }

    protected abstract async isCommandValid(): Promise<boolean>;
    protected abstract async processCommand(): Promise<void>;

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
}
