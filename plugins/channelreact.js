

case "cjid": {
  const [, jid] = text.split(" ");
  if (!jid) {
    return reply("🔹 Usage: .cjid <channelJid>");
  }

  // Unique set of heart-style emojis
  const emojis = [
    "💟", "💝", "💘", "💖", "💗", "💓",
    "💞", "💕", "❣", "❤", "💔", "🤎",
    "🤍", "🩶", "🖤", "💜", "💙", "🩵",
    "💚", "💛", "🧡", "🩷"
  ];

  const getRandomEmoji = () =>
    emojis[Math.floor(Math.random() * emojis.length)];

  // Send the initial message
  const sentMsg = await blade.sendMessage(jid, {
    text: getRandomEmoji(),
    contextInfo: {
      forwardingScore: 9,
      isForwarded: true,
    },
  });

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Start editing the message every 2 seconds
  (async function animateEmoji() {
    while (true) {
      await delay(2000);
      try {
        await blade.sendMessage(jid, {
          text: getRandomEmoji(),
          edit: sentMsg.key,
        });
      } catch (err) {
        console.error("Edit error:", err.message);
        break;
      }
    }
  })();

  break;
}
