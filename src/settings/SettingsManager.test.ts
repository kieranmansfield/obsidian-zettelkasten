import { describe, expect, it } from 'vitest'
import type { Plugin } from 'obsidian'
import SettingsManager, { compareSemver } from './SettingsManager'
import { INDEX_TEMPLATE, STRUCTURE_MARKER } from './DefaultSettings'

const load = async (data: unknown) => {
  const m = new SettingsManager({
    loadData: async () => data,
    saveData: async () => {},
  } as unknown as Plugin)
  await m.load()
  return m.getAll() as unknown as Record<string, Record<string, unknown>>
}

describe('SettingsManager', () => {
  it('defaults to the strict Zettelkasten areas', async () => {
    const s = await load(null)
    expect(s.zettel.defaultFolder).toBe('slipbox')
    expect(s.zettel.zettelIdFormat).toBe('YYYYMMDDHHmmssSSS')
    expect(s.fleeting.folder).toBe('inbox')
    expect(s.literature.folder).toBe('reference')
    expect(s.boxes).toBeUndefined()
  })

  it('migrates boxes and tag detection to one slip-box', async () => {
    const s = await load({
      boxes: { rootFolder: 'zettels', enabled: true },
      zettel: { defaultFolder: '', zettelDetectionMode: 'tag', zettelTag: 'type/zettels' },
      index: { folder: 'index', detectionMode: 'folder', tag: 'index', enabled: false },
    })
    expect(s.boxes).toBeUndefined()
    expect(s.zettel.defaultFolder).toBe('zettels')
    expect(s.zettel.zettelDetectionMode).toBe('folder')
    expect(s.zettel.zettelTag).toBe('type: permanent')
    expect(Object.keys(s.index).sort()).toEqual([
      'enabled',
      'openOnCreate',
      'template',
      'templatePath',
    ])
    expect(s.index.enabled).toBe(false)
  })

  it('keeps an existing slip-box folder', async () => {
    const s = await load({ boxes: { rootFolder: 'old' }, zettel: { defaultFolder: 'Zettels' } })
    expect(s.zettel.defaultFolder).toBe('Zettels')
  })

  it('ships the skill note formats', async () => {
    const s = await load(null)
    expect(s.index.template).toContain(STRUCTURE_MARKER)
    expect(INDEX_TEMPLATE).toMatch(/^---\ntype: index\n---\n# Index/)
    expect(s.zettel.template).toMatch(/^---\ncreated: \{\{date\}\}\n---/)
    expect(s.literature.template).toContain('type: literature')
    expect(s.fleeting.template).toBe('')
  })
})

describe('compareSemver', () => {
  it('compares numerically', () => {
    expect(compareSemver('0.1.10', '0.1.4')).toBeGreaterThan(0)
    expect(compareSemver('0.1.4', '0.1.4')).toBe(0)
    expect(compareSemver('0.0.9', '0.1.0')).toBeLessThan(0)
  })
})
