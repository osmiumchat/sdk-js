import { Client, Events } from "@osmiumchat/sdk";

const client = new Client({
    clientId: Number(process.env.CLIENT_ID!),
});

client.on(Events.Debug, console.debug);

client.on(Events.Ready, (user) => {
    console.log(`Logged in as ${user.name} (@${user.username})`);
});

client.on(Events.MessageCreated, async ({ message, author }) => {
    if (!message.message.startsWith("!")) return;
    if (author?.bot) return;

    const [command, ...args] = message.message.slice(1).split(" ");

    switch (command) {
        case "ping": {
            const start = Date.now();
            const sent = await message.reply("Pong! 🏓");
            const latency = Date.now() - start;
            await sent.edit(`Pong! 🏓 (${latency}ms)`);
            break;
        }

        case "echo":
            message.reply(args.join(" ") || "(nothing to echo)");
            break;

        case "whoami": {
            const name = author?.name ?? "unknown";
            const username = author?.username ? ` (@${author.username})` : "";
            message.reply(`You are ${name}${username}`);
            break;
        }
    }
});

client.on(Events.MessageUpdated, ({ message }) => {
    console.log(`Message edited: ${message.messageId}`);
});

client.on(Events.UserUpdated, ({ user }) => {
    console.log(`User updated: ${user.name}`);
});

client.on(Events.Disconnected, (code, reason) => {
    console.warn(`Disconnected: ${code} (${reason})`);
});

client.on(Events.Error, (err) => {
    console.error("Client error:", err);
});

client.login(process.env.TOKEN!);
