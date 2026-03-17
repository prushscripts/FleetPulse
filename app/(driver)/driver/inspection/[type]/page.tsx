'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  Loader2,
  PenLine,
} from 'lucide-react'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

type InspectionType = 'pre_trip' | 'post_trip'

type Choice = 'pass' | 'pass_with_issues' | 'fail'

type TemplateItem = {
  id: string
  name: string
  category: 'Safety' | 'Exterior' | 'Interior' | 'Under Hood'
}

type ChecklistResponse = {
  itemId: string
  name: string
  category: TemplateItem['category']
  choice: Choice | null
  note: string
  damagePhoto?: {
    file?: File
    previewUrl?: string
    publicUrl?: string
    error?: string | null
  }
}

const DEFAULT_TEMPLATE: TemplateItem[] = [
  // Safety
  { id: 'horn', category: 'Safety', name: 'Horn working?' },
  { id: 'brakes', category: 'Safety', name: 'Brakes feel normal?' },
  { id: 'parking_brake', category: 'Safety', name: 'Emergency brake working?' },
  { id: 'seatbelt', category: 'Safety', name: 'Seatbelt working?' },
  { id: 'warning_lights', category: 'Safety', name: 'Dashboard warning lights?' },
  // Exterior
  { id: 'tires_condition', category: 'Exterior', name: 'Tires condition?' },
  { id: 'tire_pressure', category: 'Exterior', name: 'Tire pressure looks normal?' },
  { id: 'wipers', category: 'Exterior', name: 'Windshield wipers working?' },
  { id: 'all_lights', category: 'Exterior', name: 'All lights working? (headlights, brake, signals)' },
  { id: 'body_damage', category: 'Exterior', name: 'Body damage?' },
  // Interior
  { id: 'cabin_clean', category: 'Interior', name: 'Cabin cleanliness acceptable?' },
  { id: 'smells', category: 'Interior', name: 'Any unusual smells? (fuel, smoke, burning)' },
  { id: 'steering', category: 'Interior', name: 'Steering feels normal?' },
  // Under Hood
  { id: 'fluid_leaks', category: 'Under Hood', name: 'Any visible fluid leaks?' },
]

type DriverVehicle = {
  id: string
  code: string | null
  year: number | null
  make: string | null
  model: string | null
  current_mileage: number | null
  company_id: string | null
}

type StoredPhoto = {
  file?: File
  previewUrl?: string
  publicUrl?: string
  error?: string | null
}

type AngleKey = 'driver_side' | 'passenger_side' | 'front' | 'rear'

const ANGLE_LABELS: Record<AngleKey, string> = {
  driver_side: 'Driver Side',
  passenger_side: 'Passenger Side',
  front: 'Front',
  rear: 'Rear',
}

const slideVariants = {
  enter: (direction: 1 | -1) => ({ x: direction > 0 ? 24 : -24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: 1 | -1) => ({ x: direction > 0 ? -24 : 24, opacity: 0 }),
}

async function fileMeetsMinSize(file: File, minW: number, minH: number): Promise<boolean> {
  if (!file.type.startsWith('image/')) return false
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Image decode failed'))
      img.src = url
    })
    return img.width >= minW && img.height >= minH
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function DriverInspectionFlowPage() {
  const params = useParams<{ type: string }>()
  const typeParam = params?.type ?? 'pre_trip'
  const router = useRouter()
  const supabase = createClient()

  const inspectionType: InspectionType = typeParam === 'post_trip' ? 'post_trip' : 'pre_trip'
  const [step, setStep] = useState<Step>(1)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [driverId, setDriverId] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [driverDisplayName, setDriverDisplayName] = useState<string>('Driver')

  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null)
  const [lastMileage, setLastMileage] = useState<number>(0)
  const [timestamp] = useState<Date>(() => new Date())

  const [templateItems, setTemplateItems] = useState<TemplateItem[]>(DEFAULT_TEMPLATE)
  const [responses, setResponses] = useState<ChecklistResponse[]>(() =>
    DEFAULT_TEMPLATE.map((i) => ({
      itemId: i.id,
      name: i.name,
      category: i.category,
      choice: null,
      note: '',
    })),
  )
  const [checklistCursor, setChecklistCursor] = useState(0)

  // Step 2
  const [mileage, setMileage] = useState('')
  const [mileageError, setMileageError] = useState<string | null>(null)
  const [odometerPhoto, setOdometerPhoto] = useState<StoredPhoto>({})

  // Step 4
  const [anglePhotos, setAnglePhotos] = useState<Record<AngleKey, StoredPhoto>>({
    driver_side: {},
    passenger_side: {},
    front: {},
    rear: {},
  })

  // Step 5
  const [cabinPhoto, setCabinPhoto] = useState<StoredPhoto>({})
  const [cleanliness, setCleanliness] = useState<'clean' | 'acceptable' | 'needs_cleaning' | null>(null)
  const [cleanlinessNote, setCleanlinessNote] = useState('')

  // Step 6
  const [driverNotes, setDriverNotes] = useState('')
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const [savedSignature, setSavedSignature] = useState<string | null>(null)
  const [saveSignature, setSaveSignature] = useState(false)

  // Step 7
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [inspectionId, setInspectionId] = useState<string | null>(null)

  // Step 8
  const [autoRedirectAt, setAutoRedirectAt] = useState<number | null>(null)

  const stepsTotal = 7 // success screen is 8
  const stepIndexForProgress = step <= 7 ? step : 7
  const overallProgress = Math.round(((stepIndexForProgress - 1) / (stepsTotal - 1)) * 100)

  const activeChecklistIndex = useMemo(() => {
    const max = Math.max(0, responses.length - 1)
    return Math.min(Math.max(0, checklistCursor), max)
  }, [checklistCursor, responses.length])
  const activeItem = responses[activeChecklistIndex]
  const itemPosition = `${activeChecklistIndex + 1} of ${responses.length}`
  const passCount = responses.filter((r) => r.choice === 'pass').length
  const issueCount = responses.filter((r) => r.choice === 'pass_with_issues').length
  const failCount = responses.filter((r) => r.choice === 'fail').length
  const photoCount = useMemo(() => {
    const angles = Object.values(anglePhotos).filter((p) => !!p.publicUrl || !!p.file).length
    const odo = odometerPhoto.file ? 1 : 0
    const cabin = cabinPhoto.file ? 1 : 0
    const damage = responses.filter((r) => r.damagePhoto?.file).length
    return angles + odo + cabin + damage
  }, [anglePhotos, odometerPhoto.file, cabinPhoto.file, responses])

  const issuesToCreate = useMemo(() => {
    const list: Array<{ title: string; description: string; priority: 'low' | 'medium' | 'high' }> = []
    responses.forEach((r) => {
      if (r.choice === 'fail' || r.choice === 'pass_with_issues') {
        list.push({
          title: `${r.name} — reported during inspection`,
          description: r.note.trim(),
          priority: r.choice === 'fail' ? 'high' : 'medium',
        })
      }
    })
    if (cleanliness === 'needs_cleaning') {
      list.push({
        title: 'Cabin cleanliness — needs attention',
        description: cleanlinessNote.trim() || 'Cabin needs cleaning.',
        priority: 'low',
      })
    }
    return list
  }, [responses, cleanliness, cleanlinessNote])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const cid = (user?.user_metadata?.company_id as string) || null
        setCompanyId(cid)
        const nickname = (user?.user_metadata?.nickname as string | undefined) || ''
        const display = nickname.trim() || (user?.email ? user.email.split('@')[0] : 'Driver')
        setDriverDisplayName(display)

        // Driver record
        const { data: driverRow } = await supabase
          .from('drivers')
          .select('id')
          .or(`user_id.eq.${user?.id ?? ''},email.eq.${user?.email ?? ''}`)
          .limit(1)
          .maybeSingle()
        const did = (driverRow as { id?: string } | null)?.id ?? null
        setDriverId(did)

        // Vehicle assignment (prefer driver_id, then assigned_driver_id)
        let vehicleRow: DriverVehicle | null = null
        if (did) {
          const { data: v } = await supabase
            .from('vehicles')
            .select('id, code, year, make, model, current_mileage, company_id')
            .or(`driver_id.eq.${did},assigned_driver_id.eq.${did}`)
            .limit(1)
            .maybeSingle()
          vehicleRow = (v as DriverVehicle | null) ?? null
        }
        setVehicle(vehicleRow)
        setLastMileage(vehicleRow?.current_mileage ?? 0)

        // Template load (company custom pre_trip only per spec; driver flow uses pre_trip template)
        const templateType: InspectionType = 'pre_trip'
        if (cid) {
          const { data: row } = await supabase
            .from('inspection_templates')
            .select('id, items')
            .eq('company_id', cid)
            .eq('type', templateType)
            .order('is_default', { ascending: false })
            .limit(1)
            .maybeSingle()

          const raw = (row as { items?: unknown } | null)?.items
          if (Array.isArray(raw) && raw.length > 0) {
            const mapped: TemplateItem[] = raw
              .map((i: any) => ({
                id: String(i.id ?? ''),
                name: String(i.name ?? i.label ?? ''),
                category: (String(i.category ?? '') as TemplateItem['category']) || 'Safety',
              }))
              .filter((i) => i.id && i.name)
            if (mapped.length > 0) {
              setTemplateItems(mapped)
              setTemplateItems(mapped)
              setResponses(
                mapped.map((i) => ({
                  itemId: i.id,
                  name: i.name,
                  category: i.category,
                  choice: null,
                  note: '',
                })),
              )
              setChecklistCursor(0)
            }
          } else {
            // Best-effort: store default template as default pre_trip template (may fail due to RLS; safe to ignore).
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            supabase.from('inspection_templates').insert({
              company_id: cid,
              type: 'pre_trip',
              is_default: true,
              items: DEFAULT_TEMPLATE.map((i) => ({ id: i.id, name: i.name, category: i.category })),
            })
          }
        }

        // Saved signature from profiles
        if (user?.id) {
          const { data: profile } = await supabase.from('profiles').select('signature').eq('id', user.id).maybeSingle()
          const sig = (profile as any)?.signature
          if (typeof sig === 'string' && sig.startsWith('data:image')) setSavedSignature(sig)
        }
      } catch (e) {
        setLoadError('Unable to load inspection flow. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [supabase])

  useEffect(() => {
    if (!mileage.trim()) {
      setMileageError(null)
      return
    }
    const n = Number(mileage)
    if (!Number.isFinite(n) || n <= 0) {
      setMileageError('Enter a valid mileage.')
      return
    }
    if (n < lastMileage) {
      setMileageError(`Mileage cannot be lower than last recorded (${lastMileage.toLocaleString()} mi)`)
      return
    }
    setMileageError(null)
  }, [mileage, lastMileage])

  const goStep = (next: Step) => {
    setDirection(next > step ? 1 : -1)
    setStep(next)
  }

  const canBegin = !!vehicle?.id

  const step2Ready = useMemo(() => {
    const n = Number(mileage)
    const mileageOk = mileage.trim() && !mileageError && Number.isFinite(n) && n >= lastMileage
    const photoOk = !!odometerPhoto.file && !odometerPhoto.error
    return !!mileageOk && !!photoOk
  }, [mileage, mileageError, lastMileage, odometerPhoto.file, odometerPhoto.error])

  const setChoice = (choice: Choice) => {
    setResponses((prev) =>
      prev.map((r, idx) => {
        if (idx !== activeChecklistIndex) return r
        return { ...r, choice }
      }),
    )
    if (choice === 'pass') {
      // Auto-advance on pass
      setTimeout(() => {
        const nextIdx = activeChecklistIndex + 1
        if (nextIdx >= responses.length) {
          goStep(4)
          return
        }
        setChecklistCursor(nextIdx)
      }, 150)
    }
  }

  const canAdvanceChecklist = useMemo(() => {
    const r = activeItem
    if (!r) return false
    if (!r.choice) return false
    if (r.choice === 'pass') return true
    if (!r.note.trim()) return false
    if (r.itemId === 'body_damage' && r.choice === 'fail') {
      return !!r.damagePhoto?.file && !r.damagePhoto?.error
    }
    return true
  }, [activeItem])

  const nextChecklist = () => {
    if (!canAdvanceChecklist) return
    const nextIdx = activeChecklistIndex + 1
    if (nextIdx >= responses.length) {
      goStep(4)
      return
    }
    setChecklistCursor(nextIdx)
  }

  const prevChecklist = () => {
    setChecklistCursor((prev) => Math.max(0, prev - 1))
  }

  const requiredAnglesReady = useMemo(() => {
    const keys: AngleKey[] = ['driver_side', 'passenger_side', 'front', 'rear']
    return keys.every((k) => !!anglePhotos[k].file && !anglePhotos[k].error)
  }, [anglePhotos])

  const cabinReady = useMemo(() => {
    if (!cabinPhoto.file || cabinPhoto.error) return false
    if (!cleanliness) return false
    if (cleanliness === 'needs_cleaning' && !cleanlinessNote.trim()) return false
    return true
  }, [cabinPhoto.file, cabinPhoto.error, cleanliness, cleanlinessNote])

  const signatureReady = useMemo(() => !!signatureDataUrl, [signatureDataUrl])

  const validateAndSetPhoto = async (
    file: File,
    setPhoto: (p: StoredPhoto) => void,
    minW = 800,
    minH = 600,
  ) => {
    const previewUrl = URL.createObjectURL(file)
    // TODO: Replace with AI frame validation
    // Goal: verify photo contains the vehicle angle requested
    // Suggested: use Anthropic Claude Vision API or Google Cloud Vision to validate photo content
    try {
      const ok = await fileMeetsMinSize(file, minW, minH)
      if (!ok) {
        setPhoto({ file, previewUrl, error: 'Please take a closer, full-frame photo' })
        return
      }
      setPhoto({ file, previewUrl, error: null })
    } catch {
      setPhoto({ file, previewUrl, error: 'Unable to read photo. Please retake.' })
    }
  }

  const uploadPhoto = async (inspectionIdForPath: string, file: File, name: string): Promise<string> => {
    if (!companyId || !vehicle?.id) throw new Error('Missing company/vehicle')
    const safeName = name.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase()
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `${companyId}/${vehicle.id}/${inspectionIdForPath}/${safeName}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('inspection-photos').upload(path, file, {
      upsert: true,
      contentType: file.type,
    })
    if (error) throw error
    const { data } = supabase.storage.from('inspection-photos').getPublicUrl(path)
    return data.publicUrl
  }

  const ensureCanvasSize = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    const w = Math.max(1, Math.floor(rect.width * dpr))
    const h = Math.max(1, Math.floor(rect.height * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#F8FAFC'
      }
    }
  }

  useEffect(() => {
    if (step !== 6) return
    ensureCanvasSize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureDataUrl(null)
  }

  const drawFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (!drawingRef.current) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      drawingRef.current = true
      return
    }
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDrawing = () => {
    drawingRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      setSignatureDataUrl(canvas.toDataURL('image/png'))
    } catch {
      // ignore
    }
  }

  const submit = async () => {
    if (!vehicle?.id || !companyId || !driverId) {
      setSubmitError('Missing vehicle assignment. Contact your fleet manager.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')
      const odometerValue = Number(mileage)

      const status: 'passed' | 'failed' | 'needs_review' =
        failCount > 0 ? 'failed' : issueCount > 0 ? 'needs_review' : 'passed'

      // Create inspection row first so we can use its ID in storage paths.
      const { data: inserted, error: insErr } = await supabase
        .from('inspections')
        .insert({
          company_id: companyId,
          vehicle_id: vehicle.id,
          driver_id: driverId,
          submitted_by_user_id: user.id,
          type: inspectionType,
          status,
          odometer: odometerValue,
          notes: driverNotes || null,
          // Keep legacy report compatibility: results as an array with { passed } boolean
          results: responses.map((r) => ({
            itemId: r.itemId,
            label: r.name,
            passed: r.choice === 'pass' || r.choice === 'pass_with_issues',
            note: r.note || '',
            choice: r.choice,
            category: r.category,
          })),
        })
        .select('id')
        .single()
      if (insErr) throw insErr
      const newInspectionId = (inserted as any)?.id as string
      setInspectionId(newInspectionId)

      // Upload photos
      const uploaded: Record<string, string> = {}
      if (odometerPhoto.file) uploaded.odometer = await uploadPhoto(newInspectionId, odometerPhoto.file, 'odometer')
      for (const k of Object.keys(anglePhotos) as AngleKey[]) {
        const f = anglePhotos[k].file
        if (f) uploaded[k] = await uploadPhoto(newInspectionId, f, `angle-${k}`)
      }
      if (cabinPhoto.file) uploaded.cabin = await uploadPhoto(newInspectionId, cabinPhoto.file, 'cabin')
      for (const r of responses) {
        if (r.damagePhoto?.file) {
          uploaded[`damage_${r.itemId}`] = await uploadPhoto(newInspectionId, r.damagePhoto.file, `damage-${r.itemId}`)
        }
      }

      // Create issues (best-effort; use only fields known to exist across codebase)
      for (const issue of issuesToCreate) {
        await supabase.from('issues').insert({
          vehicle_id: vehicle.id,
          title: issue.title,
          description: issue.description || null,
          status: 'open',
          priority: issue.priority,
          reported_date: new Date().toISOString().slice(0, 10),
        })
      }

      // Save signature if requested
      if (saveSignature && signatureDataUrl) {
        await supabase.from('profiles').update({ signature: signatureDataUrl }).eq('id', user.id)
      }

      // Store rich payload in results too (append as a final object so older pages still render list)
      await supabase
        .from('inspections')
        .update({
          results: [
            ...responses.map((r) => ({
              itemId: r.itemId,
              label: r.name,
              passed: r.choice === 'pass' || r.choice === 'pass_with_issues',
              note: r.note || '',
              choice: r.choice,
              category: r.category,
              photoUrl: r.damagePhoto?.file ? uploaded[`damage_${r.itemId}`] : undefined,
            })),
            {
              __fleetpulse_v2: true,
              timestamp: timestamp.toISOString(),
              mileage: odometerValue,
              photos: uploaded,
              cabin: { cleanliness, note: cleanlinessNote || null },
              signature: signatureDataUrl,
              notes: driverNotes || null,
              template: templateItems,
            },
          ],
        })
        .eq('id', newInspectionId)

      goStep(8)
      setAutoRedirectAt(Date.now() + 8000)
    } catch (e: any) {
      setSubmitError(e?.message || 'Failed to submit inspection. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (step !== 8 || !autoRedirectAt) return
    const t = setTimeout(() => {
      window.location.href = '/driver'
    }, Math.max(0, autoRedirectAt - Date.now()))
    return () => clearTimeout(t)
  }, [step, autoRedirectAt])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1E] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <div className="mt-3 text-sm text-slate-400">Loading inspection…</div>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="fixed inset-0 bg-[#0A0F1E] text-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-lg font-semibold">Unable to start inspection</div>
          <div className="mt-2 text-sm text-slate-400">{loadError}</div>
          <button type="button" className="btn-primary w-full mt-6 py-3" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  const showBack = step >= 2 && step <= 7

  return (
    <div className="fixed inset-0 bg-[#0A0F1E] text-white overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/[0.06]">
        <div className="h-full bg-blue-500" style={{ width: `${overallProgress}%` }} />
      </div>

      {/* Top bar */}
      <div className="h-14 flex items-center px-4 pt-2">
        {showBack ? (
          <button
            type="button"
            onClick={() => {
              if (step === 2) return goStep(1)
              if (step === 3) {
                // if on first item, go back to mileage step
                if (activeChecklistIndex === 0) return goStep(2)
                prevChecklist()
                return
              }
              if (step === 4) return goStep(3)
              if (step === 5) return goStep(4)
              if (step === 6) return goStep(5)
              if (step === 7) return goStep(6)
            }}
            className="min-w-[56px] min-h-[44px] -ml-2 px-2 inline-flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <div className="min-w-[56px]" />
        )}
        <div className="flex-1 text-center text-xs text-slate-500 uppercase tracking-widest">
          {inspectionType === 'pre_trip' ? 'Pre-Trip Inspection' : 'Post-Trip Inspection'}
        </div>
        <div className="min-w-[56px]" />
      </div>

      <div className="absolute inset-x-0 top-14 bottom-0 px-4 pb-6 overflow-hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="h-full"
          >
            {/* STEP 1: Vehicle confirmation */}
            {step === 1 && (
              <div className="h-full flex flex-col justify-between">
                <div className="pt-6">
                  <div className="text-slate-500 text-sm mb-2">
                    Starting {inspectionType === 'pre_trip' ? 'Pre-Trip' : 'Post-Trip'} Inspection
                  </div>
                  <div className="font-mono text-5xl font-bold text-white tracking-tight">
                    {vehicle?.code || '—'}
                  </div>
                  <div className="mt-2 text-slate-400 text-base">
                    {vehicle?.year ?? ''} {vehicle?.make ?? ''} {vehicle?.model ?? ''}
                  </div>
                  <div className="mt-6 card-glass rounded-2xl p-4">
                    <div className="text-xs text-slate-600 uppercase tracking-wider">Date &amp; time</div>
                    <div className="mt-1 text-sm text-white font-mono">
                      {timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="pb-2">
                  {!canBegin && (
                    <div className="mb-3 text-sm text-amber-400">
                      No vehicle assigned to your driver account.
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={!canBegin}
                    onClick={() => goStep(2)}
                    className="w-full min-h-[56px] py-5 rounded-2xl bg-blue-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Begin Inspection <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Mileage + photo */}
            {step === 2 && (
              <div className="h-full flex flex-col">
                <div className="flex-1 pt-2 flex flex-col gap-5">
                  <div className="card-glass rounded-2xl p-4">
                    <div className="text-xs text-slate-500 uppercase tracking-wider">
                      Current Odometer Reading
                    </div>
                    <input
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value.replace(/[^\d]/g, ''))}
                      inputMode="numeric"
                      placeholder={lastMileage > 0 ? `${lastMileage.toLocaleString()} (last)` : 'Enter mileage'}
                      className="mt-3 w-full bg-transparent border border-white/[0.10] rounded-2xl px-4 py-4 text-2xl font-mono text-white focus:outline-none focus:border-blue-500/60"
                    />
                    {mileageError && (
                      <div className="mt-2 text-xs text-red-400">
                        {mileageError}
                      </div>
                    )}
                  </div>

                  <div className="card-glass rounded-2xl p-4 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">
                          Photo of Odometer
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                          Required for accuracy verification
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      {odometerPhoto.previewUrl ? (
                        <div>
                          <img
                            src={odometerPhoto.previewUrl}
                            alt="Odometer"
                            className="w-full rounded-2xl border border-white/[0.08] object-cover max-h-[260px]"
                          />
                          {odometerPhoto.error && (
                            <div className="mt-2 text-xs text-red-400">{odometerPhoto.error}</div>
                          )}
                          <label className="mt-3 inline-flex items-center justify-center w-full min-h-[56px] rounded-2xl border border-white/[0.10] bg-white/[0.02] text-slate-300">
                            Retake
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={async (e) => {
                                const f = e.target.files?.[0]
                                if (!f) return
                                await validateAndSetPhoto(f, setOdometerPhoto, 800, 600)
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="w-full min-h-[140px] rounded-2xl border border-dashed border-white/[0.14] bg-white/[0.02] flex flex-col items-center justify-center gap-2 text-slate-400">
                          <Camera size={22} className="text-slate-500" />
                          <div className="text-sm font-medium">Take photo</div>
                          <div className="text-xs text-slate-600">Tap to open camera</div>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0]
                              if (!f) return
                              await validateAndSetPhoto(f, setOdometerPhoto, 800, 600)
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!step2Ready}
                  onClick={() => goStep(3)}
                  className="w-full min-h-[56px] mt-4 rounded-2xl bg-blue-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 3: Checklist (one item at a time) */}
            {step === 3 && (
              <div className="h-full flex flex-col">
                <div className="pt-2">
                  <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">
                    {activeItem?.category || ''}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Item {itemPosition}</span>
                    <span className="font-mono text-slate-600">{passCount} ✓ · {issueCount} ⚠ · {failCount} ✗</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${Math.round(((activeChecklistIndex + 1) / responses.length) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="text-2xl font-display font-bold text-white text-center px-3 leading-snug">
                    {activeItem?.name || 'Checklist Item'}
                  </div>

                  <div className="mt-8 space-y-3">
                    {([
                      { key: 'pass', label: '✓  Pass', cls: 'border-emerald-500/40', sel: 'bg-emerald-500/20 text-emerald-400', txt: 'text-emerald-200' },
                      { key: 'pass_with_issues', label: '⚠  Pass with Issues', cls: 'border-amber-500/40', sel: 'bg-amber-500/20 text-amber-400', txt: 'text-amber-200' },
                      { key: 'fail', label: '✗  Fail', cls: 'border-red-500/40', sel: 'bg-red-500/20 text-red-400', txt: 'text-red-200' },
                    ] as const).map((opt) => {
                      const selected = activeItem?.choice === opt.key
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setChoice(opt.key)}
                          className={`w-full min-h-[64px] rounded-2xl border ${
                            selected ? opt.cls : 'border-white/[0.10]'
                          } ${selected ? opt.sel : 'bg-white/[0.02] text-slate-300'} px-4 flex items-center justify-center text-base font-semibold transition-colors`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>

                  <AnimatePresence initial={false}>
                    {(activeItem?.choice === 'pass_with_issues' || activeItem?.choice === 'fail') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 card-glass rounded-2xl p-4">
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                            Describe the issue
                          </div>
                          <textarea
                            value={activeItem?.note || ''}
                            onChange={(e) =>
                              setResponses((prev) =>
                                prev.map((r, idx) =>
                                  idx === activeChecklistIndex ? { ...r, note: e.target.value } : r,
                                ),
                              )
                            }
                            placeholder="What's wrong? Be specific..."
                            className="w-full min-h-[104px] bg-white/[0.03] border border-white/[0.10] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60"
                          />

                          {/* Body damage fail requires photo */}
                          {activeItem?.itemId === 'body_damage' && activeItem?.choice === 'fail' && (
                            <div className="mt-4">
                              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                                Damage photo (required)
                              </div>
                              {activeItem.damagePhoto?.previewUrl ? (
                                <div>
                                  <img
                                    src={activeItem.damagePhoto.previewUrl}
                                    alt="Damage"
                                    className="w-full rounded-2xl border border-white/[0.08] object-cover max-h-[200px]"
                                  />
                                  {activeItem.damagePhoto.error && (
                                    <div className="mt-2 text-xs text-red-400">{activeItem.damagePhoto.error}</div>
                                  )}
                                  <label className="mt-3 inline-flex items-center justify-center w-full min-h-[56px] rounded-2xl border border-white/[0.10] bg-white/[0.02] text-slate-300">
                                    Retake
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const f = e.target.files?.[0]
                                        if (!f) return
                                        await validateAndSetPhoto(
                                          f,
                                          (p) =>
                                            setResponses((prev) =>
                                              prev.map((r, idx) =>
                                                idx === activeChecklistIndex
                                                  ? { ...r, damagePhoto: { ...p } }
                                                  : r,
                                              ),
                                            ),
                                          800,
                                          600,
                                        )
                                      }}
                                    />
                                  </label>
                                </div>
                              ) : (
                                <label className="w-full min-h-[120px] rounded-2xl border border-dashed border-white/[0.14] bg-white/[0.02] flex flex-col items-center justify-center gap-2 text-slate-400">
                                  <Camera size={20} className="text-slate-500" />
                                  <div className="text-sm font-medium">Take photo</div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const f = e.target.files?.[0]
                                      if (!f) return
                                      await validateAndSetPhoto(
                                        f,
                                        (p) =>
                                          setResponses((prev) =>
                                            prev.map((r, idx) =>
                                              idx === activeChecklistIndex
                                                ? { ...r, damagePhoto: { ...p } }
                                                : r,
                                            ),
                                          ),
                                        800,
                                        600,
                                      )
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  disabled={!canAdvanceChecklist}
                  onClick={() => {
                    nextChecklist()
                  }}
                  className="w-full min-h-[56px] rounded-2xl bg-blue-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 4: Required photos */}
            {step === 4 && (
              <div className="h-full flex flex-col">
                <div className="pt-4">
                  <div className="text-2xl font-display font-bold">Vehicle Photos</div>
                  <div className="mt-2 text-sm text-slate-400">
                    Take a clear full-frame photo of each angle
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 flex-1">
                  {(Object.keys(ANGLE_LABELS) as AngleKey[]).map((k) => {
                    const p = anglePhotos[k]
                    const taken = !!p.previewUrl
                    return (
                      <div key={k} className="card-glass rounded-2xl overflow-hidden border border-white/[0.06]">
                        <label className="block h-full">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0]
                              if (!f) return
                              await validateAndSetPhoto(
                                f,
                                (np) => setAnglePhotos((prev) => ({ ...prev, [k]: np })),
                                800,
                                600,
                              )
                            }}
                          />
                          <div className="h-full min-h-[160px] flex flex-col">
                            <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02]">
                              <div className="text-xs text-slate-400 font-medium">{ANGLE_LABELS[k]}</div>
                              {!taken && <div className="w-2 h-2 rounded-full bg-red-500" />}
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                              {taken ? (
                                <img src={p.previewUrl} alt={ANGLE_LABELS[k]} className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-center text-slate-500">
                                  <Camera size={22} className="mx-auto mb-2" />
                                  <div className="text-xs">Tap to capture</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </label>
                        {p.error && <div className="px-3 py-2 text-xs text-red-400">{p.error}</div>}
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  disabled={!requiredAnglesReady}
                  onClick={() => goStep(5)}
                  className="w-full min-h-[56px] mt-4 rounded-2xl bg-blue-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 5: Cabin photo + rating */}
            {step === 5 && (
              <div className="h-full flex flex-col">
                <div className="pt-4">
                  <div className="text-2xl font-display font-bold">Cabin Cleanliness</div>
                  <div className="mt-2 text-sm text-slate-400">
                    Take a photo showing the full cabin interior
                  </div>
                </div>

                <div className="mt-6 flex-1">
                  {cabinPhoto.previewUrl ? (
                    <div>
                      <img
                        src={cabinPhoto.previewUrl}
                        alt="Cabin"
                        className="w-full rounded-2xl border border-white/[0.08] object-cover max-h-[280px]"
                      />
                      {cabinPhoto.error && <div className="mt-2 text-xs text-red-400">{cabinPhoto.error}</div>}
                      <label className="mt-3 inline-flex items-center justify-center w-full min-h-[56px] rounded-2xl border border-white/[0.10] bg-white/[0.02] text-slate-300">
                        Retake
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0]
                            if (!f) return
                            await validateAndSetPhoto(f, setCabinPhoto, 800, 600)
                          }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="w-full min-h-[180px] rounded-2xl border border-dashed border-white/[0.14] bg-white/[0.02] flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Camera size={22} className="text-slate-500" />
                      <div className="text-sm font-medium">Take cabin photo</div>
                      <div className="text-xs text-slate-600 text-center px-6">
                        Show the full cabin — seats, floor, dashboard area
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          await validateAndSetPhoto(f, setCabinPhoto, 800, 600)
                        }}
                      />
                    </label>
                  )}

                  {cabinPhoto.file && !cabinPhoto.error && (
                    <div className="mt-6 card-glass rounded-2xl p-4">
                      <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
                        Cleanliness rating
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: 'clean', label: 'Clean' },
                          { key: 'acceptable', label: 'Acceptable' },
                          { key: 'needs_cleaning', label: 'Needs Cleaning' },
                        ].map((opt) => {
                          const selected = cleanliness === (opt.key as any)
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setCleanliness(opt.key as any)}
                              className={`min-h-[56px] rounded-2xl border ${
                                selected ? 'border-blue-500/40 bg-blue-500/10 text-white' : 'border-white/[0.10] bg-white/[0.02] text-slate-300'
                              } text-sm font-semibold`}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>

                      <AnimatePresence initial={false}>
                        {cleanliness === 'needs_cleaning' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4">
                              <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                                Describe what needs attention
                              </div>
                              <textarea
                                value={cleanlinessNote}
                                onChange={(e) => setCleanlinessNote(e.target.value)}
                                placeholder="Describe what needs attention..."
                                className="w-full min-h-[96px] bg-white/[0.03] border border-white/[0.10] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!cabinReady}
                  onClick={() => goStep(6)}
                  className="w-full min-h-[56px] mt-4 rounded-2xl bg-blue-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 6: Notes + signature */}
            {step === 6 && (
              <div className="h-full flex flex-col">
                <div className="pt-4">
                  <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">
                    Additional notes
                  </div>
                  <div className="card-glass rounded-2xl p-4">
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                      Any other issues or comments to report?
                    </div>
                    <textarea
                      value={driverNotes}
                      onChange={(e) => setDriverNotes(e.target.value)}
                      placeholder="Optional — describe anything else the fleet manager should know..."
                      className="w-full min-h-[120px] bg-white/[0.03] border border-white/[0.10] rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/60"
                    />
                  </div>
                </div>

                <div className="mt-5 flex-1">
                  <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">
                    Driver signature
                  </div>
                  <div className="card-glass rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">Driver Signature</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Sign to confirm this inspection is accurate
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Clear
                      </button>
                    </div>

                    {savedSignature && !signatureDataUrl && (
                      <button
                        type="button"
                        onClick={() => setSignatureDataUrl(savedSignature)}
                        className="mt-3 w-full min-h-[56px] rounded-2xl border border-white/[0.10] bg-white/[0.02] text-slate-300 flex items-center justify-center gap-2"
                      >
                        <PenLine size={16} className="text-slate-500" />
                        Use saved signature
                      </button>
                    )}

                    {signatureDataUrl ? (
                      <div className="mt-4">
                        <img
                          src={signatureDataUrl}
                          alt="Signature"
                          className="w-full h-[160px] rounded-2xl border border-white/[0.10] bg-black/10 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="mt-4">
                        <canvas
                          ref={canvasRef}
                          className="w-full h-[160px] rounded-2xl border border-white/[0.10] bg-[#0B1224] touch-none"
                          onPointerDown={(e) => {
                            ensureCanvasSize()
                            const canvas = canvasRef.current
                            if (!canvas) return
                            canvas.setPointerCapture(e.pointerId)
                            drawingRef.current = false
                            drawFromEvent(e)
                          }}
                          onPointerMove={(e) => {
                            if (!canvasRef.current) return
                            if (e.buttons === 0) return
                            drawFromEvent(e)
                          }}
                          onPointerUp={() => endDrawing()}
                          onPointerCancel={() => endDrawing()}
                        />
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <input
                        id="saveSig"
                        type="checkbox"
                        checked={saveSignature}
                        onChange={(e) => setSaveSignature(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="saveSig" className="text-xs text-slate-400">
                        Save this signature for future inspections
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!signatureReady}
                  onClick={() => goStep(7)}
                  className="w-full min-h-[56px] mt-4 rounded-2xl bg-blue-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Next <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 7: Review + submit */}
            {step === 7 && (
              <div className="h-full flex flex-col">
                <div className="pt-4">
                  <div className="text-2xl font-display font-bold">Review</div>
                  <div className="mt-2 text-sm text-slate-400">
                    Confirm details before submitting.
                  </div>
                </div>

                <div className="mt-5 space-y-3 flex-1 overflow-y-auto pr-1 -mr-1">
                  <div className="card-glass rounded-2xl p-4 space-y-2">
                    <div className="text-sm text-white font-semibold">
                      Vehicle: <span className="font-mono">{vehicle?.code || '—'}</span> — {vehicle?.year ?? ''} {vehicle?.make ?? ''}
                    </div>
                    <div className="text-sm text-slate-400">
                      Date/Time: <span className="font-mono text-slate-300">{timestamp.toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      Odometer: <span className="font-mono text-white">{Number(mileage || 0).toLocaleString()} mi</span>
                    </div>
                  </div>

                  <div className="card-glass rounded-2xl p-4">
                    <div className="text-sm text-white font-semibold mb-2">Results</div>
                    <div className="text-sm text-slate-400">
                      Items: <span className="text-white">{passCount}</span> passed,{' '}
                      <span className="text-amber-400">{issueCount}</span> with issues,{' '}
                      <span className="text-red-400">{failCount}</span> failed
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      Photos: <span className="text-white">{photoCount}</span> taken
                    </div>
                  </div>

                  {issuesToCreate.length > 0 && (
                    <div className="card-glass rounded-2xl p-4 border border-amber-500/20 bg-amber-500/[0.06]">
                      <div className="text-sm font-semibold text-amber-300">
                        ⚠ {issuesToCreate.length} issue(s) will be automatically logged for this vehicle
                      </div>
                      <div className="mt-3 space-y-2">
                        {issuesToCreate.map((i, idx) => (
                          <div key={idx} className="text-xs text-slate-300">
                            - {i.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {submitError && (
                    <div className="card-glass rounded-2xl p-4 border border-red-500/20 bg-red-500/[0.06] text-sm text-red-300">
                      {submitError}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={submit}
                  className="w-full min-h-[56px] mt-4 rounded-2xl bg-blue-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    'Submit Inspection'
                  )}
                </button>
              </div>
            )}

            {/* STEP 8: Success */}
            {step === 8 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                  className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-6"
                >
                  <CheckCircle2 size={34} className="text-emerald-400" />
                </motion.div>
                <div className="text-3xl font-display font-bold text-white">Inspection Complete</div>
                <div className="mt-2 text-sm text-slate-400">
                  {timestamp.toLocaleDateString()} at {timestamp.toLocaleTimeString()}
                </div>

                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                    ✓ {passCount} Passed
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                    ⚠ {issueCount} Issues
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-semibold">
                    {photoCount} Photos
                  </span>
                </div>

                {issuesToCreate.length > 0 && (
                  <div className="mt-5 text-sm text-amber-300">
                    ⚠ {issuesToCreate.length} issue(s) have been logged for {vehicle?.code || 'vehicle'}
                  </div>
                )}

                <div className="mt-8 w-full max-w-sm space-y-3">
                  <button
                    type="button"
                    className="w-full min-h-[56px] rounded-2xl border border-white/[0.10] bg-white/[0.02] text-slate-300 font-semibold"
                    onClick={() => {
                      if (inspectionId) window.location.href = `/dashboard/inspections/${inspectionId}`
                    }}
                  >
                    View Inspection Report
                  </button>
                  <button
                    type="button"
                    className="w-full min-h-[56px] rounded-2xl bg-blue-500 text-white font-semibold"
                    onClick={() => (window.location.href = '/driver')}
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

