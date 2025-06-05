const { cmd } = require('../command');

cmd({
    pattern: "fr",
    desc: "Forward a replied message to a WhatsApp Channel (JID ending with @newsletter).",
    category: "owner",
    react: "📨",
    filename: __filename
}, async (conn, mek, m, { text, isOwner, quoted, reply }) => {
    try {
        if (!isOwner) return reply("❌ Only the owner can use this command.");
        if (!quoted) return reply("📌 Please reply to the message you want to forward.");
        if (!text || !text.endsWith("@newsletter")) {
            return reply("❌ Invalid or missing Channel JID.\n\n📌 Example:\n.fr 120363296974282444@newsletter");
        }

        const channelJid = text.trim();
        await conn.forwardMessage(channelJid, quoted);
        reply(`✅ Message forwarded to: ${channelJid}`);
    } catch (e) {
        console.error(e);
        reply(`❌ Error forwarding message: ${e.message}`);
    }
});
