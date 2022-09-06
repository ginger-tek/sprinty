<img src="https://raw.githubusercontent.com/jpmoormann/sprinty/main/Sprinty-logo.png" style="width:100px;display:block"/>

# sprinty
A *better* writers' sprint bot - Run writing sprints with your friends or writing group, and share your word counts.

Built using Node.js + discord.js

## Host Config
To host your own, add a `config.json` file in the root, and add in your token:
```
{
  "token": "YOUR_BOT_TOKEN"
}
```

## App Config
Each registration of Sprinty gets its own config by guildId when added to a server. Each config has the following default properties that can be updated via the `setdefault` command.

|Property|Default Value|Description|
|---|---|---|
|`time`|`15`|How many minutes the sprint will run|
|`bufferStart`|`1`|How many minutes before the sprint starts|
|`bufferEnd`|`3`|How many minutes between when the sprint ends and before the results are shown|

## Commands
|Command|Description|
|---|---|
|`sprint`|Start a sprint using the default settings|
|`sprint <minutes>`|Start a sprint with a specified length of time|
|`sprint <minutes> <buffer>`|Start a sprint with a specified length of time, and start buffer|
|`setdefault time\|bufferStart\|bufferEnd <minutes>`|Set a new value for one of the default properties|
|`join`|Join the current sprint with 0 startings words|
|`join <wordcount>`|Join the current sprint with a specified number of starting words. Use any time during a sprint to update your word count|
|`cancel`|Cancel the current sprint|
|`wc <count>`|Submit your final word count |
|`roll`|Rolls a D6 dice|
|`roll d<sides>`|Rolls an n-sided dice|
|`roll <amount>d<sides>`|Rolls a specified number of n-sided die|