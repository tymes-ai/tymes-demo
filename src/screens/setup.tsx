import {useEffect, useState} from 'react';
import {buyMeetingPack, cancelNewCampaign, COMPANY, firstSendDays, FOUNDER, generateList, kept, launch, MEETING_PACK_SIZES, newCampaign, openConflicts, packOf, PACKS, seedRunning, startProfile, subjectOf, stepBody, TARGETS_PER_MEETING, targetCount, type Campaign, type Goal, type MeetingPackSize, type Prospect} from '../sim/engine';
import {getState, replace, update, useDemo} from '../sim/store';
import {Arrow, Band, Field, Figure, Glyph, go, Logo, Shape, Tabs, Working, type ShapeName} from '../ui/parts';
import {ListReview} from './prospects';

// ----- Start -----

export function Start() {
  const state = useDemo();
  const resume = Boolean(state.user);
  return (
    <div className="start" id="main">
      <header className="start-nav">
        <Logo />
      </header>
      <section className="start-hero">
        <div>
          <h1 className="h-poster">See one round, from website to verdict.</h1>
          <p className="lede" style={{marginTop: 26}}>
            A founder enters a website. Tymes finds the right people, writes to them after approval, puts confirmed meetings on the calendar, and says plainly who is a real potential customer.
          </p>
          <div className="acts">
            <button type="button" className="btn" onClick={() => go('/login')}>
              Start from login <Arrow />
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                replace(seedRunning('customers', 7));
                go('/home');
              }}
            >
              Open a running campaign
            </button>
            {resume && (
              <button type="button" className="btn ghost" onClick={() => go(currentSetupRoute())}>
                Pick up where you left off
              </button>
            )}
          </div>
        </div>
        <Figure label="Four shapes assemble into a figure: a blue square, a yellow triangle, a green half-circle, and last, a red circle for the verdict" />
      </section>
      <ul className="start-loop">
        {(
          [
            ['square', 'Find', 'Profile, ISP, and 10 targets per meeting to approve.'],
            ['triangle', 'Reach', 'Personal messages, by email and LinkedIn.'],
            ['half', 'Meet', 'Confirmed meetings, each with a brief.'],
            ['sun', 'Learn', 'A verdict per person, and a sharper next round.'],
          ] as const
        ).map(([shape, name, line]) => (
          <li key={name}>
            <Shape name={shape as ShapeName} />
            <b>{name}.</b>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <Band />
    </div>
  );
}

// ----- Setup frame -----

const STEPS = ['Log in', 'Payment', 'Company', 'Accounts', 'Campaign'];

function Frame({step, children}: {step: number; children: React.ReactNode}) {
  return (
    <div className="setup">
      <header className="setup-top">
        <Logo size={22} />
        <ol className="crumbs" aria-label="Setup steps">
          {STEPS.map((name, i) => (
            <li key={name} className={i === step ? 'now' : i < step ? 'past' : undefined} aria-current={i === step ? 'step' : undefined}>
              {name}
            </li>
          ))}
        </ol>
      </header>
      <main id="main" className="setup-body">
        {children}
      </main>
    </div>
  );
}

// ----- Log in -----

export function Login() {
  const signIn = (method: string) => {
    update(s => {
      s.user = {name: FOUNDER.name, email: FOUNDER.email, method};
    });
    go('/payment');
  };
  return (
    <div className="setup">
      <div className="login-grid">
        <div className="login-left" id="main">
          <Logo />
          <div className="login-box">
            <h1 className="h-step">Log in to Tymes.</h1>
            <button type="button" className="btn block" onClick={() => signIn('Google')}>Continue with Google</button>
            <button type="button" className="btn ghost block" onClick={() => signIn('Apple')}>Continue with Apple</button>
            <button type="button" className="btn ghost block" onClick={() => signIn('Email')}>Continue with email</button>
          </div>
          <span />
        </div>
        <div className="login-right dark">
          <p>Pay only for the meetings you had.</p>
          <small>Buy a pack of 10, 20, 50, or 100 up front. No seats.</small>
        </div>
      </div>
    </div>
  );
}

// ----- Payment -----

export function Payment() {
  const [kind, setKind] = useState<'promo' | 'card'>('promo');
  const [size, setSize] = useState<MeetingPackSize>(20);
  const finish = () => {
    update(s => {
      s.payment = kind === 'promo' ? {kind, label: 'Promo code BETA2026'} : {kind, label: 'Card ending 4242'};
      buyMeetingPack(s, size);
    });
    go('/company');
  };
  return (
    <Frame step={1}>
      <div className="setup-head">
        <h1 className="h-step">Buy a pack of meetings before work starts.</h1>
        <Glyph shapes={['box', 'openbox']} />
      </div>
      <div className="split75">
        <div className="stack">
          <PackPicker value={size} onChange={setSize} />
          <Tabs
            tabs={[['promo', 'Promo code'], ['card', 'Card']] as const}
            value={kind}
            onChange={setKind}
          />
          {kind === 'promo' ? (
            <Field label="Promo code" hint="For beta customers.">
              <input className="input" readOnly value="BETA2026" />
            </Field>
          ) : (
            <div className="note plain">
              Your card is held by the payment provider, never by Tymes. Card on file: ending 4242.
            </div>
          )}
          <div className="row-end" style={{marginTop: 4}}>
            <button type="button" className="btn" onClick={finish}>
              Buy {size} meetings <Arrow />
            </button>
          </div>
        </div>
        <div className="card">
          <div className="ch c2">What you pay for</div>
          <ul className="rows">
            <li><span><b>Meetings you had</b><br /><span className="small muted">The only thing that uses your pack.</span></span><span className="pill">Uses 1</span></li>
            <li><span><b>Outreach, replies, proposed times</b><br /><span className="small muted">All the work to get there.</span></span><span className="pill o">Uses 0</span></li>
            <li><span><b>Missed meetings</b><br /><span className="small muted">Tymes finds a new time.</span></span><span className="pill o">Uses 0</span></li>
          </ul>
        </div>
      </div>
    </Frame>
  );
}

export function PackPicker({value, onChange}: {value: MeetingPackSize; onChange: (size: MeetingPackSize) => void}) {
  return (
    <div className="packs" role="radiogroup" aria-label="Meeting pack">
      {MEETING_PACK_SIZES.map(size => (
        <button key={size} type="button" role="radio" aria-checked={value === size} onClick={() => onChange(size)}>
          <b>{size}</b>
          <span>meetings</span>
          <small>{size * TARGETS_PER_MEETING} targets</small>
        </button>
      ))}
    </div>
  );
}

// ----- Company -----

export function Company() {
  const state = useDemo();
  const [run, setRun] = useState(false);
  const [extra, setExtra] = useState({deck: false, customers: false});
  const p = state.profile;
  const edit = (key: 'name' | 'line' | 'does' | 'forWhom' | 'stage', value: string) =>
    update(s => {
      if (s.profile) s.profile[key] = value;
    });
  return (
    <Frame step={2}>
      <div className="setup-head">
        <h1 className="h-step">{p ? 'Here is your company, as Tymes reads it.' : 'Start with your website.'}</h1>
        <Glyph shapes={[['square', false], ['triangle', true], ['half', true], ['sun', true]]} />
      </div>
      {!p && (
        <div className="split57">
          <div className="stack">
            <Field label="Company website">
              <input className="input" readOnly value={COMPANY.site} />
            </Field>
            <div>
              <p className="b small" style={{marginBottom: 8}}>Optional, and makes the draft better</p>
              <div className="tasks">
                <ToggleRow label="Add a deck or documents" sub="threeday_overview.pdf" on={extra.deck} onToggle={() => setExtra({...extra, deck: !extra.deck})} />
                <ToggleRow label="Name 5 sample customers" sub="From your beta list" on={extra.customers} onToggle={() => setExtra({...extra, customers: !extra.customers})} />
              </div>
            </div>
            {!run && (
              <div>
                <button type="button" className="btn" onClick={() => setRun(true)}>
                  Write my company profile <Arrow />
                </button>
              </div>
            )}
          </div>
          {run ? (
            <Working
              lines={[
                ...COMPANY.sources.map(item => `Reading ${item}`),
                ...(extra.deck ? ['Reading threeday_overview.pdf'] : []),
                ...(extra.customers ? ['Looking up your 5 sample customers'] : []),
                'Writing a draft profile',
              ]}
              onDone={() => update(startProfile)}
            />
          ) : (
            <div className="note plain">
              Tymes reads the website, social media, and public pages, then writes a draft you can change.
            </div>
          )}
        </div>
      )}
      {p && (
        <div className="split75">
          <div className="stack">
            <Field label="Company name"><input className="input" value={p.name} onChange={e => edit('name', e.target.value)} /></Field>
            <Field label="One line"><input className="input" value={p.line} onChange={e => edit('line', e.target.value)} /></Field>
            <Field label="What it does"><textarea className="input" rows={3} value={p.does} onChange={e => edit('does', e.target.value)} /></Field>
            <Field label="Who it is for"><textarea className="input" rows={2} value={p.forWhom} onChange={e => edit('forWhom', e.target.value)} /></Field>
            <Field label="Stage"><input className="input" value={p.stage} onChange={e => edit('stage', e.target.value)} /></Field>
            <div>
              <button type="button" className="btn" onClick={() => go('/connect')}>
                This is right <Arrow />
              </button>
            </div>
          </div>
          <div className="card">
            <div className="ch c1">Where this came from</div>
            <ul className="rows">
              {COMPANY.sources.map(item => (
                <li key={item}><span>{item}</span></li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Frame>
  );
}

function ToggleRow({label, sub, on, onToggle}: {label: string; sub: string; on: boolean; onToggle: () => void}) {
  return (
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1.5px solid var(--hair)'}}>
      <span>
        <b style={{fontWeight: 600, display: 'block'}}>{label}</b>
        <small className="muted small">{sub}</small>
      </span>
      <button type="button" className={on ? 'btn sm' : 'btn ghost sm'} aria-pressed={on} onClick={onToggle}>
        {on ? 'Added' : 'Add'}
      </button>
    </div>
  );
}

// ----- Connect -----

export const SETUP_CONNECTORS: readonly {id: string; name: string; sub: string; required?: boolean}[] = [
  {id: 'gmail', name: 'Gmail', sub: 'Email goes from your own mailbox', required: true},
  {id: 'gcal', name: 'Google Calendar', sub: 'Confirmed meetings land here', required: true},
  {id: 'meet', name: 'Google Meet', sub: 'Meeting links and attendance'},
  {id: 'linkedin', name: 'LinkedIn', sub: 'The second channel in a sequence'},
  {id: 'crm', name: 'CRM', sub: 'Optional. Skip people you already know'},
  {id: 'sheets', name: 'Lead sheets', sub: 'Optional. Tymes lead data works without it'},
];

export function ConnectButton({id}: {id: string}) {
  const state = useDemo();
  const [busy, setBusy] = useState(false);
  const on = Boolean(state.connectors[id]);
  return (
    <button
      type="button"
      className={on ? 'btn ghost sm' : 'btn sm'}
      disabled={busy}
      onClick={() => {
        if (on) {
          update(s => {
            s.connectors[id] = false;
          });
          return;
        }
        setBusy(true);
        window.setTimeout(() => {
          update(s => {
            s.connectors[id] = true;
          });
          setBusy(false);
        }, 650);
      }}
    >
      {busy ? 'Connecting' : on ? 'Connected' : 'Connect'}
    </button>
  );
}

export function Connect() {
  const state = useDemo();
  const missing = SETUP_CONNECTORS.filter(item => item.required && !state.connectors[item.id]);
  return (
    <Frame step={3}>
      <div className="setup-head">
        <h1 className="h-step">Connect the accounts Tymes works from.</h1>
        <Glyph shapes={['triangle']} />
      </div>
      <div className="split75">
        <div>
          <div className="tasks">
            {SETUP_CONNECTORS.map(item => (
              <div key={item.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1.5px solid var(--hair)'}}>
                <span>
                  <b style={{fontWeight: 600, display: 'block'}}>{item.name}{item.required && <span className="muted small"> · needed</span>}</b>
                  <small className="muted small">{item.sub}</small>
                </span>
                <ConnectButton id={item.id} />
              </div>
            ))}
          </div>
          <div className="row-end">
            <button
              type="button"
              className="btn"
              disabled={missing.length > 0}
              onClick={() => {
                update(s => {
                  s.connected = true;
                  s.connectors.tymes = true;
                });
                go('/campaign');
              }}
            >
              Continue <Arrow />
            </button>
            {missing.length > 0 && <span className="small muted">Connect {missing.map(m => m.name).join(' and ')} to go on.</span>}
          </div>
        </div>
        <div className="poster-band sage">
          <h2>Nothing sends from Tymes servers.</h2>
          <p>Email goes from your own account.</p>
        </div>
      </div>
    </Frame>
  );
}

// ----- Campaign creation -----

const GOAL_SHAPES: Record<Goal, ShapeName> = {customers: 'square', investors: 'half', partners: 'triangle'};

export function CampaignSetup() {
  const state = useDemo();
  const c = state.campaign;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [c?.phase]);
  if (!c || c.phase === 'goal') return <GoalStep />;
  if (c.phase === 'who') return <WhoStep c={c} />;
  if (c.phase === 'isp') return <IspStep c={c} />;
  if (c.phase === 'list') return <ListStep c={c} />;
  if (c.phase === 'messages') return <MessagesStep c={c} />;
  return <LaunchStep c={c} />;
}

function GoalStep() {
  const state = useDemo();
  const taken = state.others.map(c => c.goal);
  const [goal, setGoal] = useState<Goal>((Object.keys(PACKS) as Goal[]).find(key => !taken.includes(key)) ?? 'customers');
  return (
    <Frame step={4}>
      <div className="setup-head">
        <h1 className="h-step">Who do you want to meet?</h1>
        <Glyph shapes={['square', 'half', 'triangle']} />
      </div>
      <div style={{marginTop: 36, maxWidth: 880}}>
        <div className="choice-list" role="radiogroup" aria-label="Campaign goal">
          {(Object.keys(PACKS) as Goal[]).map(key => (
            <button key={key} type="button" role="radio" aria-checked={goal === key} disabled={taken.includes(key)} onClick={() => setGoal(key)}>
              <Shape name={GOAL_SHAPES[key]} className="shape" />
              <span>
                <b>{PACKS[key].goalName}</b>
                <span>{taken.includes(key) ? `You already run this: ${PACKS[key].campaign}.` : PACKS[key].goalLine}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="row-end">
          <button type="button" className="btn" onClick={() => update(s => newCampaign(s, goal))}>
            Continue <Arrow />
          </button>
          {taken.length > 0 && (
            <button type="button" className="btn ghost" onClick={() => { update(cancelNewCampaign); go('/campaigns'); }}>Back to campaigns</button>
          )}
        </div>
      </div>
    </Frame>
  );
}

function WhoStep({c}: {c: Campaign}) {
  const pack = packOf(c);
  const [mode, setMode] = useState<'describe' | 'samples'>('describe');
  const [run, setRun] = useState(false);
  return (
    <Frame step={4}>
      <div className="setup-head">
        <h1 className="h-step">Tell Tymes who to meet and what to learn.</h1>
        <Glyph shapes={['square']} />
      </div>
      <div className="split57">
        <div className="stack">
          <Tabs tabs={[['describe', 'Describe them'], ['samples', 'Sample LinkedIn profiles']] as const} value={mode} onChange={setMode} />
          {mode === 'describe' ? (
            <Field label="Who to meet">
              <textarea className="input" rows={3} value={c.who} onChange={e => { const v = e.target.value; update(s => { if (s.campaign) s.campaign.who = v; }); }} />
            </Field>
          ) : (
            <div className="field">
              <span className="lab">Sample LinkedIn profiles</span>
              {pack.samples.map(item => (
                <input key={item} className="input" readOnly value={item} aria-label="Sample profile" />
              ))}
            </div>
          )}
          <Field label="What to learn">
            <textarea className="input" rows={3} value={c.learn} onChange={e => { const v = e.target.value; update(s => { if (s.campaign) s.campaign.learn = v; }); }} />
          </Field>
          {!run && (
            <div>
              <button type="button" className="btn" onClick={() => setRun(true)}>
                Write the ISP <Arrow />
              </button>
            </div>
          )}
        </div>
        {run ? (
          <Working
            lines={[
              'Reading your company profile',
              mode === 'describe' ? 'Reading what you said' : 'Reading the sample profiles',
              'Writing the Ideal Prospect Specification',
              `Writing the ${pack.guideName.toLowerCase()}`,
            ]}
            onDone={() => update(s => { if (s.campaign) s.campaign.phase = 'isp'; })}
          />
        ) : (
          <div className="card">
            <div className="ch c5">Campaign goal <span className="pill">{pack.goalName}</span></div>
            <div className="cb small muted">
              One campaign has one goal. To change it, go back and pick another.
              <div style={{marginTop: 10}}>
                <button type="button" className="link" onClick={() => update(s => { s.campaign = null; })}>Pick another goal</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Frame>
  );
}

function IspStep({c}: {c: Campaign}) {
  const state = useDemo();
  const pack = packOf(c);
  const [run, setRun] = useState(false);
  const preview = pack.heroes.slice(0, 3);
  return (
    <Frame step={4}>
      <div className="setup-head">
        <h1 className="h-step">Your ISP, and who it finds.</h1>
        <Glyph shapes={['square', ['triangle', true]]} />
      </div>
      <div className="split57">
        <div className="stack">
          <div className="card">
            <div className="ch c1">Campaign ISP <span className="pill y">{pack.goalName}</span></div>
            <div className="cb stack" style={{gap: 12}}>
              {c.isp.map(([key, value], i) => (
                <Field key={key} label={key}>
                  <input
                    className="input"
                    value={value}
                    onChange={e => {
                      const v = e.target.value;
                      update(s => {
                        if (s.campaign) s.campaign.isp[i] = [key, v];
                      });
                    }}
                  />
                </Field>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="ch c5">{pack.guideName}</div>
            <div className="cb">
              <ol className="q-list">
                {c.guide.map(q => <li key={q}>{q}</li>)}
              </ol>
            </div>
          </div>
        </div>
        <div className="stack">
          <div>
            <p style={{fontSize: 'clamp(44px, 5vw, 72px)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.95}}>{Math.max(412, targetCount(state) * 4).toLocaleString('en-GB')} people</p>
            <p className="muted" style={{marginTop: 6}}>match this ISP in Tymes lead data. Here are three of them.</p>
          </div>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {preview.map(hero => (
                  <tr key={hero.key}>
                    <td style={{width: '46%'}}><span className="main">{hero.name}</span><span className="sub">{hero.role}, {hero.company}</span></td>
                    <td><span className="small">{hero.why}</span></td>
                    <td className="end"><span className="fit">{hero.fit}<small>fit</small></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {run ? (
            <Working
              speed={520}
              lines={[
                'Searching Tymes lead data',
                'Matching each person to one identity',
                'Dropping 2 people on your do-not-contact list',
                'Scoring fit against the ISP',
                `Picking the top ${targetCount(state)}`,
              ]}
              onDone={() => update(generateList)}
            />
          ) : (
            <div>
              <button type="button" className="btn" onClick={() => setRun(true)}>
                Generate {targetCount(state)} targets <Arrow />
              </button>
            </div>
          )}
        </div>
      </div>
    </Frame>
  );
}

function ListStep({c}: {c: Campaign}) {
  const count = kept(c).length;
  const conflicts = openConflicts(c).length;
  return (
    <Frame step={4}>
      <div className="setup-head">
        <div>
          <h1 className="h-step">{count} targets. Approve and refine.</h1>
          <p className="lede" style={{marginTop: 12}}>Nobody hears from Tymes until you approve this list, then the messages.</p>
        </div>
        <Glyph shapes={['square', ['triangle', true]]} />
      </div>
      <div style={{marginTop: 28}}>
        <ListReview c={c} />
      </div>
      <div className="row-end">
        <button
          type="button"
          className="btn"
          disabled={conflicts > 0}
          onClick={() => update(s => { if (s.campaign) s.campaign.phase = 'messages'; })}
        >
          Approve {count} prospects <Arrow />
        </button>
        {conflicts > 0 && <span className="small muted">Check the flagged person first.</span>}
      </div>
    </Frame>
  );
}

export function MessageReview({c, list}: {c: Campaign; list: readonly Prospect[]}) {
  const state = useDemo();
  const founder = state.user?.name ?? FOUNDER.name;
  const [id, setId] = useState(list[0]?.id);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const p = list.find(item => item.id === id) ?? list[0];
  if (!p) return null;
  const body = stepBody(c, p, step, founder);
  return (
    <div className="split">
      <div className="split-list">
        {list.map(item => (
          <button key={item.id} type="button" className="split-item" aria-current={item.id === p.id ? 'true' : undefined} onClick={() => setId(item.id)}>
            <b>{item.name}</b>
            <small>{item.role}, {item.company}</small>
          </button>
        ))}
      </div>
      <div className="pane">
        <h2>{p.name}</h2>
        <p className="muted small">{p.email} · {p.city}, sends in working hours there</p>
        <div className="ctabs" style={{marginTop: 14, marginBottom: 14}}>
          {([[1, 'Step 1 · Email · Day 1'], [2, 'Step 2 · LinkedIn · Day 4'], [3, 'Step 3 · Email · Day 8']] as const).map(([key, name]) => (
            <button key={key} type="button" aria-current={step === key ? 'true' : undefined} onClick={() => setStep(key)}>{name}</button>
          ))}
        </div>
        {step !== 2 && <p className="small" style={{marginBottom: 8}}><b>Subject:</b> {step === 3 ? 'Re: ' : ''}{subjectOf(c, p)}</p>}
        <textarea
          className="input"
          aria-label="Message"
          rows={12}
          style={{maxWidth: '70ch', display: 'block'}}
          value={body}
          onChange={e => {
            const v = e.target.value;
            update(s => {
              if (s.campaign) s.campaign.edits[`${p.id}:${step}`] = v;
            });
          }}
        />
        {step === 1 && (
          <p className="small" style={{marginTop: 10}}>
            <b>Why this opening:</b> <span className="muted">{p.source}. Tymes shows its source so you can check it.</span>
          </p>
        )}
      </div>
    </div>
  );
}

function MessagesStep({c}: {c: Campaign}) {
  const count = kept(c).length;
  return (
    <Frame step={4}>
      <div className="setup-head">
        <div>
          <h1 className="h-step">{count} personal messages. Read as many as you like.</h1>
          <p className="lede" style={{marginTop: 12}}>Each one opens with something true about that person. Change anything.</p>
        </div>
        <Glyph shapes={['square', 'triangle']} />
      </div>
      <div style={{marginTop: 28}}>
        <MessageReview c={c} list={kept(c)} />
      </div>
      <div className="row-end">
        <button type="button" className="btn" onClick={() => update(s => { if (s.campaign) s.campaign.phase = 'launch'; })}>
          Approve {count} messages <Arrow />
        </button>
        <button type="button" className="btn ghost" onClick={() => update(s => { if (s.campaign) s.campaign.phase = 'list'; })}>Back to the list</button>
      </div>
    </Frame>
  );
}

function LaunchStep({c}: {c: Campaign}) {
  const state = useDemo();
  const pack = packOf(c);
  const count = kept(c).length;
  return (
    <Frame step={4}>
      <div className="launch">
        <div>
          <h1 className="h-poster" style={{fontSize: 'clamp(46px, 5.6vw, 84px)'}}>Ready when you are.</h1>
          <ul className="check-list" style={{marginTop: 28, maxWidth: 620}}>
            <li><span>Goal</span><b>{pack.goalName}</b></li>
            <li><span>Prospects approved</span><b>{count}</b></li>
            <li><span>Messages approved</span><b>{count} × 3 steps</b></li>
            <li><span>First emails</span><b>20 a day per mailbox, {firstSendDays(c)} working days to send them all</b></li>
            <li><span>Sent from</span><b>{state.user?.email}, and LinkedIn</b></li>
            <li><span>Before each send</span><b>Approved, not on DNC, under limits</b></li>
          </ul>
          <div className="row-end">
            <button
              type="button"
              className="btn"
              onClick={() => {
                update(launch);
                go('/home');
              }}
            >
              Start outreach <Arrow />
            </button>
          </div>
        </div>
        <Figure label="Four shapes assemble into one figure, as a round of outreach begins" />
      </div>
    </Frame>
  );
}

export function currentSetupRoute(): string {
  const s = getState();
  if (!s.user) return '/login';
  if (!s.payment) return '/payment';
  if (!s.connected) return s.profile ? '/connect' : '/company';
  if (!s.campaign || s.campaign.phase !== 'running') {
    if (s.campaign && (s.campaign.phase === 'review' || s.campaign.phase === 'stopped')) return '/home';
    return '/campaign';
  }
  return '/home';
}
