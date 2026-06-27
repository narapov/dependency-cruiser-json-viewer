export interface TreeHandle {
  scrollIntoView: (key: string, options?: ScrollIntoViewOptions) => void
  getElementByKey: (key: string) => HTMLElement | null
}
