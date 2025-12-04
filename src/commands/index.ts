/**
 * Command Module Index
 *
 * Central export point for all commands.
 * Import this in main.ts to access all command factories.
 */

export { createZettelNoteCommand } from './createZettelNote'
export { createFleetingNoteCommand } from './createFleetingNote'
export { createIndexNoteCommand } from './createIndexNote'
export { createLiteratureNoteCommand } from './createLiteratureNote'
export { openBoxPaletteCommand } from './openBoxPalette'
export { openZettelCommand } from './openZettel'
export { openIndexCommand } from './openIndex'
export { openNoteSequencesViewCommand } from './openNoteSequencesView'
export { openSequenceNavigatorViewCommand } from './openSequenceNavigatorView'
export { openSequenceCommandPaletteCommand } from './openSequenceCommandPalette'
export { openZettelkastenViewCommand } from './openZettelkastenView'
export { openNoteSequencesBasesViewCommand } from './openNoteSequencesBasesView'

// Note Sequence manipulation commands
export { indentZettelCommand } from './indentZettel'
export { outdentZettelCommand } from './outdentZettel'
export { assignParentCommand } from './assignParent'
export { assignChildCommand } from './assignChild'

// Note Sequence navigation commands
export { openParentZettelCommand } from './openParentZettel'
export { openChildZettelCommand } from './openChildZettel'
export { nextSiblingCommand } from './nextSibling'
export { nextChildCommand } from './nextChild'
export { nextSequenceCommand } from './nextSequence'

// Bookmark management commands
export { addBookmarkCommand, removeBookmarkCommand } from './manageBookmarks'

// Add more command exports here as you create them

/*
✓ DONE Open Box Palette Command - Now works as a per-box quick switcher. Select a box, then fuzzy search notes within it.
TODO UPDATE Create Zettel Function with a Fuzzy Search Model (like quick switcher) that allows users to find notes already in boxes.



!!! Commands to create & build below

! Utilities
TODO Add Title to Aliases

! Note Sequence Assigning
TODO Assign Child
TODO Assign Parent

! Utils
TODO Batch Fix Zettel Filenames (Select Folder)
TODO Fix Zettel Filename

! File Creation
TODO Create Child Zettel
TODO Create Inbox Note
TODO Create Index
TODO Create Sibling Zettel
TODO Create Zettel - hotkey alt + z


! Note Sequence Navigation
TODO Go Down a Level
TODO Go Up a Level
TODO Go to Next Child
TODO Go to Previous Child
TODO Go to Next Sequence
TODO Go to Previous Sequence
TODO Open Child Zettel
TODO Open Parent Zettel
TODO Quick Zettelkasten Navigator
TODO Toggle Note Sequence Navigator

! Note sequence update
TODO Indent Zettel
TODO Reorder Sequence (Alpha)
TODO Outdent Zettel

! open note types
TODO Open Inbox Note
TODO Open Index
TODO Open Sibling Zettel
TODO Open Zettel/slipbox - hotkey alt + s



*/
