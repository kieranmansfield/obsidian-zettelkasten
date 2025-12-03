import { TFile, Notice, Plugin } from 'obsidian'
import { fixZettelFilename } from './core/files/fix-filename'
import ZettelId from './core/zettels/ZettelId'
import { createChildZettel } from './commands/create-child-zettel'
import { createSiblingZettel } from './commands/create-sibling-zettel'
import { revealParentZettel } from './commands/reveal-parent-zettel'
import { createZettel } from './commands/create-zettel'

export default class ZettelkastenPlugin extends Plugin {
  async onload() {


  }
}
