const { cmd } = require('../command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const API_URL = "https://api.skymansion.site/movies-dl/search";
const DOWNLOAD_URL = "https://api.skymansion.site/movies-dl/download";
const API_KEY = config.MOVIE_API_KEY;

const BOT_NAME = "SANIJA MD";

const activeMovieDownloads = new Map(); // to track replies

cmd({
    pattern: "movie",
    alias: ["moviedl", "films"],
    react: '🎬', // main react emoji on command usage
    category: "download",
    desc: `Search and download movies from PixelDrain with quality selector using ${BOT_NAME}`,
    filename: __filename
}, async (robin, m, mek, { from, q, reply }) => {
    try {
        if (!q || q.trim() === '') return await reply(`❌ [${BOT_NAME}] Please provide a movie name!\n\nExample: \`.movie Deadpool\``);

        await reply(`🔎 [${BOT_NAME}] Searching for movie: *${q.trim()}*... Please wait.`);

        // Search movie
        const searchUrl = `${API_URL}?q=${encodeURIComponent(q)}&api_key=${API_KEY}`;
        const res = await fetchJson(searchUrl);

        if (!res || !res.SearchResult || !res.SearchResult.result.length)
            return await reply(`❌ [${BOT_NAME}] No results found for *${q}*.`);

        const movie = res.SearchResult.result[0];
        const detailsUrl = `${DOWNLOAD_URL}/?id=${movie.id}&api_key=${API_KEY}`;
        const detailsRes = await fetchJson(detailsUrl);

        if (!detailsRes || !detailsRes.downloadLinks || !detailsRes.downloadLinks.result.links.driveLinks.length)
            return await reply(`❌ [${BOT_NAME}] No PixelDrain download links found.`);

        const info = detailsRes.details;
        const links = detailsRes.downloadLinks.result.links.driveLinks;

        let msg = `🎬 *${movie.title}*\n`;
        if (info.year) msg += `🗓 Year: ${info.year}\n`;
        if (info.duration) msg += `⏱ Duration: ${info.duration}\n`;
        if (info.rating) msg += `⭐ Rating: ${info.rating}\n`;
        if (info.description) msg += `📝 Description: ${info.description}\n`;
        msg += `\n📥 *Available Qualities:*\n`;

        links.forEach((link, index) => {
            msg += `\n${index + 1}. ${link.quality}`;
        });

        msg += `\n\n📌 *Reply with the number to download.*\n\n⚠️ *Note: Large files may take time to download and send.*`;

        await reply(msg);

        // Track user's download request for reply
        activeMovieDownloads.set(mek.key.id, {
            from,
            movie,
            links,
            quoted: mek
        });

    } catch (error) {
        console.error(`[${BOT_NAME}] Movie command error:`, error);
        await reply(`❌ [${BOT_NAME}] Something went wrong. Please try again later.`);
    }
});

// Handle quality reply
cmd({
    on: "text"
}, async (robin, m, mek, { from, reply }) => {
    const previous = activeMovieDownloads.get(mek.message?.extendedTextMessage?.contextInfo?.stanzaId);
    if (!previous) return;

    const choice = parseInt(m.text.trim());
    if (isNaN(choice) || choice < 1 || choice > previous.links.length)
        return await reply(`❌ [${BOT_NAME}] Invalid choice. Please enter a valid number.`);

    const selected = previous.links[choice - 1];
    if (!selected || !selected.link) return await reply(`❌ [${BOT_NAME}] Selected link not found.`);

    const fileId = selected.link.split('/').pop();
    const directLink = `https://pixeldrain.com/api/file/${fileId}?download`;

    const fileName = `${previous.movie.title.replace(/[\/:*?"<>|]/g, '')}-${selected.quality}.mp4`;
    const filePath = path.join(__dirname, fileName);

    try {
        await reply(`⬇️ [${BOT_NAME}] Downloading *${previous.movie.title}* in *${selected.quality}* quality. Please wait...`);

        const writer = fs.createWriteStream(filePath);
        const { data } = await axios({
            url: directLink,
            method: 'GET',
            responseType: 'stream'
        });

        data.pipe(writer);

        writer.on('finish', async () => {
            await robin.sendMessage(from, {
                document: fs.readFileSync(filePath),
                mimetype: 'video/mp4',
                fileName,
                caption: `🎬 [${BOT_NAME}] *${previous.movie.title}*\n📥 Quality: ${selected.quality}\n✅ Download Complete! Enjoy your movie! 🍿`,
                quoted: previous.quoted
            });
            fs.unlinkSync(filePath);
        });

        writer.on('error', async (err) => {
            console.error(`[${BOT_NAME}] Download stream error:`, err);
            await reply(`❌ [${BOT_NAME}] Failed to download the movie. Please try again later.`);
        });

        activeMovieDownloads.delete(mek.key.id);
    } catch (err) {
        console.error(`[${BOT_NAME}] Download error:`, err);
        await reply(`❌ [${BOT_NAME}] Download failed. Please try again.`);
    }
});
