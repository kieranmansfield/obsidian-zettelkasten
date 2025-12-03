import FileCore from './file.class'
import type { FileCreateInput, FileRenameInput, FileResult } from '../base/file'
import type { NoteCreateInput, NoteRenameInput } from '../base/note'

/**
 * Abstract NoteCore class
 * Base class for ZettelNote, FleetingNote, IndexNote
 */
export default abstract class NoteCore extends FileCore {
  /**
   * Construct the filename used for the vault entry.
   * Subclasses override this to implement custom naming logic.
   */
  protected abstract buildFilename(input: NoteCreateInput): string

  /**
   * Construct the full path & return a FileCreateInput
   * to be passed to FileService.
   */
  protected buildCreateRequest(input: NoteCreateInput): FileCreateInput {
    const filename = this.buildFilename(input)
    return {
      folder: input.folder || '',
      filename,
      extension: input.extension ?? 'md',
      content: input.content ?? '',
    }
  }

  /**
   * Public method to create a note
   */
  async createNote(input: NoteCreateInput): Promise<FileResult> {
    const request = this.buildCreateRequest(input)
    return this.create(request)
  }

  /**
   * Build a FileRenameInput using subclass naming rules
   */
  protected abstract buildRenameRequest(
    file: FileRenameInput['file'],
    input: NoteRenameInput
  ): FileRenameInput

  /**
   * Public method to rename a note
   */
  async renameNote(file: FileRenameInput['file'], input: NoteRenameInput): Promise<FileResult> {
    const renameRequest = this.buildRenameRequest(file, input)
    return this.rename(renameRequest)
  }

  /**
   * Subclasses implement these to call FileService
   */
  protected abstract createFile(input: FileCreateInput): Promise<FileResult>
  protected abstract renameFile(input: FileRenameInput): Promise<FileResult>
}
