# @osmiumchat/proto

Generated protobuf types for [Osmium](https://osmium.chat).

You probably want [`@osmiumchat/sdk`](https://www.npmjs.com/package/@osmiumchat/sdk) instead.

## Usage

Types currently live under the `tangle` namespace, a migration to `osmium` is expected in the future.

```ts
import { tangle } from "@osmiumchat/proto";

const msg = tangle.client.messages.SendMessage.create({
    chatRef: { user: { userId: 123n } },
    message: "hello",
});

const bytes = tangle.client.core.ClientMessage.encode(clientMessage).finish();
const decoded = tangle.client.core.ServerMessage.decode(bytes);
```

## Codegen

The types are generated from the `.proto` files in the `proto/` submodule using `@tanglechat/protobufjs-cli`:

```sh
pnpm build
```
