import { ItemView, WorkspaceLeaf, setIcon, TFile } from 'obsidian'
import type { NoteSequence } from '../base/noteSequence'
import type NoteSequenceService from '../service/noteSequence.service'

export const VIEW_TYPE_NOTE_SEQUENCES_BASES = 'note-sequences-bases-view'

/**
 * NoteSequencesBasesView
 *
 * Sidebar view displaying all base (root) note sequences in a card-based layout.
 * Shows only the absolute top-level root notes (bases) and their complete sequences.
 */
export class NoteSequencesBasesView extends ItemView {
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
    container.addClass('note-sequences-bases-view')
    this.renderContent(container)
  }

  getViewType(): string {
    return VIEW_TYPE_NOTE_SEQUENCES_BASES
  }

  getDisplayText(): string {
    return 'Sequence bases'
  }

  getIcon(): string {
    return 'network'
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement
    container.empty()
    container.addClass('note-sequences-bases-view')
    this.renderContent(container)
  }

  private renderContent(container: HTMLElement): void {
    // Get all root zettel notes (bases - absolute top-level parents)
    const core = this.sequenceService.getCore()
    const allFiles = this.rootFolder
      ? this.app.vault.getMarkdownFiles().filter((f) => f.path.startsWith(this.rootFolder))
      : this.app.vault.getMarkdownFiles()

    console.log('Bases View - Total files:', allFiles.length)
    console.log('Bases View - Root folder:', this.rootFolder)

    const rootZettels = core.findAllRoots(allFiles)
    console.log('Bases (root zettels) found:', rootZettels.length)

    if (rootZettels.length === 0) {
      const emptyState = container.createDiv({ cls: 'sequence-empty-state' })
      emptyState.createEl('p', {
        text: 'No base notes found.',
      })
      emptyState.createEl('p', {
        text: 'Create a zettel note to get started.',
        cls: 'setting-item-description',
      })
      return
    }

    // Create grid container
    const gridContainer = container.createDiv({ cls: 'sequence-grid' })

    // Display each base (root zettel) with its complete sequence as a card
    rootZettels.forEach((rootFile) => {
      const sequence = this.sequenceService.getSequenceForFile(rootFile)
      if (sequence) {
        this.createBaseCard(gridContainer, sequence)
      } else {
        // Root with no children - still show it
        this.createRootOnlyCard(gridContainer, rootFile)
      }
    })
  }

  private createRootOnlyCard(container: HTMLElement, file: TFile): void {
    const card = container.createDiv({ cls: 'sequence-card base-card' })

    // Card header
    const header = card.createDiv({ cls: 'sequence-card-header' })
    const headerContent = header.createDiv({ cls: 'sequence-card-header-content' })

    // Icon for base note
    const iconEl = headerContent.createDiv({ cls: 'sequence-card-icon' })
    setIcon(iconEl, 'network')

    // Title (clickable)
    const titleEl = headerContent.createDiv({ cls: 'sequence-card-title' })
    const cache = this.app.metadataCache.getFileCache(file)
    const title = (cache?.frontmatter?.title as string | undefined) || file.basename
    titleEl.setText(title)
    titleEl.addEventListener('click', (e) => {
      e.stopPropagation()
      void this.app.workspace.getLeaf(false).openFile(file)
    })

    // Card body
    const body = card.createDiv({ cls: 'sequence-card-body' })
    body.createDiv({
      cls: 'sequence-card-empty',
      text: 'No children',
    })
  }

  private createBaseCard(container: HTMLElement, sequence: NoteSequence): void {
    const card = container.createDiv({ cls: 'sequence-card base-card' })

    // Card header with base note (root parent)
    const header = card.createDiv({ cls: 'sequence-card-header' })
    const headerContent = header.createDiv({ cls: 'sequence-card-header-content' })

    // Base icon
    const iconEl = headerContent.createDiv({ cls: 'sequence-card-icon' })
    setIcon(iconEl, 'network')

    // Base title/filename (clickable)
    const titleEl = headerContent.createDiv({ cls: 'sequence-card-title' })
    const cache = this.app.metadataCache.getFileCache(sequence.root.file)
    const title = (cache?.frontmatter?.title as string | undefined) || sequence.root.file.basename
    titleEl.setText(title)
    titleEl.addEventListener('click', (e) => {
      e.stopPropagation()
      void this.app.workspace.getLeaf(false).openFile(sequence.root.file)
    })

    // Sequence count badge
    const countBadge = headerContent.createDiv({ cls: 'sequence-count-badge' })
    countBadge.setText(`${sequence.allNodes.length}`)

    // Action buttons container
    const actionsEl = headerContent.createDiv({ cls: 'sequence-card-actions' })

    // Open in new tab button
    const openBtn = actionsEl.createDiv({
      cls: 'sequence-card-action-btn',
      attr: { 'aria-label': 'Open base note in new tab' },
    })
    setIcon(openBtn, 'external-link')
    openBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      void this.app.workspace.getLeaf(true).openFile(sequence.root.file)
    })

    // Card body with complete sequence (all children)
    const body = card.createDiv({ cls: 'sequence-card-body' })

    if (sequence.allNodes.length === 0) {
      body.createDiv({
        cls: 'sequence-card-empty',
        text: 'No children',
      })
    } else {
      // Render all nodes in the sequence (flattened hierarchy)
      sequence.allNodes.forEach((node) => {
        const item = body.createDiv({
          cls: 'sequence-child-item',
          attr: { style: `padding-left: ${12 + node.level * 20}px` },
        })

        // Child title/filename
        const childTitleEl = item.createDiv({ cls: 'sequence-child-title' })
        const childCache = this.app.metadataCache.getFileCache(node.file)
        const childTitle =
          (childCache?.frontmatter?.title as string | undefined) || node.file.basename
        childTitleEl.setText(childTitle)

        // Click handler to open the file
        item.addEventListener('click', (e) => {
          e.stopPropagation()
          void this.app.workspace.getLeaf(false).openFile(node.file)
        })
      })
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async onClose(): Promise<void> {
    // Clear any pending refresh timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout)
      this.refreshTimeout = null
    }
  }
}
