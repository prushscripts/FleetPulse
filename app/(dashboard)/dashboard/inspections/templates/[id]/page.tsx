'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Item = {
  id: string
  label: string
  category: string
  required: boolean
  allowPhoto: boolean
  allowNote?: boolean
}

const INITIAL: Item[] = [
  { id: '1', label: 'Lights and signals', category: 'Exterior', required: true, allowPhoto: true },
  { id: '2', label: 'Tires and wheels', category: 'Exterior', required: true, allowPhoto: true },
  { id: '3', label: 'Brakes feel', category: 'Interior', required: true, allowPhoto: false },
]

type TemplateRow = {
  id: string
  company_id: string
  name: string
  type: string
  is_default: boolean
  items: unknown
}

export default function InspectionTemplateBuilderPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const templateType = (params?.id === 'post_trip' ? 'post_trip' : 'pre_trip') as 'pre_trip' | 'post_trip' | 'custom'
  const supabase = createClient()

  const [templateId, setTemplateId] = useState<string | null>(null)
  const [name, setName] = useState(templateType === 'post_trip' ? 'Standard Post-Trip' : 'Standard Pre-Trip')
  const [type, setType] = useState<'pre_trip' | 'post_trip' | 'custom'>(templateType)
  const [items, setItems] = useState<Item[]>(INITIAL)
  const [isDefault, setIsDefault] = useState(templateType === 'pre_trip')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const companyId = user?.user_metadata?.company_id as string | undefined
      if (!companyId) {
        setLoading(false)
        return
      }
      const { data, error: fetchError } = await supabase
        .from('inspection_templates')
        .select('id, company_id, name, type, is_default, items')
        .eq('company_id', companyId)
        .eq('type', templateType)
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (fetchError) {
        setError(fetchError.message)
        setLoading(false)
        return
      }
      const row = data as TemplateRow | null
      if (row) {
        setTemplateId(row.id)
        setName(row.name || name)
        setType((row.type as 'pre_trip' | 'post_trip' | 'custom') || type)
        setIsDefault(!!row.is_default)
        const raw = row.items
        if (Array.isArray(raw) && raw.length > 0) {
          setItems(raw.map((i: Record<string, unknown>) => ({
            id: String(i.id ?? ''),
            label: String(i.label ?? ''),
            category: String(i.category ?? ''),
            required: Boolean(i.required),
            allowPhoto: Boolean(i.allowPhoto),
            allowNote: Boolean(i.allowNote),
          })))
        }
      }
      setLoading(false)
    }
    load()
  }, [supabase, templateType])

  const grouped = Object.entries(
    items.reduce<Record<string, Item[]>>((acc, i) => {
      if (!acc[i.category]) acc[i.category] = []
      acc[i.category].push(i)
      return acc
    }, {})
  )

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const companyId = user?.user_metadata?.company_id as string | undefined
      if (!companyId) {
        setError('No company selected. Activate a company in Settings.')
        setSaving(false)
        return
      }
      const payload = {
        company_id: companyId,
        name: name.trim() || (type === 'post_trip' ? 'Standard Post-Trip' : 'Standard Pre-Trip'),
        type,
        is_default: isDefault,
        items: items.map((i) => ({
          id: i.id,
          label: i.label,
          category: i.category,
          required: i.required,
          allowPhoto: i.allowPhoto,
          allowNote: i.allowNote ?? true,
        })),
        updated_at: new Date().toISOString(),
      }
      if (templateId) {
        const { error: updateErr } = await supabase
          .from('inspection_templates')
          .update({ name: payload.name, type: payload.type, is_default: payload.is_default, items: payload.items, updated_at: payload.updated_at })
          .eq('id', templateId)
        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase
          .from('inspection_templates')
          .insert({
            company_id: payload.company_id,
            name: payload.name,
            type: payload.type,
            is_default: payload.is_default,
            items: payload.items,
          })
        if (insertErr) throw insertErr
      }
      router.push('/dashboard/inspections')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto page-fade-in">
        <div className="card-glass rounded-2xl p-8 text-center text-slate-400">Loading template…</div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-4xl mx-auto page-fade-in">
      <div className="mb-5">
        <h1 className="text-2xl font-display font-bold text-white">Template Builder</h1>
        <p className="text-sm text-slate-500 mt-1">Configure checklist structure and required fields.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <div className="card-glass rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Template name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 block">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as 'pre_trip' | 'post_trip' | 'custom')} className="input-field">
            <option value="pre_trip">Pre-Trip</option>
            <option value="post_trip">Post-Trip</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="rounded border-white/20 text-blue-500" />
          <span className="text-sm text-slate-300">Default template for this type</span>
        </label>
      </div>

      <div className="space-y-3 mt-4">
        {grouped.map(([category, groupItems]) => (
          <section key={category} className="card-glass rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.06] text-sm font-semibold text-white">{category}</div>
            <div className="divide-y divide-white/[0.04]">
              {groupItems.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-white">{item.label}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.map((p) => p.id === item.id ? { ...p, required: !p.required } : p))}
                      className={`px-2 py-1 text-xs rounded ${item.required ? 'bg-blue-500/20 text-blue-300' : 'bg-white/[0.06] text-slate-400'}`}
                    >
                      Required
                    </button>
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.map((p) => p.id === item.id ? { ...p, allowPhoto: !p.allowPhoto } : p))}
                      className={`px-2 py-1 text-xs rounded ${item.allowPhoto ? 'bg-blue-500/20 text-blue-300' : 'bg-white/[0.06] text-slate-400'}`}
                    >
                      Photo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary px-4 py-2 text-sm disabled:opacity-60">
          {saving ? 'Saving…' : 'Save template'}
        </button>
        <Link href="/dashboard/inspections" className="btn-ghost px-4 py-2 text-sm">Back</Link>
      </div>
    </div>
  )
}
