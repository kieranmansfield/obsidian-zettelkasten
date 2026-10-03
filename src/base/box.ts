export type BoxType = 'folder' | 'tag' | 'link' | 'property'

export interface Box {
  type: BoxType // Determines if the box is identified by folder, tag, link or property
  value: string // The folder path, tag name, link target or property
  name: string // Human-readable name
  default?: boolean // Optional, marks the box as default
}
