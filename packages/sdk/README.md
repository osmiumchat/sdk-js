# @osmiumchat/sdk

Client SDK for [Osmium](https://osmium.chat).

## Install

```sh
npm install @osmiumchat/sdk
```

## Usage

```ts
import { Client, Events } from "@osmiumchat/sdk";

const client = new Client({ clientId: process.env.CLIENT_ID });

client.on(Events.Ready, (user) => {
    console.log(`Logged in as ${user.name}`);
});

client.on(Events.MessageCreated, async ({ message, author }) => {
    if (author?.bot) return;

    if (message.message === "!ping") {
        const start = Date.now();
        const sent = await message.reply("Pong! 🏓");
        await sent.edit(`Pong! 🏓 (${Date.now() - start}ms)`);
    }
});

client.on(Events.Error, console.error);

client.login(process.env.BOT_TOKEN!);
```

## Events

All events are available on the `Events` enum. The most common ones:

| Event | Payload |
|---|---|
| `Events.Ready` | `User` |
| `Events.MessageCreated` | `UpdateMessageCreated` |
| `Events.MessageUpdated` | `UpdateMessage` |
| `Events.MessageDeleted` | `UpdateMessageDeleted` |
| `Events.Debug` | `string` |

## Prototype extensions

Proto objects received in events are extended with helper methods directly on the prototype.

Examples:
```ts
message.reply("hello")               // Promise<SentMessage>
sent.edit("updated content")         // Promise<RPCResult>
```

Adding your own extensions follows the same pattern — see [src/extensions](./src/extensions/).
