import { useTranslation } from "react-i18next";

// The "❯ wharf" brand chip: mono, accent background, dark ink. The glyph is a
// single U+276F chevron — the trailing underscore of the v2 design source is
// dropped so nothing reads as a blinking cursor beside the logo.
const LOGO_GLYPH = "❯";

export function LogoChip() {
  const { t } = useTranslation();
  return (
    <div className="inline-block bg-accent px-2.5 py-0.5 font-mono text-sm font-bold text-accent-ink">
      {LOGO_GLYPH} {t("app.name")}
    </div>
  );
}
