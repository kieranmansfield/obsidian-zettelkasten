import { TFile, Vault } from 'obsidian'

export class VaultService {
  constructor(private vault: Vault) {}

  async createNote(path: string, content: string): Promise<TFile> {
    return this.vault.create(path, content)
  }
}
