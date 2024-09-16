const { RequiredArg, Command } = require("./../commands.js")
const { Game, MPGame } = require("./../minigames.js")

class Entity {
    constructor(hp, mana, attack, defense, ai, name, isboss) {
        this.hp = hp
        this.mana = mana
        this.attack = attack
        this.defense = defense
        this.ai = ai
        this.name = name
        this.isboss = isboss
        this.castmsg = this.ai ? "The " + this.ai + " uses " : "You use "
        this.evmsg = this.ai ? "The " + this.ai + "'s " : "Your "
    }

    fight(Entity, damage) {
        let dmg = Math.floor(Math.max(damage - Entity.defense, 1))
        let old = Entity.hp
        Entity.hp = Entity.hp - dmg
        return (this.ai ? "The " + this.ai + " attacks you!" : "You attack " + Entity.ai + "!") + " (" + Math.max(old, dmg) + " damage dealt)"
    }

    think(DungeonGame) {
        const omana = this.mana
        let msg = "The " + this.ai + " does nothing.."
        if (Dungeon.thinkers[this.ai]) msg = Dungeon.thinkers[this.ai](DungeonGame, this)
        if (omana == this.mana) {
            this.mana = Math.min(this.mana + 10 * DungeonGame.floor, 2000)
        }
        return msg
    }
}

class Attack {
    constructor(name, cost, effect) {
        this.name = name
        this.cost = cost
        this.effect = effect
    }

    use(Attacker, Attacked) {
        if (Attacker.mana < this.cost) throw ("You need " + this.cost + " mana for this spell")
        Attacker.mana = Attacker.mana - this.cost
        return Attacker.castmsg + this.name + "!\n" + this.effect(Attacker, Attacked)
    }
}

class DungeonGame {
    constructor() {
        this.floor = 1
        this.cash = 0
        this.player = new Entity(100, 100, 40, 20)
        this.explored = 3
        this.enemies = []
    }

    get statmax() {
        return 300 + 10 * (this.floor - 1)
    }

    reset() {
        this.floor = 1
        this.cash = 0
        this.player = new Entity(100, 100, 40, 20)
        this.explored = 3
        this.enemies = []
    }

    getInfo(EconomySystem) {
        let InfoEmbed = new Discord.MessageEmbed()
            .setColor("#006400")
            .setTitle(EconomySystem.user + "'s Dungeon stats")
            .setTimestamp();
        let desc = "```js\nfloor: " + this.floor + " (best: " + EconomySystem.floor + ")" +
            "\ncash found: " + this.cash +
            "\nhealth: " + this.player.hp + "/2000" +
            "\nmana: " + this.player.mana + "/2000" +
            "\nattack: " + this.player.attack + "/" + this.statmax +
            "\ndefense: " + this.player.defense + "/" + this.statmax
        if (this.enemies.length) {
            desc = desc + "\n\nENEMIES:"
            for (let Enemy of this.enemies) {
                if (!Enemy) continue
                desc = desc + "\n" + Enemy.name + ": " + Enemy.hp + " hp left" + (Enemy.isboss ? " (BOSS!)" : "")
            }
        }
        desc = desc + "```"
        InfoEmbed.setDescription(desc)
        let map = []
        for (let i = 0; i < 2 + this.floor; i++) {
            map.push(i > this.explored ? "<:green_square:869976853090271323>" : i == this.explored ? "<:white_circle:869976843263045642>" : "<:brown_square:875834929034973224>")
        }
        InfoEmbed.addField("Current floor:", map.reverse().join(""))
        return InfoEmbed
    }
}

Dungeon = new Game(() => { return new DungeonGame() })
Dungeon.enemies = [
    [40, 0, 25, 0, "slime", "slime"],
    [55, 0, 30, 0, "zombie", "zombie"],
    [90, 0, 40, 5, "goblin", "goblin"],
    [80, 0, 60, 20, "skeleton", "skeleton"],
    [65, 0, 40, 10, "skeleton archer", "skeleton archer"],
    [75, 100, 50, 5, "skeleton mage", "skeleton mage"],
    [200, 0, 40, 0, "slime", "big slime"],
    [125, 125, 125, 0, "ghost", "ghost"],
    [400, 0, 90, 75, "goblin", "armored goblin"],
    [350, 0, 80, 60, "skeleton", "skeleton brute"],
    [150, 0, 110, 160, "mimic", "mimic"],
    [300, 150, 75, 69, "meme fanatic", "meme fanatic"],
    [400, 0, 100, 100, "golem", "mini golem"],
    [300, 175, 125, 40, "ghost", "spectre"],
    [500, 0, 25, 0, "slime", "abyss slime"],
    [600, 0, 200, 110, "golem", "golem"],
    [900, 200, 250, 150, "meme fanatic", "meme lunatic"],
    [1000, 175, 125, 40, "ghost", "great ghost"],
    [2000, 400, 250, 300, "golem", "power golem"],
    [3000, 2000, 300, 350, "Giygas clone", "Giygas clone", true],
    /*/TIER 2
    [400, 0, 250, 0, "slime"],
    [550, 0, 300, 0, "zombie"],
    [900, 0, 400, 50, "goblin"],
    [800, 0, 600, 200, "skeleton"],
    [650, 0, 400, 100, "skeleton archer"],
    [750, 1000, 500, 50, "skeleton mage"],
    [2000, 0, 400, 0, "slime"], //big slime
    [1250, 1250, 1250, 0, "ghost"],
    [4000, 0, 900, 750, "goblin"], //armored goblin
    [3500, 0, 800, 600, "skeleton"], //skeleton brute
    [1500, 0, 1100, 1600, "mimic"],
    [3000, 1500, 750, 690, "meme fanatic"],
    [4000, 0, 1000, 1000, "golem"], //mini golem
    [3000, 1750, 12500, 4000, "ghost"], //spectre
    [5000, 0, 2500, 0, "slime"], //abyss slime
    [6000, 0, 2000, 1100, "golem"],
    [9000, 2000, 2500, 1500, "meme fanatic"], //meme lunatic
    [10000, 1750, 1250, 400, "ghost"], //great ghost
    [20000, 4000, 2500, 3000, "golem"], //power golem
    [30000, 20000, 3000, 3500, "Supreme Calamitas clone", true],
    commented out cuz im too lazy to add names to them too considering they will be replaced*/
]
Dungeon.thinkers = {
    slime: (DungeonGame, Entity) => {
        if (GetPercentual() <= 20) {
            return Entity.fight(DungeonGame.player, Entity.attack)
        }
        return "The slime hops around.."
    },
    zombie: (DungeonGame, Entity) => {
        let msg = "The zombie becomes more vicious!\nThe zombie attack increased!\n"
        Entity.attack = Entity.attack * 1.1
        msg = msg + Entity.fight(DungeonGame.player, Entity.attack)
        return msg
    },
    goblin: (DungeonGame, Entity) => {
        if (GetPercentual() <= 20) {
            return "The goblin charges!\n" +
                Entity.fight(DungeonGame.player, Math.floor(Entity.attack / 2)) + "\n" +
                Entity.fight(DungeonGame.player, Math.floor(Entity.attack / 2)) + "\n" +
                Entity.fight(DungeonGame.player, Math.floor(Entity.attack / 2))
        }
        DungeonGame.cash = Math.max(DungeonGame.cash - 20, 0)
        return Dungeon.attacks.slash.use(Entity, DungeonGame.player) + "\nThe goblin steals some of your money!"
    },
    skeleton: (DungeonGame, Entity) => {
        if (DungeonGame.player.attack > Entity.defense * 1.5) {
            Entity.defense = Math.floor(Entity.defense * 1.5)
            return "The skeleton drinks..milk..\nThe skeleton defense increases!"
        }
        return Dungeon.attacks.slash.use(Entity, DungeonGame.player)
    },
    "skeleton archer": (DungeonGame, Entity) => {
        if (GetPercentual() <= 40) {
            return Entity.fight(DungeonGame.player, Entity.attack + DungeonGame.player.defense) + "\nIt's a perfect hit!"
        }
        return Entity.fight(DungeonGame.player, Entity.attack)
    },
    "skeleton mage": (DungeonGame, Entity) => {
        const chance = GetPercentual()
        if (chance <= 40 && Entity.mana >= 50) {
            return Dungeon.attacks.ice.use(Entity, DungeonGame.player)
        } else if (Entity.mana >= 25) {
            return Dungeon.attacks.fire.use(Entity, DungeonGame.player)
        } else {
            Entity.mana = Entity.mana + 75
            return "The skeleton mage recharges his wand..and recovers mana!"
        }
    },
    ghost: (DungeonGame, Entity) => {
        const chance = GetPercentual()
        if (chance <= 20) {
            DungeonGame.player.defense = Math.floor(DungeonGame.player.defense * 0.7)
            return "The ghost is stinky! You're disgusted!\nYour defense decreases!"
        } else if (chance <= 40 && Entity.mana >= 25) {
            return Dungeon.attacks.fire.use(Entity, DungeonGame.player)
        }
        return Entity.fight(DungeonGame.player, Entity.attack)
    },
    mimic: (DungeonGame, Entity) => {
        if (GetPercentual() <= 40) {
            return "The mimic transforms into DogeCoins!\n..you're smart enough to realize the trap."
        }
        return "The mimic transforms into DogeCoins!\nYou found some DogeCoin--\n" + Entity.fight(DungeonGame.player, Entity.attack)
    },
    "meme fanatic": (DungeonGame, Entity) => {
        if (DungeonGame.player.mana > Entity.mana + 50 && Entity.mana >= 50) {
            return Dungeon.attacks.ice.use(Entity, DungeonGame.player)
        } else if (Entity.mana >= 100) {
            return Dungeon.attacks.thunder.use(Entity, DungeonGame.player)
        } else {
            Entity.mana = Entity.mana + 75
            return "The meme fanatic recharges his meme power..and recovers mana!"
        }
    },
    golem: (DungeonGame, Entity) => {
        if (Entity.mana >= 100) {
            Entity.mana = Entity.mana - 100
            return "The golem uses Rock Throw!\n" + Entity.fight(DungeonGame.player, Entity.attack * 3)
        }
        return Dungeon.attacks.slash.use(Entity, DungeonGame.player)
    },
    "Giygas clone": (DungeonGame, Entity) => {
        if (GetPercentual() <= 50 && Entity.mana >= 175) {
            return "You cannot grasp the true form of Giygas attack!\n" +
                Dungeon.attacks.fire.use(Entity, DungeonGame.player) + "\n" +
                Dungeon.attacks.ice.use(Entity, DungeonGame.player) + "\n" +
                Dungeon.attacks.thunder.use(Entity, DungeonGame.player)
        }
        Entity.mana = Entity.mana + 75
        return "You cannot grasp the true form of Giygas attack!\n" + Entity.fight(DungeonGame.player, Entity.attack * 2)
    },
    "Supreme Calamitas clone": (DungeonGame, Entity) => {
        if (Entity.mana >= 200) {
            return Dungeon.attacks.fire.use(Entity, DungeonGame.player) + "\n" +
                Dungeon.attacks.fire.use(Entity, DungeonGame.player) + "\n" +
                Dungeon.attacks.fire.use(Entity, DungeonGame.player) + "\n" +
                Dungeon.attacks.fire.use(Entity, DungeonGame.player)
        }
        Entity.mana = 20000
        return "Supreme Calamitas recharges..and restores all of its mana!"
    },
}
Dungeon.attacks = {
    slash: new Attack("Slash", 0, (Attacker, Attacked) => {
        return Attacker.fight(Attacked, Attacker.attack)
    }),
    fire: new Attack("Fire Storm", 25, (Attacker, Attacked) => {
        const msg = Attacker.fight(Attacked, Math.floor(Attacker.attack * 0.6)) +
            "\n" + Attacked.evmsg + "defence decreased!"
        Attacked.defense = Math.floor(Attacked.defense * 0.7)
        return msg
    }),
    ice: new Attack("Ice Blast", 50, (Attacker, Attacked) => {
        const msg = Attacker.fight(Attacked, Math.floor(Attacker.attack * 1.4)) +
            "\n" + Attacked.evmsg + "mana decreased!"
        Attacked.mana = Math.floor(Attacked.mana * 0.6)
        return msg
    }),
    ground: new Attack("Earthquake", 75, (Attacker, Attacked) => {
        let DungeonGame
        for (let ID in Dungeon.list) {
            if (Dungeon.list[ID].player == Attacker) {
                DungeonGame = Dungeon.list[ID]
                break
            }
        }
        if (!DungeonGame) throw ("Could not find your game.")
        let msg = ""
        for (let Enemy of DungeonGame.enemies) {
            msg = msg + (msg == "" ? "" : "\n") + Attacker.fight(Enemy, Attacker.attack)
        }
        return msg
    }),
    thunder: new Attack("Thunder", 100, (Attacker, Attacked) => {
        const chance = GetPercentual()
        if (chance <= 30) return "..the attack misses!"
        const msg = Attacker.fight(Attacked, Math.floor(Attacker.attack * 2)) +
            "\n" + Attacked.evmsg + "attack decreased!\n" + Attacked.evmsg + "defense decreased!"
        Attacked.attack = Math.floor(Attacked.defense * 0.7)
        Attacked.defense = Math.floor(Attacked.defense * 0.7)
        return msg
    }),
}
Dungeon.help =
    "`&dungeon stats` say the stats of your current adventure\n" +
    "`&dungeon explore` explore the current floor in the dungeon and find treasures..or enemies!\n" +
    "`&dungeon ascend` go to the next floor\n" +
    "`&dungeon attack (type)` attack the current enemy, omit type for a list of all attacks\n" +
    "`&dungeon escape` attempt to escape from all current enemies, might fail\n" +
    "`&dungeon cashin` get all the DogeCoins you found, and reset the game"

Commands.dungeon = new Command("Find treasures and fight enemies\n\n" + Dungeon.help, (message, args) => {
    let EconomySystem = Economy.getEconomySystem(message.author)
    let DungeonGame = Dungeon.getGame(message.author.id, EconomySystem)
    args[0] = args[0].toLowerCase()
    switch (args[0]) {
        case "stats": {
            message.channel.send({ embeds: [DungeonGame.getInfo(EconomySystem)] })
            break
        }
        case "explore": {
            let ohp = DungeonGame.player.hp
            if (!DungeonGame.explored) {
                let InfoEmbed = DungeonGame.getInfo(EconomySystem)
                InfoEmbed.addField("Latest event:", "There is nothing left in this floor...")
                message.channel.send({ embeds: [InfoEmbed] })
                return
            }
            let msg = ""
            const random = GetPercentual()
            let doenemy = false
            if (random <= 20) {
                let cash = DungeonGame.floor * 25
                msg = "You find a treasure worth " + cash + " DogeCoins!"
                DungeonGame.cash = DungeonGame.cash + cash
            } else if (random <= 30) {
                msg = "You find an upgrade to your sword! Your attack increased!"
                DungeonGame.player.attack = Math.min(DungeonGame.player.attack + 5 * DungeonGame.floor, DungeonGame.statmax)
            } else if (random <= 40) {
                msg = "You find an upgrade to your shield! Your defense increased!"
                DungeonGame.player.defense = Math.min(DungeonGame.player.defense + 5 * DungeonGame.floor, DungeonGame.statmax)
            } else {
                doenemy = true
            }
            DungeonGame.explored = DungeonGame.explored - 1
            for (let Enemy of DungeonGame.enemies) {
                msg = msg + "\n" + Enemy.think(DungeonGame)
            }
            if (doenemy) {
                msg = msg + "\n"
                const loop = Math.min(Math.max(DungeonGame.floor - 19, 1), 5)
                for (let i = 1; i <= loop; i++) {
                    let enemyid = Math.min(Math.floor(Math.random() * (DungeonGame.floor + 1)), Dungeon.enemies.length - 1)
                    msg = msg + "You find a " + Dungeon.enemies[enemyid][4] + "!" + (i == loop ? "" : "\n")
                    DungeonGame.enemies.push(new Entity(...Dungeon.enemies[enemyid]))
                }
            }
            if (!DungeonGame.explored) {
                msg = msg + "\nIt seems that there is nothing left in this floor.."
            }
            if (ohp == DungeonGame.player.hp) {
                DungeonGame.player.hp = Math.min(DungeonGame.player.hp + Math.min(DungeonGame.floor, 50), 2000)
            }
            let InfoEmbed = DungeonGame.getInfo(EconomySystem)
            InfoEmbed.addField("Latest event:", msg)
            message.channel.send({ embeds: [InfoEmbed] })
            break
        }
        case "ascend": {
            if (DungeonGame.enemies.length) {
                message.channel.send("You can't ascend while monsters are attacking you!")
                return
            }
            if (DungeonGame.explored) {
                message.channel.send("You still haven't reached the end of this floor!")
                return
            }
            DungeonGame.floor = DungeonGame.floor + 1
            DungeonGame.explored = 2 + DungeonGame.floor
            let InfoEmbed = DungeonGame.getInfo(EconomySystem)
            InfoEmbed.addField("Latest event:", "You have reached floor " + DungeonGame.floor)
            message.channel.send({ embeds: [InfoEmbed] })
            break
        }
        case "attack": {
            if (!args[1] || !Dungeon.attacks[args[1]]) {
                message.channel.send((
                    "`&dungeon attack slash` the basic attack, costs 0\n" +
                    "`&dungeon attack fire` does slightly less damage but reduces enemy defense, costs 25\n" +
                    "`&dungeon attack ice` does slightly more damage and reduces enemy mana, costs 50\n" +
                    "`&dungeon attack ground` same damage as slash but hits all enemies, costs 75\n" +
                    "`&dungeon attack thunder` does double damage and reduces both enemy attack and defense, but has a 30% chance of missing, costs 100\n")
                    .replace(/\&/g, Prefix.get(message.guild.id))
                )
                return
            }
            if (!DungeonGame.enemies.length) {
                message.channel.send("There are no enemies to attack..")
                return
            }
            let msg = Dungeon.attacks[args[1]].use(DungeonGame.player, DungeonGame.enemies.slice(-1)[0])
            for (let index = 0; index <= DungeonGame.enemies.length - 1; index++) {
                let Enemy = DungeonGame.enemies[index]
                if (Enemy.hp < 1) {
                    msg = msg + "\nThe " + Enemy.ai + " was defeated!"
                    DungeonGame.enemies.splice(index, 1)
                    const cash = DungeonGame.floor * 100
                    msg = msg + "\nYou got " + cash + " DogeCoins!"
                    DungeonGame.cash = DungeonGame.cash + cash
                    msg = msg + "\nYou feel stronger..your stats increase!"
                    const boost = Math.ceil(Math.min(DungeonGame.floor / 2, 50))
                    DungeonGame.player.mana = Math.min(Math.floor(DungeonGame.player.mana + boost * 2), 2000)
                    DungeonGame.player.attack = Math.min(Math.floor(DungeonGame.player.attack + boost), DungeonGame.statmax)
                    DungeonGame.player.defense = Math.min(Math.floor(DungeonGame.player.defense + boost), DungeonGame.statmax)
                    index = 0
                } else msg = msg + "\n" + Enemy.think(DungeonGame)
            }
            const InfoEmbed = DungeonGame.getInfo(EconomySystem)
            InfoEmbed.addField("Latest event:", msg)
            message.channel.send({ embeds: [InfoEmbed] })
            break
        }
        case "escape": {
            const chance = GetPercentual()
            if (chance > DungeonGame.floor * 2) {
                DungeonGame.enemies = []
                const InfoEmbed = DungeonGame.getInfo(EconomySystem)
                InfoEmbed.addField("Latest event:", "You managed to escape!")
                message.channel.send({ embeds: [InfoEmbed] })
                return
            }
            let msg = "You tried to escape..but failed!"
            for (let Enemy of DungeonGame.enemies) {
                msg = msg + "\n" + Enemy.think(DungeonGame)
            }
            const InfoEmbed = DungeonGame.getInfo(EconomySystem)
            InfoEmbed.addField("Latest event:", msg)
            message.channel.send({ embeds: [InfoEmbed] })
            return
        }
        case "cashin": {
            if (DungeonGame.enemies.length) {
                message.channel.send("You can't cashin while monsters are attacking you!")
                return
            }
            message.channel.send("Your escape the dungeon, and enjoy the DogeCoins you gained")
            EconomySystem.give(DungeonGame.cash, message)
            if (DungeonGame.floor > EconomySystem.floor) {
                EconomySystem.floor = DungeonGame.floor
                if (EconomySystem.floor >= 50) EconomySystem.award("dungeon", message)
            }
            DungeonGame.reset()
            break
        }
        default: {
            message.channel.send(Dungeon.help.replace(/\&/g, Prefix.get(message.guild.id)))
            return
        }
    }
    if (DungeonGame.player.hp < 1) {
        message.channel.send("Your died! You lost all your DogeCoins collected..")
        if (DungeonGame.floor > EconomySystem.floor) {
            EconomySystem.floor = DungeonGame.floor
            if (EconomySystem.floor >= 50) EconomySystem.award("dungeon", message)
        }
        DungeonGame.reset()
    }
}, "Game", [new RequiredArg(0, Dungeon.help, "command"), new RequiredArg(1, undefined, "argument", true)])
