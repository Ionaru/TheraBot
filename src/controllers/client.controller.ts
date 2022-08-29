import { Client, IntentsBitField } from 'discord.js';

import { debug } from '../debug';

export class ClientController {

    public readonly client: Client;

    private readonly debug = debug.extend('client');

    public constructor() {
        this.client = new Client({intents: [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildMessages,
            IntentsBitField.Flags.GuildMessageReactions,
            IntentsBitField.Flags.DirectMessages,
            IntentsBitField.Flags.DirectMessageReactions,
        ], partials: [1]});
        this.debug('Client created');
    }

    public async activate() {

        this.debug('Activating client');

        this.client.on('ready', () => this.onReady());
        this.client.on('warn', (warning: string) => process.emitWarning(warning));
        this.client.on('presenceUpdate', () => this.setPresence());

        return this.client.login(process.env.THERABOT_TOKEN);
    }

    public deactivate() {
        this.debug('Destroying client');
        this.client?.destroy();
    }

    private onReady() {
        this.setPresence();
        this.debug('Logged in');
    }

    private setPresence() {
        this.client?.user?.setActivity('/info', {type: 3});
    }
}
