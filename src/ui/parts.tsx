import {useEffect, useState, type CSSProperties, type ReactNode} from 'react';

export function Mark({size = 28, tone = 'ink'}: {size?: number; tone?: 'ink' | 'paper'}) {
  const c = tone === 'ink' ? '#1A1A1A' : '#F3EEE4';
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M32 58V34M32 34L14 13M32 34L45.1 17.3" fill="none" stroke={c} strokeWidth="7.5" strokeLinejoin="miter" />
      <circle cx="14" cy="11" r="7" fill="#E63B2E" />
      <circle cx="50" cy="11" r="5.5" fill="none" stroke={c} strokeWidth="3.2" />
    </svg>
  );
}

export function Logo({tone = 'ink', size = 26}: {tone?: 'ink' | 'paper'; size?: number}) {
  return (
    <span className="logo">
      <Mark size={size} tone={tone} />
      tymes
    </span>
  );
}

export type ShapeName = 'square' | 'triangle' | 'half' | 'sun' | 'ring' | 'box' | 'halfbox' | 'openbox';

export function Shape({name, className, outline}: {name: ShapeName; className?: string; outline?: boolean}) {
  const paint = (fill: string) => (outline ? {fill: 'none', stroke: fill, strokeWidth: 2.5} : {fill});
  return (
    <svg className={className} viewBox="0 0 28 28" aria-hidden="true">
      {name === 'square' && <rect x="3" y="3" width="22" height="22" {...paint('#1F3A93')} />}
      {name === 'triangle' && <path d="M4 3L26 14L4 25Z" {...paint('#E8B730')} />}
      {name === 'half' && <path d="M2 21A12 12 0 0 1 26 21Z" {...paint('#7FA88A')} />}
      {name === 'sun' && <circle cx="14" cy="14" r="11" {...paint('#E63B2E')} />}
      {name === 'ring' && <circle cx="14" cy="14" r="10" fill="none" stroke="currentColor" strokeWidth="3" />}
      {name === 'box' && <rect x="3" y="3" width="22" height="22" fill="#1A1A1A" />}
      {name === 'openbox' && <rect x="4" y="4" width="20" height="20" fill="none" stroke="#1A1A1A" strokeWidth="2.5" />}
      {name === 'halfbox' && (
        <>
          <rect x="4" y="4" width="20" height="20" fill="none" stroke="#1A1A1A" strokeWidth="2.5" />
          <rect x="4" y="4" width="10" height="20" fill="#1A1A1A" />
        </>
      )}
    </svg>
  );
}

export function Arrow() {
  return (
    <svg className="arrow" width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
      <path d="M0 7H16M10 1L16 7L10 13" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="square" />
    </svg>
  );
}

export function Dot({yes}: {yes: boolean}) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" width="12" height="12" style={{flex: 'none'}}>
      {yes ? <circle cx="6" cy="6" r="6" fill="#E63B2E" /> : <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="2" />}
    </svg>
  );
}

/** The site's assembled figure. Shapes settle once, the red sun last. */
export function Figure({label}: {label: string}) {
  const from = (x: number, y: number, r: number, s: number) =>
    ({'--fx': `${x}px`, '--fy': `${y}px`, '--fr': `${r}deg`, '--fs': s}) as CSSProperties;
  return (
    <div className="figure" style={{background: 'var(--paper2)', overflow: 'hidden'}}>
      <svg viewBox="0 0 480 480" role="img" aria-label={label}>
        <rect x="40" y="412" width="400" height="8" fill="#1A1A1A" />
        <g className="s" style={from(-70, 40, -14, 0.42)}>
          <rect x="80" y="160" width="240" height="240" fill="#1F3A93" />
          <rect x="236" y="216" width="42" height="9" fill="#F3EEE4" />
        </g>
        <g className="s s2" style={from(20, 120, 38, 0.7)}>
          <path d="M320 220L430 280L320 340Z" fill="#E8B730" />
        </g>
        <g className="s s3" style={from(-90, -10, -28, 0.5)}>
          <path d="M80 160A120 120 0 0 1 320 160Z" fill="#7FA88A" />
        </g>
        <g className="s s4" style={from(0, -300, 0, 1)}>
          <circle cx="400" cy="96" r="48" fill="#E63B2E" />
        </g>
      </svg>
    </div>
  );
}

export function Band() {
  return (
    <div className="band" aria-hidden="true">
      <i style={{background: 'var(--ind)'}} />
      <i style={{background: 'var(--mus)'}} />
      <i style={{background: 'var(--sage)'}} />
      <i style={{background: 'var(--sumi)'}} />
    </div>
  );
}

/** Lines tick on one at a time, then `onDone` fires. */
export function Working({lines, onDone, speed = 620}: {lines: readonly string[]; onDone: () => void; speed?: number}) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= lines.length) {
      const done = window.setTimeout(onDone, 260);
      return () => window.clearTimeout(done);
    }
    const next = window.setTimeout(() => setStep(step + 1), speed);
    return () => window.clearTimeout(next);
    // onDone is stable for the life of one run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, lines.length, speed]);
  return (
    <ul className="work" aria-live="polite">
      {lines.map((line, i) => (
        <li key={line} className={i < step ? 'on' : i === step ? 'go' : undefined}>
          <i />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

export function Field({label, hint, children}: {label: string; hint?: string; children: ReactNode}) {
  return (
    <div className="field">
      <label>
        <span className="lab" style={{fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 6}}>{label}</span>
        {children}
      </label>
      {hint && <small className="muted small">{hint}</small>}
    </div>
  );
}

export function PageHead({title, sub, children}: {title: ReactNode; sub?: ReactNode; children?: ReactNode}) {
  return (
    <div className="head">
      <div>
        <h1 className="h-page">{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="acts">{children}</div>}
    </div>
  );
}

export function Tabs<T extends string>({tabs, value, onChange}: {tabs: readonly (readonly [T, string, number?])[]; value: T; onChange: (value: T) => void}) {
  return (
    <div className="ctabs" role="tablist">
      {tabs.map(([key, name, n]) => (
        <button key={key} type="button" role="tab" aria-selected={value === key} aria-current={value === key ? 'true' : undefined} onClick={() => onChange(key)}>
          {name}
          {n !== undefined && <span className="n">{n}</span>}
        </button>
      ))}
    </div>
  );
}

export function go(href: string): void {
  window.location.hash = href.replace(/^#/, '');
}
