import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

// ─── Suppliers ────────────────────────────────────────────────────────────────
const SUPPLIERS = [
  { id: 'SUP-001', name: 'Uwase Dairy Farm',    owner: 'Alice Uwase',    location: 'Musanze, Northern Province', lat: -1.4988, lng: 29.6340, device: 'A4:CF:12:3E', color: '#34d399' },
  { id: 'SUP-002', name: 'Nkurunziza Milk Co.', owner: 'Bob Nkurunziza', location: 'Huye, Southern Province',    lat: -2.5967, lng: 29.7399, device: 'B7:2A:88:F1', color: '#60a5fa' },
  { id: 'SUP-003', name: 'Mukamana Fresh Milk', owner: 'Carol Mukamana', location: 'Rubavu, Western Province',   lat: -1.6826, lng: 29.3462, device: 'C9:55:DA:07', color: '#fbbf24' },
  { id: 'SUP-004', name: 'Habimana Agro Ltd.',  owner: 'David Habimana', location: 'Kayonza, Eastern Province',  lat: -1.9897, lng: 30.6447, device: 'D2:11:CC:9B', color: '#e879f9' },
] as const;

type SupplierType = { id: string; name: string; owner: string; location: string; lat: number; lng: number; device: string; color: string; };

type SKey = 'ph' | 'temperature' | 'fat' | 'turbidity' | 'colour' | 'odor' | 'taste';
type Vals = Record<SKey, number>;

const SENSORS: {
  key: SKey; label: string; unit: string; min: number; max: number; step: number;
  normalMin: number; normalMax: number; noise: number; dec: number;
  hw: string; proto: string; wireColor: string;
}[] = [
  { key:'ph',          label:'pH Level',     unit:'',    min:0,  max:14,  step:0.01, normalMin:6.4, normalMax:6.8, noise:0.04, dec:2, hw:'DFRobot SEN0161-V2', proto:'Analog → GPIO1',  wireColor:'#06b6d4' },
  { key:'temperature', label:'Temperature',  unit:'°C',  min:0,  max:60,  step:0.1,  normalMin:2,   normalMax:25,  noise:0.2,  dec:1, hw:'DS18B20 Waterproof',  proto:'1-Wire → GPIO4',  wireColor:'#f97316' },
  { key:'fat',         label:'Fat Content',  unit:'%',   min:0,  max:10,  step:0.01, normalMin:3.0, normalMax:5.0, noise:0.05, dec:2, hw:'IR Fat Sensor',       proto:'Analog → GPIO5',  wireColor:'#a78bfa' },
  { key:'turbidity',   label:'Turbidity',    unit:'NTU', min:0,  max:100, step:0.1,  normalMin:0,   normalMax:50,  noise:0.5,  dec:1, hw:'DFRobot SEN0189',     proto:'Analog → GPIO2',  wireColor:'#60a5fa' },
  { key:'colour',      label:'Colour',       unit:'',    min:0,  max:255,  step:1,    normalMin:230, normalMax:255, noise:2,    dec:0, hw:'TCS34725 (I2C)',      proto:'I2C → GPIO8/9',   wireColor:'#34d399' },
  { key:'odor',        label:'Odor / Gas',   unit:'ppm', min:0,  max:1000, step:1,    normalMin:0,   normalMax:300, noise:5,    dec:0, hw:'MQ-135 Gas Sensor',   proto:'Analog → GPIO3',  wireColor:'#fbbf24' },
  { key:'taste',       label:'Taste Proxy',  unit:'',    min:0,  max:1,    step:1,    normalMin:1,   normalMax:1,   noise:0,    dec:0, hw:'Manual Switch',       proto:'Digital → GPIO6', wireColor:'#f472b6' },
];

const DEFAULTS: Vals = { ph:6.6, temperature:5.0, fat:3.5, turbidity:20.0, colour:250, odor:50, taste:1 };

function clamp(v:number,mn:number,mx:number){ return Math.min(mx,Math.max(mn,v)); }
function inRange(key:SKey, v:number){
  const s = SENSORS.find(x=>x.key===key)!;
  return v >= s.normalMin && v <= s.normalMax;
}
function applyNoise(vals:Vals):Vals{
  const n={...vals};
  SENSORS.forEach(s=>{
    if(s.noise>0){
      const d=(Math.random()-0.5)*2*s.noise;
      n[s.key]=parseFloat(clamp(vals[s.key]+d, s.min, s.max).toFixed(s.dec));
    }
  });
  return n;
}

// ─── SVG sensor visuals (pure display, no events) ─────────────────────────────

function ESP32SVG({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 340" style={{ width:'100%', height:'100%' }}>
      <rect x="8" y="8" width="184" height="324" rx="7" fill="#0d2d1a" stroke="#1a5c34" strokeWidth="1.5"/>
      {[40,80,120,160,200,240,280].map(y=><line key={y} x1="8" y1={y} x2="192" y2={y} stroke="#1a5c34" strokeWidth="0.4" opacity="0.5"/>)}
      {[40,80,120,160].map(x=><line key={x} x1={x} y1="8" x2={x} y2="332" stroke="#1a5c34" strokeWidth="0.4" opacity="0.3"/>)}
      <rect x="68" y="2" width="64" height="14" rx="4" fill="#777" stroke="#555" strokeWidth="1"/>
      <text x="100" y="12" textAnchor="middle" fill="#aaa" fontSize="5" fontFamily="monospace">USB-C</text>
      <rect x="136" y="10" width="52" height="26" rx="3" fill="none" stroke={color} strokeWidth="1.2" strokeDasharray="3,2" opacity="0.8"/>
      <text x="162" y="22" textAnchor="middle" fill={color} fontSize="5" fontFamily="monospace">Wi-Fi</text>
      <text x="162" y="30" textAnchor="middle" fill={color} fontSize="5" fontFamily="monospace">BLE 5.0</text>
      <rect x="58" y="48" width="84" height="64" rx="4" fill="#111" stroke="#333" strokeWidth="1.5"/>
      <rect x="65" y="55" width="70" height="50" rx="2" fill="#1a1a1a"/>
      <text x="100" y="76" textAnchor="middle" fill="#ccc" fontSize="8" fontFamily="monospace" fontWeight="bold">ESP32-S3</text>
      <text x="100" y="87" textAnchor="middle" fill="#555" fontSize="5.5" fontFamily="monospace">WROOM-1-N16R8</text>
      <text x="100" y="98" textAnchor="middle" fill="#333" fontSize="5" fontFamily="monospace">Espressif Systems</text>
      {[66,76,86,96,106,116,126,136].map((x,i)=><rect key={i} x={x} y="43" width="4" height="6" rx="0.5" fill="#b8860b"/>)}
      {[66,76,86,96,106,116,126,136].map((x,i)=><rect key={i} x={x} y="111" width="4" height="6" rx="0.5" fill="#b8860b"/>)}
      {['3V3','GND','IO1','IO2','IO3','IO4','IO5','IO6','IO7','IO8','IO9','5V','GND'].map((l,i)=>(
        <g key={i}>
          <rect x="8" y={133+i*13} width="11" height="8" rx="1" fill="#555"/>
          <rect x="12" y={134+i*13} width="3" height="6" rx="0.5" fill="#b8860b"/>
          <text x="24" y={140+i*13} fill="#3a7d44" fontSize="4.5" fontFamily="monospace">{l}</text>
        </g>
      ))}
      {['IO43','IO44','IO41','IO40','IO39','IO38','IO37','IO36','IO35','IO34','IO33','IO47','IO48'].map((l,i)=>(
        <g key={i}>
          <rect x="181" y={133+i*13} width="11" height="8" rx="1" fill="#555"/>
          <rect x="185" y={134+i*13} width="3" height="6" rx="0.5" fill="#b8860b"/>
          <text x="178" y={140+i*13} fill="#3a7d44" fontSize="4.5" fontFamily="monospace" textAnchor="end">{l}</text>
        </g>
      ))}
      <rect x="22" y="26" width="26" height="12" rx="3" fill="#1a1a1a" stroke="#333" strokeWidth="1"/>
      <circle cx="31" cy="32" r="4" fill="#c0392b"/>
      <text x="37" y="35" fill="#888" fontSize="4.5" fontFamily="monospace">EN</text>
      <rect x="54" y="26" width="30" height="12" rx="3" fill="#1a1a1a" stroke="#333" strokeWidth="1"/>
      <circle cx="63" cy="32" r="4" fill="#2980b9"/>
      <text x="70" y="35" fill="#888" fontSize="4.5" fontFamily="monospace">BOOT</text>
      <circle cx="24" cy="122" r="4" fill={color} style={{filter:`drop-shadow(0 0 6px ${color})`}}/>
      <circle cx="36" cy="122" r="4" fill="#c0392b" opacity="0.7"/>
      <text x="48" y="126" fill="#1a5c34" fontSize="4.5" fontFamily="monospace">PWR  ERR</text>
      <text x="100" y="325" textAnchor="middle" fill="#1a5c34" fontSize="6" fontFamily="monospace">ESP32-S3 DevKitC-1</text>
    </svg>
  );
}

function PhSVG({ value, color }: { value: number; color: string }) {
  const ok = inRange('ph', value);
  const led = ok ? color : '#f87171';
  return (
    <svg viewBox="0 0 90 140" style={{ width:'100%', height:'100%' }}>
      <rect x="4" y="24" width="82" height="112" rx="5" fill="#0d2645" stroke="#1a4a8a" strokeWidth="1.5"/>
      <rect x="24" y="2" width="42" height="24" rx="4" fill="#555" stroke="#777" strokeWidth="1"/>
      <circle cx="45" cy="14" r="8" fill="#777" stroke="#999" strokeWidth="1"/>
      <circle cx="45" cy="14" r="4" fill="#b8860b"/>
      <text x="45" y="33" textAnchor="middle" fill="#aaa" fontSize="6" fontFamily="monospace">BNC</text>
      <rect x="22" y="46" width="46" height="22" rx="2" fill="#111" stroke="#333" strokeWidth="1"/>
      <text x="45" y="57" textAnchor="middle" fill="#aaa" fontSize="5.5" fontFamily="monospace">BL4050B</text>
      <text x="45" y="66" textAnchor="middle" fill="#444" fontSize="4.5" fontFamily="monospace">Op-Amp</text>
      <circle cx="18" cy="84" r="4.5" fill={led} style={{filter:`drop-shadow(0 0 6px ${led})`}}/>
      <text x="28" y="88" fill="#aaa" fontSize="5.5" fontFamily="monospace">PWR</text>
      {['G','V','S'].map((l,i)=>(
        <g key={i}>
          <rect x={16+i*20} y="100" width="14" height="18" rx="2" fill="#222" stroke="#444" strokeWidth="1"/>
          <rect x={20+i*20} y="103" width="5" height="12" rx="1" fill="#b8860b"/>
          <text x={23+i*20} y="124" textAnchor="middle" fill="#666" fontSize="5" fontFamily="monospace">{l}</text>
        </g>
      ))}
      <text x="80" y="92" textAnchor="end" fill={ok?color:'#f87171'} fontSize="11" fontFamily="monospace" fontWeight="bold">{value.toFixed(2)}</text>
      <text x="45" y="133" textAnchor="middle" fill="#1a4a8a" fontSize="5.5" fontFamily="monospace">SEN0161-V2</text>
    </svg>
  );
}

function TempSVG({ value, color }: { value: number; color: string }) {
  const ok = inRange('temperature', value);
  const led = ok ? color : '#f87171';
  const tip = value > 25 ? '#f87171' : value > 15 ? '#fbbf24' : '#60a5fa';
  // mercury column height: map 0-60°C to 10-82px
  const colH = Math.round(10 + (value/60)*72);
  return (
    <svg viewBox="0 0 80 155" style={{ width:'100%', height:'100%' }}>
      {/* Glass tube */}
      <rect x="33" y="8" width="14" height="88" rx="7" fill="#555" stroke="#444" strokeWidth="1.5"/>
      <rect x="36" y="11" width="8" height="82" rx="4" fill="#1a1a2e"/>
      {/* Mercury column — height changes with value */}
      <rect x="37" y={93-colH} width="6" height={colH} rx="2" fill={tip} style={{transition:'height .4s, y .4s'}}/>
      {/* Bulb */}
      <ellipse cx="40" cy="100" rx="10" ry="12" fill={tip} stroke={tip} strokeWidth="1" style={{filter:`drop-shadow(0 0 7px ${tip})`}}/>
      {/* Cables */}
      <line x1="33" y1="8" x2="8" y2="8" stroke="#111" strokeWidth="4" strokeLinecap="round"/>
      <line x1="36" y1="8" x2="8" y2="8" stroke="#c0392b" strokeWidth="2" strokeLinecap="round"/>
      <line x1="40" y1="8" x2="8" y2="8" stroke="#f1c40f" strokeWidth="2" strokeLinecap="round"/>
      <line x1="44" y1="8" x2="8" y2="8" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
      <text x="40" y="122" textAnchor="middle" fill={ok?color:'#f87171'} fontSize="12" fontFamily="monospace" fontWeight="bold">{value.toFixed(1)}</text>
      <text x="40" y="133" textAnchor="middle" fill="#666" fontSize="8" fontFamily="monospace">°C</text>
      <circle cx="40" cy="144" r="5" fill={led} style={{filter:`drop-shadow(0 0 6px ${led})`}}/>
      <text x="40" y="153" textAnchor="middle" fill="#444" fontSize="4.5" fontFamily="monospace">DS18B20</text>
    </svg>
  );
}

function TurbSVG({ value, color }: { value: number; color: string }) {
  const ok = inRange('turbidity', value);
  const led = ok ? color : '#f87171';
  const water = value > 60 ? '#92400e' : value > 30 ? '#d97706' : '#3b82f6';
  const opacity = 0.4 + (value/100)*0.55;
  return (
    <svg viewBox="0 0 96 125" style={{ width:'100%', height:'100%' }}>
      <rect x="4" y="4" width="88" height="72" rx="5" fill="#0d1e3a" stroke="#1a3a6a" strokeWidth="1.5"/>
      {/* Water window */}
      <rect x="33" y="12" width="30" height="44" rx="3" fill={water} stroke="#aaa" strokeWidth="1" opacity={opacity} style={{transition:'fill .4s, opacity .4s', filter:`drop-shadow(0 0 7px ${water})`}}/>
      <circle cx="22" cy="34" r="7" fill="#c0392b" stroke="#922b21" strokeWidth="1"/>
      <text x="22" y="48" textAnchor="middle" fill="#666" fontSize="5" fontFamily="monospace">IR</text>
      <circle cx="74" cy="34" r="7" fill="#1a5276" stroke="#21618c" strokeWidth="1"/>
      <text x="74" y="48" textAnchor="middle" fill="#666" fontSize="5" fontFamily="monospace">PT</text>
      <circle cx="18" cy="65" r="4" fill={led} style={{filter:`drop-shadow(0 0 5px ${led})`}}/>
      {['G','V','S'].map((l,i)=>(
        <g key={i}>
          <rect x={18+i*22} y="80" width="14" height="18" rx="2" fill="#222" stroke="#444" strokeWidth="1"/>
          <rect x={22+i*22} y="83" width="5" height="12" rx="1" fill="#b8860b"/>
          <text x={25+i*22} y="103" textAnchor="middle" fill="#555" fontSize="5" fontFamily="monospace">{l}</text>
        </g>
      ))}
      <text x="48" y="112" textAnchor="middle" fill={ok?color:'#f87171'} fontSize="10" fontFamily="monospace" fontWeight="bold">{value.toFixed(1)}</text>
      <text x="48" y="122" textAnchor="middle" fill="#1a3a6a" fontSize="5.5" fontFamily="monospace">NTU · SEN0189</text>
    </svg>
  );
}

function MQSVG({ value, color }: { value: number; color: string }) {
  const ok = inRange('odor', value);
  const led = ok ? color : '#f87171';
  // glow + core opacity scale with ppm
  const glowR   = Math.round(4 + (value / 1000) * 18);
  const coreOp  = 0.45 + (value / 1000) * 0.55;
  const coreCol = ok ? '#c0392b' : '#ff2200';
  return (
    <svg viewBox="0 0 96 118" style={{ width:'100%', height:'100%' }}>
      <rect x="4" y="36" width="88" height="78" rx="5" fill="#1a0c06" stroke="#4a2510" strokeWidth="1.5"/>
      <ellipse cx="48" cy="28" rx="30" ry="30" fill="#888" stroke="#555" strokeWidth="2"/>
      <ellipse cx="48" cy="28" rx="24" ry="24" fill="#aaa"/>
      {[[36,16],[48,12],[60,16],[64,28],[60,40],[48,44],[36,40],[32,28]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="2.5" fill="#555"/>
      ))}
      {/* Sensing element — glows brighter as ppm rises */}
      <circle cx="48" cy="28" r="9" fill={coreCol} opacity={coreOp}
        style={{filter:`drop-shadow(0 0 ${glowR}px ${coreCol})`, transition:'opacity .4s, filter .4s'}}/>
      <circle cx="48" cy="28" r="5" fill="none" stroke="#f39c12" strokeWidth="1.5" strokeDasharray="2,1"/>
      {/* ppm value on dome */}
      <text x="48" y="31" textAnchor="middle" fill="white" fontSize="6" fontFamily="monospace" fontWeight="bold">{value}</text>
      <circle cx="20" cy="64" r="4" fill="#f39c12" opacity="0.8"/>
      <circle cx="33" cy="64" r="4" fill={led} style={{filter:`drop-shadow(0 0 5px ${led})`}}/>
      {['VCC','GND','DO','AO'].map((l,i)=>(
        <g key={i}>
          <rect x={12+i*18} y="94" width="13" height="14" rx="2" fill="#222" stroke="#444" strokeWidth="1"/>
          <rect x={16+i*18} y="97" width="5" height="8" rx="1" fill="#b8860b"/>
          <text x={19+i*18} y="114" textAnchor="middle" fill="#555" fontSize="4.5" fontFamily="monospace">{l}</text>
        </g>
      ))}
      <text x="48" y="80" textAnchor="middle" fill="#4a2510" fontSize="5.5" fontFamily="monospace">MQ-135</text>
    </svg>
  );
}

function TCSSVG({ value, color }: { value: number; color: string }) {
  const ok = inRange('colour', value);
  const led = ok ? color : '#f87171';
  const bri = Math.round((value/255)*100);
  const disp = `hsl(45,${bri}%,${38+bri*0.25}%)`;
  return (
    <svg viewBox="0 0 96 120" style={{ width:'100%', height:'100%' }}>
      <rect x="4" y="26" width="88" height="90" rx="5" fill="#0d0d22" stroke="#1a1a44" strokeWidth="1.5"/>
      <rect x="28" y="34" width="40" height="34" rx="3" fill="#111" stroke="#333" strokeWidth="1.5"/>
      {/* Colour window — reflects actual value */}
      <rect x="34" y="40" width="28" height="22" rx="2" fill={disp} stroke="#444" strokeWidth="1" style={{filter:`drop-shadow(0 0 9px ${disp})`, transition:'fill .3s'}}/>
      <circle cx="40" cy="51" r="4" fill="#e74c3c" opacity="0.85"/>
      <circle cx="48" cy="51" r="4" fill="#27ae60" opacity="0.85"/>
      <circle cx="56" cy="51" r="4" fill="#2980b9" opacity="0.85"/>
      <circle cx="48" cy="41" r="3" fill="white" opacity="0.9" style={{filter:'drop-shadow(0 0 5px white)'}}/>
      <text x="48" y="76" textAnchor="middle" fill="#333" fontSize="5" fontFamily="monospace">TCS34725</text>
      <circle cx="18" cy="84" r="4" fill={led} style={{filter:`drop-shadow(0 0 5px ${led})`}}/>
      {['VIN','GND','SDA','SCL'].map((l,i)=>(
        <g key={i}>
          <rect x={12+i*18} y="96" width="13" height="14" rx="2" fill="#222" stroke="#444" strokeWidth="1"/>
          <rect x={16+i*18} y="99" width="5" height="8" rx="1" fill="#b8860b"/>
          <text x={19+i*18} y="116" textAnchor="middle" fill="#555" fontSize="4.5" fontFamily="monospace">{l}</text>
        </g>
      ))}
      <text x="80" y="88" textAnchor="end" fill={ok?color:'#f87171'} fontSize="10" fontFamily="monospace" fontWeight="bold">{value}</text>
    </svg>
  );
}

function FatSVG({ value, color }: { value: number; color: string }) {
  const ok = inRange('fat', value);
  const led = ok ? color : '#f87171';
  return (
    <svg viewBox="0 0 96 110" style={{ width:'100%', height:'100%' }}>
      <rect x="4" y="4" width="88" height="98" rx="5" fill="#0d200d" stroke="#1a4a1a" strokeWidth="1.5"/>
      <circle cx="30" cy="36" r="13" fill="#1a1a1a" stroke="#444" strokeWidth="1.5"/>
      <circle cx="30" cy="36" r="8" fill="#c0392b" style={{filter:'drop-shadow(0 0 5px #c0392b)'}}/>
      <text x="30" y="57" textAnchor="middle" fill="#555" fontSize="5" fontFamily="monospace">IR TX</text>
      <circle cx="66" cy="36" r="13" fill="#1a1a1a" stroke="#444" strokeWidth="1.5"/>
      <circle cx="66" cy="36" r="8" fill="#1a5276"/>
      <text x="66" y="57" textAnchor="middle" fill="#555" fontSize="5" fontFamily="monospace">IR RX</text>
      <circle cx="18" cy="70" r="4" fill={led} style={{filter:`drop-shadow(0 0 5px ${led})`}}/>
      {['G','V','A'].map((l,i)=>(
        <g key={i}>
          <rect x={20+i*22} y="78" width="14" height="14" rx="2" fill="#222" stroke="#444" strokeWidth="1"/>
          <rect x={24+i*22} y="81" width="5" height="8" rx="1" fill="#b8860b"/>
          <text x={27+i*22} y="98" textAnchor="middle" fill="#555" fontSize="5" fontFamily="monospace">{l}</text>
        </g>
      ))}
      <text x="80" y="74" textAnchor="end" fill={ok?color:'#f87171'} fontSize="10" fontFamily="monospace" fontWeight="bold">{value.toFixed(2)}</text>
      <text x="48" y="107" textAnchor="middle" fill="#1a4a1a" fontSize="5.5" fontFamily="monospace">IR Fat Sensor</text>
    </svg>
  );
}

// ─── Single sensor card (HTML — fully interactive) ────────────────────────────
function SensorCard({
  sensor, value, color, driftOn,
  onChange,
}: {
  sensor: typeof SENSORS[number];
  value: number;
  color: string;
  driftOn: boolean;
  onChange: (v: number) => void;
}) {
  const ok = inRange(sensor.key, value);
  const pct = ((value - sensor.min) / (sensor.max - sensor.min)) * 100;
  const isBinary = sensor.max === 1;

  return (
    <div style={{
      background: ok ? 'rgba(5,30,15,0.85)' : 'rgba(30,5,5,0.85)',
      border: `1.5px solid ${ok ? color+'44' : '#f8717144'}`,
      borderRadius: 14, padding: '12px 10px',
      display: 'flex', flexDirection: 'column', gap: 6,
      transition: 'border-color .3s',
    }}>
      {/* Hardware name + LED */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize: 9, fontWeight:'bold', letterSpacing:'0.12em', color: ok ? color : '#f87171', textTransform:'uppercase' }}>
            {sensor.label}
          </div>
          <div style={{ fontSize: 8, color:'#475569', marginTop:1 }}>{sensor.hw}</div>
          <div style={{ fontSize: 8, color:'#334155' }}>{sensor.proto}</div>
        </div>
        <span className="blink" style={{ width:8, height:8, borderRadius:'50%', marginTop:2, flexShrink:0,
          background: ok ? color : '#f87171', boxShadow:`0 0 6px ${ok ? color : '#f87171'}`, display:'block' }}/>
      </div>

      {/* SVG hardware visual */}
      <div style={{ height: 130, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {sensor.key === 'ph'          && <PhSVG   value={value} color={color}/>}
        {sensor.key === 'temperature' && <TempSVG value={value} color={color}/>}
        {sensor.key === 'turbidity'   && <TurbSVG value={value} color={color}/>}
        {sensor.key === 'odor'        && <MQSVG   value={value} color={color}/>}
        {sensor.key === 'colour'      && <TCSSVG  value={value} color={color}/>}
        {sensor.key === 'fat'         && <FatSVG  value={value} color={color}/>}
        {sensor.key === 'taste' && (
          /* Taste is a click-toggle */
          <div
            onClick={() => onChange(value === 1 ? 0 : 1)}
            style={{ cursor:'pointer', width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}
          >
            <div style={{
              width: 70, height: 34, borderRadius: 17,
              background: value===1 ? '#16a34a' : '#dc2626',
              border: '2px solid #111', position:'relative', transition:'background .2s',
            }}>
              <div style={{
                position:'absolute', top:4,
                left: value===1 ? 38 : 4,
                width:22, height:22, borderRadius:'50%',
                background:'white', boxShadow:'0 2px 4px rgba(0,0,0,.4)',
                transition:'left .15s',
              }}/>
            </div>
            <div style={{
              fontSize: 10, fontWeight:'bold', padding:'2px 12px', borderRadius:6,
              background: value===1 ? '#14532d' : '#7f1d1d', color:'white',
            }}>
              {value===1 ? 'NORMAL' : 'ABNORMAL'}
            </div>
            <div style={{ fontSize:8, color:'#374151' }}>Click to toggle</div>
          </div>
        )}
      </div>

      {/* Big value readout */}
      {!isBinary && (
        <div style={{ textAlign:'center', fontFamily:'monospace' }}>
          <span style={{ fontSize:22, fontWeight:'black', color: ok ? color : '#f87171', transition:'color .3s' }}>
            {sensor.dec > 0 ? value.toFixed(sensor.dec) : value}
          </span>
          {sensor.unit && <span style={{ fontSize:11, color:'#64748b', marginLeft:3 }}>{sensor.unit}</span>}
        </div>
      )}

      {/* Gauge bar */}
      {!isBinary && (
        <div style={{ background:'#1e293b', borderRadius:6, height:6, overflow:'hidden' }}>
          <div style={{
            height:'100%', borderRadius:6,
            width:`${pct}%`,
            background: ok ? color : '#f87171',
            transition:'width .3s, background .3s',
          }}/>
        </div>
      )}

      {/* Normal range hint */}
      {!isBinary && (
        <div style={{ fontSize:8, color:'#334155', textAlign:'center' }}>
          Normal: {sensor.normalMin}–{sensor.normalMax}{sensor.unit}
        </div>
      )}

      {/* Slider — the key interactive control */}
      {!isBinary && (
        <input
          type="range"
          min={sensor.min}
          max={sensor.max}
          step={sensor.step}
          value={value}
          disabled={driftOn && sensor.noise > 0}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{
            width:'100%', height:6, cursor: driftOn && sensor.noise > 0 ? 'not-allowed' : 'pointer',
            accentColor: ok ? color : '#f87171',
            opacity: driftOn && sensor.noise > 0 ? 0.4 : 1,
          }}
        />
      )}

      {/* Wire colour tag */}
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <div style={{ width:20, height:3, borderRadius:2, background:sensor.wireColor }}/>
        <span style={{ fontSize:8, color:'#334155' }}>{sensor.proto}</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SimulationPage() {
  const [supplier, setSupplier] = useState<SupplierType>(SUPPLIERS[0] as SupplierType);
  const [vals, setVals]         = useState<Vals>(DEFAULTS);
  const [drift, setDrift]       = useState(false);
  const [autoSend, setAutoSend] = useState(false);
  const [ivl, setIvl]           = useState(5);
  const [countdown, setCountdown] = useState(5);
  const [sending, setSending]   = useState(false);
  const [connected, setConn]    = useState<boolean|null>(null);
  const [sentId, setSentId]     = useState<number|null>(null);

  const vRef = useRef(vals);
  const sRef = useRef(supplier);
  vRef.current = vals;
  sRef.current = supplier;

  // backend ping
  useEffect(() => {
    const ping = async () => {
      try { await axios.get(`${BASE_URL}/api/analyze/latest/`, {timeout:3000}); setConn(true); }
      catch(e:any){ setConn(e?.response ? true : false); }
    };
    ping();
    const t = setInterval(ping, 8000);
    return () => clearInterval(t);
  }, []);

  // sensor drift
  useEffect(() => {
    if (!drift) return;
    const t = setInterval(() => setVals(p => applyNoise(p)), 1000);
    return () => clearInterval(t);
  }, [drift]);

  // send to backend
  const send = useCallback(async () => {
    setSending(true);
    try {
      // ML model expects odor as 0 (bad) or 1 (good) — map ppm threshold
      const odorBinary = vRef.current.odor <= 300 ? 1 : 0;
      const res = await axios.post(`${BASE_URL}/api/analyze/`, {
        ...vRef.current,
        odor: odorBinary,          // converted for ML model
        supplier_id:   sRef.current.id,
        supplier_name: sRef.current.name,
        latitude:      sRef.current.lat,
        longitude:     sRef.current.lng,
        location_name: sRef.current.location,
      }, { timeout: 8000 });
      setSentId(res.data.id);
    } catch { /* errors visible in dashboard */ }
    finally { setSending(false); }
  }, []);

  // auto-send
  useEffect(() => {
    if (!autoSend) return;
    setCountdown(ivl);
    const t = setInterval(() => setCountdown(p => {
      if (p <= 1) { send(); return ivl; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [autoSend, ivl, send]);

  const set = (k: SKey, v: number) => setVals(p => ({ ...p, [k]: v }));
  const col = supplier.color;

  return (
    <div style={{ minHeight:'100vh', background:'#060a10', fontFamily:'monospace', color:'white', display:'flex', flexDirection:'column' }}>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
        .blink{animation:blink 1.4s ease-in-out infinite}
        input[type=range]{-webkit-appearance:none; appearance:none; border-radius:4px; outline:none;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none; appearance:none; width:14px; height:14px; border-radius:50%; cursor:pointer;}
        input[type=range]:disabled::-webkit-slider-thumb{cursor:not-allowed;}
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:'rgba(0,0,0,.75)', borderBottom:`1px solid ${col}33`, padding:'8px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="blink" style={{ width:10, height:10, borderRadius:'50%', background:col, boxShadow:`0 0 8px ${col}`, display:'inline-block' }}/>
          <div>
            <div style={{ fontSize:12, fontWeight:'bold', letterSpacing:'0.18em', color:col }}>IoT CIRCUIT SIMULATION</div>
            <div style={{ fontSize:8, color:'#475569', letterSpacing:'0.1em' }}>ESP32-S3 · 7 SENSORS · MILK QUALITY DETECTION</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:10, padding:'3px 10px', borderRadius:20, border:`1px solid ${connected?col+'44':'#f8717144'}`, background:connected?'#052e1699':'#450a0a99', color:connected?col:'#f87171' }}>
            <span className={connected?'blink':''} style={{ width:6, height:6, borderRadius:'50%', background:connected===null?'#fbbf24':connected?col:'#f87171', display:'inline-block', marginRight:5 }}/>
            {connected===null?'Checking…':connected?'Backend Online':'Backend Offline'}
          </div>
          <Link to="/login" style={{ fontSize:10, color:'#60a5fa', border:'1px solid #1e3a5f', padding:'3px 10px', borderRadius:6, textDecoration:'none' }}>→ Dashboard</Link>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* ── LEFT sidebar: supplier + ESP32 + controls ── */}
        <div style={{ width:230, borderRight:'1px solid #0f1e2e', overflowY:'auto', background:'rgba(0,0,0,.45)', padding:12, display:'flex', flexDirection:'column', gap:10 }}>

          <div style={{ fontSize:8, color:'#334155', letterSpacing:'0.15em' }}>SELECT DEVICE</div>
          {SUPPLIERS.map(s=>(
            <button key={s.id} onClick={()=>setSupplier(s as SupplierType)} style={{
              textAlign:'left', padding:'7px 10px', borderRadius:10,
              border:`1px solid ${supplier.id===s.id?s.color:'#1e293b'}`,
              background:supplier.id===s.id?'#0a1a10':'transparent', cursor:'pointer',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                <span className="blink" style={{ width:7, height:7, borderRadius:'50%', background:s.color, boxShadow:`0 0 5px ${s.color}`, display:'inline-block' }}/>
                <span style={{ fontSize:8, fontWeight:'bold', color:s.color }}>{s.id}</span>
              </div>
              <div style={{ fontSize:10, color:'white' }}>{s.name}</div>
              <div style={{ fontSize:8, color:'#475569' }}>{s.owner}</div>
            </button>
          ))}

          {/* GPS badge */}
          <div style={{ borderRadius:8, border:`1px solid ${col}33`, background:'#0f172a', padding:'8px 10px' }}>
            <div style={{ fontSize:8, color:'#475569', marginBottom:3 }}>📍 LOCATION</div>
            <div style={{ fontSize:9, color:col, fontWeight:'bold' }}>{supplier.location}</div>
            <div style={{ fontSize:8, color:'#334155', marginTop:2 }}>LAT {supplier.lat.toFixed(4)}  LNG {supplier.lng.toFixed(4)}</div>
            <div style={{ fontSize:8, color:`${col}99`, marginTop:2 }}>📡 {supplier.device}</div>
          </div>

          {/* ESP32 board mini diagram */}
          <div style={{ borderRadius:8, border:'1px solid #1e293b', padding:6, background:'#080c14' }}>
            <div style={{ fontSize:8, color:'#334155', marginBottom:4, letterSpacing:'0.1em' }}>ESP32-S3 BOARD</div>
            <div style={{ height:160 }}>
              <ESP32SVG color={col}/>
            </div>
          </div>

          {/* Drift toggle */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:10, color:'#94a3b8' }}>Sensor Drift</span>
            <button onClick={()=>setDrift(!drift)} style={{ width:38, height:20, borderRadius:10, border:'none', cursor:'pointer', position:'relative', background:drift?col:'#334155', transition:'background .2s' }}>
              <span style={{ position:'absolute', top:3, left:drift?20:3, width:14, height:14, borderRadius:'50%', background:'white', transition:'left .2s' }}/>
            </button>
          </div>

          {/* Auto-send toggle */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:10, color:'#94a3b8' }}>Auto Send</span>
            <button onClick={()=>setAutoSend(!autoSend)} style={{ width:38, height:20, borderRadius:10, border:'none', cursor:'pointer', position:'relative', background:autoSend?col:'#334155', transition:'background .2s' }}>
              <span style={{ position:'absolute', top:3, left:autoSend?20:3, width:14, height:14, borderRadius:'50%', background:'white', transition:'left .2s' }}/>
            </button>
          </div>

          {autoSend && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:9, color:'#64748b' }}>Interval</span>
              <select value={ivl} onChange={e=>setIvl(+e.target.value)} style={{ background:'#1e293b', color:col, border:`1px solid #334155`, borderRadius:4, fontSize:9, padding:'2px 4px' }}>
                <option value={3}>3s</option><option value={5}>5s</option>
                <option value={10}>10s</option><option value={30}>30s</option>
              </select>
            </div>
          )}
          {autoSend && (
            <div style={{ textAlign:'center', fontSize:9, color:col }}>Next in <b>{countdown}s</b></div>
          )}

          {/* Send button */}
          <button onClick={send} disabled={sending} style={{
            marginTop:'auto', padding:'10px 0', borderRadius:10, border:'none',
            cursor:sending?'not-allowed':'pointer',
            background:sending?'#1e293b':col, color:sending?'#475569':'#000',
            fontWeight:'bold', fontSize:11, letterSpacing:'0.12em', transition:'all .2s',
            boxShadow:sending?'none':`0 0 18px ${col}55`,
          }}>
            {sending ? '⟳ SENDING…' : '▶ SEND TO ML'}
          </button>

          {sentId && (
            <div style={{ textAlign:'center', fontSize:9, color:'#4ade80' }}>✓ Record #{sentId} saved to DB</div>
          )}
        </div>

        {/* ── RIGHT: Sensor cards grid ── */}
        <div style={{ flex:1, overflowY:'auto', padding:16 }}>
          {/* Wire legend */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginBottom:14 }}>
            {SENSORS.map(s=>(
              <div key={s.key} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:22, height:3, background:s.wireColor, borderRadius:2 }}/>
                <span style={{ fontSize:8, color:'#334155' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* 7 sensor cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12 }}>
            {SENSORS.map(s=>(
              <SensorCard
                key={s.key}
                sensor={s}
                value={vals[s.key]}
                color={col}
                driftOn={drift}
                onChange={v => set(s.key, v)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
