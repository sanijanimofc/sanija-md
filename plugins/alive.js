const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "button",
    desc: "Bot's Online or No.",
    react: "👋",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const aliveMessage = `
╭───〔 *SANIJA MD ALIVE* 〕───◆
│ 👑 *Bot Status:* Online & Ready
│ ⚙️ *Version:* 2.5.1
│ 💬 *Prefix:* ${config.PREFIX || '.'}
│ 👤 *Owner:* Sanija
│ 🌐 *Framework:* Baileys-MD
│ 🔒 *Security:* Encrypted & Safe
│ 🧠 *AI Mode:* ${config.AI_MODE ? 'Enabled' : 'Disabled'}
│ 📦 *Commands:* Utility | Downloaders | Fun | Admin Tools
│ 🛠️ *Custom Plugins:* Supported
│ 🖼️ *Media:* Images | Videos | Audio | Documents
╰─────────────────────────────◆

📢 *SANIJA MD* is a powerful, multi-functional WhatsApp bot built for seamless user experience. Designed to support button replies, AI integration, and fast downloaders, it helps automate groups, entertain users, and provide productivity tools right inside WhatsApp.

🛡️ Safe, fast, and actively maintained.
💎 Upgrade your WhatsApp with *SANIJA MD*!
        `.trim();

        if (config.BUTTON === 'true') {
            await conn.sendMessage(from, {
                footer: '© 2025 SANIJA MD',
                buttons: [
                    {
                        buttonId: 'system',
                        buttonText: { displayText: 'System 📟' },
                        type: 1
                    },
                    {
                        buttonId: 'ping',
                        buttonText: { displayText: 'Ping 📍' },
                        type: 1
                    }
                ],
                headerType: 1,
                viewOnce: true,
                image: { url: "https://files.catbox.moe/d2d02k.png" },
                caption: aliveMessage,
                contextInfo: {
                    isForwarded: true,
                    mentionedJid: [m.sender],
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363296974282444@newsletter",
                        newsletterName: "SANIJA-MD UPDATES"
                    }
                }
            }, { quoted: mek });
        } else {
            await conn.sendMessage(from, {
                image: { url: "https://files.catbox.moe/d2d02k.png" },
                caption: aliveMessage
            }, { quoted: mek });
        }
    } catch (e) {
        console.error(e);
        reply("*ERROR ❗❗*");
    }
});
