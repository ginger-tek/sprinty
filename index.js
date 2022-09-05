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
    isStarting: false,
    isFinished: false,
    startingTimer: null,
    runningTimer: null,
    resultsTimer: null
  }

  console.log(`${guildId}: ${author.username} => ${content}`)

  const args = content.slice(prefix.length).trim().split(/ +/)
  const command = args.shift().toLowerCase()
  const errHelp = `Hmm, not quite right. Use \`${prefix}help\` to try again`

  try {
    switch (command) {
      case 'setdefault':
        if (!defaults.hasOwnProperty(args[0]) || !parseInt(args[1])) return message.reply(errHelp)
        defaults[args[0]] = parseInt(args[1])
        await writeConfig(guildId, { prefix, defaults })
        return message.reply(`default ${args[0]} set to ${args[1]} minutes! Will apply on next sprint`)

      case 'sprint':
        if (sprints[guildId].isStarting) return message.reply(`there's already a sprint running! Join in using \`${prefix}join <wordcount>\``)
        sprints[guildId].isStarting = true
        sprints[guildId].sprinters = []
        message.channel.send('**Sprinting!**')
        const time = (parseInt(args[0]) || defaults.time)
        const bufferStart = (parseInt(args[1]) || defaults.bufferStart)
        const bufferEnd = (parseInt(args[2]) || defaults.bufferEnd)
        await message.channel.send(`In ${bufferStart} minutes, we're going to be sprinting for ${time} minutes.\r\nUse \`${prefix}join <wordcount>\` to join the sprint, leave out the wordcount to start from zero.`)
        sprints[guildId].startingTimer = setTimeout(() => {
          sprints[guildId].isStarting = false
          const minutesAndSeconds = new Date()
          const sprintEndMinute = (parseInt(minutesAndSeconds.getMinutes()) + time) % 60
          message.channel.send(`**Starting the sprint!**\r\nYou have ${time} minutes!\r\n~ It runs until ${sprintEndMinute}m and ${minutesAndSeconds.getSeconds()}s ~`)
        }, ms(bufferStart))
        sprints[guildId].runningTimer = setTimeout(() => {
          sprints[guildId].isFinished = true
          message.channel.send(`**Finished the sprint!**\r\nGive your final word count with \`${prefix}wc <wordcount>\`.\r\nYou have ${bufferEnd} minutes!`)
        }, ms(bufferStart) + ms(time))
        sprints[guildId].resultsTimer = setTimeout(() => {
          let results = [...sprints[guildId].sprinters]
            .sort((a, b) => a.delta < b.delta ? -1 : a.delta > b.delta ? 1 : 0)
            .map((author, index) => `${index + 1}. ${author} with ${author.delta} new words (${Math.round(author.delta / time, 2)} wpm)`)
            .join('\r\n')
          sprints[guildId].isFinished = false
          message.channel.send(`The results are in:\r\n${results}`)
        }, ms(bufferStart) + ms(time) + ms(bufferEnd))
        return null

      case 'join':
        if (!sprints[guildId].isStarting) return message.reply(`there's no sprint currently started, start one using \`${prefix}sprint\``)
        let wordcount = parseInt(args[0]) || 0
        let i = sprints[guildId].sprinters.findIndex(s => s.author.username === author.username)
        if (i > -1) {
          sprints[guildId].sprinters[i].wordcount = wordcount
          return message.reply(`updated join with ${wordcount} starting words`)
        }
        sprints[guildId].sprinters.push({ author, wordcount: wordcount, delta: 0, wpm: 0 })
        return message.reply(`joined with ${wordcount} starting words`)

      case 'cancel':
        if (!sprints[guildId].isStarting) return message.reply(`there's no sprint currently started, start one using \`${prefix}sprint\``)
        sprints[guildId].sprinters = []
        sprints[guildId].isStarting = false
        sprints[guildId].isFinished = false
        clearTimeout(sprints[guildId].startingTimer)
        clearTimeout(sprints[guildId].runningTimer)
        clearTimeout(sprints[guildId].resultsTimer)
        return message.reply(`**Sprint has been canceled!**\r\nStart a new one with \`${prefix}sprint\``)

      case 'wc':
        if (!sprints[guildId].isFinished) return message.reply(`The sprint is still running! Try again later`)
        if (!parseInt(args[0])) return message.reply(errHelp)
        const wc = parseInt(args[0])
        let index = sprints[guildId].sprinters.findIndex(s => s.author.username === author.username)
        if (index == -1) return message.reply(`You need to join the sprint first! Use \`${prefix}join\``)
        const delta = wc - sprints[guildId].sprinters[index].wordcount
        sprints[guildId].sprinters[index].wordcount = wc
        sprints[guildId].sprinters[index].delta = delta
        return message.reply(`Completed with ${delta} new words!`)

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
        return message.reply(`I don't know that command. Use \`${prefix}help\` for a list of available commands`)
    }
  } catch (e) {
    console.warn('An error occured', e)
    message.reply(`Uh oh! Something didn't work right; try again in a bit!`)
  }
})

client.login(token)