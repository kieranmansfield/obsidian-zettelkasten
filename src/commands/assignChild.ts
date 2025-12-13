import type { CommandFactory } from '../base/command'
import { App, Notice, FuzzySuggestModal } from 'obsidian'
import type { TFile } from 'obsidian'
import ZettelId from '../core/zettelId.class'
import { FilenameFormat } from '../base/settings'

/**
 * Modal for selecting a child zettel
 */
class ChildSelectorModal extends FuzzySuggestModal<TFile> {
  private zettels: TFile[]
  private currentFile: TFile
  private onChoose: (file: TFile) => void

  constructor(app: App, zettels: TFile[], currentFile: TFile, onChoose: (file: TFile) => void) {
    super(app)
    this.zettels = zettels.filter((f) => f.path !== currentFile.path) // Exclude current file
    this.currentFile = currentFile
    this.onChoose = onChoose
    this.setPlaceholder('Select child zettel...')
  }

  getItems(): TFile[] {
    return this.zettels
  }

  getItemText(file: TFile): string {
    const cache = this.app.metadataCache.getFileCache(file)
    const title: unknown = cache?.frontmatter?.title
    // Only use title if it's actually a string
    return typeof title === 'string' && title.length > 0 ? title : file.basename
  }

  renderSuggestion(value: { item: TFile }, el: HTMLElement): void {
    const file = value.item
    const cache = this.app.metadataCache.getFileCache(file)
    const title: unknown = cache?.frontmatter?.title
    const displayTitle = typeof title === 'string' && title.length > 0 ? title : file.basename

    el.createDiv({ cls: 'suggestion-title', text: displayTitle })
  }

  onChooseItem(file: TFile): void {
    this.onChoose(file)
  }
}

/**
 * Command: Assign Child
 *
 * Opens a modal to select a zettel to become a child of the active note
 */
export const assignChildCommand: CommandFactory = (context) => {
  return {
    id: 'assign-child',
    name: 'Assign Child',
    icon: 'link',

    metadata: {
      category: 'note-sequences',
      description: 'Assign a child zettel to the active note',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: () => {
      const activeFile = context.app.workspace.getActiveFile()
      if (!activeFile) {
        new Notice('No active file')
        return
      }

      if (!context.noteSequenceService || !context.fileService) {
        new Notice('Required services not available')
        return
      }

      const core = context.noteSequenceService.getCore()
      const currentIdString = core.extractZettelId(activeFile.basename)

      if (!currentIdString) {
        new Notice('Current file is not a zettel note')
        return
      }

      const currentId = ZettelId.parse(currentIdString)

      // Get all zettel files in the same folder
      const allFiles = context.app.vault
        .getMarkdownFiles()
        .filter((f) => f.parent?.path === activeFile.parent?.path)

      const zettelFiles = allFiles.filter((f) => {
        const id = core.extractZettelId(f.basename)
        return id !== null && f.path !== activeFile.path
      })

      if (zettelFiles.length === 0) {
        new Notice('No other zettels found in this folder')
        return
      }

      // Show modal to select child
      const modal = new ChildSelectorModal(context.app, zettelFiles, activeFile, (childFile) => {
        void (async () => {
          // Find existing children of current file
          const existingChildren = core.findChildren(activeFile, allFiles, true)
          let newId: ZettelId

          if (existingChildren.length === 0) {
            // First child
            newId = currentId.nextChild()
          } else {
            // Find the last child and get next sibling
            const lastChild = existingChildren[existingChildren.length - 1]
            const lastChildIdString = core.extractZettelId(lastChild.basename)
            if (!lastChildIdString) {
              new Notice('Error finding last child')
              return
            }
            const lastChildId = ZettelId.parse(lastChildIdString)
            const nextSiblingId = lastChildId.nextSibling()
            if (!nextSiblingId) {
              new Notice('Error generating new ID')
              return
            }
            newId = nextSiblingId
          }

          // Get title from frontmatter to preserve it
          const cache = context.app.metadataCache.getFileCache(childFile)
          const title = (cache?.frontmatter?.title as string | undefined) ?? ''

          // Get zettel settings to respect filename format
          const zettelSettings = context.settingsManager!.getZettel()
          const idString = newId.toString()

          // Build new filename based on settings
          let newFilename: string
          if (zettelSettings.filenameFormat === FilenameFormat.ID_ONLY) {
            newFilename = idString
          } else {
            // ID_TITLE format with configured separator
            const separator = zettelSettings.separator || '⁝'
            newFilename = title ? `${idString} ${separator} ${title}` : idString
          }

          // Ensure .md extension is included
          if (!newFilename.endsWith('.md')) {
            newFilename = `${newFilename}.md`
          }

          // Rename the selected file
          const result = await context.fileService!.rename({
            file: childFile,
            newName: newFilename,
          })

          if (result) {
            new Notice(`Assigned ${childFile.basename} as child`)
          } else {
            new Notice('Failed to assign child')
          }
        })()
      })

      modal.open()
    },
  }
}
