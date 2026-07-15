import { useTranslation } from "react-i18next";

// The "❯_ wharf" brand chip: mono, accent background, dark ink. The glyph is
// U+276F followed by a static underscore (the v2 design's "prompt" mark). The
// underscore is plain text — it never blinks, so it reads as part of the logo
// rather than a live cursor.
const LOGO_GLYPH = "❯_";

export function LogoChip() {
  const { t } = useTranslation();
  return (
    <div className="inline-block bg-accent px-2.5 py-0.5 font-mono text-sm font-bold text-accent-ink">
      {LOGO_GLYPH} {t("app.name")}
    </div>
  );
}
