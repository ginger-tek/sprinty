import 'dotenv/config'
import { Client, Events, GatewayIntentBits } from 'discord.js'
import { handleMessage } from './app/handlers.js'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
})

client.once(Events.ClientReady, c => {
  console.clear()
  console.log(`Ready! Logged in as ${c.user.tag}`)
  console.log('Sprinty Operational!')
})

client.on(Events.MessageCreate, handleMessage)

if (!process.env.TOKEN) {
  console.error('Missing Discord Bot Token')
} else client.login(process.env.TOKEN)
