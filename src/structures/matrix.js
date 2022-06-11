class MatrixCell {
    #matrix

    constructor(matrix, x, y) {
        this.#matrix = matrix
        this.x = x
        this.y = y
    }

    get value() {
        return this.#matrix[this.y][this.x]
    }

    set value(value) {
        this.#matrix[this.y][this.x] = value
    }
}

const numToCell = [":zero:", ":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:"]

class Matrix {
    #matrix = []

    /**
    * creates a new Matrix
    * @class
    * @param {number} x - the width of the Matrix
    * @param {number} y - the height of the Matrix
    * @param {any} start - default value given to every cell in the Matrix
    */
    constructor(x, y, start) {
        if (x === undefined || y === undefined || start === undefined) throw new Error("obligatory matrix constructor parameters are undefined")

        this.width = x
        this.height = y
        
        this.#matrix = [...Array(x)].map(x => Array(y).fill(start))   
    }

    getDebugView() {
        let result = "";

        this.#matrix.forEach((_value, index) => {
            let line = index.toString() + ": "

            _value.forEach(value => {
                line += JSON.stringify(value).substring(0, Math.max(20, this.width)) + " / "
            })

            line += "\n"
            result += line;
        })

        return result;
    }

    #checkSingleBounds(n, name, length, lname) {
        if (typeof n != "number") throw new Error(`tried to access invalid ${name} location (${n})`)
        if (n < 0 || n >= length) throw new Error(`tried to access out of bounds location (${n}), matrix ${lname} is ${length}`)
    }

    #checkBounds(x, y) {
        this.#checkSingleBounds(x, "X", this.width, "width")
        this.#checkSingleBounds(y, "Y", this.height, "height")
    }

    get matrix() {
        return Object.freeze([...this.#matrix].map((row) => Object.freeze([...row])))
    }

    *[Symbol.iterator]() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                yield new MatrixCell(this.#matrix, x, y)
            }
        }
    }
    
    *lines() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                yield [new MatrixCell(this.#matrix, x, y), null]
            }
            yield ["\n", y]
        }
    }

    *column(x) {
        this.#checkSingleBounds(x, "X", this.length, "length")
        for (let y = 0; y < this.height; y++) {
            yield new MatrixCell(this.#matrix, x, y)
        }
    }

    *row(y) {
        this.#checkSingleBounds(y, "Y", this.height, "height")
        for (let x = 0; x < this.width; x++) {
            yield new MatrixCell(this.#matrix, x, y)
        }
    }

    toString(func = (Cell) => {return Cell.value}, nopos = false) {
        if (!nopos && (this.width > 10 || this.height > 10)) throw new Error("Matrix coordinates can only be converted for matrixes 10x10 or smaller, set nopos to true")
        let result = ""
        for (const [Cell, y] of this.lines()) {
            if (y === null) {
                result += func(Cell)
                continue
            }
            if (!nopos) result += y
            result += "\n"
        }
        if (!nopos) {
            for (let x = 0; x < this.width; x++) {
                result += numToCell[x]
            }
            for (let y = 0; y < this.height; y++) {
                result = result.replace(y + "\n", numToCell[y] + "\n")
            }
        }
        return result
    }

    checkBounds(x, y) {
        return (this.#matrix[y] && this.#matrix[y][x])
    }

    compare(x, y, check) {
        this.#checkBounds(x, y)
        return this.#matrix[y][x] == check
    }

    set(x, y, value) {
        this.#checkBounds(x, y)
        this.#matrix[y][x] = value
        return this
    }

    map(func) {
        const NewMatrix = new Matrix(this.width, this.height)
        for (const cell of this) {
            NewMatrix.set(cell.x, cell.y, cell.value)
        }
        for (const cell of NewMatrix) {
            cell.value = func(cell)
        }
        return NewMatrix
    }

    at(x, y) {
        this.#checkBounds(x, y)
        return this.#matrix[y][x]
    }

    getCell(x, y) {
        this.#checkBounds(x, y)
        return new MatrixCell(this.#matrix, x, y)
    }

    addColumn(start) {
        this.width += 1
        for (let y = 0; y < this.height; y++) {
            this.#matrix[y].push(start)
        }
        return this
    }

    removeColumn() {
        this.width -= 1
        for (let y = 0; y < this.height; y++) {
            this.#matrix[y].pop()
        }
        return this
    }

    addRow(start) {
        this.height += 1
        const newRow = new Array(this.width).fill(start)
        this.#matrix.push(newRow)
        return this
    }

    removeRow() {
        this.height -= 1
        this.#matrix.pop()
        return this
    }
}

module.exports = {
    Matrix
}