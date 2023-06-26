export default class Sprint {
  constructor() {
    this.sprinters = []
    this.status = null
    this.runTime = null
    this.bufferStart = null
    this.bufferEnd = null
    this.startingTimer = null
    this.runningTimer = null
    this.endingTimer = null
    this.startTime = null
  }

  isActive() {
    return this.status !== null && this.status >= 1 && this.status <= 3
  }

  isRunning() {
    return this.status !== null && this.status == 2
  }

  isEnding() {
    return this.status !== null && this.status == 3
  }

  isDone() {
    return this.status === null
  }

  addSprinter(author, wordcount) {
    const index = this.getSprinter(author)
    if (index !== false) {
      this.setSprinter(author, wordcount)
      return 2
    } else {
      this.sprinters.push({
        author,
        wordcount,
        delta: 0
      })
      return 1
    }
  }

  removeSprinter(author) {
    const index = this.getSprinter(author)
    if (index !== false) {
      this.sprinters.splice(index, 1)
      return true
    } else return false
  }

  getSprinter(author) {
    const i = this.sprinters.findIndex(s => s.author.username === author.username)
    return i === -1 ? false : i
  }

  setSprinter(author, wordcount) {
    const index = this.getSprinter(author)
    if (index !== false) this.sprinters[index].wordcount = wordcount
  }

  sprintersToString() {
    return this.sprinters.map(s => s.author).join('')
  }
}             