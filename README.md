# AutoKeuze NL

Onafhankelijke, merkneutrale vergelijker voor auto's en financieringsvormen. Zie `CLAUDE.md` en `docs/`.

## Lokaal draaien

Node.js staat in `~/.local/node`. Zet het één keer in je terminalpad:

```bash
echo 'export PATH="$HOME/.local/node/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

Daarna, in deze map:

```bash
npm install      # eenmalig
npm test         # alle rekentests
npm run dev      # rekenpagina op http://localhost:3000
```

## Data verversen (RDW)

```bash
node scripts/selecteer-modellen.ts 50   # kiest de 50 meest geregistreerde modellen
node scripts/haal-specs.ts              # haalt de officiële specificaties op
node scripts/haal-apk.ts                # APK-gebreken voor de betrouwbaarheidsscore (~15 min)
```

## Structuur

- `src/regels/regels-nl.ts` — alle fiscale/wettelijke waarden, met bron, status en `geldigVanaf`
- `src/engine/` — pure rekencode (TCO, financiering, MRB, bijtelling, ZZP)
- `tests/` — unit tests; `persona-*.test.ts` volgen de rekenvoorbeelden in `docs/methodiek.md`
- `src/data/` — datamodel, modelnormalisatie, kentekencheck
- `data/` — gegenereerde dataset (met bron en peildatum)
- `scripts/` — scripts die de dataset uit RDW opbouwen
- `app/` — rekenpagina, `/modellen` en `/kenteken`
