import { Link } from 'react-router-dom';

const MILK_IMG = 'https://img.freepik.com/premium-photo/glass-full-milk_303714-4603.jpg';

const C = {
  blue:       '#1d4ed8',
  blueDark:   '#1e3a8a',
  blueDeep:   '#0f172a',
  bluePale:   '#eff6ff',
  blueSoft:   '#dbeafe',
  blueBorder: '#bfdbfe',
  white:      '#ffffff',
};

const SENSORS = [
  { label: 'pH Level',    desc: 'Fresh milk sits between 6.4 and 6.8. A shift means bacterial activity has already begun.' },
  { label: 'Temperature', desc: 'Cold-chain integrity from farm to shelf. Heat accelerates spoilage faster than anything else.' },
  { label: 'Turbidity',   desc: 'Cloudiness reveals dilution and suspended particles that should never be in a clean batch.' },
  { label: 'Gas Odor',    desc: 'Spoilage gases appear before the smell does. Our sensor catches them first.' },
  { label: 'Fat Content', desc: 'Fat stripping is one of the most common forms of adulteration. We measure it directly.' },
  { label: 'Colour',      desc: 'Optical analysis detects discolouration caused by contaminants invisible to the naked eye.' },
];

const STEPS = [
  { n: '01', title: 'The Sensors Read',      desc: 'Seven physical sensors on an ESP32 microcontroller capture every parameter that reveals the true state of milk — chemistry, clarity, temperature and colour.' },
  { n: '02', title: 'The Model Decides',     desc: 'A trained XGBoost algorithm weighs all seven readings together and returns a confident Good or Bad verdict — the same way an expert analyst would.' },
  { n: '03', title: 'Everyone Sees It Live', desc: 'The result lands in the database instantly and is pushed to three role-based dashboards. Each person sees exactly what they need to act.' },
  { n: '04', title: 'Safe Milk Reaches You', desc: 'Contaminated batches are stopped before distribution. The data trail means accountability at every step — from farm to family.' },
];

const ROLES = [
  { role: 'Supplier', desc: 'Submit readings from the farm. Watch quality trends, receive spoilage warnings before they become losses, and prove your milk is clean.' },
  { role: 'Seller',   desc: 'Make sell-or-reject decisions backed by hard data rather than guesswork. Track every batch from arrival to sale with a full audit trail.' },
  { role: 'Admin',    desc: 'Full visibility across the entire supply chain. Manage users, review all records and enforce quality standards with system-wide analytics.' },
];

export default function Home() {
  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: C.white, color: C.blueDeep, minHeight: '100vh' }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}
        @keyframes blink{0%,100%{opacity:1;}50%{opacity:.25;}}
        @keyframes shimmer{0%{background-position:200% center;}100%{background-position:-200% center;}}
        .fu{animation:fadeUp .65s ease both;}
        .fu2{animation:fadeUp .65s .12s ease both;}
        .fu3{animation:fadeUp .65s .24s ease both;}
        .fu4{animation:fadeUp .65s .36s ease both;}
        .pulse{animation:blink 1.8s ease-in-out infinite;}
        .card-h{transition:transform .22s,box-shadow .22s;}
        .card-h:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(29,78,216,.14);}
        .btn{transition:opacity .18s,transform .16s;}
        .btn:hover{opacity:.86;transform:translateY(-2px);}
        .nav-lnk{transition:color .16s;}
        .nav-lnk:hover{color:${C.blue} !important;}
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${C.blueBorder}`,
        padding: '0 6%', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={MILK_IMG}
            alt="MilkGuard logo"
            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.blueBorder}` }}
          />
          <span style={{ fontWeight: 900, fontSize: 18, color: C.blue, letterSpacing: '-.01em' }}>MilkGuard</span>
        </div>

        <div style={{ display: 'flex', gap: 28 }}>
          {[['How It Works', '#how'], ['Sensors', '#sensors'], ['Roles', '#roles']].map(([l, h]) => (
            <a key={l} href={h} className="nav-lnk"
              style={{ fontSize: 14, color: '#64748b', fontWeight: 500, textDecoration: 'none' }}>
              {l}
            </a>
          ))}
        </div>

        <Link to="/login" className="btn" style={{
          fontSize: 13, background: C.blue, color: C.white,
          padding: '8px 24px', borderRadius: 50, textDecoration: 'none', fontWeight: 700,
          boxShadow: `0 4px 16px rgba(29,78,216,.3)`,
        }}>Sign In</Link>
      </nav>

      {/* ── HERO — full-screen milk image background ────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        padding: '80px 6%',
        overflow: 'hidden',
      }}>
        {/* Background milk image */}
        <img
          src={MILK_IMG}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            zIndex: 0,
          }}
        />
        {/* Deep blue overlay ~60% opacity */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(14,28,70,.62)',
          zIndex: 1,
        }} />
        {/* Dot grid texture */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          backgroundImage: 'radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        {/* White wave at bottom */}
        <svg style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', zIndex: 3 }}
          viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z" fill={C.white} />
        </svg>

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 4, maxWidth: 680 }}>
          {/* Live badge */}
          <div className="fu" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.22)',
            borderRadius: 50, padding: '5px 16px', marginBottom: 32,
          }}>
            <span className="pulse" style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#93c5fd', display: 'inline-block',
            }} />
            <span style={{
              fontSize: 11, color: 'rgba(255,255,255,.88)',
              letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700,
            }}>Real-time IoT quality monitoring</span>
          </div>

          <h1 className="fu2" style={{
            fontSize: 'clamp(2.2rem,5.5vw,4rem)', fontWeight: 900, color: C.white,
            lineHeight: 1.07, letterSpacing: '-.03em', marginBottom: 24,
          }}>
            Every glass of milk<br />
            <span style={{
              background: 'linear-gradient(90deg,#93c5fd,#bfdbfe,#93c5fd)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmer 4s linear infinite',
            }}>
              deserves to be safe.
            </span>
          </h1>

          <p className="fu3" style={{
            fontSize: 'clamp(.95rem,1.8vw,1.12rem)',
            color: 'rgba(255,255,255,.75)', lineHeight: 1.85,
            maxWidth: 540, marginBottom: 44,
          }}>
            MilkGuard connects physical sensors to a machine learning model
            that detects adulteration and spoilage the moment it occurs —
            so every person in the supply chain can trust what is in the bottle.
          </p>

          <div className="fu4">
            <Link to="/login" className="btn" style={{
              display: 'inline-block',
              padding: '15px 44px', borderRadius: 50,
              background: C.white, color: C.blue,
              fontWeight: 800, fontSize: 15, textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,.24)',
            }}>Sign In</Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 44, marginTop: 60, flexWrap: 'wrap' }}>
            {[['7', 'Sensors'], ['XGBoost', 'ML Model'], ['3', 'User roles'], ['5s', 'Response']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.white }}>{v}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SENSORS ────────────────────────────────────────────── */}
      <section id="sensors" style={{ padding: '96px 6%', background: C.white }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: C.blue, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 14 }}>
              What We Measure
            </p>
            <h2 style={{ fontSize: 'clamp(1.7rem,3.8vw,2.6rem)', fontWeight: 900, color: C.blueDark, lineHeight: 1.2 }}>
              Six parameters. One definitive answer.
            </h2>
            <p style={{ color: '#64748b', marginTop: 16, fontSize: 15, maxWidth: 520, margin: '16px auto 0', lineHeight: 1.85 }}>
              No single measurement tells the whole truth. MilkGuard combines every relevant signal into one trustworthy verdict.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px,1fr))', gap: 18 }}>
            {SENSORS.map((s, i) => (
              <div key={s.label} className="card-h" style={{
                background: i % 2 === 0 ? C.white : C.bluePale,
                border: `1.5px solid ${C.blueBorder}`,
                borderRadius: 18, padding: '28px 20px',
              }}>
                <div style={{ width: 32, height: 4, borderRadius: 2, background: `linear-gradient(90deg,${C.blue},#60a5fa)`, marginBottom: 18 }} />
                <div style={{ fontWeight: 800, fontSize: 14, color: C.blueDark, marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.78 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIVIDER ─────────────────────────────────────────────── */}
      <div style={{ height: 280, position: 'relative', overflow: 'hidden', background: C.blueDark }}>
        <img src={MILK_IMG} alt="" aria-hidden="true" style={{
          width: '100%', height: '100%', objectFit: 'cover',
          objectPosition: 'center 30%', opacity: .16, position: 'absolute', inset: 0,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(90deg, rgba(15,23,42,.97) 0%, rgba(30,58,138,.72) 50%, rgba(15,23,42,.97) 100%)`,
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 14, padding: '0 6%', textAlign: 'center',
        }}>
          <h3 style={{ fontSize: 'clamp(1.3rem,3vw,2rem)', fontWeight: 900, color: C.white, maxWidth: 680, lineHeight: 1.3 }}>
            Adulteration happens quietly — at every step of the supply chain.
          </h3>
          <p style={{ color: 'rgba(255,255,255,.62)', fontSize: 15, maxWidth: 540, lineHeight: 1.85 }}>
            Water, starch, detergent — added to increase volume and cut costs.
            MilkGuard finds it before a single bottle reaches a family.
          </p>
        </div>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how" style={{ padding: '96px 6%', background: C.bluePale }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: C.blue, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 14 }}>
              The Process
            </p>
            <h2 style={{ fontSize: 'clamp(1.7rem,3.8vw,2.6rem)', fontWeight: 900, color: C.blueDark }}>
              From farm sensor to confident decision
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px,1fr))', gap: 24 }}>
            {STEPS.map(s => (
              <div key={s.n} className="card-h" style={{
                background: C.white, borderRadius: 20, padding: '36px 28px',
                borderTop: `4px solid ${C.blue}`,
                boxShadow: '0 2px 20px rgba(29,78,216,.07)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#60a5fa', letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 16 }}>
                  Step {s.n}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: C.blueDark, marginBottom: 12, lineHeight: 1.3 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.85 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ───────────────────────────────────────────────── */}
      <section id="roles" style={{ padding: '96px 6%', background: C.white }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: C.blue, letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 14 }}>
              Who Uses MilkGuard
            </p>
            <h2 style={{ fontSize: 'clamp(1.7rem,3.8vw,2.6rem)', fontWeight: 900, color: C.blueDark }}>
              Built for every person in the chain
            </h2>
            <p style={{ color: '#64748b', marginTop: 16, fontSize: 15, maxWidth: 520, margin: '16px auto 0', lineHeight: 1.85 }}>
              Whether you produce, sell or oversee — MilkGuard gives you exactly the information you need.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px,1fr))', gap: 26 }}>
            {ROLES.map(r => (
              <div key={r.role} className="card-h" style={{
                background: C.bluePale, border: `1.5px solid ${C.blueSoft}`,
                borderRadius: 22, padding: '40px 32px',
              }}>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: C.blueDark, marginBottom: 14 }}>{r.role}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.85, marginBottom: 30 }}>{r.desc}</p>
                <Link to="/login" className="btn" style={{
                  display: 'inline-block', background: C.blue,
                  color: C.white, padding: '10px 26px',
                  borderRadius: 50, textDecoration: 'none',
                  fontSize: 13, fontWeight: 700,
                  boxShadow: `0 4px 16px rgba(29,78,216,.28)`,
                }}>
                  Sign In
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer style={{
        background: C.blueDeep,
        borderTop: '1px solid rgba(255,255,255,.06)',
        padding: '48px 6% 32px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 24,
            paddingBottom: 28, borderBottom: '1px solid rgba(255,255,255,.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={MILK_IMG} alt="MilkGuard" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', opacity: .8 }} />
              <span style={{ fontWeight: 900, fontSize: 18, color: C.white, letterSpacing: '-.01em' }}>MilkGuard</span>
            </div>
            <div style={{ display: 'flex', gap: 28 }}>
              {[['Sign In', '/login'], ['Sign Up', '/signup']].map(([l, h]) => (
                <Link key={l} to={h}
                  style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', textDecoration: 'none', transition: 'color .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.white)}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,.45)')}>
                  {l}
                </Link>
              ))}
            </div>
          </div>
          <div style={{ paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>IoT-Based Milk Quality and Adulteration Detection System</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)' }}>ESP32-S3 · XGBoost · Django REST · React</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
