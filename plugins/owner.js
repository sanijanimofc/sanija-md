const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');
const os = require("os");
const { exec } = require('child_process');
const { runtime } = require('../lib/functions');

// 🧑‍💻 Owner Command
cmd({
    pattern: "owner",
    desc: "owner the bot",
    category: "owner",
    react: "👨‍💻",
    filename: __filename
}, async (conn, mek, m, { from, pushname, reply }) => {
    try {
        let dec = `*👋 Hello ${pushname}*

*👨‍💻SANIJA-MD 👨‍💻*

> *𝗢𝗪𝗡𝗘𝗥 𝗜𝗡𝗙𝗢* 

*⚡Owner name -: Sanija Nimtharu*
*⚡Number* -: +94767858145

⚡️◦ https://www.whatsapp.com/channel/0029Vai5pJa5vK9zcGR1PX2f

> *Powered by SANIJA-MD*`;

        await conn.sendMessage(from, { image: { url: config.MENU_IMG }, caption: dec }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});

// 📡 Repo Command
cmd({
    pattern: "repo",
    desc: "repo the bot",
    react: "📡",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        let dec = `*📍ℝ𝔼ℙ𝕆-𝕃𝕀ℕ𝕂 ❤️‍🔥👇*

👨‍💻◦ https://github.com/SANIJA-MD-OFFICIAL/SANIJA-MD_V1

*📍𝔽𝕆𝕃𝕃𝕆𝕎 𝕄𝕐 𝕎ℍ𝔸𝕋𝕊𝔸ℙℙ ℂℍ𝔸ℕℕ𝔼𝕃 ❤️‍🔥👇*

👨‍💻◦ https://www.whatsapp.com/channel/0029Vai5pJa5vK9zcGR1PX2f

> *Powered by SANIJA-MD*`;

        await conn.sendMessage(from, { image: { url: config.MENU_IMG }, caption: dec }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});

// ⚙️ System Info Command
cmd({
    pattern: "system",
    alias: ["status", "botinfo"],
    desc: "Check uptime, RAM usage and more",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        let status = `┌───────────────────────
├ ⏰ *Runtime:* ${runtime(process.uptime())}
├ 📟 *RAM Usage:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
├ ⚙️ *Platform:* ${os.hostname()}
├ 👨‍💻 *Owner:* Sanija Nimtharu
├ 🧬 *Version:* 1.0.0
└───────────────────────

> *Powered by SANIJA-MD*`;

        reply(status);
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});

// 🔍 Get JID
cmd({
    pattern: "jid",
    desc: "Get the JID of the chat.",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        reply(`${from}`);
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});

// 🔄 Restart Bot
cmd({
    pattern: "restart",
    desc: "Restart the bot",
    react: "🔄",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { isOwner, reply }) => {
    try {
        if (!isOwner) return reply("❌ Only the owner can use this command.");
        reply("🔄 Restarting...");
        await new Promise(res => setTimeout(res, 1500));
        exec("pm2 restart all");
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});

// 🛑 Shutdown Bot
cmd({
    pattern: "shutdown",
    desc: "Shutdown the bot.",
    category: "owner",
    react: "🛑",
    filename: __filename
}, async (conn, mek, m, { isOwner, reply }) => {
    if (!isOwner) return reply("❌ Only the owner can use this command.");
    reply("🛑 Shutting down...").then(() => process.exit());
});

// 📢 Broadcast Message
cmd({
    pattern: "broadcast",
    desc: "Broadcast message to all groups.",
    category: "owner",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { isOwner, args, reply }) => {
    if (!isOwner) return reply("❌ Only the owner can use this command.");
    if (args.length === 0) return reply("📢 Please provide a message.");

    const message = args.join(" ");
    const groups = Object.keys(await conn.groupFetchAllParticipating());

    for (const groupId of groups) {
        await conn.sendMessage(groupId, { text: message }, { quoted: mek });
    }

    reply("📢 Message broadcasted to all groups.");
});

// 🖼️ Set Bot Profile Picture
cmd({
    pattern: "setpp",
    desc: "Set bot profile picture.",
    category: "owner",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { isOwner, quoted, reply }) => {
    if (!isOwner) return reply("❌ Only the owner can use this command.");
    if (!quoted || !quoted.message.imageMessage) return reply("❌ Reply to an image to set as profile picture.");

    try {
        const media = await conn.downloadMediaMessage(quoted);
        await conn.updateProfilePicture(conn.user.jid, { url: media });
        reply("🖼️ Profile picture updated successfully!");
    } catch (error) {
        reply(`❌ Error: ${error.message}`);
    }
});

// 🚫 Block User
cmd({
    pattern: "block",
    desc: "Block a user.",
    category: "owner",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { isOwner, quoted, reply }) => {
    if (!isOwner) return reply("❌ Only the owner can use this command.");
    if (!quoted) return reply("❌ Please reply to a user to block.");

    const user = quoted.sender;
    try {
        await conn.updateBlockStatus(user, 'block');
        reply(`🚫 User ${user} blocked successfully.`);
    } catch (error) {
        reply(`❌ Error: ${error.message}`);
    }
});

// ✅ Unblock User
cmd({
    pattern: "unblock",
    desc: "Unblock a user.",
    category: "owner",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { isOwner, quoted, reply }) => {
    if (!isOwner) return reply("❌ Only the owner can use this command.");
    if (!quoted) return reply("❌ Please reply to a user to unblock.");

    const user = quoted.sender;
    try {
        await conn.updateBlockStatus(user, 'unblock');
        reply(`✅ User ${user} unblocked successfully.`);
    } catch (error) {
        reply(`❌ Error: ${error.message}`);
    }
});

// 🧹 Clear All Chats
cmd({
    pattern: "clearchats",
    desc: "Clear all chats from the bot.",
    category: "owner",
    react: "🧹",
    filename: __filename
}, async (conn, mek, m, { isOwner, reply }) => {
    if (!isOwner) return reply("❌ Only the owner can use this command.");
    try {
        const chats = await conn.chats.all();
        for (const chat of chats) {
            await conn.modifyChat(chat.jid, 'delete');
        }
        reply("🧹 All chats cleared successfully!");
    } catch (error) {
        reply(`❌ Error: ${error.message}`);
    }
});

// ✅ Ping
cmd({
    pattern: "ping",
    desc: "Check bot response time.",
    category: "owner",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const start = Date.now();
        const message = await conn.sendMessage(from, { text: "🏓 Pinging..." });
        const ping = Date.now() - start;
        await conn.sendMessage(from, { text: `📍 Ping: ${ping}ms` }, { quoted: message });
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});
