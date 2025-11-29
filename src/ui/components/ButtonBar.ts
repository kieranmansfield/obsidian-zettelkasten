import { Setting } from 'obsidian'

export const createButtonBar = (container: HTMLElement) => {
  const s = new Setting(container)
  const el = container.createDiv({ cls: 'zk-button-bar' })
  el.style.display = 'flex'
  el.style.gap = '8px'
  el.style.justifyContent = 'flex-end'
  return el
}
