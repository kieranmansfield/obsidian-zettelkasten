import type { Component, Vault } from 'obsidian'

/** Call `refresh` whenever a file is created, deleted or renamed, for as long as `view` lives */
export function onFileChanges(view: Component, vault: Vault, refresh: () => void): void {
  view.registerEvent(vault.on('create', refresh))
  view.registerEvent(vault.on('delete', refresh))
  view.registerEvent(vault.on('rename', refresh))
}
