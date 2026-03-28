# IWT Interactive - Conscious Spending Plan Builder

An interactive financial planning tool based on Ramit Sethi's *I Will Teach You to Be Rich* methodology and the [Money Guy Financial Order of Operations](https://moneyguy.com/guide/foo/).

**Live:** [https://dtmirizzi.github.io/iwt-interactive/](https://dtmirizzi.github.io/iwt-interactive/)

> **Disclaimer:** This project is not affiliated with, endorsed by, or associated with Ramit Sethi, IWT Media, or The Money Guy Show. This is an independent, free, open-source tool for educational purposes only. It does not constitute financial advice.

## Architecture

Three-layer design:

1. **CSP Builder** (7-step linear wizard) - Collects your complete financial picture
2. **Dashboard** - Displays your CSP with an editable spreadsheet table, doughnut chart, net worth breakdown, and Financial Order of Operations ladder
3. **Workflow Machines** (6 XState machines) - Launched from the dashboard for deep-dive optimization

### CSP Builder Steps

| Step | What it collects |
|------|-----------------|
| Welcome | Name, partner, age, filing status, tax year |
| Net Worth | Assets, investment/retirement account balances, cash, debts |
| Income | Gross + net monthly income per person |
| Fixed Costs | All monthly expenses per person |
| Investments | Monthly contributions to each account |
| Savings Goals | Goals with targets, progress, and monthly contributions |

### Dashboard Workflows

| Workflow | Gated By |
|----------|----------|
| Debt Payoff (Avalanche/Snowball) | Has debt |
| Investment Ladder | Fixed costs < 70% |
| Retirement Projections | Investing >= 5% |
| Children & Education | FOO step 7+ |
| Rich Life Design | Always available |
| Account Automation | Fixed costs < 70% + investing > 0% |

## Local Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
git clone git@github.com:dtmirizzi/iwt-interactive.git
cd iwt-interactive
npm install
```

### Run

```bash
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173) (port may vary if 5173 is in use).

### Build

```bash
npm run build
```

Output goes to `dist/`.

### Test

```bash
npm run test:run    # single run
npm run test        # watch mode
```

100 tests across 5 files covering the state machine, CSP calculations, debt payoff algorithms, retirement utilities, and tax year configs.

## Dev Mode

Skip the 7-step builder and jump straight to the dashboard with pre-loaded test data by adding `?dev` to the URL.

### Available Dev Profiles

| URL | Profile | Description |
|-----|---------|-------------|
| `?dev` | Healthy couple | Alex & Jordan. Good CSP, most workflows unlocked. |
| `?dev=solo` | Solo user | Sam. Single person, student loan debt. |
| `?dev=overbudget` | Over-budget couple | Chris & Taylor. Fixed costs ~75%, heavy debt, most workflows locked. |

### Examples

```
http://localhost:5173/?dev              # Couple dashboard (healthy)
http://localhost:5173/?dev=solo         # Solo dashboard
http://localhost:5173/?dev=overbudget   # Over-budget dashboard (locked workflows)
```

A red **DEV** badge appears in the header when dev mode is active.

### Editing Test Data

Test data lives in `src/testData.ts`. Modify the `SAMPLE_CSP_DATA`, `SAMPLE_CSP_DATA_SOLO`, or `SAMPLE_CSP_DATA_OVERBUDGET` objects and the dashboard hot-reloads instantly.

## Tech Stack

- **React 19** + **TypeScript**
- **XState 5** - 7 state machines (1 builder + 6 workflows)
- **@tanstack/react-table** - Editable CSP spreadsheet table
- **Chart.js** + react-chartjs-2 - Doughnut and line charts
- **React Hook Form** - Form validation in builder steps
- **Vite** - Build tooling
- **Vitest** - Testing

## Tax Year Configuration

IRS contribution limits, phase-outs, and thresholds are stored as versioned configs in `src/config/`. Currently supports 2025 and 2026 tax years.

To add a new tax year: copy `src/config/tax-year-2026.ts`, update the numbers from the [IRS announcement](https://www.irs.gov/newsroom), and register it in `src/config/index.ts`.

## Deployment

Deploys to GitHub Pages automatically on push to `main` via `.github/workflows/deploy.yml`.

To deploy manually:

```bash
npm run build
# Upload contents of dist/ to any static host
```

## License

MIT
