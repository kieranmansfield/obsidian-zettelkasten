export interface NoteCreateInput {
  folder?: string
  title: string
  extension?: string
  content?: string
}

export interface NoteRenameInput {
  newTitle: string
}
