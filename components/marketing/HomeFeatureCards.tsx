'use client'

import {
  Car,
  Users,
  ClipboardCheck,
  Wrench,
  AlertCircle,
  FileText,
  BarChart3,
  Download,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'
import ScrollReveal from '@/components/animations/ScrollReveal'

const ICON_MAP: Record<string, LucideIcon> = {
  car: Car,
  users: Users,
  clipboard: ClipboardCheck,
  wrench: Wrench,
  alert: AlertCircle,
  file: FileText,
  chart: BarChart3,
  download: Download,
  smartphone: Smartphone,
}

const FEATURES = [
  { title: 'Vehicle Tracking', description: 'Track mileage, oil changes, and maintenance schedules for all your vehicles.', iconKey: 'car' },
  { title: 'Driver Management', description: 'Assign drivers to vehicles and track driver assignments and performance.', iconKey: 'users' },
  { title: 'Digital Inspections', description: 'Conduct pre-trip and post-trip inspections with photo documentation.', iconKey: 'clipboard' },
  { title: 'Service Records', description: 'Maintain complete service history with costs and provider information.', iconKey: 'wrench' },
  { title: 'Issue Tracking', description: 'Report and track vehicle issues with priority levels and status updates.', iconKey: 'alert' },
  { title: 'Document Management', description: 'Store and track important documents with expiration date reminders.', iconKey: 'file' },
  { title: 'Fleet Health Dashboard', description: 'Monitor fleet health with oil change percentages and inspection statistics.', iconKey: 'chart' },
  { title: 'CSV Import', description: 'Bulk import vehicles from CSV files for quick setup.', iconKey: 'download' },
  { title: 'Mobile Friendly', description: 'Access your fleet data anywhere with our responsive design.', iconKey: 'smartphone' },
] as const

export default function HomeFeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {FEATURES.map((feature, idx) => {
        const Icon = ICON_MAP[feature.iconKey]
        return (
          <ScrollReveal key={idx} delay={idx * 50}>
            <div className="group relative bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-default select-none overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/0 dark:bg-blue-500/0 group-hover:bg-blue-500/[0.06] dark:group-hover:bg-blue-500/10 rounded-lg transition-colors duration-200" />
              <div className="relative">
                <div className="mb-3 transform group-hover:scale-110 transition-transform duration-200 text-blue-500 dark:text-blue-400">
                  {Icon && <Icon className="w-8 h-8" strokeWidth={1.8} />}
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed select-none cursor-default">{feature.description}</p>
              </div>
            </div>
          </ScrollReveal>
        )
      })}
    </div>
  )
}
