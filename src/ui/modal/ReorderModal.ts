import { ModalBase } from './ModalBase'

export class ReorderModal extends ModalBase {
  openModal(): void {
    const { contentEl } = this
    contentEl.createEl('h2', { text: 'Reorder Zettels' })
  }
}
