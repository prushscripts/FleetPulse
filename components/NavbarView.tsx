'use client'

import React from 'react'
import type { Company } from './Navbar'
import { NavbarViewUIRaw } from './NavbarViewUIRaw'

export type NavbarViewProps = {
  switchingTo: string | null
  navItems: { label: string; href: string }[]
  pathname: string
  isTabActive: (href: string) => boolean
  mobileOpen: boolean
  setMobileOpen: (v: boolean | ((prev: boolean) => boolean)) => void
  showCompanySwitcher: boolean
  companies: Company[]
  currentCompanyId: string | null
  currentCompany: Company | undefined
  currentCompanyName: string
  companySwitcherOpen: boolean
  setCompanySwitcherOpen: (v: boolean | ((prev: boolean) => boolean)) => void
  handleSwitchCompany: (company: Company) => void
  handleLogout: () => void
  theme: string
  toggleTheme: () => void
  CompanyLogoImage: React.ComponentType<{ company: Company; className?: string }>
  navigateTo: (href: string) => void
}

export function NavbarView(props: NavbarViewProps) {
  return React.createElement(NavbarViewUIRaw, props)
}
