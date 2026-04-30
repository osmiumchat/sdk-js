# sdk-js

JavaScript/TypeScript SDK for [Osmium](https://osmium.chat).

## Packages

| Package | Description |
|---|---|
| [`@osmiumchat/sdk`](./packages/sdk) | WebSocket client |
| [`@osmiumchat/proto`](./packages/proto) | Generated protobuf types |

## Install

```sh
npm install @osmiumchat/sdk
```

## Getting started

```ts
import { Client, Events } from "@osmiumchat/sdk";

const client = new Client({ clientId: Number(process.env.CLIENT_ID) });

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

For the full API see [`@osmiumchat/sdk`](./packages/sdk).


## Contributing

Requires Node 20+ and pnpm.

```sh
pnpm install
pnpm build
```
