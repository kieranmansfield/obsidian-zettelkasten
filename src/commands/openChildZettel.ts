import type { CommandFactory } from '../base/command'
import { Notice, FuzzySuggestModal, App } from 'obsidian'
import type { TFile } from 'obsidian'

/**
 * Modal for selecting from multiple children
 */
class ChildSelectorModal extends FuzzySuggestModal<TFile> {
  private children: TFile[]
  private onChoose: (file: TFile) => void

  constructor(app: App, children: TFile[], onChoose: (file: TFile) => void) {
    super(app)
    this.children = children
    this.onChoose = onChoose
    this.setPlaceholder('Select child zettel...')
  }

  getItems(): TFile[] {
    return this.children
  }

  getItemText(file: TFile): string {
    const cache = this.app.metadataCache.getFileCache(file)
    return (cache?.frontmatter?.title as string | undefined) ?? file.basename
  }

  onChooseItem(file: TFile): void {
    this.onChoose(file)
  }
}

/**
 * Command: Open Child Zettel / Down a Level
 *
 * Opens the first child zettel of the active note (or shows a picker if multiple)
 */
export const openChildZettelCommand: CommandFactory = (context) => {
  return {
    id: 'open-child-zettel',
    name: 'Open Child Zettel (Down a Level)',
    icon: 'arrow-down',

    metadata: {
      category: 'note-sequences',
      description: 'Navigate to first child zettel',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: async () => {
      const activeFile = context.app.workspace.getActiveFile()
      if (!activeFile) {
        new Notice('No active file')
        return
      }

      if (!context.noteSequenceService) {
        new Notice('Note sequence service not available')
        return
      }

      const results = context.noteSequenceService.navigateToChildren(activeFile)

      if (results.length === 0 || !results[0].success) {
        new Notice(results[0]?.error || 'No child zettels found')
        return
      }

      const children = results.filter((r) => r.success && r.node).map((r) => r.node!.file)

      if (children.length === 0) {
        new Notice('No child zettels found')
        return
      }

      if (children.length === 1) {
        // Open the only child directly
        const leaf = context.app.workspace.getLeaf(false)
        await leaf.openFile(children[0])
        new Notice(`Navigated to child: ${children[0].basename}`)
      } else {
        // Show picker modal for multiple children
        const modal = new ChildSelectorModal(context.app, children, (file) => {
          void (async () => {
            const leaf = context.app.workspace.getLeaf(false)
            await leaf.openFile(file)
            new Notice(`Navigated to child: ${file.basename}`)
          })()
        })
        modal.open()
      }
    },
  }
}
