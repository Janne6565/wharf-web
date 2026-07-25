// The German body text of the Impressum served at `/impressum`.
//
// Deliberately NOT routed through the i18n layer: an Impressum is a German
// statutory document, and the §§ 5 DDG / 19 UStG / 18 MStV notices only carry
// their legal weight in this exact German wording. Translating them (or letting
// a translator edit them) would weaken the notice, so the text lives here as
// fixed data — the same reasoning as the terminal mockup strings in
// `Landing/lib.ts`. Only the page chrome (the back link) is localizable.

export const IMPRESSUM_HEADING = "Impressum";

export const IMPRESSUM_EMAIL = "jabbekeipert@gmail.com";

// Address blocks are rendered one line per row, so they stay as line arrays.
export const IMPRESSUM_PROVIDER_HEADING = "Angaben gemäß § 5 DDG";
export const IMPRESSUM_PROVIDER_LINES: readonly string[] = [
  "Janne Keipert",
  "Marchlewskistraße 102",
  "10243 Berlin",
  "Deutschland",
];

export const IMPRESSUM_CONTACT_HEADING = "Kontakt";
export const IMPRESSUM_CONTACT_LABEL = "E-Mail:";

export interface ImpressumSection {
  readonly heading: string;
  readonly body: string;
}

export const IMPRESSUM_VAT: ImpressumSection = {
  heading: "Umsatzsteuer",
  body: "Als Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet und ausgewiesen.",
};

export const IMPRESSUM_RESPONSIBLE_HEADING = "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV";
export const IMPRESSUM_RESPONSIBLE_LINES: readonly string[] = [
  "Janne Keipert",
  "Anschrift wie oben",
];

// The closing boilerplate sections: heading plus a single paragraph each. Kept
// word-for-word in sync with the owner's other sites' legal pages.
export const IMPRESSUM_SECTIONS: readonly ImpressumSection[] = [
  {
    heading: "Haftung für Inhalte",
    body: "Als Diensteanbieter bin ich gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG bin ich als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werde ich diese Inhalte umgehend entfernen.",
  },
  {
    heading: "Haftung für Links",
    body: "Mein Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte ich keinen Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Bei Bekanntwerden von Rechtsverletzungen werde ich derartige Links umgehend entfernen.",
  },
  {
    heading: "Urheberrecht",
    body: "Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.",
  },
];
