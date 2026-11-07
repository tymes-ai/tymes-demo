// The whole "backend" of the prototype: pure functions over one state object.
// A simulated clock moves in working days, and each day plays out scripted and
// generated events, always respecting what the founder approved.

import {
  CITIES,
  COMPANY,
  COMPANY_PREFIX,
  FILLER_REPLIES,
  FIRST_NAMES,
  FOUNDER,
  type Channel,
  type Goal,
  type Hero,
  type Label,
  LAST_NAMES,
  PACKS,
  type Pack,
  type Proof,
  type Script,
  type Seg,
  type Verdict,
} from './content';

export const ROUND_LENGTH = 12;
const MAX_ROUND_DAY = 15;
const DAILY_FIRST_TOUCHES = 20;

export type Level = 'all' | 'some' | 'auto';
export type BookingMode = 'manual' | 'auto';
export type Phase = 'goal' | 'who' | 'isp' | 'list' | 'messages' | 'launch' | 'running' | 'review' | 'stopped';

export interface Prospect {
  id: string;
  round: number;
  name: string;
  role: string;
  company: string;
  email: string;
  linkedin: string;
  city: string;
  tz: string;
  detail: string;
  seg: Seg;
  fit: number;
  prevFit?: number;
  kept: boolean;
  why: string;
  hook: string;
  source: string;
  heroKey?: string;
  conflict?: string;
  order: number;
  /** Set for people added mid-round, e.g., through a referral. */
  startDay?: number;
}

export interface Msg {
  from: 'you' | 'them';
  channel: Channel;
  day: number;
  time: string;
  body: string;
  step?: string;
}

export interface Thread {
  prospectId: string;
  round: number;
  label: Label;
  labelWhy: string;
  msgs: Msg[];
  draft?: string;
  /** What approving the draft does. */
  draftKind?: 'book' | 'rebook' | 'refer';
  /** The first date offered in the draft, as an absolute working day. */
  slotDay?: number;
  /** Choose a time on their booking link. */
  slots?: number[];
  lastDay: number;
}

export interface Meeting {
  id: string;
  prospectId: string;
  round: number;
  day: number;
  time: string;
  platform: string;
  status: 'upcoming' | 'held' | 'missed';
  proof?: Proof;
  verdict?: Verdict;
  rating?: 'good' | 'bad';
  ratingEffect?: string;
  transcript?: readonly (readonly [string, string])[];
  rebooked?: boolean;
}

export interface Activity {
  day: number;
  text: string;
  /** The campaign this happened in. */
  goal?: Goal;
}

export interface DncEntry {
  value: string;
  why: string;
  identifiers?: string;
}

export interface ScheduledEvent {
  day: number;
  type: 'reply' | 'confirm' | 'rebookConfirm';
  prospectId: string;
}

export interface RoundSummary {
  round: number;
  contacted: number;
  replied: number;
  booked: number;
  held: number;
  yes: number;
  isp: string;
}

export interface Campaign {
  goal: Goal;
  phase: Phase;
  who: string;
  learn: string;
  isp: (readonly [string, string])[];
  guide: string[];
  round: number;
  /** Absolute working day when this round began. */
  roundStart: number;
  day: number;
  prospects: Prospect[];
  edits: Record<string, string>;
  threads: Thread[];
  meetings: Meeting[];
  schedule: ScheduledEvent[];
  summaries: RoundSummary[];
  refined: string[];
  dropped: number;
  roundChoice?: 'continue' | 'change';
}

export const MEETING_PACK_SIZES = [10, 20, 50, 100] as const;
export type MeetingPackSize = (typeof MEETING_PACK_SIZES)[number];
const LOW_PACK = 2;
/** Every list has at least this many targets for each meeting. */
export const TARGETS_PER_MEETING = 10;

export interface DemoState {
  user: {name: string; email: string; method: string} | null;
  payment: {kind: 'promo' | 'card'; label: string} | null;
  /** Prepaid packs of meetings, oldest first. They cover every campaign. */
  meetingPacks: {size: MeetingPackSize; paidWith: string; bought: string}[];
  profile: {name: string; site: string; line: string; does: string; forWhom: string; stage: string} | null;
  connectors: Record<string, boolean>;
  connected: boolean;
  level: Level;
  bookingMode: BookingMode;
  dnc: DncEntry[];
  team: {name: string; email: string; role: 'Owner' | 'Member'}[];
  budgetCap: number;
  /** The campaign the screens are showing. */
  campaign: Campaign | null;
  /** The customer's other campaigns: they share the mailbox, the clock, and the DNC list. */
  others: Campaign[];
  log: Activity[];
  baseDate: string;
  lastEvents: string[];
}

export function initialState(): DemoState {
  return {
    user: null,
    payment: null,
    meetingPacks: [],
    profile: null,
    connectors: {},
    connected: false,
    level: 'all',
    bookingMode: 'manual',
    dnc: [
      {value: 'merrowfield.example', why: 'Current customer. Added by you.'},
      {value: 'Your board', why: 'Added by you.'},
    ],
    team: [{name: FOUNDER.name, email: FOUNDER.email, role: 'Owner'}],
    budgetCap: 100,
    campaign: null,
    others: [],
    log: [],
    baseDate: nextMonday().toISOString(),
    lastEvents: [],
  };
}

function nextMonday(): Date {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  do {
    date.setDate(date.getDate() + 1);
  } while (date.getDay() !== 1);
  return date;
}

export function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/** Working day number to a real date: day 1 is the base Monday. */
export function dateOf(state: Pick<DemoState, 'baseDate'>, day: number): Date {
  const date = new Date(state.baseDate);
  const weeks = Math.floor((day - 1) / 5);
  date.setDate(date.getDate() + weeks * 7 + ((day - 1) % 5));
  return date;
}

export function fmtDay(state: Pick<DemoState, 'baseDate'>, day: number): string {
  return dateOf(state, day).toLocaleDateString('en-GB', {weekday: 'short', day: 'numeric', month: 'short'});
}

export function fmtDayLong(state: Pick<DemoState, 'baseDate'>, day: number): string {
  return dateOf(state, day).toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'long'});
}

export function packOf(campaign: Campaign): Pack {
  return PACKS[campaign.goal];
}

export function roundDay(campaign: Campaign): number {
  return campaign.day - campaign.roundStart + 1;
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (all, key: string) => values[key] ?? all);
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function heroProspect(hero: Hero, round: number, order: number): Prospect {
  const [first, ...rest] = hero.name.split(' ');
  return {
    id: `${hero.key}-r${round}`,
    round,
    name: hero.name,
    role: hero.role,
    company: hero.company,
    email: `${slug(first)}.${slug(rest.join(''))}@${slug(hero.company)}.example`,
    linkedin: `linkedin.example/in/${slug(hero.name)}`,
    city: hero.city,
    tz: hero.tz,
    detail: hero.detail,
    seg: hero.seg,
    fit: hero.fit,
    kept: true,
    why: hero.why,
    hook: hero.hook,
    source: hero.source,
    heroKey: hero.key,
    conflict: hero.conflict,
    order,
  };
}

let fillerCounter = 0;

function fillerProspect(pack: Pack, round: number, seg: Seg, order: number, boost: number): Prospect {
  fillerCounter += 1;
  const seed = hash(`${pack.goal}:${round}:${order}:${fillerCounter}`);
  const first = FIRST_NAMES[seed % FIRST_NAMES.length];
  const last = LAST_NAMES[(seed >>> 5) % LAST_NAMES.length];
  const prefix = COMPANY_PREFIX[(seed >>> 9) % COMPANY_PREFIX.length];
  const company = `${prefix} ${pack.suffixes[(seed >>> 14) % pack.suffixes.length]}`;
  const [city, tz] = CITIES[(seed >>> 18) % CITIES.length];
  const roles = pack.roles[seg];
  const details = pack.details[seg];
  const base = seg === 'core' ? 68 : seg === 'big' ? 52 : 44;
  const spread = seg === 'core' ? 20 : 15;
  return {
    id: `f${seed.toString(36)}`,
    round,
    name: `${first} ${last}`,
    role: roles[(seed >>> 3) % roles.length],
    company,
    email: `${slug(first)}.${slug(last)}@${slug(company)}.example`,
    linkedin: `linkedin.example/in/${slug(first + last)}`,
    city,
    tz,
    detail: details[(seed >>> 7) % details.length],
    seg,
    fit: Math.min(98, base + (seed >>> 11) % spread + boost),
    kept: true,
    why: pack.fillerWhy[seg],
    hook: fill(pack.fillerHook[seg], {company}),
    source: `${company} public pages`,
    order,
  };
}

function buildList(pack: Pack, round: number, heroes: readonly Hero[], segs: readonly Seg[], boost: number, size: number): Prospect[] {
  const list = heroes.map((hero, i) => heroProspect(hero, round, i));
  const emails = new Set(list.map(p => p.email));
  while (list.length < size) {
    const order = list.length;
    const next = fillerProspect(pack, round, segs[order % segs.length], order, boost);
    if (!emails.has(next.email)) {
      emails.add(next.email);
      list.push(next);
    }
  }
  return list.sort((a, b) => b.fit - a.fit).map((p, i) => ({...p, order: i}));
}

// ----- Setup -----

export function startProfile(state: DemoState): void {
  state.profile = {
    name: COMPANY.name,
    site: COMPANY.site,
    line: COMPANY.line,
    does: COMPANY.does,
    forWhom: COMPANY.forWhom,
    stage: COMPANY.stage,
  };
}

export function newCampaign(state: DemoState, goal: Goal): void {
  const pack = PACKS[goal];
  state.campaign = {
    goal,
    phase: 'who',
    who: pack.who,
    learn: pack.learn,
    isp: pack.isp.map(row => [...row] as const),
    guide: [...pack.guide],
    round: 1,
    roundStart: 1,
    day: 0,
    prospects: [],
    edits: {},
    threads: [],
    meetings: [],
    schedule: [],
    summaries: [],
    refined: [],
    dropped: 0,
  };
}

// ----- Several campaigns -----

/** Every campaign the customer has, in a stable order. */
export function allCampaigns(state: DemoState): Campaign[] {
  const list = [...(state.campaign ? [state.campaign] : []), ...state.others];
  const order = Object.keys(PACKS);
  return list.sort((a, b) => order.indexOf(a.goal) - order.indexOf(b.goal));
}

export function isLaunched(c: Campaign): boolean {
  return c.phase === 'running' || c.phase === 'review' || c.phase === 'stopped';
}

export function launchedCampaigns(state: DemoState): Campaign[] {
  return allCampaigns(state).filter(isLaunched);
}

/** Show another campaign on the screens. */
export function focusCampaign(state: DemoState, goal: Goal): void {
  const target = state.others.find(c => c.goal === goal);
  if (!target) return;
  state.others = state.others.filter(c => c !== target);
  if (state.campaign) state.others.push(state.campaign);
  state.campaign = target;
}

/** Start setup for a new campaign. The running ones stay as they are. */
export function beginNewCampaign(state: DemoState): void {
  if (state.campaign) state.others.push(state.campaign);
  state.campaign = null;
  state.lastEvents = [];
}

/** Leave the goal step without starting a campaign. */
export function cancelNewCampaign(state: DemoState): void {
  state.campaign = state.others.pop() ?? null;
}

/** Log entries written while a campaign is in focus belong to it. */
export function stampLog(state: DemoState): void {
  const goal = state.campaign?.goal;
  for (const entry of state.log) {
    if (entry.goal) break;
    entry.goal = goal;
  }
}

function sharedDay(state: DemoState, c: Campaign): number {
  return Math.max(0, ...allCampaigns(state).filter(o => o !== c && isLaunched(o)).map(o => o.day));
}

export function generateList(state: DemoState): void {
  const c = state.campaign;
  if (!c) return;
  const pack = packOf(c);
  c.prospects = buildList(pack, 1, pack.heroes, ['core', 'core', 'big', 'core', 'off', 'core', 'big'], 0, targetCount(state));
  c.dropped = 2;
  c.phase = 'list';
}

export function refineList(state: DemoState, drops: Seg, doneTemplate: string): string {
  const c = state.campaign;
  if (!c) return '';
  const pack = packOf(c);
  let n = 0;
  const round = c.round;
  c.prospects = c.prospects
    .map(p => {
      if (p.round !== round || p.seg !== drops || p.heroKey) return p;
      n += 1;
      return fillerProspect(pack, round, 'core', p.order, 2);
    })
    .sort((a, b) => (a.round === b.round ? b.fit - a.fit : a.round - b.round))
    .map((p, i) => ({...p, order: i}));
  const text = fill(doneTemplate, {n: String(n)});
  c.refined.push(text);
  return text;
}

export function rerankList(state: DemoState, ask: string): string {
  const c = state.campaign;
  if (!c) return '';
  const pack = packOf(c);
  const match = pack.refines.find(item => item.match.test(ask));
  if (match) return refineList(state, match.drops, match.done);
  const text = `Re-scored the list against "${ask}". The order changed, and the count stayed at ${c.prospects.filter(p => p.round === c.round).length}.`;
  for (const p of c.prospects) {
    if (p.round === c.round && !p.heroKey) p.fit = Math.min(98, Math.max(40, p.fit + (hash(p.id + ask) % 7) - 3));
  }
  c.prospects.sort((a, b) => (a.round === b.round ? b.fit - a.fit : a.round - b.round));
  c.refined.push(text);
  return text;
}

export function kept(c: Campaign, round = c.round): Prospect[] {
  return c.prospects.filter(p => p.round === round && p.kept);
}

export function openConflicts(c: Campaign): Prospect[] {
  return kept(c).filter(p => p.conflict);
}

export function resolveConflict(state: DemoState, id: string, keep: boolean): void {
  const p = state.campaign?.prospects.find(item => item.id === id);
  if (!p) return;
  p.conflict = undefined;
  p.kept = keep;
}

// ----- Messages -----

export function stepBody(c: Campaign, p: Prospect, step: 1 | 2 | 3, founder: string): string {
  const key = `${p.id}:${step}`;
  if (c.edits[key] !== undefined) return c.edits[key];
  const pack = packOf(c);
  const first = p.name.split(' ')[0];
  const values = {first, company: p.company, hook: p.hook, founder: founder.split(' ')[0]};
  return fill(step === 1 ? pack.intro : step === 2 ? pack.linkedin : pack.followUp, values);
}

export function subjectOf(c: Campaign, p: Prospect): string {
  return fill(packOf(c).subject, {company: p.company});
}

// ----- Clock -----

export function launch(state: DemoState): void {
  const c = state.campaign;
  if (!c) return;
  c.phase = 'running';
  // A new round starts on the customer's current day, so campaigns keep one clock.
  const today = sharedDay(state, c);
  c.day = today ? Math.max(today, c.day) : Math.max(1, c.round === 1 ? 1 : c.day + 1);
  c.roundStart = c.day;
  assignScripts(c);
  const count = kept(c).length;
  state.log.unshift({
    day: c.day,
    text: `Round ${c.round} started with ${count} prospects. First messages go out today, in each person's working hours.`,
  });
  state.lastEvents = [`Round ${c.round} is live. The first ${Math.min(count, DAILY_FIRST_TOUCHES)} messages went out from your mailbox.`];
}

function heroMap(pack: Pack): Map<string, Hero> {
  return new Map([...pack.heroes, ...pack.referred, ...pack.round2].map(hero => [hero.key, hero]));
}

function assignScripts(c: Campaign): void {
  const pack = packOf(c);
  const heroes = heroMap(pack);
  for (const p of kept(c)) {
    const script = p.heroKey ? heroes.get(p.heroKey)?.script : undefined;
    if (script && script.replyDay > 0) {
      c.schedule.push({day: c.roundStart + script.replyDay - 1, type: 'reply', prospectId: p.id});
    }
  }
}

function scriptOf(c: Campaign, p: Prospect): Script | undefined {
  return p.heroKey ? heroMap(packOf(c)).get(p.heroKey)?.script : undefined;
}

export function isBlocked(state: DemoState, p: Prospect): boolean {
  return state.dnc.some(entry => {
    const value = entry.value.toLowerCase();
    return value === p.email || value === p.company.toLowerCase() || p.email.endsWith(`@${value}`) || value === p.name.toLowerCase();
  });
}

/** Absolute day of the first email for a prospect in the round. */
export function firstDay(c: Campaign, p: Prospect): number {
  if (p.startDay) return p.startDay;
  // Earlier rounds have finished sending, so the exact day no longer matters.
  const start = p.round === c.round ? c.roundStart : 1;
  if (p.heroKey) return start;
  const index = kept(c, p.round).findIndex(item => item.id === p.id);
  return start + Math.floor(Math.max(index, 0) / DAILY_FIRST_TOUCHES);
}

function localTime(p: Prospect, step: number): string {
  const h = hash(p.id + step);
  const hour = 8 + (h % 3);
  const minute = String(h % 60).padStart(2, '0');
  return `0${hour}:${minute}`.slice(-5);
}

export interface SendRow {
  prospect: Prospect;
  step: 1 | 2 | 3;
  day: number;
  channel: Channel;
  time: string;
  blocked: boolean;
  opened: boolean;
  stopped: boolean;
}

export function threadOf(c: Campaign, id: string): Thread | undefined {
  return c.threads.find(t => t.prospectId === id);
}

/** Every planned step for the current round, with what happened so far. */
export function sendRows(state: DemoState, c: Campaign): SendRow[] {
  const rows: SendRow[] = [];
  for (const p of kept(c)) {
    if (p.conflict) continue;
    const start = firstDay(c, p);
    const replyDay = threadOf(c, p.id)?.msgs.find(m => m.from === 'them')?.day ?? Infinity;
    ([[1, 0, 'Email'], [2, 3, 'LinkedIn'], [3, 7, 'Email']] as const).forEach(([step, offset, channel]) => {
      const day = start + offset;
      rows.push({
        prospect: p,
        step,
        day,
        channel,
        time: localTime(p, step),
        blocked: isBlocked(state, p),
        opened: hash(`${p.id}${step}`) % 100 < (p.heroKey ? 100 : 56),
        stopped: replyDay <= day,
      });
    });
  }
  return rows;
}

export interface Stats {
  contacted: number;
  opened: number;
  replied: number;
  booked: number;
  held: number;
  yes: number;
}

export function roundStats(state: DemoState, c: Campaign): Stats {
  const rows = sendRows(state, c).filter(r => r.day <= c.day && !r.stopped && (!r.blocked || threadOf(c, r.prospect.id)));
  const touched = new Set(rows.map(r => r.prospect.id));
  const opened = new Set(rows.filter(r => r.step === 1 && r.opened && r.day < c.day).map(r => r.prospect.id));
  const meetings = c.meetings.filter(m => m.round === c.round);
  return {
    contacted: touched.size,
    opened: opened.size,
    replied: c.threads.filter(t => t.round === c.round && t.msgs.some(m => m.from === 'them')).length,
    booked: new Set(meetings.map(m => m.prospectId)).size,
    held: meetings.filter(m => m.status === 'held').length,
    yes: meetings.filter(m => m.status === 'held' && m.verdict?.yes).length,
  };
}

function outgoing(c: Campaign, p: Prospect, state: DemoState, upToChannel: Channel, replyDay: number): Msg[] {
  const founder = state.user?.name ?? FOUNDER.name;
  const start = firstDay(c, p);
  const msgs: Msg[] = [{from: 'you', channel: 'Email', day: start, time: localTime(p, 1), body: stepBody(c, p, 1, founder), step: 'Step 1'}];
  if (upToChannel === 'LinkedIn' || replyDay > start + 3) {
    msgs.push({from: 'you', channel: 'LinkedIn', day: start + 3, time: localTime(p, 2), body: stepBody(c, p, 2, founder), step: 'Step 2'});
  }
  return msgs;
}

function mustWait(state: DemoState, script: Script | undefined, kind: 'book' | 'rebook' | 'refer'): boolean {
  if (state.level === 'all') return true;
  if (state.level === 'auto') return false;
  return kind === 'refer' || Boolean(script?.sensitive);
}

function writeDraft(state: DemoState, c: Campaign, thread: Thread, template: string, gap: number): void {
  const slotDay = c.day + gap;
  thread.slotDay = slotDay;
  thread.draft = fill(template, {slot1: fmtDay(state, slotDay), slot2: fmtDay(state, slotDay + 1)});
}

/** A draft that waited too long offers dates that have passed: refresh them. */
function refreshDrafts(state: DemoState, c: Campaign): void {
  for (const thread of c.threads) {
    const p = c.prospects.find(item => item.id === thread.prospectId);
    const script = p && scriptOf(c, p);
    if (!script || !thread.draft || !thread.slotDay || thread.slotDay > c.day + 1) continue;
    const template = thread.draftKind === 'rebook' ? script.rebookDraft : script.draft;
    if (template) writeDraft(state, c, thread, template, 2);
  }
}

function say(state: DemoState, events: string[], text: string): void {
  const c = state.campaign;
  events.push(text);
  state.log.unshift({day: c?.day ?? 0, text});
}

function arrive(state: DemoState, p: Prospect, events: string[]): void {
  const c = state.campaign;
  if (!c) return;
  const script = scriptOf(c, p);
  if (!script) return;
  if (isBlocked(state, p)) return;
  const msgs = outgoing(c, p, state, script.channel, c.day);
  msgs.push({from: 'them', channel: script.channel, day: c.day, time: localTime(p, 7), body: script.reply});
  const thread: Thread = {prospectId: p.id, round: p.round, label: script.label, labelWhy: script.labelWhy, msgs, lastDay: c.day};
  c.threads.push(thread);

  if (script.label === 'Unsubscribe') {
    state.dnc.unshift({value: p.name, why: `Unsubscribe reply, ${fmtDay(state, c.day)}. Added by Tymes.`, identifiers: `${p.email}, ${p.linkedin}`});
    say(state, events, `${p.name} asked to be removed. Tymes added them and every identifier to do-not-contact, and stopped the sequence.`);
    return;
  }
  if (script.label === 'Not now') {
    say(state, events, `${p.name} replied: not now. Labeled, and set to come back later.`);
    return;
  }
  if (script.label === 'Booking link') {
    if (state.bookingMode === 'auto') {
      bookFromLink(state, thread, p, c.day + (script.meetIn ?? 3), events);
    } else {
      thread.slots = [c.day + (script.meetIn ?? 3), c.day + (script.meetIn ?? 3) + 1];
      say(state, events, `${p.name} shared a booking link. Pick a time.`);
    }
    return;
  }
  if (!script.draft) return;
  const kind = script.refers ? 'refer' : 'book';
  writeDraft(state, c, thread, script.draft, script.meetIn ?? 3);
  thread.draftKind = kind;
  if (mustWait(state, script, kind)) {
    say(state, events, `${p.name} replied: ${script.label.toLowerCase()}. Tymes drafted an answer for you to approve.`);
  } else {
    say(state, events, `${p.name} replied: ${script.label.toLowerCase()}. Your approval level let Tymes answer on its own.`);
    approveDraft(state, p.id, undefined, events);
  }
}

function bookFromLink(state: DemoState, thread: Thread, p: Prospect, day: number, events: string[]): void {
  const c = state.campaign;
  if (!c) return;
  const script = scriptOf(c, p);
  thread.slots = undefined;
  thread.msgs.push({from: 'you', channel: 'Email', day: c.day, time: localTime(p, 8), body: `Booked ${fmtDay(state, day)}, ${script?.time ?? '14:00'}, on your link. Thanks, and speak then.`});
  bookMeeting(state, p, day, script?.time ?? '14:00', events);
}

function bookMeeting(state: DemoState, p: Prospect, day: number, time: string, events: string[]): void {
  const c = state.campaign;
  if (!c) return;
  c.meetings.push({
    id: `${p.id}-${day}`,
    prospectId: p.id,
    round: p.round,
    day,
    time,
    platform: 'Google Meet',
    status: 'upcoming',
  });
  say(state, events, `Meeting confirmed: ${p.name}, ${fmtDay(state, day)} at ${time}. It is on your calendar with a Google Meet link, and the brief is ready.`);
}

export function approveDraft(state: DemoState, id: string, text: string | undefined, events: string[] = state.lastEvents): void {
  const c = state.campaign;
  const thread = c && threadOf(c, id);
  const p = c?.prospects.find(item => item.id === id);
  if (!c || !thread || !p || !thread.draft) return;
  const script = scriptOf(c, p);
  thread.msgs.push({
    from: 'you',
    channel: thread.msgs[thread.msgs.length - 1].channel,
    day: c.day,
    time: localTime(p, 9),
    body: text ?? thread.draft,
  });
  const kind = thread.draftKind;
  thread.draft = undefined;
  thread.draftKind = undefined;
  thread.lastDay = c.day;

  if (kind === 'refer' && script?.refers) {
    const hero = heroMap(packOf(c)).get(script.refers);
    if (hero) {
      const added = {...heroProspect(hero, p.round, kept(c).length), startDay: c.day};
      c.prospects.push(added);
      c.schedule.push({day: c.day + 1, type: 'reply', prospectId: added.id});
      say(state, events, `${added.name} added to the list, through ${p.name}.`);
    }
    return;
  }
  c.schedule.push({day: c.day + 1, type: kind === 'rebook' ? 'rebookConfirm' : 'confirm', prospectId: id});
}

export function pickSlot(state: DemoState, id: string, day: number): void {
  const c = state.campaign;
  const thread = c && threadOf(c, id);
  const p = c?.prospects.find(item => item.id === id);
  if (!thread || !p) return;
  const events: string[] = [];
  bookFromLink(state, thread, p, day, events);
  state.lastEvents = events;
}

function resolveMeetings(state: DemoState, events: string[]): void {
  const c = state.campaign;
  if (!c) return;
  for (const m of c.meetings) {
    if (m.status !== 'upcoming' || m.day >= c.day) continue;
    const p = c.prospects.find(item => item.id === m.prospectId);
    const script = p && scriptOf(c, p);
    if (!p || !script) continue;
    if (script.outcome === 'missed' && !m.rebooked) {
      m.status = 'missed';
      const thread = threadOf(c, p.id);
      if (thread && script.rebookDraft) {
        writeDraft(state, c, thread, script.rebookDraft, 2);
        thread.draftKind = 'rebook';
        if (mustWait(state, script, 'rebook')) {
          say(state, events, `${p.name} did not join. No charge. Tymes drafted a new time for you to approve.`);
        } else {
          say(state, events, `${p.name} did not join. No charge. Tymes offered a new time.`);
          approveDraft(state, p.id, undefined, events);
        }
      }
      continue;
    }
    m.status = 'held';
    m.proof = script.proof ?? 'trust';
    m.verdict = script.verdict;
    m.transcript = script.transcript;
    say(state, events, `Meeting held: ${p.name}. 1 meeting used from your pack. Rate how it went.`);
  }
}

export function proofName(proof: Proof): string {
  if (proof === 'platform') return 'Proved by Google Meet attendance';
  if (proof === 'transcript') return 'Proved by the transcript';
  return 'Proved by trust: scheduled, and a positive reply';
}

function runSchedule(state: DemoState, events: string[]): void {
  const c = state.campaign;
  if (!c) return;
  const due = c.schedule.filter(e => e.day <= c.day);
  c.schedule = c.schedule.filter(e => e.day > c.day);
  for (const event of due) {
    const p = c.prospects.find(item => item.id === event.prospectId);
    if (!p) continue;
    const script = scriptOf(c, p);
    const thread = threadOf(c, p.id);
    if (event.type === 'reply') {
      arrive(state, p, events);
    } else if (script && thread) {
      const isRebook = event.type === 'rebookConfirm';
      const day = Math.max(thread.slotDay ?? c.day + 1, c.day + 1);
      const slots = {slot1: fmtDay(state, day), slot2: fmtDay(state, day + 1)};
      const template = isRebook ? script.rebookConfirm : script.confirm;
      thread.msgs.push({from: 'them', channel: thread.msgs[0].channel, day: c.day, time: localTime(p, 10), body: fill(template ?? '{slot1} works.', slots)});
      thread.lastDay = c.day;
      bookMeeting(state, p, day, script.time ?? '10:00', events);
      if (isRebook) {
        const added = c.meetings[c.meetings.length - 1];
        added.rebooked = true;
      }
    }
  }
}

function fillerArrivals(state: DemoState, events: string[]): void {
  const c = state.campaign;
  if (!c) return;
  let quiet = 0;
  for (const p of kept(c)) {
    if (p.heroKey || p.conflict || threadOf(c, p.id) || isBlocked(state, p)) continue;
    const seed = hash(`reply:${p.id}`);
    if (seed % 100 >= 14) continue;
    if (firstDay(c, p) + 2 + (seed % 5) !== c.day) continue;
    const [label, reply, why] = FILLER_REPLIES[(seed >>> 8) % FILLER_REPLIES.length];
    c.threads.push({
      prospectId: p.id,
      round: p.round,
      label,
      labelWhy: why,
      msgs: [
        ...outgoing(c, p, state, 'Email', c.day),
        {from: 'them', channel: 'Email', day: c.day, time: localTime(p, 7), body: reply},
      ],
      lastDay: c.day,
    });
    quiet += 1;
  }
  if (quiet) {
    say(state, events, `${quiet} more ${quiet === 1 ? 'reply' : 'replies'} came in and ${quiet === 1 ? 'was' : 'were'} labeled. Nothing needed from you.`);
  }
}

export function canAdvance(c: Campaign): boolean {
  return c.phase === 'running' && roundDay(c) < MAX_ROUND_DAY;
}

export function canAdvanceAny(state: DemoState): boolean {
  return !packBlocksClock(state) && allCampaigns(state).some(canAdvance);
}

// ----- Meeting packs -----

export function buyMeetingPack(state: DemoState, size: MeetingPackSize): void {
  const today = state.campaign ? fmtDay(state, state.campaign.day) : 'At signup';
  state.meetingPacks.push({size, paidWith: state.payment?.label ?? '', bought: today});
}

/** Only a held meeting uses the pack. Missed and upcoming ones use nothing. */
export function meetingsUsed(state: DemoState): number {
  return allCampaigns(state).flatMap(c => c.meetings).filter(m => m.status === 'held').length;
}

export function meetingsBought(state: DemoState): number {
  return state.meetingPacks.reduce((sum, pack) => sum + pack.size, 0);
}

export function meetingsLeft(state: DemoState): number {
  return meetingsBought(state) - meetingsUsed(state);
}

/** Ten targets for each meeting in the latest pack, or in the balance if that is larger. */
export function targetCount(state: DemoState): number {
  const latest = state.meetingPacks.at(-1)?.size ?? 0;
  return TARGETS_PER_MEETING * Math.max(latest, meetingsLeft(state));
}

/** Working days to send every first email, at the mailbox limit. */
export function firstSendDays(c: Campaign): number {
  return Math.ceil(kept(c).length / DAILY_FIRST_TOUCHES);
}

/** Work pauses at zero, and before a day that holds more meetings than the pack has left. */
export function packBlocksClock(state: DemoState): boolean {
  const due = allCampaigns(state)
    .filter(canAdvance)
    .flatMap(c => c.meetings.filter(m => m.status === 'upcoming' && m.day <= c.day)).length;
  const left = meetingsLeft(state);
  return left <= 0 || due > left;
}

const ROUTINE_EVENT = /^(\d+ messages went out\. No new replies|A quiet day)/;

/** One working day passes for every running campaign. */
export function advanceDay(state: DemoState): void {
  const focus = state.campaign;
  const running = allCampaigns(state).filter(canAdvance);
  if (!running.length || packBlocksClock(state)) return;
  const named = running.flatMap(c => {
    state.campaign = c;
    const events = advanceOne(state, c);
    stampLog(state);
    return running.length > 1 ? events.map(text => `${packOf(c).campaign}: ${text}`) : events;
  });
  state.campaign = focus;
  const isRoutine = (text: string) => ROUTINE_EVENT.test(text.replace(/^[^:]+: /, ''));
  state.lastEvents = [...named.filter(text => !isRoutine(text)), ...named.filter(isRoutine)];
}

function advanceOne(state: DemoState, c: Campaign): string[] {
  c.day += 1;
  const events: string[] = [];
  refreshDrafts(state, c);
  resolveMeetings(state, events);
  runSchedule(state, events);
  fillerArrivals(state, events);
  const sendsToday = sendRows(state, c).filter(r => r.day === c.day && !r.blocked && !r.stopped).length;
  if (sendsToday) {
    state.log.unshift({day: c.day, text: `${sendsToday} messages passed the policy gate and went out in each person's working hours.`});
  }
  if (!events.length) {
    events.push(sendsToday ? `${sendsToday} messages went out. No new replies today.` : 'A quiet day. Sequences are waiting on replies.');
  }
  if (roundDay(c) === ROUND_LENGTH) {
    say(state, events, `Round ${c.round} is done. Decide what happens next: continue, or stop.`);
  }
  return events;
}

// ----- Ratings -----

export function rateMeeting(state: DemoState, id: string, rating: 'good' | 'bad'): void {
  const c = state.campaign;
  const meeting = c?.meetings.find(m => m.id === id);
  if (!c || !meeting) return;
  const p = c.prospects.find(item => item.id === meeting.prospectId);
  if (!p) return;
  meeting.rating = rating;
  const text = `You rated your meeting with ${p.name}: ${rating === 'good' ? 'a good fit' : 'not a fit'}.`;
  state.log.unshift({day: c.day, text});
  state.lastEvents = [text];
}

// ----- Rounds -----

export function chooseRound(state: DemoState, choice: 'continue' | 'change' | 'stop'): void {
  const c = state.campaign;
  if (!c) return;
  const stats = roundStats(state, c);
  c.summaries = c.summaries.filter(s => s.round !== c.round);
  c.summaries.push({round: c.round, ...stats, isp: c.isp.map(row => row[1]).join(' · ')});
  if (choice === 'stop') {
    c.phase = 'stopped';
    state.log.unshift({day: c.day, text: 'You stopped the campaign. No more messages will go out.'});
    state.lastEvents = ['Campaign stopped. Nothing more will go out.'];
    return;
  }
  const pack = packOf(c);
  if (choice === 'change') {
    c.isp = c.isp.map(row => {
      const change = pack.ispChanges.find(item => item[0] === row[0]);
      return change ? ([row[0], change[2]] as const) : row;
    });
  }
  c.round += 1;
  c.roundChoice = choice;
  const heroes = c.round === 2 ? pack.round2 : [];
  const segs: readonly Seg[] = choice === 'change' ? ['core'] : ['core', 'core', 'big', 'core', 'off'];
  c.prospects.push(...buildList(pack, c.round, heroes, segs, choice === 'change' ? 8 : 2, targetCount(state)));
  c.refined = [];
  c.phase = 'review';
  state.lastEvents = [`Tymes wrote a fresh list of ${targetCount(state)} for round ${c.round}, with the same ISP. Review it before anything goes out.`];
  state.log.unshift({day: c.day, text: `Round ${c.round} list is ready for review.`});
}

// ----- Tasks -----

export interface Task {
  id: string;
  kind: 'draft' | 'slot' | 'rate' | 'brief' | 'conflict' | 'round' | 'budget' | 'pack' | 'review';
  title: string;
  detail: string;
  href: string;
  action: string;
}

export function budgetUsed(state: DemoState): number {
  const live = allCampaigns(state).filter(c => c.day >= 1);
  if (!live.length) return 4;
  const used = live.reduce((sum, c) => sum + 8 + ((c.day - c.roundStart + 1 + (c.round - 1) * ROUND_LENGTH) * 62) / ROUND_LENGTH + c.meetings.length * 2, 0);
  // The sample budget is set per campaign.
  return Math.min(99, Math.round((used * 100) / (state.budgetCap * live.length)));
}

export function getTasks(state: DemoState): Task[] {
  const c = state.campaign;
  if (!c) return [];
  const find = (id: string) => c.prospects.find(p => p.id === id);
  const tasks: Task[] = [];
  for (const t of c.threads) {
    const p = find(t.prospectId);
    if (!p) continue;
    if (t.slots) {
      tasks.push({id: `slot-${p.id}`, kind: 'slot', title: `Pick a time with ${p.name}`, detail: `${p.role}, ${p.company}. They shared a booking link.`, href: `#/inbox/${p.id}`, action: 'Pick a time'});
    }
    if (t.draft) {
      tasks.push({id: `draft-${p.id}`, kind: 'draft', title: `Approve the reply to ${p.name}`, detail: `${p.role}, ${p.company}. Labeled: ${t.label}.`, href: `#/inbox/${p.id}`, action: 'Review'});
    }
  }
  for (const m of c.meetings) {
    const p = find(m.prospectId);
    if (!p) continue;
    if (m.status === 'held' && !m.rating) {
      tasks.push({id: `rate-${m.id}`, kind: 'rate', title: `Rate your meeting with ${p.name}`, detail: 'Was it a good fit?', href: `#/meetings/${m.id}`, action: 'Rate'});
    }
    if (m.status === 'upcoming' && m.day <= c.day + 1) {
      tasks.push({id: `brief-${m.id}`, kind: 'brief', title: `Read the brief for ${p.name}`, detail: `${fmtDay(state, m.day)} at ${m.time}, on ${m.platform}.`, href: `#/meetings/${m.id}`, action: 'Open brief'});
    }
  }
  if (c.phase === 'running') {
    for (const p of openConflicts(c)) {
      tasks.push({id: `conflict-${p.id}`, kind: 'conflict', title: `Check who ${p.name} is`, detail: p.conflict ?? '', href: '#/campaigns/prospects', action: 'Check'});
    }
    if (roundDay(c) >= ROUND_LENGTH) {
      tasks.push({id: 'round', kind: 'round', title: `Round ${c.round} is done: decide what is next`, detail: 'Continue with a fresh list, or stop.', href: '#/campaigns/act', action: 'Decide'});
    }
  }
  if (c.phase === 'review') {
    tasks.push({id: 'review', kind: 'review', title: `Review the list for round ${c.round}`, detail: 'Nothing goes out until you approve it.', href: '#/campaigns/act', action: 'Review'});
  }
  if (budgetUsed(state) >= 80) {
    tasks.push({id: 'budget', kind: 'budget', title: 'Your AI budget is over 80%', detail: 'At 100%, AI jobs pause, except meetings in progress.', href: '#/settings/budget', action: 'Open budget'});
  }
  const left = meetingsLeft(state);
  if (packBlocksClock(state)) {
    tasks.push({id: 'pack', kind: 'pack', title: left <= 0 ? 'Your meeting pack is used up' : `Only ${left} ${left === 1 ? 'meeting' : 'meetings'} left, and more are due`, detail: 'Work is paused until you buy another pack.', href: '#/settings/billing', action: 'Buy a pack'});
  } else if (left <= LOW_PACK) {
    tasks.push({id: 'pack', kind: 'pack', title: `${left} ${left === 1 ? 'meeting' : 'meetings'} left in your pack`, detail: 'Work pauses when the pack runs out.', href: '#/settings/billing', action: 'Buy a pack'});
  }
  return tasks;
}

/** Tasks from every campaign. The budget and the pack are the customer's, so each appears once. */
export function allTasks(state: DemoState): (Task & {goal: Goal})[] {
  const seen = new Set<string>();
  return launchedCampaigns(state).flatMap(c =>
    getTasks({...state, campaign: c, others: allCampaigns(state).filter(o => o !== c)})
      .filter(t => (t.kind !== 'budget' && t.kind !== 'pack') || !seen.has(t.kind))
      .map(t => {
        seen.add(t.kind);
        return {...t, goal: c.goal};
      }),
  );
}

export function campaignInboxCount(c: Campaign): number {
  return c.threads.filter(t => t.draft || t.slots).length;
}

export function inboxCount(state: DemoState): number {
  return launchedCampaigns(state).reduce((sum, c) => sum + campaignInboxCount(c), 0);
}

export function nextHint(state: DemoState): string {
  const c = state.campaign;
  if (!c || c.phase === 'goal') return '';
  if (packBlocksClock(state)) return 'Work is paused. Buy another meeting pack in Settings, Billing.';
  if (c.phase === 'stopped' && !canAdvanceAny(state)) return 'The campaign is stopped.';
  if (c.phase === 'review') return `Open Act to review the round ${c.round} list, then launch it.`;
  const tasks = allTasks(state);
  const first = tasks.find(t => t.kind === 'draft' || t.kind === 'slot' || t.kind === 'rate' || t.kind === 'round');
  if (first) return `Next: ${first.title.charAt(0).toLowerCase()}${first.title.slice(1)}.`;
  return 'Nothing needs you. Tymes is working through the sequence.';
}

// ----- Jump ahead -----

/** Build a running campaign through the same steps a user takes. */
export function seedRunning(goal: Goal, targetRoundDay: number): DemoState {
  const state = initialState();
  state.user = {name: FOUNDER.name, email: FOUNDER.email, method: 'Google'};
  state.payment = {kind: 'promo', label: 'Promo code BETA2026'};
  buyMeetingPack(state, 20);
  startProfile(state);
  state.connectors = {gmail: true, gcal: true, meet: true, tymes: true, linkedin: true};
  state.connected = true;
  newCampaign(state, goal);
  generateList(state);
  const c = state.campaign as Campaign;
  for (const p of openConflicts(c)) resolveConflict(state, p.id, true);
  launch(state);
  forwardTo(state, targetRoundDay);
  return state;
}

/** Move the clock, doing the founder's chores, and leave today's chores open. */
export function forwardTo(state: DemoState, targetRoundDay: number): void {
  const focus = state.campaign;
  if (!focus) return;
  while (roundDay(focus) < targetRoundDay && canAdvance(focus) && !packBlocksClock(state)) {
    for (const c of allCampaigns(state).filter(canAdvance)) {
      state.campaign = c;
      for (const t of [...c.threads]) {
        if (t.draft) approveDraft(state, t.prospectId, undefined, []);
        if (t.slots) pickSlot(state, t.prospectId, t.slots[0]);
      }
      for (const m of c.meetings) {
        if (m.status === 'held' && !m.rating) rateMeeting(state, m.id, m.verdict?.yes ? 'good' : 'bad');
      }
      stampLog(state);
    }
    state.campaign = focus;
    advanceDay(state);
  }
}

export {COMPANY, FOUNDER, PACKS};
export type {Goal, Hero, Label, Pack, Seg, Verdict};
