import type { TFile } from 'obsidian'

export interface FileCreateInput {
  folder: string
  filename: string
  extension?: string
  content?: string
}

export interface FileRenameInput {
  file: TFile
  newName: string
}

export interface FileResult {
  path: string
  filename: string
}
