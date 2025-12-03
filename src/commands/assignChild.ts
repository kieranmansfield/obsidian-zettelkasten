import type { CommandFactory } from '../base/command'
import { Notice, FuzzySuggestModal } from 'obsidian'
import type { TFile } from 'obsidian'
import ZettelId from '../core/zettelId.class'

/**
 * Modal for selecting a child zettel
 */
class ChildSelectorModal extends FuzzySuggestModal<TFile> {
  private zettels: TFile[]
  private currentFile: TFile
  private onChoose: (file: TFile) => Promise<void>

  constructor(app: any, zettels: TFile[], currentFile: TFile, onChoose: (file: TFile) => Promise<void>) {
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
    return cache?.frontmatter?.title || file.basename
  }

  async onChooseItem(file: TFile) {
    await this.onChoose(file)
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

    execute: async () => {
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
        .filter((f) => f.path.startsWith(activeFile.parent?.path || ''))

      const zettelFiles = allFiles.filter((f) => {
        const id = core.extractZettelId(f.basename)
        return id !== null && f.path !== activeFile.path
      })

      if (zettelFiles.length === 0) {
        new Notice('No other zettels found in this folder')
        return
      }

      // Show modal to select child
      const modal = new ChildSelectorModal(context.app, zettelFiles, activeFile, async (childFile) => {
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
        const title = cache?.frontmatter?.title || ''

        // Build new filename
        const newFilename = title ? `${newId.toString()} ${title}` : newId.toString()

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
      })

      modal.open()
    },
  }
}
