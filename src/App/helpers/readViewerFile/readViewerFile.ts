import { CruiseResultParseError, parseViewerFileJson, type ParsedViewerFile } from '@/domain';
import { raceWithAbortSignal } from '@/Shared';

type Translate = (key: string) => string;

/** Map parse/read failures to a user-facing cruise-result error message. */
export function resolveViewerFileParseErrorMessage(error: unknown, t: Translate): string {
  if (error instanceof CruiseResultParseError) {
    return error.code === 'invalidJson' ? t('app.invalidCruiseResultJson') : t('app.invalidCruiseResultFormat');
  }
  return t('app.invalidCruiseResultFormat');
}

/** Whether the error is an abort that should be ignored by the load UI. */
export function isViewerFileLoadAbort(error: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (error instanceof DOMException && error.name === 'AbortError');
}

/** Read and parse a viewer JSON file, racing against an abort signal. */
export async function readViewerFile(file: File, signal: AbortSignal): Promise<ParsedViewerFile> {
  return raceWithAbortSignal(
    file.text().then(text => parseViewerFileJson(text)),
    signal,
  );
}
