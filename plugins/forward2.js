const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')

cmd({
  pattern: "forward",
  desc: "forward msgs",
  alias: ["fo"],
  category: "main",
  use: ".forward < Jid address >",
  filename: __filename
}, async (_0x16a13f, _0x2c6b91, _0x315ed3, {
  from: _0x23eccb,
  l: _0x2878a6,
  quoted: _0x2c7d73,
  body: _0x429f15,
  isCmd: _0x5eb318,
  command: _0x429913,
  args: _0x92a0a5,
  q: _0x1a981c,
  isGroup: _0x38455f,
  sender: _0x3d0d2a,
  senderNumber: _0x470b6e,
  botNumber2: _0x6b733f,
  botNumber: _0x1f5a1c,
  pushname: _0x1b6be7,
  isMe: _0x48ca52,
  isOwner: _0xe145ac,
  groupMetadata: _0x5de16c,
  groupName: _0x568381,
  participants: _0x5b3644,
  groupAdmins: _0x5af416,
  isBotAdmins: _0x26c0a6,
  isAdmins: _0x448e61,
  reply: _0x183548
}) => {
  if (!_0xe145ac) {
    return _0x183548("*Owner Only ❌*");
  }
  if (!_0x2c6b91.quoted) {
    _0x183548("*give me message ❌*");
  }
  if (!_0x1a981c) {
    return _0x183548("please give me jids");
  }
  const _0x32a6b4 = _0x1a981c.split(',');
  let _0x486358;
  let _0x38e08a = {
    'key': _0x2c6b91.quoted?.['fakeObj']?.["key"]
  };
  if (_0x2c6b91.quoted?.["documentWithCaptionMessage"]?.["message"]?.["documentMessage"]) {
    let _0x25c127 = _0x2c6b91.quoted.documentWithCaptionMessage.message.documentMessage.mimetype;
    const _0x5a4de5 = require("mime-types");
    let _0xceb1ea = _0x5a4de5.extension(_0x25c127);
    _0x2c6b91.quoted.documentWithCaptionMessage.message.documentMessage.fileName = (_0x486358 ? _0x486358 : _0x2c6b91.quoted.documentWithCaptionMessage.message.documentMessage.fileName) + '.' + _0xceb1ea;
  }
  _0x38e08a.message = _0x2c6b91.quoted;
  for (let _0x4bc418 = 0x0; _0x4bc418 < _0x32a6b4.length; _0x4bc418++) {}
  return _0x183548("*SANIJA MD Message forwarded to:*\n\n " + _0x32a6b4);
});
