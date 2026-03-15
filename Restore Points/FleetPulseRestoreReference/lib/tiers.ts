export type SubscriptionTier = 'starter' | 'professional' | 'premium'

type TierConfig = {
  pricePerVehicleMonthly: number
  maxVehicles: number
  features: {
    csvImport: boolean
    driverManagement: boolean
    inspections: boolean
    advancedAnalytics: boolean
    apiAccess: boolean
  }
}

export const TIER_CONFIG: Record<SubscriptionTier, TierConfig> = {
  starter: {
    pricePerVehicleMonthly: 3,
    maxVehicles: 25,
    features: {
      csvImport: false,
      driverManagement: true,
      inspections: false,
      advancedAnalytics: false,
      apiAccess: false,
    },
  },
  professional: {
    pricePerVehicleMonthly: 6,
    maxVehicles: 100,
    features: {
      csvImport: true,
      driverManagement: true,
      inspections: true,
      advancedAnalytics: true,
      apiAccess: false,
    },
  },
  premium: {
    pricePerVehicleMonthly: 9,
    maxVehicles: 1000,
    features: {
      csvImport: true,
      driverManagement: true,
      inspections: true,
      advancedAnalytics: true,
      apiAccess: true,
    },
  },
}

export function normalizeTier(value: string | undefined | null): SubscriptionTier {
  if (value === 'starter' || value === 'professional' || value === 'premium') {
    return value
  }
  return 'professional'
}
