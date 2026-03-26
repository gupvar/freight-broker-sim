# Northstar Brokerage Sim

A lightweight Node.js simulation game where you run a freight brokerage for one week, assign daily customer loads to carriers, and optimize margin, service, and total score.

## Run

```bash
npm start
```

Then open `http://localhost:3000`.

## GitHub Pages

This project can be deployed as a live website with GitHub Pages because the game itself is fully client-side.

### Easiest setup

- Push the repository to GitHub with the `docs` folder included.
- In GitHub, open `Settings > Pages`.
- Under the publishing source, choose `Deploy from a branch`.
- Select branch `main` and folder `/docs`.
- Save, then wait a minute or two for the site to publish.

Your site URL will be:

`https://gupvar.github.io/freight-broker-sim/`

### Optional GitHub Actions setup

If you prefer workflow-based deploys, the repository also includes `.github/workflows/deploy-pages.yml`.

## Gameplay

- Start a new week to generate daily customer freight.
- Review each load's lane, urgency, and customer priorities.
- Assign a carrier using KPI fit, specialty, and available daily capacity.
- Advance through seven days and try to finish with the best weekly score.
