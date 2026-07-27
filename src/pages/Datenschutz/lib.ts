// The German body text of the Datenschutzerklärung served at `/datenschutz`.
//
// Deliberately NOT routed through the i18n layer: a privacy notice is a German
// statutory document, and the Art. 6 DSGVO references only carry their legal
// weight in this exact German wording. Translating them (or letting a
// translator edit them) would weaken the notice, so the text lives here as
// fixed data — the same reasoning as `Impressum/lib.ts`. Only the page chrome
// (the back link) is localizable.

export const DATENSCHUTZ_HEADING = "Datenschutzerklärung";

export const DATENSCHUTZ_EMAIL = "jabbekeipert@gmail.com";

// Section 1 — the controller, rendered letterhead-style like the Impressum.
export const DATENSCHUTZ_CONTROLLER_HEADING = "1. Verantwortlicher";
export const DATENSCHUTZ_CONTROLLER_LINES: readonly string[] = [
  "Janne Keipert",
  "Marchlewskistraße 102",
  "10243 Berlin",
  "Deutschland",
];
export const DATENSCHUTZ_CONTACT_LABEL = "E-Mail:";

// The processor that stores the data, named as Art. 13 Abs. 1 lit. e DSGVO
// requires. The server is a Hetzner machine whose address resolves inside
// 195.201.0.0/16 with a `.clients.your-server.de` reverse record — a
// RIPE-allocated German range, not one of Hetzner's US locations — so the data
// stays in the EU and no third-country transfer arises from the hosting itself.
// `Datenschutz.test.tsx` guards against this reverting to a placeholder.
export const HOSTING_PROVIDER =
  "Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Deutschland. " +
  "Die Server stehen in Deutschland.";

export interface DatenschutzSection {
  readonly heading: string;
  /** Free-standing paragraphs, rendered before the bullet list. */
  readonly paragraphs?: readonly string[];
  /** Bullet items, rendered as an unordered list. */
  readonly items?: readonly string[];
}

// Sections 2–8. Section 9 ("Deine Rechte") is rendered separately because it
// carries an inline mailto link.
export const DATENSCHUTZ_SECTIONS: readonly DatenschutzSection[] = [
  {
    heading: "2. Grundsatz: Der Server kann deine Daten nicht lesen",
    paragraphs: [
      "Wharf ist zero-knowledge aufgebaut. Hosts, SSH-Schlüssel und gespeicherte Passwörter werden ausschließlich auf deinem Gerät mit deinem Master-Passwort verschlüsselt und nur als Chiffrat übertragen. Der Server speichert diesen Datenblock, ohne ihn entschlüsseln zu können — das Master-Passwort verlässt dein Gerät nie. Das bedeutet auch: Bei Verlust des Master-Passworts und des Wiederherstellungscodes sind die Inhalte unwiederbringlich verloren; es gibt keine Kopie, aus der sie wiederhergestellt werden könnten.",
    ],
  },
  {
    heading: "3. Welche Daten verarbeitet werden",
    items: [
      "Kontodaten: E-Mail-Adresse, Zeitpunkt der Registrierung, Verifizierungsstatus der Adresse.",
      "Authentifizierungsdaten: bcrypt-Hashes von Schlüsseln, die auf deinem Gerät aus dem Master-Passwort abgeleitet werden. Das Passwort selbst wird weder übertragen noch gespeichert.",
      "Vault-Inhalte: ausschließlich als Chiffrat (siehe Abschnitt 2).",
      "Projekte und Teams: Mitgliedschaften, Rollen sowie die E-Mail-Adressen eingeladener Personen.",
      "OAuth-Anmeldung: bei Nutzung von Google oder GitHub die Kennung beim jeweiligen Anbieter und die dort bestätigte E-Mail-Adresse.",
      "IP-Adressen: zur Begrenzung von Anfragen (Missbrauchsschutz). Sie werden nur im Arbeitsspeicher gehalten und spätestens nach einer Stunde verworfen.",
      "Anwendungsprotokolle: technische Protokolle des Servers. Sie enthalten Konto-Kennungen und, wenn der Versand einer E-Mail fehlschlägt, die betroffene E-Mail-Adresse.",
    ],
  },
  {
    heading: "4. Zwecke und Rechtsgrundlagen",
    items: [
      "Bereitstellung des Kontos, der Synchronisierung und der Team-Projekte — Erfüllung des Nutzungsvertrags, Art. 6 Abs. 1 lit. b DSGVO.",
      "Verifizierung der E-Mail-Adresse und Versand von Einladungen — Art. 6 Abs. 1 lit. b DSGVO.",
      "Missbrauchsschutz, Begrenzung von Anfragen und Betriebssicherheit — berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO.",
    ],
  },
  {
    heading: "5. Cookies und Reichweitenmessung",
    paragraphs: [
      "Es wird ein einziges Cookie gesetzt: ein technisch notwendiges Sitzungs-Cookie zur Anmeldung (HttpOnly, Secure, SameSite=Strict). Es findet keine Reichweitenmessung, kein Tracking und keine Werbung statt. Es sind keine Analyse- oder Fehlerberichtsdienste eingebunden.",
    ],
  },
  {
    heading: "6. Empfänger und Drittanbieter",
    items: [
      "Google LLC beziehungsweise GitHub, Inc. — nur wenn du dich über den jeweiligen Anbieter anmeldest. Dabei erfolgt eine Übermittlung in die USA.",
      "E-Mail-Versand: Verifizierungs- und Einladungsnachrichten werden über einen vom Verantwortlichen selbst betriebenen Maildienst versendet.",
      `Hosting: ${HOSTING_PROVIDER}`,
    ],
  },
  {
    heading: "7. Speicherdauer",
    items: [
      "Kontodaten bis zur Löschung des Kontos.",
      "Sitzungs-Token: Zugriffstoken 15 Minuten, Erneuerungstoken 30 Tage.",
      "Verifizierungscodes 15 Minuten, Geräte-Codes zur Terminal-Kopplung 10 Minuten, Einladungen 14 Tage.",
      "IP-Adressen zur Anfragebegrenzung längstens eine Stunde.",
      "Sicherungskopien der Datenbank längstens 60 Tage (siehe Abschnitt 8).",
    ],
  },
  {
    heading: "8. Löschung des Kontos",
    paragraphs: [
      "Du kannst dein Konto jederzeit selbst löschen (Bereich „Account“). Dabei werden das Konto, der verschlüsselte Vault, deine Mitgliedschaften sowie alle Projekte gelöscht, deren Eigentümer du bist — auch dann, wenn diese Projekte weitere Mitglieder haben. Die Löschung ist endgültig; ein gelöschtes Konto wird nicht wiederhergestellt.",
      "Zur Absicherung gegen Datenverlust und Systemausfälle werden regelmäßig Sicherungskopien (Backups) der Datenbank erstellt — berechtigtes Interesse an einem sicheren Betrieb, Art. 6 Abs. 1 lit. f DSGVO in Verbindung mit Art. 32 DSGVO. Nach einer Löschung können deine Kontodaten in diesen Sicherungen noch längstens 60 Tage enthalten sein; sie werden dort nicht mehr aktiv verarbeitet und danach automatisch gelöscht. Sicherungen werden ausschließlich zur Wiederherstellung nach einem Systemausfall verwendet, nicht zur Wiederherstellung einzelner Konten. Für die Vault-Inhalte ändert sich dadurch nichts: Sie liegen auch in einer Sicherung ausschließlich als Chiffrat vor (siehe Abschnitt 2).",
    ],
  },
];

// Section 9 — split around the inline mailto link.
export const DATENSCHUTZ_RIGHTS_HEADING = "9. Deine Rechte";
export const DATENSCHUTZ_RIGHTS_BEFORE_EMAIL =
  "Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Wende dich dazu an";
export const DATENSCHUTZ_RIGHTS_AFTER_EMAIL =
  ". Außerdem steht dir ein Beschwerderecht bei einer Aufsichtsbehörde zu, für Berlin bei der Berliner Beauftragten für Datenschutz und Informationsfreiheit.";
export const DATENSCHUTZ_RIGHTS_NOTE =
  "Hinweis zur Auskunft: Die Inhalte deines Vaults liegen dem Verantwortlichen ausschließlich verschlüsselt vor. Eine Auskunft kann sich daher nur auf die oben genannten Daten und auf den verschlüsselten Datenblock selbst beziehen, nicht auf dessen Inhalt.";
