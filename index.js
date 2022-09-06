const { Client, MessageEmbed } = require('discord.js')
const { readConfig, writeConfig, rollDice, ms } = require('./utils')
const { token } = require('./config.json')
const client = new Client()

const sprints = {}

client.once('ready', () => {
  console.clear()
  console.log(`Logged in as ${client.user.tag}`)
  console.log('Sprinty Operational!')
})

client.on('message', async (message) => {
  const { guild, author, content } = message
  const guildId = guild.id
  const { prefix, defaults } = await readConfig(guildId)

  if (!content.startsWith(prefix) || author.bot) return

  if (!sprints[guildId]) sprints[guildId] = {
    sprinters: [],
    status: null,
    startingTimer: null,
    runningTimer: null,
    finishingTimer: null
  }

  console.log(`${guildId}: ${author.username} => ${content}`)

  const args = content.slice(prefix.length).trim().split(/ +/)
  const command = args.shift().toLowerCase()
  const errHelp = `Hmm, not quite right. Use \`${prefix}help\` to try again`

  try {
    const sprinterIndex = sprints[guildId].sprinters.findIndex(s => s.author.username === author.username)
    switch (command) {
      case 'setdefault':
        if (!defaults.hasOwnProperty(args[0]) || !parseInt(args[1])) return message.reply(errHelp)
        defaults[args[0]] = parseInt(args[1])
        await writeConfig(guildId, { prefix, defaults })
        return message.reply(`Default ${args[0]} set to ${args[1]} minutes! Will apply on next sprint`)

      case 'sprint':
        if (sprints[guildId].isStarting && sprints[guildId].isFinished) return message.reply(`There's already a sprint running! Join in using \`${prefix}join <wordcount>\``)
        sprints[guildId].status = 'starting'
        sprints[guildId].sprinters = []
        message.channel.send('**New Sprint!**')
        const time = (parseInt(args[0]) || defaults.time)
        const bufferStart = (parseInt(args[1]) || defaults.bufferStart)
        const bufferEnd = (parseInt(args[2]) || defaults.bufferEnd)
        await message.channel.send(`In ${bufferStart} minute(s), we're going to be sprinting for ${time} minute(s).\r\nUse \`${prefix}join <wordcount>\` to join the sprint, leave out the wordcount to start from zero.`)
        sprints[guildId].startingTimer = setTimeout(() => {
          sprints[guildId].status = 'running'
          message.channel.send(`**Starting the sprint!**\r\nYou have ${time} minute(s)`)
        }, ms(bufferStart))
        sprints[guildId].runningTimer = setTimeout(() => {
          sprints[guildId].status = 'finishing'
          message.channel.send(`**Finished the sprint!**\r\nGive your final word count with \`${prefix}wc <wordcount>\`.\r\nYou have ${bufferEnd} minutes!`)
        }, ms(bufferStart) + ms(time))
        sprints[guildId].finishingTimer = setTimeout(() => {
          sprints[guildId].status = null
          sprints[guildId].sprinters.sort((a, b) => a.delta < b.delta ? -1 : a.delta > b.delta ? 1 : 0)
          const results = sprints[guildId].sprinters
            .map((s, x) => `${x + 1}. ${s.author.username} with ${s.delta} new words (${Math.round(s.delta / time, 2)} wpm)`)
            .join('\r\n')
          message.channel.send(`**The results are in!**\r\n${results}`)
        }, ms(bufferStart) + ms(time) + ms(bufferEnd))
        return null

      case 'join':
        if (!sprints[guildId].status) return message.reply(`There's no sprint currently started, start a one using \`${prefix}sprint\``)
        if (sprints[guildId].status == 'finishing') return message.reply(`The sprint has already finished, start one using \`${prefix}sprint\``)
        const wordcount = parseInt(args[0]) || 0
        if (sprinterIndex > -1) {
          sprints[guildId].sprinters[sprinterIndex].wordcount = wordcount
          return message.reply(`Updated join with ${wordcount} starting words`)
        }
        sprints[guildId].sprinters.push({ author, wordcount, delta: 0, wpm: 0 })
        return message.reply(`Joined with ${wordcount} starting words`)

      case 'leave':
        if (sprinterIndex == -1) return message.reply(`You need to join a sprint to leave it! Use \`${prefix}join\` ${!sprints[guildId].status ? ' next sprint' : ''}`)
        sprints[guildId].sprinters.splice(sprinterIndex, 1)
        return message.reply(`Left the sprint`)

      case 'cancel':
        if (!sprints[guildId].status) return message.reply(`There's no sprint currently started, start one using \`${prefix}sprint\``)
        sprints[guildId].sprinters = []
        sprints[guildId].isRunning = false
        clearTimeout(sprints[guildId].startingTimer)
        clearTimeout(sprints[guildId].runningTimer)
        clearTimeout(sprints[guildId].finishingTimer)
        return message.reply(`**Sprint has been canceled!**\r\nStart a new one with \`${prefix}sprint\``)

      case 'wc': return (() => {
        if (!sprints[guildId].status) return message.reply(`There's no sprint currently running, start one using \`${prefix}sprint\``)
        if (!parseInt(args[0])) return message.reply(errHelp)
        const wc = parseInt(args[0])
        if (sprinterIndex == -1) return message.reply(`You need to join the sprint first! Use \`${prefix}join\` ${!sprints[guildId].status ? ' next sprint' : ''}`)
        const delta = wc - sprints[guildId].sprinters[sprinterIndex].wordcount
        sprints[guildId].sprinters[sprinterIndex].wordcount = wc
        sprints[guildId].sprinters[sprinterIndex].delta = delta
        return message.reply(`Completed with ${delta} new words!`)
      })()

      case 'roll':
        const diceRegex = /(\d+)?[d](\d+)/i
        if (!args[0]) return message.reply(rollDice())
        if (args[0] && !diceRegex.test(args[0])) return message.reply(errHelp)
        let diceToRoll = args[0].split(diceRegex).filter(e => e !== '')
        if (diceToRoll[0] !== undefined) return message.reply(rollDice(diceToRoll[0], diceToRoll[1]).join(', '))
        return message.reply(rollDice(false, diceToRoll[1]))

      case 'help':
        const defs = [
          'sprint',
          'sprint <minutes>',
          'sprint <minutes> <buffer>',
          'setdefault Time|BufferStart|BufferEnd <minutes>',
          'join',
          'join <wordcount>',
          'cancel',
          'wc <count>',
          'roll',
          'roll d<dienumber>',
          'roll <numofdie>d<dienumber>'
        ]
        return message.reply(new MessageEmbed()
          .setTitle(`Hi, I'm Sprinty!`)
          .setDescription(`Here's some things you can have me do:\r\n\`\`\`${defs.map(d => `${prefix}${d}`).join(`\r\n`)}\`\`\``))

      default:
        return message.reply(`Sorry, I don't know that command. Use \`${prefix}help\` for a list of available commands`)
    }
  } catch (e) {
    console.warn('An error occured', e)
    message.reply(`Uh oh! Something didn't work right; try again in a bit!`)
  }
})

client.login(token)