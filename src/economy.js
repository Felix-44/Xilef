class FlagSystem {
    constructor(totalflags, flags) {
        this.value = flags ? BigInt(flags) : BigInt(0)
        this.totalflags = totalflags
    }

    toJSON() {
        return this.value.toString()
    }

    addFlag(flag) {
        this.value = this.value | BigInt(flag)
    }

    removeFlag(flag) {
        this.value = this.value & ~BigInt(flag)
    }

    checkFlag(flag) {
        if (this.value & BigInt(flag)) return true
        return false
    }

    getBinary(replacers1, replacer0) {
        replacers1 = replacers1 || []
        replacers1.reverse()
        let bits = [...this.value.toString(2).padStart(this.totalflags, "0")]
        bits.forEach((bit, position) => {
            if (bit == "1") {
                bits[position] = replacers1[position] || "1"
            } else {
                bits[position] = replacer0 || "0"
            }
        })
        replacers1.reverse()
        return bits.join("")
    }
}

const { ClashMatrix } = require("./Minigames/clash.js")

class EconomySystem {
    constructor(username, backup) {
        this.money = backup?.money ?? 0 //the amount of DogeCoins the user has
        this.rank = backup?.rank ?? 1 //their leaderboard rank
        this.user = username //their username
        this.xilefunds = backup?.xilefunds ?? 0 //the amount of xilefunds the user has
        this.impostors = backup?.impostors ?? 0 //the amount of times they won in &crew
        this.driller = backup?.driller ?? 1 //their &driller tier
        this.floor = backup?.floor ?? 0 //their record in &dungeon
        this.msweeper = backup?.msweeper ?? 0 //the amount of times they won in &msweeper
        this.day = backup?.day ?? 1 //last time they got &daily
        this.reversi = backup?.reversi ?? 0 //the amount of times they won in &reversi
        this.connect4 = backup?.connect4 ?? 0 //the amount of times they won in &connect4
        this.roshambo = backup?.roshambo ?? 0 //the amount of times they won in &roshambo
        this.vhour = backup?.vhour ?? 1 //last time they rolled
        this.vgot = new FlagSystem(60, backup?.vgot) //flag system for the different v_s
        this.bftime = backup?.bftime ?? 1 //last time they completed a brainfuck challenge
        this.bfs = backup?.bfs ?? 0 //amount of times they completed brainfuck challenges
        this.achievments = new FlagSystem(11, backup?.achievments) //flag system for the achievements
        this.clash = new ClashMatrix(backup?.clash ?? "NT_N") //clash default base
        this.clashtime = backup?.clashtime ?? 1 //last time money was taken from the mines in &clash
        this.clashAttackTimer = backup?.clashAttackTimer ?? 1 //time when user was attacked
        this.clashTrophies = backup?.clashTrophies ?? 0 //tre trophies the user has
        console.log("- " + Colors.purple.colorize(!backup ? "Created EconomySystem of " : "Restored EconomySystem of ") + Colors.hpurple.colorize(this.user))
    }

    alterValue(valuename, amount, max = Infinity, min = 0) {
        console.log("- " + Colors.purple.colorize("Altered a value of an EconomySystem:") +
            "\n\tUser: " + this.user +
            "\n\tValue: " + valuename +
            "\n\tAmount: " + amount)
        this[valuename] = Math.max(Math.min(this[valuename] + amount, max), min)
    }

    award(name, message) {
        if (!this.achievments.checkFlag(Achievements[name].value)) {
            this.achievments.addFlag(Achievements[name].value)
            message.channel.send(this.user + " just got the \"" + Achievements[name].id + "\" achievement!")
            console.log("- " + Colors.purple.colorize("Awarded achievement to an EconomySystem:") +
                "\n\tUser: " + this.user +
                "\n\tAchievement name: " + name +
                "\n\tAchievement value: " + Achievements[name].value)
        }
    }

    give(amount, message, nobonus) {
        const pbonus = Math.floor(((amount / 100) * (this.rank - 1)))
        this.money = nobonus ? this.money + amount : this.money + amount + pbonus
        if (message) {
            let msg = this.user + " gained " + amount + " DogeCoins!"
            if (!nobonus) {
                msg = msg + " (+" + pbonus + " bonus)"
                if (amount > 5000 && GetPercentual() <= 7) {
                    message.channel.send("huh!? you found a Xilefund shard!")
                    this.alterValue("xilefunds", 0.25)
                }
            }
            message.channel.send(msg)
            console.log("- " + Colors.purple.colorize("Given DogeCoins to an EconomySystem:") +
                "\n\tUser: " + this.user +
                "\n\tCurrent DogeCoins: " + this.money +
                "\n\tAmount given: " + amount +
                "\n\tBonus: " + (nobonus ? "None" : pbonus) +
                "\n\tTotal given: " + (amount + pbonus))
        }
    }

    steal(amount, message) {
        this.money = Math.max(this.money - amount, 0)
        if (message) {
            message.channel.send(this.user + " lost " + amount + " DogeCoins!")
        }
        console.log("- " + Colors.purple.colorize("Removed DogeCoins to an EconomySystem:") +
            "\n\tUser: " + this.user +
            "\n\tCurrent DogeCoins: " + this.money +
            "\n\tAmount taken: " + amount)
    }

    buy(amount, message, tmsg, fmsg, notax) {
        if (amount < 1) {
            if (message) {
                message.channel.send("that amount is too low, pal")
            }
            console.log("- " + Colors.blue.colorize("Aborted attempt at buying from an EconomySystem:") +
                "\n\tUser: " + this.user +
                "\n\tCurrent DogeCoins: " + this.money +
                "\n\tReason: the price was 0 or negative" +
                "\n\tPrice: " + amount)
            return false
        }
        if (this.money >= amount) {
            const tax = notax ? 0 : Math.round(amount * (this.rank < 500 ? 0 : this.rank - 500) / 100)
            this.money = Math.max(this.money - amount - tax, 0)
            if (message && tmsg) {
                message.channel.send(tmsg)
                message.channel.send(`The purchase costed ${amount + tax} (tax: ${(this.rank < 500 ? 0 : this.rank - 500)}%)`)
            }

            console.log("- " + Colors.purple.colorize("Sucessful attempt at buying from an EconomySystem:") +
                "\n\tUser: " + this.user +
                "\n\tCurrent DogeCoins: " + this.money +
                "\n\tPrice: " + amount +
                "\n\tTax: " + tax +
                "\n\tTotal price: " + (amount + tax))
            return true
        }
        if (message && fmsg) {
            message.channel.send(fmsg)
        }
        console.log("- " + Colors.blue.colorize("Aborted attempt at buying from an EconomySystem:") +
            "\n\tUser: " + this.user +
            "\n\tCurrent DogeCoins: " + this.money +
            "\n\tReason: the user doesn't have enough DogeCoins" +
            "\n\tPrice: " + amount)
        return false
    }
}

const fs = require('fs')
const { setFlagsFromString } = require('v8')

Economy = {
    list: JSON.parse(fs.readFileSync("./src/Data/economy.json", "utf8")),
    getEconomySystem(user) {
        if (!Economy.list[user.id]) {
            if (!user.username) throw "The wanted EconomySystem does not exist"
            Economy.list[user.id] = new EconomySystem(user.username)
        } else if (user.username && Economy.list[user.id].user != user.username) {
            Economy.list[user.id].user = user.username
        }
        return Economy.list[user.id]
    },
    save() {
        let json = JSON.parse(fs.readFileSync("./src/Data/economy.json", "utf8"));
        json = { ...json, ...Economy.list }
        fs.writeFileSync("./src/Data/economy.json", JSON.stringify(json, null, 4), "utf8")
        console.log("- " + Colors.purple.colorize("Successfully updated file ") + Colors.hpurple.colorize("economy.json"))
    },
    flag: class {
        constructor(id, bit) {
            this.id = id
            this.value = 2 ** bit - 2 ** (bit - 1)
        }
    }
}

Achievements = {
    first: new Economy.flag("<:golden_medal:874402462902128656> reach 1st place in the leaderboard", 1),
    reversi: new Economy.flag("<:black_circle:869976829811884103> win 15 reversi matches", 2),
    connect4: new Economy.flag("<:yellow_circle:870716292515106846> win 15 connect 4 matches", 3),
    crew: new Economy.flag("<:imposter:874402966084395058> eject 25 impostors in crew", 4),
    driller: new Economy.flag("<:driller:874403362827796530> reach tier 30 in driller", 5),
    v_: new Economy.flag("<:v_c:873259417557151765> find all v_s", 6),
    dungeon: new Economy.flag("<:dungeon:875809577487192116> reach floor 50 in dungeon", 7),
    msweeper: new Economy.flag("💥 win at minesweeper 10 times", 8),
    roshambo: new Economy.flag(":rock: win at roshambo 25 times", 9),
    brainfuck: new Economy.flag(":brain: complete 30 BrainFuck challenges", 10),
    clash: new Economy.flag(Clash.emojis.B + " gain 2000 trophies", 11)
}
Achievements.binary = [
    Achievements.first.id + "\n",
    Achievements.reversi.id + "\n",
    Achievements.connect4.id + "\n",
    Achievements.crew.id + "\n",
    Achievements.driller.id + "\n",
    Achievements.v_.id + "\n",
    Achievements.dungeon.id + "\n",
    Achievements.msweeper.id + "\n",
    Achievements.roshambo.id + "\n",
    Achievements.brainfuck.id + "\n",
    Achievements.clash.id + "\n"
]

for (let ID of Object.keys(Economy.list)) {
    Economy.list[ID] = new EconomySystem(Economy.list[ID].user, Economy.list[ID])
}
