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
npm run dev      # autokeuze (intake → top 3) op http://localhost:3000
npm run build    # productieversie (volledig statisch), zie docs/testlink-vercel.md
```

## Data verversen (RDW)

```bash
node scripts/selecteer-modellen.ts 50   # kiest de 50 meest geregistreerde modellen
npx vite-node --config vitest.config.ts scripts/haal-specs.ts   # officiële specificaties (gebruikt de engine, daarom vite-node)
node scripts/haal-apk.ts                # APK-gebreken voor de betrouwbaarheidsscore (~15 min)
node scripts/haal-ncap.ts               # Euro NCAP-sterren uit de openbare uitslagpagina's (~2 min)
npx vite-node --config vitest.config.ts scripts/haal-occasions.ts   # specs per model en bouwjaar voor occasions (~40 min)
# Bestelauto's: dezelfde scripts met --bestel (selectie top 20, specs, occasions, APK):
node scripts/selecteer-modellen.ts 20 --bestel
```

## Structuur

- `src/regels/regels-nl.ts` — alle fiscale/wettelijke waarden, met bron, status en `geldigVanaf`
- `src/regels/aannames.ts` — kostenaannames (onderhoud, banden, verzekering), elk gemarkeerd als bron of eigen aanname
- `src/engine/` — pure rekencode (TCO, financiering, MRB, bijtelling, ZZP)
- `tests/` — unit tests; `persona-*.test.ts` volgen de rekenvoorbeelden in `docs/methodiek.md`
- `src/data/` — datamodel, modelnormalisatie, kentekencheck
- `data/` — gegenereerde dataset (met bron en peildatum)
- `scripts/` — scripts die de dataset uit RDW opbouwen
- `app/` — autokeuze (`/`), `/kenteken`, `/modellen` en de rekenpagina (`/rekenpagina`)
