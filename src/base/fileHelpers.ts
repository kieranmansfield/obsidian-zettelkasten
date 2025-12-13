import { App, CachedMetadata, TFile } from 'obsidian'

/**
 * Get the display title for a file
 * Prefers frontmatter title over filename
 */
export function getFileTitle(app: App, file: TFile): string {
  const cache = app.metadataCache.getFileCache(file)
  return (cache?.frontmatter?.title as string | undefined) ?? file.basename
}

/**
 * Get the display title for a file (alternative without app)
 */
export function getFileTitleFromCache(file: TFile, cache: CachedMetadata | null): string {
  return (cache?.frontmatter?.title as string | undefined) ?? file.basename
}
