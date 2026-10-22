import { Notice, type TFile } from 'obsidian'
import ZettelId from '../core/zettelId.class'
import type NoteSequenceCore from '../core/noteSequence.class'
import type { CommandContext } from './command'
import { zettelRename } from './fileHelpers'

/** Next free child ID under a parent: its first child, or the sibling after its last child */
export function nextChildId(
  core: NoteSequenceCore,
  parentFile: TFile,
  parentId: ZettelId,
  files: TFile[]
): ZettelId | null {
  const last = core.findChildren(parentFile, files, true).at(-1)
  if (!last) return parentId.nextChild()
  const lastId = core.extractZettelId(last.basename)
  return lastId ? ZettelId.parse(lastId).nextSibling() : null
}

/** Rename a zettel to a new ID, keeping its title and extension, and report the outcome */
export async function renameZettelToId(
  context: CommandContext,
  file: TFile,
  id: ZettelId | null,
  done: string,
  failed: string
): Promise<void> {
  if (!id) {
    new Notice('Error generating new ID')
    return
  }
  const newName = zettelRename(
    context.app,
    file,
    id.toString(),
    context.settingsManager!.getZettel()
  )
  const result = await context.fileService!.rename({ file, newName })
  new Notice(result ? done : failed)
}
