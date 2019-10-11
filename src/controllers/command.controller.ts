import { Message } from 'discord.js';

import { Command } from '../commands/command';
import { InfoCommand } from '../commands/info.command';
import { NotifyCommand } from '../commands/notify.command';
import { debug } from '../main';

export class CommandController {

    private debug = debug.extend('controller');

    public runCommand(message: Message) {
        if (!Command.test(message.content)) {
            return;
        }

        this.debug(message.content);

        switch (true) {
            case InfoCommand.test(message.content):
                new InfoCommand(message).execute().then();
                break;
            case NotifyCommand.test(message.content):
                new NotifyCommand(message).execute().then();
                break;
        }
    }
}
