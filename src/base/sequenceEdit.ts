import { Modal, Notice, Setting, type App, type TFile } from 'obsidian'
import type { CommandContext } from './command'
import { zettelRename } from './fileHelpers'
import { parseZettelId, planMoveUnder, type SubtreeRename } from './zettelIdOrder'

/** Every zettel in the vault with its ID; IDs are unique per vault */
function vaultZettels(app: App): Array<{ path: string; id: string }> {
  return app.vault.getMarkdownFiles().flatMap((file) => {
    const id = parseZettelId(file.basename)?.id
    return id ? [{ path: file.path, id }] : []
  })
}

/**
 * Move a zettel and all its descendants to the end of `parentId`'s children.
 * Asks before renaming more than one file, and stops at the first failed rename.
 */
export async function moveUnder(
  context: CommandContext,
  file: TFile,
  parentId: string,
  done: string
): Promise<void> {
  const fromId = parseZettelId(file.basename)?.id
  if (!fromId) {
    new Notice('Current file is not a zettel note')
    return
  }
  const plan = planMoveUnder(vaultZettels(context.app), fromId, parentId)
  if ('error' in plan) {
    new Notice(plan.error)
    return
  }
  if (plan.conflicts.length) {
    new Notice(`Not moved: IDs already in use: ${plan.conflicts.join(', ')}`)
    return
  }
  console.debug('Zettelkasten: moving subtree', plan.renames)
  if (plan.renames.length > 1 && !(await confirmRenames(context.app, plan.renames))) return
  if (await applyRenames(context, plan.renames)) new Notice(done)
}

function confirmRenames(app: App, renames: SubtreeRename[]): Promise<boolean> {
  return new Promise((resolve) => {
    let confirmed = false
    const modal = new Modal(app)
    modal.setTitle(`Rename ${renames.length} zettels?`)
    const list = modal.contentEl.createEl('ul')
    for (const r of renames) list.createEl('li', { text: `${r.oldId} → ${r.newId}` })
    new Setting(modal.contentEl)
      .addButton((b) => b.setButtonText('Cancel').onClick(() => modal.close()))
      .addButton((b) =>
        b
          .setButtonText('Rename')
          .setCta()
          .onClick(() => {
            confirmed = true
            modal.close()
          })
      )
    modal.onClose = () => resolve(confirmed)
    modal.open()
  })
}

async function applyRenames(context: CommandContext, renames: SubtreeRename[]): Promise<boolean> {
  const settings = context.settingsManager.get('zettel')
  for (const [i, r] of renames.entries()) {
    const file = context.app.vault.getFileByPath(r.path)
    try {
      if (!file) throw new Error(`${r.path} not found`)
      const newName = zettelRename(context.app, file, r.newId, settings)
      await context.fileService.rename(file, newName)
    } catch (err) {
      console.error('Zettelkasten: rename failed', r, err)
      new Notice(`Stopped after ${i} of ${renames.length} renames: ${r.oldId} → ${r.newId} failed`)
      return false
    }
  }
  return true
}

/** The active file and its zettel ID, or null after telling the user why not */
export function activeZettel(context: CommandContext): { file: TFile; id: string } | null {
  const file = context.app.workspace.getActiveFile()
  const id = file && parseZettelId(file.basename)?.id
  if (!file || !id) {
    new Notice(file ? 'Current file is not a zettel note' : 'No active file')
    return null
  }
  return { file, id }
}

/** Open `target` in the current tab and say `label: <name>`, or say `missing` when there is none */
export async function openZettel(
  context: CommandContext,
  target: TFile | null,
  label: string,
  missing: string
): Promise<void> {
  if (!target) {
    new Notice(missing)
    return
  }
  await context.app.workspace.getLeaf(false).openFile(target)
  new Notice(`${label}: ${target.basename}`)
}
