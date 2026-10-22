import { App, CachedMetadata, TFile, getAllTags } from 'obsidian'
import { FilenameFormat, ZettelDetectionMode, type ZettelSettings } from './settings'

/** Zettel filename (no extension): "ID", or "ID Title" / "ID <separator> Title" */
export function zettelFilename(
  id: string,
  title: string,
  settings: Pick<ZettelSettings, 'filenameFormat' | 'separator'>
): string {
  if (settings.filenameFormat === FilenameFormat.ID_ONLY || !title) return id
  return [id, settings.separator, title].filter(Boolean).join(' ')
}

/** Title part of a zettel basename: drops the leading ID and any separator token after it */
function zettelTitle(basename: string): string {
  return basename.replace(/^\S+\s*/, '').replace(/^[^\p{L}\p{N}\s]+\s+/u, '')
}

/** New "<id> <title>.md" name for a zettel whose ID changes; keeps the filename title, else the frontmatter one */
export function zettelRename(
  app: App,
  file: TFile,
  id: string,
  settings: Pick<ZettelSettings, 'filenameFormat' | 'separator'>
): string {
  const title =
    zettelTitle(file.basename) || frontmatterTitle(app.metadataCache.getFileCache(file)) || ''
  return `${zettelFilename(id, title, settings)}.md`
}

/** Fill a note template: every {{title}}, and {{date}} as YYYY-MM-DD */
export function fillTemplate(template: string, title: string): string {
  const date = new Date().toLocaleDateString('sv') // sv locale formats as YYYY-MM-DD
  return template.replaceAll('{{title}}', title).replaceAll('{{date}}', date)
}

/** Zettel content from its template; "ID only" filenames keep the idea on the first line (Duffney) */
export function zettelContent(
  template: string,
  title: string,
  settings: Pick<ZettelSettings, 'filenameFormat'>
): string {
  const content = fillTemplate(template, title)
  const needsTitleLine =
    settings.filenameFormat === FilenameFormat.ID_ONLY && !template.includes('{{title}}')
  return needsTitleLine ? content.replace(/^(---\n[\s\S]*?\n---\n)?/, `$1# ${title}\n`) : content
}

/**
 * Get the display title for a file
 * Prefers frontmatter title over filename
 */
export function getFileTitle(app: App, file: TFile): string {
  return frontmatterTitle(app.metadataCache.getFileCache(file)) ?? file.basename
}

/** The frontmatter title, if it is a non-empty string (an unfilled `title: {{title}}` parses as an object) */
export function frontmatterTitle(cache: CachedMetadata | null): string | undefined {
  const title: unknown = cache?.frontmatter?.title
  return typeof title === 'string' && title ? title : undefined
}

function resolveTarget(app: App, target: string): TFile | null {
  const linkpath = target
    .replace(/^\[\[|\]\]$/g, '')
    .split(/[|#]/)[0]
    ?.trim()
  return linkpath ? app.metadataCache.getFirstLinkpathDest(linkpath, '') : null
}

const orEmpty = <T>(list: T[] | undefined): T[] => list ?? []

function linkedPaths(app: App, file: TFile): string[] {
  const cache = app.metadataCache.getFileCache(file)
  const links: { link: string }[] = [...orEmpty(cache?.links), ...orEmpty(cache?.frontmatterLinks)]
  return links.map((l) => app.metadataCache.getFirstLinkpathDest(l.link, file.path)?.path ?? '')
}

/**
 * True if file links (body or frontmatter) to the note named by `target`
 * Accepts "Note", "path/Note" or "[[Note|alias]]"
 */
function fileLinksTo(app: App, file: TFile, target: string): boolean {
  const dest = resolveTarget(app, target)
  return !!dest && linkedPaths(app, file).includes(dest.path)
}

/** Parse "key: value" (value optional = property exists) */
function parseProperty(spec: string): { key: string; value: string } | null {
  const i = spec.indexOf(':')
  const key = (i < 0 ? '' : spec.slice(0, i)).trim()
  return key ? { key, value: spec.slice(i + 1).trim() } : null
}

function toArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') return v.split(/[,\s]+/).filter(Boolean)
  return []
}

const lower = (x: unknown): string =>
  typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean'
    ? String(x).toLowerCase()
    : ''

function frontmatterValue(app: App, file: TFile, key: string): unknown {
  return app.metadataCache.getFileCache(file)?.frontmatter?.[key]
}

/**
 * True if frontmatter property matches "key: value".
 * "key:" matches when the property exists. List properties match if any item equals value.
 */
function fileHasProperty(app: App, file: TFile, spec: string): boolean {
  const p = parseProperty(spec)
  if (!p) return false
  const v = frontmatterValue(app, file, p.key)
  if (v == null) return false
  return !p.value || [v].flat().some((x) => lower(x) === p.value.toLowerCase())
}

function fileHasTag(app: App, file: TFile, tag: string): boolean {
  const cache = app.metadataCache.getFileCache(file)
  const tags = cache ? getAllTags(cache) : null
  return !!tags?.includes(tag.startsWith('#') ? tag : `#${tag}`)
}

/** Match a file against a tag, link target or property depending on mode ('link' | 'property' | tag) */
export function matchesMarker(app: App, file: TFile, value: string, mode: string): boolean {
  if (mode === 'link') return fileLinksTo(app, file, value)
  if (mode === 'property') return fileHasProperty(app, file, value)
  return fileHasTag(app, file, value)
}

/** Sidebar filter value: "[[Note]]" = link, contains ":" = property, otherwise tag */
export function matchesFilter(app: App, file: TFile, value: string): boolean {
  const mode = value.startsWith('[[') ? 'link' : value.includes(':') ? 'property' : 'tag'
  return matchesMarker(app, file, value, mode)
}

type Frontmatter = Record<string, unknown>

function addToList(fm: Frontmatter, key: string, item: string): void {
  const cur = toArray(fm[key])
  if (item && !cur.includes(item)) fm[key] = [...cur, item]
}

function stampProperty(fm: Frontmatter, p: { key: string; value: string }): void {
  const cur = fm[p.key]
  if (cur == null) fm[p.key] = p.value || true
  else if (Array.isArray(cur)) addToList(fm, p.key, p.value)
}

const asLink = (value: string): string => (value.startsWith('[[') ? value : `[[${value}]]`)

function stampFrontmatter(fm: Frontmatter, mode: ZettelDetectionMode, value: string): void {
  if (mode === ZettelDetectionMode.TAG) addToList(fm, 'tags', value.replace(/^#/, ''))
  // ponytail: fixed "related" property for links, make configurable if needed
  else if (mode === ZettelDetectionMode.LINK) addToList(fm, 'related', asLink(value))
  else {
    const p = parseProperty(value)
    if (p) stampProperty(fm, p)
  }
}

/** Stamp a newly created note so its kind's detection mode finds it (folder mode needs nothing) */
export async function stampFile(
  app: App,
  file: TFile,
  mode: ZettelDetectionMode,
  value: string
): Promise<void> {
  if (mode === ZettelDetectionMode.FOLDER || !value) return
  await app.fileManager.processFrontMatter(file, (fm: Frontmatter) =>
    stampFrontmatter(fm, mode, value)
  )
}

/** `path` lies in `folder` or a subfolder; '' and '/' are the vault root */
export function isInFolder(path: string, folder: string): boolean {
  return folder === '' || folder === '/' || path.startsWith(`${folder}/`)
}
