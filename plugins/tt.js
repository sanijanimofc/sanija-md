const { cmd } = require('../command');
const config = require('../config');
const axios = require('axios');

let tiktokInfoMap = {};
let tiktokLastMsgKey = null;
let tiktokConnRef = null;

cmd({
    pattern: "tiktok",
    alias: ["ttdl", "ttvideo"],
    desc: "Download TikTok video using BK9 API",
    react: "🎵",
    category: "downloader",
    filename: __filename
},
async (conn, mek, m, { from, args, pushname, reply }) => {
    try {
        tiktokConnRef = conn;
        const url = args[0];
        if (!url) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key }});
            return reply('Please provide a TikTok link!\nExample: .tiktok https://www.tiktok.com/@user/video/XXXXXXXXXXX');
        }

        await conn.sendMessage(from, { react: { text: "⏳", key: mek.key }});

        const apiUrl = `https://bk9.fun/download/tiktok?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.status || !data.BK9) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key }});
            return reply('❌ Failed to fetch video. Please check the TikTok link and try again.');
        }

        const result = data.BK9;
        const caption = `*🎬 SANIJA MD TikTok Download*
━━━━━━━━━━━━━━━
Nick: ${result.nickname}
Desc: ${result.desc}
Likes: ${result.likes_count}
Comments: ${result.comment_count}
Music: ${result.music_info?.title || "-"}
Owner: SANIJA MD
━━━━━━━━━━━━━━━`;

        if (config.BUTTON === 'true') {
            const sentMsg = await conn.sendMessage(from, {
                footer: '© SANIJA MD ',
                buttons: [
                    { buttonId: ".download_video", buttonText: { displayText: "⬇ Download Video" }, type: 1 },
                    { buttonId: ".video_link", buttonText: { displayText: "🖥 Open Video Link" }, type: 1 },
                    { buttonId: ".all", buttonText: { displayText: "📦 All Info" }, type: 1 }
                ],
                headerType: 1,
                viewOnce: true,
                image: { url: result.BK9 },
                caption: caption,
                contextInfo: {
                    isForwarded: true,
                    mentionedJid: [m.sender]
                }
            }, { quoted: mek });

            tiktokLastMsgKey = sentMsg?.key?.id ?? null;
            if (tiktokLastMsgKey) tiktokInfoMap[tiktokLastMsgKey] = result;
            await conn.sendMessage(from, { react: { text: "✅", key: sentMsg.key }});
        } else {
            const numberedMsg = `${caption}\n\n*Reply with a number:*\n*1* | Download Video\n*2* | Video Link\n*3* | All Info`;
            const sentMsg = await conn.sendMessage(from, {
                image: { url: result.BK9 },
                caption: numberedMsg,
                footer: '© SANIJA MD'
            }, { quoted: mek });

            tiktokLastMsgKey = sentMsg?.key?.id ?? null;
            if (tiktokLastMsgKey) tiktokInfoMap[tiktokLastMsgKey] = result;
            await conn.sendMessage(from, { react: { text: "✅", key: sentMsg.key }});
        }
    } catch (e) {
        console.error(e);
        await tiktokConnRef.sendMessage(from, { react: { text: "❌", key: mek.key }});
        reply('ERROR ❗❗');
    }
});

// Handler for replies (buttons or number)
if (!global.__tiktokButtonHandler) {
    global.__tiktokButtonHandler = true;
    const { setTimeout } = require('timers');

    function waitForTiktokConn() {
        if (!tiktokConnRef) return setTimeout(waitForTiktokConn, 500);

        tiktokConnRef.ev.on('messages.upsert', async (msgUpdate) => {
            const msg = msgUpdate.messages?.[0];
            if (!msg || !msg.key) return;

            const stanzaId = msg.message?.buttonsResponseMessage?.contextInfo?.stanzaId || msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
            const info = tiktokInfoMap[stanzaId];
            if (!info) return;

            // Button Mode
            if (config.BUTTON === 'true' && msg.message?.buttonsResponseMessage) {
                const selected = msg.message.buttonsResponseMessage.selectedButtonId?.trim();
                if (!selected) return;

                if (selected === ".download_video") {
                    await tiktokConnRef.sendMessage(msg.key.remoteJid, { react: { text: "⬇", key: msg.key }});
                    await tiktokConnRef.sendMessage(msg.key.remoteJid, { video: { url: info.BK9 }, mimetype: 'video/mp4', caption: info.desc || 'TikTok Video' }, { quoted: msg });
                } else if (selected === ".video_link") {
                    await tiktokConnRef.sendMessage(msg.key.remoteJid, { react: { text: "🔗", key: msg.key }});
                    await tiktokConnRef.sendMessage(msg.key.remoteJid, { text: info.BK9 }, { quoted: msg });
                } else if (selected === ".all") {
                    const allInfo = `*🎬 SANIJA MD TikTok Download*
━━━━━━━━━━━━━━━
Nick: ${info.nickname}
Desc: ${info.desc}
Likes: ${info.likes_count}
Comments: ${info.comment_count}
Music: ${info.music_info?.title || "-"}
Video: ${info.BK9}
Owner: SANIJA MD
━━━━━━━━━━━━━━━`;
                    await tiktokConnRef.sendMessage(msg.key.remoteJid, { text: allInfo }, { quoted: msg });
                }
            }

            // Number Reply Mode
            if (config.BUTTON !== 'true' && msg.message?.extendedTextMessage) {
                const userResponse = msg.message.extendedTextMessage.text.trim();
                if (userResponse === '1') {
                    await tiktokConnRef.sendMessage(msg.key.remoteJid, { react: { text: "⬇", key: msg.key }});
                    await tiktokConnRef.sendMessage(msg.key.remoteJid, { video: { url: info.BK9 }, mimetype: 'video/mp4', caption: info.desc || 'TikTok Video' }, { quoted: msg });
                } else if (userResponse === '2') {
                    await tiktokConnRef.sendMessage(msg.key.remoteJid, { react: { text: "🔗", key: msg.key }});
                    await tiktokConnRef.sendMessage(msg.key.remoteJid, { text: info.BK9 }, { quoted: msg });
                } else if (userResponse === '3') {
                    const allInfo = `*🎬 SANIJA MD TikTok Download*
━━━━━━━━━━━━━━━
Nick: ${info.nickname}
Desc: ${info.desc}
Likes: ${info.likes_count}
Comments: ${info.comment_count}
Music: ${info.music_info?.title || "-"}
Video: ${info.BK9}
Owner: SANIJA MD
━━━━━━━━━━━━━━━`;
                    await tiktokConnRef.sendMessage(msg.key.remoteJid, { text: allInfo }, { quoted: msg });
                } else {
                    await tiktokConnRef.sendMessage(msg.key.remoteJid, { text: "❌ Invalid option. Please enter 1, 2 or 3." }, { quoted: msg });
                }
            }
        });
    }

    waitForTiktokConn();
}
