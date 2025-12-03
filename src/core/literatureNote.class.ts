import type { FileCreateInput, FileRenameInput } from '../base/file'
import type { NoteCreateInput, NoteRenameInput } from '../base/note'
import NoteCore from './note.class'
import FileService from '../service/file.service'

/**
 * Literature Note
 *
 * - References external sources (books, articles, papers, etc.)
 * - Uses format: "Author Year - Title" or just title
 * - Typically stored in _literature or similar folder
 */
export default class LiteratureNote extends NoteCore {
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
   * Build filename using sanitized title only
   * No timestamp - literature notes are identified by their source
   */
  protected buildFilename(input: NoteCreateInput): string {
    const title = this.sanitizeName(input.title)
    return `${title}`.trim()
  }

  protected buildRenameRequest(
    file: FileRenameInput['file'],
    input: NoteRenameInput
  ): FileRenameInput {
    const newFilename = this.sanitizeName(input.newTitle)
    return {
      file,
      newName: `${newFilename}.md`,
    }
  }
}
