export type BoxType = 'folder' | 'tag'

export interface Box {
  type: BoxType // Determines if the box is identified by folder or tag
  value: string // The folder path or tag name
  name: string // Human-readable name
  default?: boolean // Optional, marks the box as default
}
