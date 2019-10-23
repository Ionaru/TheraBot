import { CacheController, PublicESIService } from '@ionaru/esi-service';
import { HttpsAgent } from 'agentkeepalive';
import axios, { AxiosInstance } from 'axios';
import Debug from 'debug';
import 'reflect-metadata'; // Required for TypeORM

export const debug = Debug('thera-bot');
export let axiosInstance: AxiosInstance;
export let publicESIService: PublicESIService;

import { ClientController } from './controllers/client.controller';
import { CommandController } from './controllers/command.controller';
import { DatabaseController } from './controllers/database.controller';
import { WatchController } from './controllers/watch.controller';

async function start() {

    debug('Hello!');

    debug(`NodeJS version ${process.version}`);

    debug('Creating axios instance');
    axiosInstance = axios.create({
        // 60 sec timeout
        timeout: 60000,

        // keepAlive pools and reuses TCP connections, so it's faster
        httpsAgent: new HttpsAgent(),

        // Follow up to 10 HTTP 3xx redirects
        maxRedirects: 10,

        // Cap the maximum content length we'll accept to 50MBs, just in case
        maxContentLength: 50000000,
    });

    const cacheController = new CacheController('data/cache.json');
    publicESIService = new PublicESIService({
        axiosInstance,
        cacheController,
    });

    await new DatabaseController().connect();

    const commandController = new CommandController();
    const clientController = new ClientController(commandController);
    await clientController.activate();

    const watchController = new WatchController(clientController.client, axiosInstance, publicESIService);
    await watchController.startWatchCycle();

    process.stdin.resume();
    process.on('unhandledRejection', (reason, p): void => {
        process.stderr.write(`Unhandled Rejection at: \nPromise ${p} \nReason: ${reason}\n`);
    });
    process.on('uncaughtException', (error) => {
        process.stderr.write(`Uncaught Exception! \n${error}\n`);
        Promise.all(deactivate(clientController, cacheController)).catch(exit).then(exit);
    });
    process.on('SIGINT', () => {
        debug('SIGINT received.');
        Promise.all(deactivate(clientController, cacheController)).catch(exit).then(exit);
    });
    process.on('SIGTERM', () => {
        debug('SIGTERM received.');
        Promise.all(deactivate(clientController, cacheController)).catch(exit).then(exit);
    });
}

function deactivate(clientController: ClientController, cacheController: CacheController) {
    cacheController.dumpCache();
    return [
        clientController.deactivate(),
    ];
}

function exit() {
    debug('Bye bye');
    process.exit(0);
}

// Prevent file from running when importing from it.
if (require.main === module) {
    start().then();
}
