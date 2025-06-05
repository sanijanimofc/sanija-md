const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");

const cache = new Map();

function normalizeYouTubeUrl(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? `https://youtube.com/watch?v=${match[1]}` : null;
}

function getVideoId(url) {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/.*[?&]v=)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

async function downloadAndValidateAudio(url, retries = 2) {
  try {
    try {
      const headResponse = await axios.head(url, { timeout: 10000 });
      const contentType = headResponse.headers["content-type"];
      if (!contentType.includes("audio/") && !contentType.includes("application/octet-stream")) {
        console.error(`Invalid content type: ${contentType}`);
        if (retries > 0) return downloadAndValidateAudio(url, retries - 1);
        return null;
      }
    } catch (error) {
      console.warn(`Header check failed: ${error.message}, proceeding with download...`);
    }

    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `audio_${Date.now()}.mp3`);
    const response = await axios({
      method: "get",
      url: url,
      responseType: "stream",
      timeout: 30000,
    });

    const writer = require("fs").createWriteStream(tempFile);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const stats = await fs.stat(tempFile);
    if (stats.size < 100000) {
      console.error("Downloaded file is too small:", stats.size);
      await fs.unlink(tempFile).catch(() => {});
      if (retries > 0) return downloadAndValidateAudio(url, retries - 1);
      return null;
    }

    return tempFile;
  } catch (error) {
    console.error(`Failed to download audio: ${error.message}`);
    if (retries > 0) {
      console.log(`Retrying download... Attempts left: ${retries}`);
      return downloadAndValidateAudio(url, retries - 1);
    }
    return null;
  }
}

async function checkProgress(progressUrl, retries = 10) {
  try {
    const progressEndpoint = `https://chathuraytdl.netlify.app/.netlify/functions/ytdl?action=progress&url=${encodeURIComponent(progressUrl)}`;
    const response = await axios.get(progressEndpoint, { timeout: 10000 });
    const data = response.data;

    if (data.success && data.processing_status === "completed" && data.download_url) {
      return { download_url: data.download_url, status: "completed" };
    } else if (data.success && data.processing_status !== "completed") {
      console.log(`Processing: ${data.processing_status || "in progress"}`);
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return checkProgress(progressUrl, retries - 1);
      }
    }
    return null;
  } catch (error) {
    console.error(`Progress check failed: ${error.message}`);
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      return checkProgress(progressUrl, retries - 1);
    }
    return null;
  }
}

async function fetchAudioData(url, format = "mp3", retries = 2) {
  const cacheKey = `${getVideoId(url)}:mp3`;
  if (cache.has(cacheKey)) {
    console.log(`Using cached data for: ${url} (mp3)`);
    return cache.get(cacheKey);
  }

  try {
    const apiUrl = `https://chathuraytdl.netlify.app/ytdl?url=${encodeURIComponent(url)}&format=mp3`;
    console.log(`Fetching from API: ${apiUrl}`);
    const response = await axios.get(apiUrl, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const data = response.data;
    if (data.success && data.download_url && data.processing_status === "completed") {
      const result = {
        download_url: data.download_url,
        title: data.info.title || "",
        thumbnail: data.info.image || `https://i.ytimg.com/vi/${getVideoId(url)}/hqdefault.jpg`,
      };
      cache.set(cacheKey, result);
      setTimeout(() => cache.delete(cacheKey), 3600000);
      return result;
    } else if (data.success && data.progress_url) {
      console.log("Checking progress...");
      const progressResult = await checkProgress(data.progress_url);
      if (progressResult && progressResult.status === "completed") {
        const result = {
          download_url: progressResult.download_url,
          title: data.info.title || "",
          thumbnail: data.info.image || `https://i.ytimg.com/vi/${getVideoId(url)}/hqdefault.jpg`,
        };
        cache.set(cacheKey, result);
        setTimeout(() => cache.delete(cacheKey), 3600000);
        return result;
      }
    }
    throw new Error("Failed to get download link");
  } catch (error) {
    console.error(`API fetch failed: ${error.message}`);
    if (retries > 0) {
      console.log(`Retrying API fetch... (${retries} left)`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return fetchAudioData(url, format, retries - 1);
    }
    return null;
  }
}

async function searchYouTube(query, maxResults = 1) {
  const cacheKey = `search:${query}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const searchResults = await yts({ query, pages: 1 });
    const videos = searchResults.videos.slice(0, maxResults);
    cache.set(cacheKey, videos);
    setTimeout(() => cache.delete(cacheKey), 1800000);
    return videos;
  } catch (error) {
    console.error(`Search error: ${error.message}`);
    return [];
  }
}

cmd(
  {
    pattern: "song",
    alias: ["ytaudio", "mp3", "ytmp3"],
    react: "🎵",
    desc: "Download enchanted audio from YouTube",
    category: "ice kingdom",
    filename: __filename,
  },
  async (frozen, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("GIVE ME THE SONG NAME OR URL");

      await frozen.sendMessage(from, { react: { text: "🔍", key: mek.key } });

      const url = normalizeYouTubeUrl(q);
      let ytdata;

      const searchResults = await searchYouTube(url || q);
      if (!searchResults.length) return reply("❌ No songs found matching your query!");
      ytdata = searchResults[0];

      let desc = `
SANIJA-MD AUDIO DOWNLOADER 🎵

📌 Title: ${ytdata.title}
🎤 Channel: ${ytdata.author.name}
👁 Views: ${ytdata.views}
⏱ Duration: ${ytdata.timestamp}
🕒 Uploaded: ${ytdata.ago}
🔗 Link: ${ytdata.url}

🔢 Reply with a number to select format:
1. Audio Format 🎶
2. Document Format 📁
3. Voice Note Format 🎙

POWERED BY SANIJA-MD
`;

      const vv = await frozen.sendMessage(
        from,
        { image: { url: ytdata.thumbnail }, caption: desc },
        { quoted: mek }
      );

      await frozen.sendMessage(from, { react: { text: "✅", key: mek.key } });

      frozen.ev.on("messages.upsert", async (msgUpdate) => {
        const msg = msgUpdate.messages[0];
        if (!msg.message || !msg.message.extendedTextMessage) return;

        const selectedOption = msg.message.extendedTextMessage.text.trim();
        if (
          msg.message.extendedTextMessage.contextInfo &&
          msg.message.extendedTextMessage.contextInfo.stanzaId === vv.key.id
        ) {
          try {
            const validOptions = ["1", "2", "3"];
            if (!validOptions.includes(selectedOption)) {
              await frozen.sendMessage(from, { react: { text: "❓", key: msg.key } });
              return reply("Please reply with a valid option (1, 2, or 3).");
            }

            await frozen.sendMessage(from, { react: { text: "⏳", key: msg.key } });

            const data = await fetchAudioData(ytdata.url, "mp3");
            if (!data || !data.download_url) {
              await frozen.sendMessage(from, { react: { text: "❌", key: msg.key } });
              return reply("❌ Download link not found! Try again later.");
            }

            const tempFile = await downloadAndValidateAudio(data.download_url);
            if (!tempFile) {
              await frozen.sendMessage(from, { react: { text: "❌", key: msg.key } });
              return reply("❌ Failed to download. The audio file might be corrupted.");
            }

            const contextInfo = {
              externalAdReply: {
                title: ytdata.title,
                body: "Audio Downloader",
                thumbnailUrl: data.thumbnail,
                sourceUrl: ytdata.url,
              },
            };

            if (selectedOption === "1") {
              await frozen.sendMessage(
                from,
                {
                  audio: { url: tempFile },
                  mimetype: "audio/mp4",
                  contextInfo: contextInfo,
                },
                { quoted: msg }
              );
              await frozen.sendMessage(from, { react: { text: "🎶", key: msg.key } });
            } else if (selectedOption === "2") {
              await frozen.sendMessage(
                from,
                {
                  document: { url: tempFile },
                  mimetype: "audio/mp3",
                  fileName: `${ytdata.title}.mp3`,
                  contextInfo: contextInfo,
                },
                { quoted: msg }
              );
              await frozen.sendMessage(from, { react: { text: "📁", key: msg.key } });
            } else if (selectedOption === "3") {
              await frozen.sendMessage(
                from,
                {
                  audio: { url: tempFile },
                  mimetype: "audio/mp4",
                  ptt: true,
                  contextInfo: contextInfo,
                },
                { quoted: msg }
              );
              await frozen.sendMessage(from, { react: { text: "🎙", key: msg.key } });
            }

            await fs.unlink(tempFile).catch(() => {});
          } catch (error) {
            console.error("Download error:", error);
            await frozen.sendMessage(from, { react: { text: "❌", key: msg.key } });
            reply(`⚠ Error downloading: ${error.message}`);
          }
        }
      });
    } catch (e) {
      console.error("Command error:", e);
      await frozen.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply(`⚠ *Error:* ${e.message || "Unknown error occurred"}`);
    }
  }
);
