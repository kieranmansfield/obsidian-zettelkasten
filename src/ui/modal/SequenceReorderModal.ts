import { App, Modal, TFile, Notice, setIcon } from 'obsidian'

export class SequenceReorderModal extends Modal {
  private notes: TFile[]
  private parentFile: TFile
  private newParentFile: TFile | null = null // Track if a child becomes the new parent
  private indentLevels: Map<TFile, number> = new Map() // Track indentation level for each note
  private compactRequested: boolean = false // Track if ID compaction was requested
  private onReorder: (
    reorderedNotes: TFile[],
    promoted: TFile[],
    indentLevels: Map<TFile, number>,
    compactRequested: boolean
  ) => void
  private draggedElement: HTMLElement | null = null
  private draggedIndex: number = -1
  private listContainer: HTMLElement | null = null

  constructor(
    app: App,
    parentFile: TFile,
    childNotes: TFile[],
    onReorder: (
      reorderedNotes: TFile[],
      promoted: TFile[],
      indentLevels: Map<TFile, number>,
      compactRequested: boolean
    ) => void
  ) {
    super(app)
    this.parentFile = parentFile
    this.notes = [...childNotes] // Create a copy to work with
    this.onReorder = onReorder

    // Extract parent ID to determine indent levels from existing IDs
    const parentId = this.extractZettelId(parentFile.basename)

    // Determine indent level for each note based on its ID structure
    this.notes.forEach((note) => {
      const noteId = this.extractZettelId(note.basename)
      if (noteId && parentId) {
        const suffix = noteId.substring(parentId.length)
        // Count levels: a=1, a1=2, a1a=3
        const level = this.calculateLevel(suffix)
        this.indentLevels.set(note, level)
      } else {
        this.indentLevels.set(note, 1)
      }
    })
  }

  private extractZettelId(basename: string): string | null {
    // Extract the zettel ID from the filename
    // Match timestamp (13+ digits) followed by optional alternating letter/number sequences
    const match = basename.match(/^(\d{13,}(?:[a-z]+|\d+)*)/)
    return match ? match[1] : null
  }

  private calculateLevel(suffix: string): number {
    if (!suffix) return 1

    // Count transitions between letters and numbers
    let level = 1
    let lastWasLetter = /[a-z]/.test(suffix[0])

    for (let i = 1; i < suffix.length; i++) {
      const isLetter = /[a-z]/.test(suffix[i])
      if (isLetter !== lastWasLetter) {
        level++
        lastWasLetter = isLetter
      }
    }

    return level
  }

  /**
   * Get hierarchical number for a note based on sibling position at same level
   * E.g., note `a` is 1, note `aa` is also 1 (first child of `a`), note `b` is 2 (second sibling of `a`)
   */
  private getHierarchicalNumber(note: TFile, index: number): number {
    const currentLevel = this.indentLevels.get(note) || 1

    // Count how many siblings at the same level came before this note
    let siblingCount = 1
    for (let i = 0; i < index; i++) {
      const prevNote = this.notes[i]
      const prevLevel = this.indentLevels.get(prevNote) || 1

      if (prevLevel === currentLevel) {
        siblingCount++
      } else if (prevLevel < currentLevel) {
        // Reset count when we enter a new parent context
        siblingCount = 1
      }
    }

    return siblingCount
  }

  onOpen() {
    const { contentEl } = this
    contentEl.empty()
    contentEl.addClass('sequence-reorder-modal')

    // Title
    contentEl.createEl('h2', {
      text: 'Reorder Note Sequence',
      cls: 'sequence-title',
    })

    // Instructions
    const instructions = contentEl.createDiv({
      cls: 'sequence-instructions',
    })
    instructions.createEl('p', {
      text: 'Drag to reorder. Use → ← buttons to indent/outdent. Right-click parent to make a child the new parent.',
    })

    // List container
    this.listContainer = contentEl.createDiv({
      cls: 'sequence-list-container',
    })

    this.renderList(this.listContainer)

    // Buttons
    const buttonContainer = contentEl.createDiv({
      cls: 'sequence-buttons',
    })

    const compactButton = buttonContainer.createEl('button', {
      text: 'Compact IDs',
      cls: 'sequence-compact-btn',
      attr: { title: 'Compress available zettel IDs upwards (e.g., a,c,f → a,b,c)' },
    })
    compactButton.addEventListener('click', () => {
      this.compactRequested = !this.compactRequested
      if (this.compactRequested) {
        new Notice('ID compaction will be applied when you save')
        compactButton.addClass('mod-warning')
        compactButton.setText('Compact IDs (ON)')
      } else {
        new Notice('ID compaction disabled')
        compactButton.removeClass('mod-warning')
        compactButton.setText('Compact IDs')
      }
    })

    const saveButton = buttonContainer.createEl('button', {
      text: 'Save Order',
      cls: 'mod-cta',
    })
    saveButton.addEventListener('click', () => {
      // Check if any children are before parent
      const promoted: TFile[] = []
      const remaining: TFile[] = []

      const allItems = Array.from(contentEl.querySelectorAll('.sequence-item'))
      const parentIndex = allItems.findIndex((el) => el.getAttribute('data-type') === 'parent')

      this.notes.forEach((note, index) => {
        const noteItem = allItems.find(
          (el) =>
            el.getAttribute('data-type') === 'child' &&
            parseInt(el.getAttribute('data-index') || '-1') === index
        )
        if (noteItem) {
          const itemIndex = allItems.indexOf(noteItem)
          if (itemIndex < parentIndex) {
            promoted.push(note)
          } else {
            remaining.push(note)
          }
        }
      })

      this.onReorder(remaining, promoted, this.indentLevels, this.compactRequested)
      new Notice('Note sequence saved!')
      this.close()
    })

    const cancelButton = buttonContainer.createEl('button', {
      text: 'Cancel',
    })
    cancelButton.addEventListener('click', () => {
      this.close()
    })

    // Add styles
    this.addStyles()
  }

  private renderList(container: HTMLElement) {
    container.empty()

    const list = container.createEl('div', { cls: 'sequence-list' })

    // Render parent note first
    this.renderParentItem(list)

    // Render child notes
    this.notes.forEach((note, index) => {
      const item = list.createDiv({
        cls: 'sequence-item sequence-item-child',
      })
      item.draggable = true
      item.setAttribute('data-index', index.toString())
      item.setAttribute('data-type', 'child')

      // Drag handle
      const dragHandle = item.createDiv({ cls: 'sequence-drag-handle' })
      setIcon(dragHandle, 'grip-vertical')

      // Note info
      const noteInfo = item.createDiv({ cls: 'sequence-note-info' })

      // Number - hierarchical numbering based on sibling position at same level
      const numberEl = noteInfo.createDiv({ cls: 'sequence-number' })
      const hierarchicalNumber = this.getHierarchicalNumber(note, index)
      numberEl.setText(`${hierarchicalNumber}.`)

      // Title and filename
      const textContainer = noteInfo.createDiv({
        cls: 'sequence-text-container',
      })

      const cache = this.app.metadataCache.getFileCache(note)
      const title = cache?.frontmatter?.title || note.basename

      const titleEl = textContainer.createDiv({
        cls: 'sequence-note-title',
      })
      titleEl.setText(title)

      const filenameEl = textContainer.createDiv({
        cls: 'sequence-note-filename',
      })
      filenameEl.setText(note.basename)

      // Indent/Outdent buttons
      const indentControls = item.createDiv({
        cls: 'sequence-indent-controls',
      })

      const outdentBtn = indentControls.createDiv({
        cls: 'sequence-indent-btn',
        attr: { title: 'Outdent (promote)' },
      })
      setIcon(outdentBtn, 'chevron-left')
      outdentBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.changeIndent(note, -1)
        this.renderList(container)
      })

      const indentBtn = indentControls.createDiv({
        cls: 'sequence-indent-btn',
        attr: { title: 'Indent (make child)' },
      })
      setIcon(indentBtn, 'chevron-right')
      indentBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        this.changeIndent(note, 1)
        this.renderList(container)
      })

      // Open button
      const openButton = item.createDiv({ cls: 'sequence-open-button' })
      setIcon(openButton, 'external-link')
      openButton.addEventListener('click', (e) => {
        e.stopPropagation()
        this.app.workspace.getLeaf().openFile(note)
      })

      // Drag and drop events
      item.addEventListener('dragstart', (e) => {
        this.draggedElement = item
        this.draggedIndex = index
        item.addClass('dragging')
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move'
        }
      })

      item.addEventListener('dragend', () => {
        item.removeClass('dragging')
        this.draggedElement = null
        this.draggedIndex = -1
      })

      item.addEventListener('dragover', (e) => {
        e.preventDefault()
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'move'
        }

        if (this.draggedElement && this.draggedElement !== item) {
          const afterElement = this.getDragAfterElement(list, e.clientY)

          if (afterElement == null) {
            list.appendChild(this.draggedElement)
          } else {
            list.insertBefore(this.draggedElement, afterElement)
          }

          // Update indentation based on current position
          this.updateIndentation(list)
        }
      })

      item.addEventListener('drop', (e) => {
        e.preventDefault()
        if (this.draggedElement && this.draggedIndex >= 0) {
          // Get the current index from the DOM order (excluding parent)
          const childItems = Array.from(list.querySelectorAll('.sequence-item[data-type="child"]'))
          const currentDropIndex = childItems.indexOf(item)

          if (this.draggedIndex !== currentDropIndex) {
            // Reorder the notes array
            const [movedNote] = this.notes.splice(this.draggedIndex, 1)
            this.notes.splice(currentDropIndex, 0, movedNote)

            // Calculate appropriate indent level for new position
            const newIndentLevel = this.inferIndentLevel(currentDropIndex, list)
            this.indentLevels.set(movedNote, newIndentLevel)

            // Re-render the list
            this.renderList(container)
          }
        }
      })
    })

    // Set initial indentation
    this.updateIndentation(list)
  }

  private renderParentItem(list: HTMLElement) {
    const item = list.createDiv({
      cls: 'sequence-item sequence-item-parent',
    })
    item.draggable = true
    item.setAttribute('data-type', 'parent')

    // Drag handle
    const dragHandle = item.createDiv({ cls: 'sequence-drag-handle' })
    setIcon(dragHandle, 'grip-vertical')

    // Note info
    const noteInfo = item.createDiv({ cls: 'sequence-note-info' })

    // Parent label
    const labelEl = noteInfo.createDiv({
      cls: 'sequence-parent-label',
    })
    labelEl.setText('Parent:')

    // Title and filename
    const textContainer = noteInfo.createDiv({
      cls: 'sequence-text-container',
    })

    const cache = this.app.metadataCache.getFileCache(this.parentFile)
    const title = cache?.frontmatter?.title || this.parentFile.basename

    const titleEl = textContainer.createDiv({
      cls: 'sequence-note-title',
    })
    titleEl.setText(title)

    const filenameEl = textContainer.createDiv({
      cls: 'sequence-note-filename',
    })
    filenameEl.setText(this.parentFile.basename)

    // Set Parent button (context menu alternative)
    const setParentBtn = item.createDiv({
      cls: 'sequence-set-parent-btn',
      attr: { title: 'Choose new parent from children' },
    })
    setParentBtn.setText('↻')
    setParentBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      this.showSetParentMenu(setParentBtn)
    })

    // Open button
    const openButton = item.createDiv({ cls: 'sequence-open-button' })
    setIcon(openButton, 'external-link')
    openButton.addEventListener('click', (e) => {
      e.stopPropagation()
      this.app.workspace.getLeaf().openFile(this.parentFile)
    })

    // Drag events for parent
    item.addEventListener('dragstart', (e) => {
      this.draggedElement = item
      this.draggedIndex = -1 // Use -1 to indicate parent
      item.addClass('dragging')
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
      }
    })

    item.addEventListener('dragend', () => {
      item.removeClass('dragging')
      this.draggedElement = null
      this.draggedIndex = -1
    })

    // Allow parent to receive drops and reorder
    item.addEventListener('dragover', (e) => {
      e.preventDefault()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move'
      }

      if (this.draggedElement && this.draggedElement !== item) {
        const list = item.parentElement
        if (list) {
          const afterElement = this.getDragAfterElement(list, e.clientY)

          if (afterElement == null) {
            list.appendChild(this.draggedElement)
          } else {
            list.insertBefore(this.draggedElement, afterElement)
          }

          // Update indentation based on current position
          this.updateIndentation(list)
        }
      }
    })
  }

  private updateIndentation(list: HTMLElement) {
    const allItems = Array.from(list.querySelectorAll('.sequence-item'))
    const parentIndex = allItems.findIndex((el) => el.getAttribute('data-type') === 'parent')

    allItems.forEach((item, index) => {
      const element = item as HTMLElement
      const type = element.getAttribute('data-type')
      const dataIndex = element.getAttribute('data-index')

      if (type === 'parent') {
        // Parent is indented if not in first position
        if (index === 0) {
          element.style.marginLeft = '0px'
        } else {
          element.style.marginLeft = '32px'
        }
      } else if (type === 'child' && dataIndex !== null) {
        const childIndex = parseInt(dataIndex)
        const note = this.notes[childIndex]
        const indentLevel = this.indentLevels.get(note) || 1

        // Base indentation from parent position
        let baseIndent = 0
        if (index < parentIndex) {
          baseIndent = 0 // Promoted (before parent)
        } else {
          baseIndent = 32 // After parent
        }

        // Additional indentation for nested levels
        const totalIndent = baseIndent + (indentLevel - 1) * 32
        element.style.marginLeft = `${totalIndent}px`
      }
    })
  }

  private changeIndent(note: TFile, direction: number) {
    const currentLevel = this.indentLevels.get(note) || 1
    const newLevel = Math.max(1, Math.min(3, currentLevel + direction)) // Limit to 3 levels

    // If indenting (direction > 0), check if a note exists at the level above
    if (direction > 0 && newLevel > currentLevel) {
      const noteIndex = this.notes.indexOf(note)
      if (noteIndex > 0) {
        // Check if there's a note immediately before this one at currentLevel or deeper
        const prevNote = this.notes[noteIndex - 1]
        const prevLevel = this.indentLevels.get(prevNote) || 1

        // Can only indent if the previous note is at the current level or deeper
        // This ensures we're making it a child of something that exists
        if (prevLevel < currentLevel) {
          // Previous note is shallower - can't indent
          new Notice('Cannot indent: no parent note at this level')
          return
        }
      } else {
        // First note - can't indent
        new Notice('Cannot indent: no parent note exists')
        return
      }
    }

    this.indentLevels.set(note, newLevel)
  }

  private inferIndentLevel(dropIndex: number, list: HTMLElement): number {
    // Find parent position in the actual reordered notes array
    const allItems = Array.from(list.querySelectorAll('.sequence-item'))
    const parentIndex = allItems.findIndex((item) => item.getAttribute('data-type') === 'parent')

    // Calculate position relative to parent in the child notes array
    let positionRelativeToParent = dropIndex
    if (parentIndex !== -1) {
      // Adjust for parent being in the list
      if (dropIndex >= parentIndex) {
        positionRelativeToParent = dropIndex - 1 // Parent takes one spot
      } else {
        // Before parent - should be at level 1 (promoted/sibling)
        return 1
      }
    }

    // Look at the note immediately before this position
    if (positionRelativeToParent > 0) {
      const prevNote = this.notes[positionRelativeToParent - 1]
      if (prevNote) {
        const prevLevel = this.indentLevels.get(prevNote) || 1

        // Check if there's a next note to get more context
        if (positionRelativeToParent < this.notes.length) {
          const nextNote = this.notes[positionRelativeToParent]
          const nextLevel = this.indentLevels.get(nextNote) || 1

          // If next note is deeper than prev, we're likely starting a new branch
          // Stay at the previous note's level
          if (nextLevel > prevLevel) {
            return prevLevel
          }
          // If next note is shallower or same, match the shallower level
          return Math.min(prevLevel, nextLevel)
        }

        // No next note, match previous
        return prevLevel
      }
    }

    // Check the note after if we're at the start
    if (positionRelativeToParent < this.notes.length) {
      const nextNote = this.notes[positionRelativeToParent]
      if (nextNote) {
        const nextLevel = this.indentLevels.get(nextNote) || 1
        return nextLevel
      }
    }

    // Default to level 1 (direct child)
    return 1
  }

  private showSetParentMenu(element: HTMLElement) {
    const menu = document.createElement('div')
    menu.addClass('sequence-parent-menu')

    const menuTitle = menu.createDiv({ cls: 'sequence-parent-menu-title' })
    menuTitle.setText('Select new parent:')

    this.notes.forEach((note, index) => {
      const cache = this.app.metadataCache.getFileCache(note)
      const title = cache?.frontmatter?.title || note.basename

      const option = menu.createDiv({
        cls: 'sequence-parent-menu-option',
      })
      option.setText(`${index + 1}. ${title}`)
      option.addEventListener('click', () => {
        this.newParentFile = note
        new Notice(`${title} will become the new parent`)
        menu.remove()
      })
    })

    const cancelOption = menu.createDiv({
      cls: 'sequence-parent-menu-option sequence-parent-menu-cancel',
    })
    cancelOption.setText('Cancel')
    cancelOption.addEventListener('click', () => menu.remove())

    document.body.appendChild(menu)

    const rect = element.getBoundingClientRect()
    menu.style.position = 'absolute'
    menu.style.top = `${rect.bottom + 5}px`
    menu.style.left = `${rect.left}px`

    // Close menu when clicking outside
    const closeHandler = (e: MouseEvent) => {
      if (!menu.contains(e.target as Node)) {
        menu.remove()
        document.removeEventListener('click', closeHandler)
      }
    }
    setTimeout(() => document.addEventListener('click', closeHandler), 0)
  }

  private getDragAfterElement(container: HTMLElement, y: number) {
    const draggableElements = Array.from(
      container.querySelectorAll('.sequence-item:not(.dragging)')
    )

    return draggableElements.reduce(
      (closest: { offset: number; element?: Element }, child: Element) => {
        const box = child.getBoundingClientRect()
        const offset = y - box.top - box.height / 2

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child }
        } else {
          return closest
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element
  }

  private addStyles() {
    const styleEl = document.createElement('style')
    styleEl.textContent = `
			.sequence-reorder-modal {
				padding: 20px;
				max-width: 600px;
			}
			.sequence-title {
				text-align: center;
				margin-bottom: 10px;
			}
			.sequence-instructions {
				text-align: center;
				color: var(--text-muted);
				margin-bottom: 20px;
				font-size: 14px;
			}
			.sequence-list-container {
				max-height: 400px;
				overflow-y: auto;
				margin-bottom: 20px;
				border: 1px solid var(--background-modifier-border);
				border-radius: 4px;
				padding: 10px;
			}
			.sequence-list {
				display: flex;
				flex-direction: column;
				gap: 8px;
			}
			.sequence-item {
				display: flex;
				align-items: center;
				padding: 12px;
				background: var(--background-secondary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 4px;
				transition: all 0.2s;
			}
			.sequence-item-child {
				cursor: grab;
			}
			.sequence-item-parent {
				cursor: grab;
				background: var(--background-primary-alt);
				border-width: 2px;
			}
			.sequence-item:hover {
				background: var(--background-secondary-alt);
				border-color: var(--background-modifier-border-hover);
			}
			.sequence-item.dragging {
				opacity: 0.5;
				cursor: grabbing;
			}
			.sequence-item.selected {
				outline: 2px solid var(--interactive-accent);
				outline-offset: 2px;
			}
			.sequence-drag-handle {
				color: var(--text-muted);
				margin-right: 12px;
				cursor: grab;
				display: flex;
				align-items: center;
			}
			.sequence-item.dragging .sequence-drag-handle {
				cursor: grabbing;
			}
			.sequence-note-info {
				display: flex;
				align-items: center;
				flex: 1;
				gap: 12px;
			}
			.sequence-number {
				font-weight: 600;
				color: var(--text-muted);
				min-width: 30px;
			}
			.sequence-parent-label {
				font-weight: 600;
				color: var(--text-accent);
				min-width: 60px;
			}
			.sequence-text-container {
				flex: 1;
				min-width: 0;
			}
			.sequence-note-title {
				font-weight: 500;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.sequence-note-filename {
				font-size: 12px;
				color: var(--text-muted);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.sequence-indent-controls {
				display: flex;
				gap: 4px;
				margin-left: 8px;
			}
			.sequence-indent-btn {
				cursor: pointer;
				padding: 4px;
				color: var(--text-muted);
				transition: color 0.2s;
				display: flex;
				align-items: center;
			}
			.sequence-indent-btn:hover {
				color: var(--text-normal);
				background: var(--background-modifier-hover);
				border-radius: 3px;
			}
			.sequence-set-parent-btn {
				cursor: pointer;
				padding: 4px 8px;
				margin-left: 8px;
				color: var(--text-muted);
				font-weight: bold;
				font-size: 16px;
				transition: all 0.2s;
			}
			.sequence-set-parent-btn:hover {
				color: var(--text-accent);
				background: var(--background-modifier-hover);
				border-radius: 3px;
			}
			.sequence-parent-menu {
				background: var(--background-primary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 4px;
				padding: 8px;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
				z-index: 1000;
				min-width: 200px;
			}
			.sequence-parent-menu-title {
				font-weight: 600;
				padding: 4px 8px;
				margin-bottom: 4px;
				border-bottom: 1px solid var(--background-modifier-border);
			}
			.sequence-parent-menu-option {
				padding: 6px 8px;
				cursor: pointer;
				border-radius: 3px;
				transition: background 0.2s;
			}
			.sequence-parent-menu-option:hover {
				background: var(--background-modifier-hover);
			}
			.sequence-parent-menu-cancel {
				color: var(--text-muted);
				border-top: 1px solid var(--background-modifier-border);
				margin-top: 4px;
				padding-top: 8px;
			}
			.sequence-open-button {
				cursor: pointer;
				padding: 4px;
				color: var(--text-muted);
				transition: color 0.2s;
			}
			.sequence-open-button:hover {
				color: var(--text-normal);
			}
			.sequence-buttons {
				display: flex;
				gap: 10px;
				justify-content: flex-end;
			}
			.sequence-buttons button {
				padding: 8px 16px;
			}
			.sequence-hotkeys-doc {
				margin-bottom: 20px;
				padding: 12px;
				background: var(--background-secondary);
				border-radius: 4px;
				border: 1px solid var(--background-modifier-border);
			}
			.sequence-hotkeys-doc h4 {
				margin: 0 0 8px 0;
				font-size: 14px;
				font-weight: 600;
				color: var(--text-normal);
			}
			.sequence-hotkeys-doc ul {
				margin: 0;
				padding-left: 20px;
			}
			.sequence-hotkeys-doc li {
				font-size: 13px;
				color: var(--text-muted);
				margin-bottom: 4px;
			}
		`
    this.contentEl.appendChild(styleEl)
  }

  onClose() {
    const { contentEl } = this
    contentEl.empty()
  }
}
