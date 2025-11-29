import { App, Modal, TFile } from 'obsidian'
import { NavigationOption } from '../../types/interfaces'

export class NavigatorModal extends Modal {
  private options: NavigationOption[]
  private onNavigate: (file: TFile) => void
  private currentTitle: string
  private buttons: Map<string, HTMLButtonElement> = new Map()

  constructor(
    app: App,
    currentTitle: string,
    options: NavigationOption[],
    onNavigate: (file: TFile) => void
  ) {
    super(app)
    this.currentTitle = currentTitle
    this.options = options
    this.onNavigate = onNavigate
  }

  onOpen() {
    const { contentEl } = this
    contentEl.empty()
    contentEl.addClass('zettelkasten-navigator')

    // Title
    contentEl.createEl('h3', {
      text: this.currentTitle,
      cls: 'navigator-title',
    })

    // Navigation grid
    const gridEl = contentEl.createDiv({ cls: 'navigator-grid' })

    // Create navigation buttons in a cross pattern
    // Row 1: Up
    const row1 = gridEl.createDiv({ cls: 'navigator-row' })
    row1.createDiv({ cls: 'navigator-spacer' })
    this.createNavigationButton(row1, 'up', '↑ Up')
    row1.createDiv({ cls: 'navigator-spacer' })

    // Row 2: Left, Center, Right
    const row2 = gridEl.createDiv({ cls: 'navigator-row' })
    this.createNavigationButton(row2, 'left', '← Left')
    row2.createDiv({ cls: 'navigator-center' }).setText('Current')
    this.createNavigationButton(row2, 'right', '→ Right')

    // Row 3: Down
    const row3 = gridEl.createDiv({ cls: 'navigator-row' })
    row3.createDiv({ cls: 'navigator-spacer' })
    this.createNavigationButton(row3, 'down', '↓ Down')
    row3.createDiv({ cls: 'navigator-spacer' })

    // Row 4: Sequence Navigation
    const row4 = gridEl.createDiv({
      cls: 'navigator-row navigator-sequence-row',
    })
    this.createNavigationButton(row4, 'prev-sequence', '⇐ Prev Sequence')
    this.createNavigationButton(row4, 'next-sequence', '⇒ Next Sequence')

    // Register keyboard shortcuts
    this.registerKeyboardShortcuts()

    // Add styles
    this.addStyles()
  }

  private createNavigationButton(parent: HTMLElement, direction: string, label: string) {
    const option = this.options.find((o) => o.direction === direction)
    if (!option) return

    const button = parent.createEl('button', {
      text: label,
      cls: 'navigator-button',
    })

    // Store button reference for keyboard shortcuts
    this.buttons.set(direction, button)

    if (option.disabled || !option.file) {
      button.addClass('navigator-button-disabled')
      button.disabled = true
      if (option.label) {
        button.setAttribute('title', option.label)
      }
    } else {
      button.setAttribute('title', option.label)
      button.addEventListener('click', () => {
        if (option.file) {
          this.onNavigate(option.file)
          this.close()
        }
      })
    }
  }

  private registerKeyboardShortcuts() {
    // Arrow Up - triggers Up button
    this.scope.register([], 'ArrowUp', (evt) => {
      evt.preventDefault()
      const button = this.buttons.get('up')
      if (button && !button.disabled) {
        button.click()
      }
      return false
    })

    // Arrow Down - triggers Down button
    this.scope.register([], 'ArrowDown', (evt) => {
      evt.preventDefault()
      const button = this.buttons.get('down')
      if (button && !button.disabled) {
        button.click()
      }
      return false
    })

    // Arrow Left - triggers Left button
    this.scope.register([], 'ArrowLeft', (evt) => {
      evt.preventDefault()
      const button = this.buttons.get('left')
      if (button && !button.disabled) {
        button.click()
      }
      return false
    })

    // Arrow Right - triggers Right button
    this.scope.register([], 'ArrowRight', (evt) => {
      evt.preventDefault()
      const button = this.buttons.get('right')
      if (button && !button.disabled) {
        button.click()
      }
      return false
    })

    // Cmd+Arrow Left - triggers Prev Sequence button
    this.scope.register(['Mod'], 'ArrowLeft', (evt) => {
      evt.preventDefault()
      const button = this.buttons.get('prev-sequence')
      if (button && !button.disabled) {
        button.click()
      }
      return false
    })

    // Cmd+Arrow Right - triggers Next Sequence button
    this.scope.register(['Mod'], 'ArrowRight', (evt) => {
      evt.preventDefault()
      const button = this.buttons.get('next-sequence')
      if (button && !button.disabled) {
        button.click()
      }
      return false
    })
  }

  private addStyles() {
    // Add inline styles for the navigator
    const styleEl = document.createElement('style')
    styleEl.textContent = `
			.zettelkasten-navigator {
				padding: 20px;
			}
			.navigator-title {
				text-align: center;
				margin-bottom: 20px;
				font-weight: 600;
			}
			.navigator-grid {
				display: flex;
				flex-direction: column;
				gap: 10px;
				max-width: 400px;
				margin: 0 auto;
			}
			.navigator-row {
				display: flex;
				gap: 10px;
				justify-content: center;
			}
			.navigator-button {
				min-width: 100px;
				padding: 10px 20px;
				font-size: 14px;
				cursor: pointer;
				border-radius: 4px;
				border: 1px solid var(--background-modifier-border);
				background: var(--interactive-normal);
				color: var(--text-normal);
			}
			.navigator-button:hover:not(.navigator-button-disabled) {
				background: var(--interactive-hover);
			}
			.navigator-button-disabled {
				opacity: 0.3;
				cursor: not-allowed;
			}
			.navigator-center {
				min-width: 100px;
				padding: 10px 20px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-weight: 500;
				color: var(--text-muted);
			}
			.navigator-spacer {
				min-width: 100px;
			}
			.navigator-sequence-row {
				margin-top: 10px;
				padding-top: 10px;
				border-top: 1px solid var(--background-modifier-border);
			}
		`
    this.contentEl.appendChild(styleEl)
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
