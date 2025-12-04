import type BoxService from '../service/box.service'
import type FileService from '../service/file.service'
import type { Box } from '../base/box'
import ZettelId from './zettelId.class'

export default class BoxManager {
  private boxService: BoxService
  private fileService: FileService | null = null
  private boxCache: Map<string, Box> = new Map()

  constructor(boxService: BoxService, fileService?: FileService) {
    this.boxService = boxService
    this.fileService = fileService ?? null
  }

  public async createBox(box: Box): Promise<Box> {
    return await this.boxService.createBox(box)
  }

  public async listBoxes(): Promise<Box[]> {
    return await this.boxService.listBoxes()
  }

  public getDefaultFolder(): string {
    return this.boxService.getDefaultFolder()
  }

  /**
   * Cache a box for a specific zettel ID
   * Useful for manually assigning zettels to boxes
   */
  public cacheBoxForZettel(zettelId: string, box: Box): void {
    this.boxCache.set(zettelId, box)
  }

  /**
   * Resolve which box a zettel should belong to.
   * Strategy:
   * 1. Check if box is explicitly cached for this zettel
   * 2. If zettel has parent, find parent's box
   * 3. Fall back to default box
   */
  public resolveBoxForZettel(zettelId: string): Box {
    // Check cache first
    if (this.boxCache.has(zettelId)) {
      return this.boxCache.get(zettelId)!
    }

    // Try to find parent's box
    if (this.fileService && zettelId) {
      const parentBox = this.findParentBox(zettelId)
      if (parentBox) {
        return parentBox
      }
    }

    // Default folder box
    return { type: 'folder', value: '', name: 'default' }
  }

  /**
   * Find the box of a zettel's parent by traversing up the hierarchy
   */
  private findParentBox(zettelId: string): Box | null {
    try {
      const id = ZettelId.parse(zettelId)
      const parent = id.parent()

      if (!parent) {
        // No parent, this is a root zettel
        return null
      }

      const parentIdString = parent.toString()

      // Check if parent has cached box
      if (this.boxCache.has(parentIdString)) {
        return this.boxCache.get(parentIdString)!
      }

      // Could implement file search for parent here if needed
      // For now, recursively check grandparent
      return this.findParentBox(parentIdString)
    } catch {
      return null
    }
  }

  public async ensureBox(box: Box): Promise<Box> {
    return box.type === 'folder' ? await this.boxService.createBox(box) : box
  }
}
