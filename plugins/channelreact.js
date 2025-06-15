const { cmd } = require('../command');

cmd({
  pattern: 'cjid',
  react: '💌',
  desc: 'Send animated emoji to a channel JID',
  use: '.cjid <channelJid>',
  filename: __filename
}, async (blade, m, msg, { q, reply }) => {
  const jid = q.trim();

  if (!jid) return await reply('🔹 Usage: .cjid <channelJid>');

  // Emoji set
  const emojis = [
    "💟", "💝", "💘", "💖", "💗", "💓",
    "💞", "💕", "❣", "❤", "💔", "🤎",
    "🤍", "🩶", "🖤", "💜", "💙", "🩵",
    "💚", "💛", "🧡", "🩷"
  ];

  const getRandomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];

  // Send initial emoji message
  const sentMsg = await blade.sendMessage(jid, {
    text: getRandomEmoji(),
    contextInfo: {
      forwardingScore: 9,
      isForwarded: true,
    },
  });

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  // Edit emoji in a loop
  (async function animateEmoji() {
    while (true) {
      await delay(2000);
      try {
        await blade.sendMessage(jid, {
          text: getRandomEmoji(),
          edit: sentMsg.key,
        });
      } catch (err) {
        console.error('Edit error:', err.message);
        break;
      }
    }
  })();
});
