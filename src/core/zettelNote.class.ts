import type FileService from '../service/file.service'
import type { FileCreateInput, FileRenameInput, FileResult } from '../base/file'
import type { NoteRenameInput } from '../base/note'
import { TFile } from 'obsidian'
import ZettelId from './zettelId.class'
import type { ZettelCreateInput } from '../base/zettel'
import NoteCore from './note.class'
import type BoxManager from './boxManager.class'
import type { Box } from '../base/box'
import type SettingsManager from '../settings/SettingsManager'
import { FilenameFormat } from '../base/settings'

export default class ZettelNote extends NoteCore {
  protected fileService: FileService
  protected boxManager: BoxManager
  protected settingsManager: SettingsManager

  constructor(fileService: FileService, boxManager: BoxManager, settingsManager: SettingsManager) {
    super()
    this.fileService = fileService
    this.boxManager = boxManager
    this.settingsManager = settingsManager
  }

  protected buildFilename(input: ZettelCreateInput): string {
    const settings = this.settingsManager.getZettel()
    const idString = input.zettelId.toString()

    // ID only mode - just the zettel ID
    if (settings.filenameFormat === FilenameFormat.ID_ONLY) {
      return idString
    }

    // ID + Title mode - ID, separator, and title
    const title = this.sanitizeName(input.title)
    const separator = settings.separator || '⁝'
    return `${idString} ${separator} ${title}`.trim()
  }

  protected buildRenameRequest(file: TFile, input: NoteRenameInput): FileRenameInput {
    const settings = this.settingsManager.getZettel()

    // ID only mode - filename doesn't change
    if (settings.filenameFormat === FilenameFormat.ID_ONLY) {
      return {
        file,
        newName: `${file.basename}.md`,
      }
    }

    // ID + Title mode - extract ID and update title
    const separator = settings.separator || '⁝'
    const [idString] = file.basename.split(separator)
    const newFilename = `${idString.trim()} ${separator} ${this.sanitizeName(input.newTitle)}`
    return {
      file,
      newName: `${newFilename}.md`,
    }
  }

  protected async createFile(input: FileCreateInput) {
    return this.fileService.create(input)
  }

  protected async renameFile(input: FileRenameInput) {
    return this.fileService.rename(input)
  }

  public async create(input: FileCreateInput) {
    return this.createFile(input)
  }

  public async rename(input: FileRenameInput) {
    return this.renameFile(input)
  }

  protected async resolveFolder(inputFolder?: string, zettelId?: ZettelId): Promise<string> {
    if (inputFolder) return inputFolder

    const box: Box = this.boxManager.resolveBoxForZettel(zettelId?.toString() ?? '')
    const ensuredBox = await this.boxManager.ensureBox(box)

    if (ensuredBox.type === 'folder') {
      return ensuredBox.value
    }

    // For tag boxes, fallback folder
    return this.boxManager.getDefaultFolder()
  }

  async createNew(
    input: Omit<ZettelCreateInput, 'zettelId'> & { title: string }
  ): Promise<FileResult> {
    const zettelId = ZettelId.create()
    const folder = await this.resolveFolder(input.folder, zettelId)

    const fileInput: FileCreateInput = {
      folder,
      filename: this.buildFilename({ ...input, zettelId }),
      extension: input.extension ?? 'md',
      content: input.content ?? '',
    }
    return this.create(fileInput)
  }

  async createChild(
    parentId: ZettelId,
    input: Omit<ZettelCreateInput, 'zettelId'> & { title: string }
  ): Promise<FileResult> {
    const childId = parentId.nextChild()
    const folder = await this.resolveFolder(input.folder, childId)

    const fileInput: FileCreateInput = {
      folder,
      filename: this.buildFilename({ ...input, zettelId: childId }),
      extension: input.extension ?? 'md',
      content: input.content ?? '',
    }
    return this.create(fileInput)
  }

  async createSibling(
    siblingId: ZettelId,
    input: Omit<ZettelCreateInput, 'zettelId'> & { title: string }
  ): Promise<FileResult> {
    const next = siblingId.nextSibling()!
    const folder = await this.resolveFolder(input.folder, next)

    const fileInput: FileCreateInput = {
      folder,
      filename: this.buildFilename({ ...input, zettelId: next }),
      extension: input.extension ?? 'md',
      content: input.content ?? '',
    }
    return this.create(fileInput)
  }
}
