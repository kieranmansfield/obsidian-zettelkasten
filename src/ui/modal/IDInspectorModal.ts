import { ModalBase } from './ModalBase'
import type { ZettelNode } from '../../core/zettel/ZettelNode'
import { App } from 'obsidian'

export class IDInspectorModal extends ModalBase {
  constructor(
    app: App,
    private node: ZettelNode
  ) {
    super(app)
  }

  openModal(): void {
    const { contentEl } = this
    contentEl.createEl('h2', { text: `Inspect Zettel ${this.node.id}` })
    contentEl.createEl('pre', { text: JSON.stringify(this.node, null, 2) })
  }
}
