// Symbol used to attach the Client instance to received proto objects.
export const kClient = Symbol("client");

// Symbol used to carry a ChatRef forward onto RPC response objects that need it for follow-up calls.
export const kChatRef = Symbol("chatRef");
