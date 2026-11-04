import {useEffect, useState} from 'react';
import {
  allCampaigns,
  allTasks,
  approveDraft,
  campaignInboxCount,
  focusCampaign,
  fmtDay,
  fmtDayLong,
  inboxCount,
  launchedCampaigns,
  packOf,
  pickSlot,
  proofName,
  rateMeeting,
  roundDay,
  ROUND_LENGTH,
  roundStats,
  threadOf,
  type Campaign,
  type DemoState,
  type Meeting,
  type Prospect,
  type Thread,
} from '../sim/engine';
import {update, useDemo} from '../sim/store';
import {Arrow, Dot, go, PageHead, Shape, Tabs, type ShapeName} from '../ui/parts';

// ----- Home -----

export function Pipeline({state, c}: {state: DemoState; c: Campaign}) {
  const s = roundStats(state, c);
  const pct = (n: number, of: number) => (of ? `${Math.round((n * 100) / of)}%` : '0%');
  const rows: readonly (readonly [ShapeName, number, string, string])[] = [
    ['triangle', s.contacted, 'Contacted', `${pct(s.opened, s.contacted)} opened`],
    ['triangle', s.replied, 'Replied', `${pct(s.replied, s.contacted)} of contacted`],
    ['half', s.booked, 'Booked', `${pct(s.booked, s.replied)} of replies`],
    ['half', s.held, 'Held', `${s.yes} real ${packOf(c).personNoun}${s.yes === 1 ? '' : 's'}`],
  ];
  return (
    <div className="pipe" aria-label={`Round ${c.round} pipeline`}>
      {rows.map(([shape, value, name, sub]) => (
        <div key={name}>
          <b>
            <Shape name={shape} />
            {value}
          </b>
          <span>{name}</span>
          <small>{sub}</small>
        </div>
      ))}
    </div>
  );
}

function stageOf(c: Campaign): string {
  if (c.phase === 'stopped') return 'Stopped';
  if (c.phase === 'review') return `Round ${c.round}: list to review`;
  return `Round ${c.round}, day ${roundDay(c)} of ${ROUND_LENGTH}`;
}

export function CampaignTable({state}: {state: DemoState}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>Campaign</th><th>Status</th><th className="num">Contacted</th><th className="num">Replied</th><th className="num">Booked</th><th className="num">Held</th></tr>
        </thead>
        <tbody>
          {launchedCampaigns(state).map(c => {
            const pack = packOf(c);
            const s = roundStats(state, c);
            const open = () => {
              update(next => focusCampaign(next, c.goal));
              go('/campaigns/brief');
            };
            return (
              <tr className="click" key={c.goal} onClick={open}>
                <td><button type="button" className="main" onClick={open}>{pack.campaign}</button><span className="sub">{pack.goalName}</span></td>
                <td>{stageOf(c)}</td>
                <td className="num">{s.contacted}</td>
                <td className="num">{s.replied}</td>
                <td className="num">{s.booked}</td>
                <td className="num">{s.held}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Picks which campaign a page shows. Hidden when the customer has only one. */
export function CampaignSwitch() {
  const state = useDemo();
  const list = launchedCampaigns(state);
  if (list.length < 2) return null;
  return (
    <span className="tg" role="group" aria-label="Show campaign">
      {list.map(c => {
        const count = campaignInboxCount(c);
        return (
          <button key={c.goal} type="button" aria-pressed={c.goal === state.campaign?.goal} onClick={() => update(s => focusCampaign(s, c.goal))}>
            {packOf(c).campaign}{count > 0 ? ` · ${count}` : ''}
          </button>
        );
      })}
    </span>
  );
}

export function Home() {
  const state = useDemo();
  const c = state.campaign;
  if (!c) return null;
  const tasks = allTasks(state);
  const pack = packOf(c);
  const count = inboxCount(state);
  const list = launchedCampaigns(state);
  const several = list.length > 1;
  const nameOf = (goal?: Campaign['goal']) => list.find(item => item.goal === goal);
  const sub = several
    ? `${list.length} campaigns, one mailbox. ${fmtDayLong(state, Math.max(...list.map(item => item.day)))}.`
    : c.phase === 'running' ? `${pack.campaign}, round ${c.round}. Day ${roundDay(c)} of ${ROUND_LENGTH}, ${fmtDayLong(state, c.day)}.` : `${pack.campaign}, round ${c.round}.`;
  return (
    <>
      <PageHead
        title={`Good morning, ${state.user?.name.split(' ')[0] ?? 'there'}.`}
        sub={sub}
      >
        {count > 0 && (
          <a className="btn" href="#/inbox">
            Review {count} {count === 1 ? 'reply' : 'replies'} <Arrow />
          </a>
        )}
      </PageHead>
      {several ? <CampaignTable state={state} /> : <Pipeline state={state} c={c} />}
      <div className="two section">
        <section>
          <h2 className="h-block">Needs you today</h2>
          {tasks.length ? (
            <ul className="tasks">
              {tasks.map(task => (
                <li key={`${task.goal}-${task.id}`}>
                  <Shape name={task.kind === 'rate' ? 'sun' : task.kind === 'brief' ? 'half' : task.kind === 'draft' || task.kind === 'slot' ? 'triangle' : 'square'} />
                  <span>
                    <b>{task.title}</b>
                    <small>{several && task.kind !== 'budget' && task.kind !== 'pack' ? `${packOf(nameOf(task.goal) ?? c).campaign}. ` : ''}{task.detail}</small>
                  </span>
                  <a className="btn ghost sm" href={task.href} onClick={() => update(s => focusCampaign(s, task.goal))}>{task.action}</a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty" style={{borderTop: '2px solid var(--sumi)'}}>Nothing needs you. Tymes is working through the sequence.</p>
          )}
        </section>
        <section>
          <h2 className="h-block">What Tymes did</h2>
          <ul className="feed">
            {state.log.slice(0, 7).map((item, i) => (
              <li key={`${item.day}-${i}`}>
                <time>{fmtDay(state, item.day)}</time>
                <span>{several && nameOf(item.goal) ? <b>{packOf(nameOf(item.goal) ?? c).campaign}. </b> : null}{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

// ----- Inbox -----

function who(c: Campaign, id: string): Prospect | undefined {
  return c.prospects.find(p => p.id === id);
}

const LABEL_CLASS: Record<string, string> = {
  Interested: 'pill y',
  'Booking link': 'pill y',
  Referral: 'pill i',
  'Not now': 'pill o',
  'Not interested': 'pill q',
  Unsubscribe: 'pill',
  'Out of office': 'pill q',
};

function DraftBox({state, p, thread}: {state: DemoState; p: Prospect; thread: Thread}) {
  const [text, setText] = useState(thread.draft ?? '');
  return (
    <div className="draft">
      <div className="ch">
        Tymes drafted this answer
        <span className="small" style={{fontWeight: 500}}>Sends from {state.user?.email}</span>
      </div>
      <textarea value={text} aria-label="Draft reply" onChange={e => setText(e.target.value)} />
      <div className="foot">
        <button
          type="button"
          className="btn sm"
          onClick={() =>
            update(s => {
              s.lastEvents = [`Sent to ${p.name} from your mailbox, after passing the policy gate.`];
              approveDraft(s, p.id, text);
            })
          }
        >
          Approve and send
        </button>
        <span className="gate">Policy gate: approved by you · not on do-not-contact · under limits</span>
      </div>
    </div>
  );
}

function ThreadView({state, c, thread}: {state: DemoState; c: Campaign; thread: Thread}) {
  const p = who(c, thread.prospectId);
  if (!p) return null;
  return (
    <div className="pane">
      <div style={{display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start'}}>
        <div>
          <h2>{p.name}</h2>
          <p className="muted small">{p.role}, {p.company} · {p.city}</p>
        </div>
        <span className={LABEL_CLASS[thread.label]}>{thread.label}</span>
      </div>
      <p className="small" style={{marginTop: 8}}><b>Why this label:</b> <span className="muted">{thread.labelWhy}</span></p>
      {thread.label === 'Unsubscribe' && (
        <div className="note plain small" style={{marginTop: 10}}>
          {p.name} and every identifier ({p.email}, {p.linkedin}) are on your do-not-contact list, on all channels. The sequence stopped. <a href="#/settings/dnc">See the list</a>
        </div>
      )}
      <div className="msgs">
        {thread.msgs.map((m, i) => (
          <div className={m.from === 'them' ? 'msg them' : 'msg'} key={i}>
            <div className="who">
              <b>{m.from === 'them' ? p.name : state.user?.name}</b>
              <span>{m.channel}</span>
              <span>{fmtDay(state, m.day)}, {m.time}{m.from === 'you' ? ' their time' : ''}</span>
              {m.step && <span>{m.step}</span>}
            </div>
            <p>{m.body}</p>
          </div>
        ))}
      </div>
      {thread.slots && (
        <div className="draft">
          <div className="ch">{p.name.split(' ')[0]} shared a booking link: pick a time</div>
          <div style={{padding: 14}}>
            <div className="slots">
              {thread.slots.map(day => (
                <button key={day} type="button" className="btn sm" onClick={() => update(s => pickSlot(s, p.id, day))}>
                  {fmtDay(state, day)}, 14:00
                </button>
              ))}
            </div>
            <p className="gate" style={{marginTop: 10}}>These are free on your calendar and on their link. To have Tymes book these on its own, change the booking setting. <a href="#/settings/approval">Settings</a></p>
          </div>
        </div>
      )}
      {thread.draft && <DraftBox key={thread.draft} state={state} p={p} thread={thread} />}
    </div>
  );
}

export function InboxView({route, round}: {route?: string; round?: number}) {
  const state = useDemo();
  const c = state.campaign;
  const threads = (c?.threads ?? []).filter(t => round === undefined || t.round === round);
  const waiting = threads.filter(t => t.draft || t.slots).sort((a, b) => b.lastDay - a.lastDay);
  const others = threads.filter(t => !t.draft && !t.slots).sort((a, b) => b.lastDay - a.lastDay);
  const [tab, setTab] = useState<'need' | 'all'>(route && others.some(t => t.prospectId === route) && !waiting.some(t => t.prospectId === route) ? 'all' : 'need');
  const [selected, setSelected] = useState<string | undefined>(route);
  const list = tab === 'need' ? waiting : others;
  const current = list.find(t => t.prospectId === selected) ?? list[0];
  // A new thread starts at the top, and a shorter page never leaves you scrolled past its end.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [current?.prospectId]);
  if (!c) return null;
  return (
    <>
      <Tabs tabs={[['need', 'Needs approval', waiting.length], ['all', 'Conversations', others.length]] as const} value={tab} onChange={setTab} />
      {list.length === 0 ? (
        <p className="empty">
          {tab === 'need'
            ? threads.length ? 'All caught up. Everything else is in Conversations.' : 'No replies yet. They will land here.'
            : 'Replies you have dealt with land here, labeled by Tymes.'}
        </p>
      ) : (
        <div className="split">
          <div className="split-list">
            {list.map(t => {
              const p = who(c, t.prospectId);
              if (!p) return null;
              const last = t.msgs[t.msgs.length - 1];
              return (
                <button type="button" key={t.prospectId} className="split-item" aria-current={current?.prospectId === t.prospectId ? 'true' : undefined} onClick={() => setSelected(t.prospectId)}>
                  <span className="top">
                    <b>{p.name}</b>
                    <small>{fmtDay(state, t.lastDay).replace(/ [A-Z][a-z]+$/, '')}</small>
                  </span>
                  <small>{p.company}</small>
                  <span className="tagline" style={{display: 'block'}}><span className={LABEL_CLASS[t.label]}>{t.label}</span></span>
                  <span className="vh">{last.body}</span>
                </button>
              );
            })}
          </div>
          {current && <ThreadView state={state} c={c} thread={current} />}
        </div>
      )}
    </>
  );
}

export function Inbox({route}: {route?: string}) {
  const goal = useDemo().campaign?.goal;
  return (
    <>
      <PageHead title="Inbox" sub="Every reply in one place, labeled by Tymes. Nothing goes back until it passes your approval level."><CampaignSwitch /></PageHead>
      <InboxView key={`${goal}-${route}`} route={route} />
    </>
  );
}

// ----- Meetings -----

function Calendar({state, c, onPick}: {state: DemoState; c: Campaign; onPick: (id: string) => void}) {
  const elsewhere = allCampaigns(state).filter(other => other !== c);
  const first = Math.floor((c.roundStart - 1) / 5) * 5 + 1;
  const days = Array.from({length: 15}, (_, i) => first + i);
  return (
    <div className="cal" aria-label="Calendar of meetings">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
        <span className="d" key={d}>{d}</span>
      ))}
      {days.map(day => {
        const here = c.meetings.filter(m => m.day === day).sort((a, b) => a.time.localeCompare(b.time));
        return (
          <div key={day} className={`c${day === c.day ? ' today' : ''}${day < c.day ? ' past' : ''}`}>
            <span className="num">{fmtDay(state, day).replace(/^\w+ /, '')}</span>
            {here.map(m => {
              const p = who(c, m.prospectId);
              return (
                <button type="button" key={m.id} className={m.status === 'upcoming' ? undefined : m.status} onClick={() => onPick(m.id)} title={p?.name}>
                  {m.time} {p?.name.split(' ')[0]}
                </button>
              );
            })}
            {elsewhere.flatMap(other =>
              other.meetings.filter(m => m.day === day).map(m => (
                <button
                  type="button"
                  key={m.id}
                  className="other"
                  title={`${packOf(other).campaign}: ${other.prospects.find(p => p.id === m.prospectId)?.name}`}
                  onClick={() => {
                    update(s => focusCampaign(s, other.goal));
                    go(`/meetings/${m.id}`);
                  }}
                >
                  {m.time} {other.prospects.find(p => p.id === m.prospectId)?.name.split(' ')[0]}
                </button>
              )),
            )}
          </div>
        );
      })}
    </div>
  );
}

function BriefCard({state, c, m}: {state: DemoState; c: Campaign; m: Meeting}) {
  const [joined, setJoined] = useState(false);
  const pack = packOf(c);
  const p = who(c, m.prospectId);
  const thread = p && threadOf(c, p.id);
  if (!p) return null;
  const lastThem = thread?.msgs.filter(item => item.from === 'them')[0];
  return (
    <article className="brief">
      <div className="m">
        <p className="when">{fmtDayLong(state, m.day)} · {m.time} · 30 min · {m.platform}</p>
        <h3>{p.name}</h3>
        <p className="role">{p.role} · {p.company}</p>
        <dl>
          <dt>Why them</dt><dd>{p.why}</dd>
          <dt>How they replied</dt><dd>{lastThem ? `“${lastThem.body.replace(/\s+/g, ' ').slice(0, 120)}”` : 'Booked from the first email.'}</dd>
          <dt>What to learn</dt><dd>{c.learn}</dd>
        </dl>
        {m.status === 'upcoming' && (
          <div className="acts">
            <button type="button" className="btn sm" onClick={() => setJoined(true)}>Join on {m.platform}</button>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() =>
                update(s => {
                  const item = s.campaign?.meetings.find(x => x.id === m.id);
                  if (item && s.campaign) {
                    item.day += 1;
                    s.lastEvents = [`Moved ${p.name} to ${fmtDay(s, item.day)}. Tymes told them, and updated the calendar.`];
                  }
                })
              }
            >
              Reschedule
            </button>
          </div>
        )}
        {joined && <p className="small muted" style={{marginTop: 8}}>Joining the call.</p>}
        {m.status === 'missed' && (
          <div className="note plain small" style={{marginTop: 16}}>
            {p.name.split(' ')[0]} did not join, so there is no charge. {thread?.draft ? <>Tymes drafted a new time. <a href={`#/inbox/${p.id}`}>Review it</a></> : 'Tymes offered a new time.'}
          </div>
        )}
        {m.status === 'held' && m.verdict && (
          <>
            <div className="verdict">
              <Shape name={m.verdict.yes ? 'sun' : 'ring'} />
              <div>
                <b>{m.verdict.yes ? pack.yesLabel : 'Not a fit'}</b>
                <span>{m.verdict.reason}</span>
              </div>
            </div>
            {m.rating ? (
              <p className="small" style={{marginTop: 12}}>
                <b>You rated this {m.rating === 'good' ? 'a good fit' : 'not a fit'}.</b> <span className="muted">{m.ratingEffect}</span>
              </p>
            ) : (
              <div className="rate">
                <span className="b small">Your rating:</span>
                <button type="button" onClick={() => update(s => rateMeeting(s, m.id, 'good'))}><Dot yes /> Good fit</button>
                <button type="button" onClick={() => update(s => rateMeeting(s, m.id, 'bad'))}><Dot yes={false} /> Not a fit</button>
              </div>
            )}
            <p className="small muted" style={{marginTop: 12}}>{proofName(m.proof ?? 'trust')}.</p>
          </>
        )}
      </div>
      <div className="g">
        {m.status === 'held' && m.transcript ? (
          <>
            <h4 className="b" style={{marginBottom: 6}}>Transcript</h4>
            <ul className="transcript">
              {m.transcript.map(([speaker, line], i) => (
                <li key={i}><b>{speaker.split(' ')[0]}</b><span>{line}</span></li>
              ))}
            </ul>
            <p className="small muted" style={{marginTop: 10}}>Imported from your note-taker.</p>
          </>
        ) : (
          <>
            <h4 className="b" style={{marginBottom: 6}}>{pack.guideName}</h4>
            <ol className="q-list">
              {c.guide.map(q => <li key={q}>{q}</li>)}
            </ol>
          </>
        )}
      </div>
    </article>
  );
}

const MEETING_TABS = [['upcoming', 'Upcoming'], ['held', 'Held'], ['missed', 'Missed']] as const;

export function MeetingsView({route, round}: {route?: string; round?: number}) {
  const state = useDemo();
  const c = state.campaign;
  const all = (c?.meetings ?? []).filter(m => round === undefined || m.round === round);
  const routed = all.find(m => m.id === route);
  const [tab, setTab] = useState<Meeting['status']>(routed?.status ?? 'upcoming');
  const [selected, setSelected] = useState<string | undefined>(route);
  if (!c) return null;
  const list = all.filter(m => m.status === tab).sort((a, b) => (tab === 'upcoming' ? a.day - b.day : b.day - a.day));
  const current = list.find(m => m.id === selected) ?? list[0];
  return (
    <>
      <Calendar
        state={state}
        c={c}
        onPick={id => {
          const m = all.find(item => item.id === id);
          if (m) setTab(m.status);
          setSelected(id);
        }}
      />
      <div className="section">
        <Tabs
          tabs={MEETING_TABS.map(([key, name]) => [key, name, all.filter(m => m.status === key).length] as const)}
          value={tab}
          onChange={setTab}
        />
        {list.length === 0 ? (
          <p className="empty">
            {tab === 'upcoming' ? 'Nothing booked right now. Confirmed meetings land here, and on your calendar.' : tab === 'held' ? 'Held meetings land here, with a verdict and a transcript.' : 'No missed meetings. If someone misses a call, Tymes finds a new time and you are not charged.'}
          </p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Person</th><th>When</th><th>Status</th><th className="end">{tab === 'held' ? 'Your rating' : 'Charge'}</th></tr>
                </thead>
                <tbody>
                  {list.map(m => {
                    const p = who(c, m.prospectId);
                    return (
                      <tr key={m.id} className={current?.id === m.id ? 'click on' : 'click'} onClick={() => setSelected(m.id)}>
                        <td>
                          <button type="button" className="main" onClick={() => setSelected(m.id)}>{p?.name}</button>
                          <span className="sub">{p?.role}, {p?.company}</span>
                        </td>
                        <td>{fmtDay(state, m.day)}, {m.time}</td>
                        <td>
                          <span className="status">
                            {m.status === 'held' && m.verdict ? <><Dot yes={m.verdict.yes} /> {m.verdict.yes ? 'Real fit' : 'Not a fit'}</> : m.status === 'upcoming' ? 'Brief ready' : 'Did not join'}
                          </span>
                        </td>
                        <td className="end">
                          {tab === 'held'
                            ? m.rating ? (m.rating === 'good' ? 'Good fit' : 'Not a fit') : <span className="pill y">Rate it</span>
                            : tab === 'missed' ? 'No charge' : 'When held'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {current && <BriefCard key={current.id} state={state} c={c} m={current} />}
          </>
        )}
      </div>
    </>
  );
}

export function Meetings({route}: {route?: string}) {
  const goal = useDemo().campaign?.goal;
  return (
    <>
      <PageHead title="Meetings" sub="Each one comes with a brief. Held meetings get a verdict. Missed ones get a new time, at no charge."><CampaignSwitch /></PageHead>
      <MeetingsView key={`${goal}-${route}`} route={route} />
    </>
  );
}

// ----- Insights -----

export function InsightsView({round}: {round?: number}) {
  const state = useDemo();
  const c = state.campaign;
  if (!c) return null;
  const pack = packOf(c);
  const held = c.meetings
    .filter(m => m.status === 'held' && (round === undefined || m.round === round))
    .sort((a, b) => Number(b.verdict?.yes) - Number(a.verdict?.yes) || a.day - b.day);
  const yes = held.filter(m => m.verdict?.yes).length;
  if (!held.length) {
    return <p className="empty" style={{borderTop: '2px solid var(--sumi)'}}>Verdicts appear here after the first held meeting.</p>;
  }
  return (
    <div className="band-ins dark">
      {held.map(m => {
        const p = who(c, m.prospectId);
        if (!m.verdict || !p) return null;
        return (
          <div className="vrow" key={m.id}>
            <h3>{p.name}<small>{p.role} · {p.company}</small></h3>
            <span className="mark">
              <svg viewBox="0 0 48 48" aria-hidden="true">
                {m.verdict.yes ? <circle cx="24" cy="24" r="22" fill="#E63B2E" /> : <circle cx="24" cy="24" r="20.5" fill="none" stroke="#CDD5EF" strokeWidth="3" />}
              </svg>
              {m.verdict.yes ? pack.yesLabel : 'Not a fit'}
            </span>
            <p><b>Why:</b> {m.verdict.reason}<br /><i>“{m.verdict.quote}”</i></p>
          </div>
        );
      })}
      {held.length >= 2 && (
        <div className="pat">
          <div className="dots" role="img" aria-label={`${yes} of ${held.length} filled`}>
            {held.map((m, i) => <i key={i} className={m.verdict?.yes ? undefined : 'n'} />)}
          </div>
          <p>
            {pack.pattern.line.replace('{yes}', String(yes)).replace('{held}', String(held.length))}
            <span className="nx">{yes < held.length ? pack.pattern.next : 'Every held meeting so far was a real fit.'}</span>
          </p>
        </div>
      )}
    </div>
  );
}

export function Insights() {
  const state = useDemo();
  const c = state.campaign;
  const [open, setOpen] = useState<string | null>(null);
  const held = c?.meetings.filter(m => m.status === 'held') ?? [];
  return (
    <>
      <PageHead
        title={<>Insights <span className="pill q" style={{verticalAlign: 'middle', marginLeft: 8, letterSpacing: 0}}>On the roadmap</span></>}
        sub="Is each person a real potential customer, and why. Patterns across all meetings, and every transcript."
      >
        <CampaignSwitch />
      </PageHead>
      <InsightsView />
      {c && held.length > 0 && (
        <section className="section">
          <h2 className="h-block">Transcripts</h2>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {held.map(m => {
                  const p = who(c, m.prospectId);
                  const isOpen = open === m.id;
                  return (
                    <tr key={m.id}>
                      <td>
                        <button type="button" className="main" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : m.id)}>{p?.name}, {p?.company}</button>
                        <span className="sub">{fmtDay(state, m.day)} · {proofName(m.proof ?? 'trust')}</span>
                        {isOpen && (
                          <ul className="transcript" style={{marginTop: 8, maxWidth: '70ch'}}>
                            {m.transcript?.map(([speaker, line], i) => (
                              <li key={i}><b>{speaker.split(' ')[0]}</b><span>{line}</span></li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

