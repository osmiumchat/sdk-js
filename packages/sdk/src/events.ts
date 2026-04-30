export enum Events {
    // Lifecycle
    Connected = "connected",
    Disconnected = "disconnected",
    Error = "error",
    Debug = "debug",
    Initialized = "initialized",
    Ready = "ready",
    AuthError = "authError",

    // Raw wire events
    RawMessage = "message",
    Result = "result",
    Update = "update",

    // Update events
    MessageCreated = "messageCreated",           // 1
    ChannelUpdated = "channelUpdated",           // 2
    MessageDeleted = "messageDeleted",           // 3
    UserStatus = "userStatus",                   // 4
    UserUpdated = "userUpdated",                 // 5
    CommunityUpdated = "communityUpdated",       // 6
    ChannelDeleted = "channelDeleted",           // 7
    MessageUpdated = "messageUpdated",           // 8
    ChatTyping = "chatTyping",                   // 9
    CommunityMember = "communityMember",         // 10
    CommunityDeleted = "communityDeleted",       // 11
    ConversationPermissions = "conversationPermissions", // 12
    ChatUpdated = "chatUpdated",                 // 13
    SessionDeleted = "sessionDeleted",           // 14
    CommunityUnavailable = "communityUnavailable", // 15
    MemberList = "memberList",                   // 16
    CommunityMemberDeleted = "communityMemberDeleted", // 17
    UserRelationship = "userRelationship",       // 18
    UserRelationshipDeleted = "userRelationshipDeleted", // 19
    GroupUpdated = "groupUpdated",               // 20
    RoomState = "roomState",                     // 21
    RoomParticipant = "roomParticipant",         // 22
    MessageReactions = "messageReactions",       // 23
    ConversationLastRead = "conversationLastRead", // 24
    CommunityMemberCreated = "communityMemberCreated", // 25
}
