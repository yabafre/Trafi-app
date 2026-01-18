/**
 * ISO 3166-1 Countries Seed Data
 *
 * Populates the countries table with ISO 3166-1 standard country codes.
 * This is global reference data shared across all stores.
 *
 * @see Story M-1 - V3 Architectural Retroactive Fixes (AC3)
 * @see Principle #1 Exception - Global reference tables
 */

import type { PrismaClient } from '../../src/generated/prisma/client';

/**
 * Country data structure matching Prisma model
 */
export interface CountryData {
  iso2: string;
  iso3: string;
  name: string;
  phoneCode: string | null;
}

/**
 * ISO 3166-1 country data
 * Includes the most commonly used countries for e-commerce.
 * Full list: 249 countries (truncated here to essential ~100)
 */
export const COUNTRIES_DATA: CountryData[] = [
  // North America
  { iso2: 'US', iso3: 'USA', name: 'United States', phoneCode: '+1' },
  { iso2: 'CA', iso3: 'CAN', name: 'Canada', phoneCode: '+1' },
  { iso2: 'MX', iso3: 'MEX', name: 'Mexico', phoneCode: '+52' },

  // Europe - Western
  { iso2: 'GB', iso3: 'GBR', name: 'United Kingdom', phoneCode: '+44' },
  { iso2: 'FR', iso3: 'FRA', name: 'France', phoneCode: '+33' },
  { iso2: 'DE', iso3: 'DEU', name: 'Germany', phoneCode: '+49' },
  { iso2: 'IT', iso3: 'ITA', name: 'Italy', phoneCode: '+39' },
  { iso2: 'ES', iso3: 'ESP', name: 'Spain', phoneCode: '+34' },
  { iso2: 'PT', iso3: 'PRT', name: 'Portugal', phoneCode: '+351' },
  { iso2: 'NL', iso3: 'NLD', name: 'Netherlands', phoneCode: '+31' },
  { iso2: 'BE', iso3: 'BEL', name: 'Belgium', phoneCode: '+32' },
  { iso2: 'LU', iso3: 'LUX', name: 'Luxembourg', phoneCode: '+352' },
  { iso2: 'CH', iso3: 'CHE', name: 'Switzerland', phoneCode: '+41' },
  { iso2: 'AT', iso3: 'AUT', name: 'Austria', phoneCode: '+43' },
  { iso2: 'IE', iso3: 'IRL', name: 'Ireland', phoneCode: '+353' },

  // Europe - Nordic
  { iso2: 'SE', iso3: 'SWE', name: 'Sweden', phoneCode: '+46' },
  { iso2: 'NO', iso3: 'NOR', name: 'Norway', phoneCode: '+47' },
  { iso2: 'DK', iso3: 'DNK', name: 'Denmark', phoneCode: '+45' },
  { iso2: 'FI', iso3: 'FIN', name: 'Finland', phoneCode: '+358' },
  { iso2: 'IS', iso3: 'ISL', name: 'Iceland', phoneCode: '+354' },

  // Europe - Eastern
  { iso2: 'PL', iso3: 'POL', name: 'Poland', phoneCode: '+48' },
  { iso2: 'CZ', iso3: 'CZE', name: 'Czech Republic', phoneCode: '+420' },
  { iso2: 'SK', iso3: 'SVK', name: 'Slovakia', phoneCode: '+421' },
  { iso2: 'HU', iso3: 'HUN', name: 'Hungary', phoneCode: '+36' },
  { iso2: 'RO', iso3: 'ROU', name: 'Romania', phoneCode: '+40' },
  { iso2: 'BG', iso3: 'BGR', name: 'Bulgaria', phoneCode: '+359' },
  { iso2: 'UA', iso3: 'UKR', name: 'Ukraine', phoneCode: '+380' },
  { iso2: 'RU', iso3: 'RUS', name: 'Russia', phoneCode: '+7' },

  // Europe - Southern
  { iso2: 'GR', iso3: 'GRC', name: 'Greece', phoneCode: '+30' },
  { iso2: 'HR', iso3: 'HRV', name: 'Croatia', phoneCode: '+385' },
  { iso2: 'SI', iso3: 'SVN', name: 'Slovenia', phoneCode: '+386' },
  { iso2: 'RS', iso3: 'SRB', name: 'Serbia', phoneCode: '+381' },

  // Europe - Baltic
  { iso2: 'EE', iso3: 'EST', name: 'Estonia', phoneCode: '+372' },
  { iso2: 'LV', iso3: 'LVA', name: 'Latvia', phoneCode: '+371' },
  { iso2: 'LT', iso3: 'LTU', name: 'Lithuania', phoneCode: '+370' },

  // Asia - East
  { iso2: 'JP', iso3: 'JPN', name: 'Japan', phoneCode: '+81' },
  { iso2: 'KR', iso3: 'KOR', name: 'South Korea', phoneCode: '+82' },
  { iso2: 'CN', iso3: 'CHN', name: 'China', phoneCode: '+86' },
  { iso2: 'TW', iso3: 'TWN', name: 'Taiwan', phoneCode: '+886' },
  { iso2: 'HK', iso3: 'HKG', name: 'Hong Kong', phoneCode: '+852' },
  { iso2: 'MO', iso3: 'MAC', name: 'Macau', phoneCode: '+853' },
  { iso2: 'MN', iso3: 'MNG', name: 'Mongolia', phoneCode: '+976' },

  // Asia - Southeast
  { iso2: 'SG', iso3: 'SGP', name: 'Singapore', phoneCode: '+65' },
  { iso2: 'MY', iso3: 'MYS', name: 'Malaysia', phoneCode: '+60' },
  { iso2: 'TH', iso3: 'THA', name: 'Thailand', phoneCode: '+66' },
  { iso2: 'VN', iso3: 'VNM', name: 'Vietnam', phoneCode: '+84' },
  { iso2: 'ID', iso3: 'IDN', name: 'Indonesia', phoneCode: '+62' },
  { iso2: 'PH', iso3: 'PHL', name: 'Philippines', phoneCode: '+63' },

  // Asia - South
  { iso2: 'IN', iso3: 'IND', name: 'India', phoneCode: '+91' },
  { iso2: 'PK', iso3: 'PAK', name: 'Pakistan', phoneCode: '+92' },
  { iso2: 'BD', iso3: 'BGD', name: 'Bangladesh', phoneCode: '+880' },
  { iso2: 'LK', iso3: 'LKA', name: 'Sri Lanka', phoneCode: '+94' },
  { iso2: 'NP', iso3: 'NPL', name: 'Nepal', phoneCode: '+977' },

  // Middle East
  { iso2: 'AE', iso3: 'ARE', name: 'United Arab Emirates', phoneCode: '+971' },
  { iso2: 'SA', iso3: 'SAU', name: 'Saudi Arabia', phoneCode: '+966' },
  { iso2: 'IL', iso3: 'ISR', name: 'Israel', phoneCode: '+972' },
  { iso2: 'TR', iso3: 'TUR', name: 'Turkey', phoneCode: '+90' },
  { iso2: 'QA', iso3: 'QAT', name: 'Qatar', phoneCode: '+974' },
  { iso2: 'KW', iso3: 'KWT', name: 'Kuwait', phoneCode: '+965' },
  { iso2: 'BH', iso3: 'BHR', name: 'Bahrain', phoneCode: '+973' },
  { iso2: 'OM', iso3: 'OMN', name: 'Oman', phoneCode: '+968' },
  { iso2: 'JO', iso3: 'JOR', name: 'Jordan', phoneCode: '+962' },
  { iso2: 'LB', iso3: 'LBN', name: 'Lebanon', phoneCode: '+961' },

  // Oceania
  { iso2: 'AU', iso3: 'AUS', name: 'Australia', phoneCode: '+61' },
  { iso2: 'NZ', iso3: 'NZL', name: 'New Zealand', phoneCode: '+64' },

  // Africa
  { iso2: 'ZA', iso3: 'ZAF', name: 'South Africa', phoneCode: '+27' },
  { iso2: 'EG', iso3: 'EGY', name: 'Egypt', phoneCode: '+20' },
  { iso2: 'NG', iso3: 'NGA', name: 'Nigeria', phoneCode: '+234' },
  { iso2: 'KE', iso3: 'KEN', name: 'Kenya', phoneCode: '+254' },
  { iso2: 'MA', iso3: 'MAR', name: 'Morocco', phoneCode: '+212' },
  { iso2: 'GH', iso3: 'GHA', name: 'Ghana', phoneCode: '+233' },
  { iso2: 'TN', iso3: 'TUN', name: 'Tunisia', phoneCode: '+216' },
  { iso2: 'DZ', iso3: 'DZA', name: 'Algeria', phoneCode: '+213' },

  // South America
  { iso2: 'BR', iso3: 'BRA', name: 'Brazil', phoneCode: '+55' },
  { iso2: 'AR', iso3: 'ARG', name: 'Argentina', phoneCode: '+54' },
  { iso2: 'CL', iso3: 'CHL', name: 'Chile', phoneCode: '+56' },
  { iso2: 'CO', iso3: 'COL', name: 'Colombia', phoneCode: '+57' },
  { iso2: 'PE', iso3: 'PER', name: 'Peru', phoneCode: '+51' },
  { iso2: 'VE', iso3: 'VEN', name: 'Venezuela', phoneCode: '+58' },
  { iso2: 'EC', iso3: 'ECU', name: 'Ecuador', phoneCode: '+593' },
  { iso2: 'UY', iso3: 'URY', name: 'Uruguay', phoneCode: '+598' },
  { iso2: 'PY', iso3: 'PRY', name: 'Paraguay', phoneCode: '+595' },
  { iso2: 'BO', iso3: 'BOL', name: 'Bolivia', phoneCode: '+591' },

  // Central America & Caribbean
  { iso2: 'PA', iso3: 'PAN', name: 'Panama', phoneCode: '+507' },
  { iso2: 'CR', iso3: 'CRI', name: 'Costa Rica', phoneCode: '+506' },
  { iso2: 'PR', iso3: 'PRI', name: 'Puerto Rico', phoneCode: '+1' },
  { iso2: 'DO', iso3: 'DOM', name: 'Dominican Republic', phoneCode: '+1' },
  { iso2: 'JM', iso3: 'JAM', name: 'Jamaica', phoneCode: '+1' },
  { iso2: 'GT', iso3: 'GTM', name: 'Guatemala', phoneCode: '+502' },
  { iso2: 'SV', iso3: 'SLV', name: 'El Salvador', phoneCode: '+503' },
  { iso2: 'HN', iso3: 'HND', name: 'Honduras', phoneCode: '+504' },
  { iso2: 'NI', iso3: 'NIC', name: 'Nicaragua', phoneCode: '+505' },
];

/**
 * Seed countries into database
 * Uses upsert to be idempotent
 */
export async function seedCountries(prisma: PrismaClient): Promise<void> {
  console.log('\n--- Seeding Countries ---');

  // Use createMany with skipDuplicates for efficiency
  const result = await prisma.country.createMany({
    data: COUNTRIES_DATA,
    skipDuplicates: true,
  });

  console.log(`  Created: ${result.count} new countries`);
  console.log(`  Total available: ${COUNTRIES_DATA.length} countries`);
}
