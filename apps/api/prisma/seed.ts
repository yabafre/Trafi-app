/**
 * Prisma Database Seed Script
 *
 * Populates the database with realistic demo data for development and testing.
 * This script is idempotent - running it multiple times will not create duplicates.
 *
 * Usage: pnpm db:seed (from monorepo root)
 *
 * Architecture Compliance:
 * - ARCH-25: Money stored as INTEGER cents (priceInCents)
 * - ARCH-22: Naming conventions followed
 * - Multi-tenancy: All entities scoped to storeId
 */

// Import PrismaClient from the custom generated location (Prisma 7)
// Uses @prisma/adapter-pg for PostgreSQL connection (same as PrismaService)
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Validate DATABASE_URL is set before proceeding
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  console.error('Please ensure you have a .env file at the monorepo root with DATABASE_URL defined.');
  process.exit(1);
}

// Initialize Prisma with PostgreSQL adapter (Prisma 7 requirement)
const adapter = new PrismaPg({
  connectionString: databaseUrl,
});
const prisma = new PrismaClient({ adapter });

// =============================================================================
// Constants
// =============================================================================

const LOG_SEPARATOR_WIDTH = 60;

// =============================================================================
// Demo Data Definitions
// =============================================================================

const DEMO_STORE = {
  name: 'Demo Store',
  slug: 'demo-store',
};

const DEMO_USERS = [
  { email: 'admin@trafi.dev', name: 'Admin User' },
  { email: 'manager@trafi.dev', name: 'Store Manager' },
  { email: 'staff@trafi.dev', name: 'Staff Member' },
];

// Products with prices in cents (ARCH-25)
const DEMO_PRODUCTS = [
  {
    name: 'Premium T-Shirt',
    slug: 'premium-tshirt',
    description: 'High-quality cotton t-shirt with a comfortable fit.',
    priceInCents: 2999, // $29.99
    isActive: true,
  },
  {
    name: 'Classic Hoodie',
    slug: 'classic-hoodie',
    description: 'Cozy fleece hoodie perfect for cooler days.',
    priceInCents: 5999, // $59.99
    isActive: true,
  },
  {
    name: 'Wireless Earbuds',
    slug: 'wireless-earbuds',
    description: 'Bluetooth 5.0 earbuds with noise cancellation.',
    priceInCents: 8999, // $89.99
    isActive: true,
  },
  {
    name: 'Smart Watch',
    slug: 'smart-watch',
    description: 'Fitness tracking watch with heart rate monitor and GPS.',
    priceInCents: 19999, // $199.99
    isActive: true,
  },
  {
    name: 'Laptop Stand',
    slug: 'laptop-stand',
    description: 'Adjustable aluminum laptop stand for better ergonomics.',
    priceInCents: 4999, // $49.99
    isActive: true,
  },
  {
    name: 'USB-C Hub',
    slug: 'usb-c-hub',
    description: '7-in-1 USB-C dock with HDMI, USB-A, and SD card reader.',
    priceInCents: 3499, // $34.99
    isActive: true,
  },
  {
    name: 'Coffee Mug',
    slug: 'coffee-mug',
    description: 'Ceramic 12oz mug with ergonomic handle.',
    priceInCents: 1499, // $14.99
    isActive: true,
  },
  {
    name: 'Desk Lamp',
    slug: 'desk-lamp',
    description: 'LED desk lamp with adjustable brightness and USB charging.',
    priceInCents: 3999, // $39.99
    isActive: true,
  },
  {
    name: 'Notebook Set',
    slug: 'notebook-set',
    description: '3-pack of ruled notebooks with premium paper.',
    priceInCents: 999, // $9.99
    isActive: true,
  },
  {
    name: 'Discontinued Item',
    slug: 'discontinued-item',
    description: 'This product is no longer available.',
    priceInCents: 1999, // $19.99
    isActive: false,
  },
  {
    name: 'Limited Edition Cap',
    slug: 'limited-edition-cap',
    description: 'Special release cap with embroidered logo.',
    priceInCents: 2499, // $24.99
    isActive: true,
  },
];

// =============================================================================
// Seed Functions
// =============================================================================

async function seedStore(): Promise<string> {
  console.log('\n--- Seeding Store ---');

  const store = await prisma.store.upsert({
    where: { slug: DEMO_STORE.slug },
    update: {},
    create: {
      name: DEMO_STORE.name,
      slug: DEMO_STORE.slug,
    },
  });

  console.log(`  Store: ${store.name} (${store.id})`);
  return store.id;
}

async function seedUsers(storeId: string): Promise<void> {
  console.log('\n--- Seeding Users ---');

  for (const userData of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        storeId: storeId,
      },
    });

    console.log(`  User: ${user.name} (${user.email})`);
  }

  console.log(`  Total: ${DEMO_USERS.length} users`);
}

async function seedProducts(storeId: string): Promise<void> {
  console.log('\n--- Seeding Products ---');

  for (const productData of DEMO_PRODUCTS) {
    const product = await prisma.product.upsert({
      where: {
        storeId_slug: {
          storeId: storeId,
          slug: productData.slug,
        },
      },
      update: {},
      create: {
        storeId: storeId,
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        priceInCents: productData.priceInCents,
        isActive: productData.isActive,
      },
    });

    const priceFormatted = `$${(product.priceInCents / 100).toFixed(2)}`;
    const statusIcon = product.isActive ? '✓' : '✗';
    console.log(`  [${statusIcon}] ${product.name}: ${priceFormatted}`);
  }

  console.log(`  Total: ${DEMO_PRODUCTS.length} products`);
}

// =============================================================================
// Main Seed Function
// =============================================================================

async function main() {
  console.log('='.repeat(LOG_SEPARATOR_WIDTH));
  console.log('Trafi Database Seed');
  console.log('='.repeat(LOG_SEPARATOR_WIDTH));

  // Seed in proper order: Store -> Users -> Products
  const storeId = await seedStore();
  await seedUsers(storeId);
  await seedProducts(storeId);

  console.log('\n' + '='.repeat(LOG_SEPARATOR_WIDTH));
  console.log('Seed completed successfully!');
  console.log('='.repeat(LOG_SEPARATOR_WIDTH));
}

// Execute seed
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('\nSeed failed with error:');
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
