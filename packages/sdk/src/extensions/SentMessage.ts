import { tangle } from "@osmiumchat/proto";
import type { Client } from "../client.js";
import { kClient, kChatRef } from "../symbols.js";

declare module "@osmiumchat/proto" {
    namespace tangle.client.messages {
        interface SentMessage {
            [kClient]: Client;
            [kChatRef]: tangle.client.refs.IChatRef;
            edit(content: string): Promise<tangle.client.core.RPCResult>;
        }
    }
}

(tangle.client.messages.SentMessage.prototype as any).edit = function (
    this: tangle.client.messages.SentMessage,
    content: string,
) {
    const client: Client = (this as any)[kClient];
    const chatRef: tangle.client.refs.IChatRef = (this as any)[kChatRef];
    return client.send(
        tangle.client.messages.EditMessage.create({
            chatRef,
            messageId: this.messageId,
            message: content,
        }),
    );
};
