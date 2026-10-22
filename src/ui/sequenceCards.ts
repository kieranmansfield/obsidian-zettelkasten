import { setIcon, type App, type TFile } from 'obsidian'
import type { NoteSequence } from '../base/noteSequence'
import { getFileTitle } from '../base/fileHelpers'

/** Empty-state block: a heading and optional hint lines */
export function renderEmptyState(
  container: HTMLElement,
  heading: string,
  ...hints: string[]
): void {
  const el = container.createDiv({ cls: 'sequence-empty-state' })
  el.createEl('h3', { text: heading })
  for (const text of hints) el.createEl('p', { text, cls: 'setting-item-description' })
}

/** One card per sequence: the root as header, its descendants indented below */
export function renderSequenceCards(
  app: App,
  container: HTMLElement,
  sequences: NoteSequence[]
): void {
  const open = (file: TFile, newTab: boolean) => (e: MouseEvent) => {
    e.stopPropagation()
    void app.workspace.getLeaf(newTab).openFile(file)
  }
  const grid = container.createDiv({ cls: 'sequence-grid' })

  for (const { root, allNodes } of sequences) {
    const card = grid.createDiv({ cls: 'sequence-card' })
    const header = card
      .createDiv({ cls: 'sequence-card-header' })
      .createDiv({ cls: 'sequence-card-header-content' })
    setIcon(header.createDiv({ cls: 'sequence-card-icon' }), 'layers')

    const title = header.createDiv({
      cls: 'sequence-card-title',
      text: getFileTitle(app, root.file),
    })
    title.addEventListener('click', open(root.file, false))

    const openBtn = header.createDiv({ cls: 'sequence-card-actions' }).createDiv({
      cls: 'sequence-card-action-btn',
      attr: { 'aria-label': 'Open sequence in new tab' },
    })
    setIcon(openBtn, 'external-link')
    openBtn.addEventListener('click', open(root.file, true))

    const body = card.createDiv({ cls: 'sequence-card-body' })
    for (const node of allNodes.filter((n) => n.level > 0)) {
      const item = body.createDiv({
        cls: 'sequence-child-item',
        attr: { style: `padding-left: ${12 + (node.level - 1) * 20}px` },
      })
      item.createDiv({ cls: 'sequence-child-title', text: getFileTitle(app, node.file) })
      item.addEventListener('click', open(node.file, false))
    }
  }
}
