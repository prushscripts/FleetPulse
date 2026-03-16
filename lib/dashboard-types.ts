/**
 * Shared types for dashboard/vehicles so server can build preview data.
 */
export interface Vehicle {
  id: string
  code: string
  make: string | null
  model: string | null
  year: number | null
  current_mileage: number
  oil_change_due_mileage: number
  license_plate: string | null
  vin: string | null
  notes: string | null
  status: string | null
  driver_id: string | null
}

export interface VehicleWithStats extends Vehicle {
  open_issues_count: number
  expired_documents_count: number
  documents_count: number
  driver_name: string | null
  group_name: 'New York' | 'DMV'
  vehicle_type: string
}
