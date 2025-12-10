import { ItemView, WorkspaceLeaf, setIcon } from 'obsidian'
import type { NoteSequence } from '../base/noteSequence'
import type NoteSequenceService from '../service/noteSequence.service'

export const VIEW_TYPE_NOTE_SEQUENCES = 'note-sequences-view'

/**
 * NoteSequencesView
 *
 * Card view displaying all note sequences.
 * Shows parent notes and their children in an organized, visual format.
 */
export class NoteSequencesView extends ItemView {
  private sequenceService: NoteSequenceService
  private refreshTimeout: NodeJS.Timeout | null = null
  private rootFolder: string

  constructor(leaf: WorkspaceLeaf, sequenceService: NoteSequenceService, rootFolder: string) {
    super(leaf)
    this.sequenceService = sequenceService
    this.rootFolder = rootFolder
    this.registerEvents()
  }

  private registerEvents(): void {
    // Refresh view when files are created, deleted, or modified
    this.registerEvent(this.app.vault.on('create', () => this.scheduleRefresh()))
    this.registerEvent(this.app.vault.on('delete', () => this.scheduleRefresh()))
    this.registerEvent(this.app.vault.on('rename', () => this.scheduleRefresh()))
  }

  private scheduleRefresh(): void {
    // Debounce refreshes to avoid excessive updates
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
    }
    this.refreshTimeout = setTimeout(() => {
      this.refresh()
      this.refreshTimeout = null
    }, 300)
  }

  public refresh(): void {
    const container = this.containerEl.children[1] as HTMLElement
    container.empty()
    container.addClass('note-sequences-view')
    this.renderContent(container)
  }

  getViewType(): string {
    return VIEW_TYPE_NOTE_SEQUENCES
  }

  getDisplayText(): string {
    return 'Note Sequences'
  }

  getIcon(): string {
    return 'layers'
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement
    container.empty()
    container.addClass('note-sequences-view')
    this.renderContent(container)
  }

  private renderContent(container: HTMLElement): void {
    // Get all files - use entire vault, don't filter by folder
    const allFiles = this.app.vault.getMarkdownFiles()
    const core = this.sequenceService.getCore()

    console.log('=== Note Sequence Cards Debug ===')
    console.log('Total files in vault:', allFiles.length)

    // Check how many files have zettel IDs
    const filesWithIds = allFiles.filter((f) => {
      const id = core.extractZettelId(f.basename)
      return id !== null
    })
    console.log('Files with zettel IDs:', filesWithIds.length)

    const rootZettels = core.findAllRoots(allFiles)
    console.log('Root zettels found:', rootZettels.length)

    if (rootZettels.length === 0) {
      const emptyState = container.createDiv({ cls: 'sequence-empty-state' })
      emptyState.createEl('h3', {
        text: 'No root zettel notes found',
      })
      emptyState.createEl('p', {
        text: `Searched ${allFiles.length} files, found ${filesWithIds.length} with zettel IDs`,
        cls: 'setting-item-description',
      })
      emptyState.createEl('p', {
        text: 'Root zettel IDs are 17 digits long (e.g., "20241202193045123")',
        cls: 'setting-item-description',
      })
      emptyState.createEl('p', {
        text: 'Create a zettel note using "Create Zettel Note" command',
        cls: 'setting-item-description',
      })
      return
    }

    // Create grid container for cards
    const gridContainer = container.createDiv({ cls: 'sequence-grid' })

    // Display only root zettels that have children
    rootZettels.forEach((rootFile) => {
      const sequence = this.sequenceService.getSequenceForFile(rootFile)
      if (sequence) {
        // Only show cards that have children (level > 0)
        const childNodes = sequence.allNodes.filter((node) => node.level > 0)
        if (childNodes.length > 0) {
          this.createSequenceCard(gridContainer, sequence)
        }
      }
    })

    // Show message if no sequences with children found
    if (gridContainer.children.length === 0) {
      const emptyState = container.createDiv({ cls: 'sequence-empty-state' })
      emptyState.createEl('h3', {
        text: 'No note sequences with children found',
      })
      emptyState.createEl('p', {
        text: 'Create child notes using "Indent Zettel" or "Assign Child" commands',
        cls: 'setting-item-description',
      })
    }
  }

  private createSequenceCard(container: HTMLElement, sequence: NoteSequence): void {
    const card = container.createDiv({ cls: 'sequence-card' })

    // Card header with parent note
    const header = card.createDiv({ cls: 'sequence-card-header' })
    const headerContent = header.createDiv({ cls: 'sequence-card-header-content' })

    // Parent icon
    const iconEl = headerContent.createDiv({ cls: 'sequence-card-icon' })
    setIcon(iconEl, 'layers')

    // Parent title/filename (clickable)
    const titleEl = headerContent.createDiv({ cls: 'sequence-card-title' })
    const cache = this.app.metadataCache.getFileCache(sequence.root.file)
    const title = cache?.frontmatter?.title || sequence.root.file.basename
    titleEl.setText(title)
    titleEl.addEventListener('click', async (e) => {
      e.stopPropagation()
      await this.app.workspace.getLeaf(false).openFile(sequence.root.file)
    })

    // Action buttons container
    const actionsEl = headerContent.createDiv({ cls: 'sequence-card-actions' })

    // Open in new tab button
    const openBtn = actionsEl.createDiv({
      cls: 'sequence-card-action-btn',
      attr: { 'aria-label': 'Open sequence in new tab' },
    })
    setIcon(openBtn, 'external-link')
    openBtn.addEventListener('click', async (e) => {
      e.stopPropagation()
      await this.app.workspace.getLeaf(true).openFile(sequence.root.file)
    })

    // Card body with children
    const body = card.createDiv({ cls: 'sequence-card-body' })

    // Filter out the root node (level 0) since it's already shown in the header
    const childNodes = sequence.allNodes.filter((node) => node.level > 0)

    if (childNodes.length === 0) {
      body.createDiv({
        cls: 'sequence-card-empty',
        text: 'No children',
      })
    } else {
      // Render child nodes only (excluding root)
      childNodes.forEach((node) => {
        // Adjust level for indent since we're excluding root (level 0)
        // First children (level 1) should have minimal indent
        const adjustedLevel = node.level - 1
        const item = body.createDiv({
          cls: 'sequence-child-item',
          attr: { style: `padding-left: ${12 + adjustedLevel * 20}px` },
        })

        // Child title/filename
        const childTitleEl = item.createDiv({ cls: 'sequence-child-title' })
        const childCache = this.app.metadataCache.getFileCache(node.file)
        const childTitle = childCache?.frontmatter?.title || node.file.basename
        childTitleEl.setText(childTitle)

        // Click handler to open the file
        item.addEventListener('click', async (e) => {
          e.stopPropagation()
          await this.app.workspace.getLeaf(false).openFile(node.file)
        })
      })
    }
  }

  async onClose(): Promise<void> {
    // Clear any pending refresh timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }
  }
}
