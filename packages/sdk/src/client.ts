
import WebSocket from 'ws';
import { AsyncEventEmitter } from '@vladfrangu/async_event_emitter';
import { osmium } from '@osmiumchat/proto';
import { Events } from './events.js';
import { DEVICE_VERSION, VERSION } from './constants.js';
import './extensions/index.js';
import { attachClient } from './clientInjectable.js';

interface ClientEvents {
    [Events.Connected]: [];
    [Events.Disconnected]: [code: number, reason: string];
    [Events.Error]: [error: Error];
    [Events.Initialized]: [initialized: osmium.client.core.Initialized];
    [Events.Ready]: [user: osmium.client.types.User];
    [Events.AuthError]: [error: Error];
    [Events.Debug]: [message: string];

    [Events.RawMessage]: [message: osmium.client.core.ServerMessage];
    [Events.Result]: [result: osmium.client.core.RPCResult];
    [Events.Update]: [update: osmium.client.updates.Update];

    [Events.MessageCreated]: [update: osmium.client.updates.UpdateMessageCreated];        // 1
    [Events.ChannelUpdated]: [update: osmium.client.updates.UpdateChannel];                // 2
    [Events.MessageDeleted]: [update: osmium.client.updates.UpdateMessageDeleted];         // 3
    [Events.UserStatus]: [update: osmium.client.updates.UpdateUserStatus];                 // 4
    [Events.UserUpdated]: [update: osmium.client.updates.UpdateUser];                      // 5
    [Events.CommunityUpdated]: [update: osmium.client.updates.UpdateCommunity];            // 6
    [Events.ChannelDeleted]: [update: osmium.client.updates.UpdateChannelDeleted];         // 7
    [Events.MessageUpdated]: [update: osmium.client.updates.UpdateMessage];                // 8
    [Events.ChatTyping]: [update: osmium.client.updates.UpdateChatTyping];                 // 9
    [Events.CommunityMember]: [update: osmium.client.updates.UpdateCommunityMember];       // 10
    [Events.CommunityDeleted]: [update: osmium.client.updates.UpdateCommunityDeleted];     // 11
    [Events.ConversationPermissions]: [update: osmium.client.updates.UpdateConversationPermissions]; // 12
    [Events.ChatUpdated]: [update: osmium.client.updates.UpdateChat];                      // 13
    [Events.SessionDeleted]: [update: osmium.client.updates.UpdateSessionDeleted];         // 14
    [Events.CommunityUnavailable]: [update: osmium.client.updates.UpdateCommunityUnavailable]; // 15
    [Events.MemberList]: [update: osmium.client.updates.UpdateMemberList];                 // 16
    [Events.CommunityMemberDeleted]: [update: osmium.client.updates.UpdateCommunityMemberDeleted]; // 17
    [Events.UserRelationship]: [update: osmium.client.updates.UpdateUserRelationship];     // 18
    [Events.UserRelationshipDeleted]: [update: osmium.client.updates.UpdateUserRelationshipDeleted]; // 19
    [Events.GroupUpdated]: [update: osmium.client.updates.UpdateGroup];                    // 20
    [Events.RoomState]: [update: osmium.client.voice.UpdateRoomState];                     // 21
    [Events.RoomParticipant]: [update: osmium.client.voice.UpdateRoomParticipant];         // 22
    [Events.MessageReactions]: [update: osmium.client.updates.UpdateMessageReactions];     // 23
    [Events.ConversationLastRead]: [update: osmium.client.updates.UpdateConversationLastRead]; // 24
    [Events.CommunityMemberCreated]: [update: osmium.client.updates.UpdateCommunityMemberCreated]; // 25
}

export type ClientOptions = {
    clientId: number;
    serverUrl?: string;
    reconnectInterval?: number;
    heartbeatInterval?: number;
    appVersion?: string;
    deviceType?: string;
    deviceVersion?: string;
};

type ResolvedOptions = Required<ClientOptions>;

type Message = Exclude<osmium.client.core.ClientMessage[keyof osmium.client.core.ClientMessage], string | null | undefined | number | (() => {
    [k: string]: any;
})>;

// Derive the union of oneof field names from the protobuf interface.
// If a new variant is added to Update, TypeScript will require it to be added below too.
type UpdateKey = Exclude<{
    [K in keyof osmium.client.updates.IUpdate]:
        NonNullable<osmium.client.updates.IUpdate[K]> extends object ? K : never
}[keyof osmium.client.updates.IUpdate], undefined>;

const UPDATE_MAP = {
    messageCreated:                Events.MessageCreated,           // 1
    channel:                       Events.ChannelUpdated,           // 2
    messageDeleted:                Events.MessageDeleted,           // 3
    userStatus:                    Events.UserStatus,               // 4
    user:                          Events.UserUpdated,              // 5
    community:                     Events.CommunityUpdated,         // 6
    channelDeleted:                Events.ChannelDeleted,           // 7
    message:                       Events.MessageUpdated,           // 8
    chatTyping:                    Events.ChatTyping,               // 9
    communityMember:               Events.CommunityMember,         // 10
    communityDeleted:              Events.CommunityDeleted,         // 11
    conversationPermissions:       Events.ConversationPermissions,  // 12
    chat:                          Events.ChatUpdated,              // 13
    sessionDeleted:                Events.SessionDeleted,           // 14
    communityUnavailable:          Events.CommunityUnavailable,     // 15
    memberList:                    Events.MemberList,               // 16
    communityMemberDeleted:        Events.CommunityMemberDeleted,   // 17
    updateUserRelationship:        Events.UserRelationship,         // 18
    updateUserRelationshipDeleted: Events.UserRelationshipDeleted,  // 19
    group:                         Events.GroupUpdated,             // 20
    roomState:                     Events.RoomState,                // 21
    roomParticipant:               Events.RoomParticipant,          // 22
    messageReactions:              Events.MessageReactions,         // 23
    conversationLastRead:          Events.ConversationLastRead,     // 24
    communityMemberCreated:        Events.CommunityMemberCreated,   // 25
} satisfies Record<UpdateKey, Events>;

export class Client extends AsyncEventEmitter<ClientEvents> {
    options: ResolvedOptions;

    private token: string | null;
    ws: WebSocket | null;
    authenticated: boolean;
    private destroyed: boolean;
    private reconnectTimer: ReturnType<typeof setTimeout> | null;
    private heartbeatTimer: ReturnType<typeof setInterval> | null;
    private requestId: number;
    private pendingRequests: Map<number, { resolve: (value: osmium.client.core.RPCResult) => void; reject: (error: osmium.client.core.RPCError) => void; timeoutId?: ReturnType<typeof setTimeout> }>;

    user: osmium.client.types.User | null;

    constructor(options: ClientOptions) {
        super();

        this.options = {
            serverUrl: options.serverUrl ?? 'wss://ws-0.osmium.chat',
            reconnectInterval: options.reconnectInterval ?? 5000,
            heartbeatInterval: options.heartbeatInterval ?? 30000,
            appVersion: options.appVersion ?? VERSION,
            deviceType: options.deviceType ?? '@osmiumchat/sdk',
            deviceVersion: options.deviceVersion ?? DEVICE_VERSION,
            clientId: options.clientId,
        };

        this.token = null;
        this.ws = null;
        this.authenticated = false;
        this.destroyed = false;
        this.reconnectTimer = null;
        this.heartbeatTimer = null;
        this.requestId = 1;
        this.pendingRequests = new Map();

        this.user = null;
    }

    async login(token: string): Promise<string> {
        this.token = token;
        await this.connect();
        return token;
    }

    private async connect() {
        try {
            this.emit(Events.Debug, `Connecting to ${this.options.serverUrl}...`);

            this.ws = new WebSocket(this.options.serverUrl);
            this.ws.binaryType = 'arraybuffer';

            this.ws.on('open', () => {
                this.emit(Events.Debug, `Connected to ${this.options.serverUrl}`);
                this.emit(Events.Connected);
                this.initialize().catch((error: unknown) => {
                    const err = error instanceof Error ? error : new Error(String(error));
                    this.emit(Events.Debug, `Initialization failed: ${err.message}`);
                    this.emit(Events.Error, err);
                });
            });

            this.ws.on('message', (data: WebSocket.RawData) => {
                const buf = data instanceof ArrayBuffer ? data : data instanceof Buffer ? data : Buffer.concat(data as Buffer[]);
                this.handleMessage(new Uint8Array(buf as ArrayBuffer));
            });

            this.ws.on('close', (code: number, reason: Buffer) => {
                const reasonStr = reason.toString();
                this.emit(Events.Debug, `Connection closed: ${code} (${reasonStr})`);
                this.authenticated = false;
                this.emit(Events.Disconnected, code, reasonStr);
                if (!this.destroyed) this.scheduleReconnect();
            });

            this.ws.on('error', (error: Error) => {
                this.emit(Events.Debug, `WebSocket error: ${error.message}`);
                this.emit(Events.Error, error);
            });

        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emit(Events.Debug, `Failed to connect: ${err.message}`);
            this.emit(Events.Error, err);
        }
    }

    async send(message: Message) {
        const reqId = this.getRequestId();
        const path = (message.constructor as any).getTypeUrl('').substring(1).split('.');
        const name = path.pop();
        const namespace = path.pop();
        const packetName = namespace.charAt(0).toLowerCase() + namespace.slice(1) + name;
        const obj = this.makeClientMessage(reqId, packetName, message);

        const encoded = osmium.client.core.ClientMessage.encode(obj).finish();
        const buf = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.length);

        let resolve: (value: osmium.client.core.RPCResult) => void = () => { }, reject: (error: osmium.client.core.RPCError) => void = () => { };
        const promise = new Promise<osmium.client.core.RPCResult>((res, rej) => {
            resolve = res;
            reject = rej;
        });

        this.pendingRequests.set(reqId, { resolve, reject });
        this.emit(Events.Debug, `~> ${(message.constructor as any).name} reqId=${reqId}`);

        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.pendingRequests.delete(reqId);
            reject(new Error('WebSocket is not connected') as unknown as osmium.client.core.RPCError);
            return promise;
        }

        this.ws.send(buf);

        return promise;
    }

    makeClientMessage(reqId: number, packetName: string, packet: any): any {
        const obj = osmium.client.core.ClientMessage.create({ id: reqId, [packetName]: packet });
        return obj;
    }

    async initialize() {
        const message = osmium.client.core.Initialize.create({
            clientId: this.options.clientId,
            appVersion: this.options.appVersion,
            deviceType: this.options.deviceType,
            deviceVersion: this.options.deviceVersion,
        });

        this.emit(Events.Debug, `Initializing (clientId=${this.options.clientId}, appVersion=${this.options.appVersion})`);
        const res = await this.send(message);
        if (res.initialized) {
            this.emit(Events.Debug, 'Server acknowledged initialization');
            this.handleInitialized(res.initialized);
        } else {
            throw new Error('Failed to initialize client');
        }
    }

    async authenticate(): Promise<osmium.client.auth.Authorization> {
        if (!this.token) {
            throw new Error('Bot token is required for authentication');
        }

        const message = osmium.client.auth.Authorize.create({
            token: this.token,
        });

        this.emit(Events.Debug, 'Authenticating...');
        const res = await this.send(message);
        if (res.authorization) {
            return res.authorization;
        } else {
            throw new Error('Received invalid authorization response');;
        }
    }

    handleMessage(data: Uint8Array): void {
        try {
            const serverMessage = osmium.client.core.ServerMessage.decode(data);
            this.emit(Events.RawMessage, serverMessage);

            if (serverMessage.result) {
                const result = serverMessage.result;
                if (result.reqId && this.pendingRequests.has(result.reqId)) {
                    const request = this.pendingRequests.get(result.reqId);
                    if (request) {
                        if (request.timeoutId) clearTimeout(request.timeoutId);
                        this.pendingRequests.delete(result.reqId);
                        if (result.error) {
                            this.emit(Events.Debug, `<~ error reqId=${result.reqId} code=${result.error.errorCode}: ${result.error.errorMessage}`);
                            request.reject(result.error);
                        } else {
                            this.emit(Events.Debug, `<~ result reqId=${result.reqId}`);
                            request.resolve(result);
                        }
                        return;
                    }
                }
                this.emit(Events.Debug, `<~ unsolicited result reqId=${result.reqId}`);
                this.emit(Events.Result, result);
            } else if (serverMessage.update) {
                const u = serverMessage.update;
                this.emit(Events.Update, u);

                const key = u.update as UpdateKey | null;
                if (key != null) {
                    this.emit(Events.Debug, `<~ update ${key}`);
                    const event = UPDATE_MAP[key];
                    const value = u[key];
                    attachClient(key, value, this);
                    (this.emit as (event: Events, value: unknown) => void)(event, value);
                }
            }
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.emit(Events.Debug, `Error handling message: ${err.message}`);
            this.emit(Events.Error, err);
        }
    }

    handleAuthenticated(signedIn: osmium.client.auth.Authorization): void {
        this.authenticated = true;
        this.user = signedIn.user;
        this.emit(Events.Debug, `Authenticated as ${this.user?.name} (id=${this.user?.id})`);
        this.emit(Events.Ready, this.user);
        this.startHeartbeat();
    }

    handleInitialized(initialized: osmium.client.core.Initialized): void {
        this.emit(Events.Initialized, initialized);

        if (!this.token) {
            this.emit(Events.AuthError, new Error('No token provided, call login() with a token before connecting'));
            return;
        }

        this.authenticate().then((res) => {
                this.handleAuthenticated(res);
            }).catch(error => {
                this.emit(Events.AuthError, error);
            });
    }

    startHeartbeat(): void {
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                // periodically send a useless message to keep the socket open
                const uselessPacket = osmium.client.core.ClientMessage.create({ id: 1 });
                const encoded = osmium.client.core.ClientMessage.encode(uselessPacket).finish();
                const buffer = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.length);
                this.ws?.send(buffer);
            }
        }, this.options.heartbeatInterval);
    }

    scheduleReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        this.emit(Events.Debug, `Reconnecting in ${this.options.reconnectInterval}ms...`);
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, this.options.reconnectInterval);
    }

    getRequestId(): number {
        let reqId = Date.now() >>> 0;
        if (this.requestId >= reqId) {
            reqId = this.requestId + 1;
        }
        this.requestId = reqId;
        return reqId;
    }

    disconnect(): void {
        this.emit(Events.Debug, 'Disconnecting...');
        this.destroyed = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }

        if (this.ws) {
            this.ws.close();
        }

        this.emit(Events.Disconnected, 0, 'Client disconnected');
    }
}

