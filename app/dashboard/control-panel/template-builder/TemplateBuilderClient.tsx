'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  type CustomTemplate,
  type CustomSection,
  type SectionType,
  SECTION_DEFINITIONS,
  NAV_TAB_OPTIONS,
  createDefaultCustomTemplate,
  nextSectionId,
} from '@/lib/custom-template'

export default function TemplateBuilderClient({
  companyId,
  initialTemplate,
}: {
  companyId: string | null
  initialTemplate: CustomTemplate | null
}) {
  const [template, setTemplate] = useState<CustomTemplate>(
    () => initialTemplate || createDefaultCustomTemplate()
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const supabase = createClient()

  const sections = [...template.sections].sort((a, b) => a.order - b.order)

  const addSection = (type: SectionType) => {
    const id = nextSectionId(template.sections)
    const maxOrder = template.sections.length ? Math.max(...template.sections.map((s) => s.order)) : -1
    setTemplate({
      ...template,
      sections: [
        ...template.sections,
        { id, type, order: maxOrder + 1, config: type === 'custom_text' ? { title: '', body: '' } : undefined },
      ],
    })
  }

  const removeSection = (id: string) => {
    setTemplate({
      ...template,
      sections: template.sections.filter((s) => s.id !== id),
    })
  }

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const next = sections.map((s, i) => ({ ...s, order: i }))
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    next.forEach((s, i) => (s.order = i))
    setTemplate({ ...template, sections: next })
  }

  const updateSectionConfig = (id: string, config: Partial<CustomSection['config']>) => {
    setTemplate({
      ...template,
      sections: template.sections.map((s) =>
        s.id === id ? { ...s, config: { ...s.config, ...config } } : s
      ),
    })
  }

  const updateTabOrder = (keys: string[]) => {
    setTemplate({ ...template, tabs: keys })
  }

  const toggleTab = (key: string) => {
    const current = template.tabs ?? NAV_TAB_OPTIONS.map((t) => t.key)
    if (current.includes(key)) {
      updateTabOrder(current.filter((k) => k !== key))
    } else {
      const insertIndex = NAV_TAB_OPTIONS.findIndex((o) => o.key === key)
      const before = NAV_TAB_OPTIONS.slice(0, insertIndex).map((o) => o.key).filter((k) => current.includes(k))
      const after = NAV_TAB_OPTIONS.slice(insertIndex + 1).map((o) => o.key).filter((k) => current.includes(k))
      updateTabOrder([...before, key, ...after])
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyId) {
      setMessage({ type: 'error', text: 'No company selected.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const existing = (user?.user_metadata?.company_settings as Record<string, object>) || {}
      const current = (existing[companyId] as Record<string, unknown>) || {}
      const updated = {
        ...existing,
        [companyId]: {
          ...current,
          template: 'custom',
          customTemplate: template,
        },
      }
      const { error } = await supabase.auth.updateUser({
        data: { company_settings: updated },
      })
      if (error) throw error
      setMessage({ type: 'success', text: 'Custom template saved. View it on the Home page.' })
      setTimeout(() => setMessage(null), 4000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const handleDragStart = (index: number) => setDraggedIndex(index)
  const handleDragEnd = () => setDraggedIndex(null)
  const handleDragOver = (e: React.DragEvent) => e.preventDefault()
  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null) return
    const next = sections.map((s, i) => ({ ...s, order: i }))
    const [removed] = next.splice(draggedIndex, 1)
    next.splice(targetIndex, 0, removed)
    next.forEach((s, i) => (s.order = i))
    setTemplate({ ...template, sections: next })
    setDraggedIndex(null)
  }

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Select a company in Settings first.</p>
          <Link href="/dashboard/settings" className="text-indigo-600 dark:text-indigo-400 font-medium">
            Go to Settings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Template Builder</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Choose sections, layout, and nav tabs for your dashboard.
            </p>
          </div>
          <Link
            href="/dashboard/control-panel"
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            ← Control Panel
          </Link>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Header overrides */}
          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
              Dashboard header (optional)
            </h2>
            <div className="space-y-3">
              <input
                type="text"
                value={template.headerTitle ?? ''}
                onChange={(e) => setTemplate({ ...template, headerTitle: e.target.value || undefined })}
                placeholder="e.g. Fleet Health Dashboard"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
              <input
                type="text"
                value={template.headerSubtitle ?? ''}
                onChange={(e) => setTemplate({ ...template, headerSubtitle: e.target.value || undefined })}
                placeholder="e.g. Overview of operational health"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </section>

          {/* Sections */}
          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Dashboard sections
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Drag to reorder. Add or remove blocks to build your home dashboard.
            </p>

            <div className="space-y-2 mb-6">
              {sections.map((sec, index) => (
                <div
                  key={sec.id}
                  className={`rounded-xl border bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-600 overflow-hidden ${
                    draggedIndex === index ? 'opacity-60' : ''
                  }`}
                >
                  <div
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    className="flex items-center gap-3 p-3"
                  >
                    <span className="cursor-grab text-gray-400 dark:text-gray-500" aria-label="Drag to reorder">
                      ⋮⋮
                    </span>
                    <span className="flex-1 font-medium text-gray-900 dark:text-white">
                      {SECTION_DEFINITIONS[sec.type].icon} {SECTION_DEFINITIONS[sec.type].label}
                    </span>
                    <div className="flex items-center gap-2">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'up')}
                        className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        ↑
                      </button>
                    )}
                    {index < sections.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'down')}
                        className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeSection(sec.id)}
                      className="p-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </button>
                  </div>
                  </div>
                  {sec.type === 'custom_text' && (
                    <div className="px-3 pb-3 pt-0 space-y-2 border-t border-gray-200 dark:border-gray-600 mt-0 pt-3">
                      <input
                        type="text"
                        value={sec.config?.title ?? ''}
                        onChange={(e) => updateSectionConfig(sec.id, { title: e.target.value })}
                        placeholder="Section title"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                      />
                      <textarea
                        value={sec.config?.body ?? ''}
                        onChange={(e) => updateSectionConfig(sec.id, { body: e.target.value })}
                        placeholder="Body text (optional)"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm resize-y"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(SECTION_DEFINITIONS) as SectionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addSection(type)}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  + {SECTION_DEFINITIONS[type].label}
                </button>
              ))}
            </div>
          </section>

          {/* Layout */}
          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
              Layout
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Metric grid columns
                </label>
                <select
                  value={template.columns}
                  onChange={(e) => setTemplate({ ...template, columns: Number(e.target.value) as 2 | 3 | 4 })}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                >
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Spacing
                </label>
                <select
                  value={template.spacing}
                  onChange={(e) =>
                    setTemplate({ ...template, spacing: e.target.value as 'compact' | 'default' | 'spacious' })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                >
                  <option value="compact">Compact</option>
                  <option value="default">Default</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>
            </div>
          </section>

          {/* Nav tabs */}
          <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Navigation tabs
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Choose which tabs appear in the navbar and their order.
            </p>
            <div className="flex flex-wrap gap-3">
              {NAV_TAB_OPTIONS.map((opt) => {
                const enabled = (template.tabs ?? NAV_TAB_OPTIONS.map((o) => o.key)).includes(opt.key)
                return (
                  <label
                    key={opt.key}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleTab(opt.key)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">{opt.label}</span>
                  </label>
                )
              })}
            </div>
          </section>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium shadow-sm"
            >
              {saving ? 'Saving…' : 'Save custom template'}
            </button>
            <Link
              href="/home"
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Preview Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
