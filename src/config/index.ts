import type { TaxYearConfig } from '../types';
import { taxYear2025 } from './tax-year-2025';
import { taxYear2026 } from './tax-year-2026';

const configs: Record<number, TaxYearConfig> = {
  2025: taxYear2025,
  2026: taxYear2026,
};

export function getTaxYearConfig(year?: number): TaxYearConfig {
  const currentYear = year ?? new Date().getFullYear();
  const config = configs[currentYear];
  if (!config) {
    // Fall back to the most recent available year
    const available = Object.keys(configs).map(Number).sort((a, b) => b - a);
    return configs[available[0]];
  }
  return config;
}

export function getAvailableTaxYears(): number[] {
  return Object.keys(configs).map(Number).sort((a, b) => b - a);
}

export { taxYear2025, taxYear2026 };
