// Central field validators. Per REACT.md, all validation lives here — never
// inlined in components or hooks — driven by named constants.

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 8;
// The emailed sign-up code: exactly six digits, no separators.
export const VERIFICATION_CODE_PATTERN = /^\d{6}$/;
export const VERIFICATION_CODE_LENGTH = 6;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidPassword(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH;
}

export function isValidVerificationCode(value: string): boolean {
  return VERIFICATION_CODE_PATTERN.test(value.trim());
}

export function passwordsMatch(password: string, confirm: string): boolean {
  return password.length > 0 && password === confirm;
}
