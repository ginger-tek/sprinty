<div style="text-align:center">
<img src="https://raw.githubusercontent.com/jpmoormann/sprinty/main/Sprinty-logo.png" style="margin:0 auto;width:150px;display:block"/>
<h1><strong>Sprinty</strong></h1>
<h2>A *better* writers' sprint bot</h2>

Run writing sprints with your friends or writing group, and share your word counts.

Built using Node.js + discord.js
</div>

## Host Config
To host your own Sprinty server, add a `.env` file in the root of the app, and add your bot token:
```
TOKEN=YOUR_BOT_TOKEN
```

## Guild Config
Guild configs are auto-generated on first sprint run, and each config has the following default properties that can be updated via the `setdefault` command.

|Property|Default Value|Description|
|---|---|---|
|`runTime`|`15`|How many minutes the sprint will run|
|`bufferStart`|`1`|How many minutes before the sprint starts|
|`bufferEnd`|`3`|How many minutes between when the sprint ends and before the results are shown|

There are also three media collections to store image URI's that are randomly picked to show during different stages of a sprint. These collections can be managed via the `setmedia` command.

|Collection|Description|
|---|---|
|`waiting`|Shown during the ending buffer when everyone is entering their final word counts|
|`passed`|Shown after a the results of a sprint for sprinters who surpassed their word count|
|`failed`|Shown after a the results of a sprint for sprinters who came in under their word count|

## Commands
|Command|Description|
|---|---|
|`_sprint`|Start a sprint using the default timing settings|
|`_sprint <time>`|Start a sprint with a specified length of time. Example: `_sprint 10` will start a 10min sprint|
|`_sprint <time> <bufferStart>`|Start a sprint with a specified length of time, and start buffer. Example: `_sprint 2 20` will start a 20min sprint in 2min|
|`_sprint <time> <bufferStart> <bufferEnd>`|Start a sprint with a specified length of time, start buffer, and end buffer. Example: `_sprint 5 15 3` will start a 15min sprint in 5min, and have a 3min ending buffer|
|`_sprint :<bufferStartInterval>`|Start a sprint with default settings at the next time interval, i.e. `:45` would start at the next 45 minute on the clock. If the interval is in the past, the next hour will be used + the minute interval|
|`_sprint <time> :<bufferStartInterval>`|Start a sprint with a specified time at the next time interval, i.e. `20 :45` would start a 20min sprint at the next 45 minute on the clock. If the interval is in the past, the next hour will be used + the minute interval|
|`_sprint <time> :<bufferStartInterval> <bufferEnd>`|Start a sprint with a specified time at the next time interval, i.e. `20 :45` would start a 20min sprint at the next 45 minute on the clock, with a specified ending buffer. If the interval is in the past, the next hour will be used + the minute interval|
|`_time`|Get the remaining time of the current sprint|
|`_cancel`|Cancel the current sprint|
|`_join`|Join the current sprint with 0 startings words|
|`_join <wordcount>`|Join the current sprint with a specified number of starting words. Use any time during a sprint to update your word count|
|`_leave`|Leave the current sprint|
|`_wc <count>`|Submit your final word count |
|`_roll`|Rolls a D6 dice|
|`_roll d<sides>`|Rolls an n-sided dice|
|`_roll <amount>d<sides>`|Rolls a specified number of n-sided die|
|`_help`|Responds with link to this command documentation|
|`_setdefault runTime\|bufferStart\|bufferEnd <minutes>`|(Admin) Set a new value for one of the default timing properties|
|`_getdefaults`|(Admin) List all the default timing property values|
|`_setmedia waiting\|passed\|failed add <uri>`|(Admin) Add a new image URI to one of the media collections|
|`_setmedia waiting\|passed\|failed drop <index>`|(Admin) Remove an existing image URI from a given media collection by its index as listed in the `getmedia` command|
|`_getmedia waiting\|passed\|failed`|(Admin) List the image URI's and their index for a given media collection|
|`_!clear`|(Admin) Clear out all Sprinty-related messages, both commands and responses, except for the sprint results. Use `all` for the first argument to include clearing sprint results|
