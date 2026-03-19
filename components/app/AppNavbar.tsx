'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  Users,
  ClipboardCheck,
  Info,
  Settings,
  Shield,
  ChevronDown,
  LogOut,
  Bell,
  LayoutDashboard,
  User as UserIcon,
  Activity,
  X,
  Trash2,
  CheckCheck,
  AlertTriangle,
  Megaphone,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type NavItemKey = 'home' | 'health' | 'vehicles' | 'drivers' | 'inspections' | 'admin'

type NavItem = {
  key: NavItemKey
  href: string
  label: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
}

const BASE_NAV_ITEMS: NavItem[] = [
  { key: 'health', href: '/dashboard/fleet-health', label: 'Health', icon: Activity },
  { key: 'home', href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { key: 'vehicles', href: '/dashboard/vehicles', label: 'Vehicles', icon: Truck },
  { key: 'drivers', href: '/dashboard/drivers', label: 'Drivers', icon: Users },
  { key: 'inspections', href: '/dashboard/inspections', label: 'Inspections', icon: ClipboardCheck },
  { key: 'admin', href: '/dashboard/admin', label: 'Admin', icon: Shield, adminOnly: true },
]

type NotificationRow = {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  created_at: string
  data?: Record<string, unknown>
}

export default function AppNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<{ email?: string; companyName?: string; plan?: string; initial?: string } | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [customLabels, setCustomLabels] = useState<Record<string, string> | null>(null)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [notifOpen, setNotifOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  const visibleNavItems = BASE_NAV_ITEMS.filter(
    (item) => !item.adminOnly || (userRole !== null && ['owner', 'manager'].includes(userRole))
  )

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      const companyName = (u.user_metadata?.company_name as string) || (u.user_metadata?.company_id as string) || 'Account'
      const plan = (u.user_metadata?.subscription_tier as string) || 'Professional'
      const nickname = (u.user_metadata?.nickname as string | undefined) || ''
      const baseInitial = (nickname || u.email || 'U').trim()
      const initial = baseInitial.charAt(0).toUpperCase()
      setUser({
        email: u.email,
        companyName,
        plan: plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase() + ' Plan',
        initial,
      })
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', u.id).maybeSingle()
      setUserRole((profile as { role?: string } | null)?.role ?? null)
      const companyId = u.user_metadata?.company_id as string | undefined
      if (companyId) {
        fetch(`/api/company-config?company_id=${encodeURIComponent(companyId)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((config) => {
            if (config?.custom_tab_labels && typeof config.custom_tab_labels === 'object') {
              setCustomLabels(config.custom_tab_labels as Record<string, string>)
            }
          })
          .catch(() => {
            setCustomLabels(null)
          })
      }
    })
  }, [supabase])

  const loadNotifications = async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_user_id', u.id)
      .eq('deleted', false)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) {
      setNotifications(data as NotificationRow[])
      setUnreadCount((data as NotificationRow[]).filter((n) => !n.read).length)
    }
  }

  useEffect(() => {
    loadNotifications()
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => loadNotifications())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllRead = async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return
    await supabase.from('notifications').update({ read: true }).eq('recipient_user_id', u.id).eq('read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').update({ deleted: true }).eq('id', id)
    const notif = notifications.find((n) => n.id === id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setUnreadCount((prev) => (notif && !notif.read ? prev - 1 : prev))
  }

  const clearAll = async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) return
    await supabase.from('notifications').update({ deleted: true }).eq('recipient_user_id', u.id)
    setNotifications([])
    setUnreadCount(0)
  }

  function timeAgo(dateStr: string): string {
    const d = new Date(dateStr)
    const now = new Date()
    const s = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`
    return d.toLocaleDateString()
  }

  const handleNotifClick = (notif: NotificationRow) => {
    supabase.from('notifications').update({ read: true }).eq('id', notif.id)
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => (notif.read ? prev : prev - 1))
    const params = new URLSearchParams({ tab: 'issues' })
    if (notif.type === 'inspection_failed' && notif.data?.inspection_id) params.set('inspection', String(notif.data.inspection_id))
    if (notif.type === 'issue_reported' && notif.data?.vehicle_id) params.set('vehicle', String(notif.data.vehicle_id))
    router.push(`/dashboard/admin?${params.toString()}`)
    setNotifOpen(false)
  }

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', onOutside)
      return () => document.removeEventListener('mousedown', onOutside)
    }
  }, [userMenuOpen])

  const handleLogout = async () => {
    setUserMenuOpen(false)
    try {
      await supabase.auth.signOut()
    } finally {
      window.location.href = '/'
    }
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/dashboard/home'
    }
    if (href === '/dashboard/vehicles') {
      return pathname === '/dashboard/vehicles' || pathname?.startsWith('/dashboard/vehicles/')
    }
    if (href === '/dashboard/fleet-health') {
      return pathname === '/dashboard/fleet-health' || pathname?.startsWith('/dashboard/fleet-health/')
    }
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#0A0F1E]/90 backdrop-blur-md border-b border-white/[0.06] flex items-center px-4 md:px-6">
      <Link href="/dashboard/fleet-health" className="flex items-center gap-2 mr-8 flex-shrink-0">
        <Image
          src="/branding/fleetpulse-navbar.png"
          alt="FleetPulse"
          width={1600}
          height={410}
          className="h-10 w-auto"
        />
      </Link>

      <div className="hidden md:flex items-center gap-1 flex-1">
        {visibleNavItems.map(({ href, label, key, icon: Icon }) => {
          const effectiveLabel = customLabels?.[key] ?? label
          const active = isActive(href)
          return (
            <Link
              key={href + key}
              href={href}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 group min-h-[44px] min-w-[44px] ${
                active ? 'text-white bg-white/[0.06]' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon size={15} className={active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
              {effectiveLabel}
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-blue-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {(userRole === 'owner' || userRole === 'manager') && (
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen(!notifOpen)
              if (!notifOpen && unreadCount > 0) void markAllRead()
            }}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center px-1"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[#0F1629] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {notifications.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => void markAllRead()}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
                          title="Mark all read"
                        >
                          <CheckCheck size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void clearAll()}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-all"
                          title="Clear all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell size={20} className="text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-600">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        layout
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className={`group flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 cursor-pointer hover:bg-white/[0.03] transition-colors ${!notif.read ? 'bg-blue-500/[0.03]' : ''}`}
                        onClick={() => handleNotifClick(notif)}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            notif.type === 'inspection_failed'
                              ? 'bg-red-500/10'
                              : notif.type === 'issue_reported'
                                ? 'bg-amber-500/10'
                                : 'bg-blue-500/10'
                          }`}
                        >
                          {notif.type === 'inspection_failed' ? (
                            <ClipboardCheck size={14} className="text-red-400" />
                          ) : notif.type === 'issue_reported' ? (
                            <AlertTriangle size={14} className="text-amber-400" />
                          ) : (
                            <Megaphone size={14} className="text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-xs font-medium leading-snug truncate ${!notif.read ? 'text-white' : 'text-slate-300'}`}
                            >
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{notif.body}</p>
                          <p className="text-[10px] text-slate-600 mt-1">
                            {timeAgo(notif.created_at)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            void deleteNotification(notif.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.06] transition-all min-h-[44px]"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xs font-bold text-white">
              {(user?.initial ?? 'U').charAt(0).toUpperCase()}
            </div>
            <ChevronDown size={13} className={`text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 bg-[#0F1629] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-3 py-2.5 border-b border-white/[0.06]">
                  <div className="text-xs font-medium text-white">My Account</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{user?.plan ?? 'Professional Plan'}</div>
                </div>
                <div className="p-1">
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                  >
                    <UserIcon size={14} className="text-slate-500" />
                    Profile &amp; Settings
                  </Link>
                  <Link
                    href="/dashboard/control-panel"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                  >
                    <Settings size={14} className="text-slate-500" />
                    Control Panel
                  </Link>
                  <Link
                    href="/dashboard/about"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                  >
                    <Info size={14} className="text-slate-500" />
                    About
                  </Link>
                  {(userRole === 'owner' || userRole === 'manager') && (
                    <Link
                      href="/dashboard/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                    >
                      <Shield size={14} className="text-slate-500" />
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] rounded-lg transition-colors"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  )
}
