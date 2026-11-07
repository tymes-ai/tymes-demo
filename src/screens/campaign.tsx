import {useEffect} from 'react';
import {
  allCampaigns,
  beginNewCampaign,
  chooseRound,
  fmtDay,
  isBlocked,
  kept,
  launch,
  openConflicts,
  packOf,
  roundDay,
  ROUND_LENGTH,
  roundStats,
  sendRows,
  type Campaign,
  type DemoState,
  type Goal,
  PACKS,
} from '../sim/engine';
import {update, useDemo} from '../sim/store';
import {Arrow, go, PageHead} from '../ui/parts';
import {ListReview} from './prospects';
import {CampaignSwitch, CampaignTable, InboxView, MeetingsView, Pipeline} from './work';

const TABS = ['Brief', 'Prospects', 'Sequence', 'Replies', 'Meetings', 'Act'] as const;
type Tab = (typeof TABS)[number];

export function Campaigns() {
  const state = useDemo();
  const left = (Object.keys(PACKS) as Goal[]).filter(goal => !allCampaigns(state).some(c => c.goal === goal));
  return (
    <>
      <PageHead title="Campaigns" sub="One outreach effort with one goal. After each round: continue, or stop.">
        <button
          type="button"
          className="btn"
          disabled={!left.length}
          onClick={() => {
            update(beginNewCampaign);
            go('/campaign');
          }}
        >
          New campaign
        </button>
      </PageHead>
      <CampaignTable state={state} />
    </>
  );
}

export function CampaignDetail({tabKey}: {tabKey: string}) {
  const state = useDemo();
  const c = state.campaign;
  if (!c) return null;
  const pack = packOf(c);
  const tab = TABS.find(name => name.toLowerCase() === tabKey) ?? 'Brief';
  const waiting = c.threads.filter(t => (t.draft || t.slots) && t.round === c.round).length;
  return (
    <>
      <div className="ctop">
        <h1 className="h-page">{pack.campaign} · Round {c.round}</h1>
        <div className="acts">
          <CampaignSwitch />
          <span className="pill o">{pack.goalName}</span>
        </div>
      </div>
      <nav className="ctabs" aria-label="Campaign tabs">
        {TABS.map(name => (
          <a key={name} href={`#/campaigns/${name.toLowerCase()}`} aria-current={tab === name ? 'true' : undefined}>
            {name}
            {name === 'Replies' && waiting > 0 && <span className="n">{waiting}</span>}
          </a>
        ))}
      </nav>
      <Body key={c.goal} tab={tab} state={state} c={c} />
    </>
  );
}

function Body({tab, state, c}: {tab: Tab; state: DemoState; c: Campaign}) {
  if (tab === 'Brief') return <Brief state={state} c={c} />;
  if (tab === 'Prospects') return <Prospects c={c} />;
  if (tab === 'Sequence') return <Sequence state={state} c={c} />;
  if (tab === 'Replies') return <InboxView round={c.round} />;
  if (tab === 'Meetings') return <MeetingsView round={c.round} />;
  return <Act state={state} c={c} />;
}

function Brief({state, c}: {state: DemoState; c: Campaign}) {
  const pack = packOf(c);
  return (
    <div className="stack" style={{gap: 28}}>
      <Pipeline state={state} c={c} />
      <div className="split57" style={{marginTop: 0}}>
        <div className="card">
          <div className="ch c1">Campaign ISP</div>
          <div className="cb">
            <dl>
              <dt>Who to meet</dt><dd>{c.who}</dd>
              <dt>What to learn</dt><dd>{c.learn}</dd>
              {c.isp.map(([key, value]) => (
                <div key={key} style={{display: 'contents'}}><dt>{key}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </div>
        </div>
        <div className="card">
          <div className="ch c5">{pack.guideName}</div>
          <div className="cb">
            <ol className="q-list">{c.guide.map(q => <li key={q}>{q}</li>)}</ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function Prospects({c}: {c: Campaign}) {
  return <ListReview c={c} running={c.phase !== 'review'} />;
}

function Sequence({state, c}: {state: DemoState; c: Campaign}) {
  const rows = sendRows(state, c);
  const done = rows.filter(r => r.day <= c.day);
  const steps = [
    {step: 1, name: 'First email', when: 'Day 1', note: 'Opens with something true about the person.'},
    {step: 2, name: 'LinkedIn note', when: 'Day 4, if no reply', note: 'A shorter note on a second channel.'},
    {step: 3, name: 'Last email', when: 'Day 8, if no reply', note: 'Asks who else to talk to.'},
  ];
  const log = done.slice().sort((a, b) => b.day - a.day || a.prospect.order - b.prospect.order).slice(0, 12);
  return (
    <div className="stack" style={{gap: 28}}>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Step</th><th>When</th><th className="num">Sent</th><th className="num">Opened</th><th className="num">Stopped by reply</th></tr>
          </thead>
          <tbody>
            {steps.map(item => {
              const here = done.filter(r => r.step === item.step);
              const sent = here.filter(r => !r.stopped && !r.blocked);
              const opened = sent.filter(r => r.opened && r.day < c.day).length;
              return (
                <tr key={item.step}>
                  <td><span className="main">{item.step}. {item.name}</span><span className="sub">{item.note}</span></td>
                  <td>{item.when}</td>
                  <td className="num">{sent.length}</td>
                  <td className="num">{sent.length ? `${Math.round((opened * 100) / sent.length)}%` : '-'}</td>
                  <td className="num">{here.filter(r => r.stopped).length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <section>
        <h2 className="h-block" style={{marginBottom: 10}}>Recent sends, and the policy gate</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Sent</th><th>To</th><th>Step</th><th className="end">Policy gate</th></tr>
            </thead>
            <tbody>
              {log.map(r => (
                <tr key={`${r.prospect.id}-${r.step}`}>
                  <td>{fmtDay(state, r.day)}, {r.time}<span className="sub">{r.prospect.tz}</span></td>
                  <td><span className="main">{r.prospect.name}</span><span className="sub">{r.prospect.company}</span></td>
                  <td>{r.channel}</td>
                  <td className="end">
                    {r.stopped ? <span className="small muted">Not sent: they replied</span> : isBlocked(state, r.prospect) ? <span className="b small">Blocked: do not contact</span> : <span className="small">Approved · not on DNC · under limits</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{marginTop: 10}}>If the policy gate cannot answer, nothing is sent. Limit: 20 first emails a day per mailbox.</p>
      </section>
    </div>
  );
}

function Act({state, c}: {state: DemoState; c: Campaign}) {
  const stats = roundStats(state, c);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [c.phase, c.round]);

  if (c.phase === 'stopped') {
    return (
      <div className="poster-band dark" style={{padding: 32}}>
        <h2>The campaign is stopped.</h2>
        <p>Nothing else will go out. Your meetings and your do-not-contact list stay here.</p>
      </div>
    );
  }

  if (c.phase === 'review') {
    const conflicts = openConflicts(c).length;
    return (
      <div className="stack" style={{gap: 24}}>
        <div className="poster-band">
          <h2>Round {c.round}: a fresh list of {kept(c).length}.</h2>
          <p>Same ISP, new people. Nothing goes out until you approve it.</p>
        </div>
        <ListReview c={c} />
        <div className="row-end" style={{marginTop: 0}}>
          <button type="button" className="btn" disabled={conflicts > 0} onClick={() => update(launch)}>
            Approve, and start round {c.round} <Arrow />
          </button>
        </div>
      </div>
    );
  }

  const left = ROUND_LENGTH - roundDay(c);
  return (
    <div className="stack" style={{gap: 28}}>
      <div className="head" style={{marginBottom: 0}}>
        <div>
          <h2 className="h-step" style={{fontSize: 'clamp(32px, 3.6vw, 52px)'}}>{left > 0 ? `${left} working ${left === 1 ? 'day' : 'days'} left in this round.` : `Round ${c.round} is done. You decide.`}</h2>
          <p className="lede" style={{marginTop: 8}}>
            {stats.contacted} contacted, {stats.replied} replied, {stats.booked} booked, {stats.held} held.
          </p>
        </div>
      </div>
      <div className="choices" style={{gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'}}>
        <button type="button" onClick={() => update(s => chooseRound(s, 'continue'))}>
          <b>Continue</b>
          <span>Keep the same ISP, with a fresh list of people.</span>
        </button>
        <button type="button" onClick={() => update(s => chooseRound(s, 'stop'))}>
          <b>Stop</b>
          <span>End the campaign. Nothing else goes out.</span>
        </button>
      </div>
    </div>
  );
}
