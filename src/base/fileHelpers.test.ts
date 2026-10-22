import { describe, expect, it, vi } from 'vitest'
import type { App, TFile } from 'obsidian'
import { fillTemplate, zettelContent, zettelFilename, zettelRename } from './fileHelpers'
import { FilenameFormat } from './settings'

// obsidian has no runtime code outside the app; fileHelpers only needs it for getAllTags
vi.mock('obsidian', () => ({ getAllTags: () => [] }))

const ID = '20241021130500123'
const T = { filenameFormat: FilenameFormat.ID_TITLE, separator: '' }
const ID_ONLY = { filenameFormat: FilenameFormat.ID_ONLY, separator: '' }
const app = (frontmatter?: object) =>
  ({
    metadataCache: { getFileCache: () => (frontmatter ? { frontmatter } : null) },
  }) as unknown as App
const f = (basename: string) => ({ basename }) as TFile

describe('zettelFilename', () => {
  it('builds ID Title', () => {
    expect(zettelFilename(`${ID}a1`, 'My idea', T)).toBe(`${ID}a1 My idea`)
    expect(zettelFilename(ID, 'X', { ...T, separator: '⁝' })).toBe(`${ID} ⁝ X`)
    expect(zettelFilename(ID, '', T)).toBe(ID)
    expect(zettelFilename(ID, 'X', ID_ONLY)).toBe(ID)
  })
})

describe('zettelRename', () => {
  it('keeps the title and the .md extension', () => {
    expect(zettelRename(app(), f(`${ID}a1 Writing is thinking`), 'NEW', T)).toBe(
      'NEW Writing is thinking.md'
    )
    expect(zettelRename(app(), f(`${ID}a1 ⁝ Writing is thinking`), 'NEW', T)).toBe(
      'NEW Writing is thinking.md'
    )
    expect(zettelRename(app(), f(`${ID}a1`), 'NEW', T)).toBe('NEW.md')
    expect(zettelRename(app(), f(`${ID}a1 Old`), 'NEW', ID_ONLY)).toBe('NEW.md')
  })

  it('ignores a non-string frontmatter title', () => {
    // `title: {{title}}` left unfilled by an old template parses as an object
    expect(zettelRename(app({ title: { '{ title }': null } }), f(`${ID}a1 Real`), 'NEW', T)).toBe(
      'NEW Real.md'
    )
    expect(zettelRename(app({ title: null }), f(`${ID}a1 Real`), 'NEW', T)).toBe('NEW Real.md')
  })

  it('prefers the frontmatter title', () => {
    expect(zettelRename(app({ title: 'FM' }), f(`${ID}a1 x`), 'NEW', T)).toBe('NEW FM.md')
  })
})

describe('templates', () => {
  it('fills every placeholder', () => {
    expect(fillTemplate('created: {{date}} {{title}} {{title}}', 'A')).toMatch(
      /^created: \d{4}-\d{2}-\d{2} A A$/
    )
  })

  it('adds a heading for ID-only names when the template has no title', () => {
    expect(zettelContent('---\ncreated: {{date}}\n---\nbody', 'Idea', ID_ONLY).split('\n')[3]).toBe(
      '# Idea'
    )
    expect(zettelContent('# {{title}}', 'Idea', ID_ONLY)).toBe('# Idea')
    expect(zettelContent('body', 'Idea', T)).toBe('body')
  })
})
