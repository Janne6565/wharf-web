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
    verifyEmail: "verify email",
    connectDevice: "connect device",
  },
  nav: {
    account: "account",
    backToConnections: "back to connections",
    projects: "projects",
    pendingInvites_one: "{{count}} pending invite",
    pendingInvites_other: "{{count}} pending invites",
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
    verifyEmail: "verify email",
    device: "pair terminal",
    signin: "sign in",
    recover: "recover vault",
    connections: "connections",
    lockedVault: "locked vault",
    account: "account",
    setPassword: "set master password",
    unlock: "sign in",
    oauth: "connecting",
    projects: "projects",
    project: "project",
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
      unverified_account_conflict:
        "an account with this email already exists but was never verified. verify that address with the emailed code first, then connect this provider.",
      account_not_verified:
        "your account is not verified yet, please verify your email before continuing.",
      provider_error: "the provider rejected the sign-in — please try again.",
      server_error: "something went wrong completing sign-in — please try again.",
      generic: "we couldn't complete sign-in — please try again.",
    },
    backToSignin: "back to sign in",
    backToSignup: "create an account",
    verifyEmail: "sign in to verify your email",
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
    verificationCode: "6-digit code",
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
  verifyEmail: {
    title: "Verify your email",
    intro: "we sent a 6-digit code to <1>{{email}}</1>. enter it to activate your account.",
    submit: "verify email",
    resend: "send a new code",
    resendIn: "send a new code ({{seconds}}s)",
    resent: "if that address has an unverified account, a new code is on its way.",
    invalidCode: "that code is not valid or has expired — request a new one",
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
    countFiltered: "{{shown}} / {{total}}",
    vaultHostCount_one: "{{count}} host in this vault",
    vaultHostCount_other: "{{count}} hosts in this vault",
    listHint: "{{shown}} of {{total}} shown",
    listHintScroll: "{{shown}} of {{total}} shown · scroll for more",
    filter: "filter",
    filterPlaceholder: "filter by name, host or #tag…",
    clearFilter: "clear filter",
    lock: "lock vault",
    unlock: "unlock vault",
    lockedSubtitle: "encrypted on this device",
    lockedSubtitleCounted_one: "{{count}} host · encrypted on this device",
    lockedSubtitleCounted_other: "{{count}} hosts · encrypted on this device",
    lockedHint:
      "your vault is locked. enter your master password to decrypt hosts, keys and passwords locally.",
    noMatches: "no host matches “{{query}}”",
    pairTerminal: "pair a terminal",
    pair: {
      footerNote: "hosts are added from your terminal, never here.",
      emptyTitle: "No hosts yet",
      emptyBody:
        "hosts are added from your terminal, never here. pair a terminal, then run <1>wharf add</1>.",
    },
    authKey: "key",
    authPassword: "password",
  },
  account: {
    title: "Account",
    emailLabel: "email",
    verified: "verified",
    unverified: "not verified",
    signOutHint: "signing out locks the vault on this device.",
    signOut: "sign out",
    navLabel: "account settings",
    navOverview: "account",
    navNotifications: "notifications",
  },
  notifications: {
    title: "Notifications",
    subtitle: "wharf only sends email. changes save as you make them.",
    securityLabel: "security notices",
    collaborationLabel: "collaboration mail",
    alwaysOn: "Always on",
    securityExplainer:
      "these cannot be turned off. wharf has no password reset on our side, no support-side recovery and no server-side activity log — email is the only channel where you can find out that something changed on your account.",
    lockedOn: "locked on",
    allCollaboration: "All collaboration mail",
    groupHint:
      "mail about projects and people. turning these off does not change security notices.",
    groupPartial: "some of these are off. use this toggle to turn the whole group on or off.",
    groupOff: "off. wharf will not email you about projects or people.",
    enabledCount: "{{enabled}} / {{total}}",
    allOffNote:
      "invites, role changes and project deletions still happen — you will only see them inside wharf when you next open it. security notices are sent either way.",
    noProjectsNote:
      "this account is not part of any project yet, so none of these will send. the settings are saved now and take effect when you create or join a project.",
    saving: "saving",
    saved: "saved",
    retry: "retry",
    saveFailed:
      "not saved — the request did not reach wharf. the switch is back to its stored value.",
    groupSaveFailed: "nothing was saved — the request did not reach wharf.",
    loadFailed: "couldn't load your notification settings.",
    sentTo: "sent to the address on your account.",
    items: {
      recoveryCodeUsed: {
        title: "Recovery code used",
        description: "Sent when your recovery code unlocks the vault for a password reset.",
      },
      passwordChanged: {
        title: "Master password changed",
        description: "Sent when the master password on this account is replaced.",
      },
      passwordSet: {
        title: "Master password set",
        description: "Sent when a master password is set on an account that had none.",
      },
      devicePaired: {
        title: "New device paired",
        description: "Sent when a new terminal or browser finishes pairing with this account.",
      },
      providerLinked: {
        title: "Sign-in provider linked",
        description: "Sent when a Google or GitHub account is linked as a way to sign in.",
      },
      accountDeleted: {
        title: "Account deleted",
        description: "Sent when deletion of this account is confirmed.",
      },
      projectInvite: {
        title: "Project invite",
        description: "Sent when someone invites you to a project.",
      },
      inviteAccepted: {
        title: "Invite accepted",
        description: "Sent when someone you invited joins the project.",
      },
      inviteDeclined: {
        title: "Invite declined",
        description: "Sent when someone you invited declines.",
      },
      projectAccessGranted: {
        title: "Project access granted",
        description: "Sent when you are given access to a project.",
      },
      projectAccessRemoved: {
        title: "Removed from project",
        description: "Sent when your access to a project is removed.",
      },
      roleChanged: {
        title: "Role changed",
        description: "Sent when your role on a project changes.",
      },
      projectDeleted: {
        title: "Project deleted",
        description: "Sent when a project you have access to is deleted.",
      },
    },
  },
  deleteAccount: {
    heading: "danger zone",
    dangerTitle: "Delete account",
    intro:
      "removes your account, your vault and every project you own. permanent — wharf will not bring any of it back. your vault stays unreadable to us either way.",
    action: "delete account",
    modalLabel: "confirm deletion",
    title: "Delete {{email}}",
    subtitle:
      "this cannot be undone or paused. backups are never used to restore a deleted account.",
    previewLoading: "checking what this will delete…",
    previewFailed: "couldn't check what this will delete — please try again.",
    ownedHeading: "projects deleted with it",
    projectHosts_one: "{{count}} host",
    projectHosts_other: "{{count}} hosts",
    projectMembers_one: "{{count}} member loses access",
    projectMembers_other: "{{count}} members lose access",
    projectMembersNone: "only you",
    noProjects: "you own no projects, so nothing is deleted for anyone else.",
    otherMemberships_one: "you are also removed from {{count}} project you don't own.",
    otherMemberships_other: "you are also removed from {{count}} projects you don't own.",
    vaultWarningLocked:
      "your vault goes with it: every host, ssh key and stored password it holds. it is locked on this device, so we cannot count them for you. they are encrypted with your master password — once deleted, <3>nothing is recoverable</3>, not by you and not by us.",
    vaultWarningCounted:
      "your vault goes with it: <1>{{counts}}</1>. they are encrypted with your master password — once deleted, <3>nothing is recoverable</3>, not by you and not by us.",
    vaultCounts: {
      hosts_one: "{{count}} host",
      hosts_other: "{{count}} hosts",
      keys_one: "{{count}} ssh key",
      keys_other: "{{count}} ssh keys",
      passwords_one: "{{count}} stored password",
      passwords_other: "{{count}} stored passwords",
      projects_one: "{{count}} project",
      projects_other: "{{count}} projects",
    },
    calmBody:
      "this account has no projects and an empty vault — nothing else is deleted with it. the account itself is gone for good, and the email can be used to sign up again later.",
    calmFootnote: "no email confirmation needed — there is nothing here to lose",
    emailLabel: "type {{email}} to confirm",
    passwordPrompt: "required to prove it’s you",
    confirm: "delete my account",
    cancel: "cancel",
    validation: {
      emailMismatch: "that doesn't match your email address",
    },
    errors: {
      wrongPassword: "that master password is not correct",
      passwordRequired: "enter your master password to confirm",
      generic: "couldn't delete your account — please try again",
    },
  },
  signin: {
    title: "Welcome back",
    submit: "unlock vault",
    footerLead: "your password decrypts the vault locally",
    forgot: "forgot it? use your recovery code",
    newHere: "new here?",
    createAccount: "create an account",
    verifyEmail: "verify your email now",
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
    codeRequired: "enter the 6-digit code",
    codeInvalid: "the code is 6 digits",
  },
  errors: {
    invalidCredentials: "email or master password is incorrect",
    emailTaken: "an account with this email already exists",
    emailNotVerified:
      "your account is not verified yet, please verify your email before continuing",
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
      // The legal notice itself is German (see pages/Impressum/lib.ts); only
      // the link label lives here, and "impressum" reads the same either way.
      impressum: "impressum",
      // Likewise German (see pages/Datenschutz/lib.ts) — the label names the
      // German document, so it stays "datenschutz" in every language.
      datenschutz: "datenschutz",
      copyright: "© 2026 wharf",
    },
  },
  projects: {
    title: "Your projects",
    subtitle: "shared host workspaces — invite teammates, keep your keys",
    count_one: "{{count}} project",
    count_other: "{{count}} projects",
    empty: "no projects yet — create one to share hosts with your team.",
    memberCount_one: "{{count}} member",
    memberCount_other: "{{count}} members",
    awaitingAccess: "awaiting access",
    open: "open project",
    lock: "lock vault",
    create: {
      toggle: "new project",
      title: "New project",
      name: "project name",
      description: "description",
      submit: "create project",
      cancel: "cancel",
    },
    invites: {
      heading: "Project invites",
      invitedBy: "invited by {{email}}",
      accept: "accept",
      decline: "decline",
      expired: "this invite has expired",
    },
    identity: {
      needsSync:
        "this vault has no project identity yet. sync it from the device where you first opened projects, then reload — we won't create a second key here.",
      error: "couldn't set up your project identity — please try again.",
      reset: {
        action: "I lost my old vault — reset project identity",
        title: "Reset project identity",
        body: "This mints a brand-new key on this device and replaces your published one. Every project you belong to re-enters awaiting-access until an admin re-grants you the key. Any project where you were the only member holding a key becomes permanently unrecoverable. Only do this if you have truly lost the device that created your identity.",
        confirm: "reset identity",
        cancel: "cancel",
        failed: "couldn't reset your identity — please try again.",
      },
      mismatch: {
        title: "Public key mismatch",
        body: "The public key the server publishes for this account does not match the one in this vault. Project keys shared with this account may be going to someone else. Do not accept project invites until this is resolved.",
        compare:
          "Compare these against another device where your vault is unlocked — they should be identical.",
        local: "in this vault",
        server: "published by the server",
        republish: {
          action: "republish my key",
          title: "Republish your public key",
          body: "This re-publishes the key already in this vault over the server's copy — no new key is created. Replacing a published key also resets every wrapped project key on the server, so all your projects re-enter awaiting-access until an admin re-grants you access. If the server itself is compromised it can overwrite your key again — check the fingerprint afterwards.",
          acknowledge: "I understand all my projects will re-enter awaiting-access.",
          confirm: "republish key",
          cancel: "cancel",
          failed: "couldn't republish your key — please try again.",
        },
      },
    },
    errors: {
      loadFailed: "couldn't load your projects — please try again.",
      createFailed: "couldn't create the project — please try again.",
    },
  },
  projectDetail: {
    back: "projects",
    hostCount_one: "{{count}} host",
    hostCount_other: "{{count}} hosts",
    notFound: "this project no longer exists, or you have been removed from it.",
    loading: "loading project…",
    you: "(you)",
    roles: {
      owner: "owner",
      admin: "admin",
      member: "member",
    },
    meta: {
      edit: "edit",
      name: "project name",
      description: "description",
      save: "save",
      cancel: "cancel",
    },
    members: {
      heading: "members",
      invite: "invite member",
      changeRole: "role",
      remove: "remove",
    },
    invite: {
      title: "Invite member",
      copy: "They get access to this project's hosts. Keys stay yours.",
      email: "email",
      submit: "send invite",
      cancel: "cancel",
      pending: "invited · awaiting accept",
      revoke: "revoke invite",
    },
    hosts: {
      heading: "hosts",
      empty: "no hosts in this project yet — add them from the wharf terminal app.",
      awaiting: "awaiting access — an admin will grant you the project key shortly.",
    },
    danger: {
      leave: "leave project",
      leaveConfirm: "Leave this project? You will lose access to its hosts.",
      leaveOwner: "transfer ownership to another member before you can leave.",
      delete: "delete project",
      deleteConfirm: "Delete this project for everyone? This cannot be undone.",
      removeConfirm:
        "Remove {{name}} from {{project}}? The project key is rotated so they lose access.",
      transferConfirm: "Make {{name}} the owner? You will be demoted to admin.",
      confirm: "confirm",
      cancel: "cancel",
    },
    errors: {
      updateFailed: "couldn't save changes — please try again.",
      inviteFailed: "couldn't send the invite — please try again.",
      inviteConflict: "that person is already a member or already invited.",
      removeFailed: "couldn't remove the member — please try again.",
      roleFailed: "couldn't change the role — please try again.",
      generic: "something went wrong — please try again.",
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
