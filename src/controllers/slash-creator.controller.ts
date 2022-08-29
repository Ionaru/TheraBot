import { Client } from 'discord.js';
import { GatewayServer, InteractionHandler, SlashCreator } from 'slash-create';

import { debug } from '../debug';
import { SlashCreatorService } from '../services/slash-creator.service';

export class SlashCreatorController {

    private static readonly debug = debug.extend('SlashCreatorController');

    private readonly creator: SlashCreator;

    public constructor() {
        SlashCreatorController.debug('Start');

        const applicationID = process.env.THERABOT_ID;
        const publicKey = process.env.THERABOT_KEY;
        const token = process.env.THERABOT_TOKEN;

        if (!applicationID || !publicKey || !token) {
            throw new Error('SlashCreator configuration error!');
        }

        SlashCreatorController.debug('Configuration OK');

        this.creator = new SlashCreator({ applicationID, publicKey, token });
        this.creator.on('commandError', (_, e) => {
            throw e;
        });
        this.creator.on('error', (e) => {
            throw e;
        });

        SlashCreatorController.debug('Ready');
    }

    public init(client: Client): SlashCreatorService {
        SlashCreatorController.debug('Init');
        const commandHandler = (handler: InteractionHandler) => client.ws.on('INTERACTION_CREATE' as any, handler);
        this.creator.withServer(new GatewayServer(commandHandler));
        return new SlashCreatorService(this.creator);
    }
}
