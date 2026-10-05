# Website booking → your Google Calendar

When a visitor picks a time on the contact form, `/api/book` creates a 30-minute event on your
Google Calendar (with a Google Meet link), invites the visitor, and Google emails them the invite.
The lead is still saved to Supabase. If the env vars below aren't set the form just saves the lead.

One-time setup (about 10 minutes, done by you, signed in as the calendar owner):

1. Google Cloud Console → create/select a project → **APIs & Services → Library** → enable **Google Calendar API**.
2. **OAuth consent screen**: External, add yourself as a test user. (Keep it in Testing; the refresh
   token for a test user expires after 7 days unless you click **Publish app** to move it to Production.)
3. **Credentials → Create credentials → OAuth client ID → Web application**. Add
   `https://developers.google.com/oauthplayground` as an authorized redirect URI. Copy the client ID and secret.
4. Open https://developers.google.com/oauthplayground → gear icon → tick **Use your own OAuth credentials** →
   paste the ID/secret. In Step 1 enter the scope `https://www.googleapis.com/auth/calendar.events`
   and `https://www.googleapis.com/auth/calendar.freebusy` (add each, authorize), then in Step 2 click
   **Exchange authorization code for tokens** and copy the **refresh token**.
5. Set these on the deployment (Railway `flowstate` service): `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` (optional `GOOGLE_CALENDAR_ID`, default `primary`).

Limits: no business-hours rule yet (any free slot 1 hour to 60 days out can be booked; it checks your
calendar for conflicts), and the per-IP limiter is in memory (3 bookings/hour/IP).
