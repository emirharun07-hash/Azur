# Testdaten für den Test-Shop (theme_harness.py)

Aufruf: `http://127.0.0.1:8770/<pfad>?fx=<NAME>` lädt `azur/tools/fixtures/<NAME>.json`.
Die Wahl bleibt im Cookie `azur_fx`; `?fx=` (leer) setzt zurück. Jede Fixture hat ihren eigenen Warenkorb.
Ohne Fixture: Brasilien und Deutschland S 8, M 17, L 15, XL 10; die anderen S/M/L 10, XL 0.

Alle Schlüssel sind freiwillig:

- `products.<handle>.inventory`  Bestand je Größe, z. B. `{"L": 0}`. Steuert `variant.inventory_quantity`,
  `variant.available` (Bestand > 0) und `product.available`; `inventory_management` ist immer `shopify`.
- `products.<handle>.metafields`  z. B. `{"custom": {"fit": "…"}}`, im Theme als `.value` lesbar.
- `products.<handle>.media`  Anzahl der Bilder (Standard 2). Auch möglich: `price` (Cent), `title`, `description`, `tags`, `template_suffix`.
- `only`  Liste von Handles: nur diese Produkte gibt es (Sammlungen, Raum, Karten).
- `settings`  überschreibt Theme-Einstellungen (nach `harness_settings.json`); `settings.sections.<name>.settings` die festen Sections.
- `cart`  Startinhalt: `[{"handle": "…", "size": "M", "qty": 1}]`.
- `shop`  z. B. `enabled_payment_types`, `metafields`.
- `pages`  zusätzliche oder geänderte Seiten: `{"groessentabelle": {"title": "…", "content": "<p>…</p>"}}`; `null` entfernt eine Seite.

Nur Testwerte eintragen: keine echten Adressen, Namen, Einkaufspreise oder erfundene Produktangaben.
`beispiel.json` zeigt alles einmal (Brasilien L = 0, also ausverkauft; ein Deutschland-Trikot M im Warenkorb).
