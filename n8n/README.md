# Email Automation — n8n Workflows

Two coordinated workflows for cold-email outreach with scheduled follow-ups,
auto-stop on reply, and AI-drafted replies. Built to match the existing
"Follow-Up Sequence" workflow: **HTTP Request nodes** to the Supabase REST API
(credential `Supabase ANS CRM`), Code nodes for logic, Gmail for sending.

| File | Trigger | Job |
|------|---------|-----|
| `email-outreach-scheduler.json` | Schedule (every 15 min) | Find leads whose next email is due, personalize the step body, send via Gmail, advance the lead to the next step. |
| `email-reply-ai-responder.json` | Gmail inbox (poll every min) | On an inbound reply: match the lead, set `replied=true` / `status=Replied` (stops follow-ups), draft an AI reply with the n8n AI Agent (OpenAI), send it. |
| `client-nurture-monthly.json` | Schedule (hourly) | Relationship nurture for PAST clients. Every `interval_days` (default 30) sends an AI-written, non-sales check-in using the client's note, then reschedules. Runs until the client/campaign is paused. Enroll clients from the Contacts page. |

## Why two workflows
The sender is time-triggered (cron); the reply handler is event-triggered (inbox).
n8n allows one trigger per execution path, so they're separate. They stay in sync
through `email_leads.replied` — the sender query excludes `replied=eq.false`.

## Conventions (matched from the existing workflow)
- **Supabase**: `n8n-nodes-base.httpRequest` (v4.2) → `https://lwzrxstmofibqkxudugc.supabase.co/rest/v1/<table>`
  - `authentication: predefinedCredentialType`, `nodeCredentialType: httpHeaderAuth`, credential **Supabase ANS CRM** (`SehDVTutwS7XzjTn`)
  - Headers: `Authorization: Bearer <publishable key>`, `Content-Type: application/json`, and `Prefer: return=representation` on writes
  - GET uses PostgREST filters (`eq.`, `neq.`, `lte.`, `select=*`); writes use `PATCH ?id=eq.{{id}}` / `POST`
- **Gmail**: credential **Gmail account** (`5m7tLE66Mg5tj0xf`), `emailType: text`
- Side-effecting nodes use `onError: continueRegularOutput`

## Setup
1. **Create the tables** — run the migration (see "Supabase setup" below).
2. **Import both JSON files** into n8n.
3. The Supabase + Gmail credentials are already referenced by ID, so they should
   bind automatically on your instance.
4. **Add one new credential** for the reply workflow: an **OpenAI API** credential.
   The reply workflow uses the n8n **AI Agent** node with an **OpenAI Chat Model**
   sub-node — open `OpenAI Chat Model` and select your credential (placeholder
   `REPLACE_OPENAI_CRED`). Model defaults to `gpt-4o-mini`; change it there if you want.
5. Activate both workflows.

## Supabase setup
The new tables live in `supabase/migrations/20260609000001_email_automation.sql`.
Apply them with the existing runner and your Supabase personal access token
(from https://supabase.com/dashboard/account/tokens):

```
node run-migration.mjs <your-access-token> ./supabase/migrations/20260609000001_email_automation.sql
```

> The `.env` publishable key cannot run DDL — table creation needs the management
> access token above. After this runs once, the app and workflows are ready.

## Data model (one campaign = one sequence)
- `email_campaigns` — name, from_name, and the `ai_reply_prompt`.
- `email_steps` — step 0 = first email, 1..n = follow-ups. Each has `subject`,
  `body`, `delay_days` (wait after previous step). Bodies support
  `{{name}}`, `{{email}}`, `{{service}}`.
- `email_leads` — enrolled people. The scheduler walks `current_step` /
  `next_send_at` until steps run out (`status=Completed`) or they reply
  (`status=Replied`).
- `email_messages` — inbound/outbound conversation log.

## How a lead flows
```
enrol lead (current_step=0, next_send_at=now)
   → step 0 sent  → current_step=1, next_send_at = now + step1.delay_days
   → step 1 sent  → current_step=2, next_send_at = now + step2.delay_days
   → ... no more steps → status=Completed
   ↑ at any point, an inbound reply → replied=true, status=Replied, AI replies
```
