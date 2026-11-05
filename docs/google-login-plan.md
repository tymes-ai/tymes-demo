# Plan: Google login and visit tracking

Status: replaced for now. Sign-in uses Clerk, with no backend, and Clerk's
dashboard shows who signed in. The database and progress tracking below are not
built, and this plan's hand-built Google login no longer applies.

## Goal

Know who opened the demo. A visitor signs in with Google before seeing it, and
we record their name, email, visits, and how far they got.

This is for tracking, not secrecy. See [Limits](#limits).

## Where we are today

- The demo is a static Vite site on Vercel, with no backend. State lives in
  `localStorage` (`src/sim/store.ts`).
- `Login` in `src/screens/setup.tsx` is simulated. Its Google, Apple, and email
  buttons all set `state.user` to the story's founder, Lena Hart.
- "Open a running campaign" on the first page skips that screen, so nothing
  stops a visitor from reaching the app without logging in.
- Routing is hash-based, and `App` in `src/App.tsx` decides what to show.

## Design

### Two identities, kept apart

- **The visitor** is the real person, from Google. They live in the session
  cookie and the database, and never enter `localStorage` or the story.
- **Lena** stays the demo's character. The story, sidebar, and sample emails
  still use `FOUNDER`, so the demo reads the same for everyone.

### Flow

1. `AuthGate` wraps `App`, calls `GET /api/me`, and shows a blank page until it
   gets an answer.
2. With no session, the visitor sees the real login page: one Google button, and
   a line saying what we record.
3. Google returns a signed ID token. The browser posts it to `/api/auth/google`.
4. The function verifies the token, saves the visitor, records the login, and
   sets a session cookie.
5. `AuthGate` shows the demo's first page.

The simulated `/login` step goes away. "Start from login" sets Lena as the user
and goes straight to `/payment`. "Restart from login" in the menu restarts the
story and keeps the visitor signed in.

### Stack

| Part | Choice | Why |
| :--- | :--- | :--- |
| Sign-in | Google Identity Services | Official button, and needs no client secret |
| Token check | `google-auth-library` | Checks the signature, audience, and expiry |
| Backend | Vercel Functions in `api/` | The site is already on Vercel |
| Database | Postgres from the Vercel Marketplace, such as Neon | Small, and easy to query |
| Session | Signed `HttpOnly`, `Secure`, `SameSite=Lax` cookie, 30 days | Scripts cannot read it, and it needs no session table |

### API

| Route | What it does |
| :--- | :--- |
| `GET /api/me` | Returns the visitor, or 401 |
| `POST /api/auth/google` | Verifies the token, saves the visitor, records the login, sets the cookie |
| `POST /api/events` | Records one progress event for the signed-in visitor |
| `POST /api/logout` | Clears the cookie |

The server trusts only the verified token. It never takes a name or email from
the browser.

`/api/events` accepts only the fixed event names below, and ignores repeats of an
event by the same visitor within a short window.

### Data

```sql
create table visitors (
  id            bigserial primary key,
  google_sub    text unique not null,  -- Google's stable ID for the account
  email         text not null,
  name          text,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  visit_count   integer not null default 1
);

create table events (
  id         bigserial primary key,
  visitor_id bigint not null references visitors(id),
  name       text not null,
  created_at timestamptz not null default now()
);
create index on events (visitor_id, created_at);
```

A new visit counts when `GET /api/me` succeeds and the last visit was over 30
minutes ago, so a page refresh does not inflate the count.

### Events

`login`, `visit`, `demo_started`, `running_campaign_opened`, `pack_bought`,
`outreach_started`, `second_campaign_started`, `round_finished`, `billing_viewed`,
`logout`.

Each is sent at most once per story, from one small helper. A failed send never
blocks the demo.

### Reading the data

To start, use the database dashboard:

```sql
select v.name, v.email, v.first_seen_at, v.last_seen_at, v.visit_count,
       array_agg(distinct e.name) as reached
from visitors v
left join events e on e.visitor_id = v.id
group by v.id
order by v.last_seen_at desc;
```

An admin page can follow if people other than Vercel project members need access.

## Changes

| Path | Change |
| :--- | :--- |
| `api/` | New functions for the routes above, and shared session and database helpers |
| `db/schema.sql` | New: the tables above |
| `src/auth/` | New: `AuthGate`, the login page, and the event helper |
| `src/main.tsx` | Wrap `App` in `AuthGate` |
| `src/App.tsx` | Remove the `/login` route, and keep the menu's restart signed in |
| `src/screens/setup.tsx` | Remove the simulated `Login`, and have "Start from login" set Lena as the user and go to `/payment` |
| `README.md` | Update setup and deployment, and the walkthrough's login step |
| `package.json` | Add `google-auth-library` and the database driver |

## What we need

**Google Cloud**

- [ ] A web OAuth client. Check first whether the main Tymes product has a project
      to use.
- [ ] An "External" consent screen: app name, support email, logo, and a privacy
      policy link.
- [ ] Authorized JavaScript origins: `https://tymes-demo.vercel.app`,
      `http://localhost:3200`, and any custom domain.
- [ ] The Client ID.

**Vercel** (project under the `convalesce` team)

- [ ] A Postgres database connected to the project, in all environments.
- [ ] Environment variables: `GOOGLE_CLIENT_ID` and `SESSION_SECRET`, a long random
      value we generate. Neither goes in the repo or in chat.

**Decisions**

| Question | Recommendation |
| :--- | :--- |
| Who can log in? | Any Google account |
| Does login block the whole demo? | Yes |
| Track progress as well as logins? | Yes |
| Who can see the data? | Vercel project members, at first |
| How long do we keep it? | 12 months, then delete |
| Who owns the privacy policy text? | To be named |

## Testing

- **Automated:** tests for the session helper and the token check, including an
  expired token, a wrong audience, a bad signature, and an unknown event name.
- **By hand, on a test Vercel URL:**
  - First login, return visit, refresh, and logout
  - Deep links such as `#/settings/billing` while signed out
  - Cancelling at Google, and Google's script being blocked
  - Database down: the visitor gets a clear message, not a blank page
  - Rows appear with the right name, email, and events
  - The story behaves as before after login, including "Restart from login"

Google does not allow wildcard origins, and Vercel's per-deployment preview URLs
change. So testing needs a stable test URL added as an origin, such as a branch
alias, or `vercel dev` on `localhost:3200`. `npm run dev` alone will not serve
`api/`.

## Rollout

1. Build on a branch, against a separate test database.
2. Test on the stable test URL.
3. Add the production environment variables and apply the schema.
4. Merge to `master`, which deploys automatically.
5. Log in on production and confirm the row appears.

To undo it, revert the merge. The demo returns to having no login, and the
collected data stays in the database.

## Limits

- **Not secrecy.** This repo is public and the site's JavaScript is downloadable,
  so anyone determined can read or run the demo without logging in. For real
  privacy, make the repo private as well.
- **Videos are not tracked.** Only opening the site is.
- **Accounts, not people.** A shared or personal Google account is all we see.
- **Personal data.** Names and emails are personal data. The login page states
  what is recorded and links to the privacy policy. Check what applies to visitors
  in the EU before sending them the link.
- **Some drop-off.** A login wall will put some people off.
- **Static hosting ends.** Dragging `dist/` to another host, as the README
  describes, will no longer give a working site. The demo will need Vercel, or a
  host with the same functions.

## Out of scope

Roles and allow-lists, an admin page, email alerts on a new visitor, tracking
videos, and analytics beyond the events above.
