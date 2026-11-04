import {Calendar, Home as HomeIcon, Inbox as InboxIcon, Lightbulb, Plug, Settings as SettingsIcon, Sparkle, Target, Pause, Play, Menu} from 'lucide-react';
import {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {advanceDay, allTasks, canAdvanceAny, fmtDay, forwardTo, inboxCount, launchedCampaigns, meetingsLeft, nextHint, packOf, roundDay, ROUND_LENGTH, seedRunning} from './sim/engine';
import {getState, replace, reset, update, useDemo} from './sim/store';
import {CampaignDetail, Campaigns} from './screens/campaign';
import {Connectors, Mcps, Settings} from './screens/account';
import {CampaignSetup, Company, Connect, currentSetupRoute, Login, Payment, Start} from './screens/setup';
import {Home, Inbox, Insights, Meetings} from './screens/work';
import {go, Logo} from './ui/parts';

function subscribeHash(listener: () => void) {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

function useRoute(): string[] {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash);
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

const NAV = [
  ['home', 'Home', HomeIcon],
  ['campaigns', 'Campaigns', Target],
  ['inbox', 'Inbox', InboxIcon],
  ['meetings', 'Meetings', Calendar],
  ['insights', 'Insights', Lightbulb],
  ['connectors', 'Connectors', Plug],
  ['mcps', 'MCPs', Sparkle],
  ['settings', 'Settings', SettingsIcon],
] as const;

function Shell({page, children}: {page: string; children: React.ReactNode}) {
  const state = useDemo();
  const count = inboxCount(state);
  return (
    <div className="shell">
      <aside className="side">
        <a href="#/home" aria-label="Tymes home" style={{textDecoration: 'none'}}><Logo tone="paper" size={22} /></a>
        <nav aria-label="Main">
          <ul>
            {NAV.map(([key, name, Icon]) => (
              <li key={key}>
                <a className="nav" href={`#/${key}`} aria-current={page === key ? 'page' : undefined}>
                  <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
                  {name}
                  {key === 'inbox' && count > 0 && <span className="count">{count}</span>}
                  {key === 'mcps' && <span className="later">Later</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="side-foot">
          <b>{state.user?.name}</b>
          <span>{state.profile?.name} · {meetingsLeft(state)} {meetingsLeft(state) === 1 ? 'meeting' : 'meetings'} left</span>
        </div>
      </aside>
      <main id="main" className="page" key={page}>
        {children}
      </main>
    </div>
  );
}

function Clock() {
  const state = useDemo();
  const c = state.campaign;
  const [playing, setPlaying] = useState(false);
  const [menu, setMenu] = useState(false);
  const [flash, setFlash] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const live = c?.phase === 'running' || c?.phase === 'review' || c?.phase === 'stopped';
  const running = live && canAdvanceAny(state);
  const several = launchedCampaigns(state).length > 1;
  const settingUpAnother = !live && launchedCampaigns(state).length > 0;
  // Events run most important first: meetings and replies, then routine labels.
  const event = live ? state.lastEvents[0] : undefined;

  useEffect(() => {
    if (!event) return;
    setFlash(true);
    const off = window.setTimeout(() => setFlash(false), 900);
    return () => window.clearTimeout(off);
  }, [event, state.campaign?.day]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const s = getState();
      if (!s.campaign || !canAdvanceAny(s) || allTasks(s).some(t => t.kind === 'round')) {
        setPlaying(false);
        return;
      }
      const before = allTasks(s).filter(t => t.kind === 'draft' || t.kind === 'slot').length;
      update(advanceDay);
      const after = allTasks(getState()).filter(t => t.kind === 'draft' || t.kind === 'slot').length;
      // A human-in-the-loop moment: the clock stops when Tymes needs approval.
      if (after > before) setPlaying(false);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setMenu(false);
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [menu]);

  const jump = (day: number) => {
    setMenu(false);
    setPlaying(false);
    const current = getState();
    if (current.campaign?.phase === 'running' && current.campaign.round === 1 && roundDay(current.campaign) < day) {
      update(s => forwardTo(s, day));
    } else {
      replace(seedRunning(current.campaign?.goal ?? 'customers', day));
    }
    go('/home');
  };

  const named = several && c ? `${packOf(c).campaign} · ` : '';
  const headline = c?.phase === 'running'
    ? several ? `${named}Round ${c.round}` : `Round ${c.round} · Day ${roundDay(c)} of ${ROUND_LENGTH}`
    : c?.phase === 'review' ? `${named}Round ${c.round} · list to review`
    : c?.phase === 'stopped' ? `${named}Campaign stopped`
    : settingUpAnother ? 'New campaign · setup'
    : 'Setup';
  // Going back in time would drop the other campaigns, so only forward jumps are offered.
  const canJump = (day: number) => !several || (c?.phase === 'running' && c.round === 1 && roundDay(c) < day);

  return (
    <div className="clock" role="region" aria-label="Timeline">
      <div className="tag">
        <b>{headline}</b>
        <small>{c?.phase === 'running' ? several ? `Day ${roundDay(c)} of ${ROUND_LENGTH}` : fmtDay(state, c.day) : 'Tymes'}</small>
      </div>
      <div className={flash ? 'ev flash' : 'ev'} aria-live="polite">
        <b>{event ?? (live ? 'Tymes is working through the sequence.' : settingUpAnother ? 'Your other campaigns stay as they are while you set this one up.' : 'Outreach starts when you approve it.')}</b>
        <span>{live ? nextHint(state) : ''}</span>
      </div>
      <div className="ctl" ref={wrap}>
        {running && (
          <>
            <button type="button" className="icon" aria-label={playing ? 'Pause the clock' : 'Play the clock'} title={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(!playing)}>
              {playing ? <Pause size={18} strokeWidth={1.75} /> : <Play size={18} strokeWidth={1.75} />}
            </button>
            <button type="button" className="btn" disabled={!canAdvanceAny(state)} onClick={() => update(advanceDay)}>Next day</button>
          </>
        )}
        <button type="button" className="icon" aria-label="Menu" aria-expanded={menu} title="Menu" onClick={() => setMenu(!menu)}>
          <Menu size={18} strokeWidth={1.75} />
        </button>
        {menu && (
          <div className="menu" style={{color: 'var(--sumi)'}}>
            <h3>Jump ahead</h3>
            <button type="button" disabled={!canJump(3)} onClick={() => jump(3)}>Day 3: the first replies</button>
            <button type="button" disabled={!canJump(7)} onClick={() => jump(7)}>Day 7: meetings on the calendar</button>
            <button type="button" disabled={!canJump(ROUND_LENGTH)} onClick={() => jump(ROUND_LENGTH)}>Day {ROUND_LENGTH}: round done, decide</button>
            <h3>Start over</h3>
            <button type="button" onClick={() => { setMenu(false); setPlaying(false); reset(); go('/login'); }}>Restart from login</button>
            <button type="button" onClick={() => { setMenu(false); setPlaying(false); reset(); go('/'); }}>Back to the first page</button>
          </div>
        )}
      </div>
    </div>
  );
}

function SetupGuard({route, children}: {route: string; children: React.ReactNode}) {
  // Sends a deep link to the furthest setup step this browser has reached.
  const s = useDemo();
  const allowed = !(route !== 'login' && !s.user);
  useEffect(() => {
    if (!allowed) go('/login');
  }, [allowed]);
  return allowed ? <>{children}</> : null;
}

export function App() {
  const route = useRoute();
  const state = useDemo();
  const [first, second] = route;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [first, second]);

  if (!first) return <Start />;
  const c = state.campaign;

  if (['login', 'payment', 'company', 'connect', 'campaign'].includes(first)) {
    if (first === 'campaign' && c && (c.phase === 'running' || c.phase === 'review' || c.phase === 'stopped')) {
      go('/home');
      return null;
    }
    return (
      <SetupGuard route={first}>
        {first === 'login' && <Login />}
        {first === 'payment' && <Payment />}
        {first === 'company' && <Company />}
        {first === 'connect' && <Connect />}
        {first === 'campaign' && <CampaignSetup />}
        <Clock />
      </SetupGuard>
    );
  }

  // App pages need a launched campaign.
  if (!c || !['running', 'review', 'stopped'].includes(c.phase)) {
    go(currentSetupRoute());
    return null;
  }

  return (
    <>
      <Shell page={first}>
        {first === 'home' && <Home />}
        {first === 'campaigns' && (second ? <CampaignDetail tabKey={second} /> : <Campaigns />)}
        {first === 'inbox' && <Inbox route={second} />}
        {first === 'meetings' && <Meetings route={second} />}
        {first === 'insights' && <Insights />}
        {first === 'connectors' && <Connectors />}
        {first === 'mcps' && <Mcps />}
        {first === 'settings' && <Settings tabKey={second} />}
        {!NAV.some(([key]) => key === first) && <Home />}
      </Shell>
      <Clock />
    </>
  );
}
