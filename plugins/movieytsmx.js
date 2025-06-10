const axios = require('axios');
const { cmd, commands, sleep } = require('../command');

let movieSessions = {}; // temp memory for reply choices

cmd({
  pattern: "ytsmx",
  desc: "Search and download movies from YTS.mx",
  category: "movie",
  react: "🎬",
  filename: __filename
},
async (conn, mek, m, { from, q, reply, quoted }) => {
  if (!q) return reply("🎬 Please provide a movie name. Example:\n*ytsmx John Wick*");

  try {
    const searchUrl = `https://api-dark-shan-yt.koyeb.app/movie/ytsmx-search?q=${encodeURIComponent(q)}&apikey=b5f453075f866702`;
    const res = await axios.get(searchUrl);
    const movie = res.data?.data;

    if (!movie || !movie.url) return reply("❌ No results found. Try another movie.");

    const qualities = movie.qualities;
    if (!qualities || qualities.length === 0) return reply("⚠ No downloadable qualities available.");

    let caption = `🎬 *${movie.title}* (${movie.year})\n\n📝 *Summary:* ${movie.description}\n📊 *Rating:* ${movie.rating}\n🧾 *Genres:* ${movie.genres.join(', ')}\n\n📥 *Available Qualities:*\n`;

    qualities.forEach((q, i) => {
      caption += `\n${i + 1}. ${q.quality} - ${q.size}`;
    });

    caption += `\n\n📌 Reply with a number to download.\n🔖 *SANIJA-MD-MOVIE DL*`;

    // Save session
    movieSessions[mek.key.id] = {
      url: movie.url,
      qualities,
    };

    await conn.sendMessage(from, {
      image: { url: movie.image },
      caption
    }, { quoted: mek });

  } catch (err) {
    console.log(err);
    reply("❌ Error fetching movie details. Please try again.");
  }
});

// Handle replies for quality selection
cmd({
  on: "message"
},
async (conn, mek, m, { from, body, reply, quoted }) => {
  const isReply = quoted && movieSessions[quoted?.key?.id];
  const choice = parseInt(body.trim());

  if (!isReply || isNaN(choice)) return;

  const session = movieSessions[quoted.key.id];
  const quality = session.qualities[choice - 1];

  if (!quality) return reply("❌ Invalid selection. Please reply with a valid number.");

  try {
    const encodedURL = encodeURIComponent(session.url);
    const downloadUrl = `https://api-dark-shan-yt.koyeb.app/movie/ytsmx-download?url=${encodedURL}&apikey=b5f453075f866702`;

    const res = await axios.get(downloadUrl);
    const finalUrl = res.data?.download;

    if (!finalUrl) return reply("⚠ Failed to fetch download link.");

    await reply(`🎬 Downloading *${quality.quality}* quality...\n\n🔗 ${finalUrl}\n\n📽 *SANIJA-MD-MOVIE DL*`);
  } catch (e) {
    console.log(e);
    reply("❌ Error while generating the download link.");
  }

  // Cleanup
  delete movieSessions[quoted.key.id];
});
