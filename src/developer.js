const { RequiredArg, Command } = require("./commands");

const Discord = require("discord.js");
const { Console } = require("console");
const { inspect } = require("util");
const Stream = require("stream");
const VM = require('vm')

const globals = {
  DEBUG: {
    AVAILABLE_MODULES: [
      'assert', 'buffer',
      'crypto', 'events',
      'path', 'perf_hooks',
      'stream', 'string_decoder',
      'timers', 'url', 'util'
    ]
  }
};

const directives = new Map();

const description = /* TODO: improve numbering */ `
A more advanced, but developer-only version of \`&eval\`.

**Features**
1. access to the \`require\` function, though it is limited. this \`require\` wraps node's  \`require\`, so there are some differences:
  1.1. limited access to the stdlib.
  1.2. a custom \`debug:<name>\` namespace for debug-specific modules.
2. access to the \`message\` object.
3. access to some Xilef variables. this can is achieved using the \`debug:xilef\` custom module (See #1.2)
4. the \`DEBUG\` global object. it is a namespace for some debug information, such as:
  4.1. \`AVAILABLE_MODULES\`: lists available stdlib modules that can be accessed using \`require\`. (See #1.1)
  4.2. \`OPTIONAL_FEATURES\`: lists options enabled using the \`#enable\` directive. (See #5.1)
  4.3. \`VM_CONFIG\`: list the current vm's configuration. (See #5.2)
5. debug directives (\`// #directive\`), such as:
  5.1. \`#enable\`: enable an optional feature. it accepts these arguments:
    5.1.1. \`async\` - enable resolving a promise expression.
  5.2. \`vmconf\`: configure the vm used to execute the code. it accepts these arguments:
    5.2.1. \`timeout [number=1000]\` - set the vm's timeout to be \`number\`. if \`number\` is not supplied, it defaults to 1000.

**Notes**
- You MUST use a code block with the JavaScript language tag (either \`js\` or \`javascript\`)
- Globals that are not defined in the specification are omitted, such as \`setTimeout\`

Example:
&debug \`\`\`js
const {setTimeout} = require('timers');

// #vmconf timeout 2000
// #enable async

new Promise((resolve) => {
  setTimeout(() => {
    message.channel.send("From \`&debug\`: Hello, World!");
  }, 2100);
})
\`\`\`
`.trim()

/**
 * @typedef {object} EvaluatorOptions
 * @property {string[]?} EvaluatorOptions.stdlibs
 * @property {Record<string, unknown>?} EvaluatorOptions.customModules
 * @property {number?} EvaluatorOptions.timeout
 */

/**
 * **Evaluate a JavaScript code using node's `vm` module.**
 *
 * @param {string} code - The code string to evaluate.
 * @param {VM.Context} [globals] - Globals to put. May be used to override other variables.
 * @param {EvaluatorOptions} config - Configurations for use. Properties may include:
 * - **`stdlibs`** {`string[]`} - node standard library modules to put.
 * - **`customModules`** {`{[K: string]: unknown}`} - custom modules to put. these modules
 * - **`timeout`** {`{[K: string]: unknown}`} - the timout for the vm process.
 *   can be accessed by `require('debug:<module>')`
 * @returns - The result of the last expression in the code. May be a {@link Promise}.
 */
function evaluate(code, globals, config = {}) {
  const context = {
    require: new Proxy(require, {
      apply(target, thisArg, [name]) {
        if (typeof name != 'string')
          throw new TypeError("The 'id' argument must be of type string.")

        if (require('module').builtinModules.includes(name)) {
          if (config?.stdlibs?.includes(name)) {
            return Reflect.apply(target, thisArg, [name]);
          } else throw new Error(`module '${name}' is restricted`);
        } else if (name.startsWith('debug:')) {
          return config.customModules[name.slice(6).toLowerCase()]
        } else throw new Error(`module '${name}' does not exist`);
      },
      get(target, property, receiver) {
        if (['cache', 'main'].includes(property))
          return 'restricted'
        else return Reflect.get(target, property,receiver)
      }
    }),
    ...globals
  };

  return new VM.Script(code, {
    filename: 'evaluate',
  }).runInNewContext(context, {
    breakOnSigint: true,
    timeout: config.timeout ?? 1000
  });
}

Commands.debug = new Command(description, async function (message) {
  const features = {};
  globals.DEBUG.OPTIONAL_FEATURES = features;
  directives.set('enable', (args) => {
    features[args[0]] = true;
  })
  const vmConfig = {}
  globals.DEBUG.VM_CONFIG = vmConfig
  directives.set('vmconf', (args) => {
    vmConfig[args[0]] = args.slice(1)
  })

  try {
    /** @type {string} */
    const rawCode = message.content
      .slice(Prefix.get(message.guild.id).length + 5)
      .match(/```(?:js|javascript)\n([^]*)\n```/i)?.[1]

    if (rawCode == undefined)
      return void message.channel.send(`**error**: could not parse the code supplied.\n**hint**: you may have put a plain text instead of a javascript tagged code-block (see \`${Prefix.get(message.guild.id)}help debug\`).`)

    const directivesGathered = rawCode.split('\n')
      .filter((line) => line.startsWith('// #'))

    for (const directive of directivesGathered) {
      const [name, ...args] = directive.slice('// #'.length).split(/ +/g);

      if (directives.has(name)) directives.get(name)(args, rawCode)
      else throw new Error(`unknown directive: '#${name}'`)
    }

    const code = features.await
      ? `async function main() {${rawCode}}; main()`
      : rawCode;

    /** @type {string[]} */
    const stdout = []
    /** @type {string[]} */
    const stderr = []

    const context = {
      message,
      console: new Console(
        new Stream.Writable({ // stdout
          write(chunk, encoding, callback) {
            stdout.push(chunk);
            callback(null)
          }
        }),
        new Stream.Writable({ // stderr
          write(chunk, encoding, callback) {
            stderr.push(chunk);
            callback(null)
          }
        })
      ),
    }

    const customModules = {
      xilef: {
        debugmode, Time, Colors, GetPercentual, warning, /* index.js                         */
        Economy, Achievements,                           /* economy.js                       */
        RequiredArg, Command, Commands,                  /* commands.js                      */
        Stocks,                                          /* xilefunds.js                     */
        Prefix,                                          /* prefix.js                        */
        Polls, ButtonEvents,                             /* buttons                          */

        Amongus,                                         /* Minigames/crew.js                */
        Driller,                                         /* Minigames/driller.js             */
        Dungeon,                                         /* Minigames/dungeon.js             */
        Reversi,                                         /* Minigames/reversi.js             */
        Connect4,                                        /* Minigames/connect 4.js           */
        v_Types,                                         /* Minigames/v_roll.js              */
        MineSweeper,                                     /* Minigames/minesweeper.js         */
        Roshambo,                                        /* Minigames/rock paper scissors.js */
      }
    }
    globals.DEBUG.CUSTOM_MODULES = Object.keys(customModules)

    const result = await evaluate(code, { ...globals, ...context }, {
      stdlibs: globals.DEBUG.AVAILABLE_MODULES,
      customModules,
      timeout: Number(vmConfig.timeout?.[0]) || void 0
    });

    if (!(result == undefined && (stdout.length != 0 || stderr.length != 0))) {
      const expression = inspect(result).split('\n');
      /** @type {string[]} */
      const expressionPages = [];

      for (let i = 0, charc = 0,/** @type {string[]} */ stack = []; i < expression.length; i++) {
        const line = expression[i] + '\n'
        stack.push(line);
        charc += line.length;
        if (charc + line.length > 3950) {
          expressionPages.push(stack.join(''));
          stack = [];
          charc = 0;
        }
        if (i == expression.length - 1) {
          expressionPages.push(stack.join(''));
          stack = [];
          charc = 0;
        }
      }

      console.log(expressionPages.map(i => i.length));
      const expressionEmbeds = expressionPages.map(
        page => new Discord.MessageEmbed()
          .setColor('#0368f8')
          .setDescription('```js\n' + page + '\n```')
      )

      expressionEmbeds[0].setTitle('expression')

      for (const embed of expressionEmbeds) message.channel.send(embed)
    }

    if (stdout.length != 0) {
      const stdoutString = stdout.join('\n').split('\n')

      /** @type {string[]} */
      const stdoutPages = [];

      for (let i = 0, charc = 0,/** @type {string[]} */ stack = []; i < stdoutString.length; i++) {
        const line = stdoutString[i] + '\n';
        if (charc + line.length > 3950) {
          stdoutPages.push(stack.join(''));
          stack = [];
          charc = 0;
        }
        stack.push(line);
        charc += line.length;
        if (i == stdoutString.length - 1) {
          stdoutPages.push(stack.join(''));
          stack = [];
          charc = 0;
        }
      }

      const stdoutEmbeds = stdoutPages.map(
        page => new Discord.MessageEmbed()
          .setColor('#0368f8')
          .setDescription('```js\n' + page + '\n```')
      )

      stdoutEmbeds[0].setTitle('stdout')

      for (const embed of stdoutEmbeds) message.channel.send(embed)
    }

    if (stderr.length != 0) {
      const stderrString = stderr.join('\n').split('\n')

      /** @type {string[]} */
      const stderrPages = [];

      for (let i = 0, charc = 0,/** @type {string[]} */ stack = []; i < stderrString.length; i++) {
        const line = stderrString[i] + '\n';
        if (charc + line.length > 3950) {
          stderrPages.push(stack.join(''));
          stack = [];
          charc = 0;
        }
        stack.push(line);
        charc += line.length;
        if (i == stderrString.length - 1) {
          stderrPages.push(stack.join(''));
          stack = [];
          charc = 0;
        }
      }

      const stderrEmbeds = stderrPages.map(
        page => new Discord.MessageEmbed()
          .setColor('#0368f8')
          .setDescription('```js\n' + page + '\n```')
      )

      stderrEmbeds[0].setTitle('stderr')

      for (const embed of stderrEmbeds) message.channel.send(embed)
    }
  } catch (error) {
    console.error(error);
    message.channel.send(
      new Discord.MessageEmbed()
        .setColor('RED')
        .setTitle('error - debug')
        .setDescription('```\n' + error + '\n```')
    );
  }
}, 'Developer', [new RequiredArg(0, 'No code supplied.', 'code block', false)]);

Commands.rawset = new Command("Directly alter any value of someone's EconomySystem", (message, args) => {
	args[0] = message.mentions.users.first().id || args[0]
	const EconomySystem = Economy.getEconomySystem({id: args[0]})
	if (!args[3]) {
		switch (args[2][0]) {
			case "+":
				args[2] = EconomySystem[args[1]] + parseFloat(args[2].substring(1))
				break
			case "-":
				args[2] = EconomySystem[args[1]] - parseFloat(args[2].substring(1))
				break
			default:
				args[2] = parseFloat(args[2])
		}
	}
	EconomySystem[args[1]] = args[2]
	message.channel.send(EconomySystem.user + "'s value \"" + args[1] + "\" was set to " + args[2])
}, "Developer", [
	new RequiredArg(0, "Whose EconomySystem do you want to edit?", "user id"),
	new RequiredArg(1, "What variable do you want to edit?", "value name"),
	new RequiredArg(2, "What value should this new variable be set to?", "new value"),
	new RequiredArg(3, undefined, "not a number?", true)
])

const NewProcess = require('child_process').spawn;

Commands.shutdown = new Command("Shuts down the bot after a given time\nDeveloper only", (message, args) => {
    if (args[0]) {
        warning = args[0]
        client.user.setActivity(args[0] + ", ping me for info")
    }
    const timeleft = parseFloat(args[1]) * 60 * 1000
    console.log("- " + Colors.cyan.colorize("Shutdown initiated:") +
        "\n\tTime left: " + (timeleft ? (timeleft / 1000) + " seconds" : Colors.hyellow.colorize("None")) +
        "\n\tReason: " + (args[0] || Colors.hyellow.colorize("None")) +
        "\n\tRestart?: " + (args[2] ? "true" : "false"))
    setTimeout(() => {
        console.log("- Shutting down...")
        message.channel.send("Shutting down...").then(() => {
            if (args[2]) {
                message.channel.send("Shutdown/Restart Successful!").then(() => process.exit(0), 2500)
            }
        })
    }, timeleft || 0)
}, "Developer", [
    new RequiredArg(0, undefined, "message", true),
    new RequiredArg(1, undefined, "time", true),
    new RequiredArg(2, undefined, "restart?", true)
])

Commands.restart = new Command("Restarts the bot\n(internally calls `&shutdown`)", (message, args) => {
    Commands.shutdown.call(message, ["The bot is currently restarting", 0, true])
}, "Developer")