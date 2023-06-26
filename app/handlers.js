import Commands from './commands.js'
import { readConfig, logger } from './utils.js'

export async function handleMessage(msg) {
  const { prefix } = await readConfig(msg.guildId)
  if (msg.content[0] != prefix) return

  const args = msg.content.trim().replace('_', '').split(/\s+/)
  const cmd = args.shift()

  logger.log(msg.author.username, cmd, args)

  try {
    switch (cmd) {
      case '!clear': Commands.clearChannel(msg, args); break
      case 'setdefault': Commands.setDefault(msg, args); break
      case 'getdefaults': Commands.getDefaults(msg, args); break
      case 'setmedia': Commands.setMedia(msg, args); break
      case 'getmedia': Commands.getMedia(msg, args); break
      case 'sprint': Commands.startSprint(msg, args); break
      case 'join': Commands.joinSprint(msg, args); break
      case 'time': Commands.getTimeLeft(msg, args); break
      case 'leave': Commands.leaveSprint(msg, args); break
      case 'wc': Commands.setWordCount(msg, args); break
      case 'cancel': Commands.cancelSprint(msg, args); break
      case 'roll': Commands.randomDiceRoll(msg, args); break
      case 'help': Commands.getHelp(msg, args); break
      default: Commands.cmdNotFound(msg); break
    }
  } catch (e) {
    logger.err('An error occured:', e)
    await msg.reply(`Uh oh! Something didn't work right.\r\nIf that happens again, please submit a bug`)
  }
}