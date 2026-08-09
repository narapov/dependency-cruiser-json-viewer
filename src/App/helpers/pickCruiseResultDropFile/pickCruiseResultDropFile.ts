/** Whether a dropped file has JSON MIME type. */
function isCruiseResultJsonFile(file: File): boolean {
  return file.type === 'application/json';
}

/** Pick the sole JSON file from a drop, or `null` if missing / not alone. */
export function pickCruiseResultDropFile(files: ArrayLike<File>): File | null {
  const list = Array.from(files);
  if (list.length !== 1) {
    return null;
  }
  const [file] = list;
  return file != null && isCruiseResultJsonFile(file) ? file : null;
}

/** Whether dragged file items look like a single `application/json` file. */
export function isCruiseResultDragAllowed(dataTransfer: DataTransfer): boolean {
  const fileItems = Array.from(dataTransfer.items ?? []).filter(item => item.kind === 'file');
  if (fileItems.length !== 1) {
    return false;
  }
  const [item] = fileItems;
  return item != null && item.type === 'application/json';
}
