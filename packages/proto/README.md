# @osmiumchat/proto

Generated protobuf types for [Osmium](https://osmium.chat).

You probably want [`@osmiumchat/sdk`](https://www.npmjs.com/package/@osmiumchat/sdk) instead.

## Usage


```ts
import { osmium } from "@osmiumchat/proto";

const msg = osmium.client.messages.SendMessage.create({
    chatRef: { user: { userId: 123n } },
    message: "hello",
});

const bytes = osmium.client.core.ClientMessage.encode(clientMessage).finish();
const decoded = osmium.client.core.ServerMessage.decode(bytes);
```

## Codegen

The types are generated from the `.proto` files in the `proto/` submodule using `@tanglechat/protobufjs-cli`:

```sh
pnpm build
```
