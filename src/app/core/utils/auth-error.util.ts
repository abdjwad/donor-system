import { FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Maps a failed auth HTTP call to a translation key for a banner message,
 * pushing field-level errors onto `form` when the backend returns 422 validation errors.
 * Returns null when the error was fully absorbed into field errors (no banner needed).
 */
export function applyAuthError(err: HttpErrorResponse, form?: FormGroup): string | null {
  if (err.status === 422 && err.error?.errors) {
    const errors: Record<string, string[]> = err.error.errors;
    if (form) {
      Object.entries(errors).forEach(([field, messages]) => {
        form.get(field)?.setErrors({ serverError: messages[0] });
      });
      return null;
    }
    return Object.values(errors)[0]?.[0] ?? 'AUTH.ERRORS.GENERIC';
  }

  if (err.status === 0) return 'AUTH.ERRORS.NETWORK';
  if (err.status === 429) return 'AUTH.ERRORS.RATE_LIMIT';
  if (err.error?.message) return err.error.message;

  return 'AUTH.ERRORS.GENERIC';
}
