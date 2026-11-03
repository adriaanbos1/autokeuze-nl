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

## Structuur

- `src/regels/regels-nl.ts` — alle fiscale/wettelijke waarden, met bron, status en `geldigVanaf`
- `src/engine/` — pure rekencode (TCO, financiering, MRB, bijtelling, ZZP)
- `tests/` — unit tests; `persona-*.test.ts` volgen de rekenvoorbeelden in `docs/methodiek.md`
- `app/` — eenvoudige rekenpagina (Fase 1)
