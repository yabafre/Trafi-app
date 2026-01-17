'use client'

import { useState } from 'react'
import { GeneralSettingsForm } from './GeneralSettingsForm'
import { LocalizationSettingsForm } from './LocalizationSettingsForm'
import { ContactSettingsForm } from './ContactSettingsForm'
import { BrandSettingsForm } from './BrandSettingsForm'

type TabValue = 'general' | 'localization' | 'contact' | 'brand'

interface Tab {
  value: TabValue
  label: string
}

const TABS: Tab[] = [
  { value: 'general', label: 'GENERAL' },
  { value: 'localization', label: 'LOCALISATION' },
  { value: 'contact', label: 'CONTACT' },
  { value: 'brand', label: 'MARQUE' },
]

/**
 * Tabbed settings interface for store configuration
 * AC: #1 - View all current store settings
 */
export function StoreSettingsTabs() {
  const [activeTab, setActiveTab] = useState<TabValue>('general')

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-[#333333]">
        <nav className="flex gap-0 -mb-px" aria-label="Settings tabs">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`
                px-6 py-3 font-mono text-xs uppercase tracking-wider
                border-b-2 transition-colors
                ${
                  activeTab === tab.value
                    ? 'border-[#CCFF00] text-[#CCFF00]'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-[#333333]'
                }
              `}
              data-testid={`tab-${tab.value}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === 'general' && <GeneralSettingsForm />}
        {activeTab === 'localization' && <LocalizationSettingsForm />}
        {activeTab === 'contact' && <ContactSettingsForm />}
        {activeTab === 'brand' && <BrandSettingsForm />}
      </div>
    </div>
  )
}
