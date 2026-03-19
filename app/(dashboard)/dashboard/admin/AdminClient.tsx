'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import {
  AlertTriangle,
  Megaphone,
  Users,
  ClipboardCheck,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'

type AdminTab = 'issues' | 'announcements' | 'team' | 'messages'

// Kept for compatibility with preview tooling that imports this type.
// This is a type-only export and does not affect runtime logic.
export type AdminInitialData = {
  company: { id: string; name: string; auth_key: string } | null
  vehicles: Array<{ id: string; code: string }>
  cardMappings: unknown[]
  apiConfig: unknown | null
}

interface AdminClientProps {
  user: User
  initialTab?: string | null
  inspectionId?: string | null
  vehicleId?: string | null
}

type IssueRow = {
  id: string
  vehicle_id: string
  title: string
  description: string | null
  status: string
  priority: string
  source?: string | null
  reported_date: string
  created_at?: string
  inspection_id?: string | null
  vehicles?: { id: string; code: string | null; location?: string | null } | null
}

type AnnouncementRow = {
  id: string
  title: string
  body: string
  is_active: boolean
  created_at: string
  target_territory?: string | null
  expires_at?: string | null
}

type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  territory: string | null
}

function timeAgoMessages(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const s = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  return d.toLocaleDateString()
}

function dedupeSentMessages<T extends { title: string; body: string; created_at: string }>(rows: T[]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const r of rows) {
    const key = `${r.title}\n${r.body}\n${r.created_at.slice(0, 19)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out
}

export default function AdminClient({
  user,
  initialTab,
  inspectionId,
  vehicleId,
}: AdminClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const companyId = (user?.user_metadata?.company_id as string) || null

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (
      initialTab === 'issues' ||
      initialTab === 'announcements' ||
      initialTab === 'team' ||
      initialTab === 'messages'
    )
      return initialTab
    return 'issues'
  })

  const [issues, setIssues] = useState<IssueRow[]>([])
  const [issuesLoading, setIssuesLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [territoryFilter, setTerritoryFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    body: '',
    target_territory: 'all',
    expires_at: '',
    is_active: true,
  })
  const [announcementSaving, setAnnouncementSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [teamMembers, setTeamMembers] = useState<ProfileRow[]>([])
  const [companyConfig, setCompanyConfig] = useState<{
    manager_access_code?: string | null
    driver_access_code?: string | null
  } | null>(null)
  const [teamLoading, setTeamLoading] = useState(true)
  const [editingTerritoryId, setEditingTerritoryId] = useState<string | null>(null)
  const [editingTerritoryValue, setEditingTerritoryValue] = useState<string>('')
  const [copiedCode, setCopiedCode] = useState<'manager' | 'driver' | null>(null)

  const [msgRecipient, setMsgRecipient] = useState('all')
  const [msgTitle, setMsgTitle] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [msgSending, setMsgSending] = useState(false)
  const [msgSuccess, setMsgSuccess] = useState(false)
  const [sentMessages, setSentMessages] = useState<
    Array<{ id: string; title: string; body: string; recipient_territory: string | null; created_at: string; recipient_user_id?: string | null }>
  >([])
  const [drivers, setDrivers] = useState<
    Array<{ id: string; first_name: string | null; last_name: string | null; location: string | null; user_id: string | null }>
  >([])

  useEffect(() => {
    if (initialTab === 'issues' && (inspectionId || vehicleId)) setActiveTab('issues')
  }, [initialTab, inspectionId, vehicleId])

  const loadIssues = useCallback(async () => {
    if (!companyId) return
    setIssuesLoading(true)
    try {
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('id, code, location')
        .eq('company_id', companyId)
      const vehicleIds = (vehiclesData || []).map((v) => v.id)
      const vehicleMap = new Map((vehiclesData || []).map((v) => [v.id, v]))

      if (vehicleIds.length === 0) {
        setIssues([])
        setIssuesLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('issues')
        .select('id, vehicle_id, title, description, status, priority, source, reported_date, created_at, inspection_id')
        .in('vehicle_id', vehicleIds)
        .neq('status', 'resolved')
        .order('created_at', { ascending: false })
      if (error) throw error
      const withVehicles = (data || []).map((row) => ({
        ...row,
        vehicles: vehicleMap.get(row.vehicle_id) ?? null,
      }))
      setIssues(withVehicles as IssueRow[])
    } catch (e) {
      console.error(e)
      setIssues([])
    } finally {
      setIssuesLoading(false)
    }
  }, [companyId, supabase])

  const loadAnnouncements = useCallback(async () => {
    if (!companyId) return
    setAnnouncementsLoading(true)
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setAnnouncements((data as AnnouncementRow[]) || [])
    } catch (e) {
      console.error(e)
      setAnnouncements([])
    } finally {
      setAnnouncementsLoading(false)
    }
  }, [companyId, supabase])

  const loadTeam = useCallback(async () => {
    if (!companyId) return
    setTeamLoading(true)
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, territory')
        .eq('company_id', companyId)
      if (profilesError) throw profilesError
      setTeamMembers((profilesData as ProfileRow[]) || [])

      const res = await fetch(`/api/company-config?company_id=${encodeURIComponent(companyId)}`)
      if (res.ok) {
        const config = await res.json()
        setCompanyConfig({
          manager_access_code: config.manager_access_code ?? null,
          driver_access_code: config.driver_access_code ?? null,
        })
      } else {
        setCompanyConfig(null)
      }
    } catch (e) {
      console.error(e)
      setTeamMembers([])
    } finally {
      setTeamLoading(false)
    }
  }, [companyId, supabase])

  useEffect(() => {
    if (activeTab === 'issues') loadIssues()
  }, [activeTab, loadIssues])

  useEffect(() => {
    if (activeTab === 'announcements') loadAnnouncements()
  }, [activeTab, loadAnnouncements])

  useEffect(() => {
    if (activeTab === 'team') loadTeam()
  }, [activeTab, loadTeam])

  const loadMessagesTab = useCallback(async () => {
    if (!companyId) return
    try {
      let { data: driversData, error: driversErr } = await supabase
        .from('drivers')
        .select('id, first_name, last_name, location, user_id')
        .eq('company_id', companyId)
        .eq('active', true)
        .order('first_name')

      if (driversErr) {
        const fb = await supabase
          .from('drivers')
          .select('id, first_name, last_name, location, user_id')
          .eq('company_id', companyId)
          .order('first_name')
        driversData = fb.data
      }

      setDrivers(driversData ?? [])

      const { data: msgsData } = await supabase
        .from('notifications')
        .select('id, title, body, recipient_territory, created_at, recipient_user_id')
        .eq('company_id', companyId)
        .eq('type', 'announcement')
        .order('created_at', { ascending: false })
        .limit(200)

      setSentMessages(dedupeSentMessages(msgsData ?? []))
    } catch (e) {
      console.error(e)
      setDrivers([])
      setSentMessages([])
    }
  }, [companyId, supabase])

  useEffect(() => {
    if (activeTab === 'messages') void loadMessagesTab()
  }, [activeTab, loadMessagesTab])

  const handleSendMessage = async () => {
    if (!msgTitle.trim() || !msgBody.trim() || !companyId) return
    setMsgSending(true)
    setMsgSuccess(false)
    setToast(null)
    try {
      const res = await fetch('/api/notifications/manager-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: msgTitle.trim(),
          body: msgBody.trim(),
          recipient: msgRecipient,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'Failed to send message')

      setMsgTitle('')
      setMsgBody('')
      setMsgRecipient('all')
      setMsgSuccess(true)
      window.setTimeout(() => setMsgSuccess(false), 3000)

      const { data } = await supabase
        .from('notifications')
        .select('id, title, body, recipient_territory, created_at, recipient_user_id')
        .eq('company_id', companyId)
        .eq('type', 'announcement')
        .order('created_at', { ascending: false })
        .limit(200)
      setSentMessages(dedupeSentMessages(data ?? []))
    } catch (e: unknown) {
      console.error('Send message error:', e)
      setToast({ type: 'error', message: (e as Error).message || 'Failed to send message' })
    } finally {
      setMsgSending(false)
    }
  }

  const filteredIssues = issues.filter((issue) => {
    if (inspectionId && (issue.inspection_id ?? null) !== inspectionId) return false
    const vehicle = issue.vehicles
    const location = vehicle?.location ?? null
    if (sourceFilter !== 'all' && (issue.source ?? 'manual') !== sourceFilter) return false
    if (territoryFilter !== 'all') {
      const loc = (location ?? '').trim() || 'All'
      if (loc !== territoryFilter) return false
    }
    if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false
    return true
  })

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId || !announcementForm.title.trim()) return
    setAnnouncementSaving(true)
    setToast(null)
    try {
      const payload: Record<string, unknown> = {
        company_id: companyId,
        title: announcementForm.title.trim(),
        body: announcementForm.body.trim() || '',
        target_territory: announcementForm.target_territory === 'all' ? null : announcementForm.target_territory,
        expires_at: announcementForm.expires_at ? announcementForm.expires_at : null,
        is_active: announcementForm.is_active,
      }
      const { error } = await supabase.from('announcements').insert(payload)
      if (error) throw error
      setToast({
        type: 'success',
        message: `Announcement sent to ${announcementForm.target_territory === 'all' ? 'all' : announcementForm.target_territory} drivers`,
      })
      setAnnouncementForm({ title: '', body: '', target_territory: 'all', expires_at: '', is_active: true })
      setShowAnnouncementForm(false)
      loadAnnouncements()
    } catch (err: unknown) {
      setToast({ type: 'error', message: (err as Error).message || 'Failed to publish' })
    } finally {
      setAnnouncementSaving(false)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await supabase.from('announcements').update({ is_active: false }).eq('id', id)
      loadAnnouncements()
      setToast({ type: 'success', message: 'Announcement removed' })
    } catch {
      setToast({ type: 'error', message: 'Failed to delete' })
    }
  }

  const handleSaveTerritory = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ territory: editingTerritoryValue || '' })
        .eq('id', profileId)
      if (error) throw error
      const name = teamMembers.find((m) => m.id === profileId)?.full_name || teamMembers.find((m) => m.id === profileId)?.email || 'User'
      setToast({
        type: 'success',
        message: `Territory updated — ${name} will now receive notifications for ${editingTerritoryValue || 'all territories'} drivers`,
      })
      setEditingTerritoryId(null)
      loadTeam()
    } catch {
      setToast({ type: 'error', message: 'Failed to update territory' })
    }
  }

  const copyCode = (kind: 'manager' | 'driver') => {
    const value =
      kind === 'manager' ? companyConfig?.manager_access_code : companyConfig?.driver_access_code
    if (value) {
      navigator.clipboard.writeText(value)
      setCopiedCode(kind)
      setTimeout(() => setCopiedCode(null), 2000)
    }
  }

  const priorityBorder: Record<string, string> = {
    critical: 'border-l-red-500',
    high: 'border-l-amber-500',
    medium: 'border-l-blue-500',
    low: 'border-l-slate-500',
  }

  if (!companyId) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <p className="text-slate-400">No company assigned. Activate with a company key in Settings.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-white">Admin</h1>
          <p className="text-sm text-slate-400 mt-1">Issues, announcements, team, and driver messages</p>
        </div>

        {toast && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl text-sm ${
              toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {toast.message}
          </div>
        )}

        <div className="flex gap-2 border-b border-white/[0.08] mb-6 flex-wrap">
          {(
            [
              { id: 'issues' as const, label: 'Issues', icon: ClipboardCheck },
              { id: 'announcements' as const, label: 'Announcements', icon: Megaphone },
              { id: 'team' as const, label: 'Team', icon: Users },
              { id: 'messages' as const, label: 'Messages', icon: MessageSquare },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === id
                  ? 'bg-white/[0.08] text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon size={14} /> {label}
              </span>
            </button>
          ))}
        </div>

        {/* Tab: Issues */}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            {inspectionId && (
              <div className="w-full mb-3 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
                Showing issues for this inspection (filtered by inspection ID).
              </div>
            )}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-500">Source:</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-1.5 text-sm text-white"
              >
                <option value="all">All</option>
                <option value="pre_trip">Pre-Trip</option>
                <option value="post_trip">Post-Trip</option>
                <option value="manual">Manual</option>
              </select>
              <span className="text-xs text-slate-500 ml-2">Territory:</span>
              <select
                value={territoryFilter}
                onChange={(e) => setTerritoryFilter(e.target.value)}
                className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-1.5 text-sm text-white"
              >
                <option value="all">All</option>
                <option value="New York">New York</option>
                <option value="DMV">DMV</option>
              </select>
              <span className="text-xs text-slate-500 ml-2">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-1.5 text-sm text-white"
              >
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {issuesLoading ? (
              <p className="text-slate-500">Loading issues...</p>
            ) : filteredIssues.length === 0 ? (
              <p className="text-slate-500">No open issues.</p>
            ) : (
              <div className="space-y-2">
                {filteredIssues.map((issue) => {
                  const vehicle = issue.vehicles
                  const loc = (vehicle?.location ?? '').trim() || '—'
                  const isFromDeepLink = Boolean(inspectionId && (issue.inspection_id ?? null) === inspectionId)
                  return (
                    <div
                      key={issue.id}
                      onClick={() => router.push(`/dashboard/vehicles/${issue.vehicle_id}`)}
                      className={`flex items-center gap-4 p-4 rounded-xl border border-l-4 cursor-pointer hover:bg-white/[0.06] transition-colors ${priorityBorder[issue.priority] || 'border-l-slate-500'} ${isFromDeepLink ? 'bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/20' : 'bg-white/[0.04] border-white/[0.06]'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-white">{vehicle?.code ?? issue.vehicle_id}</span>
                          <span className="text-sm text-white">{issue.title}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.1] text-slate-400">
                            {(issue.source ?? 'manual') === 'pre_trip' ? 'Pre-Trip' : (issue.source === 'post_trip' ? 'Post-Trip' : 'Manual')}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.1] text-slate-400">{loc}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(issue.reported_date).toLocaleString()}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-slate-500 flex-shrink-0" />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab: Announcements */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600"
              >
                <Plus size={16} /> New Announcement
              </button>
            </div>

            {showAnnouncementForm && (
              <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                <h3 className="text-lg font-semibold text-white mb-4">New Announcement</h3>
                <form onSubmit={handlePublishAnnouncement} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Title</label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm((f) => ({ ...f, title: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500"
                      placeholder="Announcement title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Body</label>
                    <textarea
                      value={announcementForm.body}
                      onChange={(e) => setAnnouncementForm((f) => ({ ...f, body: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 resize-none"
                      placeholder="Message to drivers"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Target</label>
                    <div className="flex flex-wrap gap-2">
                      {['all', 'New York', 'DMV'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAnnouncementForm((f) => ({ ...f, target_territory: t === 'all' ? 'all' : t }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            announcementForm.target_territory === (t === 'all' ? 'all' : t)
                              ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                              : 'bg-white/[0.04] border border-white/[0.08] text-slate-400'
                          }`}
                        >
                          {t === 'all' ? 'All Drivers' : t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Expires at (optional)</label>
                    <input
                      type="date"
                      value={announcementForm.expires_at}
                      onChange={(e) => setAnnouncementForm((f) => ({ ...f, expires_at: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.1] rounded-xl text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="announcement-active"
                      checked={announcementForm.is_active}
                      onChange={(e) => setAnnouncementForm((f) => ({ ...f, is_active: e.target.checked }))}
                      className="rounded border-white/20 bg-white/[0.06] text-blue-500 focus:ring-blue-500/50"
                    />
                    <label htmlFor="announcement-active" className="text-sm text-slate-300">Active (visible to drivers)</label>
                  </div>
                  <button
                    type="submit"
                    disabled={announcementSaving}
                    className="px-6 py-2.5 rounded-xl bg-blue-500 text-white font-medium disabled:opacity-50"
                  >
                    {announcementSaving ? 'Publishing...' : 'Publish'}
                  </button>
                </form>
              </div>
            )}

            {announcementsLoading ? (
              <p className="text-slate-500">Loading announcements...</p>
            ) : announcements.length === 0 ? (
              <p className="text-slate-500">No announcements yet.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{a.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${a.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                          {a.is_active ? 'Active' : 'Expired'}
                        </span>
                        {(a as AnnouncementRow).target_territory && (
                          <span className="text-xs text-slate-500">{(a as AnnouncementRow).target_territory}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">{a.body}</p>
                      <p className="text-xs text-slate-600 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDeleteAnnouncement(a.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Messages (driver notifications) */}
        {activeTab === 'messages' && (
          <div className="space-y-4">
            <div className="card-glass rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white">Send Message to Driver</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Messages appear as notifications in the driver&apos;s app
                </p>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Send To</label>
                  <select
                    value={msgRecipient}
                    onChange={(e) => setMsgRecipient(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="all">Everyone (all drivers)</option>
                    <option value="ny">New York drivers only</option>
                    <option value="dmv">DMV drivers only</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.user_id ?? d.id}>
                        {d.first_name} {d.last_name} — {d.location ?? 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Title</label>
                  <input
                    type="text"
                    value={msgTitle}
                    onChange={(e) => setMsgTitle(e.target.value)}
                    placeholder="e.g. Route change today"
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider mb-2 block">Message</label>
                  <textarea
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    placeholder="Type your message to drivers..."
                    rows={3}
                    className="input-field resize-none w-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void handleSendMessage()}
                  disabled={!msgTitle.trim() || !msgBody.trim() || msgSending}
                  className="btn-primary px-6 py-2.5 flex items-center gap-2 disabled:opacity-50"
                >
                  {msgSending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <MessageSquare size={14} />
                  )}
                  {msgSending ? 'Sending...' : 'Send Message'}
                </button>

                {msgSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                    ✓ Message sent successfully
                  </div>
                )}
              </div>
            </div>

            <div className="card-glass rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white">Recent Messages</h2>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {sentMessages.length === 0 ? (
                  <div className="px-5 py-8 text-center text-slate-500 text-sm">No messages sent yet</div>
                ) : (
                  sentMessages.map((msg) => (
                    <div key={msg.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{msg.title}</p>
                          <p className="text-xs text-slate-400 mt-1">{msg.body}</p>
                          <p className="text-[10px] text-slate-600 mt-2">
                            To:{' '}
                            {msg.recipient_user_id
                              ? 'Individual'
                              : msg.recipient_territory === 'New York'
                                ? 'New York'
                                : msg.recipient_territory === 'DMV'
                                  ? 'DMV'
                                  : 'Everyone'}{' '}
                            · {timeAgoMessages(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Team */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            {companyConfig && (
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                <h3 className="text-sm font-semibold text-white mb-3">Company access codes</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-24">Manager code:</span>
                    <code className="flex-1 px-3 py-2 rounded-lg bg-white/[0.06] text-sm font-mono text-white truncate">
                      {companyConfig.manager_access_code || '—'}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyCode('manager')}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    >
                      {copiedCode === 'manager' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-24">Driver code:</span>
                    <code className="flex-1 px-3 py-2 rounded-lg bg-white/[0.06] text-sm font-mono text-white truncate">
                      {companyConfig.driver_access_code || '—'}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyCode('driver')}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    >
                      {copiedCode === 'driver' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {teamLoading ? (
              <p className="text-slate-500">Loading team...</p>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-300">
                      {(member.full_name || member.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white">{member.full_name || member.email || '—'}</div>
                      <div className="text-xs text-slate-500">{member.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.1] text-slate-400">
                          {member.role === 'owner' ? 'Owner' : member.role === 'manager' ? 'Manager' : 'Driver'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.1] text-slate-400">
                          {member.territory || 'All'}
                        </span>
                      </div>
                    </div>
                    {editingTerritoryId === member.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editingTerritoryValue}
                          onChange={(e) => setEditingTerritoryValue(e.target.value)}
                          className="bg-white/[0.06] border border-white/[0.1] rounded-lg px-2 py-1.5 text-sm text-white"
                        >
                          <option value="">All Territories</option>
                          <option value="New York">New York</option>
                          <option value="DMV">DMV</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleSaveTerritory(member.id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTerritoryId(null)}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.1] text-slate-400 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTerritoryId(member.id)
                          setEditingTerritoryValue(member.territory || '')
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] text-xs"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
