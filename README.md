# P(Pass) — Adaptiver Stochastik-Klausur-Coach

> Bestehe die Stocha-Klausur. Das Tool nutzt **Bayes-Inferenz**, um deine Schwächen zu finden und dich gezielt zu trainieren — und legt dieselbe Bayes-Rechnung im Inspector transparent offen.

## Features

- **> 70 handkuratierte Aufgaben** im Cramer/Kamps-Klausur-Stil (MC, Compute, Multi-MC) über alle drei Klausurblöcke
- **12 interaktive Visualisierungen**: Galton-Brett, Binomial-PMF, Bayes-Updater, Konfidenzintervall-Simulator, Hypothesentest, Poisson-Prozess, Lorenz/Gini, Boxplot, Regression, CLT-Demo, Random-Walk, Markov-Kette
- **Adaptive Auswahl** per Bayesian Knowledge Tracing (BKT) — das System schätzt pro Skill, wie sicher du es kannst, und stellt dir die Aufgaben, die am meisten bringen
- **Eingangstest** (5 Fragen ohne Feedback) bootstrappt die Skill-Wahrscheinlichkeiten — kein Cold-Start mit 0%
- **Deep-Dive pro Thema** mit Spielwiese + gefilterten Aufgaben + Free-Play-Modus (ohne BKT-Update)
- **Mock-Klausur** mit 10 zufälligen Aufgaben, Stopwatch und Auswertung am Ende
- **Bayes-Inspektor**: der Meta-Hook. Zeige dir Schritt für Schritt, wie der Algorithmus deine P(L) updated
- Fortschritt im **localStorage**, Export/Import als JSON
- Streak-Tracking, Konfetti + (optional) Marimba-Ping bei richtigen Antworten, Tinten-Strich-Effekt, animierte P(L)-Sidebar
- **Dark Mode (Observatory) / Light Mode (Lab Notebook)** mit OKLCH-Palette
- Vollständig auf der Tastatur bedienbar: `a–e` für MC, `Enter` zum Prüfen, `→` für die nächste Frage

## Deployment

Live-Demo: [https://medformatik.github.io/p-pass/](https://medformatik.github.io/p-pass/) *(Deploy in Phase 5)*

Keine Installation, keine Anmeldung. Fortschritt bleibt im localStorage. Über das Dashboard lässt er sich als JSON exportieren/importieren — handy für Gerätewechsel.
Auto-deploy zu GitHub Pages bei Push auf `main` via `.github/workflows/deploy.yml`.

## Lokal entwickeln

```bash
git clone https://github.com/Medformatik/p-pass
cd p-pass
npm install
npm run dev        # http://localhost:5173
npm run test:run   # Vitest (102 Tests)
npm run build      # Production-Build → dist/
```

## Tech-Stack

React 19 · TypeScript 6 · Vite 8 · Tailwind 4 · shadcn/ui · motion 12 · D3 7 · Zustand 5 · Vitest 4 · Lucide-Icons

Statisches Build (kein Backend, keine Auth). Hostbar auf GitHub Pages / Cloudflare Pages / jedem statischen Hoster.

## Lizenz

[MIT](LICENSE). Aufgabentexte sind eigene Formulierungen — angelehnt an Cramer/Kamps („Klausurtraining Statistik") und Steland („Basiswissen Statistik").
