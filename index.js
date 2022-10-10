const { Client, MessageEmbed } = require('discord.js')
const { readConfig, writeConfig, rollDice, ms, random } = require('./utils')
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
  const { prefix, defaults, media } = await readConfig(guildId)
  const isAdmin = message.member.hasPermission('ADMINISTRATOR')
  const errHelp = `Hmm, not quite right. Use \`${prefix}help\` to try again`

  if (!content.startsWith(prefix) || author.bot) return

  if (!sprints[guildId]) sprints[guildId] = {
    sprinters: [],
    status: null,
    time: null,
    bufferStart: null,
    bufferEnd: null,
    startTime: null,
    startingTimer: null,
    runningTimer: null,
    finishingTimer: null
  }

  const state = sprints[guildId]
  const args = content.slice(prefix.length).trim().split(/ +/)
  const command = args.shift().toLowerCase()

  const start = async () => {
    state.status = 'running'
    state.startTime = new Date(new Date().getTime() + ms(state.time))
    const sprinters = state.sprinters.map(s => `${s.author}`).join(' ')
    await message.channel.send(`**Starting the sprint!**\r\nYou have ${state.time} minute(s) ${sprinters}`)
  }

  const run = async () => {
    state.status = 'finishing'
    const sprinters = state.sprinters.map(s => `${s.author}`).join(' ')
    const wmsg = { content: `**Finished the sprint!**\r\nGive your final word count with \`${prefix}wc <wordcount>\`.\r\nYou have ${state.bufferEnd} minute(s) ${sprinters}` }
    if (media.waiting.length > 0) wmsg.files = [media.waiting[random(media.waiting.length - 1, 0)]]
    await message.channel.send(wmsg)
  }

  const finish = async () => {
    state.status = null
    state.sprinters.sort((a, b) => a.delta > b.delta ? -1 : a.delta < b.delta ? 1 : 0)
    const results = state.sprinters
      .map((s, x) => `${x + 1}. ${s.author.username} with ${s.delta} new words (${Math.round(s.delta / state.time, 2)} wpm)`)
      .join('\r\n')
    await message.channel.send(`**The results are in!**\r\n${results}`)
    const passed = state.sprinters.filter(s => s.delta > 50).map(s => `${s.author}`).join(' ')
    if (passed.length > 0) {
      const pmsg = { content: `Great job! I'm so proud of you, ${passed}` }
      if (media.passed.length > 0) pmsg.files = [media.passed[random(media.passed.length - 1, 0)]]
      await message.channel.send(pmsg)
    }
    const failed = state.sprinters.filter(s => s.delta < 50).map(s => `${s.author}`).join(' ')
    if (failed.length > 0) {
      const fmsg = { content: `I thought you wanted to write, ${failed}` }
      if (media.failed.length > 0) fmsg.files = [media.failed[random(media.failed.length - 1, 0)]]
      await message.channel.send(fmsg)
    }
    clearState()
  }

  const clearState = () => {
    state.sprinters = []
    state.status = null
    state.startTime = null
    clearTimeout(state.startingTimer)
    clearTimeout(state.runningTimer)
    clearTimeout(state.finishingTimer)
  }

  try {
    const sprinterIndex = sprints[guildId].sprinters.findIndex(s => s.author.username === author.username)
    switch (command) {
      case '!clear':
        if (!isAdmin) return await message.reply({ content: `Sorry, only admins can run this command`, ephemeral: true })
        await message.delete()
        const fetched = await message.channel.messages.fetch({ limit: 99, cache: false })
        await message.channel.bulkDelete(fetched)
        return null

      case 'setdefault':
        if (!isAdmin) return await message.reply({ content: `Sorry, only admins can run this command`, ephemeral: true })
        if (!defaults.hasOwnProperty(args[0]) || !args[1]) return await message.reply({ content: errHelp, ephemeral: true })
        defaults[args[0]] = parseInt(args[1])
        await message.reply({ content: `Default ${args[0]} set to ${args[1]} minutes! Will apply on next sprint`, ephemeral: true })
        return await writeConfig(guildId, { prefix, defaults, media })

      case 'setmedia':
        if (!isAdmin) return await message.reply({ content: `Sorry, only admins can run this command`, ephemeral: true })
        if (!media.hasOwnProperty(args[0]) || !args[1]) return await message.reply({ content: errHelp, ephemeral: true })
        if (args[1] == 'add') {
          if (media[args[0]].findIndex(m => m == args[2]) > -1) return await message.reply({ content: `That image URI is already added`, ephemeral: true })
          media[args[0]].push(args[2])
          await message.reply({ content: `Added image to ${args[0]} collection!`, ephemeral: true })
          await writeConfig(guildId, { prefix, defaults, media })
        } else if (args[1] == 'list') {
          const list = `\r\n` + media[args[0]].map((u, x) => `[${x + 1}] ${u}`).join(`\r\n`)
          await message.reply({ content: list, ephemeral: true })
        } else if (args[1] == 'remove') {
          if (!media[args[0][args[2] - 1]]) return await message.reply({ content: `Sorry, that index doesn't exist`, ephemeral: true })
          media[args[0]].splice(args[2] - 1, 1)
          await message.reply({ content: `Removed image at index ${args[2]}`, ephemeral: true })
          await writeConfig(guildId, { prefix, defaults, media })
        }
        return null

      case 'sprint':
        if (state.status) return await message.reply({ content: `There's already a sprint ${state.status}! Join in using \`${prefix}join <wordcount>\``, ephemeral: true })
        state.status = 'starting'
        state.sprinters = []
        if (args.length == 1 && args[0].match(/\:(\d+)/)) {
          let diff = parseInt(args[0].slice(1)) - (new Date()).getMinutes()
          if (diff > 0) args[1] = diff
          else args[1] = Math.abs(diff + 60)
          args[0] = null
        } else if (args.length == 2 && args[1].match(/\:(\d+)/)) {
          let diff = parseInt(args[1].slice(1)) - (new Date()).getMinutes()
          if (diff > 0) args[1] = diff
          else args[1] = Math.abs(diff + 60)
        }
        state.time = (parseInt(args[0]) || defaults.time)
        state.bufferStart = (parseInt(args[1]) || defaults.bufferStart)
        state.bufferEnd = (parseInt(args[2]) || defaults.bufferEnd)
        await message.channel.send(`**New Sprint!**\r\nIn ${state.bufferStart} minute(s), we're going to be sprinting for ${state.time} minute(s).\r\nUse \`${prefix}join <wordcount>\` to join the sprint; leave out the wordcount to start from zero.`)

        state.startingTimer = setTimeout(start, ms(state.bufferStart))
        state.runningTimer = setTimeout(run, ms(state.bufferStart) + ms(state.time))
        state.finishingTimer = setTimeout(finish, ms(state.bufferStart) + ms(state.time) + ms(state.bufferEnd))
        return null

      case 'cancel':
        if (!state.status) return await message.reply({ content: `There's no sprint currently started, start one using \`${prefix}sprint\``, ephemeral: true })
        clearState()
        return await message.channel.send(`**Sprint has been canceled!**\r\nStart a new one with \`${prefix}sprint\``)

      case 'join':
        if (!state.status) return await message.reply({ content: `There's no sprint currently started, start a one using \`${prefix}sprint\``, ephemeral: true })
        if (state.status == 'finishing') return await message.reply({ content: `The sprint has already finished, start one using \`${prefix}sprint\``, ephemeral: true })
        const wordcount = Math.abs(parseInt(args[0])) || 0
        if (sprinterIndex > -1) {
          state.sprinters[sprinterIndex].wordcount = wordcount
          return await message.reply(`Updated join with ${wordcount} starting words`)
        }
        state.sprinters.push({ author, wordcount, delta: 0, wpm: 0 })
        return await message.reply(`Joined with ${wordcount} starting words`)

      case 'leave':
        if (sprinterIndex == -1) return await message.reply({ content: `You need to join a sprint to leave it! Use \`${prefix}join\` ${!state.status ? ' next sprint' : ''}`, ephemeral: true })
        state.sprinters.splice(sprinterIndex, 1)
        if (state.sprinters.length == 0) {
          clearState()
          return await channel.send(`Everyone left the current sprint! Canceling the sprint`)
        }
        return await message.reply(`Left the sprint`)

      case 'wc':
        if (!state.status) return await message.reply({ content: `There's no sprint currently running, start one using \`${prefix}sprint\``, ephemeral: true })
        if (state.status == 'starting') return await message.reply({ content: `The current sprint hasn't started yet! Use \`${prefix}join\` to join the sprint`, ephemeral: true })
        if (state.status == 'running') return await message.reply({ content: `The current sprint hasn't finished yet! Use \`${prefix}join\` to join the sprint`, ephemeral: true })
        if (!parseInt(args[0])) return await message.reply(errHelp)
        const wc = parseInt(args[0])
        if (sprinterIndex == -1) return await message.reply({ content: `You need to join the sprint first! Use \`${prefix}join\` ${!state.status ? ' next sprint' : ''}`, ephemeral: true })
        const delta = wc - state.sprinters[sprinterIndex].wordcount
        state.sprinters[sprinterIndex].wordcount = wc
        state.sprinters[sprinterIndex].delta = delta
        await message.reply(`Completed with ${delta} new words!`)
        const allSubmitted = state.sprinters.filter(s => s.delta != 0).length == state.sprinters.length
        if (allSubmitted) await finish()
        return null

      case 'roll':
        const diceRegex = /(\d+)?[d](\d+)/i
        if (!args[0]) return await message.reply({ content: rollDice(), ephemeral: true })
        if (args[0] && !diceRegex.test(args[0])) return await message.reply({ content: errHelp, ephemeral: true })
        let diceToRoll = args[0].split(diceRegex).filter(e => e !== '')
        if (diceToRoll[0] !== undefined) return await message.reply({ content: rollDice(diceToRoll[0], diceToRoll[1]).join(', '), ephemeral: true })
        return await message.reply({ content: rollDice(false, diceToRoll[1]), ephemeral: true })

      case 'time':
        if (!state.status && !state.startTime) return await message.reply({ content: `There's no sprint currently running, start one using \`${prefix}sprint\``, ephemeral: true })
        if (state.status == 'starting') return await message.reply({ content: `The current sprint hasn't started yet! Use \`${prefix}join\` to join the sprint`, ephemeral: true })
        const mins = Math.floor((state.startTime - new Date()) / 1000 / 60)
        return await message.reply(`${mins} minutes left in the sprint!`)

      case 'help':
        const defs = [
          'sprint',
          'sprint <time>',
          'sprint <time> <bufferStart>',
          'sprint <time> <bufferStart> <bufferEnd>',
          'sprint :<interval>',
          'sprint <time> :<interval>',
          'join',
          'join <wordcount>',
          'leave',
          'time',
          'cancel',
          'wc <count>',
          'roll',
          'roll d<sides>',
          'roll <amount>d<sides>',
          'setdefault time|bufferStart|bufferEnd <minutes>',
          'setmedia waiting|passed|failed add <url>',
          'setmedia waiting|passed|failed list',
          'setmedia waiting|passed|failed remove <index>'
        ]
        return await message.reply(new MessageEmbed()
          .setTitle(`Hi, I'm Sprinty!`)
          .setDescription(`Here's all the commands I can run:\r\n\`\`\`${defs.map(d => `${prefix}${d}`).join(`\r\n`)}\`\`\``))

      default:
        return await message.reply({ content: `Sorry, I don't know that command. Use \`${prefix}help\` for a list of available commands`, ephemeral: true })
    }
  } catch (e) {
    console.warn('An error occured', e)
    await message.reply({ content: `Uh oh! Something didn't work right; try again in a bit!`, ephemeral: true })
  }
})

client.login(token)
