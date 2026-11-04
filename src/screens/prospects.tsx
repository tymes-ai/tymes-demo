import {useState} from 'react';
import {isBlocked, kept, openConflicts, packOf, refineList, rerankList, resolveConflict, threadOf, type Campaign, type Prospect} from '../sim/engine';
import {update, useDemo} from '../sim/store';

function Refine({c}: {c: Campaign}) {
  const pack = packOf(c);
  const [ask, setAsk] = useState('');
  const [used, setUsed] = useState<string[]>([]);
  return (
    <div className="stack" style={{gap: 10}}>
      <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center'}}>
        <span className="b small">Refine:</span>
        {pack.refines.map(item => (
          <button
            key={item.key}
            type="button"
            className="btn ghost sm"
            disabled={used.includes(item.key)}
            style={used.includes(item.key) ? {background: 'var(--paper2)', color: 'var(--grey)', boxShadow: 'none'} : undefined}
            onClick={() => {
              setUsed([...used, item.key]);
              update(s => {
                refineList(s, item.drops, item.done);
              });
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <form
        className="inline-form"
        style={{maxWidth: 620}}
        onSubmit={e => {
          e.preventDefault();
          const text = ask.trim();
          if (!text) return;
          update(s => {
            rerankList(s, text);
          });
          setAsk('');
        }}
      >
        <input className="input" value={ask} onChange={e => setAsk(e.target.value)} placeholder="Or say what to change, e.g., fewer people in retail" aria-label="Tell Tymes how to change the list" />
        <button type="submit" className="btn">Change the list</button>
      </form>
      {c.refined.map(text => (
        <div className="note plain small" key={text}>{text}</div>
      ))}
    </div>
  );
}

/** The conflict row is R12: identifiers that disagree are flagged, never merged. */
function Conflict({p}: {p: Prospect}) {
  return (
    <div className="note" role="group" aria-label={`Check ${p.name}`}>
      <b>Check who {p.name} is.</b> {p.conflict} Tymes never merges these on its own.
      <div style={{display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap'}}>
        <button type="button" className="btn sm" onClick={() => update(s => resolveConflict(s, p.id, true))}>Keep, and use the LinkedIn company</button>
        <button type="button" className="btn ghost sm" onClick={() => update(s => resolveConflict(s, p.id, false))}>Remove</button>
      </div>
    </div>
  );
}

function statusOf(c: Campaign, p: Prospect, blocked: boolean): React.ReactNode {
  if (blocked) return <span className="pill o">Do not contact</span>;
  const t = threadOf(c, p.id);
  if (t) return <span className="pill q">{t.label}</span>;
  return <span className="small muted">In sequence</span>;
}

export function ListReview({c, running}: {c: Campaign; running?: boolean}) {
  const state = useDemo();
  const [limit, setLimit] = useState(14);
  const [open, setOpen] = useState<string | null>(null);
  const list = c.prospects.filter(p => p.round === c.round);
  const conflicts = openConflicts(c);
  const toggle = (id: string, value: boolean) =>
    update(s => {
      const p = s.campaign?.prospects.find(item => item.id === id);
      if (p) p.kept = value;
    });
  return (
    <div className="stack">
      {!running && <Refine c={c} />}
      {conflicts.map(p => <Conflict key={p.id} p={p} />)}
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th className="hide-m">Where</th>
              <th>Fit</th>
              <th className="end">{running ? 'Status' : 'Keep or remove'}</th>
            </tr>
          </thead>
          <tbody>
            {list.slice(0, limit).map(p => (
              <RowGroup
                key={p.id}
                p={p}
                c={c}
                running={running}
                isOpen={open === p.id}
                onOpen={() => setOpen(open === p.id ? null : p.id)}
                onToggle={value => toggle(p.id, value)}
                blocked={isBlocked(state, p)}
              />
            ))}
          </tbody>
        </table>
      </div>
      {limit < list.length && (
        <div>
          <button type="button" className="btn ghost sm" onClick={() => setLimit(list.length)}>
            Show all {list.length}
          </button>
        </div>
      )}
      {!running && kept(c).length < 50 && (
        <p className="small muted">{50 - kept(c).length} removed. Tymes can fill these from the next best matches at the next round.</p>
      )}
    </div>
  );
}

function RowGroup({p, c, running, isOpen, onOpen, onToggle, blocked}: {p: Prospect; c: Campaign; running?: boolean; isOpen: boolean; onOpen: () => void; onToggle: (value: boolean) => void; blocked: boolean}) {
  const delta = p.prevFit !== undefined ? p.fit - p.prevFit : 0;
  return (
    <>
      <tr className={p.kept ? (isOpen ? 'on' : undefined) : 'off'}>
        <td>
          <button type="button" className="main" onClick={onOpen} aria-expanded={isOpen}>{p.name}</button>
          <span className="sub">{p.role}</span>
        </td>
        <td>
          <span>{p.company}</span>
          <span className="sub">{p.detail}</span>
        </td>
        <td className="hide-m"><span className="small">{p.city}</span></td>
        <td>
          <span className="fit">
            {p.fit}
            {delta !== 0 && <small>{delta > 0 ? `up ${delta}` : `down ${-delta}`}</small>}
          </span>
        </td>
        <td className="end">
          {running ? (
            p.kept ? statusOf(c, p, blocked) : <span className="small muted">Removed</span>
          ) : (
            <span className="tg">
              <button type="button" aria-pressed={p.kept} onClick={() => onToggle(true)}>Keep</button>
              <button type="button" aria-pressed={!p.kept} onClick={() => onToggle(false)}>Remove</button>
            </span>
          )}
        </td>
      </tr>
      {isOpen && (
        <tr className="on">
          <td colSpan={5}>
            <p className="small"><b>Why this person:</b> {p.why}</p>
            <p className="small"><b>What Tymes found:</b> {p.source}.</p>
            <p className="small muted">{p.email} · {p.linkedin}</p>
          </td>
        </tr>
      )}
    </>
  );
}
