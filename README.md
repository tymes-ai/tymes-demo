# Tymes

The whole Tymes loop in the browser, as a static site with no backend. State is
saved in `localStorage`. Visitors sign in with Clerk before they see the demo.

## Run it

```bash
npm install
echo 'VITE_CLERK_PUBLISHABLE_KEY=pk_test_...' > .env.local   # from the Clerk dashboard
npm run dev       # http://localhost:3200
```

## Deploy it

`npm run build` writes a static site to `dist/`. It uses relative paths and hash
routes, so any static host works with no configuration:

```bash
npx vercel deploy --prod     # or: npx netlify deploy --dir=dist --prod
```

Dragging `dist/` into Netlify Drop also works. The page sets `noindex`.

The build fails without `VITE_CLERK_PUBLISHABLE_KEY`, so set it on the host too.
Sign-in providers are turned on in the Clerk dashboard, and it lists who signed in.
On Vercel, use the `pk_live` key for Production and the `pk_test` key for Preview and
Development. `public/privacy.html` is the privacy policy, outside the login.

## Walk through it

1. **First page**: "Start setup" walks the setup. "Open a running campaign"
   skips to day 7.
2. **Setup**: buy a meeting pack, company profile, connect accounts, goal, ISP,
   targets (10 for every meeting in the pack), messages, start outreach. All three goals have their own story.
3. **The bar at the bottom** moves the story:
   - **Next day** moves the clock one working day
   - **Play** runs on its own, and stops when a reply needs approval
   - **The menu** jumps to day 3, 7, or 12, or restarts
4. **Worth showing**:
   - Inbox: a labeled reply, a drafted answer, and approval
   - Day 3: an unsubscribe goes to do-not-contact by itself
   - Maya Okafor misses her call: nothing used from the pack, and a new time
   - Settings, Billing: buy another pack of 10, 20, 50, or 100. Only held meetings
     use the pack, and work pauses when it runs out
   - Meetings: the brief before, and your rating after
   - Settings, Approval level: pick Automatic, then move the clock
   - Settings, Do not contact: add a company, then read Campaign, Sequence
   - Day 12, Campaign, Act: continue with a fresh list, or stop
   - Campaigns, New campaign: run another goal under the same account. Home rolls
     them up, and one clock, calendar, DNC list, and meeting pack cover them all
   - `video/tymes-two-campaigns.mp4` is a recorded walkthrough of this

## Where things are

| Path                   | Holds                                         |
| :--------------------- | :-------------------------------------------- |
| `src/sim/content.ts`   | All the story: goals, people, replies         |
| `src/sim/engine.ts`    | The product logic, as pure functions      |
| `src/sim/store.ts`     | State and `localStorage`                      |
| `src/screens/`         | The pages                                     |
| `src/styles.css`       | Styles, from the website's tokens and rules   |

To change the story, edit `content.ts`.
