import { supabase } from '../lib/supabase'
import { isDemo, blockIfDemo } from '../lib/demo'
import * as demo from '../data/demoData'

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
  if (isDemo()) return demo.demoContacts.filter(c => c.current_step && c.current_step !== 'START')
  const { data, error } = await supabase
    .from('contacts')
    .select('id, name, phone, email, source, current_step, last_action_type, last_message_sent, last_action_date, lead_status, customer_replied, unsubscribe, avatar, avatar_color')
    .not('current_step', 'is', null)
    .neq('current_step', 'START')
    .order('last_action_date', { ascending: false })
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

export async function createEmailLeads(leads) {
  blockIfDemo()
  const { data, error } = await supabase
    .from('email_leads')
    .insert(leads)
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
  const { data, error } = await supabase
    .from('nurture_clients')
    .insert(clients)
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

export async function getAllNurtureClients() {
  if (isDemo()) return Object.values(demo.demoNurtureClients).flat()
  const { data, error } = await supabase
    .from('nurture_clients')
    .select('*')
    .order('created_at', { ascending: false })
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
