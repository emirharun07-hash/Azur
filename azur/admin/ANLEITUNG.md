# Texte direkt auf der Website ändern: einmal einrichten

Danach könnt ihr beide auf der Website selbst (ohne Shopify-Admin) ändern:
- das **Laufband oben** (eine Meldung pro Zeile)
- auf jeder Produktseite die **Beschreibung**

So funktioniert es: Ein kleiner Server bei Cloudflare (kostenlos) hält den Shopify-Zugang. Die Website kennt ihn nicht,
sie schickt nur eure Änderung samt Login dorthin. Der Server prüft das Login und schreibt dann in Shopify.

Aufwand: einmal etwa 30 Minuten. Ihr braucht den Windows-PC mit dem Repo (wie für die Renderings).

> Wichtig: Client-Secret und Passwörter **nie** in den Chat schreiben, nur direkt in die Befehle unten.
> Die Server-Adresse (…workers.dev) ist nicht geheim, die dürft ihr mir schicken.

## 1. Node.js installieren (falls noch nicht da)

https://nodejs.org → „LTS“ herunterladen, installieren. Danach eine **neue** PowerShell öffnen und prüfen:

```powershell
node --version
```

## 2. Cloudflare-Konto und Server

1. Kostenloses Konto anlegen: https://dash.cloudflare.com/sign-up (einer von euch reicht).
2. In der PowerShell:

```powershell
cd C:\Users\Emir\S-per-Lig-Fantasy-Manager
git pull
cd azur\admin
npx wrangler login
```

   Der Browser öffnet sich, bei Cloudflare „Allow“ klicken.

3. Server hochladen:

```powershell
npx wrangler deploy
```

   Am Ende steht eine Adresse wie `https://azur-admin.<euer-name>.workers.dev`. Die schickt ihr mir.

## 3. Shopify-App (Zugang für den Server)

Shopify erlaubt neue „Custom Apps“ nur noch über das **Dev Dashboard**.

1. https://dev.shopify.com/dashboard mit dem Login des Shop-Inhabers öffnen.
2. **App erstellen** → Name: `AZUR Texte`.
3. In der App unter **Versionen** eine neue Version anlegen. Bei den **Zugriffsbereichen (Scopes)** diese zwei eintragen:
   `read_products, write_products`. Die Version freigeben.
4. **Installieren** → euren Shop wählen (azurclothing, `5vpchz-hd`). Die Zugriffe bestätigen.
5. In der App unter **Einstellungen** stehen **Client-ID** und **Client-Secret**. Direkt in Cloudflare speichern
   (nach jedem Befehl einfügen und Enter drücken):

```powershell
npx wrangler secret put SHOPIFY_CLIENT_ID
npx wrangler secret put SHOPIFY_CLIENT_SECRET
```

## 4. Eure zwei Logins

Pro Person: Name, Doppelpunkt, Passwort, zum Beispiel `Emir:EinLangesEigenesPasswort`. Das Passwort soll lang und nur
dafür sein.

```powershell
npx wrangler secret put ADMIN_1
npx wrangler secret put ADMIN_2
```

Dazu ein geheimer Schlüssel, mit dem der Server die Logins unterschreibt. Diese Zeile erzeugt einen zufälligen Schlüssel.
Die Ausgabe kopieren und beim zweiten Befehl einfügen:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
npx wrangler secret put SESSION_KEY
```

## 5. Adresse ins Theme

Schickt mir die Adresse aus Schritt 2. Ich trage sie im Theme ein (`snippets/azur-admin.liquid`). Selbst geht es auch:
Shopify → Onlineshop → Themes → Code bearbeiten → `snippets/azur-admin.liquid`. Dort in der Zeile mit `admin_api`
`https://azur-admin.CHANGE-ME.workers.dev` durch eure Adresse ersetzen.

## Benutzen

1. Den Shop öffnen (solange er zu ist: Vorschau-Link oder mit Passwort) und an die Adresse **`#admin`** anhängen,
   z. B. `https://azurclothing.com/#admin`.
2. Unten links erscheint **AZUR Admin**. Dort mit Name und Passwort anmelden. Das Login gilt 12 Stunden in diesem Browser.
   Danach erscheint der Knopf auch ohne `#admin`.
3. **Laufband:** Im Panel eine Meldung pro Zeile eintragen und „Laufband speichern“ klicken. Nach dem Neuladen läuft der
   neue Text. Wird das Feld geleert und gespeichert, gilt wieder der Text aus dem Theme-Editor.
4. **Produktbeschreibung:** Auf einer Produktseite „Beschreibung bearbeiten“ klicken, im Text schreiben (Strg+B fett,
   Strg+I kursiv), dann „Beschreibung speichern“. Eingefügtes wird zu reinem Text. Erlaubt sind nur Absätze, fett,
   kursiv, Listen und Links.
5. Auf fremden Rechnern danach **Abmelden**.

## Wenn etwas nicht klappt

- **„Name oder Passwort stimmt nicht“:** Prüfen, wie `ADMIN_1` und `ADMIN_2` gespeichert sind (`Name:Passwort`). Neu setzen
  geht mit demselben Befehl. Nach fünf Fehlversuchen sperrt der Server kurz.
- **Fehler mit `shop_not_permitted`:** App und Shop liegen im Dev Dashboard nicht in derselben Organisation. Sagt mir
  Bescheid, dann finden wir den richtigen Weg.
- **Fehler mit „access“ oder „scope“:** In der App-Version fehlt ein Zugriffsbereich. Ihn eintragen, die Version freigeben
  und in Shopify bestätigen.
- **Secret versehentlich geteilt:** Im Dev Dashboard ein neues Client-Secret erzeugen und mit
  `npx wrangler secret put SHOPIFY_CLIENT_SECRET` neu setzen. Bei einem Passwort einfach `ADMIN_1` bzw. `ADMIN_2` neu setzen.

Kosten: Cloudflare Workers ist im Gratis-Tarif (100.000 Aufrufe am Tag), hier fallen nur ein paar Aufrufe pro Änderung an.
