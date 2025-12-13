import {
  BasesView,
  BasesViewRegistration,
  BasesViewFactory,
  QueryController,
  TFile,
  setIcon,
} from 'obsidian'
import type NoteSequenceService from '../service/noteSequence.service'
import type { NoteSequence } from '../base/noteSequence'
import { getFileTitle } from '../base/fileHelpers'

/**
 * NoteSequenceCardsView
 *
 * Bases View layout that displays note sequences as cards.
 * This view is available when viewing a .base file.
 */
export class NoteSequenceCardsView extends BasesView {
  type = 'note-sequence-cards'
  private sequenceService: NoteSequenceService

  constructor(
    controller: QueryController,
    containerEl: HTMLElement,
    sequenceService: NoteSequenceService
  ) {
    super(controller)
    this.sequenceService = sequenceService
    this.containerEl = containerEl
  }

  containerEl: HTMLElement

  /**
   * Called when query data is updated
   */
  onDataUpdated(): void {
    this.render()
  }

  /**
   * Render the view
   */
  private render(): void {
    const container = this.containerEl
    container.empty()
    container.addClass('note-sequences-bases-view')

    // Get all files from the query result
    const files = this.data.data.map((entry) => entry.file).filter((f) => f !== null)

    if (files.length === 0) {
      const emptyState = container.createDiv({ cls: 'sequence-empty-state' })
      emptyState.createEl('h3', { text: 'No notes in this base' })
      emptyState.createEl('p', {
        text: 'Add notes to this base to see them as sequence cards',
        cls: 'setting-item-description',
      })
      return
    }

    // Get root zettels
    const core = this.sequenceService.getCore()
    const rootZettels = core.findAllRoots(files)

    if (rootZettels.length === 0) {
      const emptyState = container.createDiv({ cls: 'sequence-empty-state' })
      emptyState.createEl('h3', { text: 'No root zettel notes found' })
      emptyState.createEl('p', {
        text: 'Root zettel ids are 17 digits long, for example "20241202193045123"',
        cls: 'setting-item-description',
      })
      return
    }

    // Create grid container for cards
    const gridContainer = container.createDiv({ cls: 'sequence-grid' })

    // Display each root zettel with its children as a card
    rootZettels.forEach((rootFile) => {
      const sequence = this.sequenceService.getSequenceForFile(rootFile)
      if (sequence) {
        this.createSequenceCard(gridContainer, sequence)
      } else {
        this.createRootOnlyCard(gridContainer, rootFile)
      }
    })
  }

  /**
   * Create a card for a root note without children
   */
  private createRootOnlyCard(container: HTMLElement, file: TFile): void {
    const card = container.createDiv({ cls: 'sequence-card' })

    // Card header
    const header = card.createDiv({ cls: 'sequence-card-header' })
    const headerContent = header.createDiv({ cls: 'sequence-card-header-content' })

    // Icon
    const iconEl = headerContent.createDiv({ cls: 'sequence-card-icon' })
    setIcon(iconEl, 'file')

    // Title (clickable)
    const titleEl = headerContent.createDiv({ cls: 'sequence-card-title' })
    const title = getFileTitle(this.app, file)
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

  /**
   * Create a card for a note sequence
   */
  private createSequenceCard(container: HTMLElement, sequence: NoteSequence): void {
    const card = container.createDiv({ cls: 'sequence-card' })

    // Card header with parent note
    const header = card.createDiv({ cls: 'sequence-card-header' })
    const headerContent = header.createDiv({ cls: 'sequence-card-header-content' })

    // Parent icon
    const iconEl = headerContent.createDiv({ cls: 'sequence-card-icon' })
    setIcon(iconEl, 'layers')

    // Parent title (clickable)
    const titleEl = headerContent.createDiv({ cls: 'sequence-card-title' })
    const title = getFileTitle(this.app, sequence.root.file)
    titleEl.setText(title)
    titleEl.addEventListener('click', (e) => {
      e.stopPropagation()
      void this.app.workspace.getLeaf(false).openFile(sequence.root.file)
    })

    // Action buttons container
    const actionsEl = headerContent.createDiv({ cls: 'sequence-card-actions' })

    // Open in new tab button
    const openBtn = actionsEl.createDiv({
      cls: 'sequence-card-action-btn',
      attr: { 'aria-label': 'Open sequence in new tab' },
    })
    setIcon(openBtn, 'external-link')
    openBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      void this.app.workspace.getLeaf(true).openFile(sequence.root.file)
    })

    // Card body with children
    const body = card.createDiv({ cls: 'sequence-card-body' })

    if (sequence.allNodes.length === 0) {
      body.createDiv({
        cls: 'sequence-card-empty',
        text: 'No children',
      })
    } else {
      // Render all nodes (already flattened in allNodes)
      sequence.allNodes.forEach((node) => {
        const item = body.createDiv({
          cls: 'sequence-child-item',
          attr: { style: `padding-left: ${12 + node.level * 20}px` },
        })

        // Child title
        const childTitleEl = item.createDiv({ cls: 'sequence-child-title' })
        const childTitle = getFileTitle(this.app, node.file)
        childTitleEl.setText(childTitle)

        // Click handler to open the file
        item.addEventListener('click', (e) => {
          e.stopPropagation()
          void this.app.workspace.getLeaf(false).openFile(node.file)
        })
      })
    }
  }
}

/**
 * Factory function to create NoteSequenceCardsView instances
 */
export function createNoteSequenceCardsViewFactory(
  sequenceService: NoteSequenceService
): BasesViewFactory {
  return (controller: QueryController, containerEl: HTMLElement) => {
    return new NoteSequenceCardsView(controller, containerEl, sequenceService)
  }
}

/**
 * Registration configuration for the Note Sequence Cards view
 */
export function createNoteSequenceCardsViewRegistration(
  sequenceService: NoteSequenceService
): BasesViewRegistration {
  return {
    name: 'Note Sequence Cards',
    icon: 'layers',
    factory: createNoteSequenceCardsViewFactory(sequenceService),
  }
}
