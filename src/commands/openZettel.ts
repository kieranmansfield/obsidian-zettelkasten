import type { CommandFactory } from '../base/command'
import { ZettelSuggester } from '../ui/ZettelSuggester'
import { MarkdownView, TFile } from 'obsidian'

/**
 * Command: Open Zettel
 *
 * Opens a fuzzy search modal to find and open zettel notes
 * Ported from master branch - DO NOT MODIFY FUNCTIONALITY
 */
export const openZettelCommand: CommandFactory = (context) => {
  return {
    id: 'open-zettel',
    name: 'Open Zettel',
    icon: 'folder-open',

    metadata: {
      category: 'navigation',
      description: 'Search and open zettel notes',
      canBeDisabled: true,
      enabledByDefault: true,
    },

    execute: async () => {
      const zettels = getZettelFiles(context.app)
      const selectedText = getCurrentlySelectedText(context.app)

      new ZettelSuggester(context.app, zettels, selectedText, (file: TFile) => {
        context.app.workspace.getLeaf().openFile(file)
      }).open()
    },
  }
}

/**
 * Get all zettel files
 * Adapted from master's getNoteTitlesByTag to work with folder-based detection
 */
function getZettelFiles(app: any): TFile[] {
  const files = app.vault.getMarkdownFiles()
  const zettels: TFile[] = []

  for (const file of files) {
    // Check if file has a zettel ID (17 digits at start of filename)
    const zettelIdPattern = /^\d{17}/
    if (!zettelIdPattern.test(file.basename)) {
      continue
    }

    zettels.push(file)
  }

  return zettels
}

/**
 * Get currently selected text in active editor
 */
function getCurrentlySelectedText(app: any): string | undefined {
  const view = app.workspace.getActiveViewOfType(MarkdownView)
  if (!view) {
    return undefined
  }
  return view.editor.getSelection()
}
