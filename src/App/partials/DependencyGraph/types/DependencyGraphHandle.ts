export interface DependencyGraphHandle {
  focusNode(path: string): void;
  clearAllHighlights(): void;
}
