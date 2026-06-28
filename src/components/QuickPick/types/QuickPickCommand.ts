export interface QuickPickCommand {
  id: string
  label: string
  onExecute: () => void
}
