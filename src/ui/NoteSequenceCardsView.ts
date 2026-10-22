import { BasesView, BasesViewRegistration, QueryController } from 'obsidian'
import type NoteSequenceService from '../service/noteSequence.service'
import { renderEmptyState, renderSequenceCards } from './sequenceCards'

/**
 * NoteSequenceCardsView
 *
 * Bases View layout that displays note sequences as cards.
 * This view is available when viewing a .base file.
 */
class NoteSequenceCardsView extends BasesView {
  type = 'note-sequence-cards'
  private sequenceService: NoteSequenceService
  private contentEl: HTMLElement | null = null
  containerEl: HTMLElement

  constructor(
    controller: QueryController,
    containerEl: HTMLElement,
    sequenceService: NoteSequenceService
  ) {
    super(controller)
    this.sequenceService = sequenceService
    this.containerEl = containerEl
  }

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
    // Create or clear content element, preserving the filter UI
    if (!this.contentEl) {
      this.contentEl = this.containerEl.createDiv({ cls: 'note-sequences-bases-view' })
    } else {
      this.contentEl.empty()
    }

    const container = this.contentEl

    const files = this.data.data.map((entry) => entry.file).filter((f) => f !== null)
    if (files.length === 0) {
      renderEmptyState(
        container,
        'No notes in this base',
        'Add notes to this base to see them as sequence cards'
      )
      return
    }

    const roots = this.sequenceService.roots(files)
    if (roots.length === 0) {
      renderEmptyState(
        container,
        'No root zettel notes found',
        'Root zettel ids are 17 digits long, for example "20241202193045123"'
      )
      return
    }

    const sequences = this.sequenceService.sequencesWithChildren(roots)
    if (sequences.length === 0) {
      renderEmptyState(
        container,
        'No sequences with children found',
        'Create child notes to see sequences displayed here.'
      )
      return
    }
    renderSequenceCards(this.app, container, sequences)
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
    factory: (controller: QueryController, containerEl: HTMLElement) =>
      new NoteSequenceCardsView(controller, containerEl, sequenceService),
  }
}
