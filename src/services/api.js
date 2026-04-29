import { supabase } from '../lib/supabase'

// ─── CONTACTS ────────────────────────────────────────────────────────────────

export async function getContacts() {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getContact(id) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateContact(id, updates) {
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
  const { data, error } = await supabase
    .from('contacts')
    .insert(contact)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteContact(id) {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── CHAT MESSAGES ───────────────────────────────────────────────────────────

export async function getChatMessages(sessionId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true })
  if (error) throw error
  return data
}

export async function getAllChatSessions() {
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
  const { data, error } = await supabase
    .from('followups')
    .select('*')
    .order('follow_up_date', { ascending: true })
  if (error) throw error
  return data
}

export async function updateFollowupStatus(id, status) {
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
  const { data, error } = await supabase
    .from('followups')
    .insert(followup)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteFollowup(id) {
  const { error } = await supabase
    .from('followups')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── WORKFLOW EXECUTIONS ──────────────────────────────────────────────────────

export async function getAllWorkflowExecutions() {
  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .order('timestamp', { ascending: false })
  if (error) throw error
  return data
}

export async function getWorkflowExecutions() {
  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function getFollowUpExecutions() {
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
  const { data, error } = await supabase
    .from('contacts')
    .select('id, name, phone, email, source, current_step, last_action_type, last_message_sent, last_action_date, lead_status, customer_replied, unsubscribe, avatar, avatar_color')
    .not('current_step', 'is', null)
    .neq('current_step', 'START')
    .order('last_action_date', { ascending: false })
  if (error) throw error
  return data
}

// ─── SEARCH SUGGESTIONS ──────────────────────────────────────────────────────

export async function searchContacts(query) {
  if (!query || query.trim().length < 2) return []
  const q = query.trim()
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
