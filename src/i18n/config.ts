import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { type AppLanguage, defaultNS, resources } from "./resources";

const STORAGE_KEY = "wharf-language";
const FALLBACK: AppLanguage = "en";

function isSupported(value: string | null): value is AppLanguage {
  return value !== null && value in resources;
}

// Reads a persisted language choice, guarding globalThis access so SSR/tests are
// safe, and validating it against the known resources before use.
function initialLanguage(): AppLanguage {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
    if (isSupported(stored)) {
      return stored;
    }
  } catch {
    // localStorage unavailable (SSR / private mode) — fall back.
  }
  return FALLBACK;
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    defaultNS,
    lng: initialLanguage(),
    fallbackLng: FALLBACK,
    interpolation: { escapeValue: false },
  });
}

export default i18n;
export { STORAGE_KEY };
