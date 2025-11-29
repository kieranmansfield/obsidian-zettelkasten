import { BoxDefinition } from '../../types/interfaces'

export interface IBoxRepository {
  loadBoxes(): Promise<BoxDefinition[]>
}
