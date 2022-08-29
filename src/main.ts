import { format } from 'util';

import { CacheController } from '@ionaru/esi-service';
import { config } from 'dotenv';
import 'reflect-metadata'; // Required for TypeORM

config();

import { InfoCommand } from './commands/info.command';
import { NotifyCommand } from './commands/notify.command';
import { ClientController } from './controllers/client.controller';
import { DatabaseController } from './controllers/database.controller';
import { SlashCreatorController } from './controllers/slash-creator.controller';
import { WatchController } from './controllers/watch.controller';
import { debug } from './debug';
import { getAxiosInstance } from './utils/axios-instance.util';
import { getCacheController } from './utils/cache-controller.util';
import { getPublicESIService } from './utils/public-esi-service.util';

const start = async () => {

    debug('Hello!');

    debug(`NodeJS version ${process.version}`);

    await new DatabaseController().connect();

    const clientController = new ClientController();
    await clientController.activate();

    const slashCreatorController = new SlashCreatorController();
    const slashCreatorService = slashCreatorController.init(clientController.client);

    slashCreatorService.registerCommand((slashCreator) => new InfoCommand(slashCreator));
    slashCreatorService.registerCommand((slashCreator) => new NotifyCommand(slashCreator));

    await slashCreatorService.syncCommands();

    const watchController = new WatchController(
        clientController.client, getAxiosInstance(), getPublicESIService(),
    );
    await watchController.startWatchCycle();

    process.stdin.resume();
    process.on('unhandledRejection', (reason, p): void => {
        process.stderr.write(`Unhandled Rejection at: \nPromise ${p} \nReason: ${reason}\n`);
    });
    process.on('uncaughtException', (error) => {
        process.stderr.write(`Uncaught Exception! \n${error}\n`);
        deactivate(clientController, getCacheController());
    });
    process.on('SIGINT', () => {
        debug('SIGINT received.');
        deactivate(clientController, getCacheController());
    });
    process.on('SIGTERM', () => {
        debug('SIGTERM received.');
        deactivate(clientController, getCacheController());
    });
};

const deactivate = (clientController: ClientController, cacheController: CacheController) => {
    cacheController.dumpCache();
    clientController.deactivate();
    exit();
};

const exit = () => {
    debug('Bye bye');
    process.exit(0);
};

start().catch((error) => {
    process.stderr.write(`${format(error)}\n`);
    process.exit(1);
});
