# Discord TheraBot for EVE Online
[![](https://img.shields.io/badge/fly_safe-o7-2F849E.svg?style=for-the-badge)](https://www.eveonline.com/)

## General information
TheraBot is a discord bot that posts notifications of newly scouted wormhole connections to Thera.

It uses the [EVE Scout API](https://www.eve-scout.com/).

## Usage
[Add this bot to your Discord server!](https://discordapp.com/oauth2/authorize?client_id=629675303857553408&scope=bot) or alternatively you can [see it working on my dev server](https://discord.gg/uza8mpH).

#### Bot commands
##### !thera info
Show information and commands.

**Syntax**: `!thera info`

##### !thera notify
Show information about the notify command and filtering.

**Syntax**: `!thera notify`

#### Discord permissions
To properly function and perform all commands in a chat channel, TheraBot requires 3 Discord permissions:
* `Read Messages`
  * To read commands given to the bot in a chat channel.
* `Send Messages`
  * To send responses to given commands.
* `Embed Links`
  * To show pretty messages.

## Screenshots
TheraBot in action!

![Image of notification](https://user-images.githubusercontent.com/3472373/66662486-35269700-ec49-11e9-96d5-b01d70412b56.png)

## Feature requests
Please open an [issue](https://github.com/Ionaru/TheraBot/issues/new) if you have any feature ideas for this bot
or are missing any functionality.

Alternatively you can contact me in EVE Online: `Ionaru Otsada`, or on Discord: `Ionaru#3801`.

## Self-hosting
It is possible to self-host this bot, it requires Docker and Docker Compose.

#### Step one: Creating a bot user
1. Go to [https://discordapp.com/developers/applications/me](https://discordapp.com/developers/applications/me).
2. Create a new App, give it a name and picture. The "redirect URL" is not needed. Click "Create App".
3. Click on "Create a Bot User" and confirm.
4. Click the link next to "Token" to reveal your Discord Bot Token, you will need it later.
5. Invite the bot to your server by placing the bot's Client ID in this link: `https://discordapp.com/oauth2/authorize?client_id=PLACE_CLIENT_ID_HERE&scope=bot`
6. Paste the link in your web browser and follow the steps on the Discord website.

#### Step two: Installing the bot
1. Install [Docker](https://docs.docker.com/install/) and [Docker Compose](https://docs.docker.com/compose/install/).
2. [Download](https://github.com/Ionaru/TheraBot/archive/master.zip) and extract, or clone the latest version of this repository.
3. Fill these environment variables (either using a .env file, export them or pass them to docker-compose in the next step):
    - `THERABOT_ID` - The Discord App ID.
    - `THERABOT_KEY` - The Discord App Key.
    - `THERABOT_TOKEN` - The Discord Bot Token.
    - `THERABOT_DATA_VOLUME` - A persistent place where TheraBot will keep its database.
    - (Optional) `DEBUG` - Set to `*` or `thera-bot*` for extra logging output.
4. Run `docker-compose up`. 

Contact me in EVE Online: `Ionaru Otsada` or on Discord: `Ionaru#3801` if you need any assistance.

## Developer information
Want to contribute? Awesome!
Just follow these steps to get started:
1. Fork this repository and clone the fork into a directory of your choice.
2. Follow the Self-hosting steps to get a development version of the bot up and running
3. Make your changes, test them and create a pull request.
