import { MoveMode } from '../../types/interfaces'

export default class DragController {
  constructor(
    private rootEl: HTMLElement,
    private onDrop: (movingId: string, targetId: string | null, mode: MoveMode) => void
  ) {
    this.init()
  }

  private init() {
    this.rootEl.addEventListener('dragstart', (e) => {
      const target = e.target as HTMLElement
      const li = target.closest('li')
      if (!li) return
      const id = li.dataset.id
      if (!id) return
      e.dataTransfer?.setData('text/plain', id)
      li.classList.add('zk-dragging')
    })
    this.rootEl.addEventListener('dragend', (e) => {
      const target = e.target as HTMLElement
      const li = target.closest('li')
      if (!li) return
      li.classList.remove('zk-dragging')
    })
    this.rootEl.addEventListener('dragover', (e) => {
      e.preventDefault()
    })
    this.rootEl.addEventListener('drop', (e) => {
      e.preventDefault()
      const movingId = e.dataTransfer?.getData('text/plain')
      if (!movingId) return
      const target = (e.target as HTMLElement).closest('li')
      const targetId = target?.dataset?.id ?? null
      const mode = e.shiftKey ? 'sibling-after' : 'child'
      this.onDrop(movingId, targetId, mode)
    })
  }
}
