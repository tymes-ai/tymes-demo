// Every person, company, and result in this file is made up.
// Email domains use the reserved `.example` TLD on purpose.

export type Goal = 'customers' | 'investors' | 'partners';
export type Label =
  | 'Interested'
  | 'Booking link'
  | 'Referral'
  | 'Not now'
  | 'Not interested'
  | 'Unsubscribe'
  | 'Out of office';
export type Channel = 'Email' | 'LinkedIn';
export type Seg = 'core' | 'big' | 'off';
export type Proof = 'platform' | 'transcript' | 'trust';

export interface Verdict {
  readonly yes: boolean;
  readonly reason: string;
  readonly quote: string;
}

export interface Script {
  readonly replyDay: number;
  readonly channel: Channel;
  readonly label: Label;
  readonly labelWhy: string;
  readonly reply: string;
  /** What Tymes drafts back. {slot1} and {slot2} become real dates. */
  readonly draft?: string;
  /** Under "approve some", this one still waits for the founder. */
  readonly sensitive?: boolean;
  readonly confirm?: string;
  readonly meetIn?: number;
  readonly time?: string;
  readonly outcome?: 'held' | 'missed';
  readonly rebookDraft?: string;
  readonly rebookConfirm?: string;
  readonly proof?: Proof;
  readonly verdict?: Verdict;
  readonly transcript?: readonly (readonly [string, string])[];
  readonly refers?: string;
}

export interface Hero {
  readonly key: string;
  readonly name: string;
  readonly role: string;
  readonly company: string;
  readonly city: string;
  readonly tz: string;
  readonly detail: string;
  readonly seg: Seg;
  readonly fit: number;
  readonly why: string;
  readonly hook: string;
  readonly source: string;
  readonly script?: Script;
  readonly conflict?: string;
}

export interface Refine {
  readonly key: string;
  readonly label: string;
  readonly drops: Seg;
  readonly match: RegExp;
  readonly done: string;
}

export interface Pack {
  readonly goal: Goal;
  readonly goalName: string;
  readonly goalLine: string;
  readonly campaign: string;
  readonly personNoun: string;
  readonly yesLabel: string;
  readonly who: string;
  readonly learn: string;
  readonly samples: readonly string[];
  readonly isp: readonly (readonly [string, string])[];
  readonly guideName: string;
  readonly guide: readonly string[];
  readonly roles: Readonly<Record<Seg, readonly string[]>>;
  readonly details: Readonly<Record<Seg, readonly string[]>>;
  readonly suffixes: readonly string[];
  readonly fillerHook: Readonly<Record<Seg, string>>;
  readonly fillerWhy: Readonly<Record<Seg, string>>;
  readonly subject: string;
  readonly intro: string;
  readonly linkedin: string;
  readonly followUp: string;
  readonly refines: readonly Refine[];
  readonly heroes: readonly Hero[];
  readonly referred: readonly Hero[];
  readonly round2: readonly Hero[];
  readonly pattern: {
    readonly line: string;
    readonly next: string;
  };
  readonly ispChanges: readonly (readonly [string, string, string])[];
}

export const COMPANY = {
  name: 'Acme',
  site: 'acme.example',
  line: 'Month-end close software for small finance teams.',
  does: 'Acme pulls bank feeds, invoices, and spreadsheets into one close checklist, so a finance team of two can finish the books in three days instead of nine.',
  forWhom: 'Finance leads at companies with 10 to 50 people, still closing in spreadsheets.',
  stage: 'Pre-seed. Private beta with a handful of design partners.',
  sources: [
    'acme.example: home page',
    'acme.example/product',
    'acme.example/about',
    'Founder posts on LinkedIn',
    'Public company listings',
  ],
};

export const FOUNDER = {
  name: 'Lena Hart',
  email: 'lena@acme.example',
};

const CUSTOMERS: Pack = {
  goal: 'customers',
  goalName: 'Customer interviews',
  goalLine: 'Talk to people who have the problem, before you build more.',
  campaign: 'Finance leads',
  personNoun: 'customer',
  yesLabel: 'Real potential customer',
  who: 'Finance leads at software and services companies with 10 to 200 people, who own month-end close themselves.',
  learn: 'How long the close takes, what breaks, what they have already tried, and what fixing it would be worth.',
  samples: [
    'linkedin.example/in/cfo-fintech',
    'linkedin.example/in/controller-saas',
    'linkedin.example/in/head-of-finance',
  ],
  isp: [
    ['Titles', 'CFO, VP Finance, Head of Finance, Controller'],
    ['Companies', 'Software and services, 10 to 200 people'],
    ['Signal', 'Hiring finance roles, new entities, or public posts about close'],
    ['Leave out', 'Your customers, your board, and accounting firms'],
  ],
  guideName: 'Interview guide',
  guide: [
    'Walk me through your last month-end close.',
    'Which step took the longest, and why?',
    'What have you tried to speed it up?',
    'If close took three days instead of nine, what would change?',
    'Who else would have to agree before you changed how you close?',
  ],
  roles: {
    core: ['Head of Finance', 'Controller', 'Finance Manager', 'CFO'],
    big: ['VP Finance', 'Director of Finance', 'Group Controller'],
    off: ['Finance Partner', 'Head of Finance', 'Fractional CFO'],
  },
  details: {
    core: ['22 people · Software', '38 people · Fintech', '46 people · Services', '31 people · Software', '17 people · Marketplace'],
    big: ['180 people · Software', '160 people · Logistics', '140 people · Services'],
    off: ['60 people · Close run by an outside firm', '45 people · Outsourced bookkeeping'],
  },
  suffixes: ['Pay', 'Works', 'Cloud', 'Labs', 'Freight', 'Health', 'Ledger', 'Systems', 'Goods', 'Studio'],
  fillerHook: {
    core: 'I saw {company} is hiring its first finance analyst. That usually means month-end close has started to hurt.',
    big: 'I saw {company} added a second entity this year, which tends to make close longer.',
    off: 'I saw {company} moved to a new accounting system this year.',
  },
  fillerWhy: {
    core: 'Small team, owns close, still hiring for it.',
    big: 'Owns close, but the team may be too large to feel it.',
    off: 'Close may be run by an outside firm.',
  },
  subject: 'how {company} runs month-end close',
  intro:
    'Hi {first},\n\n{hook}\n\nI run Acme, and I am trying to learn how small finance teams handle close today. I am not selling anything yet.\n\nWould 20 minutes next week work?\n\n{founder}',
  linkedin:
    'Hi {first}, I emailed you last week about how {company} handles month-end close. Happy to ask here if that is easier. {founder}',
  followUp:
    'Hi {first}, one last note from me. If close is not yours to fix, who should I talk to instead?\n\n{founder}',
  refines: [
    {key: 'small', label: 'Only teams under 50 people', drops: 'big', match: /under|small|fewer|size|people/i, done: 'Swapped {n} larger companies for teams under 50.'},
    {key: 'inhouse', label: 'Leave out outsourced finance', drops: 'off', match: /outsourc|agency|firm|in.?house/i, done: 'Removed {n} people whose close is run by an outside firm.'},
  ],
  heroes: [
    {
      key: 'priya', name: 'Priya Raman', role: 'CFO', company: 'Kestrel Pay', city: 'London', tz: 'Europe/London', detail: '34 people · Fintech', seg: 'core', fit: 94,
      why: 'Owns month-end close at a finance team under 20. Posted about it in public.',
      hook: 'I read your post about close slipping to eleven days after Kestrel added its third entity.',
      source: 'Her LinkedIn post, 12 days ago',
      script: {
        replyDay: 2, channel: 'Email', label: 'Interested', labelWhy: 'Asks for times.', sensitive: true,
        reply: 'Hi Lena,\n\nYou caught me in the middle of it. Eleven was the good month. Happy to talk. What times do you have?\n\nPriya',
        draft: 'Hi Priya,\n\nThanks. I have {slot1} or {slot2}. Either is 20 minutes on Google Meet, and I will send the invite as soon as you pick.\n\nLena',
        confirm: '{slot1} works. Send the invite.\n\nPriya', meetIn: 3, time: '10:30', outcome: 'held', proof: 'platform',
        verdict: {yes: true, reason: 'Runs close in spreadsheets across three entities, nine to eleven days a month. Has budget, and asked to see a pilot.', quote: 'If you can get me to four days, I will find the money this quarter.'},
        transcript: [
          ['Lena', 'Walk me through your last close.'],
          ['Priya', 'Eleven days. Three entities, three spreadsheets, and one of me plus an analyst.'],
          ['Lena', 'Which step took the longest?'],
          ['Priya', 'Intercompany. I reconcile it by hand, then redo it when a late invoice lands.'],
          ['Lena', 'What have you tried?'],
          ['Priya', 'We trialled a big close tool. It needed a six-week setup, and we never finished it.'],
          ['Lena', 'What would three days change?'],
          ['Priya', 'If you can get me to four days, I will find the money this quarter.'],
        ],
      },
    },
    {
      key: 'tom', name: 'Tom Lindqvist', role: 'VP Finance', company: 'Aldergate Freight', city: 'Stockholm', tz: 'Europe/Stockholm', detail: '180 people · Logistics', seg: 'big', fit: 76,
      why: 'Owns close, though his team may be larger than the ISP aims for.',
      hook: 'I saw Aldergate opened a second region this year, which tends to make close longer.',
      source: 'Aldergate Freight news page',
      script: {
        replyDay: 3, channel: 'Email', label: 'Booking link', labelWhy: 'Shares a scheduling link.',
        reply: 'Hi Lena, sure. Grab a slot here: cal.example/tom-lindqvist\n\nTom',
        meetIn: 3, time: '14:00', outcome: 'held', proof: 'platform',
        verdict: {yes: false, reason: 'A six-person close team, and a close tool already bought. He wants better reporting, which is not your product.', quote: 'Close is fine. It is the board pack that keeps me up.'},
        transcript: [
          ['Lena', 'Walk me through your last close.'],
          ['Tom', 'Five days. Six people on it, and we use a dedicated tool.'],
          ['Lena', 'What still breaks?'],
          ['Tom', 'Nothing much. Close is fine. It is the board pack that keeps me up.'],
        ],
      },
    },
    {
      key: 'noor', name: 'Noor Haddad', role: 'Controller', company: 'Saltmarsh Health', city: 'Dubai', tz: 'Asia/Dubai', detail: '41 people · Services', seg: 'core', fit: 84,
      why: 'Controller at a small services company.',
      hook: 'I saw Saltmarsh is hiring its first finance analyst.',
      source: 'Saltmarsh Health careers page',
      script: {
        replyDay: 3, channel: 'Email', label: 'Unsubscribe', labelWhy: 'Asks not to be contacted.',
        reply: 'Please remove me from your list.',
      },
    },
    {
      key: 'ana', name: 'Ana Sousa', role: 'Head of Finance', company: 'Brisa', city: 'Lisbon', tz: 'Europe/Lisbon', detail: '27 people · Software', seg: 'core', fit: 88,
      why: 'Runs a finance team of two, with audit under way.',
      hook: 'I saw Brisa closed its Series A, and is about to go through its first audit.',
      source: 'Brisa blog',
      script: {
        replyDay: 4, channel: 'Email', label: 'Not now', labelWhy: 'Interested, but gives a later date.',
        reply: 'Hi Lena, good topic, bad timing. We are in audit until January. Ask me again then?\n\nAna',
      },
    },
    {
      key: 'maya', name: 'Maya Okafor', role: 'CFO', company: 'Ledgerline', city: 'Lagos', tz: 'Africa/Lagos', detail: '29 people · Fintech', seg: 'core', fit: 91,
      why: 'First finance hire, and closes the books herself.',
      hook: 'I saw your talk on running finance at a team of thirty.',
      source: 'Conference talk summary',
      script: {
        replyDay: 5, channel: 'LinkedIn', label: 'Interested', labelWhy: 'Agrees to talk, on LinkedIn after the second step.',
        reply: 'Saw your email and ignored it, sorry. This one got me. Yes, happy to talk.',
        draft: 'Thanks Maya. Does {slot1} or {slot2} suit you? 20 minutes on Google Meet.\n\nLena',
        confirm: '{slot1} is good.', meetIn: 2, time: '16:00', outcome: 'missed',
        rebookDraft: 'Hi Maya, I think we missed each other today. No problem at all. Would {slot1} work instead?\n\nLena',
        rebookConfirm: 'So sorry, month-end. Yes, {slot1} works.', proof: 'transcript',
        verdict: {yes: true, reason: 'Closes the books in spreadsheets nine days every month, and would pay to get that to three.', quote: 'Nine days, every month, just me. I would pay to get that to three.'},
        transcript: [
          ['Lena', 'Walk me through your last close.'],
          ['Maya', 'Nine days, every month, just me. I would pay to get that to three.'],
          ['Lena', 'What have you tried?'],
          ['Maya', 'Templates and more templates. They break whenever we add a bank account.'],
        ],
      },
    },
    {
      key: 'daniel', name: 'Daniel Reyes', role: 'Head of Finance', company: 'Corvo', city: 'Madrid', tz: 'Europe/Madrid', detail: '60 people · Software', seg: 'off', fit: 72,
      why: 'Finance title at the right size, but the books may be run elsewhere.',
      hook: 'I saw Corvo moved to a new accounting system this year.',
      source: 'Corvo careers page',
      script: {
        replyDay: 5, channel: 'Email', label: 'Interested', labelWhy: 'Agrees to talk.',
        reply: 'Sure, happy to share what we do. Next week?\n\nDaniel',
        draft: 'Thanks Daniel. How about {slot1} or {slot2}?\n\nLena',
        confirm: '{slot1} is fine.', meetIn: 3, time: '11:00', outcome: 'held', proof: 'trust',
        verdict: {yes: false, reason: 'Finance is outsourced to an agency, so the close is not his to fix.', quote: 'Honestly, our agency does all of that. I just sign it off.'},
        transcript: [
          ['Lena', 'Walk me through your last close.'],
          ['Daniel', 'Honestly, our agency does all of that. I just sign it off.'],
        ],
      },
    },
    {
      key: 'ben', name: 'Ben Asante', role: 'Finance Manager', company: 'Tarn Logistics', city: 'Accra', tz: 'Africa/Accra', detail: '48 people · Logistics', seg: 'core', fit: 81,
      why: 'Finance manager at a small logistics company.',
      hook: 'I saw Tarn opened a third depot this year.',
      source: 'Tarn Logistics news page',
      script: {
        replyDay: 6, channel: 'Email', label: 'Referral', labelWhy: 'Names a colleague who owns the problem.',
        reply: 'Not really me. Ife Bello, our controller, owns close. I have copied her in.\n\nBen',
        draft: 'Thanks Ben. Hi Ife, I am trying to learn how small finance teams handle month-end close. Could we talk for 20 minutes next week?\n\nLena',
        refers: 'ife',
      },
    },
    {
      key: 'julia', name: 'Julia Stern', role: 'Controller', company: 'Fathom Retail', city: 'Berlin', tz: 'Europe/Berlin', detail: '36 people · Retail software', seg: 'core', fit: 79,
      why: 'Controller at the right size of company.',
      hook: 'I saw Fathom is hiring in finance.',
      source: 'Fathom Retail careers page',
      conflict: 'Her email says Fathom Retail. Her LinkedIn says she moved to Pine Street Goods in August.',
    },
  ],
  referred: [
    {
      key: 'ife', name: 'Ife Bello', role: 'Controller', company: 'Tarn Logistics', city: 'Accra', tz: 'Africa/Accra', detail: '48 people · Logistics', seg: 'core', fit: 90,
      why: 'Named by a colleague as the owner of close.',
      hook: 'Ben suggested I talk to you.',
      source: 'Referred by Ben Asante',
      script: {
        replyDay: 0, channel: 'Email', label: 'Interested', labelWhy: 'Agrees to talk.',
        reply: 'Happy to. Close is a sore subject here.\n\nIfe',
        draft: 'Thanks Ife. Would {slot1} or {slot2} suit you?\n\nLena',
        confirm: '{slot1}, thanks.', meetIn: 2, time: '09:30', outcome: 'held', proof: 'platform',
        verdict: {yes: true, reason: 'Owns close at a team of two. Eight days a month, and three depots report late.', quote: 'I chase depot managers for receipts for three days before I can even start.'},
        transcript: [
          ['Lena', 'Which step took the longest?'],
          ['Ife', 'I chase depot managers for receipts for three days before I can even start.'],
          ['Lena', 'What would change if that went away?'],
          ['Ife', 'I would have a life in the first week of the month.'],
        ],
      },
    },
  ],
  round2: [
    {
      key: 'wei', name: 'Wei Lin', role: 'Head of Finance', company: 'Brightmoor Cloud', city: 'Singapore', tz: 'Asia/Singapore', detail: '24 people · Software', seg: 'core', fit: 96,
      why: 'Team of two, closes in spreadsheets, three entities. Matches the people who said yes in round 1.',
      hook: 'I saw Brightmoor just added entities in two new countries.',
      source: 'Brightmoor Cloud news page',
      script: {
        replyDay: 2, channel: 'Email', label: 'Interested', labelWhy: 'Asks for times.',
        reply: 'Yes please. Three entities and two of us. When?\n\nWei',
        draft: 'Thanks Wei. Would {slot1} or {slot2} suit you?\n\nLena',
        confirm: '{slot1}.', meetIn: 2, time: '09:00', outcome: 'held', proof: 'platform',
        verdict: {yes: true, reason: 'Same pattern as round 1: spreadsheets, multiple entities, a team of two.', quote: 'We are basically the same as the CFO you described.'},
        transcript: [
          ['Lena', 'Walk me through your last close.'],
          ['Wei', 'Ten days. Three entities, spreadsheets. We are basically the same as the CFO you described.'],
        ],
      },
    },
    {
      key: 'clara', name: 'Clara Weiss', role: 'Controller', company: 'Hollow Pine Works', city: 'Vienna', tz: 'Europe/Vienna', detail: '19 people · Services', seg: 'core', fit: 93,
      why: 'Sole finance person, closes in spreadsheets.',
      hook: 'I saw you are the only finance person at Hollow Pine.',
      source: 'Her LinkedIn profile',
      script: {
        replyDay: 3, channel: 'Email', label: 'Interested', labelWhy: 'Agrees to talk.',
        reply: 'You read that right. Happy to talk.\n\nClara',
        draft: 'Thanks Clara. Would {slot1} or {slot2} suit you?\n\nLena',
        confirm: '{slot1} please.', meetIn: 3, time: '15:30', outcome: 'held', proof: 'platform',
        verdict: {yes: true, reason: 'Closes alone in seven days and has already looked for a tool.', quote: 'I have looked for this. Everything is built for teams of twenty.'},
        transcript: [
          ['Lena', 'What have you tried?'],
          ['Clara', 'I have looked for this. Everything is built for teams of twenty.'],
        ],
      },
    },
  ],
  pattern: {
    line: '{yes} of {held} finance leads own month-end close with no tooling.',
    next: 'Both noes had close owned elsewhere: a bigger team, or an agency.',
  },
  ispChanges: [
    ['Companies', 'Software and services, 10 to 200 people', 'Software and services, 10 to 50 people'],
    ['Signal', 'Hiring finance roles, new entities, or public posts about close', 'More than one entity, and a finance team of three or fewer'],
    ['Leave out', 'Your customers, your board, and accounting firms', 'Also leave out anyone whose close is outsourced'],
  ],
};

const INVESTORS: Pack = {
  goal: 'investors',
  goalName: 'Investors',
  goalLine: 'Meet funds that invest at your stage, in your market.',
  campaign: 'Seed funds',
  personNoun: 'investor',
  yesLabel: 'Real potential investor',
  who: 'Partners at seed funds that lead rounds in B2B fintech and finance software, in Europe and the US.',
  learn: 'Whether they lead at our stage, how they think about finance software, and what they would need to see.',
  samples: [
    'linkedin.example/in/seed-partner',
    'linkedin.example/in/fintech-investor',
    'linkedin.example/in/principal',
  ],
  isp: [
    ['Titles', 'General Partner, Partner, Principal'],
    ['Funds', 'Seed and pre-seed, writing first checks'],
    ['Signal', 'Recent investments or posts about finance software'],
    ['Leave out', 'Current investors, and funds backing a direct competitor'],
  ],
  guideName: 'Meeting guide',
  guide: [
    'How do you think about finance software right now?',
    'Do you lead at pre-seed, and what size of check?',
    'What would you want to see from us in the next six months?',
    'Who else should we meet?',
  ],
  roles: {
    core: ['General Partner', 'Partner', 'Principal'],
    big: ['Partner', 'Managing Director'],
    off: ['Venture Partner', 'Scout', 'Investor'],
  },
  details: {
    core: ['Seed · B2B fintech', 'Pre-seed · Finance software', 'Seed · B2B software'],
    big: ['Multi-stage · Series B and later', 'Growth · Series C and later'],
    off: ['Generalist · No fintech deals', 'Angel syndicate · Follows only'],
  },
  suffixes: ['Capital', 'Ventures', 'Partners', 'Fund', 'Seed'],
  fillerHook: {
    core: 'I saw {company} backed two finance tools at seed last year.',
    big: 'I saw {company} wrote about finance software in its annual letter.',
    off: 'I saw {company} has been looking at fintech this year.',
  },
  fillerWhy: {
    core: 'Leads at seed, with finance software in the portfolio.',
    big: 'Knows the market, but invests much later.',
    off: 'May not lead, or has no fintech record.',
  },
  subject: 'month-end close, and {company}',
  intro:
    'Hi {first},\n\n{hook}\n\nI run Acme. We get small finance teams through month-end close in three days instead of nine. I am meeting a few seed investors ahead of a round.\n\nWould 20 minutes next week work?\n\n{founder}',
  linkedin: 'Hi {first}, I emailed you last week about Acme. Happy to talk here if you prefer. {founder}',
  followUp: 'Hi {first}, one last note from me. If this is not a fit for {company}, is there someone else you would point me to?\n\n{founder}',
  refines: [
    {key: 'stage', label: 'Only funds that lead at seed', drops: 'big', match: /seed|stage|lead|early/i, done: 'Swapped {n} later-stage funds for funds that lead at seed.'},
    {key: 'fintech', label: 'Must have a fintech deal', drops: 'off', match: /fintech|finance|sector|deal/i, done: 'Removed {n} investors with no fintech deals.'},
  ],
  heroes: [
    {
      key: 'helen', name: 'Helen Marsh', role: 'General Partner', company: 'Fieldnote Capital', city: 'London', tz: 'Europe/London', detail: 'Seed · B2B fintech', seg: 'core', fit: 95,
      why: 'Leads seed rounds, with two finance tools in the portfolio.',
      hook: 'I read your essay on why finance teams are the last to get good software.',
      source: 'Fieldnote Capital blog',
      script: {
        replyDay: 2, channel: 'Email', label: 'Interested', labelWhy: 'Asks for times.', sensitive: true,
        reply: 'Hi Lena, this is close to what I wrote about. Send me some times.\n\nHelen',
        draft: 'Thanks Helen. I have {slot1} or {slot2}. Which suits you?\n\nLena',
        confirm: '{slot1}, thanks.', meetIn: 3, time: '10:00', outcome: 'held', proof: 'platform',
        verdict: {yes: true, reason: 'Leads at this stage, knows the market, and asked for the design partner list.', quote: 'Send me your design partners, and let us talk again in two weeks.'},
        transcript: [
          ['Lena', 'How do you think about finance software right now?'],
          ['Helen', 'Small teams are underserved. Send me your design partners, and let us talk again in two weeks.'],
        ],
      },
    },
    {
      key: 'raj', name: 'Raj Patel', role: 'Partner', company: 'Tallowfield Growth', city: 'New York', tz: 'America/New_York', detail: 'Multi-stage · Series B and later', seg: 'big', fit: 70,
      why: 'Knows the market, but may invest much later.',
      hook: 'I saw Tallowfield wrote about finance software this year.',
      source: 'Tallowfield Growth annual letter',
      script: {
        replyDay: 3, channel: 'Email', label: 'Booking link', labelWhy: 'Shares a scheduling link.',
        reply: 'Happy to chat. Book here: cal.example/raj-patel\n\nRaj',
        meetIn: 3, time: '15:00', outcome: 'held', proof: 'platform',
        verdict: {yes: false, reason: 'Invests from Series B. Friendly, but cannot lead this round.', quote: 'Come back when you are at five million in revenue.'},
        transcript: [
          ['Lena', 'Do you lead at pre-seed?'],
          ['Raj', 'No. Come back when you are at five million in revenue.'],
        ],
      },
    },
    {
      key: 'sofia', name: 'Sofia Berg', role: 'Principal', company: 'Northwind Seed', city: 'Oslo', tz: 'Europe/Oslo', detail: 'Pre-seed · Finance software', seg: 'core', fit: 86,
      why: 'Pre-seed fund with a finance thesis.',
      hook: 'I saw Northwind backed a finance tool last spring.',
      source: 'Northwind Seed portfolio page',
      script: {replyDay: 3, channel: 'Email', label: 'Unsubscribe', labelWhy: 'Asks not to be contacted.', reply: 'We only take warm intros. Please take me off your list.'},
    },
    {
      key: 'amara', name: 'Amara Diallo', role: 'General Partner', company: 'Redwater Ventures', city: 'Paris', tz: 'Europe/Paris', detail: 'Seed · B2B software', seg: 'core', fit: 90,
      why: 'Leads seed rounds in B2B software.',
      hook: 'I heard your podcast on boring software with real budgets.',
      source: 'Podcast summary',
      script: {
        replyDay: 5, channel: 'LinkedIn', label: 'Interested', labelWhy: 'Agrees to talk, on LinkedIn after the second step.',
        reply: 'Boring software is my favorite. Yes, let us talk.',
        draft: 'Thanks Amara. Does {slot1} or {slot2} suit you?\n\nLena',
        confirm: '{slot1} works.', meetIn: 2, time: '16:30', outcome: 'missed',
        rebookDraft: 'Hi Amara, I think we missed each other today. Would {slot1} work instead?\n\nLena',
        rebookConfirm: 'Apologies, a board ran over. {slot1} is good.', proof: 'transcript',
        verdict: {yes: true, reason: 'Writes first checks, and already has a thesis on small finance teams.', quote: 'I have been looking for this exact company.'},
        transcript: [
          ['Lena', 'How do you think about finance software right now?'],
          ['Amara', 'I have been looking for this exact company.'],
        ],
      },
    },
    {
      key: 'theo', name: 'Theo Grant', role: 'Investor', company: 'Plainsong Fund', city: 'Boston', tz: 'America/New_York', detail: 'Generalist · No fintech deals', seg: 'off', fit: 68,
      why: 'Generalist who has been looking at fintech.',
      hook: 'I saw Plainsong has been looking at fintech this year.',
      source: 'Plainsong Fund blog',
      script: {replyDay: 4, channel: 'Email', label: 'Not now', labelWhy: 'Interested, but gives a later date.', reply: 'Fund is fully deployed until the spring. Try me then.\n\nTheo'},
    },
  ],
  referred: [],
  round2: [
    {
      key: 'ines', name: 'Ines Duarte', role: 'Partner', company: 'Quillpoint Ventures', city: 'Lisbon', tz: 'Europe/Lisbon', detail: 'Seed · B2B fintech', seg: 'core', fit: 96,
      why: 'Leads at seed, with a fintech thesis. Matches the investors who said yes in round 1.',
      hook: 'I saw Quillpoint led two finance rounds this year.',
      source: 'Quillpoint Ventures portfolio page',
      script: {
        replyDay: 2, channel: 'Email', label: 'Interested', labelWhy: 'Asks for times.',
        reply: 'Helen mentioned you. Let us talk.\n\nInes',
        draft: 'Thanks Ines. Would {slot1} or {slot2} suit you?\n\nLena',
        confirm: '{slot1}.', meetIn: 2, time: '11:00', outcome: 'held', proof: 'platform',
        verdict: {yes: true, reason: 'Leads at seed, and has the same thesis as the investors who said yes.', quote: 'If the design partners check out, I would like to look at this properly.'},
        transcript: [['Ines', 'If the design partners check out, I would like to look at this properly.']],
      },
    },
  ],
  pattern: {
    line: '{yes} of {held} investors lead at this stage and already have a view on finance software.',
    next: 'The noes invest far later, or have no fintech deals.',
  },
  ispChanges: [
    ['Funds', 'Seed and pre-seed, writing first checks', 'Seed funds that have led a finance software round'],
    ['Signal', 'Recent investments or posts about finance software', 'A finance software deal in the last 18 months'],
    ['Leave out', 'Current investors, and funds backing a direct competitor', 'Also leave out multi-stage funds'],
  ],
};

const PARTNERS: Pack = {
  goal: 'partners',
  goalName: 'Partners',
  goalLine: 'Find the firms that could bring you customers.',
  campaign: 'Fractional CFO firms',
  personNoun: 'partner',
  yesLabel: 'Real potential partner',
  who: 'Founders of fractional CFO and bookkeeping firms that serve small software companies.',
  learn: 'How they run close for clients, whether they would recommend a tool, and how a referral would work.',
  samples: [
    'linkedin.example/in/fractional-cfo',
    'linkedin.example/in/bookkeeping-founder',
    'linkedin.example/in/finance-ops-lead',
  ],
  isp: [
    ['Titles', 'Founder, Managing Partner, Head of Client Finance'],
    ['Firms', 'Fractional CFO and bookkeeping firms, 5 to 50 clients'],
    ['Signal', 'Clients in software, and public content on month-end close'],
    ['Leave out', 'Large accounting networks, and existing partners'],
  ],
  guideName: 'Meeting guide',
  guide: [
    'How do you run month-end close for your clients today?',
    'Which tools do you recommend, and why?',
    'What would make you recommend a new one?',
    'How would a referral or a revenue share work for you?',
  ],
  roles: {
    core: ['Founder', 'Managing Partner', 'Head of Client Finance'],
    big: ['Regional Partner', 'Director'],
    off: ['Consultant', 'Advisor'],
  },
  details: {
    core: ['12 clients · Software', '30 clients · Startups', '45 clients · Services'],
    big: ['400 clients · National network', '900 clients · Accounting network'],
    off: ['Solo advisor · Tax only', 'Solo advisor · Payroll only'],
  },
  suffixes: ['CFO', 'Advisory', 'Finance', 'Books', 'Partners'],
  fillerHook: {
    core: 'I saw {company} works mostly with small software companies.',
    big: 'I saw {company} has started a technology practice.',
    off: 'I saw {company} advises early-stage founders.',
  },
  fillerWhy: {
    core: 'Runs close for small software companies.',
    big: 'Large network, which may be slow to adopt.',
    off: 'Advises on tax or payroll, and may not run close.',
  },
  subject: 'month-end close for {company} clients',
  intro:
    'Hi {first},\n\n{hook}\n\nI run Acme. We get small finance teams through close in three days. I would like to learn how firms like yours handle it for clients, and whether there is a way to work together.\n\nWould 20 minutes next week work?\n\n{founder}',
  linkedin: 'Hi {first}, I emailed you last week about Acme and {company}. Happy to talk here if you prefer. {founder}',
  followUp: 'Hi {first}, one last note from me. If this is not for {company}, who else should I ask?\n\n{founder}',
  refines: [
    {key: 'firms', label: 'Only firms under 50 clients', drops: 'big', match: /under|small|client|size/i, done: 'Swapped {n} large networks for smaller firms.'},
    {key: 'close', label: 'Must run close for clients', drops: 'off', match: /close|run|tax|payroll/i, done: 'Removed {n} advisors who do not run close.'},
  ],
  heroes: [
    {
      key: 'rosa', name: 'Rosa Vidal', role: 'Founder', company: 'Candlewick CFO', city: 'Barcelona', tz: 'Europe/Madrid', detail: '30 clients · Startups', seg: 'core', fit: 93,
      why: 'Runs close for 30 startups, and writes about it.',
      hook: 'I read your post on why month-end takes your clients so long.',
      source: 'Candlewick CFO blog',
      script: {
        replyDay: 2, channel: 'Email', label: 'Interested', labelWhy: 'Asks for times.', sensitive: true,
        reply: 'Hi Lena, always looking at tools. What times work?\n\nRosa',
        draft: 'Thanks Rosa. I have {slot1} or {slot2}. Which suits you?\n\nLena',
        confirm: '{slot1}.', meetIn: 3, time: '12:00', outcome: 'held', proof: 'platform',
        verdict: {yes: true, reason: 'Runs close for 30 clients by hand, and would move them onto one tool.', quote: 'If it works for one of my clients, it goes to all thirty.'},
        transcript: [
          ['Lena', 'What would make you recommend a new tool?'],
          ['Rosa', 'If it works for one of my clients, it goes to all thirty.'],
        ],
      },
    },
    {
      key: 'greg', name: 'Greg Holt', role: 'Regional Partner', company: 'Stonebridge Advisory', city: 'Chicago', tz: 'America/Chicago', detail: '900 clients · Accounting network', seg: 'big', fit: 69,
      why: 'Large network, with a new technology practice.',
      hook: 'I saw Stonebridge has started a technology practice.',
      source: 'Stonebridge Advisory news page',
      script: {
        replyDay: 3, channel: 'Email', label: 'Booking link', labelWhy: 'Shares a scheduling link.',
        reply: 'Sure. Book here: cal.example/greg-holt\n\nGreg',
        meetIn: 3, time: '17:00', outcome: 'held', proof: 'platform',
        verdict: {yes: false, reason: 'New tools go through a national panel that meets once a year.', quote: 'Our panel looks at new vendors every November.'},
        transcript: [['Greg', 'Our panel looks at new vendors every November.']],
      },
    },
    {
      key: 'lucia', name: 'Lucia Moretti', role: 'Founder', company: 'Tidemark Books', city: 'Milan', tz: 'Europe/Rome', detail: '12 clients · Software', seg: 'core', fit: 85,
      why: 'Bookkeeping firm with software clients.',
      hook: 'I saw Tidemark works mostly with software companies.',
      source: 'Tidemark Books website',
      script: {replyDay: 3, channel: 'Email', label: 'Unsubscribe', labelWhy: 'Asks not to be contacted.', reply: 'Please do not email me again.'},
    },
    {
      key: 'kofi', name: 'Kofi Mensah', role: 'Managing Partner', company: 'Lantern Finance', city: 'Accra', tz: 'Africa/Accra', detail: '45 clients · Services', seg: 'core', fit: 89,
      why: 'Runs close for 45 service companies.',
      hook: 'I saw your talk on running finance for many small clients.',
      source: 'Conference talk summary',
      script: {
        replyDay: 5, channel: 'LinkedIn', label: 'Interested', labelWhy: 'Agrees to talk, on LinkedIn after the second step.',
        reply: 'Yes, this is a daily pain for us. Happy to talk.',
        draft: 'Thanks Kofi. Does {slot1} or {slot2} suit you?\n\nLena',
        confirm: '{slot1} works.', meetIn: 2, time: '13:00', outcome: 'missed',
        rebookDraft: 'Hi Kofi, I think we missed each other today. Would {slot1} work instead?\n\nLena',
        rebookConfirm: 'Sorry about that. {slot1} works.', proof: 'transcript',
        verdict: {yes: true, reason: 'Runs close for 45 clients, and offered to pilot with three.', quote: 'Give me three clients to try it on, and I will tell you in a month.'},
        transcript: [['Kofi', 'Give me three clients to try it on, and I will tell you in a month.']],
      },
    },
    {
      key: 'nina', name: 'Nina Larsen', role: 'Advisor', company: 'Fjord Advisory', city: 'Copenhagen', tz: 'Europe/Copenhagen', detail: 'Solo advisor · Tax only', seg: 'off', fit: 65,
      why: 'Advises early-stage founders.',
      hook: 'I saw Fjord advises early-stage founders.',
      source: 'Fjord Advisory website',
      script: {replyDay: 4, channel: 'Email', label: 'Not now', labelWhy: 'Interested, but gives a later date.', reply: 'Tax season. Ask me in April.\n\nNina'},
    },
  ],
  referred: [],
  round2: [
    {
      key: 'marek', name: 'Marek Novak', role: 'Founder', company: 'Plumbline CFO', city: 'Prague', tz: 'Europe/Prague', detail: '18 clients · Software', seg: 'core', fit: 95,
      why: 'Runs close for software startups. Matches the firms that said yes in round 1.',
      hook: 'I saw Plumbline only works with software startups.',
      source: 'Plumbline CFO website',
      script: {
        replyDay: 2, channel: 'Email', label: 'Interested', labelWhy: 'Asks for times.',
        reply: 'Interesting. When can you talk?\n\nMarek',
        draft: 'Thanks Marek. Would {slot1} or {slot2} suit you?\n\nLena',
        confirm: '{slot1}.', meetIn: 2, time: '10:00', outcome: 'held', proof: 'platform',
        verdict: {yes: true, reason: 'Runs close for 18 software startups, and wants a shared tool.', quote: 'I would put all eighteen on this if the pricing works.'},
        transcript: [['Marek', 'I would put all eighteen on this if the pricing works.']],
      },
    },
  ],
  pattern: {
    line: '{yes} of {held} firms run close by hand for many clients.',
    next: 'The noes are large networks, or do not run close.',
  },
  ispChanges: [
    ['Firms', 'Fractional CFO and bookkeeping firms, 5 to 50 clients', 'Fractional CFO firms, 10 to 50 software clients'],
    ['Signal', 'Clients in software, and public content on month-end close', 'Runs close for clients, and has no shared tool yet'],
    ['Leave out', 'Large accounting networks, and existing partners', 'Also leave out solo tax and payroll advisors'],
  ],
};

export const PACKS: Readonly<Record<Goal, Pack>> = {
  customers: CUSTOMERS,
  investors: INVESTORS,
  partners: PARTNERS,
};

export const FIRST_NAMES = ['Hannah', 'Luis', 'Mei', 'Oskar', 'Farah', 'Joel', 'Elena', 'Kwame', 'Tara', 'Marcus', 'Aiko', 'Dara', 'Pavel', 'Lucy', 'Omar', 'Greta', 'Sana', 'Nico', 'Ruth', 'Ivan', 'Zoe', 'Felix', 'Leila', 'Hugo'];
export const LAST_NAMES = ['Whitlock', 'Ferreira', 'Tanaka', 'Holm', 'Rahman', 'Beckett', 'Kovacs', 'Owusu', 'Sandhu', 'Vance', 'Mori', 'Keane', 'Novak', 'Thorne', 'Aziz', 'Lund', 'Iyer', 'Costa', 'Ames', 'Petrov', 'Hale', 'Brandt', 'Nasser', 'Quill'];
export const COMPANY_PREFIX = ['Alderway', 'Birchline', 'Cobalt Row', 'Dunmore', 'Elmstead', 'Foxglove', 'Greywick', 'Hartwell', 'Ironbark', 'Juniper Hill', 'Kettlewell', 'Larkspur', 'Millbrook', 'Nettlefold', 'Oakhaven', 'Pinnock', 'Quarry Lane', 'Rookwood', 'Sedgemoor', 'Thistledown', 'Underhill', 'Vantry', 'Wrenfield', 'Yarrow'];
export const CITIES: readonly (readonly [string, string])[] = [
  ['London', 'Europe/London'],
  ['Amsterdam', 'Europe/Amsterdam'],
  ['Berlin', 'Europe/Berlin'],
  ['Dublin', 'Europe/Dublin'],
  ['New York', 'America/New_York'],
  ['Toronto', 'America/Toronto'],
  ['Austin', 'America/Chicago'],
  ['Lisbon', 'Europe/Lisbon'],
];

export const FILLER_REPLIES: readonly (readonly [Label, string, string])[] = [
  ['Not interested', 'Thanks, but this is not a priority for us.', 'Says it is not a priority.'],
  ['Not now', 'Bad timing. Maybe next quarter.', 'Gives a later date.'],
  ['Out of office', 'I am away until the 24th, with limited access to email.', 'Automatic reply. Tymes will try again after the date.'],
  ['Not interested', 'We are happy with how we do things today, thank you.', 'Says they have no need.'],
];
