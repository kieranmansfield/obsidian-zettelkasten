import type { FileCreateInput, FileRenameInput } from '../base/file'
import type { NoteCreateInput, NoteRenameInput } from '../base/note'
import NoteCore from './note.class'
import FileService from '../service/file.service'

/**
 * Fleeting Note
 *
 * - Uses timestamp-based filenames
 * - Typically stored in _fleeting folder
 */
export default class FleetingNote extends NoteCore {
  private fileService: FileService

  constructor(fileService: FileService) {
    super()
    this.fileService = fileService
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

  /**
   * Build filename using timestamp + sanitized title
   */
  protected buildFilename(input: NoteCreateInput): string {
    const timestamp = this.generateTimeStamp()
    const title = this.sanitizeName(input.title)
    return `${timestamp} ${title}`.trim()
  }

  /**
   * Generate timestamp for fleeting note filenames
   */
  private generateTimeStamp(): string {
    const d = new Date()

    const YYYY = d.getFullYear()
    const MM = String(d.getMonth() + 1).padStart(2, '0')
    const DD = String(d.getDate()).padStart(2, '0')
    const HH = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    const SSS = String(d.getMilliseconds()).padStart(3, '0')

    return `${YYYY}${MM}${DD}${HH}${mm}${ss}${SSS}`
  }

  protected buildRenameRequest(
    file: FileRenameInput['file'],
    input: NoteRenameInput
  ): FileRenameInput {
    const { basename } = file
    const [timestamp] = basename.split(' ')
    const newFilename = `${timestamp} ${this.sanitizeName(input.newTitle)}`
    return {
      file,
      newName: `${newFilename}.md`,
    }
  }
}
