import { ItemView, WorkspaceLeaf, debounce, type Workspace } from 'obsidian'
import type NoteSequenceService from '../service/noteSequence.service'
import { renderEmptyState, renderSequenceCards } from './sequenceCards'
import { onFileChanges } from './viewEvents'

export const VIEW_TYPE_NOTE_SEQUENCES = 'note-sequences-view'

/** Focus the sequences tab, opening it if needed */
export async function openNoteSequencesView(workspace: Workspace): Promise<void> {
  let leaf = workspace.getLeavesOfType(VIEW_TYPE_NOTE_SEQUENCES)[0]
  if (!leaf) {
    leaf = workspace.getLeaf('tab')
    await leaf.setViewState({ type: VIEW_TYPE_NOTE_SEQUENCES, active: true })
  }
  await workspace.revealLeaf(leaf)
}

/**
 * NoteSequencesView
 *
 * Card view displaying all note sequences.
 * Shows parent notes and their children in an organized, visual format.
 */
export class NoteSequencesView extends ItemView {
  private sequenceService: NoteSequenceService
  private scheduleRefresh = debounce(() => this.refresh(), 300, true)

  constructor(leaf: WorkspaceLeaf, sequenceService: NoteSequenceService) {
    super(leaf)
    this.sequenceService = sequenceService
    onFileChanges(this, this.app.vault, this.scheduleRefresh)
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
    return 'Note sequences'
  }

  getIcon(): string {
    return 'layers'
  }

  async onOpen(): Promise<void> {
    this.refresh()
  }

  private renderContent(container: HTMLElement): void {
    const roots = this.sequenceService.roots(this.app.vault.getMarkdownFiles())
    if (roots.length === 0) {
      renderEmptyState(
        container,
        'No root zettel notes found',
        'Root zettel ids are 17 digits long, for example "20241202193045123"',
        'Create a zettel note using the create zettel note command'
      )
      return
    }

    const sequences = this.sequenceService.sequencesWithChildren(roots)
    if (sequences.length === 0) {
      renderEmptyState(
        container,
        'No note sequences with children found',
        'Create child notes using the indent zettel or assign child commands'
      )
      return
    }
    renderSequenceCards(this.app, container, sequences)
  }

  async onClose(): Promise<void> {
    this.scheduleRefresh.cancel()
  }
}
