import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const BLUE      = '#1d4ed8';
const BLUE_DARK = '#1e3a8a';
const BLUE_PALE = '#eff6ff';
const BLUE_SOFT = '#dbeafe';
const BLUE_BDR  = '#bfdbfe';
const RED       = '#dc2626';
const WHITE     = '#ffffff';

// ── Sensor config ──────────────────────────────────────────────
type SKey = 'ph' | 'temperature' | 'fat' | 'turbidity' | 'colour' | 'odor' | 'taste';
type Vals = Record<SKey, number>;

const SENSORS: {
  key: SKey; label: string; fullLabel: string; unit: string;
  min: number; max: number; step: number;
  normalMin: number; normalMax: number;
  noise: number; dec: number;
  hw: string; proto: string;
}[] = [
  { key:'ph',          label:'pH',         fullLabel:'pH Level',      unit:'',    min:0,    max:14,   step:0.01, normalMin:6.4, normalMax:6.8, noise:0.04, dec:2, hw:'DFRobot SEN0161-V2', proto:'Analog → GPIO1'  },
  { key:'temperature', label:'Temp',        fullLabel:'Temperature',   unit:'°C',  min:0,    max:60,   step:0.1,  normalMin:2,   normalMax:25,  noise:0.2,  dec:1, hw:'DS18B20 Waterproof',  proto:'1-Wire → GPIO4'  },
  { key:'fat',         label:'Fat',         fullLabel:'Fat Content',   unit:'%',   min:0,    max:10,   step:0.01, normalMin:3.0, normalMax:5.0, noise:0.05, dec:2, hw:'IR Fat Sensor',       proto:'Analog → GPIO5'  },
  { key:'turbidity',   label:'Turbidity',   fullLabel:'Turbidity',     unit:'NTU', min:0,    max:100,  step:0.1,  normalMin:0,   normalMax:50,  noise:0.5,  dec:1, hw:'DFRobot SEN0189',     proto:'Analog → GPIO2'  },
  { key:'colour',      label:'Colour',      fullLabel:'Colour',        unit:'',    min:0,    max:255,  step:1,    normalMin:230, normalMax:255, noise:2,    dec:0, hw:'TCS34725 (I2C)',      proto:'I2C → GPIO8/9'   },
  { key:'odor',        label:'Gas/Odor',    fullLabel:'Gas / Odor',    unit:'ppm', min:0,    max:1000, step:1,    normalMin:0,   normalMax:300, noise:5,    dec:0, hw:'MQ-135 Gas Sensor',   proto:'Analog → GPIO3'  },
  { key:'taste',       label:'Taste',       fullLabel:'Taste Proxy',   unit:'',    min:0,    max:1,    step:1,    normalMin:1,   normalMax:1,   noise:0,    dec:0, hw:'Manual Switch',       proto:'Digital → GPIO6' },
];

const DEFAULTS: Vals = { ph:6.6, temperature:5.0, fat:3.5, turbidity:20.0, colour:250, odor:50, taste:1 };

function clamp(v:number,mn:number,mx:number){ return Math.min(mx,Math.max(mn,v)); }
function inRange(key:SKey, v:number){ const s=SENSORS.find(x=>x.key===key)!; return v>=s.normalMin&&v<=s.normalMax; }
function applyNoise(vals:Vals):Vals{
  const n={...vals};
  SENSORS.forEach(s=>{ if(s.noise>0){ const d=(Math.random()-0.5)*2*s.noise; n[s.key]=parseFloat(clamp(vals[s.key]+d,s.min,s.max).toFixed(s.dec)); }});
  return n;
}

// ── SVG Hardware components — white/light backgrounds ──────────

function ESP32SVG({ ok }: { ok: boolean }) {
  const accent = ok ? BLUE : RED;
  return (
    <svg viewBox="0 0 200 340" style={{width:'100%',height:'100%'}}>
      {/* PCB — light green (real PCB colour) */}
      <rect x="8" y="8" width="184" height="324" rx="7" fill="#e8f5e9" stroke="#a5d6a7" strokeWidth="1.5"/>
      {[40,80,120,160,200,240,280].map(y=><line key={y} x1="8" y1={y} x2="192" y2={y} stroke="#c8e6c9" strokeWidth="0.5"/>)}
      {[40,80,120,160].map(x=><line key={x} x1={x} y1="8" x2={x} y2="332" stroke="#c8e6c9" strokeWidth="0.4"/>)}
      {/* USB-C */}
      <rect x="68" y="2" width="64" height="14" rx="4" fill="#90a4ae" stroke="#607d8b" strokeWidth="1"/>
      <rect x="76" y="5" width="48" height="8" rx="3" fill="#607d8b"/>
      <text x="100" y="12" textAnchor="middle" fill="#eceff1" fontSize="5" fontFamily="monospace">USB-C</text>
      {/* Antenna */}
      <rect x="136" y="10" width="52" height="26" rx="3" fill="none" stroke={accent} strokeWidth="1.2" strokeDasharray="3,2" opacity="0.7"/>
      <text x="162" y="22" textAnchor="middle" fill={accent} fontSize="5" fontFamily="monospace">Wi-Fi</text>
      <text x="162" y="30" textAnchor="middle" fill={accent} fontSize="5" fontFamily="monospace">BLE 5.0</text>
      {/* Main chip — dark on light PCB */}
      <rect x="58" y="48" width="84" height="64" rx="4" fill="#212121" stroke="#424242" strokeWidth="1.5"/>
      <rect x="65" y="55" width="70" height="50" rx="2" fill="#1a1a1a"/>
      <text x="100" y="76" textAnchor="middle" fill="#e0e0e0" fontSize="8" fontFamily="monospace" fontWeight="bold">ESP32-S3</text>
      <text x="100" y="87" textAnchor="middle" fill="#757575" fontSize="5.5" fontFamily="monospace">WROOM-1-N16R8</text>
      <text x="100" y="98" textAnchor="middle" fill="#616161" fontSize="5" fontFamily="monospace">Espressif Systems</text>
      {/* SoC pins */}
      {[66,76,86,96,106,116,126,136].map((x,i)=><rect key={i} x={x} y="43" width="4" height="6" rx="0.5" fill="#ffd54f"/>)}
      {[66,76,86,96,106,116,126,136].map((x,i)=><rect key={i} x={x} y="111" width="4" height="6" rx="0.5" fill="#ffd54f"/>)}
      {/* Left GPIO */}
      {['3V3','GND','IO1','IO2','IO3','IO4','IO5','IO6','IO7','IO8','IO9','5V','GND'].map((l,i)=>(
        <g key={i}>
          <rect x="8" y={133+i*13} width="11" height="8" rx="1" fill="#78909c"/>
          <rect x="12" y={134+i*13} width="3" height="6" rx="0.5" fill="#ffd54f"/>
          <text x="24" y={140+i*13} fill="#388e3c" fontSize="4.5" fontFamily="monospace">{l}</text>
        </g>
      ))}
      {/* Right GPIO */}
      {['IO43','IO44','IO41','IO40','IO39','IO38','IO37','IO36','IO35','IO34','IO33','IO47','IO48'].map((l,i)=>(
        <g key={i}>
          <rect x="181" y={133+i*13} width="11" height="8" rx="1" fill="#78909c"/>
          <rect x="185" y={134+i*13} width="3" height="6" rx="0.5" fill="#ffd54f"/>
          <text x="178" y={140+i*13} fill="#388e3c" fontSize="4.5" fontFamily="monospace" textAnchor="end">{l}</text>
        </g>
      ))}
      {/* EN + BOOT */}
      <rect x="22" y="26" width="26" height="12" rx="3" fill="#e53935" stroke="#c62828" strokeWidth="1"/>
      <text x="35" y="35" fill="white" textAnchor="middle" fontSize="5" fontFamily="monospace">EN</text>
      <rect x="54" y="26" width="30" height="12" rx="3" fill="#1565c0" stroke="#0d47a1" strokeWidth="1"/>
      <text x="69" y="35" fill="white" textAnchor="middle" fontSize="5" fontFamily="monospace">BOOT</text>
      {/* Status LEDs */}
      <circle cx="24" cy="122" r="5" fill={accent} style={{filter:`drop-shadow(0 0 5px ${accent})`}}/>
      <circle cx="38" cy="122" r="5" fill="#e53935" opacity="0.7"/>
      <text x="52" y="126" fill="#388e3c" fontSize="4.5" fontFamily="monospace">PWR  ERR</text>
      <text x="100" y="326" textAnchor="middle" fill="#388e3c" fontSize="6" fontFamily="monospace">ESP32-S3 DevKitC-1</text>
    </svg>
  );
}

function PhSVG({ value }: { value: number }) {
  const ok = inRange('ph', value);
  const accent = ok ? BLUE : RED;
  return (
    <svg viewBox="0 0 90 140" style={{width:'100%',height:'100%'}}>
      {/* PCB — blue */}
      <rect x="4" y="24" width="82" height="112" rx="5" fill="#e3f2fd" stroke="#90caf9" strokeWidth="1.5"/>
      {/* BNC connector */}
      <rect x="24" y="2" width="42" height="24" rx="4" fill="#78909c" stroke="#546e7a" strokeWidth="1"/>
      <circle cx="45" cy="14" r="8" fill="#90a4ae" stroke="#b0bec5" strokeWidth="1"/>
      <circle cx="45" cy="14" r="4" fill="#ffd54f"/>
      <text x="45" y="33" textAnchor="middle" fill="#546e7a" fontSize="6" fontFamily="monospace">BNC</text>
      {/* Op-amp chip */}
      <rect x="22" y="46" width="46" height="22" rx="2" fill="#212121" stroke="#424242" strokeWidth="1"/>
      <text x="45" y="57" textAnchor="middle" fill="#e0e0e0" fontSize="5.5" fontFamily="monospace">BL4050B</text>
      <text x="45" y="66" textAnchor="middle" fill="#757575" fontSize="4.5" fontFamily="monospace">Op-Amp</text>
      {/* LED */}
      <circle cx="18" cy="84" r="4.5" fill={accent} style={{filter:`drop-shadow(0 0 5px ${accent})`}}/>
      <text x="28" y="88" fill="#546e7a" fontSize="5.5" fontFamily="monospace">PWR</text>
      {/* 3-pin header */}
      {['G','V','S'].map((l,i)=>(
        <g key={i}>
          <rect x={16+i*20} y="100" width="14" height="18" rx="2" fill="#78909c" stroke="#546e7a" strokeWidth="1"/>
          <rect x={20+i*20} y="103" width="5" height="12" rx="1" fill="#ffd54f"/>
          <text x={23+i*20} y="124" textAnchor="middle" fill="#37474f" fontSize="5" fontFamily="monospace">{l}</text>
        </g>
      ))}
      <text x="80" y="92" textAnchor="end" fill={accent} fontSize="11" fontFamily="monospace" fontWeight="bold">{value.toFixed(2)}</text>
      <text x="45" y="133" textAnchor="middle" fill="#1565c0" fontSize="5.5" fontFamily="monospace">SEN0161-V2</text>
    </svg>
  );
}

function TempSVG({ value }: { value: number }) {
  const ok = inRange('temperature', value);
  const accent = ok ? BLUE : RED;
  const tip = value > 25 ? '#e53935' : value > 15 ? '#fb8c00' : '#1e88e5';
  const colH = Math.round(10 + (value/60)*72);
  return (
    <svg viewBox="0 0 80 155" style={{width:'100%',height:'100%'}}>
      {/* Glass tube */}
      <rect x="33" y="8" width="14" height="88" rx="7" fill="#b0bec5" stroke="#90a4ae" strokeWidth="1.5"/>
      <rect x="36" y="11" width="8" height="82" rx="4" fill="#eceff1"/>
      {/* Mercury */}
      <rect x="37" y={93-colH} width="6" height={colH} rx="2" fill={tip} style={{transition:'height .4s, y .4s'}}/>
      {/* Bulb */}
      <ellipse cx="40" cy="100" rx="10" ry="12" fill={tip} stroke={tip} strokeWidth="1" style={{filter:`drop-shadow(0 0 6px ${tip})`}}/>
      {/* Cables */}
      <line x1="33" y1="8" x2="8" y2="8" stroke="#212121" strokeWidth="3" strokeLinecap="round"/>
      <line x1="36" y1="8" x2="8" y2="8" stroke="#e53935" strokeWidth="2" strokeLinecap="round"/>
      <line x1="40" y1="8" x2="8" y2="8" stroke="#fdd835" strokeWidth="2" strokeLinecap="round"/>
      <line x1="44" y1="8" x2="8" y2="8" stroke="#424242" strokeWidth="2" strokeLinecap="round"/>
      <text x="40" y="122" textAnchor="middle" fill={accent} fontSize="12" fontFamily="monospace" fontWeight="bold">{value.toFixed(1)}</text>
      <text x="40" y="133" textAnchor="middle" fill="#78909c" fontSize="8" fontFamily="monospace">°C</text>
      <circle cx="40" cy="144" r="5" fill={accent} style={{filter:`drop-shadow(0 0 5px ${accent})`}}/>
      <text x="40" y="153" textAnchor="middle" fill="#546e7a" fontSize="4.5" fontFamily="monospace">DS18B20</text>
    </svg>
  );
}

function TurbSVG({ value }: { value: number }) {
  const ok = inRange('turbidity', value);
  const accent = ok ? BLUE : RED;
  const water = value > 60 ? '#795548' : value > 30 ? '#f9a825' : '#1e88e5';
  const opacity = 0.35 + (value/100)*0.6;
  return (
    <svg viewBox="0 0 96 125" style={{width:'100%',height:'100%'}}>
      <rect x="4" y="4" width="88" height="72" rx="5" fill="#e3f2fd" stroke="#90caf9" strokeWidth="1.5"/>
      <rect x="33" y="12" width="30" height="44" rx="3" fill={water} stroke="#90a4ae" strokeWidth="1" opacity={opacity} style={{transition:'fill .4s, opacity .4s'}}/>
      <circle cx="22" cy="34" r="7" fill="#e53935" stroke="#c62828" strokeWidth="1"/>
      <text x="22" y="48" textAnchor="middle" fill="#37474f" fontSize="5" fontFamily="monospace">IR</text>
      <circle cx="74" cy="34" r="7" fill="#1565c0" stroke="#0d47a1" strokeWidth="1"/>
      <text x="74" y="48" textAnchor="middle" fill="#37474f" fontSize="5" fontFamily="monospace">PT</text>
      <circle cx="18" cy="65" r="4" fill={accent} style={{filter:`drop-shadow(0 0 5px ${accent})`}}/>
      {['G','V','S'].map((l,i)=>(
        <g key={i}>
          <rect x={18+i*22} y="80" width="14" height="18" rx="2" fill="#78909c" stroke="#546e7a" strokeWidth="1"/>
          <rect x={22+i*22} y="83" width="5" height="12" rx="1" fill="#ffd54f"/>
          <text x={25+i*22} y="103" textAnchor="middle" fill="#37474f" fontSize="5" fontFamily="monospace">{l}</text>
        </g>
      ))}
      <text x="48" y="112" textAnchor="middle" fill={accent} fontSize="10" fontFamily="monospace" fontWeight="bold">{value.toFixed(1)}</text>
      <text x="48" y="122" textAnchor="middle" fill="#1565c0" fontSize="5.5" fontFamily="monospace">NTU · SEN0189</text>
    </svg>
  );
}

function MQSVG({ value }: { value: number }) {
  const ok = inRange('odor', value);
  const accent = ok ? BLUE : RED;
  const glowR  = Math.round(3 + (value/1000)*16);
  const coreOp = 0.4 + (value/1000)*0.6;
  const coreC  = ok ? '#e53935' : '#b71c1c';
  return (
    <svg viewBox="0 0 96 118" style={{width:'100%',height:'100%'}}>
      <rect x="4" y="36" width="88" height="78" rx="5" fill="#fff8e1" stroke="#ffe082" strokeWidth="1.5"/>
      {/* Metal dome */}
      <ellipse cx="48" cy="28" rx="30" ry="30" fill="#90a4ae" stroke="#78909c" strokeWidth="2"/>
      <ellipse cx="48" cy="28" rx="24" ry="24" fill="#cfd8dc"/>
      {[[36,16],[48,12],[60,16],[64,28],[60,40],[48,44],[36,40],[32,28]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="2.5" fill="#78909c"/>
      ))}
      {/* Heating coil */}
      <circle cx="48" cy="28" r="9" fill={coreC} opacity={coreOp} style={{filter:`drop-shadow(0 0 ${glowR}px ${coreC})`, transition:'opacity .4s, filter .4s'}}/>
      <circle cx="48" cy="28" r="5" fill="none" stroke="#fb8c00" strokeWidth="1.5" strokeDasharray="2,1"/>
      <text x="48" y="31" textAnchor="middle" fill="white" fontSize="6" fontFamily="monospace" fontWeight="bold">{value}</text>
      <circle cx="20" cy="64" r="4" fill="#fb8c00" opacity="0.8"/>
      <circle cx="33" cy="64" r="4" fill={accent} style={{filter:`drop-shadow(0 0 5px ${accent})`}}/>
      {['VCC','GND','DO','AO'].map((l,i)=>(
        <g key={i}>
          <rect x={12+i*18} y="94" width="13" height="14" rx="2" fill="#78909c" stroke="#546e7a" strokeWidth="1"/>
          <rect x={16+i*18} y="97" width="5" height="8" rx="1" fill="#ffd54f"/>
          <text x={19+i*18} y="114" textAnchor="middle" fill="#37474f" fontSize="4.5" fontFamily="monospace">{l}</text>
        </g>
      ))}
      <text x="48" y="80" textAnchor="middle" fill="#e65100" fontSize="5.5" fontFamily="monospace">MQ-135</text>
    </svg>
  );
}

function TCSSVG({ value }: { value: number }) {
  const ok = inRange('colour', value);
  const accent = ok ? BLUE : RED;
  const bri  = Math.round((value/255)*100);
  const disp = `hsl(45,${bri}%,${40+bri*0.22}%)`;
  return (
    <svg viewBox="0 0 96 120" style={{width:'100%',height:'100%'}}>
      <rect x="4" y="26" width="88" height="90" rx="5" fill="#f3e5f5" stroke="#ce93d8" strokeWidth="1.5"/>
      <rect x="28" y="34" width="40" height="34" rx="3" fill="#212121" stroke="#424242" strokeWidth="1.5"/>
      <rect x="34" y="40" width="28" height="22" rx="2" fill={disp} stroke="#424242" strokeWidth="1" style={{filter:`drop-shadow(0 0 8px ${disp})`, transition:'fill .3s'}}/>
      <circle cx="40" cy="51" r="4" fill="#e53935" opacity="0.9"/>
      <circle cx="48" cy="51" r="4" fill="#43a047" opacity="0.9"/>
      <circle cx="56" cy="51" r="4" fill="#1e88e5" opacity="0.9"/>
      <circle cx="48" cy="41" r="3" fill="white" style={{filter:'drop-shadow(0 0 4px white)'}}/>
      <text x="48" y="76" textAnchor="middle" fill="#616161" fontSize="5" fontFamily="monospace">TCS34725</text>
      <circle cx="18" cy="84" r="4" fill={accent} style={{filter:`drop-shadow(0 0 5px ${accent})`}}/>
      {['VIN','GND','SDA','SCL'].map((l,i)=>(
        <g key={i}>
          <rect x={12+i*18} y="96" width="13" height="14" rx="2" fill="#78909c" stroke="#546e7a" strokeWidth="1"/>
          <rect x={16+i*18} y="99" width="5" height="8" rx="1" fill="#ffd54f"/>
          <text x={19+i*18} y="116" textAnchor="middle" fill="#37474f" fontSize="4.5" fontFamily="monospace">{l}</text>
        </g>
      ))}
      <text x="80" y="88" textAnchor="end" fill={accent} fontSize="10" fontFamily="monospace" fontWeight="bold">{value}</text>
    </svg>
  );
}

function FatSVG({ value }: { value: number }) {
  const ok = inRange('fat', value);
  const accent = ok ? BLUE : RED;
  return (
    <svg viewBox="0 0 96 110" style={{width:'100%',height:'100%'}}>
      <rect x="4" y="4" width="88" height="98" rx="5" fill="#e8f5e9" stroke="#a5d6a7" strokeWidth="1.5"/>
      <circle cx="30" cy="36" r="13" fill="#212121" stroke="#424242" strokeWidth="1.5"/>
      <circle cx="30" cy="36" r="8" fill="#e53935" style={{filter:'drop-shadow(0 0 4px #e53935)'}}/>
      <text x="30" y="57" textAnchor="middle" fill="#388e3c" fontSize="5" fontFamily="monospace">IR TX</text>
      <circle cx="66" cy="36" r="13" fill="#212121" stroke="#424242" strokeWidth="1.5"/>
      <circle cx="66" cy="36" r="8" fill="#1565c0"/>
      <text x="66" y="57" textAnchor="middle" fill="#388e3c" fontSize="5" fontFamily="monospace">IR RX</text>
      <circle cx="18" cy="70" r="4" fill={accent} style={{filter:`drop-shadow(0 0 5px ${accent})`}}/>
      {['G','V','A'].map((l,i)=>(
        <g key={i}>
          <rect x={20+i*22} y="78" width="14" height="14" rx="2" fill="#78909c" stroke="#546e7a" strokeWidth="1"/>
          <rect x={24+i*22} y="81" width="5" height="8" rx="1" fill="#ffd54f"/>
          <text x={27+i*22} y="98" textAnchor="middle" fill="#37474f" fontSize="5" fontFamily="monospace">{l}</text>
        </g>
      ))}
      <text x="80" y="74" textAnchor="end" fill={accent} fontSize="10" fontFamily="monospace" fontWeight="bold">{value.toFixed(2)}</text>
      <text x="48" y="107" textAnchor="middle" fill="#388e3c" fontSize="5.5" fontFamily="monospace">IR Fat Sensor</text>
    </svg>
  );
}

// ── Sensor card ─────────────────────────────────────────────────
function SensorCard({ sensor, value, driftOn, onChange }: {
  sensor: typeof SENSORS[number]; value: number; driftOn: boolean; onChange: (v:number)=>void;
}) {
  const ok  = inRange(sensor.key, value);
  const pct = ((value - sensor.min) / (sensor.max - sensor.min)) * 100;
  const binary = sensor.max === 1;

  return (
    <div style={{
      background: WHITE,
      border: `2px solid ${ok ? BLUE_BDR : '#fecaca'}`,
      borderRadius: 16, padding: '14px 12px',
      display: 'flex', flexDirection: 'column', gap: 8,
      boxShadow: ok
        ? '0 2px 12px rgba(29,78,216,.08)'
        : '0 2px 12px rgba(220,38,38,.1)',
    }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:800, color: ok ? BLUE_DARK : RED, letterSpacing:'.06em', textTransform:'uppercase' }}>
            {sensor.fullLabel}
          </div>
          <div style={{ fontSize:9, color:'#64748b', marginTop:1 }}>{sensor.hw}</div>
          <div style={{ fontSize:9, color:'#94a3b8' }}>{sensor.proto}</div>
        </div>
        {/* Status dot */}
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: ok ? BLUE : RED,
          boxShadow: `0 0 6px ${ok ? BLUE+'88' : RED+'88'}`,
          flexShrink: 0,
        }}/>
      </div>

      {/* SVG hardware visual */}
      <div style={{ height: 130, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {sensor.key === 'ph'          && <PhSVG   value={value}/>}
        {sensor.key === 'temperature' && <TempSVG value={value}/>}
        {sensor.key === 'turbidity'   && <TurbSVG value={value}/>}
        {sensor.key === 'odor'        && <MQSVG   value={value}/>}
        {sensor.key === 'colour'      && <TCSSVG  value={value}/>}
        {sensor.key === 'fat'         && <FatSVG  value={value}/>}
        {sensor.key === 'taste' && (
          <div onClick={() => onChange(value===1?0:1)}
            style={{ cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:10, width:'100%' }}>
            <div style={{
              width:72, height:36, borderRadius:18,
              background: value===1 ? BLUE : RED,
              border: `2px solid ${value===1 ? BLUE_BDR : '#fecaca'}`,
              position:'relative', transition:'background .2s',
              boxShadow: `0 2px 8px ${value===1 ? BLUE+'44' : RED+'44'}`,
            }}>
              <div style={{
                position:'absolute', top:4,
                left: value===1 ? 40 : 4,
                width:24, height:24, borderRadius:'50%',
                background:WHITE, boxShadow:'0 2px 4px rgba(0,0,0,.2)',
                transition:'left .15s',
              }}/>
            </div>
            <div style={{
              fontSize:11, fontWeight:700, padding:'3px 14px', borderRadius:8,
              background: value===1 ? BLUE_PALE : '#fff1f2',
              color: value===1 ? BLUE : RED, border:`1px solid ${value===1 ? BLUE_BDR : '#fecaca'}`,
            }}>
              {value===1 ? 'NORMAL' : 'ABNORMAL'}
            </div>
            <div style={{ fontSize:9, color:'#94a3b8' }}>Click to toggle</div>
          </div>
        )}
      </div>

      {/* Big value */}
      {!binary && (
        <div style={{ textAlign:'center' }}>
          <span style={{ fontSize:24, fontWeight:900, fontFamily:'monospace', color: ok ? BLUE : RED, transition:'color .3s' }}>
            {sensor.dec > 0 ? value.toFixed(sensor.dec) : value}
          </span>
          {sensor.unit && <span style={{ fontSize:12, color:'#64748b', marginLeft:4 }}>{sensor.unit}</span>}
        </div>
      )}

      {/* Gauge bar */}
      {!binary && (
        <>
          <div style={{ background: ok ? BLUE_SOFT : '#fee2e2', borderRadius:6, height:7, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:6, width:`${pct}%`, background: ok ? BLUE : RED, transition:'width .35s' }}/>
          </div>
          <div style={{ fontSize:9, color:'#94a3b8', textAlign:'center' }}>
            Normal: {sensor.normalMin}–{sensor.normalMax}{sensor.unit && ' '+sensor.unit}
          </div>
        </>
      )}

      {/* Slider */}
      {!binary && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <button 
            onClick={() => onChange(Math.max(sensor.min, value - sensor.step))}
            disabled={driftOn && sensor.noise > 0}
            style={{ 
              width: 26, height: 26, flexShrink: 0, borderRadius: '50%', border: `1.5px solid ${ok ? BLUE_BDR : '#fca5a5'}`, 
              background: WHITE, color: ok ? BLUE : RED, display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: (driftOn && sensor.noise > 0) ? 'not-allowed' : 'pointer', fontSize: 18, lineHeight: 1, padding: 0, fontWeight: 'bold',
              opacity: (driftOn && sensor.noise > 0) ? 0.4 : 1 
            }}
          >
            −
          </button>
          <input
            type="range" min={sensor.min} max={sensor.max} step={sensor.step} value={value}
            disabled={driftOn && sensor.noise > 0}
            onChange={e => onChange(parseFloat(e.target.value))}
            style={{ flex: 1, minWidth: 0, accentColor: ok ? BLUE : RED, opacity: driftOn && sensor.noise>0 ? 0.4 : 1 }}
          />
          <button 
            onClick={() => onChange(Math.min(sensor.max, value + sensor.step))}
            disabled={driftOn && sensor.noise > 0}
            style={{ 
              width: 26, height: 26, flexShrink: 0, borderRadius: '50%', border: `1.5px solid ${ok ? BLUE_BDR : '#fca5a5'}`, 
              background: WHITE, color: ok ? BLUE : RED, display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: (driftOn && sensor.noise > 0) ? 'not-allowed' : 'pointer', fontSize: 18, lineHeight: 1, padding: 0, fontWeight: 'bold',
              opacity: (driftOn && sensor.noise > 0) ? 0.4 : 1
            }}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function SimulationPage() {
  const [vals, setVals]       = useState<Vals>(DEFAULTS);
  const [drift, setDrift]     = useState(false);
  const [autoSend, setAutoSend] = useState(false);
  const [ivl, setIvl]         = useState(5);
  const [countdown, setCountdown] = useState(5);
  const [sending, setSending] = useState(false);
  const [connected, setConn]  = useState<boolean|null>(null);
  const [sentId, setSentId]   = useState<number|null>(null);

  const vRef = useRef(vals);
  vRef.current = vals;

  const allOk = SENSORS.every(s => inRange(s.key, vals[s.key]));

  useEffect(() => {
    const ping = async () => {
      try { await api.get(`/api/analyze/latest/`, {timeout:3000}); setConn(true); }
      catch(e:any){ setConn(!!e?.response); }
    };
    ping();
    const t = setInterval(ping, 8000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!drift) return;
    const t = setInterval(() => setVals(p => applyNoise(p)), 1000);
    return () => clearInterval(t);
  }, [drift]);

  const send = useCallback(async () => {
    setSending(true);
    try {
      const odorBinary = vRef.current.odor <= 300 ? 1 : 0;
      const res = await api.post(`/api/analyze/`, {
        ...vRef.current, odor: odorBinary,
        supplier_id:'SIM-001', supplier_name:'Simulation Terminal',
        location_name:'Virtual Lab', latitude:0, longitude:0,
      }, { timeout:8000 });
      setSentId(res.data.id);
    } catch (e: any) {
      console.error(e);
    }
    finally { setSending(false); }
  }, []);

  useEffect(() => {
    if (!autoSend) return;
    setCountdown(ivl);
    const t = setInterval(() => setCountdown(p => { if(p<=1){ send(); return ivl; } return p-1; }), 1000);
    return () => clearInterval(t);
  }, [autoSend, ivl, send]);

  const set = (k:SKey, v:number) => setVals(p => ({...p, [k]:v}));

  return (
    <div style={{ minHeight:'100vh', background:'#f8faff', fontFamily:"'Segoe UI',system-ui,sans-serif", color:BLUE_DARK }}>
      <style>{`
        *{box-sizing:border-box;}
        input[type=range]{-webkit-appearance:none;appearance:none;height:6px;border-radius:4px;outline:none;cursor:pointer;}
        input[type=range]:disabled{cursor:not-allowed;}
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background: WHITE, borderBottom:`2px solid ${BLUE_BDR}`,
        padding:'12px 5%', display:'flex', alignItems:'center',
        justifyContent:'space-between', flexWrap:'wrap', gap:10,
        boxShadow:'0 2px 12px rgba(29,78,216,.08)',
        position:'sticky', top:0, zIndex:100,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:`linear-gradient(135deg,${BLUE_DARK},${BLUE})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:900, color:BLUE_DARK, letterSpacing:'.04em' }}>
              IoT Simulation Terminal
            </div>
            <div style={{ fontSize:10, color:'#64748b', letterSpacing:'.08em' }}>
              ESP32-S3 · 7 Sensors · Milk Quality Detection
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          {/* Connection status */}
          <div style={{
            display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600,
            padding:'5px 12px', borderRadius:20,
            background: connected ? BLUE_PALE : '#fff1f2',
            border: `1.5px solid ${connected ? BLUE_BDR : '#fecaca'}`,
            color: connected ? BLUE : RED,
          }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background: connected===null?'#fbbf24':connected?BLUE:RED }}/>
            {connected===null ? 'Checking…' : connected ? 'Backend Online' : 'Backend Offline'}
          </div>

          {/* Overall sensor status */}
          <div style={{
            display:'flex', alignItems:'center', gap:6, fontSize:11, fontWeight:700,
            padding:'5px 12px', borderRadius:20,
            background: allOk ? BLUE_PALE : '#fff1f2',
            border: `1.5px solid ${allOk ? BLUE_BDR : '#fecaca'}`,
            color: allOk ? BLUE : RED,
          }}>
            {allOk ? '✓ All Sensors Normal' : '⚠ Abnormal Readings'}
          </div>

          <Link to="/login" style={{
            fontSize:12, fontWeight:700, color:BLUE,
            border:`1.5px solid ${BLUE_BDR}`, padding:'5px 14px',
            borderRadius:20, textDecoration:'none', background:BLUE_PALE,
          }}>
            Dashboard →
          </Link>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display:'flex', minHeight:'calc(100vh - 68px)' }}>

        {/* ── LEFT: Controls + ESP32 ── */}
        <div style={{
          width:240, borderRight:`1.5px solid ${BLUE_BDR}`,
          background:WHITE, padding:16,
          display:'flex', flexDirection:'column', gap:14,
          overflowY:'auto',
          boxShadow:'2px 0 12px rgba(29,78,216,.06)',
        }}>
          {/* ESP32 board */}
          <div>
            <div style={{ fontSize:10, fontWeight:800, color:BLUE, letterSpacing:'.14em', textTransform:'uppercase', marginBottom:8 }}>
              ESP32-S3 DevKitC-1
            </div>
            <div style={{ height:180, background:BLUE_PALE, borderRadius:12, border:`1.5px solid ${BLUE_BDR}`, padding:8, overflow:'hidden' }}>
              <ESP32SVG ok={allOk}/>
            </div>
          </div>

          {/* Controls */}
          <div style={{ background:BLUE_PALE, borderRadius:12, border:`1.5px solid ${BLUE_BDR}`, padding:12, display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:BLUE, letterSpacing:'.14em', textTransform:'uppercase' }}>Controls</div>

            {/* Sensor Drift */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:12, color:BLUE_DARK, fontWeight:500 }}>Sensor Drift</span>
              <button onClick={() => setDrift(!drift)} style={{
                width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', position:'relative',
                background: drift ? BLUE : '#cbd5e1', transition:'background .2s',
              }}>
                <span style={{ position:'absolute', top:3, left:drift?22:3, width:18, height:18, borderRadius:'50%', background:WHITE, transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.2)' }}/>
              </button>
            </div>

            {/* Auto Send */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:12, color:BLUE_DARK, fontWeight:500 }}>Auto Send</span>
              <button onClick={() => setAutoSend(!autoSend)} style={{
                width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', position:'relative',
                background: autoSend ? BLUE : '#cbd5e1', transition:'background .2s',
              }}>
                <span style={{ position:'absolute', top:3, left:autoSend?22:3, width:18, height:18, borderRadius:'50%', background:WHITE, transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,.2)' }}/>
              </button>
            </div>

            {autoSend && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:11, color:'#64748b' }}>Interval</span>
                <select value={ivl} onChange={e=>setIvl(+e.target.value)} style={{
                  background:WHITE, color:BLUE_DARK, border:`1.5px solid ${BLUE_BDR}`,
                  borderRadius:8, fontSize:11, padding:'3px 8px', fontWeight:600,
                }}>
                  <option value={3}>3s</option><option value={5}>5s</option>
                  <option value={10}>10s</option><option value={30}>30s</option>
                </select>
              </div>
            )}
            {autoSend && (
              <div style={{ textAlign:'center', fontSize:11, color:BLUE, fontWeight:700 }}>
                Next in <span style={{ color:BLUE_DARK }}>{countdown}s</span>
              </div>
            )}
          </div>

          {/* Presets */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <button onClick={() => setVals({ ph:5.9, temperature:32, fat:1.2, turbidity:80, colour:180, odor:800, taste:0 })} style={{
              padding:'9px 0', borderRadius:10, border:`1.5px solid #fecaca`,
              background:'#fff1f2', color:RED, fontWeight:700, fontSize:12, cursor:'pointer',
            }}>
              Load Bad Milk Preset
            </button>
            <button onClick={() => { setVals(DEFAULTS); setSentId(null); }} style={{
              padding:'9px 0', borderRadius:10, border:`1.5px solid ${BLUE_BDR}`,
              background:BLUE_PALE, color:BLUE_DARK, fontWeight:600, fontSize:12, cursor:'pointer',
            }}>
              Reset to Normal
            </button>
          </div>

          {/* Send button */}
          <button onClick={send} disabled={sending} style={{
            marginTop:'auto', padding:'12px 0', borderRadius:12, border:'none',
            cursor: sending ? 'not-allowed' : 'pointer',
            background: sending ? '#e2e8f0' : BLUE,
            color: sending ? '#94a3b8' : WHITE,
            fontWeight:800, fontSize:13, letterSpacing:'.06em',
            boxShadow: sending ? 'none' : `0 4px 16px rgba(29,78,216,.35)`,
            transition:'all .2s',
          }}>
            {sending ? 'Sending…' : 'Send to ML Model'}
          </button>

          {sentId && (
            <div style={{ textAlign:'center', fontSize:11, color:BLUE, fontWeight:600 }}>
              Record #{sentId} saved
            </div>
          )}
        </div>

        {/* ── RIGHT: Sensor grid ── */}
        <div style={{ flex:1, overflowY:'auto', padding:20, background:'#f8faff' }}>
          {/* Wire legend */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:16, marginBottom:20, padding:'10px 14px', background:WHITE, borderRadius:12, border:`1.5px solid ${BLUE_BDR}` }}>
            <span style={{ fontSize:10, fontWeight:800, color:BLUE_DARK, letterSpacing:'.1em', textTransform:'uppercase', marginRight:4 }}>Pin Map:</span>
            {SENSORS.map(s=>(
              <div key={s.key} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:20, height:3, background:BLUE, borderRadius:2, opacity:.6 }}/>
                <span style={{ fontSize:10, color:'#64748b' }}>{s.label} · {s.proto}</span>
              </div>
            ))}
          </div>

          {/* Sensor cards grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px,1fr))', gap:16 }}>
            {SENSORS.map(s=>(
              <SensorCard
                key={s.key}
                sensor={s}
                value={vals[s.key]}
                driftOn={drift}
                onChange={v => set(s.key, v)}
              />
            ))}
          </div>

          {/* JSON payload */}
          <div style={{ marginTop:20, background:WHITE, borderRadius:12, border:`1.5px solid ${BLUE_BDR}`, padding:'14px 16px' }}>
            <div style={{ fontSize:10, fontWeight:800, color:BLUE, letterSpacing:'.14em', textTransform:'uppercase', marginBottom:8 }}>
              Outgoing JSON Payload
            </div>
            <pre style={{ fontSize:11, color:BLUE_DARK, lineHeight:1.7, overflow:'auto', margin:0, fontFamily:'monospace' }}>
{JSON.stringify({...vals, odor: vals.odor<=300?1:0, supplier_id:'SIM-001'}, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
