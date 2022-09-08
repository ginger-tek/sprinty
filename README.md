<img src="https://raw.githubusercontent.com/jpmoormann/sprinty/main/Sprinty-logo.png" style="width:150px;display:block"/>

# sprinty
A *better* writers' sprint bot - Run writing sprints with your friends or writing group, and share your word counts.

Built using Node.js + discord.js

## Host Config
To host your own Sprinty, add a `config.json` file in the root with your bot token:
```json
{
  "token": "YOUR_BOT_TOKEN"
}
```

## App Config
Each config has the following default properties that can be updated via the `setdefault` command.

|Property|Default Value|Description|
|---|---|---|
|`time`|`15`|How many minutes the sprint will run|
|`bufferStart`|`1`|How many minutes before the sprint starts|
|`bufferEnd`|`3`|How many minutes between when the sprint ends and before the results are shown|

There are also three media collections to store image URI's that are randomly picked to show during different stages of a sprint.

|Collection|Description|
|---|---|
|`waiting`|Shown during the ending buffer when everyone is entering their final word counts|
|`passed`|Shown after a the results of a sprint for sprinters who surpassed their word count|
|`failed`|Shown after a the results of a sprint for sprinters who came in under their word count|

## Commands
|Command|Description|
|---|---|
|`sprint`|Start a sprint using the default settings|
|`sprint <time>`|Start a sprint with a specified length of time|
|`sprint <time> <bufferStart>`|Start a sprint with a specified length of time, and start buffer|
|`sprint <time> <bufferStart> <bufferEnd>`|Start a sprint with a specified length of time, start buffer, and end buffer|
|`sprint :<interval>`|Start a sprint with default settings at the next time interval, i.e. `:45` would start at the next 45 minute on the clock. If the value is in the past, the default startBuffer is used as a fallback|
|`join`|Join the current sprint with 0 startings words|
|`join <wordcount>`|Join the current sprint with a specified number of starting words. Use any time during a sprint to update your word count|
|`wc <count>`|Submit your final word count |
|`roll`|Rolls a D6 dice|
|`roll d<sides>`|Rolls an n-sided dice|
|`roll <amount>d<sides>`|Rolls a specified number of n-sided die|

## Admin Commands
|Command|Description|
|---|---|
|`cancel`|Cancel the current sprint|
|`setdefault time\|bufferStart\|bufferEnd <minutes>`|Set a new value for one of the default timing properties|
|`setmedia waiting\|passed\|failed add <uri>`|Add a new image URI to one of the media collections|
|`setmedia waiting\|passed\|failed list`|List the image URI's for a given media collection|
|`setmedia waiting\|passed\|failed remove <index>`|Remove an existing image URI from a given media collection by its index|
