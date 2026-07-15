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
    back: "back",
    close: "close",
    copy: "copy",
    copied: "copied",
  },
  cards: {
    install: "install",
    signup: "sign up",
    recoveryCode: "recovery code",
    device: "pair terminal",
    signin: "sign in",
    recover: "recover vault",
    connections: "connections",
    setPassword: "set master password",
    unlock: "sign in",
    oauth: "connecting",
  },
  oauth: {
    google: "google",
    github: "github",
    orWithEmail: "or with email",
    continueWith: "continue with {{provider}}",
  },
  oauthComplete: {
    loading: "signing you in…",
    errorTitle: "Sign-in failed",
    error: {
      provider_disabled: "that sign-in provider isn't available right now.",
      invalid_state: "the sign-in link expired or was already used — please try again.",
      email_not_verified:
        "your provider account's email isn't verified. verify it with the provider, then try again.",
      provider_error: "the provider rejected the sign-in — please try again.",
      server_error: "something went wrong completing sign-in — please try again.",
      generic: "we couldn't complete sign-in — please try again.",
    },
    backToSignin: "back to sign in",
    backToSignup: "create an account",
  },
  setPassword: {
    title: "Set your master password",
    subtitle: "this encrypts your vault on this device. choose it now to finish setting up.",
    warning:
      "this password encrypts your vault on your device. we never see it and <1>cannot reset it</1> — only your recovery code can.",
    understand: "I understand that wharf cannot recover my password",
    submit: "continue",
  },
  unlock: {
    title: "Unlock your vault",
    signedInAs: "signed in as <1>{{email}}</1>",
    submit: "unlock vault",
    wrongPassword: "that master password can't decrypt your vault",
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
    viewConnections: "view your connections",
    installTitle: "install wharf",
    installBody: "run this in your terminal, then come back and paste the code:",
  },
  connections: {
    title: "Your connections",
    count_one: "{{count}} host",
    count_other: "{{count}} hosts",
    filter: "filter",
    lock: "lock vault",
    unlock: "unlock vault",
    lockedHint:
      "your vault is locked on this device. enter your master password to decrypt it locally — it never leaves the browser.",
    empty: "no connections stored yet — add hosts from the wharf terminal app.",
    noMatches: "no hosts match your filter",
    pairTerminal: "pair a terminal",
    authKey: "key",
    authPassword: "password",
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
    vaultUnlock: "couldn't unlock the vault with that password",
    generic: "something went wrong — please try again",
  },
  landing: {
    nav: {
      features: "features",
      security: "security",
      install: "install",
      signIn: "sign in",
      profile: "profile",
      getWharf: "get wharf",
    },
    hero: {
      titleLine1: "Your fleet,",
      titleLine2: "one terminal",
      body: "An SSH manager that lives in your terminal. Hosts, keys and projects — synced across devices, shared with your team, and readable by no one but you.",
      copy: "copy",
      copied: "copied",
      footnote: "macOS · Linux · single binary, no root",
    },
    features: {
      vault: {
        kicker: "vault",
        title: "Hosts & keys, everywhere",
        body: "Store connections, tags and identities once. Every device you sign in on gets the same vault — laptop, desktop, phone.",
      },
      projects: {
        kicker: "projects",
        title: "Share hosts, not secrets",
        body: "Invite teammates into a project to share its hosts. Roles decide who connects where. Private keys always stay yours.",
      },
      signin: {
        kicker: "sign-in",
        title: "Browser once, terminal forever",
        body: "Authenticate in the browser, pair your terminal with a short device code. No passwords typed into the TUI, ever.",
      },
    },
    security: {
      kicker: "security model",
      headingLine1: "We store your vault.",
      headingLine2: "We can't read it.",
      para1:
        "Everything on our servers is encrypted with a key derived from your password — on your device, before it leaves. Your password is never sent to us, so there is nothing for us (or anyone who breaches us) to decrypt.",
      para2:
        "Forgot your password? The only way back in is the <1>40-character recovery code</1> shown once when you created your account. No code, no vault — that's the point.",
      check1: "password → key derivation (argon2id) happens client-side",
      check2: "vault blobs encrypted with XChaCha20-Poly1305 before upload",
      check3: "recovery code shown exactly once, never stored by us in plaintext",
      check4: "no password reset by email · no support-desk backdoor",
    },
    footer: {
      security: "security",
      docs: "docs",
      github: "github",
      copyright: "© 2026 wharf",
    },
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
