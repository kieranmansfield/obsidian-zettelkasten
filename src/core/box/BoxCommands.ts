export default class BoxManager {
  private boxes: Map<string, string[]> = new Map()

  public addBox(name: string): void {
    if (!this.boxes.has(name)) this.boxes.set(name, [])
  }

  public getBoxes(): string[] {
    return Array.from(this.boxes.keys())
  }

  public addToBox(boxName: string, zettelId: string): void {
    const box = this.boxes.get(boxName)
    if (!box) throw new Error(`Box ${boxName} does not exist`)
    box.push(zettelId)
  }

  public getZettels(boxName: string): string[] {
    return this.boxes.get(boxName) ?? []
  }
}
