import { useMemo, useState } from 'react';
import Card from './Card';
import { MilkRecord, SensorReading } from '../types';

type SensorKey = keyof SensorReading;

interface SensorConfig {
  key: SensorKey;
  label: string;
  device: string;
  pin: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  normal: string;
  image: string;
}

const SENSOR_CONFIG: SensorConfig[] = [
  {
    key: 'ph',
    label: 'pH Level',
    device: 'Analog pH Sensor',
    pin: 'ADC GPIO 1',
    unit: '',
    min: 0,
    max: 14,
    step: 0.01,
    normal: '6.6 - 6.8',
    image: 'PH',
  },
  {
    key: 'temperature',
    label: 'Temperature',
    device: 'DS18B20 / DHT22',
    pin: 'GPIO 4',
    unit: 'C',
    min: 0,
    max: 40,
    step: 0.1,
    normal: '2 - 6 C',
    image: 'TMP',
  },
  {
    key: 'taste',
    label: 'Taste Proxy',
    device: 'Manual Quality Switch',
    pin: 'Digital Input',
    unit: '',
    min: 0,
    max: 1,
    step: 1,
    normal: '1 = normal',
    image: 'TST',
  },
  {
    key: 'odor',
    label: 'Odor / Gas',
    device: 'MQ Gas Sensor',
    pin: 'ADC GPIO 3',
    unit: '',
    min: 0,
    max: 1,
    step: 1,
    normal: '1 = normal',
    image: 'MQ',
  },
  {
    key: 'fat',
    label: 'Fat Content',
    device: 'IR Fat / Lab Input',
    pin: 'Manual Input',
    unit: '%',
    min: 0,
    max: 8,
    step: 0.1,
    normal: '3.2 - 4.5%',
    image: 'FAT',
  },
  {
    key: 'turbidity',
    label: 'Turbidity',
    device: 'Turbidity Sensor',
    pin: 'ADC GPIO 2',
    unit: 'NTU',
    min: 0,
    max: 20,
    step: 0.1,
    normal: '0 - 4 NTU',
    image: 'NTU',
  },
  {
    key: 'colour',
    label: 'Colour',
    device: 'TCS34725 RGB Sensor',
    pin: 'I2C GPIO 8/9',
    unit: '',
    min: 220,
    max: 260,
    step: 1,
    normal: '245 - 255',
    image: 'RGB',
  },
];

const DEFAULT_THRESHOLDS = {
  phMin: 6.6,
  phMax: 6.8,
  tempMax: 6,
  fatMin: 3.2,
  turbidityMax: 4,
  colourMin: 245,
};

type Thresholds = typeof DEFAULT_THRESHOLDS;

const DEFAULT_READING: Required<SensorReading> = {
  ph: 6.7,
  temperature: 5,
  taste: 1,
  odor: 1,
  fat: 3.5,
  turbidity: 2,
  colour: 250,
};

interface SimulationWorkspaceProps {
  initialData?: SensorReading | null;
  onSimulate: (record: MilkRecord) => void;
  onSubmit?: (reading: SensorReading) => Promise<MilkRecord>;
  isDemo: boolean;
}

function valueOf(reading: any, key: SensorKey): number {
  return Number(reading[key] ?? DEFAULT_READING[key] ?? 0);
}

function analyzeLocally(reading: any, thresholds: Thresholds): MilkRecord {
  const ph = valueOf(reading, 'ph');
  const temperature = valueOf(reading, 'temperature');
  const taste = valueOf(reading, 'taste');
  const odor = valueOf(reading, 'odor');
  const fat = valueOf(reading, 'fat');
  const turbidity = valueOf(reading, 'turbidity');
  const colour = valueOf(reading, 'colour');
  const reasons: string[] = [];

  if (ph < thresholds.phMin) reasons.push('pH sensor reads below the normal fresh milk range');
  if (ph > thresholds.phMax) reasons.push('pH sensor reads above the normal fresh milk range');
  if (temperature > thresholds.tempMax) reasons.push('Temperature sensor shows milk is above safe cold storage range');
  if (taste === 0) reasons.push('Taste proxy is marked abnormal');
  if (odor === 0) reasons.push('MQ gas sensor proxy indicates abnormal odor');
  if (fat < thresholds.fatMin) reasons.push('Fat content is lower than the expected milk range');
  if (turbidity > thresholds.turbidityMax) reasons.push('Turbidity sensor shows high cloudiness or impurities');
  if (colour < thresholds.colourMin) reasons.push('Colour sensor value is lower than expected for normal milk');

  const status = reasons.length === 0 ? 'GOOD' : 'BAD';
  const percentage = status === 'GOOD' ? 0 : Math.min(95, 15 + reasons.length * 12);
  const adulterationType =
    status === 'GOOD' ? null
    : fat < thresholds.fatMin || turbidity > thresholds.turbidityMax || colour < thresholds.colourMin ? 'Water'
    : temperature > thresholds.tempMax || odor === 0 || taste === 0 ? 'Spoilage'
    : 'Suspected Adulteration';

  return {
    ...reading,
    ph,
    temperature,
    taste,
    odor,
    fat,
    turbidity,
    colour,
    status,
    adulteration_type: adulterationType,
    percentage,
    reasons,
    created_at: new Date().toISOString(),
  };
}

function sensorHealth(reading: any, key: SensorKey, thresholds: Thresholds) {
  const value = valueOf(reading, key);
  if (key === 'ph') return value >= thresholds.phMin && value <= thresholds.phMax;
  if (key === 'temperature') return value <= thresholds.tempMax;
  if (key === 'taste' || key === 'odor') return value === 1;
  if (key === 'fat') return value >= thresholds.fatMin && value <= 10;
  if (key === 'turbidity') return value <= thresholds.turbidityMax;
  if (key === 'colour') return value >= thresholds.colourMin;
  return true;
}

function SensorVisual({ code, good }: { code: string; good: boolean }) {
  return (
    <div className={`h-28 rounded-lg border flex items-center justify-center overflow-hidden ${good ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
      <div className="relative w-24 h-20">
        <div className="absolute inset-x-4 top-2 h-14 rounded-md bg-slate-800 shadow-inner" />
        <div className={`absolute left-7 top-5 w-10 h-8 rounded ${good ? 'bg-emerald-400' : 'bg-red-400'}`} />
        <div className="absolute left-2 right-2 bottom-1 h-4 rounded bg-amber-400 border border-amber-600" />
        <div className="absolute left-3 bottom-0 w-2 h-6 bg-slate-500" />
        <div className="absolute left-8 bottom-0 w-2 h-6 bg-slate-500" />
        <div className="absolute right-8 bottom-0 w-2 h-6 bg-slate-500" />
        <div className="absolute right-3 bottom-0 w-2 h-6 bg-slate-500" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-white/95 text-slate-800 text-xs font-bold px-2 py-1 rounded">{code}</span>
        </div>
      </div>
    </div>
  );
}

export default function SimulationWorkspace({ initialData, onSimulate, onSubmit, isDemo }: SimulationWorkspaceProps) {
  const [reading, setReading] = useState<any>({ ...DEFAULT_READING, ...initialData });
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [showConfig, setShowConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const analysis = useMemo(() => analyzeLocally(reading, thresholds), [reading, thresholds]);

  const updateValue = (key: SensorKey, raw: string) => {
    setReading((current: any) => ({ ...current, [key]: raw }));
    setMessage(null);
  };

  const changeBy = (key: SensorKey, delta: number) => {
    setReading((current: any) => {
      const currentValue = Number(current[key] ?? DEFAULT_READING[key]);
      const nextValue = Number((currentValue + delta).toFixed(3));
      return { ...current, [key]: nextValue };
    });
    setMessage(null);
  };

  const reset = () => {
    setReading(DEFAULT_READING);
    onSimulate(analyzeLocally(DEFAULT_READING, thresholds));
    setMessage('Simulation returned to normal milk values.');
  };

  const submit = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const cleanReading: SensorReading = {
        ph: valueOf(reading, 'ph'),
        temperature: valueOf(reading, 'temperature'),
        taste: valueOf(reading, 'taste'),
        odor: valueOf(reading, 'odor'),
        fat: valueOf(reading, 'fat'),
        turbidity: valueOf(reading, 'turbidity'),
        colour: valueOf(reading, 'colour'),
      };
      
      if (isDemo || !onSubmit) {
        onSimulate(analyzeLocally(cleanReading, thresholds));
        setMessage('Demo simulation applied to the dashboard.');
      } else {
        const result = await onSubmit(cleanReading);
        onSimulate(result);
        setMessage('Sensor data sent to the backend and analyzed.');
      }
    } catch (error: any) {
      setMessage(error?.response?.data ? JSON.stringify(error.response.data) : 'Backend submission failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Milk Sensor Simulation Workspace</h3>
              <p className="text-sm text-gray-500">Change sensor values as if the devices are reading a milk sample.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowConfig(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                ⚙️ Set Parameters
              </button>
              <div className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm ${analysis.status === 'GOOD' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                {analysis.status}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {SENSOR_CONFIG.map((sensor) => {
              const value = valueOf(reading, sensor.key);
              const good = sensorHealth(reading, sensor.key, thresholds);
              return (
                <div key={sensor.key} className={`rounded-lg border p-3 ${good ? 'border-blue-100' : 'border-red-200 bg-red-50/40'}`}>
                  <SensorVisual code={sensor.image} good={good} />
                  <div className="mt-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-800">{sensor.label}</p>
                        <p className="text-xs text-gray-500">{sensor.device}</p>
                      </div>
                      <span className="text-xs bg-blue-50 text-blue-900 px-2 py-1 rounded">{sensor.pin}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Normal: {sensor.normal}</p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changeBy(sensor.key, -sensor.step)}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          −
                        </button>
                        <input
                          type="range"
                          min={sensor.min}
                          max={sensor.max}
                          step={sensor.step}
                          value={value}
                          onChange={(e) => updateValue(sensor.key, e.target.value)}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => changeBy(sensor.key, sensor.step)}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={sensor.min}
                          max={sensor.max}
                          step={sensor.step}
                          value={value}
                          onChange={(e) => updateValue(sensor.key, e.target.value)}
                          className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-right"
                        />
                        <span className="text-xs text-gray-500">{sensor.unit}</span>
                      </div>
                    </div>
                    <p className={`text-xs mt-2 font-medium ${good ? 'text-green-600' : 'text-red-600'}`}>
                      {good ? 'Reading is normal' : 'Reading needs attention'} {sensor.unit && `(${sensor.unit})`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Simulation Result">
          <div className={`rounded-lg p-4 mb-4 ${analysis.status === 'GOOD' ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'}`}>
            <p className="text-xs text-gray-500 uppercase">Predicted Status</p>
            <p className={`text-3xl font-extrabold ${analysis.status === 'GOOD' ? 'text-green-600' : 'text-red-600'}`}>{analysis.status}</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Adulteration</span>
              <span className="font-bold text-gray-800 text-right">{analysis.adulteration_type || 'None'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Risk</span>
              <span className="font-bold text-gray-800">{analysis.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${analysis.status === 'GOOD' ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(analysis.percentage || 0, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Reason</p>
            {analysis.reasons && analysis.reasons.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {(Array.isArray(analysis.reasons) ? analysis.reasons : [analysis.reasons]).map((reason: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600">{reason}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">All simulated readings are inside the normal range.</p>
            )}
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={submit}
              disabled={saving}
              className="flex-1 bg-blue-900 hover:bg-blue-950 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
            >
              {saving ? 'Applying...' : isDemo ? 'Apply Simulation' : 'Send to Backend'}
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>

          {message && <p className="mt-3 text-xs text-gray-500">{message}</p>}
        </Card>
      </div>

      {/* Threshold Configuration Modal */}
      {showConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Set Simulation Parameters</h3>
              <button onClick={() => setShowConfig(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">pH Min (Default: 6.6)</label>
                  <input type="number" step="0.1" value={thresholds.phMin} onChange={e => setThresholds({...thresholds, phMin: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">pH Max (Default: 6.8)</label>
                  <input type="number" step="0.1" value={thresholds.phMax} onChange={e => setThresholds({...thresholds, phMax: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Temp °C (Default: 6)</label>
                  <input type="number" step="0.1" value={thresholds.tempMax} onChange={e => setThresholds({...thresholds, tempMax: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Fat % (Default: 3.2)</label>
                  <input type="number" step="0.1" value={thresholds.fatMin} onChange={e => setThresholds({...thresholds, fatMin: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Turbidity (Default: 4)</label>
                  <input type="number" step="0.1" value={thresholds.turbidityMax} onChange={e => setThresholds({...thresholds, turbidityMax: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Colour (Default: 245)</label>
                  <input type="number" step="1" value={thresholds.colourMin} onChange={e => setThresholds({...thresholds, colourMin: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setThresholds(DEFAULT_THRESHOLDS)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">Reset to Defaults</button>
                <button type="button" onClick={() => setShowConfig(false)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-md">
                  Apply Parameters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
