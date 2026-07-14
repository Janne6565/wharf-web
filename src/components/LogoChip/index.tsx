import { useTranslation } from "react-i18next";

// The "⋋ wharf" brand chip: mono, accent background, dark ink. The glyph is
// U+22CB (&#8907; in the design source).
const LOGO_GLYPH = "⋋";

export function LogoChip() {
  const { t } = useTranslation();
  return (
    <div className="inline-block bg-accent px-2.5 py-0.5 font-mono text-sm font-bold text-accent-ink">
      {LOGO_GLYPH} {t("app.name")}
    </div>
  );
}
