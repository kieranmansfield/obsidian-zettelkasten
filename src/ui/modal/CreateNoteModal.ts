import { App, Modal } from 'obsidian'

export class CreateNoteModal extends Modal {
  private onSubmit: (title: string) => void

  constructor(app: App, onSubmit: (title: string) => void) {
    super(app)
    this.onSubmit = onSubmit
  }

  onOpen() {
    const { contentEl } = this
    contentEl.empty()
    contentEl.createEl('h2', { text: 'Create New Note' })

    const form = contentEl.createEl('form')
    form.style.display = 'flex'
    form.style.flexDirection = 'column'
    form.style.gap = '1em'

    const inputContainer = form.createDiv()
    inputContainer.createEl('label', { text: 'Note Title:' })
    const input = inputContainer.createEl('input', {
      type: 'text',
      placeholder: 'Enter note title',
    })
    input.style.width = '100%'
    input.style.marginTop = '0.5em'

    const buttonContainer = form.createDiv()
    buttonContainer.style.display = 'flex'
    buttonContainer.style.gap = '0.5em'
    buttonContainer.style.justifyContent = 'flex-end'

    const submitButton = buttonContainer.createEl('button', {
      text: 'Create',
      type: 'submit',
    })
    submitButton.addClass('mod-cta')

    const cancelButton = buttonContainer.createEl('button', {
      text: 'Cancel',
      type: 'button',
    })

    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const title = input.value.trim()
      if (title) {
        this.close()
        this.onSubmit(title)
      }
    })

    cancelButton.addEventListener('click', () => {
      this.close()
    })

    input.focus()
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
