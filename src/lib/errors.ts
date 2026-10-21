// Expected, user-facing failures carry a code instead of a sentence: services have no
// access to the locale, so the UI translates the code (messages `Errors.<code>`).
export type AppErrorCode =
  | 'alreadyClockedIn'
  | 'alreadyClockedOut'
  | 'clockOutBeforeIn'
  | 'timeMustBeAfter'
  | 'timeMustBeBefore'
  | 'undoConflict'
  | 'importReadFailed'
  | 'importInvalidJson'
  | 'importUnsupportedFormat'
  | 'importFailed'
  | 'settingsImportFailed';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly params: Record<string, string>;

  constructor(code: AppErrorCode, params: Record<string, string> = {}) {
    super(code);
    this.name = 'AppError';
    this.code = code;
    this.params = params;
  }
}
