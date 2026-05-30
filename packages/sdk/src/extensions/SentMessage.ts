import { osmium } from "@osmiumchat/proto";
import type { Client } from "../client.js";
import { kClient, kChatRef } from "../symbols.js";

declare module "@osmiumchat/proto" {
    namespace osmium.client.messages {
        interface SentMessage {
            [kClient]: Client;
            [kChatRef]: osmium.client.refs.IChatRef;
            edit(content: string): Promise<osmium.client.core.RPCResult>;
        }
    }
}

(osmium.client.messages.SentMessage.prototype as any).edit = function (
    this: osmium.client.messages.SentMessage,
    content: string,
) {
    const client: Client = (this as any)[kClient];
    const chatRef: osmium.client.refs.IChatRef = (this as any)[kChatRef];
    return client.send(
        osmium.client.messages.EditMessage.create({
            chatRef,
            messageId: this.messageId,
            message: content,
        }),
    );
};
