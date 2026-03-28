import type { CSPHealth } from '../../types';
import { formatCurrency, formatPct, healthColor } from '../../utils/csp';

interface BucketDisplay {
  label: string;
  amount: number;
  pct: number;
  health: { health: CSPHealth; message: string } | null;
  target: string;
}

interface CSPSidebarProps {
  netMonthly: number;
  buckets: BucketDisplay[];
  visible: boolean;
}

export function CSPSidebar({ netMonthly, buckets, visible }: CSPSidebarProps) {
  if (!visible || netMonthly === 0) return null;

  return (
    <aside className="csp-sidebar">
      <h3 className="csp-sidebar__title">Your CSP</h3>
      <p className="csp-sidebar__subtitle">
        {formatCurrency(netMonthly)}/mo take-home
      </p>

      <div className="csp-sidebar__buckets">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="csp-sidebar__bucket">
            <div className="csp-sidebar__bucket-header">
              <span className="csp-sidebar__bucket-label">{bucket.label}</span>
              <span className="csp-sidebar__bucket-target">{bucket.target}</span>
            </div>

            <div className="csp-sidebar__bucket-bar">
              <div
                className="csp-sidebar__bucket-fill"
                style={{
                  width: `${Math.min(100, bucket.pct * 100)}%`,
                  backgroundColor: bucket.health
                    ? healthColor(bucket.health.health)
                    : '#888',
                }}
              />
            </div>

            <div className="csp-sidebar__bucket-values">
              <span>{formatCurrency(bucket.amount)}/mo</span>
              <span
                className="csp-sidebar__bucket-pct"
                style={{
                  color: bucket.health
                    ? healthColor(bucket.health.health)
                    : '#888',
                }}
              >
                {formatPct(bucket.pct)}
              </span>
            </div>

            {bucket.health && bucket.health.message && (
              <p
                className="csp-sidebar__bucket-message"
                style={{ color: healthColor(bucket.health.health) }}
              >
                {bucket.health.message}
              </p>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
