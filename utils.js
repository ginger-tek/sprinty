const fs = require('fs').promises

async function readConfig(guildId) {
  const path = `./guildConfigs/${guildId}.json`
  if(!!(await fs.access(path))) writeConfig(guildId, {
    prefix: '_',
    defaults: {
      time: 15,
      bufferStart: 1,
      bufferEnd: 3
    }
  })
  return JSON.parse(await fs.readFile(path))
}

async function writeConfig(guildId, data) {
  const path = `./guildConfigs/${guildId}.json`
  await fs.writeFile(path, JSON.stringify(data, null, 4))
  return true
}

function random(max, min = 0) {
  return Math.round(Math.random() * (max - min) + min)
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

function ms(t) {
  return t * 60 * 1000
}

module.exports = {
  readConfig,
  writeConfig,
  random,
  rollDice,
  ms
}