import type { BoxManager } from '../box/BoxManager'
import { ZettelIdFactory } from './ZettelIdFactory'

/**
 * VaultLike is a minimal interface used by this use-case so it can be tested
 * without depending on the full Obsidian App object.
 */
export interface VaultLike {
  create(path: string, content: string): Promise<void>
}

export class CreateZettelUseCase {
  constructor(
    private readonly boxes: BoxManager,
    private readonly vault: VaultLike
  ) {}

  async execute(titleSuffix = 'New note') {
    await this.boxes.load()
    const boxes = this.boxes.getBoxes()
    const box = boxes[0]
    if (!box) throw new Error('No box configured')

    const id = ZettelIdFactory.create()
    const title = `${id.toString()} ${titleSuffix}`
    const path = `${box.path}/${title}.md`

    await this.vault.create(path, `# ${title}\n`)
    return { id: id.toString(), title, path }
  }
}

export default CreateZettelUseCase
