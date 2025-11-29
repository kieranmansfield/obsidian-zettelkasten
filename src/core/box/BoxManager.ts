import { BoxDefinition } from '../../types/interfaces'
import { IBoxRepository } from './IBoxRepository'

export class BoxManager {
  constructor(private repository: IBoxRepository) {}

  async load(): Promise<void> {
    // Load boxes from the repository
    this._boxes = await this.repository.loadBoxes()
  }

  private _boxes: BoxDefinition[] = []

  getBoxes(): BoxDefinition[] {
    return this._boxes
  }

  getBoxNames(): string[] {
    return this._boxes.map((b) => b.name)
  }

  getBoxFolder(boxName: string): string | undefined {
    return this._boxes.find((b) => b.name === boxName)?.path
  }

  getDefaultBox(): BoxDefinition | undefined {
    return this._boxes[0]
  }
}
