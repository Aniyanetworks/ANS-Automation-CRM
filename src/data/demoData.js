// Fake data served to the read-only demo account (demo@nomail.com).
// Field names match the real Supabase shapes (snake_case) so it flows through
// every page unchanged. No real customer data is here.

const C = '9d000000-0000-4000-8000-0000000000' // campaign id prefix helper
export const DEMO_OUTREACH_CAMPAIGN = `${C}01`
export const DEMO_NURTURE_CAMPAIGN = `${C}02`

// ─── CONTACTS ────────────────────────────────────────────────────────────────

export const demoContacts = [
  {
    id: 'd-c01', session_id: '14165550101', name: 'Olivia Bennett', email: 'olivia.bennett@brightmail.com', phone: '4165550101',
    service_type: 'WhatsApp Automation', interest: 'Yes', lead_status: 'Interested', source: 'Website',
    summary: 'Boutique e-commerce owner. Wants WhatsApp order updates + FAQ automation. Booked a discovery call.',
    message: 'Hi, I get 300+ WhatsApp messages a day and need help automating replies.',
    last_message_sent: 'Booked! Here is your discovery call link: https://cal.com/aniya', last_action_type: 'EMAIL',
    current_step: 'EMAIL_1', customer_replied: 'Yes', initial_sms_sent: 'Yes', unsubscribe: 'No',
    avatar: 'OB', avatar_color: 'bg-rose-500', last_action_date: '2026-06-09T14:20:00Z', created_at: '2026-06-05T10:00:00Z', client_note: '',
  },
  {
    id: 'd-c02', session_id: '14165550102', name: 'Marcus Reed', email: '', phone: '4165550102',
    service_type: 'CRM Automation', interest: 'Pending', lead_status: 'Follow-Up', source: 'Facebook',
    summary: 'Real-estate agent exploring CRM + pipeline automation. Awaiting email address.',
    message: 'Do you build CRM automations for realtors?',
    last_message_sent: 'Happy to help! What email should I send the overview to?', last_action_type: 'SMS',
    current_step: 'SMS_2', customer_replied: 'Yes', initial_sms_sent: 'Yes', unsubscribe: 'No',
    avatar: 'MR', avatar_color: 'bg-blue-500', last_action_date: '2026-06-10T09:15:00Z', created_at: '2026-06-06T08:30:00Z', client_note: '',
  },
  {
    id: 'd-c03', session_id: '14375550103', name: 'Sophia Nguyen', email: 'sophia.nguyen@wellnest.co', phone: '4375550103',
    service_type: 'Booking Automation', interest: 'Yes', lead_status: 'Booked', source: 'Instagram',
    summary: 'Wellness clinic owner. Appointment booking + SMS reminders. Demo completed, signed up.',
    message: 'Saw your post on booking automation — interested for my clinic.',
    last_message_sent: 'Welcome aboard, Sophia! Your onboarding call is confirmed for Thursday.', last_action_type: 'EMAIL',
    current_step: 'EMAIL_2', customer_replied: 'Yes', initial_sms_sent: 'Yes', unsubscribe: 'No',
    avatar: 'SN', avatar_color: 'bg-violet-500', last_action_date: '2026-06-08T16:40:00Z', created_at: '2026-06-03T12:10:00Z', client_note: '',
  },
  {
    id: 'd-c04', session_id: '14165550104', name: 'James Whitfield', email: 'james.w@northgateb2b.com', phone: '',
    service_type: 'Email Automation', interest: 'Pending', lead_status: 'Contacted', source: 'Email',
    summary: 'B2B marketing manager. Interested in email drip + lead nurturing. Needs phone number.',
    message: 'Can you set up a multi-step email nurture for our leads?',
    last_message_sent: 'Absolutely. What is the best number to reach you on?', last_action_type: 'EMAIL',
    current_step: 'START', customer_replied: 'Yes', initial_sms_sent: 'No', unsubscribe: 'No',
    avatar: 'JW', avatar_color: 'bg-emerald-500', last_action_date: '2026-06-07T11:25:00Z', created_at: '2026-06-04T09:00:00Z', client_note: '',
  },
  {
    id: 'd-c05', session_id: '16475550105', name: 'Emma Carter', email: 'emma.carter@gmail.com', phone: '6475550105',
    service_type: 'WhatsApp Automation', interest: 'No', lead_status: 'Closed Lost', source: 'Website',
    summary: 'Restaurant owner. Chose a cheaper in-house option. Opted out.',
    message: 'Looking for WhatsApp automation for reservations.',
    last_message_sent: 'Understood, Emma. Door is always open if things change!', last_action_type: 'SMS',
    current_step: 'START', customer_replied: 'Yes', initial_sms_sent: 'Yes', unsubscribe: 'Yes',
    avatar: 'EC', avatar_color: 'bg-amber-500', last_action_date: '2026-06-02T13:00:00Z', created_at: '2026-05-28T15:30:00Z', client_note: '',
  },
  {
    id: 'd-c06', session_id: '14165550106', name: 'David Okafor', email: 'david@okaforsaas.io', phone: '4165550106',
    service_type: 'AI Chatbot', interest: 'Yes', lead_status: 'Interested', source: 'Facebook',
    summary: 'SaaS founder wanting a support chatbot trained on product docs. Reviewing proposal.',
    message: 'We need an AI chatbot for our support portal.',
    last_message_sent: 'Proposal sent! Happy to walk through it on a quick call.', last_action_type: 'EMAIL',
    current_step: 'SMS_1', customer_replied: 'Yes', initial_sms_sent: 'Yes', unsubscribe: 'No',
    avatar: 'DO', avatar_color: 'bg-cyan-500', last_action_date: '2026-06-09T15:30:00Z', created_at: '2026-06-05T14:45:00Z', client_note: '',
  },
  {
    id: 'd-c07', session_id: '14165550107', name: 'Lily Anderson', email: '', phone: '',
    service_type: 'Social Media Automation', interest: 'Pending', lead_status: 'New Lead', source: 'Instagram',
    summary: 'Fitness influencer asking about automated DM responses. Just started the conversation.',
    message: 'Do you automate Instagram DMs?',
    last_message_sent: 'We do! What is your name and the best way to reach you?', last_action_type: null,
    current_step: 'START', customer_replied: 'Yes', initial_sms_sent: 'No', unsubscribe: 'No',
    avatar: 'LA', avatar_color: 'bg-pink-500', last_action_date: '2026-06-11T08:30:00Z', created_at: '2026-06-11T08:25:00Z', client_note: '',
  },
  {
    id: 'd-c08', session_id: '19055550108', name: 'Robert Mensah', email: 'rob.mensah@retailgroup.ca', phone: '9055550108',
    service_type: 'CRM Automation', interest: 'Yes', lead_status: 'Closed Won', source: 'Email',
    summary: 'Retail chain owner. Signed a 12-month full CRM automation contract. Onboarded.',
    message: 'We have 3 locations and need a unified CRM.',
    last_message_sent: 'Welcome to Aniya Networks! Your onboarding is complete. 🎉', last_action_type: 'EMAIL',
    current_step: 'START', customer_replied: 'Yes', initial_sms_sent: 'Yes', unsubscribe: 'No',
    avatar: 'RM', avatar_color: 'bg-orange-500', last_action_date: '2026-05-30T09:00:00Z', created_at: '2026-05-20T10:00:00Z', client_note: 'Delivered a 3-location CRM rollout. Very happy — great reference candidate.',
  },
  {
    id: 'd-c09', session_id: '14165550109', name: 'Ava Thompson', email: 'ava.thompson@spaluxe.com', phone: '4165550109',
    service_type: 'Booking Automation', interest: 'Pending', lead_status: 'Contacted', source: 'Website',
    summary: 'Day spa owner. Wants booking + reminders. Requested case studies before deciding.',
    message: 'Interested in booking automation with reminders.',
    last_message_sent: 'Sending over a few spa case studies now!', last_action_type: 'SMS',
    current_step: 'START', customer_replied: 'Yes', initial_sms_sent: 'Yes', unsubscribe: 'No',
    avatar: 'AT', avatar_color: 'bg-teal-500', last_action_date: '2026-06-08T12:15:00Z', created_at: '2026-06-04T16:20:00Z', client_note: '',
  },
  {
    id: 'd-c10', session_id: '14165550110', name: 'Kevin Alvarez', email: 'kevin@alvarezrealty.ca', phone: '4165550110',
    service_type: 'WhatsApp Automation', interest: 'Yes', lead_status: 'Interested', source: 'Facebook',
    summary: 'Brokerage with 50 agents. Enterprise WhatsApp automation. Highly engaged.',
    message: 'Can you automate WhatsApp for a 50-agent team?',
    last_message_sent: 'Great fit! Book a call to discuss the enterprise plan: https://cal.com/aniya', last_action_type: 'SMS',
    current_step: 'SMS_3', customer_replied: 'Yes', initial_sms_sent: 'Yes', unsubscribe: 'No',
    avatar: 'KA', avatar_color: 'bg-indigo-500', last_action_date: '2026-06-10T16:00:00Z', created_at: '2026-06-06T11:30:00Z', client_note: '',
  },
  {
    id: 'd-c11', session_id: '14165550111', name: 'Grace Müller', email: 'grace.muller@boutique.de', phone: '',
    service_type: 'Email Automation', interest: 'Pending', lead_status: 'New Lead', source: 'Instagram',
    summary: 'Online boutique owner asking about email marketing automation. Early stage.',
    message: 'Do you do email marketing automation?',
    last_message_sent: 'We specialize in it! What is your name?', last_action_type: null,
    current_step: 'START', customer_replied: 'Yes', initial_sms_sent: 'No', unsubscribe: 'No',
    avatar: 'GM', avatar_color: 'bg-purple-500', last_action_date: '2026-06-11T07:50:00Z', created_at: '2026-06-11T07:45:00Z', client_note: '',
  },
  {
    id: 'd-c12', session_id: '14165550112', name: 'Daniel Foster', email: 'daniel.foster@fosterdental.ca', phone: '9055550112',
    service_type: 'Booking Automation', interest: 'Yes', lead_status: 'Client', source: 'Facebook',
    summary: 'Dental clinic owner. Delivered booking + reminder automation last quarter.',
    message: 'Need appointment booking with automated reminders.',
    last_message_sent: 'Thanks again for the partnership, Daniel!', last_action_type: 'EMAIL',
    current_step: 'START', customer_replied: 'Yes', initial_sms_sent: 'Yes', unsubscribe: 'No',
    avatar: 'DF', avatar_color: 'bg-red-500', last_action_date: '2026-05-15T10:30:00Z', created_at: '2026-03-10T10:00:00Z', client_note: 'Completed a booking + reminder automation project. Smooth delivery, client was delighted.',
  },
]

// ─── CHAT MESSAGES ───────────────────────────────────────────────────────────

export const demoChatMessages = {
  '14165550101': [
    { id: 'm-0101-1', session_id: '14165550101', phone: '4165550101', role: 'customer', text: 'Hi, I get 300+ WhatsApp messages a day and need help automating replies.', timestamp: '2026-06-05T10:00:00Z' },
    { id: 'm-0101-2', session_id: '14165550101', phone: '4165550101', role: 'agent', text: "Hi! I'm Jasica from Aniya Networks. We automate WhatsApp support — order updates, FAQs, and smart escalations. What's the best number to reach you on?", timestamp: '2026-06-05T10:00:30Z' },
    { id: 'm-0101-3', session_id: '14165550101', phone: '4165550101', role: 'customer', text: 'Sure, 416-555-0101. I run a boutique Shopify store.', timestamp: '2026-06-05T10:01:10Z' },
    { id: 'm-0101-4', session_id: '14165550101', phone: '4165550101', role: 'agent', text: 'Perfect, Olivia! We can fully automate that. You can book a free discovery call here: https://cal.com/aniya', timestamp: '2026-06-05T10:01:40Z' },
    { id: 'm-0101-5', session_id: '14165550101', phone: '4165550101', role: 'customer', text: "Booked! Looking forward to it.", timestamp: '2026-06-05T10:03:00Z' },
  ],
  '14165550102': [
    { id: 'm-0102-1', session_id: '14165550102', phone: '4165550102', role: 'customer', text: 'Do you build CRM automations for realtors?', timestamp: '2026-06-06T08:30:00Z' },
    { id: 'm-0102-2', session_id: '14165550102', phone: '4165550102', role: 'agent', text: 'Absolutely — lead tracking, follow-up sequences, and full pipeline management. What email should I send the overview to?', timestamp: '2026-06-06T08:30:25Z' },
    { id: 'm-0102-3', session_id: '14165550102', phone: '4165550102', role: 'customer', text: "I'll share it later — tell me more first.", timestamp: '2026-06-06T08:31:00Z' },
    { id: 'm-0102-4', session_id: '14165550102', phone: '4165550102', role: 'agent', text: 'Of course! We auto-capture leads from all channels, assign to agents, and trigger follow-ups. What does your current process look like?', timestamp: '2026-06-06T08:31:30Z' },
  ],
  '14375550103': [
    { id: 'm-0103-1', session_id: '14375550103', phone: '4375550103', role: 'customer', text: 'Saw your post on booking automation — interested for my clinic.', timestamp: '2026-06-03T12:10:00Z' },
    { id: 'm-0103-2', session_id: '14375550103', phone: '4375550103', role: 'agent', text: "Great timing! Booking automation is our specialty. What's the best number to reach you?", timestamp: '2026-06-03T12:10:20Z' },
    { id: 'm-0103-3', session_id: '14375550103', phone: '4375550103', role: 'customer', text: '437-555-0103. Can we do a demo this week?', timestamp: '2026-06-03T12:11:00Z' },
    { id: 'm-0103-4', session_id: '14375550103', phone: '4375550103', role: 'agent', text: 'Absolutely! Book a slot here: https://cal.com/aniya — looking forward to it, Sophia!', timestamp: '2026-06-03T12:11:35Z' },
    { id: 'm-0103-5', session_id: '14375550103', phone: '4375550103', role: 'customer', text: "Done. See you then!", timestamp: '2026-06-03T12:13:00Z' },
  ],
  '14165550106': [
    { id: 'm-0106-1', session_id: '14165550106', phone: '4165550106', role: 'customer', text: 'We need an AI chatbot for our support portal.', timestamp: '2026-06-05T14:45:00Z' },
    { id: 'm-0106-2', session_id: '14165550106', phone: '4165550106', role: 'agent', text: "We build custom AI chatbots trained on your docs. What's the best email to send details to?", timestamp: '2026-06-05T14:45:30Z' },
    { id: 'm-0106-3', session_id: '14165550106', phone: '4165550106', role: 'customer', text: 'david@okaforsaas.io', timestamp: '2026-06-05T14:46:10Z' },
    { id: 'm-0106-4', session_id: '14165550106', phone: '4165550106', role: 'agent', text: "Perfect! Our chatbots resolve 80%+ of tickets with smart escalation. Sending case studies + a demo link now.", timestamp: '2026-06-05T14:46:45Z' },
  ],
  '14165550110': [
    { id: 'm-0110-1', session_id: '14165550110', phone: '4165550110', role: 'customer', text: 'Can you automate WhatsApp for a 50-agent team?', timestamp: '2026-06-06T11:30:00Z' },
    { id: 'm-0110-2', session_id: '14165550110', phone: '4165550110', role: 'agent', text: "Yes — enterprise WhatsApp with lead routing, AI auto-responses, and daily reports. What's the best number to reach you?", timestamp: '2026-06-06T11:30:25Z' },
    { id: 'm-0110-3', session_id: '14165550110', phone: '4165550110', role: 'customer', text: '416-555-0110, Kevin here. We need routing and daily reports.', timestamp: '2026-06-06T11:31:00Z' },
    { id: 'm-0110-4', session_id: '14165550110', phone: '4165550110', role: 'agent', text: 'Great fit, Kevin! Book a call to discuss the enterprise plan: https://cal.com/aniya', timestamp: '2026-06-06T11:31:40Z' },
  ],
  '19055550108': [
    { id: 'm-0108-1', session_id: '19055550108', phone: '9055550108', role: 'customer', text: 'We have 3 locations and need a unified CRM.', timestamp: '2026-05-20T10:00:00Z' },
    { id: 'm-0108-2', session_id: '19055550108', phone: '9055550108', role: 'agent', text: "We build end-to-end CRM automation for multi-location retail. What's the best number to reach you?", timestamp: '2026-05-20T10:00:30Z' },
    { id: 'm-0108-3', session_id: '19055550108', phone: '9055550108', role: 'customer', text: '905-555-0108 — Robert from RetailGroup.', timestamp: '2026-05-20T10:01:00Z' },
    { id: 'm-0108-4', session_id: '19055550108', phone: '9055550108', role: 'agent', text: 'Thanks Robert! Unified customer data, automated follow-ups, and loyalty flows. Book a call: https://cal.com/aniya', timestamp: '2026-05-20T10:01:40Z' },
    { id: 'm-0108-5', session_id: '19055550108', phone: '9055550108', role: 'customer', text: 'Booked — this is exactly what we need.', timestamp: '2026-05-20T10:03:00Z' },
  ],
}

// getAllChatSessions returns the latest message per session.
export const demoChatSessions = Object.values(demoChatMessages)
  .map(msgs => {
    const last = msgs[msgs.length - 1]
    return { session_id: last.session_id, phone: last.phone, text: last.text, timestamp: last.timestamp, role: last.role }
  })
  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

// ─── FOLLOW-UPS (table, used by dashboard stats) ──────────────────────────────

export const demoFollowups = [
  { id: 'd-f01', contact_id: 'd-c01', contact_name: 'Olivia Bennett', phone: '4165550101', source: 'Website', follow_up_date: '2026-06-12', message: 'Confirm discovery call + send pre-call questionnaire.', status: 'Pending', created_at: '2026-06-09T14:25:00Z' },
  { id: 'd-f02', contact_id: 'd-c02', contact_name: 'Marcus Reed', phone: '4165550102', source: 'Facebook', follow_up_date: '2026-06-11', message: 'Collect email, send CRM demo video.', status: 'Pending', created_at: '2026-06-10T09:20:00Z' },
  { id: 'd-f03', contact_id: 'd-c06', contact_name: 'David Okafor', phone: '4165550106', source: 'Facebook', follow_up_date: '2026-06-08', message: 'Follow up on chatbot proposal.', status: 'Overdue', created_at: '2026-06-07T15:35:00Z' },
  { id: 'd-f04', contact_id: 'd-c09', contact_name: 'Ava Thompson', phone: '4165550109', source: 'Website', follow_up_date: '2026-06-13', message: 'Send spa case studies follow-up.', status: 'Pending', created_at: '2026-06-08T12:20:00Z' },
  { id: 'd-f05', contact_id: 'd-c10', contact_name: 'Kevin Alvarez', phone: '4165550110', source: 'Facebook', follow_up_date: '2026-06-12', message: 'Send enterprise overview deck before call.', status: 'Pending', created_at: '2026-06-10T16:05:00Z' },
  { id: 'd-f06', contact_id: 'd-c03', contact_name: 'Sophia Nguyen', phone: '4375550103', source: 'Instagram', follow_up_date: '2026-06-05', message: 'Post-demo: send proposal.', status: 'Done', created_at: '2026-06-04T10:00:00Z' },
  { id: 'd-f07', contact_id: 'd-c08', contact_name: 'Robert Mensah', phone: '9055550108', source: 'Email', follow_up_date: '2026-05-29', message: 'Onboarding welcome package.', status: 'Done', created_at: '2026-05-28T09:00:00Z' },
]

// ─── WORKFLOW EXECUTIONS ──────────────────────────────────────────────────────

export const demoExecutions = [
  { id: 'd-e01', workflow_name: 'Website Chat Widget — AI Reply', automation: 'Website', contact_name: 'Grace Müller', status: 'success', duration_ms: 1290, trigger: 'Webhook', notes: '', timestamp: '2026-06-11T07:50:00Z' },
  { id: 'd-e02', workflow_name: 'Facebook DM — AI Reply', automation: 'Facebook', contact_name: 'Marcus Reed', status: 'success', duration_ms: 1610, trigger: 'Facebook Webhook', notes: '', timestamp: '2026-06-11T07:20:00Z' },
  { id: 'd-e03', workflow_name: 'Website Chat Widget — AI Reply', automation: 'Website', contact_name: 'Lily Anderson', status: 'success', duration_ms: 1180, trigger: 'Webhook', notes: '', timestamp: '2026-06-11T08:30:00Z' },
  { id: 'd-e04', workflow_name: 'Follow-Up Sequence', automation: 'follow_up', contact_name: 'Marcus Reed', status: 'success', duration_ms: 720, trigger: 'scheduler', notes: 'SMS_2 via SMS', timestamp: '2026-06-10T09:15:00Z' },
  { id: 'd-e05', workflow_name: 'Follow-Up Sequence', automation: 'follow_up', contact_name: 'Kevin Alvarez', status: 'success', duration_ms: 690, trigger: 'scheduler', notes: 'SMS_3 via SMS', timestamp: '2026-06-10T16:00:00Z' },
  { id: 'd-e06', workflow_name: 'Email Outreach — Scheduler', automation: 'Email', contact_name: 'Olivia Bennett', status: 'success', duration_ms: 940, trigger: 'scheduler', notes: 'EMAIL_1 via Email', timestamp: '2026-06-09T14:20:00Z' },
  { id: 'd-e07', workflow_name: 'Follow-Up Sequence', automation: 'follow_up', contact_name: 'Olivia Bennett', status: 'success', duration_ms: 810, trigger: 'scheduler', notes: 'EMAIL_1 via EMAIL', timestamp: '2026-06-09T14:20:00Z' },
  { id: 'd-e08', workflow_name: 'Facebook DM — AI Reply', automation: 'Facebook', contact_name: 'David Okafor', status: 'success', duration_ms: 1450, trigger: 'Facebook Webhook', notes: '', timestamp: '2026-06-09T15:30:00Z' },
  { id: 'd-e09', workflow_name: 'Client Nurture — Monthly Check-in', automation: 'Email', contact_name: 'Daniel Foster', status: 'success', duration_ms: 1120, trigger: 'scheduler', notes: 'NURTURE check-in #2 via Email', timestamp: '2026-06-09T09:00:00Z' },
  { id: 'd-e10', workflow_name: 'SMS AI Reply', automation: 'SMS', contact_name: 'Ava Thompson', status: 'success', duration_ms: 530, trigger: 'Webhook', notes: '', timestamp: '2026-06-08T12:15:00Z' },
  { id: 'd-e11', workflow_name: 'Follow-Up Sequence', automation: 'follow_up', contact_name: 'Sophia Nguyen', status: 'success', duration_ms: 770, trigger: 'scheduler', notes: 'EMAIL_2 via EMAIL', timestamp: '2026-06-08T16:40:00Z' },
  { id: 'd-e12', workflow_name: 'Facebook DM — AI Reply', automation: 'Facebook', contact_name: 'David Okafor', status: 'error', duration_ms: 0, trigger: 'Facebook Webhook', notes: 'OpenAI rate limit exceeded. Retrying in 60s.', timestamp: '2026-06-08T10:05:00Z' },
  { id: 'd-e13', workflow_name: 'Email Reply — AI Responder', automation: 'Email', contact_name: 'James Whitfield', status: 'success', duration_ms: 1330, trigger: 'gmail_reply', notes: 'REPLY via Email — follow-ups stopped, AI replied', timestamp: '2026-06-07T11:25:00Z' },
  { id: 'd-e14', workflow_name: 'Follow-Up Sequence', automation: 'follow_up', contact_name: 'David Okafor', status: 'success', duration_ms: 700, trigger: 'scheduler', notes: 'SMS_1 via SMS', timestamp: '2026-06-07T10:00:00Z' },
  { id: 'd-e15', workflow_name: 'Website Chat Widget — AI Reply', automation: 'Website', contact_name: 'Ava Thompson', status: 'success', duration_ms: 1240, trigger: 'Webhook', notes: '', timestamp: '2026-06-04T16:20:00Z' },
  { id: 'd-e16', workflow_name: 'SMS AI Reply', automation: 'SMS', contact_name: 'Emma Carter', status: 'error', duration_ms: 0, trigger: 'Webhook', notes: 'Twilio error: recipient opted out (STOP).', timestamp: '2026-06-02T13:00:00Z' },
  { id: 'd-e17', workflow_name: 'Email Outreach — Scheduler', automation: 'Email', contact_name: 'Daniel Foster', status: 'success', duration_ms: 880, trigger: 'scheduler', notes: 'EMAIL_0 via Email', timestamp: '2026-05-30T09:00:00Z' },
  { id: 'd-e18', workflow_name: 'Facebook DM — Booking Confirmed', automation: 'Facebook', contact_name: 'Robert Mensah', status: 'success', duration_ms: 990, trigger: 'Facebook Webhook', notes: '', timestamp: '2026-05-30T09:00:00Z' },
]

// ─── EMAIL CAMPAIGNS ──────────────────────────────────────────────────────────

export const demoCampaigns = [
  {
    id: DEMO_OUTREACH_CAMPAIGN, name: 'Q2 Web Design Outreach', type: 'outreach', status: 'Active',
    from_name: 'Aniya Networks', from_email: 'hello@aniyanetworks.net',
    ai_reply_prompt: 'You are a helpful sales assistant for Aniya Network Solutions. Reply warmly, answer questions, and gently steer toward booking a call. Keep it short (2-4 sentences).',
    interval_days: 30, interval_unit: 'days', created_at: '2026-06-01T09:00:00Z',
  },
  {
    id: DEMO_NURTURE_CAMPAIGN, name: 'Past Clients — Monthly Check-in', type: 'nurture', status: 'Active',
    from_name: 'Manam Parvez', from_email: 'manam@aniyanetworks.net',
    ai_reply_prompt: 'You are writing to a PAST client to maintain the relationship. Warm, genuine check-ins about how they and their business are doing. Never a sales pitch.',
    interval_days: 30, interval_unit: 'days', created_at: '2026-05-15T09:00:00Z',
  },
]

export const demoSteps = {
  [DEMO_OUTREACH_CAMPAIGN]: [
    { id: 'd-s01', campaign_id: DEMO_OUTREACH_CAMPAIGN, step_number: 0, subject: 'Quick idea for {{name}}', body: 'Hi {{name}},\n\nI came across your business and had a quick idea for your {{service}}. We help teams automate it end-to-end.\n\nWorth a short chat?', delay_days: 0, created_at: '2026-06-01T09:00:00Z' },
    { id: 'd-s02', campaign_id: DEMO_OUTREACH_CAMPAIGN, step_number: 1, subject: 'Following up, {{name}}', body: 'Hi {{name}},\n\nJust floating this back to the top of your inbox. Happy to share a 2-minute example of {{service}} automation.\n\nWant me to send it?', delay_days: 3, created_at: '2026-06-01T09:00:00Z' },
    { id: 'd-s03', campaign_id: DEMO_OUTREACH_CAMPAIGN, step_number: 2, subject: 'Last note from me', body: 'Hi {{name}},\n\nI will stop here so I am not crowding your inbox. If {{service}} is ever a priority, just reply and I will take care of the rest.', delay_days: 5, created_at: '2026-06-01T09:00:00Z' },
  ],
  [DEMO_NURTURE_CAMPAIGN]: [],
}

export const demoLeads = {
  [DEMO_OUTREACH_CAMPAIGN]: [
    { id: 'd-l01', campaign_id: DEMO_OUTREACH_CAMPAIGN, name: 'Priya Sharma', email: 'priya@sharmaco.com', service: 'Website Redesign', status: 'Active', current_step: 1, next_send_at: '2026-06-13T09:00:00Z', last_sent_at: '2026-06-10T09:00:00Z', replied: false, emails_sent: 1, thread_id: 't-001', message_id: 'mi-001', created_at: '2026-06-10T08:55:00Z' },
    { id: 'd-l02', campaign_id: DEMO_OUTREACH_CAMPAIGN, name: 'Tom Becker', email: 'tom.becker@beckerlaw.com', service: 'SEO', status: 'Replied', current_step: 1, next_send_at: '2026-06-12T09:00:00Z', last_sent_at: '2026-06-09T09:00:00Z', replied: true, emails_sent: 1, thread_id: 't-002', message_id: 'mi-002', created_at: '2026-06-09T08:55:00Z' },
    { id: 'd-l03', campaign_id: DEMO_OUTREACH_CAMPAIGN, name: 'Nadia Hassan', email: 'nadia@hassanstudio.com', service: 'Brand Identity', status: 'Completed', current_step: 3, next_send_at: '2026-06-11T09:00:00Z', last_sent_at: '2026-06-11T09:00:00Z', replied: false, emails_sent: 3, thread_id: 't-003', message_id: 'mi-003', created_at: '2026-06-02T08:55:00Z' },
    { id: 'd-l04', campaign_id: DEMO_OUTREACH_CAMPAIGN, name: 'George Pappas', email: 'george@pappasdiner.com', service: 'Online Ordering', status: 'Active', current_step: 0, next_send_at: '2026-06-12T09:00:00Z', last_sent_at: null, replied: false, emails_sent: 0, thread_id: null, message_id: null, created_at: '2026-06-11T08:55:00Z' },
  ],
  [DEMO_NURTURE_CAMPAIGN]: [],
}

export const demoNurtureClients = {
  [DEMO_NURTURE_CAMPAIGN]: [
    { id: 'd-n01', campaign_id: DEMO_NURTURE_CAMPAIGN, contact_id: 'd-c12', name: 'Daniel Foster', email: 'daniel.foster@fosterdental.ca', note: 'Completed a booking + reminder automation project. Smooth delivery, client was delighted.', status: 'Active', next_send_at: '2026-07-09T09:00:00Z', last_sent_at: '2026-06-09T09:00:00Z', last_message: 'Hi Daniel! I was just thinking about the booking automation we built together and hoped it is still saving your front desk plenty of time. How have you and the clinic been lately?', emails_sent: 2, created_at: '2026-05-15T09:05:00Z' },
    { id: 'd-n02', campaign_id: DEMO_NURTURE_CAMPAIGN, contact_id: 'd-c08', name: 'Robert Mensah', email: 'rob.mensah@retailgroup.ca', note: 'Delivered a 3-location CRM rollout. Very happy — great reference candidate.', status: 'Active', next_send_at: '2026-07-12T09:00:00Z', last_sent_at: '2026-06-12T09:00:00Z', last_message: 'Hi Robert! Hope all three locations are humming along. I still remember how smoothly the CRM rollout went — how is the team finding it these days?', emails_sent: 1, created_at: '2026-05-15T09:05:00Z' },
  ],
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

export function demoDashboardStats() {
  const contacts = demoContacts
  const followups = demoFollowups
  const executions = demoExecutions
  const today = '2026-06-11'
  return {
    totalLeads: contacts.length,
    newLeads: contacts.filter(c => c.lead_status === 'New Lead').length,
    contacted: contacts.filter(c => c.lead_status === 'Contacted').length,
    followUp: contacts.filter(c => c.lead_status === 'Follow-Up').length,
    interested: contacts.filter(c => c.lead_status === 'Interested').length,
    booked: contacts.filter(c => c.lead_status === 'Booked').length,
    closedWon: contacts.filter(c => c.lead_status === 'Closed Won').length,
    closedLost: contacts.filter(c => c.lead_status === 'Closed Lost').length,
    pendingFollowups: followups.filter(f => f.status === 'Pending').length,
    overdueFollowups: followups.filter(f => f.status === 'Pending' && f.follow_up_date < today).length,
    totalExecutions: executions.length,
    successfulExecutions: executions.filter(e => e.status === 'success').length,
    failedExecutions: executions.filter(e => e.status === 'error').length,
    sourceBreakdown: contacts.reduce((acc, c) => { if (c.source) acc[c.source] = (acc[c.source] || 0) + 1; return acc }, {}),
    recentContacts: [...contacts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6),
  }
}
