// Typed translation resources. Per REACT.md these are plain TypeScript objects
// (no JSON, no HTTP) so every key is compile-time checked. `enCommon` is the
// source of truth for the key shape; other languages are typed against it.
//
// Inline emphasis is expressed with numbered tags (e.g. <1>…</1>) consumed by
// react-i18next's <Trans> so copy stays in the resource file, not the JSX.

const enCommon = {
  app: {
    name: "wharf",
  },
  steps: {
    account: "account",
    recoveryCode: "recovery code",
    connectDevice: "connect device",
  },
  common: {
    or: "or",
    continueWithProviders: "continue with Google / GitHub",
    comingSoon: "coming soon",
  },
  fields: {
    email: "email",
    masterPassword: "master password",
    confirmPassword: "confirm master password",
    newMasterPassword: "new master password",
    recoveryCode: "recovery code",
  },
  strength: {
    label: "password strength",
    weak: "weak",
    fair: "fair",
    good: "good",
    strong: "strong",
  },
  signup: {
    title: "Create your account",
    warning:
      "This password encrypts your vault on your device. We never see it and <1>cannot reset it</1> — only your recovery code can.",
    understand: "I understand that wharf cannot recover my password",
    submit: "Create account",
  },
  recovery: {
    title: "Save your recovery code",
    intro:
      "These 40 characters are the <1>only</1> way to reset your password. They are shown <3>once, right now</3> — we keep no readable copy.",
    copy: "Copy",
    copied: "Copied",
    download: "Download .txt",
    print: "Print",
    stored: "I stored this code somewhere safe, outside this device",
    continue: "Continue",
    footnote: "button unlocks once confirmed · there is no “remind me later”",
    fileHeading:
      "wharf recovery code — keep this safe, offline. It is the only way to reset your password.",
  },
  device: {
    title: "Pair your terminal",
    subtitle: "You're signed in as <1>{{email}}</1>. Type this code into wharf in your terminal:",
    issuing: "issuing code…",
    expiresIn: "expires in {{time}}",
    reissuing: "code expired — issuing a fresh one…",
    error: "couldn't issue a code — retrying…",
    promptCommand: "$ wharf",
    promptPaste: "› paste the 8-character code…",
    noTerminal: "no terminal yet?",
    installWharf: "install wharf first",
  },
  signin: {
    title: "Welcome back",
    submit: "Unlock vault",
    footerLead: "your password decrypts the vault locally ·",
    forgot: "forgot it? use your recovery code",
  },
  recover: {
    title: "Reset your password",
    intro:
      "Enter the 40-character recovery code from your onboarding. It decrypts your vault so it can be re-encrypted with a new password.",
    valid: "code valid · vault unlocked for re-encryption",
    verifying: "checking recovery code…",
    danger:
      "Resetting issues a <1>new recovery code</1> and invalidates this one. Signed-in devices will re-authenticate.",
    submit: "Re-encrypt & reset",
  },
  validation: {
    emailRequired: "enter your email",
    emailInvalid: "enter a valid email address",
    passwordRequired: "enter a master password",
    passwordTooShort: "use at least 8 characters",
    confirmMismatch: "passwords don't match",
    mustAcknowledge: "please confirm you understand",
    recoveryRequired: "enter your recovery code",
  },
  errors: {
    invalidCredentials: "email or master password is incorrect",
    emailTaken: "an account with this email already exists",
    rateLimited: "too many attempts — please wait a moment and try again",
    recoveryInvalid: "that recovery code doesn't match this account",
    recoveryMalformed: "check the recovery code — it looks incomplete",
    vaultDecrypt: "couldn't decrypt the vault with that recovery code",
    generic: "something went wrong — please try again",
  },
} as const;

type DeepStringSchema<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringSchema<T[K]>;
};
export type CommonSchema = DeepStringSchema<typeof enCommon>;

export const defaultNS = "common";
export const resources = {
  en: { common: enCommon },
} as const;

export type AppLanguage = keyof typeof resources;
