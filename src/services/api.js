import { supabase } from '../lib/supabase'
import { isDemo, blockIfDemo } from '../lib/demo'
import * as demo from '../data/demoData'

const N8N_WEBHOOK = 'https://n8n.srv1300653.hstgr.cloud/webhook'

// Sends a manual reply through the n8n "Manual Reply Sender" workflow (Gmail).
// payload: { kind: 'email'|'nurture', id, to, subject, body, threadId }
export async function sendManualReply(payload) {
  blockIfDemo()
  const res = await fetch(`${N8N_WEBHOOK}/manual-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Send failed (HTTP ' + res.status + ')')
  return true
}

// In demo mode, reads return fake data and writes throw a friendly error.

// ─── CONTACTS ────────────────────────────────────────────────────────────────

export async function getContacts() {
  if (isDemo()) return demo.demoContacts
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getContact(id) {
  if (isDemo()) return demo.demoContacts.find(c => c.id === id) || null
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateContact(id, updates) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createContact(contact) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('contacts')
    .insert(contact)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteContact(id) {
  blockIfDemo()
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteContacts(ids) {
  blockIfDemo()
  const { error } = await supabase
    .from('contacts')
    .delete()
    .in('id', ids)
  if (error) throw error
}

export async function createContacts(contacts) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('contacts')
    .insert(contacts)
    .select()
  if (error) throw error
  return data
}

// ─── CONTACT GROUPS ──────────────────────────────────────────────────────────

export async function getContactGroups() {
  if (isDemo()) return demo.demoGroups
  const { data, error } = await supabase
    .from('contact_groups')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getGroupMemberships() {
  if (isDemo()) return demo.demoGroupMembers
  const { data, error } = await supabase
    .from('contact_group_members')
    .select('group_id, contact_id')
  if (error) throw error
  return data
}

export async function createContactGroup(name) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('contact_groups')
    .insert({ name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteContactGroup(id) {
  blockIfDemo()
  const { error } = await supabase
    .from('contact_groups')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function addContactsToGroup(groupId, contactIds) {
  blockIfDemo()
  const rows = contactIds.map(cid => ({ group_id: groupId, contact_id: cid }))
  const { data, error } = await supabase
    .from('contact_group_members')
    .upsert(rows, { onConflict: 'group_id,contact_id', ignoreDuplicates: true })
    .select()
  if (error) throw error
  return data
}

export async function removeContactsFromGroup(groupId, contactIds) {
  blockIfDemo()
  const { error } = await supabase
    .from('contact_group_members')
    .delete()
    .eq('group_id', groupId)
    .in('contact_id', contactIds)
  if (error) throw error
}

// ─── CHAT MESSAGES ───────────────────────────────────────────────────────────

export async function getChatMessages(sessionId) {
  if (isDemo()) return demo.demoChatMessages[sessionId] || []
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true })
  if (error) throw error
  return data
}

export async function getChatMessagesByPhone(phone) {
  if (isDemo()) return []
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('phone', phone)
    .order('timestamp', { ascending: true })
  if (error) throw error
  return data || []
}

export async function deleteChatSession(sessionId) {
  blockIfDemo()
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('session_id', sessionId)
  if (error) throw error
}

export async function getAllChatSessions() {
  if (isDemo()) return demo.demoChatSessions
  // Get latest message per session to show in chat list
  const { data, error } = await supabase
    .from('chat_messages')
    .select('session_id, phone, text, timestamp, role')
    .order('timestamp', { ascending: false })
  if (error) throw error

  // Group by session_id, keep only the latest message
  const seen = new Set()
  return data.filter(msg => {
    if (seen.has(msg.session_id)) return false
    seen.add(msg.session_id)
    return true
  })
}

// ─── FOLLOWUPS ───────────────────────────────────────────────────────────────

export async function getFollowups() {
  if (isDemo()) return demo.demoFollowups
  const { data, error } = await supabase
    .from('followups')
    .select('*')
    .order('follow_up_date', { ascending: true })
  if (error) throw error
  return data
}

export async function updateFollowupStatus(id, status) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('followups')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createFollowup(followup) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('followups')
    .insert(followup)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteFollowup(id) {
  blockIfDemo()
  const { error } = await supabase
    .from('followups')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function deleteWorkflowExecutions(ids) {
  blockIfDemo()
  const { error } = await supabase
    .from('workflow_executions')
    .delete()
    .in('id', ids)
  if (error) throw error
}

// ─── WORKFLOW EXECUTIONS ──────────────────────────────────────────────────────

export async function getAllWorkflowExecutions() {
  if (isDemo()) return demo.demoExecutions
  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .order('timestamp', { ascending: false })
  if (error) throw error
  return data
}

export async function getWorkflowExecutions() {
  if (isDemo()) return demo.demoExecutions
  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function getFollowUpExecutions() {
  if (isDemo()) return demo.demoExecutions.filter(e => e.automation === 'follow_up')
  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('automation', 'follow_up')
    .order('timestamp', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function getFollowUpSequenceContacts() {
  if (isDemo()) return demo.demoContacts.filter(c => ['New Lead','Follow-Up'].includes(c.lead_status))
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .in('lead_status', ['New Lead', 'Follow-Up'])
    .neq('customer_replied', 'Yes')
    .neq('unsubscribe', 'Yes')
    .order('last_followup_date', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data
}

export async function getFollowupSettings() {
  if (isDemo()) return []
  const { data, error } = await supabase
    .from('followup_settings')
    .select('*')
    .order('step_number', { ascending: true })
  if (error) throw error
  return data
}

export async function saveFollowupSettings(steps) {
  blockIfDemo()
  const { error: delError } = await supabase
    .from('followup_settings')
    .delete()
    .gte('step_number', 1)
  if (delError) throw delError
  if (steps.length === 0) return []
  const rows = steps.map((s, i) => ({
    step_number:    i + 1,
    label:          s.label || `Follow-up ${i + 1}`,
    wait_hours:     Number(s.wait_hours) || 24,
    sms_enabled:    s.sms_enabled ?? true,
    sms_template:   s.sms_template || '',
    email_enabled:  s.email_enabled ?? false,
    email_subject:  s.email_subject || '',
    email_template: s.email_template || '',
    is_active:      s.is_active ?? true,
  }))
  const { data, error } = await supabase
    .from('followup_settings')
    .insert(rows)
    .select()
  if (error) throw error
  return data
}

export async function getFollowupLogs({ limit = 100, offset = 0 } = {}) {
  if (isDemo()) return []
  const { data, error } = await supabase
    .from('followup_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return data
}

// ─── EMAIL AUTOMATION ────────────────────────────────────────────────────────

export async function getEmailCampaigns() {
  if (isDemo()) return demo.demoCampaigns
  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createEmailCampaign(campaign) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('email_campaigns')
    .insert(campaign)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateEmailCampaign(id, updates) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('email_campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEmailCampaign(id) {
  blockIfDemo()
  const { error } = await supabase
    .from('email_campaigns')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getEmailSteps(campaignId) {
  if (isDemo()) return demo.demoSteps[campaignId] || []
  const { data, error } = await supabase
    .from('email_steps')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('step_number', { ascending: true })
  if (error) throw error
  return data
}

export async function createEmailStep(step) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('email_steps')
    .insert(step)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateEmailStep(id, updates) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('email_steps')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEmailStep(id) {
  blockIfDemo()
  const { error } = await supabase
    .from('email_steps')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getEmailLeads(campaignId) {
  if (isDemo()) return demo.demoLeads[campaignId] || []
  const { data, error } = await supabase
    .from('email_leads')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// A contact may belong to only ONE campaign at a time. Returns the set of
// lowercased emails (from this list) that are already enrolled in any outreach
// lead OR nurture client, so duplicate enrollment can be blocked.
export async function enrolledEmailSet(emails) {
  if (isDemo()) return new Set()
  const list = [...new Set((emails || []).map(e => (e || '').trim().toLowerCase()).filter(Boolean))]
  if (list.length === 0) return new Set()
  const [a, b] = await Promise.all([
    supabase.from('email_leads').select('email').in('email', list),
    supabase.from('nurture_clients').select('email').in('email', list),
  ])
  if (a.error) throw a.error
  if (b.error) throw b.error
  const set = new Set()
  for (const r of [...(a.data || []), ...(b.data || [])]) set.add((r.email || '').trim().toLowerCase())
  return set
}

// Keep only rows whose (lowercased) email isn't already enrolled and isn't a
// duplicate within this batch. Throws DUP_ALL if nothing is left to insert.
async function dedupeForEnrollment(rows) {
  const taken = await enrolledEmailSet(rows.map(r => r.email))
  const seen = new Set()
  const fresh = []
  for (const r of rows) {
    const e = (r.email || '').trim().toLowerCase()
    if (!e || taken.has(e) || seen.has(e)) continue
    seen.add(e)
    fresh.push({ ...r, email: e })
  }
  if (fresh.length === 0) {
    const err = new Error('Every email is already enrolled in a campaign. A contact can only be in one campaign at a time.')
    err.code = 'DUP_ALL'
    throw err
  }
  return fresh
}

export async function createEmailLeads(leads) {
  blockIfDemo()
  const fresh = await dedupeForEnrollment(leads)
  const { data, error } = await supabase
    .from('email_leads')
    .insert(fresh)
    .select()
  if (error) throw error
  return data
}

export async function deleteEmailLead(id) {
  blockIfDemo()
  const { error } = await supabase
    .from('email_leads')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function updateEmailLead(id, updates) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('email_leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Bulk-set fields on every lead in a campaign (e.g. turn AI auto-reply on/off for all).
export async function updateEmailLeadsByCampaign(campaignId, updates) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('email_leads')
    .update(updates)
    .eq('campaign_id', campaignId)
    .select()
  if (error) throw error
  return data
}

export async function getEmailMessages(leadId) {
  if (isDemo()) return demo.demoEmailMessages[leadId] || []
  const { data, error } = await supabase
    .from('email_messages')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getAllEmailLeads() {
  if (isDemo()) return Object.values(demo.demoLeads).flat()
  const { data, error } = await supabase
    .from('email_leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ─── CLIENT NURTURE ──────────────────────────────────────────────────────────

export async function getNurtureCampaigns() {
  if (isDemo()) return demo.demoCampaigns.filter(c => c.type === 'nurture')
  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('type', 'nurture')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getNurtureClients(campaignId) {
  if (isDemo()) return demo.demoNurtureClients[campaignId] || []
  const { data, error } = await supabase
    .from('nurture_clients')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createNurtureClients(clients) {
  blockIfDemo()
  const fresh = await dedupeForEnrollment(clients)
  const { data, error } = await supabase
    .from('nurture_clients')
    .insert(fresh)
    .select()
  if (error) throw error
  return data
}

export async function updateNurtureClient(id, updates) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('nurture_clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteNurtureClient(id) {
  blockIfDemo()
  const { error } = await supabase
    .from('nurture_clients')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// Bulk-set fields on every client in a nurture campaign (e.g. turn AI auto-reply on/off).
export async function updateNurtureClientsByCampaign(campaignId, updates) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('nurture_clients')
    .update(updates)
    .eq('campaign_id', campaignId)
    .select()
  if (error) throw error
  return data
}

export async function getNurtureMessages(clientId) {
  if (isDemo()) return demo.demoNurtureMessages[clientId] || []
  const { data, error } = await supabase
    .from('nurture_messages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getAllNurtureClients() {
  if (isDemo()) return Object.values(demo.demoNurtureClients).flat()
  const { data, error } = await supabase
    .from('nurture_clients')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Returns all threads (leads + nurture clients with ≥1 message) sorted by latest message.
export async function getInboxThreads() {
  if (isDemo()) return demo.demoInboxThreads()
  const [leadsRes, clientsRes, campaignsRes, emailMsgsRes, nurtureMsgsRes] = await Promise.all([
    supabase.from('email_leads').select('id, name, email, campaign_id, replied, ai_reply_enabled'),
    supabase.from('nurture_clients').select('id, name, email, campaign_id, ai_reply_enabled'),
    supabase.from('email_campaigns').select('id, name, type'),
    supabase.from('email_messages').select('lead_id, direction, body, subject, created_at').order('created_at', { ascending: false }),
    supabase.from('nurture_messages').select('client_id, direction, body, subject, created_at').order('created_at', { ascending: false }),
  ])
  for (const r of [leadsRes, clientsRes, campaignsRes, emailMsgsRes, nurtureMsgsRes]) {
    if (r.error) throw r.error
  }
  const campMap = {}
  for (const c of campaignsRes.data || []) campMap[c.id] = c
  const latestEmail = {}, latestInboundEmail = {}
  for (const m of emailMsgsRes.data || []) {
    if (!latestEmail[m.lead_id]) latestEmail[m.lead_id] = m
    if (m.direction === 'inbound' && !latestInboundEmail[m.lead_id]) latestInboundEmail[m.lead_id] = m
  }
  const latestNurture = {}, latestInboundNurture = {}
  for (const m of nurtureMsgsRes.data || []) {
    if (!latestNurture[m.client_id]) latestNurture[m.client_id] = m
    if (m.direction === 'inbound' && !latestInboundNurture[m.client_id]) latestInboundNurture[m.client_id] = m
  }
  const threads = []
  for (const l of leadsRes.data || []) {
    const latest = latestEmail[l.id]
    if (!latest) continue
    threads.push({ id: l.id, kind: 'email', name: l.name || l.email, email: l.email, campaignId: l.campaign_id, campaign: campMap[l.campaign_id] || null, latestMessage: latest, latestInbound: latestInboundEmail[l.id] || null, aiReplyEnabled: l.ai_reply_enabled !== false })
  }
  for (const c of clientsRes.data || []) {
    const latest = latestNurture[c.id]
    if (!latest) continue
    threads.push({ id: c.id, kind: 'nurture', name: c.name || c.email, email: c.email, campaignId: c.campaign_id, campaign: campMap[c.campaign_id] || null, latestMessage: latest, latestInbound: latestInboundNurture[c.id] || null, aiReplyEnabled: c.ai_reply_enabled !== false })
  }
  return threads.sort((a, b) => new Date(b.latestMessage.created_at) - new Date(a.latestMessage.created_at))
}

// Returns { [email_lowercase]: campaignName } for every enrolled email (outreach + nurture).
export async function getContactEnrollments() {
  if (isDemo()) return demo.demoContactEnrollments()
  const [leadsRes, clientsRes, campaignsRes] = await Promise.all([
    supabase.from('email_leads').select('email, campaign_id'),
    supabase.from('nurture_clients').select('email, campaign_id'),
    supabase.from('email_campaigns').select('id, name'),
  ])
  if (leadsRes.error || clientsRes.error || campaignsRes.error) return {}
  const campMap = {}
  for (const c of campaignsRes.data || []) campMap[c.id] = c.name
  const map = {}
  for (const r of [...(leadsRes.data || []), ...(clientsRes.data || [])]) {
    const e = (r.email || '').trim().toLowerCase()
    if (e && r.campaign_id) map[e] = campMap[r.campaign_id] || 'Campaign'
  }
  return map
}

// Computed board for the built-in "Email Follow-up" pipeline. Not stored —
// derived live from email_leads / nurture_clients / nurture_messages so it
// can never drift from what the n8n workflows actually did.
export async function getEmailPipelineLeads() {
  if (isDemo()) return demo.demoEmailPipelineLeads()
  const [leadsRes, clientsRes, campaignsRes, nurtureMsgsRes] = await Promise.all([
    supabase.from('email_leads').select('id, name, email, campaign_id, status, replied, emails_sent, created_at'),
    supabase.from('nurture_clients').select('id, name, email, campaign_id, status, emails_sent, created_at'),
    supabase.from('email_campaigns').select('id, name, type'),
    supabase.from('nurture_messages').select('client_id, direction'),
  ])
  for (const r of [leadsRes, clientsRes, campaignsRes, nurtureMsgsRes]) {
    if (r.error) throw r.error
  }
  const campMap = {}
  for (const c of campaignsRes.data || []) campMap[c.id] = c
  const repliedClientIds = new Set()
  for (const m of nurtureMsgsRes.data || []) {
    if (m.direction === 'inbound') repliedClientIds.add(m.client_id)
  }

  const rows = []
  for (const l of leadsRes.data || []) {
    const camp = campMap[l.campaign_id] || null
    let stage = 'Enrolled Leads'
    if (l.status === 'Unsubscribed') stage = 'Unsubscribed'
    else if (l.replied) stage = 'Replied'
    else if (l.status === 'Completed' || l.status === 'Error') stage = 'Completed'
    else if ((l.emails_sent || 0) >= 1) stage = 'Email Sent'
    rows.push({ id: l.id, kind: 'outreach', name: l.name || l.email, email: l.email, campaignId: l.campaign_id, campaign: camp, stage, emailsSent: l.emails_sent || 0, createdAt: l.created_at })
  }
  for (const c of clientsRes.data || []) {
    const camp = campMap[c.campaign_id] || null
    const hasReplied = repliedClientIds.has(c.id)
    let stage = 'Enrolled Leads'
    if (hasReplied) stage = 'Replied'
    else if (c.status === 'Paused') stage = 'Completed'
    else if ((c.emails_sent || 0) >= 1) stage = 'Email Sent'
    rows.push({ id: c.id, kind: 'nurture', name: c.name || c.email, email: c.email, campaignId: c.campaign_id, campaign: camp, stage, emailsSent: c.emails_sent || 0, createdAt: c.created_at })
  }
  return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// ─── PIPELINES (admin-created) ──────────────────────────────────────────────
// Custom pipelines are fully additive: separate tables, never touch
// contacts.lead_status (the built-in "Sales Pipeline" used by automation).

export async function getPipelines() {
  if (isDemo()) return demo.demoPipelinesList()
  const [pipelinesRes, stagesRes, countsRes] = await Promise.all([
    supabase.from('pipelines').select('*').order('created_at', { ascending: true }),
    supabase.from('pipeline_stages').select('*').order('position', { ascending: true }),
    supabase.from('contact_pipeline_stages').select('pipeline_id, stage_id'),
  ])
  if (pipelinesRes.error) throw pipelinesRes.error
  if (stagesRes.error) throw stagesRes.error
  if (countsRes.error) throw countsRes.error

  const stageCounts = {}
  for (const r of countsRes.data || []) stageCounts[r.stage_id] = (stageCounts[r.stage_id] || 0) + 1

  const stagesByPipeline = {}
  for (const s of stagesRes.data || []) {
    if (!stagesByPipeline[s.pipeline_id]) stagesByPipeline[s.pipeline_id] = []
    stagesByPipeline[s.pipeline_id].push({ ...s, contactCount: stageCounts[s.id] || 0 })
  }

  return (pipelinesRes.data || []).map(p => ({ ...p, stages: stagesByPipeline[p.id] || [] }))
}

export async function createPipeline(name, stageNames) {
  blockIfDemo()
  const { data: pipeline, error: pErr } = await supabase
    .from('pipelines')
    .insert({ name })
    .select()
    .single()
  if (pErr) throw pErr

  const stageRows = stageNames.map((name, i) => ({ pipeline_id: pipeline.id, name, position: i }))
  const { data: stages, error: sErr } = await supabase
    .from('pipeline_stages')
    .insert(stageRows)
    .select()
  if (sErr) throw sErr

  return { ...pipeline, stages: stages.map(s => ({ ...s, contactCount: 0 })) }
}

export async function renamePipeline(id, name) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('pipelines')
    .update({ name })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePipeline(id) {
  blockIfDemo()
  const { error } = await supabase
    .from('pipelines')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function addPipelineStage(pipelineId, name, position) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('pipeline_stages')
    .insert({ pipeline_id: pipelineId, name, position })
    .select()
    .single()
  if (error) throw error
  return { ...data, contactCount: 0 }
}

export async function renamePipelineStage(id, name) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('pipeline_stages')
    .update({ name })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function reorderPipelineStages(updates) {
  blockIfDemo()
  await Promise.all(updates.map(({ id, position }) =>
    supabase.from('pipeline_stages').update({ position }).eq('id', id)
  ))
}

export async function deletePipelineStage(id) {
  blockIfDemo()
  const { error } = await supabase
    .from('pipeline_stages')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getPipelineBoard(pipelineId) {
  if (isDemo()) return demo.demoPipelineBoard(pipelineId)
  const { data, error } = await supabase
    .from('contact_pipeline_stages')
    .select('id, contact_id, stage_id, contacts(id, name, email, phone, source, interest, service_type, avatar, avatar_color)')
    .eq('pipeline_id', pipelineId)
  if (error) throw error
  return (data || []).filter(r => r.contacts).map(r => ({ assignmentId: r.id, stageId: r.stage_id, ...r.contacts }))
}

export async function assignContactToPipeline(contactId, pipelineId, stageId) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('contact_pipeline_stages')
    .upsert({ contact_id: contactId, pipeline_id: pipelineId, stage_id: stageId, updated_at: new Date().toISOString() }, { onConflict: 'contact_id,pipeline_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeContactFromPipeline(contactId, pipelineId) {
  blockIfDemo()
  const { error } = await supabase
    .from('contact_pipeline_stages')
    .delete()
    .eq('contact_id', contactId)
    .eq('pipeline_id', pipelineId)
  if (error) throw error
}

export async function getContactPipelineAssignments(contactId) {
  if (isDemo()) return demo.demoContactPipelineAssignments(contactId)
  const { data, error } = await supabase
    .from('contact_pipeline_stages')
    .select('pipeline_id, stage_id, pipelines(name), pipeline_stages(name)')
    .eq('contact_id', contactId)
  if (error) throw error
  return (data || []).map(r => ({
    pipelineId: r.pipeline_id,
    pipelineName: r.pipelines?.name || 'Pipeline',
    stageId: r.stage_id,
    stageName: r.pipeline_stages?.name || 'Stage',
  }))
}

// ─── REVIEW CAMPAIGNS ────────────────────────────────────────────────────────

export async function getReviewCampaigns() {
  if (isDemo()) return []
  const { data, error } = await supabase
    .from('review_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createReviewCampaign(campaign) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('review_campaigns')
    .insert(campaign)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateReviewCampaign(id, updates) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('review_campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteReviewCampaign(id) {
  blockIfDemo()
  const { error } = await supabase
    .from('review_campaigns')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getReviewLeads(campaignId) {
  if (isDemo()) return []
  const { data, error } = await supabase
    .from('review_leads')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createReviewLeads(leads) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('review_leads')
    .insert(leads)
    .select()
  if (error) throw error
  return data
}

export async function updateReviewLead(id, updates) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('review_leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteReviewLead(id) {
  blockIfDemo()
  const { error } = await supabase
    .from('review_leads')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// Public — preview mode: fetch campaign settings by ID (no lead needed)
export async function getReviewCampaignPreview(id) {
  const { data, error } = await supabase
    .from('review_campaigns')
    .select('form_logo_url, form_title, form_subtitle, review_link')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Public — called by the review form page (no auth needed, anon key)
export async function getReviewFormData(token) {
  const { data, error } = await supabase
    .from('review_leads')
    .select('*, review_campaigns(*)')
    .eq('token', token)
    .single()
  if (error) throw error
  return data
}

export async function submitReviewByToken(token, updates) {
  const { data, error } = await supabase
    .from('review_leads')
    .update(updates)
    .eq('token', token)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── SEARCH SUGGESTIONS ──────────────────────────────────────────────────────

export async function searchContacts(query) {
  if (!query || query.trim().length < 2) return []
  const q = query.trim().toLowerCase()
  if (isDemo()) {
    return demo.demoContacts
      .filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.service_type || '').toLowerCase().includes(q))
      .slice(0, 6)
  }
  const { data, error } = await supabase
    .from('contacts')
    .select('id, name, email, phone, lead_status, source, avatar, avatar_color')
    .or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,service_type.ilike.%${q}%`)
    .order('last_action_date', { ascending: false })
    .limit(6)
  if (error) return []
  return data
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

export async function getDashboardStats() {
  if (isDemo()) return demo.demoDashboardStats()
  const [contactsRes, followupsRes, executionsRes] = await Promise.all([
    supabase.from('contacts').select('*'),
    supabase.from('followups').select('status, follow_up_date'),
    supabase.from('workflow_executions').select('status, automation, timestamp'),
  ])

  if (contactsRes.error) throw contactsRes.error
  if (followupsRes.error) throw followupsRes.error
  if (executionsRes.error) throw executionsRes.error

  const contacts = contactsRes.data
  const followups = followupsRes.data
  const executions = executionsRes.data

  const today = new Date().toISOString().split('T')[0]

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
    sourceBreakdown: contacts.reduce((acc, c) => {
      if (c.source) acc[c.source] = (acc[c.source] || 0) + 1
      return acc
    }, {}),
    recentContacts: [...contacts]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6),
  }
}
