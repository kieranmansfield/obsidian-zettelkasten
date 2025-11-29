import { App, TFile } from 'obsidian'
import { ZettelId } from '../core/zettel/ZettelId'
import { ZettelNode } from '../core/zettel/ZettelNode'
import { ZettelTree } from '../core/zettel/ZettelTree'
import { IZettelRepository } from '../core/repositories/IZettelRepository'
import { IBoxRepository } from '../core/box/IBoxRepository'
import { FileCreator } from './file/FileCreator'
import { ZettelIdFactory } from '../core/zettel/ZettelIdFactory'
import { ZettelTreeBuilder } from '../core/zettel/ZettelTreeBuilder'

export class ZettelService {
  constructor(
    private readonly app: App,
    private readonly zettelRepo: IZettelRepository,
    private readonly boxRepo: IBoxRepository
  ) {}

  /** Scan vault and rebuild full ZettelTree */
  async buildZettelTree(): Promise<ZettelTree> {
    const files = await this.zettelRepo.getAllZettelFiles()
    const nodes: ZettelNode[] = []

    for (const f of files) {
      try {
        const id = ZettelId.parse(f.name)
        const node: ZettelNode = {
          id: id.toString(),
          file: f,
          children: [],
        }
        nodes.push(node)
      } catch {
        // Ignore files that are not valid zettels
      }
    }

    return ZettelTreeBuilder.buildTree(nodes)
  }

  /** Return all direct children of a given zettel */
  async getChildren(id: ZettelId): Promise<ZettelNode[]> {
    const tree = await this.buildZettelTree()
    const node = tree.nodes.get(id.toString())
    return node ? node.children : []
  }

  /** Return the parent node of a given zettel */
  async getParent(id: ZettelId): Promise<ZettelNode | null> {
    const tree = await this.buildZettelTree()
    const parentId = id.getParent()
    if (!parentId) return null
    return tree.nodes.get(parentId.toString()) ?? null
  }

  /** Create a new Zettel file in a given box */
  async createZettel(boxId: string, title: string, template?: string): Promise<TFile> {
    const box = await this.boxRepo.getBox(boxId)
    if (!box) throw new Error(`Box not found: ${boxId}`)

    const id = ZettelIdFactory.create()
    const filename = `${id.toString()} ${title}.md`
    const fullPath = `${box.path}/${filename}`

    const creator = new FileCreator(this.app, {
      path: fullPath,
      title,
      templatePath: template,
      shouldOpen: true,
    })

    return await creator.create()
  }

  /** Retrieve a flattened list of all zettels with metadata */
  async listZettels(): Promise<ZettelNode[]> {
    const tree = await this.buildZettelTree()
    return [...tree.nodes.values()]
  }

  /** Check if a file corresponds to a valid zettel */
  isZettelFile(file: TFile): boolean {
    try {
      ZettelId.parse(file.basename)
      return true
    } catch {
      return false
    }
  }
}

export default ZettelService
