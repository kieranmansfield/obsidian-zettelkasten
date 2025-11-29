import { App, Modal } from 'obsidian'

export class NewZettelModal extends Modal {
  private onSubmit: (title: string, options: { openNewZettel: boolean }) => void
  private defaultOptions: { openNewZettel: boolean }

  constructor(
    app: App,
    onSubmit: (title: string, options: { openNewZettel: boolean }) => void,
    defaultOptions: { openNewZettel: boolean } = { openNewZettel: true }
  ) {
    super(app)
    this.onSubmit = onSubmit
    this.defaultOptions = defaultOptions
  }

  onOpen() {
    const { contentEl } = this
    contentEl.empty()
    contentEl.createEl('h2', { text: 'Create New Zettel' })

    const form = contentEl.createEl('form')
    form.style.display = 'flex'
    form.style.flexDirection = 'column'
    form.style.gap = '1em'

    const inputContainer = form.createDiv()
    inputContainer.createEl('label', { text: 'Zettel Title:' })
    const input = inputContainer.createEl('input', {
      type: 'text',
      placeholder: 'Enter zettel title',
    })
    input.style.width = '100%'
    input.style.marginTop = '0.5em'

    const checkboxContainer = form.createDiv()
    const checkbox = checkboxContainer.createEl('input', {
      type: 'checkbox',
    })
    checkbox.checked = this.defaultOptions.openNewZettel
    checkboxContainer.createEl('label', { text: ' Open new zettel' })
    checkbox.style.marginRight = '0.5em'

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
        this.onSubmit(title, {
          openNewZettel: checkbox.checked,
        })
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
