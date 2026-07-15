import { useTranslation } from "react-i18next";

interface FeatureProps {
  readonly kicker: string;
  readonly title: string;
  readonly body: string;
}

function Feature({ kicker, title, body }: FeatureProps) {
  return (
    <div>
      <div className="font-mono text-sm text-accent">{kicker}</div>
      <h3 className="mt-2.5 mb-2 text-[19px] text-text">{title}</h3>
      <p className="text-[15px] text-muted [text-wrap:pretty]">{body}</p>
    </div>
  );
}

// Three-column auto-fit grid of product highlights.
export function Features() {
  const { t } = useTranslation();
  return (
    <section id="features" className="border-t border-border-subtle">
      <div className="mx-auto grid max-w-[1080px] gap-10 px-5 py-12 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))] sm:px-8 sm:py-16">
        <Feature
          kicker={t("landing.features.vault.kicker")}
          title={t("landing.features.vault.title")}
          body={t("landing.features.vault.body")}
        />
        <Feature
          kicker={t("landing.features.projects.kicker")}
          title={t("landing.features.projects.title")}
          body={t("landing.features.projects.body")}
        />
        <Feature
          kicker={t("landing.features.signin.kicker")}
          title={t("landing.features.signin.title")}
          body={t("landing.features.signin.body")}
        />
      </div>
    </section>
  );
}
