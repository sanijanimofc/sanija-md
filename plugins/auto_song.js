const { cmd, commands } = require('../command');
const config = require('../config');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const activeSearches = new Map();

cmd({
    pattern: "jidsong",
    alias: ["asongto"],
    use: '.jidsong <search> | <group/channel JID>',
    react: "📤",
    desc: "Search YouTube and send voice note to a specific group/channel (Owner Only)",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (activeSearches.get(from)?.isActive) {
            activeSearches.get(from).isActive = false; // stop previous
        }

        const [searchTerm, targetJid] = q.split('|').map(s => s.trim());
        if (!searchTerm || !targetJid) return reply("🔥Please provide a search term and a valid group/channel JID. Usage: .jidsong <search> | <JID>");

        if (!targetJid.includes('@g.us') && !targetJid.includes('@newsletter')) {
            return reply("Invalid JID! Must be a group (@g.us) or channel (@newsletter).");
        }

        activeSearches.set(from, { isActive: true, targetJid });

        const yt = await ytsearch(searchTerm);
        if (!yt.results || yt.results.length === 0) {
            activeSearches.delete(from);
            return reply("No results found!");
        }

        const videos = yt.results.slice(0, 10);

        for (let vid of videos) {
            if (!activeSearches.get(from)?.isActive) {
                reply("Search stopped!");
                break;
            }

            let mp3Api = `https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(vid.url)}`;
            let mp3res = await fetch(mp3Api).then(r => r.json());

            if (!mp3res?.success) continue;

            const caption = `*SANIJA MD SONG 🤍*

🎬 *TITLE:* ${vid.title}
⏱ *DURATION:* ${vid.timestamp}
👀 *VIEWS:* ${vid.views}
👤 *AUTHOR:* ${vid.author.name}
🔗 *SONG LINK:* ${vid.url}

📲 _Follow us_: https://www.whatsapp.com/channel/0029Vai5pJa5vK9zcGR1PX2f

*POWERED BY SANIJA NIMTHARU*`;

            await conn.sendMessage(targetJid, {
                image: { url: vid.thumbnail },
                caption,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '@newsletter',
                        newsletterName: 'SANIJA SONG 🔥',
                        serverMessageId: 143
                    }
                }
            }, { quoted: mek });

            await conn.sendMessage(targetJid, {
                audio: { url: mp3res.result.downloadUrl },
                mimetype: "audio/mpeg",
                ptt: true
            });

            await conn.sendMessage(from, { text: `🎶 Song "${vid.title}" sent to ${targetJid}` });

            await new Promise(res => setTimeout(res, 1000));
        }

        activeSearches.delete(from);
    } catch (e) {
        console.error(e);
        activeSearches.delete(from);
        reply("An error occurred. Try again later.");
    }
});
