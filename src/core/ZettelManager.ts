import { App, Notice } from 'obsidian'
import { BoxManager } from './box/BoxManager'
import { ZettelService } from '../services/ZettelService'
import { FileCreator } from '../services/file/FileCreator'
import { ZettelIdFactory } from './zettel/ZettelIdFactory'

export class ZettelManager {
  private boxManager: BoxManager
  private zettelService: ZettelService

  constructor(private readonly app: App) {
    this.boxManager = new BoxManager(this.app)
    this.zettelService = new ZettelService(this.app, this.boxManager)
  }

  async init() {
    await this.boxManager.load()
  }

  async createNoteInBox(boxName: string, title = 'New Note') {
    const folder = this.boxManager.getBoxFolder(boxName)
    if (!folder) {
      new Notice(`Box "${boxName}" does not exist`)
      return
    }

    const newId = ZettelIdFactory.create().toString()
    const fullTitle = `${newId} ${title}`
    const filePath = `${folder}/${fullTitle}.md`

    const creator = new FileCreator(this.app, {
      path: filePath,
      title: fullTitle,
      shouldOpen: true,
    })

    await creator.create()

    new Notice(`Created: ${fullTitle}`)
    return filePath
  }

  async createNoteInDefaultBox(title = 'New Note') {
    await this.boxManager.load()
    const boxes = this.boxManager.getBoxes()
    const box = boxes[0]
    if (!box) throw new Error('No box configured')
    return this.createNoteInBox(box.name || box.id || box.path, title)
  }
}

export default ZettelManager
