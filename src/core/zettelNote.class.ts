import type FileService from '../service/file.service'
import type { FileCreateInput, FileRenameInput, FileResult } from '../base/file'
import type { NoteRenameInput } from '../base/note'
import { TFile } from 'obsidian'
import ZettelId from './zettelId.class'
import type { ZettelCreateInput } from '../base/zettel'
import NoteCore from './note.class'
import type SettingsManager from '../settings/SettingsManager'
import { FilenameFormat } from '../base/settings'
import { zettelFilename } from '../base/fileHelpers'

export default class ZettelNote extends NoteCore {
  protected fileService: FileService
  protected settingsManager: SettingsManager

  constructor(fileService: FileService, settingsManager: SettingsManager) {
    super()
    this.fileService = fileService
    this.settingsManager = settingsManager
  }

  protected buildFilename(input: ZettelCreateInput): string {
    const settings = this.settingsManager.getZettel()
    const idString = input.zettelId.toString()

    return zettelFilename(idString, this.sanitizeName(input.title), settings)
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

    // ID + Title mode - keep the leading ID, replace the title
    const [idString] = file.basename.split(' ')
    const newFilename = zettelFilename(idString, this.sanitizeName(input.newTitle), settings)
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

  /** Zettels always go into the one flat slip-box folder */
  protected resolveFolder(inputFolder?: string): string {
    return inputFolder || this.settingsManager.getZettel().defaultFolder
  }

  async createNew(
    input: Omit<ZettelCreateInput, 'zettelId'> & { title: string }
  ): Promise<FileResult> {
    const zettelId = ZettelId.create()
    const folder = this.resolveFolder(input.folder)

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
    const folder = this.resolveFolder(input.folder)

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
    const folder = this.resolveFolder(input.folder)

    const fileInput: FileCreateInput = {
      folder,
      filename: this.buildFilename({ ...input, zettelId: next }),
      extension: input.extension ?? 'md',
      content: input.content ?? '',
    }
    return this.create(fileInput)
  }
}
