const axios = require('axios');
const { cmd, commands } = require('../command');

// Anime Girl Command
cmd({
    pattern: "animegirl",
    desc: "Fetch a random anime girl image.",
    category: "fun",
    react: "👧",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const apiUrl = 'https://api.waifu.pics/sfw/waifu';
        const response = await axios.get(apiUrl);
        const data = response.data;

        await conn.sendMessage(from, {
            image: { url: data.url },
            caption: '👧 Random Anime Girl Image 👧\n*🎭 Fʀᴏɴᴇxᴛ 𝚋𝚢 ᴄʏʙᴇʀ ꜰʀᴏʟʏ 🀄*'
        }, { quoted: mek });
    } catch (e) {
        console.log(e);
        reply(`❌ Error fetching anime girl image: ${e.message}`);
    }
});

// Fun Fact Command
cmd({
    pattern: "fact",
    desc: "🧠 Get a random fun fact",
    react: "🤓",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const url = 'https://uselessfacts.jsph.pl/random.json?language=en';
        const response = await axios.get(url);
        const fact = response.data.text;

        const funFact = `
🧠 Random Fun Fact 🧠

${fact}

Isn't that interesting? 😄
`;
        return reply(funFact);
    } catch (e) {
        console.log(e);
        return reply("⚠ An error occurred while fetching a fun fact. Please try again later.");
    }
});

// Joke Command
cmd({
    pattern: "joke",
    desc: "😂 Get a random joke",
    react: "🤣",
    category: "fun",
    filename: __filename
},
async (conn, mek, m, { from, reply }) => {
    try {
        const url = 'https://official-joke-api.appspot.com/random_joke';
        const response = await axios.get(url);
        const joke = response.data;

        const jokeMessage = `
😂 Here's a random joke for you! 😂

${joke.setup}

${joke.punchline} 😄

🎭 Fʀᴏɴᴇxᴛ 𝚋𝚢 ᴄʏʙᴇʀ ꜰʀᴏʟʏ 🀄
`;
        return reply(jokeMessage);
    } catch (e) {
        console.log(e);
        return reply("⚠ Couldn't fetch a joke right now. Please try again later.");
    }
});
