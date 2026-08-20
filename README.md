# Discord TheraBot for EVE Online
[![](https://img.shields.io/badge/fly_safe-o7-2F849E.svg?style=for-the-badge)](https://www.eveonline.com/)

## General information
TheraBot is a Discord bot that posts notifications of newly scouted wormhole connections to Thera.

It polls the [EVE Scout](https://www.eve-scout.com/) public signature API every 5 minutes and posts an
embed for each new connection, optionally filtered per channel.

## Usage
[Add this bot to your Discord server!](https://discord.com/oauth2/authorize?client_id=629675303857553408&scope=bot+applications.commands&permissions=19456)
or alternatively you can [see it working on my dev server](https://discord.gg/uza8mpH).

### Bot commands
TheraBot uses Discord slash commands. They are registered globally, so after adding the bot to a new
server it can take up to an hour before they show up in the command list for the first time.

#### `/info`
Show information about the bot and its commands.

#### `/notify`
Manage wormhole notifications for the current channel.

| Subcommand | Description |
| --- | --- |
| `/notify info` | Show the notification settings and active filters for this channel. |
| `/notify here` | Start notifying about new wormholes in this channel. |
| `/notify when <filter>` | Add a notification filter. |
| `/notify undo <filter>` | Remove a notification filter. |
| `/notify stop` | Stop notifying about new wormholes in this channel. |
| `/notify help` | Show information about notification settings and filtering. |

#### Filters
Without filters, a channel receives every new Thera connection. Adding filters narrows that down to
only the connections that match. A `filter` value can be:

* A **security status**, from `-1.0` to `1.0` in steps of `0.1`.
* A **security class**: `highsec`, `lowsec`, `nullsec` or `wspace`.
* A **region**, **constellation** or **solar system** name.

Pass several at once by separating them with commas, for example `/notify when highsec, Providence, 0.5`.

### Discord permissions
TheraBot needs three permissions in the channels it posts to:

* `View Channel`
  * To see the channel it was told to notify in.
* `Send Messages`
  * To post notifications.
* `Embed Links`
  * To show pretty messages.

`Manage Messages` is optional. It lets the bot automatically publish notifications posted in an
announcement channel to servers that follow it; without it, notifications are still posted normally.

TheraBot uses no privileged gateway intents, so `Presence`, `Server Members` and `Message Content`
can all stay switched off.

## Screenshots
TheraBot in action!

![Image of notification](https://user-images.githubusercontent.com/3472373/66662486-35269700-ec49-11e9-96d5-b01d70412b56.png)

## Feature requests
Please open an [issue](https://github.com/Ionaru/TheraBot/issues/new) if you have any feature ideas for this bot
or are missing any functionality.

Alternatively you can contact me in EVE Online: `Ionaru Otsada`, or on Discord: `@ionaru`.

## Self-hosting
It is possible to self-host this bot. It requires Docker with the Compose v2 plugin.

### Step one: Creating a bot user
1. Go to [https://discord.com/developers/applications](https://discord.com/developers/applications) and create a new application.
2. On **General Information**, copy the **Application ID** (`THERABOT_ID`) and the **Public Key** (`THERABOT_KEY`).
3. Go to **Bot**, then **Reset Token**, and copy the token (`THERABOT_TOKEN`). Discord only shows it once.
4. Leave every **Privileged Gateway Intent** switched off, TheraBot does not use any.
5. Under **OAuth2 > URL Generator**, select the `bot` and `applications.commands` scopes, and the
   `View Channel`, `Send Messages` and `Embed Links` bot permissions.
6. Open the generated URL in your browser and add the bot to your server.

### Step two: Installing the bot
1. Install [Docker Engine](https://docs.docker.com/engine/install/), which includes the Compose v2 plugin.
2. Clone this repository, or [download](https://github.com/Ionaru/TheraBot/archive/master.zip) and extract it.
3. Create a `.env` file in the root of the checkout:

   ```dotenv
   THERABOT_ID=your_application_id
   THERABOT_KEY=your_public_key
   THERABOT_TOKEN=your_bot_token

   # Optional, see the table below.
   THERABOT_DATA_VOLUME=/absolute/path/to/your/data
   ```

4. Start the bot:

   ```bash
   docker compose --project-name therabot --env-file "$PWD/.env" --file deploy/compose.yaml up -d
   ```

   The `--env-file` flag is not optional. The Compose file lives in `deploy/`, so Compose looks for a
   `.env` next to it and will **not** find the one in the root of the checkout. Without the flag the
   bot starts with no credentials and writes its database somewhere you did not intend.

5. Check that it came up:

   ```bash
   docker compose --project-name therabot --env-file "$PWD/.env" --file deploy/compose.yaml logs -f
   ```

Run `docker compose ... config` instead of `up` at any point to print the fully resolved
configuration. That is the quickest way to confirm your credentials, image tag and data directory
are what you expect.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `THERABOT_ID` | Yes | The Discord application ID. |
| `THERABOT_KEY` | Yes | The Discord application public key. |
| `THERABOT_TOKEN` | Yes | The Discord bot token. |
| `THERABOT_DATA_VOLUME` | No | Where TheraBot keeps its data. Defaults to a Docker named volume. |
| `THERABOT_GIT_REVISION` | No | Image tag to run. Defaults to `latest`. |
| `DEBUG` | No | Set to `thera-bot*` or `*` for extra logging output. |

The bot stores a SQLite database (`therabot.db`) and an ESI cache (`cache.json`) in `/app/data`
inside the container. `THERABOT_DATA_VOLUME` must be either left unset, which uses the named volume
declared in the Compose file, or set to an **absolute** host path. A relative path such as `./data`
resolves against `deploy/`, not the root of the checkout.

### A note on architecture
The prebuilt `ghcr.io/ionaru/therabot` images are `linux/amd64` only. On other architectures the pull
fails with a manifest error, and you will need to build the image locally instead:

```bash
docker compose --project-name therabot --env-file "$PWD/.env" --file deploy/compose.yaml up -d --build
```

Contact me in EVE Online: `Ionaru Otsada` or on Discord: `@ionaru` if you need any assistance.

## Developer information
Want to contribute? Awesome! See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

TheraBot is written in TypeScript and requires **Node.js 24 or newer**, because it uses the built-in
`node:sqlite` module.

```bash
npm ci        # Install dependencies
npm run build # Compile TypeScript to dist/
npm test      # Lint and run the unit tests
npm start     # Run the compiled bot
```

Running the bot outside Docker still needs the environment variables above. A `.env` file in the root
of the checkout is picked up automatically in that case.
