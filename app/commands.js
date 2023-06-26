import { readConfig, writeConfig, ms, random, isAdmin, rollDice } from './utils.js'
import { hideLinkEmbed } from 'discord.js'
import Sprint from './sprint.js'

const state = {}

export const startSprint = async (msg, args) => {
  if (state[msg.guildId]) return msg.reply(`There is already an active sprint`)
  const { prefix, defaults } = await readConfig(msg.guildId)
  if (args.length == 1 && args[0].match(/^\:(\d+)$/)) {
    let diff = parseInt(args[0].slice(1)) - (new Date()).getMinutes()
    if (diff > 0) args[1] = diff
    else args[1] = Math.abs(diff + 60)
    args[0] = null
  } else if ((args.length == 2 || args.length == 3) && args[1].match(/^\:(\d+)$/)) {
    let diff = parseInt(args[1].slice(1)) - (new Date()).getMinutes()
    if (diff > 0) args[1] = diff
    else args[1] = Math.abs(diff + 60)
  } else if (args.length > 0 && !args.join('').match(/^(\d|:)+$/)) {
    return await message.reply(`Oops! One of your arguments wasn't a number or time interval. Try again`)
  }
  state[msg.guildId] = new Sprint()
  state[msg.guildId].status = 1
  state[msg.guildId].runTime = (parseInt(args[0]) || defaults.runTime)
  state[msg.guildId].bufferStart = (parseInt(args[1]) || defaults.bufferStart)
  state[msg.guildId].bufferEnd = (parseInt(args[2]) || defaults.bufferEnd)
  await msg.channel.send(`**New Sprint!**\r\nIn ${state[msg.guildId].bufferStart} minute(s), we're going to be sprinting for ${state[msg.guildId].runTime} minute(s)${state[msg.guildId].bufferEnd != defaults.bufferEnd ? `, with a ${state[msg.guildId].bufferEnd} minute(s) ending buffer` : ''}.\r\nUse \`${prefix}join <wordcount>\` to join the sprint; leave out the wordcount to start from zero.`)
  state[msg.guildId].startingTimer = setTimeout(
    () => runSprint(msg, args),
    ms(state[msg.guildId].bufferStart)
  )
}

const runSprint = async (msg, args) => {
  state[msg.guildId].status = 2
  await msg.channel.send(`**Starting the sprint!**\r\nYou have ${state[msg.guildId].runTime} minute(s) ${state[msg.guildId].sprintersToString()}`)
  state[msg.guildId].startTime = Date.now()
  state[msg.guildId].runningTimer = setTimeout(
    () => endSprint(msg, args),
    ms(state[msg.guildId].runTime)
  )
}

const endSprint = async (msg, args) => {
  const { prefix, media } = await readConfig(msg.guildId)
  state[msg.guildId].status = 3
  await msg.channel.send({
    content: `**Finished the sprint!**\r\nGive your final word count with \`${prefix}wc <wordcount>\`.\r\nYou have ${state[msg.guildId].bufferEnd} minute(s) ${state[msg.guildId].sprintersToString()}`,
    files: media.waiting.length > 0 ? [media.waiting[random(media.waiting.length - 1, 0)]] : []
  })
  state[msg.guildId].endingTimer = setTimeout(
    () => showSprintResults(msg, args),
    ms(state[msg.guildId].bufferEnd)
  )
}

const showSprintResults = async (msg, args) => {
  const { media } = await readConfig(msg.guildId)
  state[msg.guildId].status = null
  state[msg.guildId].sprinters
    .sort((a, b) => a.delta > b.delta ? -1 : a.delta < b.delta ? 1 : 0)
  const results = state[msg.guildId].sprinters
    .map((s, x) => `${x + 1}. ${s.author.username} with ${s.delta} new words (${Math.round(s.delta / state[msg.guildId].runTime, 2)} wpm)`)
    .join('\r\n')
  if (results) await msg.channel.send(`**The results are in!**\r\n${results}`)
  else await msg.channel.send(`**No results to show**`)
  const passed = state[msg.guildId].sprinters
    .filter(s => s.delta > 50)
    .map(s => `${s.author}`)
    .join(' ')
  if (passed.length > 0) await msg.channel.send({
    content: `Great job! I'm so proud of you, ${passed}`,
    files: media.passed.length > 0 ? [media.passed[random(media.passed.length - 1, 0)]] : []
  })
  const failed = state[msg.guildId].sprinters
    .filter(s => s.delta < 50)
    .map(s => `${s.author}`)
    .join(' ')
  if (failed.length > 0) await msg.channel.send({
    content: `I thought you wanted to write... ${failed}`,
    files: media.failed.length > 0 ? [media.failed[random(media.failed.length - 1, 0)]] : []
  })
  clearTimeouts(msg)
  delete state[msg.guildId]
}

export const clearTimeouts = (msg) => {
  clearTimeout(state[msg.guildId].startingTimer)
  clearTimeout(state[msg.guildId].runningTimer)
  clearTimeout(state[msg.guildId].endingTimer)
}

export const cancelSprint = async (msg, args) => {
  if (!state[msg.guildId]) return msg.reply(`No active sprints to cancel`)
  const { prefix } = await readConfig(msg.guildId)
  clearTimeouts(msg)
  delete state[msg.guildId]
  await msg.channel.send(`**Sprint has been canceled!**\r\nStart a new one with \`${prefix}sprint\``)
}

export const joinSprint = async (msg, args) => {
  if (!state[msg.guildId]) return msg.reply(`No active sprints to join`)
  if (!state[msg.guildId].isActive()) return msg.reply(`Current sprint hasn't started or has just ended`)
  const wordcount = Math.abs(parseInt(args[0])) || 0
  const result = state[msg.guildId].addSprinter(msg.author, wordcount)
  if (result === 2) await msg.reply(`Updated starting words to ${wordcount}`)
  else await msg.reply(`Joined with ${wordcount} starting words`)
}

export const leaveSprint = async (msg, args) => {
  if (!state[msg.guildId]) return msg.reply(`No active sprints to leave`)
  if (!state[msg.guildId].isActive()) return msg.reply(`Current sprint hasn't started or has just ended`)
  const wordcount = Math.abs(parseInt(args[0])) || 0
  state[msg.guildId].removeSprinter(msg.author)
  await msg.reply(`Left current sprint. See you next time!`)
  if (state[msg.guildId].sprinters.length === 0) {
    await msg.channel.send(`Everyone left the current sprint; auto-cancelling`)
    cancelSprint(msg)
  }
}

export const setWordCount = async (msg, args) => {
  if (!state[msg.guildId]) return msg.reply(`No active sprints to complete`)
  if (!state[msg.guildId].isActive()) return msg.reply(`Current sprint hasn't started or has just ended`)
  const sprinterIndex = state[msg.guildId].getSprinter(msg.author)
  if (sprinterIndex === false) return msg.reply(`You must join a sprint first to use that command`)
  if (!args[0]) return msg.reply(`Missing word count argument`)
  const wc = parseInt(args[0])
  const delta = wc - state[msg.guildId].sprinters[sprinterIndex].wordcount
  state[msg.guildId].sprinters[sprinterIndex].wordcount = wc
  state[msg.guildId].sprinters[sprinterIndex].delta = delta
  await msg.reply(`Completed with ${delta} new words!`)
  const allSubmitted = state[msg.guildId].sprinters
    .filter(s => s.delta != 0).length == state[msg.guildId].sprinters.length
  if (allSubmitted) {
    await msg.channel.send(`**Everyone's finished the sprint early!**`)
    showSprintResults(msg)
  }
}

export const getTimeLeft = async (msg, args) => {
  if (!state[msg.guildId]) return msg.reply(`No active sprints`)
  if (!state[msg.guildId].isRunning()) return msg.reply(`Current sprint hasn't started or has just ended`)
  const mins = Math.floor((Date.now() - state[msg.guildId].startTime) / 60000)
  msg.reply(`${mins} left in the current sprint`)
}

export const clearChannel = async (msg, args) => {
  if (!isAdmin(msg)) return await msg.reply(`Sorry, only admins can run this command`)
  const { prefix } = await readConfig(msg.guildId)
  const deleteMessages = async (msg, total = 0) => {
    let fetched = await msg.channel.messages.fetch({ limit: 99, cache: false })
    fetched = fetched.filter(m => {
      if (m.content[0] == prefix) return true
      if (m.author.bot && m.author.username == 'Sprinty') {
        if (args[0] == 'all') return true
        return !m.content.match('results')
      }
    })
    if (fetched.size == 0) return total
    try {
      const results = await msg.channel.bulkDelete(fetched, false)
      return await deleteMessages(msg, total + (results?.size || 0))
    } catch (e) {
      return await deleteMessages(msg, total)
    }
  }
  const count = await deleteMessages(msg)
  console.log(`↪ deleted ${count} messages`)
}

export const setDefault = async (msg, args) => {
  if (!isAdmin(msg)) return await msg.reply(`Sorry, only admins can run this command`)
  const config = await readConfig(msg.guildId)
  if (!config.defaults.hasOwnProperty(args[0]) || !args[1]) return await msg.reply(`Invalid input, try again`)
  config.defaults[args[0]] = parseInt(args[1])
  await writeConfig(msg.guildId, config)
  await msg.reply(`Default for '${args[0]}' set to ${args[1]} minutes. Will apply on next sprint`)
}

export const getDefaults = async (msg, args) => {
  if (!isAdmin(msg)) return await msg.reply(`Sorry, only admins can run this command`)
  const config = await readConfig(msg.guildId)
  await msg.reply(`${Object.keys(config.defaults).map(d => `${d} = ${config.defaults[d]} minutes`).join('\r\n')}`)
}

export const setMedia = async (msg, args) => {
  if (!isAdmin(msg)) return await msg.reply(`Sorry, only admins can run this command`)
  const config = await readConfig(msg.guildId)
  if (!config.media.hasOwnProperty(args[0]) || !args[1] || !args[2]) return await msg.reply(`Invalid input, try again`)
  if (args[1] == 'add' && args[2]) {
    if (!args[2].match(/^https/i)) return msg.reply(`Only media served over HTTPS is allowed`)
    config.media[args[0]].push(args[2])
  } else if (args[1] == 'drop' && parseInt(args[2])) {
    if (parseInt(args[2] > config.media[args[0]].length - 1)) return msg.reply(`Index out of range, try again`)
    config.media[args[0]].splice(parseInt(args[2]), 1)
  }
  await writeConfig(msg.guildId, config)
}

export const getMedia = async (msg, args) => {
  if (!isAdmin(msg)) return await msg.reply(`Sorry, only admins can run this command`)
  const config = await readConfig(msg.guildId)
  if (!config.media.hasOwnProperty(args[0])) return msg.reply(`Invalid input, try again`)
  await msg.reply(`${config.media[args[0]].map((m, x) => `${x}: ${hideLinkEmbed(m)}`).join('\r\n')}`)
}

export const randomDiceRoll = async (msg, args) => {
  const diceRegex = /(\d+)?[d](\d+)/i
  if (!args[0]) return await msg.reply(rollDice())
  if (args[0] && !diceRegex.test(args[0])) return await msg.reply(`Invalid input, try again`)
  let diceToRoll = args[0].split(diceRegex).filter(e => e !== '')
  if (diceToRoll[0] !== undefined) return await msg.reply(rollDice(diceToRoll[0], diceToRoll[1]))
  return await msg.reply(rollDice(false, diceToRoll[1]))
}

export const getHelp = async (msg) => {
  const link = hideLinkEmbed('https://github.com/ginger-tek/sprinty#commands')
  await msg.reply(`You can find a list of all available commands in the docs:\r\n${link}`)
}

export const cmdNotFound = async (msg) => {
  await msg.reply(`Sorry, that's not a command I recognize. Please try again`)
}

export default {
  startSprint,
  cancelSprint,
  joinSprint,
  leaveSprint,
  getTimeLeft,
  setWordCount,
  clearChannel,
  setDefault,
  getDefaults,
  setMedia,
  getMedia,
  randomDiceRoll,
  getHelp,
  cmdNotFound
}