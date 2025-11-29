export class UndoManager<T> {
  private stack: T[] = []
  private index = -1

  push(state: T) {
    this.stack = this.stack.slice(0, this.index + 1)
    this.stack.push(state)
    this.index++
  }

  undo(): T | undefined {
    if (this.index <= 0) return undefined
    this.index--
    return this.stack[this.index]
  }

  redo(): T | undefined {
    if (this.index >= this.stack.length - 1) return undefined
    this.index++
    return this.stack[this.index]
  }
}
