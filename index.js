const { Client, Intents, MessageEmbed } = require('discord.js')
const { prefix, token } = require('./config.json')
const fs = require('fs').promises

const client = new Client()

let sprinters = []
let sprintObjectStarting
let sprintObjectRunning
let sprintIsStarting = false
let sprintIsFinished = false

client.once('ready', () => {
  console.clear()
  console.log(`Logged in as ${client.user.tag}`)
  console.log('Sprinty Operational!')
})

client.on('message', async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return

  console.log(`${message.author.username} => ${message.content}`)

  try {
    const args = message.content.slice(prefix.length).trim().split(/ +/)
    const command = args.shift().toLowerCase()
    const diceRegex = /(\d+)?[d](\d+)/i

    switch(command) {    
      case 'setdefault':
        const data = JSON.parse(await fs.readFile('./sprintConfig.json'))
        if(!data.hasOwnProperty('default'+args[0]) || !parseInt(args[1])) return message.reply(`Sorry, that setting was invalid`)
        data['default'+args[0]] = parseInt(args[1])
        await fs.writeFile('./sprintConfig.json', JSON.stringify(data, null, 4))
        return message.reply(`Default ${args[0].toLowerCase()} set to ${args[1]} minutes! Will apply on next sprint`)
      
      case 'sprint':
        if (sprintIsStarting) return message.reply(`There's already a sprint running! Join in using ${prefix}join #`)
        sprintIsStarting = true
        sprinters = []
        message.channel.send('Sprinting!')
        if (args[0] && args[1]) await sprint(message, parseInt(args[0]), parseInt(args[1]))
        else if (args[0]) await sprint(message, parseInt(args[0]))
        else await sprint(message)
        return null
        
      case 'join':
        if (!sprintIsStarting) return message.reply(`There's no sprint currently started, start one by typing ${prefix}sprint`)
        if (parseInt(args[0])) addAndUpdateSprinters(message, args[0])
        else addAndUpdateSprinters(message)
        return null
        
      case 'cancel':
        sprintIsStarting = false
        clearTimeout(sprintObjectStarting)
        clearTimeout(sprintObjectRunning)
        return message.reply(`Sprint has been canceled! Start a new one with ${prefix}sprint <time>`)
        
      case 'wc':
        if (!sprintIsFinished) return message.reply(`The sprint is still running! Try again later`)
        if (!parseInt(args[0])) return message.reply(`I didn't catch that, try again!`)
        index = sprinters.findIndex((sprinter) => sprinter.name === message.author.username)
        if(index == -1) return message.reply(`You need to join the sprint first! Use ${prefix}join`)
        delta = parseInt(args[0]) - sprinters[index].wordcount
        sprinters[index].wordcount = args[0]
        sprinters[index].delta = delta
        return message.reply(`Completed with ${delta} new words!`)
        
      case 'roll':
        if (args[0] && diceRegex.test(args[0])) {
          let diceToRoll = args[0].split(diceRegex).filter(e => e !== '')
          if (diceToRoll[0] !== undefined) return message.reply(rollDice(diceToRoll[0], diceToRoll[1]).join(', '))
          else return message.reply(rollDice(false, diceToRoll[1]))
        } else if (args[0] && !diceRegex.test(args[0])) return message.reply(`Roll a specific die or dice by writing ${prefix}roll d# or ${prefix}roll #d#`)
        else return message.reply(rollDice())

      case 'help':
        const embed = new MessageEmbed()
        .setTitle(`Hi, I'm Sprinty!`)
        .setDescription(`Here's some things you can have me do (# = integer):
\`\`\`
${prefix}sprint
${prefix}sprint #(time)
${prefix}sprint #(time) #(buffer)
${prefix}setdefault <Time|BufferStart|BufferEnd> #(value)
${prefix}join
${prefix}join #(word count)
${prefix}cancel
${prefix}wc #(word count)
${prefix}roll
${prefix}roll d#(die number)
${prefix}roll #(die amount)d#(die number)
\`\`\``)
        return message.reply(embed)

      default:
        return message.reply(`Hmm, I don't know that command. Use ${prefix}help for a list of available commands`)
    }
  } catch(e) {
    console.warn('An error occured', e)
    message.reply(`Uh oh! Something didn't work right. Try again`)
  }
})

client.login(token)

// Functions
async function sprint(message, time, bufferStart, bufferEnd) {
  const { defaultTime, defaultBufferStart, defaultBufferEnd } = JSON.parse(await fs.readFile('./sprintConfig.json'))

  if(!time) time = defaultTime
  if(!bufferStart) bufferStart = defaultBufferStart
  if(!bufferEnd) bufferEnd = defaultBufferEnd

  let sprintingTime = time * 60 * 1000
  let startingBufferTime = bufferStart * 60 * 1000
  let endingBufferTime = bufferEnd * 60 * 1000

  if (sprintIsStarting) {
    await message.channel.send(`In ${startingBufferTime / 60 / 1000} minutes, we're going to be sprinting for ${time} minutes.\r\nUse ${prefix}join <wordcount> to join the sprint, leave out the wordcount to start from zero.`)
    // Starting sprint message
    sprintObjectStarting = setTimeout(() => {
      sprintIsStarting = false
      minutesAndSeconds = new Date()
      let sprintEndMinute = (parseInt(minutesAndSeconds.getMinutes()) + time) % 60
      message.channel.send(`**Starting the sprint!**\r\nYou have ${time} minutes!\r\n~ It runs until ${sprintEndMinute}m and ${minutesAndSeconds.getSeconds()}s ~`)
    }, startingBufferTime)

    // Finishing sprint message
    sprintObjectRunning = setTimeout(() => {
      sprintIsFinished = true
      message.channel.send(`Finished the sprint, give your final word count with ${prefix}wc #.\r\nYou have ${endingBufferTime / 60 / 1000} minutes!`)
    }, startingBufferTime + sprintingTime)

    // Results of sprint message
    setTimeout(() => {
      message.channel.send(`The results are in:\r\n${finishedList(time)}`)
      sprintIsFinished = false
    }, startingBufferTime + sprintingTime + endingBufferTime)
  }
}

function addAndUpdateSprinters(message, wordcount) {
  if (!wordcount) wordcount = 0
  const author = message.author.username
  if (sprinters.length != 0) {
    if (sprinters.reduce((a, e) => e.name === author).length > 0) {
      index = sprinters.findIndex((sprinter) => sprinter.name === author)
      sprinters[index].wordcount = wordcount
      return message.reply(`updated join with ${wordcount} starting words`)
    }
  } else {
    sprinters.push({ name: author, wordcount: wordcount, delta: 0, wpm: 0 })
    return message.reply(`joined with ${wordcount} starting words`)
  }
}

function finishedList(time) {
  sprinters.sort((a, b) => {
    let wcA = a.delta
    let wcB = b.delta
    if (wcA < wcB) return -1
    if (wcA > wcB) return 1
    return 0
  })
  let result = sprinters.map((author, index) => {
    return `${index + 1}. ${author.name} with ${author.delta} new words, (${author.delta / time} wpm)`
  })
  return result.join('\r\n')
}

function rollDice(quantity, type) {
  if (quantity && type) {
    let result = []
    for (let i = 0; i < quantity; i++) {
      result.push(random(type, 1))
    }
    return result.sort((a, b) => a - b)
  } else if (type) {
    return random(type, 1)
  } else {
    return random(6, 1)
  }
}

function random(max, min = 0) {
  return Math.round(Math.random() * (max - min) + min)
}