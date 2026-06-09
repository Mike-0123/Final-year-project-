import Card from './Card';
import { SensorReading } from '../types';

interface NormalRange {
  min: number;
  max: number;
  barMax: number;
}

interface SensorBarProps {
  label: string;
  value: number | null | undefined;
  unit: string;
  range: NormalRange;
}

const SensorBar = ({ label, value, unit, range }: SensorBarProps) => {
  const hasValue = value !== null && value !== undefined;
  const inRange = hasValue && value! >= range.min && value! <= range.max;
  const pct = hasValue ? Math.min(Math.max((value! / range.barMax) * 100, 0), 100) : 0;
  const fill = inRange ? '#1d4ed8' : '#dc2626';
  const bgBar = inRange ? '#dbeafe' : '#fee2e2';

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e3a8a' }}>{label}</span>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: inRange ? '#1d4ed8' : '#dc2626',
          minWidth: 64,
          textAlign: 'right',
        }}>
          {hasValue ? `${value}${unit ? ' ' + unit : ''}` : '—'}
        </span>
      </div>
      <div style={{
        width: '100%',
        height: 8,
        borderRadius: 99,
        background: bgBar,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: fill,
          borderRadius: 99,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>0</span>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>
          Normal: {range.min}–{range.max}
        </span>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>{range.barMax}</span>
      </div>
    </div>
  );
};

interface SensorDataProps {
  data?: SensorReading | null;
}

const SENSORS: { key: keyof SensorReading; label: string; unit: string; range: NormalRange }[] = [
  { key: 'ph',          label: 'pH Level',     unit: '',    range: { min: 6.4,  max: 6.8,  barMax: 14  } },
  { key: 'temperature', label: 'Temperature',  unit: '°C',  range: { min: 2,    max: 25,   barMax: 100 } },
  { key: 'fat',         label: 'Fat Content',  unit: '%',   range: { min: 3,    max: 5,    barMax: 10  } },
  { key: 'turbidity',   label: 'Turbidity',    unit: 'NTU', range: { min: 0,    max: 50,   barMax: 100 } },
  { key: 'colour',      label: 'Colour',       unit: '',    range: { min: 230,  max: 255,  barMax: 255 } },
];

export default function SensorData({ data }: SensorDataProps) {
  if (!data) return (
    <Card title="Sensor Readings">
      <p style={{ color: '#94a3b8', fontSize: 13 }}>Waiting for sensor data...</p>
    </Card>
  );

  return (
    <Card title="Sensor Readings">
      {SENSORS.map(({ key, label, unit, range }) => (
        <SensorBar
          key={key}
          label={label}
          value={data[key] as number | null | undefined}
          unit={unit}
          range={range}
        />
      ))}
    </Card>
  );
}
