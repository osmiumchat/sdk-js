import { osmium } from "@osmiumchat/proto";
import type { Client } from "../client.js";
import { kClient, kChatRef } from "../symbols.js";
import { registerInjection } from "../clientInjectable.js";

declare module "@osmiumchat/proto" {
    namespace osmium.client.types {
        interface Message {
            [kClient]: Client;
            reply(content: string, replyTo?: bigint): Promise<osmium.client.messages.SentMessage>;
        }
    }
}

registerInjection('messageCreated', (v) => v.message);
registerInjection('message', (v) => v.message);

(osmium.client.types.Message.prototype as any).reply = async function (
    this: osmium.client.types.Message,
    content: string,
    replyTo?: bigint,
) {
    const client: Client = (this as any)[kClient];
    const res = await client.send(
        osmium.client.messages.SendMessage.create({
            chatRef: this.chatRef,
            message: content,
            ...(replyTo != null && { replyTo }),
        }),
    );
    const sent = res.sentMessage!;
    (sent as any)[kClient] = client;
    (sent as any)[kChatRef] = this.chatRef;
    return sent;
};
