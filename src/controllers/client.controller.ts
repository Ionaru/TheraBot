import { Client, Message } from 'discord.js';

import { debug } from '../debug';

import { CommandController } from './command.controller';

export class ClientController {

    public readonly client: Client;

    private readonly debug = debug.extend('client');
    private readonly commandController: CommandController;

    public constructor(commandController: CommandController) {
        this.commandController = commandController;
        this.client = new Client();
        this.debug('Client created');
    }

    public async activate() {

        this.debug('Activating client');

        this.client.on('ready', () => this.onReady());
        this.client.on('presenceUpdate', () => this.setPresence());
        this.client.on('message', (message) => this.onMessage(message));

        return this.client.login(process.env.THERABOT_TOKEN);
    }

    public deactivate() {
        this.debug('Destroying client');
        this.client?.destroy();
    }

    private onMessage(message: Message) {
        this.commandController.runCommand(message);
    }

    private onReady() {
        this.setPresence();
        this.debug('Logged in');
    }

    private setPresence() {
        this.client?.user?.setActivity('!thera info', {type: 'WATCHING'}).then();
    }
}
