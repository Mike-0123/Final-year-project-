import { useState } from 'react';
import Card from './Card';
import { AlertItem } from '../types';

const severityColors: Record<string, string> = {
  high:     'bg-red-50 border-red-400 text-red-700',
  critical: 'bg-red-50 border-red-600 text-red-800',
  medium:   'bg-yellow-50 border-yellow-400 text-yellow-700',
  low:      'bg-blue-50 border-blue-400 text-blue-700',
};

const severityDot: Record<string, string> = {
  high:     'bg-red-500',
  critical: 'bg-red-700',
  medium:   'bg-yellow-400',
  low:      'bg-blue-400',
};

interface AlertsProps {
  alerts?: AlertItem[];
}

// How many alerts to show before collapsing
const VISIBLE_COUNT = 3;

export default function Alerts({ alerts = [] }: AlertsProps) {
  const [expanded, setExpanded] = useState(false);

  const visibleAlerts = expanded ? alerts : alerts.slice(0, VISIBLE_COUNT);
  const hiddenCount   = alerts.length - VISIBLE_COUNT;

  return (
    <Card title="Alerts Panel">
      {alerts.length === 0 ? (
        <p className="text-green-600 text-sm">No active alerts — milk quality is normal</p>
      ) : (
        <>
          {/* Summary badge when collapsed */}
          {!expanded && alerts.length > VISIBLE_COUNT && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-red-50 border border-red-200">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-xs font-semibold text-red-700">
                {alerts.length} active alerts
              </span>
              <span className="text-xs text-red-400 ml-auto">
                {hiddenCount} more hidden
              </span>
            </div>
          )}

          {/* Alert list — scrollable, max height */}
          <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: expanded ? 340 : 'none' }}>
            {visibleAlerts.map((alert, i) => {
              const key   = alert.severity?.toLowerCase() || 'medium';
              const color = severityColors[key] || severityColors.medium;
              const dot   = severityDot[key]   || severityDot.medium;
              return (
                <div key={i} className={`border-l-4 rounded-r-lg px-3 py-1.5 text-sm ${color}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                    <span className="font-semibold truncate">
                      {alert.type || alert.message}
                    </span>
                    <span className="ml-auto text-[10px] uppercase tracking-wide opacity-60 shrink-0">
                      {alert.severity}
                    </span>
                  </div>
                  {alert.message && alert.type && (
                    <div className="text-xs mt-0.5 opacity-75 pl-3.5 truncate">{alert.message}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show more / show less toggle */}
          {alerts.length > VISIBLE_COUNT && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 w-full text-xs font-semibold text-blue-600 hover:text-blue-800 py-1 rounded-lg hover:bg-blue-50 transition"
            >
              {expanded
                ? '▲ Show less'
                : `▼ Show all ${alerts.length} alerts`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}
