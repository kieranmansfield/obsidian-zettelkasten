import { ZettelId } from './zettelId'
import { NoteCreateInput } from './note'

export interface ZettelCreateInput extends NoteCreateInput {
  zettelId: ZettelId
}
