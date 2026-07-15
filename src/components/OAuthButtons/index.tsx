import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { type OAuthProvider, useOAuthButtonsLogic } from "./useOAuthButtonsLogic";

// Google "G" mark, sized to the design's 17px accent glyph.
function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden focusable="false">
      <title>Google</title>
      <path
        className="fill-accent"
        d="M12 10.2v3.9h5.5c-.25 1.4-1.7 4.2-5.5 4.2-3.3 0-6-2.75-6-6.1s2.7-6.1 6-6.1c1.9 0 3.15.8 3.9 1.5l2.65-2.55C16.85 3.45 14.65 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.55 0 9.2-3.9 9.2-9.4 0-.65-.05-1.35-.2-2z"
      />
    </svg>
  );
}

// GitHub octocat mark, sized to the design's 17px accent glyph.
function GithubIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 16 16" aria-hidden focusable="false">
      <title>GitHub</title>
      <path
        className="fill-accent"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
      />
    </svg>
  );
}

interface OAuthButtonProps {
  readonly icon: ReactNode;
  readonly label: string;
  readonly title: string;
  readonly enabled: boolean;
  readonly onConnect: () => void;
  readonly testId: string;
}

// A single provider button. Enabled when the backend has the provider
// configured (click starts the full-page OAuth redirect); otherwise it renders
// disabled with an honest "coming soon" title rather than faking a login.
function OAuthButton({ icon, label, title, enabled, onConnect, testId }: OAuthButtonProps) {
  return (
    <button
      type="button"
      disabled={!enabled}
      title={title}
      aria-label={`${label} — ${title}`}
      data-testid={testId}
      onClick={enabled ? onConnect : undefined}
      className={cn(
        "flex h-11 flex-1 items-center justify-center gap-2.5 border border-border bg-bg text-[13px] transition-colors",
        enabled ? "cursor-pointer text-text hover:border-accent" : "cursor-not-allowed text-subtle",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

const PROVIDER_ICON: Record<OAuthProvider, ReactNode> = {
  google: <GoogleIcon />,
  github: <GithubIcon />,
};

// The two provider buttons (google / github) followed by an "── or with email
// ──" divider, shared by sign-up and sign-in.
export function OAuthButtons() {
  const { t } = useTranslation();
  const { isEnabled, connect } = useOAuthButtonsLogic();
  const comingSoon = t("common.comingSoon");

  return (
    <>
      <div className="mt-4 mb-2.5 flex gap-3">
        {(["google", "github"] as const).map((provider) => {
          const enabled = isEnabled(provider);
          const label = t(`oauth.${provider}`);
          return (
            <OAuthButton
              key={provider}
              icon={PROVIDER_ICON[provider]}
              label={label}
              enabled={enabled}
              title={enabled ? t("oauth.continueWith", { provider: label }) : comingSoon}
              onConnect={() => connect(provider)}
              testId={`oauth-${provider}`}
            />
          );
        })}
      </div>
      <div className="mb-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[12px] text-dim">{t("oauth.orWithEmail")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}
