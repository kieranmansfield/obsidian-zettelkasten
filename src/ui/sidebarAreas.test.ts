import { describe, expect, it, vi } from 'vitest'
import type { App, Plugin, TFile } from 'obsidian'
import SettingsManager from '../settings/SettingsManager'
import { sidebarAreas } from './sidebarAreas'

// obsidian has no runtime code outside the app; fileHelpers only needs it for getAllTags
vi.mock('obsidian', () => ({ getAllTags: () => [] }))

const T = '20241021130500123'
const file = (basename: string) => ({ basename }) as TFile
const app = { metadataCache: { getFileCache: () => null } } as unknown as App

const areas = async (data: unknown) => {
  const m = new SettingsManager({
    loadData: async () => data,
    saveData: async () => {},
  } as unknown as Plugin)
  await m.load()
  return sidebarAreas(app, m)
}

describe('sidebarAreas', () => {
  it('lists the default areas by folder', async () => {
    const items = await areas(null)
    expect(items.map((i) => [i.name, i.folder, i.inFolder])).toEqual([
      ['Inbox', 'inbox', true],
      ['Zettels', 'slipbox', true],
      ['Literature', 'reference', true],
      ['Structure notes', 'slipbox', true],
    ])
  })

  it('counts only notes with an ID as zettels in the slip-box', async () => {
    const zettels = (await areas(null))[1]
    expect(zettels.matches?.(file(`${T}a Idea`))).toBe(true)
    expect(zettels.matches?.(file('Index'))).toBe(false)
  })

  it('searches the vault by marker outside folder detection', async () => {
    const [inbox] = await areas({ fleeting: { detectionMode: 'tag', tag: 'fleeting' } })
    expect(inbox.inFolder).toBe(false)
    expect(inbox.matches?.(file('anything'))).toBe(false)
  })

  it('hides disabled areas', async () => {
    const items = await areas({
      fleeting: { enabled: false },
      zettelkastenSidebar: { showLiterature: false },
    })
    expect(items.map((i) => i.name)).toEqual(['Zettels', 'Structure notes'])
  })
})
