import { App, TFile } from 'obsidian'

/**
 * Get the display title for a file
 * Prefers frontmatter title over filename
 */
export function getFileTitle(app: App, file: TFile): string {
  const cache = app.metadataCache.getFileCache(file)
  return cache?.frontmatter?.title || file.basename
}

/**
 * Get the display title for a file (alternative without app)
 */
export function getFileTitleFromCache(file: TFile, cache: any): string {
  return cache?.frontmatter?.title || file.basename
}
