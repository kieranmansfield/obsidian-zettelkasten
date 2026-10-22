import { describe, expect, it } from 'vitest'
import type { Plugin } from 'obsidian'
import SettingsManager from './SettingsManager'
import { DEFAULT_SETTINGS, INDEX_TEMPLATE, STRUCTURE_MARKER } from './DefaultSettings'

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

  it('moves legacy reference settings to literature', async () => {
    const s = await load({
      zettelkastenSidebar: {
        showReferences: false,
        literatureFilterTag: '',
        referencesFilterTag: 'src',
      },
    })
    expect(s.zettelkastenSidebar.showLiterature).toBe(false)
    expect(s.zettelkastenSidebar.literatureFilterTag).toBe('src')
    expect(s.zettelkastenSidebar.showReferences).toBeUndefined()
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

describe('SettingsManager import', () => {
  it('migrates an old export like saved data', async () => {
    const m = new SettingsManager({
      loadData: async () => null,
      saveData: async () => {},
    } as unknown as Plugin)
    await m.import(JSON.stringify({ boxes: { rootFolder: 'old' }, zettel: { defaultFolder: '' } }))
    expect(m.get('zettel').defaultFolder).toBe('old')
    expect('boxes' in m.getAll()).toBe(false)
    await expect(m.import('{oops')).rejects.toThrow('Failed to import settings')
  })
})

describe('SettingsManager defaults', () => {
  it('never writes through to DEFAULT_SETTINGS', async () => {
    const m = new SettingsManager({
      loadData: async () => null,
      saveData: async () => {},
    } as unknown as Plugin)
    await m.load()
    await m.enableCommand('some-command')
    expect(DEFAULT_SETTINGS.commands.enabledCommands).toEqual({})
    await m.resetToDefaults()
    expect(m.getEnabledCommandsMap().size).toBe(0)
  })
})
