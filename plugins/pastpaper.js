

const { cmd } = require('../command');
const axios = require('axios');

let pastppInfoMap = {};
let pastppLastMsgKey = null;
let pastppConnRef = null;

cmd({
    pattern: "pastpp",
    alias: ["pastpaper", "pastpapers"],
    desc: "Search and download Sri Lanka school past papers!",
    react: "📄",
    category: "education",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        pastppConnRef = conn;
        const query = args.join(" ");
        if (!query) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply('Type a past paper name, grade or subject to search!\nEx: `.pastpp grade 11 science`');
        }

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        // Search API
        const searchUrl = `https://api-pass.vercel.app/api/search?query=${encodeURIComponent(query)}&page=1`;
        const { data } = await axios.get(searchUrl);

        if (!Array.isArray(data.results) || data.results.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("❌ No past papers found for your search. Try another keyword!");
        }

        const results = data.results;
        let sendObj = {
            image: { url: results[0].thumbnail || "https://i.ibb.co/21LhR9JS/20250615-1502-Solo-Leveling-Characters-remix-01jxsetpm9effavxjvyn37tn26.png" },
            footer: "© Thenux-AI | Past Paper Search",
            headerType: 4,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterName: "👾 THENUX  |   AI ジ",
                    newsletterJid: "1203633129628631506@newsletter",
                },
                externalAdReply: {
                    title: "Thenux-AI| Auto AI",
                    body: "Powered by Thenux-AI | darkhackersl",
                    thumbnailUrl: 'https://i.ibb.co/21LhR9JS/20250615-1502-Solo-Leveling-Characters-remix-01jxsetpm9effavxjvyn37tn26.png',
                    mediaType: 1,
                    sourceUrl: 'https://github.com/darkhackersl',
                    renderLargerThumbnail: true
                }
            }
        };

        // Build rows for list
        const rows = results.map((item, i) => ({
            title: item.title.length > 32 ? item.title.substring(0, 32) + "..." : item.title,
            rowId: `.pastpplist_${i}`,
            description: item.description ? (item.description.length > 45 ? item.description.substring(0, 45) + "..." : item.description) : ""
        }));

        sendObj.text = "*📄 Past Paper Search Results*\n━━━━━━━━━━━━━━━━━━\nSelect a paper to download:\n━━━━━━━━━━━━━━━━━━\n_Powered by @Thenux-ai_";
        sendObj.sections = [
            {
                title: "Search Results",
                rows: rows
            }
        ];
        sendObj.buttonText = "Select Past Paper";

        // Send as list message
        const sentMsg = await conn.sendMessage(from, sendObj, { quoted: mek });

        pastppLastMsgKey = sentMsg?.key?.id ?? null;
        if (pastppLastMsgKey) pastppInfoMap[pastppLastMsgKey] = results;

        await conn.sendMessage(from, { react: { text: "✅", key: sentMsg.key } });
    } catch (e) {
        console.log(e);
        await pastppConnRef.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("❌ ERROR occurred while fetching results.");
    }
});

// List reply handler for past paper download
if (!global.__pastppListHandler) {
    global.__pastppListHandler = true;
    const { setTimeout } = require('timers');

    function waitForPastppConn() {
        if (!pastppConnRef) return setTimeout(waitForPastppConn, 500);

        pastppConnRef.ev.on('messages.upsert', async (msgUpdate) => {
            const msg = msgUpdate.messages?.[0];
            if (!msg || !msg.key) return;

            if (msg.message?.listResponseMessage) {
                const selected = msg.message.listResponseMessage.singleSelectReply?.selectedRowId?.trim();
                if (!selected || !selected.startsWith('.pastpplist_')) return;

                const idx = parseInt(selected.replace('.pastpplist_', ''));
                const stanzaId = msg.message.listResponseMessage.contextInfo?.stanzaId || pastppLastMsgKey;
                const results = stanzaId && pastppInfoMap[stanzaId] ? pastppInfoMap[stanzaId] : null;

                if (!results || !results[idx]) {
                    await pastppConnRef.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
                    return;
                }

                const info = results[idx];
                try {
                    await pastppConnRef.sendMessage(msg.key.remoteJid, { react: { text: "⏬", key: msg.key } });
                    const downloadUrl = `https://api-pass.vercel.app/api/download?url=${encodeURIComponent(info.url)}`;
                    const { data: dl } = await axios.get(downloadUrl);

                    if (!dl?.download_info?.download_url) {
                        await pastppConnRef.sendMessage(msg.key.remoteJid, { text: "❌ Download link not found!" }, { quoted: msg });
                        return;
                    }

                    await pastppConnRef.sendMessage(msg.key.remoteJid, {
                        document: { url: dl.download_info.download_url },
                        mimetype: 'application/pdf',
                        fileName: dl.download_info.file_name || 'pastpaper.pdf',
                        caption: `*📄 ${dl.download_info.file_title || info.title}*\n\nSource: ${info.url}\n_Powered by Thenux-ai_`
                    }, { quoted: msg });

                    await pastppConnRef.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });

                } catch (e) {
                    await pastppConnRef.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
                    await pastppConnRef.sendMessage(msg.key.remoteJid, { text: "❌ Failed to fetch the download link!" }, { quoted: msg });
                }
            }
        });
    }

    waitForPastppConn();
}
