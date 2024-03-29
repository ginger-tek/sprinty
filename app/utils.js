import fs from 'fs/promises'
import { PermissionsBitField } from 'discord.js'

export const defaultConfig = {
  prefix: '_',
  defaults: {
    runTime: 15,
    bufferStart: 1,
    bufferEnd: 3
  },
  media: {
    waiting: [],
    passed: [],
    failed: []
  }
}

export async function readConfig(guildId) {
  const path = `data/${guildId}.json`
  try { await fs.access(path) } catch (e) {
    await writeConfig(guildId, defaultConfig)
  }
  return JSON.parse(await fs.readFile(path, 'utf8'))
}

export async function writeConfig(guildId, data) {
  const path = `data/${guildId}.json`
  await fs.writeFile(path, JSON.stringify(data, null, 2))
  return true
}

export function random(max, min = 0) {
  return Math.round(Math.random() * (max - min) + min)
}

export function rollDice(quantity, type) {
  if (quantity && type) {
    let result = []
    for (let i = 0; i < quantity; i++) {
      result.push(random(type, 1))
    }
    return quantity + 'xD' + type + ': ' + result.sort((a, b) => a - b).join(', ')
  } else if (type) {
    return 'D' + type + ': ' + random(type, 1)
  } else {
    return 'D6: ' + random(6, 1)
  }
}

export function isAdmin(msg) {
  return msg.member.permissions.has(PermissionsBitField.Flags.Administrator)
}

export function ms(t) {
  return t * 60000
}

export const logger = {
  log(...args) {
    console.log(new Date().toISOString(), ...args)
  },
  wrn(...args) {
    console.warn(new Date().toISOString(), ...args)
  },
  err(...args) {
    console.error(new Date().toISOString(), ...args)
  }
}

export default {
  readConfig,
  writeConfig,
  random,
  rollDice,
  logger,
  ms
}