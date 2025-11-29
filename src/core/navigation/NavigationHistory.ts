/****
 * Pure navigation history manager for ZettelNodes
 */
export class NavigationHistory {
  private history: string[] = []
  private pointer = -1

  navigateTo(id: string) {
    this.history = this.history.slice(0, this.pointer + 1)
    this.history.push(id)
    this.pointer = this.history.length - 1
  }

  back(): string | null {
    if (this.pointer > 0) {
      this.pointer--
      return this.history[this.pointer]
    }
    return null
  }

  forward(): string | null {
    if (this.pointer < this.history.length - 1) {
      this.pointer++
      return this.history[this.pointer]
    }
    return null
  }

  current(): string | null {
    return this.pointer >= 0 ? this.history[this.pointer] : null
  }

  reset() {
    this.history = []
    this.pointer = -1
  }
}
