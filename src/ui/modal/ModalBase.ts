/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal } from 'obsidian'

export abstract class ModalBase<T = void> extends Modal {
  constructor(app: any) {
    super(app)
  }

  abstract openModal(): void
}
