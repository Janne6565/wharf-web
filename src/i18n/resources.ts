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
    comingSoon: "coming soon",
  },
  cards: {
    signup: "sign up",
    recoveryCode: "recovery code",
    device: "pair terminal",
    signin: "sign in",
    recover: "recover vault",
  },
  oauth: {
    google: "google",
    github: "github",
    orWithEmail: "or with email",
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
      "this password encrypts your vault on your device. we never see it and <1>cannot reset it</1> — only your recovery code can.",
    understand: "I understand that wharf cannot recover my password",
    submit: "create account",
  },
  recovery: {
    title: "Save your recovery code",
    intro:
      "these 40 characters are the <1>only</1> way to reset your password. shown <3>once, right now</3> — we keep no readable copy.",
    copy: "copy",
    copied: "copied",
    download: "download .txt",
    print: "print",
    stored: "I stored this code somewhere safe, outside this device",
    continue: "continue",
    footnote: "button unlocks once confirmed · there is no “remind me later”",
    fileHeading:
      "wharf recovery code — keep this safe, offline. It is the only way to reset your password.",
  },
  device: {
    title: "Pair your terminal",
    subtitle: "signed in as <1>{{email}}</1> · type this code into wharf in your terminal:",
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
    submit: "unlock vault",
    footerLead: "your password decrypts the vault locally",
    forgot: "forgot it? use your recovery code",
    newHere: "new here?",
    createAccount: "create an account",
  },
  recover: {
    title: "Reset your password",
    intro:
      "enter the 40-character recovery code from your onboarding. it decrypts your vault so it can be re-encrypted with a new password.",
    valid: "code valid · vault unlocked for re-encryption",
    verifying: "checking recovery code…",
    danger:
      "resetting issues a <1>new recovery code</1> and invalidates this one. signed-in devices will re-authenticate.",
    submit: "re-encrypt & reset",
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
