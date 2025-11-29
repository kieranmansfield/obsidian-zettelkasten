/* eslint-disable @typescript-eslint/no-explicit-any */
import { IBoxRepository } from '../core/box/IBoxRepository'
import { BoxDefinition } from '../types/interfaces'

export class BoxRepository implements IBoxRepository {
  constructor(private plugin: any) {}

  async loadBoxes(): Promise<BoxDefinition[]> {
    // example: plugin.settings.boxes is an array
    return this.plugin.settings.boxes || []
  }

  getBoxFolder(name: string): string | null {
    const boxes = this.plugin.settings.boxes || []
    const box = boxes.find((b: any) => b.name === name || b.id === name)
    return box ? box.path || box.folder : null
  }
}
