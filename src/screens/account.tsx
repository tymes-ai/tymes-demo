import {useState} from 'react';
import {allCampaigns, budgetUsed, buyMeetingPack, fmtDay, meetingsBought, meetingsLeft, meetingsUsed, type BookingMode, type Level, type MeetingPackSize} from '../sim/engine';
import {update, useDemo} from '../sim/store';
import {Arrow, Field, PageHead, Shape, type ShapeName} from '../ui/parts';
import {ConnectButton, PackPicker} from './setup';

const GROUPS: readonly {name: string; items: readonly {id: string; name: string; sub: string}[]}[] = [
  {
    name: 'Lead sources',
    items: [
      {id: 'tymes', name: 'Tymes lead data', sub: 'Start here if you have no list'},
      {id: 'crm', name: 'CRM', sub: 'Skip people you already know'},
      {id: 'csv', name: 'CSV upload', sub: 'Bring your own list'},
      {id: 'sheets', name: 'Google Sheets', sub: 'Keep a list in sync'},
    ],
  },
  {
    name: 'Outreach',
    items: [
      {id: 'gmail', name: 'Gmail', sub: 'Sends from your own mailbox'},
      {id: 'outlook', name: 'Outlook', sub: 'Sends from your own mailbox'},
      {id: 'linkedin', name: 'LinkedIn', sub: 'Within your account limits'},
    ],
  },
  {
    name: 'Calendars and booking',
    items: [
      {id: 'gcal', name: 'Google Calendar', sub: 'Confirmed meetings land here'},
      {id: 'calendly', name: 'Calendly', sub: 'Book on a shared link'},
      {id: 'calcom', name: 'cal.com', sub: 'Book on a shared link'},
    ],
  },
  {
    name: 'Video calls',
    items: [
      {id: 'meet', name: 'Google Meet', sub: 'Links and attendance'},
      {id: 'teams', name: 'Microsoft Teams', sub: 'Links and attendance'},
      {id: 'zoom', name: 'Zoom', sub: 'Links and attendance'},
    ],
  },
  {
    name: 'Transcripts',
    items: [
      {id: 'notetaker', name: 'Calendly Notetaker', sub: 'Import after each call'},
      {id: 'fireflies', name: 'Fireflies', sub: 'Import after each call'},
    ],
  },
];

export function Connectors() {
  return (
    <>
      <PageHead title="Connectors" sub="Where people come from, how Tymes reaches them, and where meetings land." />
      {GROUPS.map(group => (
        <section className="section" key={group.name} style={{marginTop: 26}}>
          <h2 className="h-block">{group.name}</h2>
          <ul className="conn">
            {group.items.map(item => (
              <li key={item.id}>
                <span><b>{item.name}</b><small>{item.sub}</small></span>
                <ConnectButton id={item.id} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

export function Mcps() {
  return (
    <>
      <PageHead title={<>MCPs <span className="pill q" style={{verticalAlign: 'middle', marginLeft: 8, letterSpacing: 0}}>On the roadmap</span></>} sub="Not built yet." />
      <div className="poster-band dark">
        <h2>Later, your coding agent can run a campaign.</h2>
        <p>The idea: a founder asks their agent to find twenty finance leads, and Tymes does the rest, with the same approvals and the same policy gate.</p>
        <p className="code" aria-label="Example of a future request">{`> Find 20 finance leads like my last 3 good meetings.\n  Show me the list before anything goes out.`}</p>
      </div>
    </>
  );
}

const SETTINGS_TABS = [
  ['account', 'Account'],
  ['team', 'Team'],
  ['billing', 'Billing'],
  ['approval', 'Approval level'],
  ['dnc', 'Do not contact'],
  ['budget', 'AI budget'],
] as const;

const LEVELS: readonly (readonly [Level, ShapeName, string, string])[] = [
  ['all', 'box', 'Approve all', 'Every prospect and every message waits for you.'],
  ['some', 'halfbox', 'Approve some', 'You sign off what matters. The rest goes out within your ISP.'],
  ['auto', 'openbox', 'Automatic', 'Tymes runs the campaign within your ISP. Switch back any time.'],
];

export function Settings({tabKey}: {tabKey?: string}) {
  const tab = SETTINGS_TABS.find(([key]) => key === tabKey)?.[0] ?? 'account';
  return (
    <>
      <PageHead title="Settings" />
      <nav className="ctabs" aria-label="Settings">
        {SETTINGS_TABS.map(([key, name]) => (
          <a key={key} href={`#/settings/${key}`} aria-current={tab === key ? 'true' : undefined}>{name}</a>
        ))}
      </nav>
      {tab === 'account' && <Account />}
      {tab === 'team' && <Team />}
      {tab === 'billing' && <Billing />}
      {tab === 'approval' && <Approval />}
      {tab === 'dnc' && <Dnc />}
      {tab === 'budget' && <Budget />}
    </>
  );
}

function Account() {
  const state = useDemo();
  return (
    <div className="split75" style={{marginTop: 0}}>
      <div className="stack">
        <Field label="Name"><input className="input" readOnly value={state.user?.name ?? ''} /></Field>
        <Field label="Email"><input className="input" readOnly value={state.user?.email ?? ''} /></Field>
        <Field label="Signed in with"><input className="input" readOnly value={state.user?.method ?? ''} /></Field>
        <section>
          <h2 className="h-block" style={{marginBottom: 10}}>Company profile</h2>
          <div className="card">
            <div className="ch c1">{state.profile?.name}</div>
            <div className="cb">
              <dl>
                <dt>Website</dt><dd>{state.profile?.site}</dd>
                <dt>What it does</dt><dd>{state.profile?.does}</dd>
                <dt>For</dt><dd>{state.profile?.forWhom}</dd>
              </dl>
            </div>
          </div>
        </section>
      </div>
      <section>
        <h2 className="h-block" style={{marginBottom: 10}}>Workspaces</h2>
        <ul className="dnc">
          <li>
            <span><b>{state.profile?.name}</b><small>Owner · current workspace</small></span>
            <button type="button" className="btn ghost sm" disabled title="The last owner cannot leave">Leave</button>
          </li>
        </ul>
        <p className="small muted" style={{marginTop: 8}}>You are the last owner, so you cannot leave. Give ownership to someone else first.</p>
      </section>
    </div>
  );
}

function Team() {
  const state = useDemo();
  const [name, setName] = useState('');
  return (
    <div style={{maxWidth: 720}} className="stack">
      <ul className="dnc">
        {state.team.map(member => (
          <li key={member.email}>
            <span><b>{member.name}</b><small>{member.email}</small></span>
            <span className={member.role === 'Owner' ? 'pill' : 'pill o'}>{member.role}</span>
          </li>
        ))}
      </ul>
      <form
        className="inline-form"
        onSubmit={e => {
          e.preventDefault();
          const value = name.trim();
          if (!value) return;
          update(s => {
            const slug = value.toLowerCase().replace(/[^a-z]+/g, '.');
            s.team.push({name: value, email: `${slug}@threeday.example`, role: 'Member'});
          });
          setName('');
        }}
      >
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="A teammate's name" aria-label="Teammate's name" />
        <button type="submit" className="btn">Invite</button>
      </form>
    </div>
  );
}

function Billing() {
  const state = useDemo();
  const [size, setSize] = useState<MeetingPackSize>(20);
  const campaigns = allCampaigns(state);
  const meetings = campaigns.flatMap(c => c.meetings).sort((a, b) => b.day - a.day);
  const left = meetingsLeft(state);
  return (
    <div className="stack" style={{gap: 28}}>
      <div className="poster-band">
        <h2>{left} {left === 1 ? 'meeting' : 'meetings'} left in your pack.</h2>
        <p>{meetingsBought(state)} bought, {meetingsUsed(state)} used. You pay only for the meetings you had. Pricing is set at launch, so the amounts stay blank here.</p>
      </div>
      <div className="split57" style={{marginTop: 0}}>
        <div className="stack">
          <section>
            <h2 className="h-block" style={{marginBottom: 10}}>Buy another pack</h2>
            <PackPicker value={size} onChange={setSize} />
            <button type="button" className="btn" style={{marginTop: 14}} onClick={() => update(s => buyMeetingPack(s, size))}>
              Buy {size} meetings <Arrow />
            </button>
          </section>
          <section>
            <h2 className="h-block" style={{marginBottom: 10}}>Your packs</h2>
            <ul className="dnc">
              {[...state.meetingPacks].reverse().map((pack, i) => (
                <li key={state.meetingPacks.length - i}>
                  <span><b>{pack.size} meetings</b><small>{pack.bought}</small></span>
                  <span className="small muted">{pack.paidWith}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Meeting</th><th>Date</th><th className="end">From your pack</th></tr>
            </thead>
            <tbody>
              {meetings.length === 0 && (
                <tr><td colSpan={3} className="muted">Nothing yet. A meeting uses your pack only once it is held.</td></tr>
              )}
              {meetings.map(m => {
                const p = campaigns.flatMap(c => c.prospects).find(item => item.id === m.prospectId);
                return (
                  <tr key={m.id}>
                    <td><span className="main">{p?.name}</span><span className="sub">{p?.company}</span></td>
                    <td>{fmtDay(state, m.day)}</td>
                    <td className="end">
                      {m.status === 'held' ? <b>1 meeting</b> : m.status === 'missed' ? <span className="muted">Nothing: missed</span> : <span className="muted">When held</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Approval() {
  const state = useDemo();
  const modes: readonly (readonly [BookingMode, string, string])[] = [
    ['manual', 'Ask me', 'You get a task, with your free times.'],
    ['auto', 'Book it for me', 'Tymes books on their link, through the policy gate.'],
  ];
  return (
    <div className="split75" style={{marginTop: 0}}>
      <div>
        <div className="radios" role="radiogroup" aria-label="Approval level">
          {LEVELS.map(([key, shape, name, line]) => (
            <button key={key} type="button" role="radio" aria-checked={state.level === key} onClick={() => update(s => { s.level = key; })}>
              <Shape name={shape} />
              <span><b>{name}</b><span>{line}</span></span>
            </button>
          ))}
        </div>
        <p className="small muted" style={{marginTop: 10}}>With Automatic, new replies are answered without waiting. Whatever you pick, the do-not-contact list and limits still apply.</p>
      </div>
      <section>
        <h2 className="h-block" style={{marginBottom: 10}}>When someone shares a booking link</h2>
        <div className="radios" role="radiogroup" aria-label="Booking links">
          {modes.map(([key, name, line]) => (
            <button key={key} type="button" role="radio" aria-checked={state.bookingMode === key} onClick={() => update(s => { s.bookingMode = key; })} style={{gridTemplateColumns: '1fr'}}>
              <span><b style={{fontSize: 18}}>{name}</b><span>{line}</span></span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Dnc() {
  const state = useDemo();
  const [value, setValue] = useState('');
  return (
    <div style={{maxWidth: 780}} className="stack">
      <p className="muted">One list, respected on every channel. It blocks a person and every identifier known for them. Try a company name from your prospect list: the policy gate blocks them from the next send.</p>
      <form
        className="inline-form"
        onSubmit={e => {
          e.preventDefault();
          const v = value.trim();
          if (!v) return;
          update(s => {
            s.dnc.unshift({value: v, why: 'Added by you.'});
          });
          setValue('');
        }}
      >
        <input className="input" value={value} onChange={e => setValue(e.target.value)} placeholder="A person, email, domain, or company" aria-label="Add to the do-not-contact list" />
        <button type="submit" className="btn">Add</button>
      </form>
      <ul className="dnc">
        {state.dnc.map(entry => (
          <li key={entry.value}>
            <span>
              <b>{entry.value}</b>
              <small>{entry.why}{entry.identifiers ? ` Blocks ${entry.identifiers}.` : ''}</small>
            </span>
            <button type="button" className="link small" onClick={() => update(s => { s.dnc = s.dnc.filter(item => item.value !== entry.value); })}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Budget() {
  const state = useDemo();
  const used = budgetUsed(state);
  return (
    <div style={{maxWidth: 680}} className="stack">
      <p style={{fontSize: 'clamp(44px, 5vw, 72px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.95}}>{used}% used</p>
      <div className="meter" role="img" aria-label={`${used}% of the AI budget is used. The owner is warned at 80%.`}>
        <i style={{width: `${used}%`}} />
        <u />
      </div>
      <p className="muted">You are warned at 80%. At 100%, AI jobs pause, except meetings in progress. Sending still has to pass the policy gate.</p>
      <div>
        <button type="button" className="btn" onClick={() => update(s => { s.budgetCap *= 2; })}>Double the budget</button>
      </div>
    </div>
  );
}
