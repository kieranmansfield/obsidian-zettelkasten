import type { FileCreateInput, FileRenameInput } from '../base/file'
import type { NoteCreateInput, NoteRenameInput } from '../base/note'
import NoteCore from './note.class'
import FileService from '../service/file.service'
import ZettelId from './zettelId.class'

/**
 * Structure Note (settings key and class name stay "index" for compatibility)
 *
 * - Filename "<ZettelId> <topic>", like any slip-box note
 * - Stored in the slip-box
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
    return `${ZettelId.create().toString()} ${this.sanitizeName(input.title)}`.trim()
  }

  protected buildRenameRequest(
    file: FileRenameInput['file'],
    input: NoteRenameInput
  ): FileRenameInput {
    const [idString] = file.basename.split(' ')
    const newFilename = `${idString} ${this.sanitizeName(input.newTitle)}`
    return {
      file,
      newName: `${newFilename}.md`,
    }
  }
}
