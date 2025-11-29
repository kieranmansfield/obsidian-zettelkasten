/* eslint-disable @typescript-eslint/no-explicit-any */
import { ModalBase } from './ModalBase'

export class ConflictConfirmationModal extends ModalBase {
  private conflicts: string[]

  constructor(app: any, conflicts: string[]) {
    super(app)
    this.conflicts = conflicts
  }

  openModal(): void {
    const { contentEl } = this
    contentEl.createEl('h2', { text: 'Conflicts Detected' })
    this.conflicts.forEach((c) => contentEl.createEl('p', { text: c }))
  }
}
