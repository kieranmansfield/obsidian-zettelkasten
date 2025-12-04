import type { FileCreateInput, FileRenameInput } from '../base/file'
import type { NoteCreateInput, NoteRenameInput } from '../base/note'
import NoteCore from './note.class'
import FileService from '../service/file.service'

/**
 * Index Note
 *
 * - Uses a title-based filename
 * - Typically stored in _index or main folder
 */
export default class IndexNote extends NoteCore {
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

  protected buildFilename(input: NoteCreateInput): string {
    const title = this.sanitizeName(input.title)
    return `${title}`.trim()
  }

  protected buildRenameRequest(
    file: FileRenameInput['file'],
    input: NoteRenameInput
  ): FileRenameInput {
    const newFilename = `${this.sanitizeName(input.newTitle)}`
    return {
      file,
      newName: `${newFilename}.md`,
    }
  }
}
