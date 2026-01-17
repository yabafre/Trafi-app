import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@database/prisma.service';
import type { StoreSettings } from '@generated/prisma/client';
import type { UpdateStoreSettingsDto, StoreSettingsResponseDto } from './dto';

/**
 * Store Settings management service
 *
 * IMPORTANT: Use `protected` methods (not `private`) to support
 * merchant overrides in @trafi/core distribution model.
 *
 * Key behaviors:
 * - Returns default settings when StoreSettings record doesn't exist
 * - Uses Prisma upsert for first-save-creates-record pattern
 * - Emits events for cache invalidation
 *
 * @see epic-02-admin-auth.md#Story-2.7
 */
@Injectable()
export class SettingsService {
  protected readonly logger = new Logger(SettingsService.name);

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get default settings values.
   * Protected for @trafi/core consumers to override defaults.
   */
  protected getDefaultSettings(): Omit<
    StoreSettingsResponseDto,
    'id' | 'storeId' | 'createdAt' | 'updatedAt'
  > {
    return {
      name: 'My Store',
      description: null,
      slug: null,
      defaultCurrency: 'EUR',
      defaultLocale: 'en',
      timezone: 'UTC',
      weightUnit: 'g',
      taxIncluded: true,
      autoArchiveOrders: false,
      orderNumberPrefix: 'ORD-',
      lowStockThreshold: 5,
      contactEmail: null,
      supportEmail: null,
      phoneNumber: null,
      address: null,
      primaryColor: '#CCFF00', // Brutalist accent color
      logoUrl: null,
      faviconUrl: null,
    };
  }

  /**
   * Get store settings.
   * Returns existing settings or defaults if none exist.
   *
   * @param storeId - The store ID for tenant isolation
   * @returns Store settings (existing or defaults)
   */
  async get(storeId: string): Promise<StoreSettingsResponseDto> {
    // Verify store exists
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { settings: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Return existing settings or defaults
    if (store.settings) {
      return this.toSettingsResponse(store.settings);
    }

    // Return defaults with placeholder values
    return {
      id: '',
      storeId,
      ...this.getDefaultSettings(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Update store settings.
   * Creates settings if they don't exist (upsert behavior).
   *
   * @param storeId - The store ID for tenant isolation
   * @param input - Settings to update
   * @returns Updated store settings
   */
  async update(
    storeId: string,
    input: UpdateStoreSettingsDto,
  ): Promise<StoreSettingsResponseDto> {
    // Verify store exists
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Build update data, filtering out undefined values
    const updateData = this.buildUpdateData(input);

    // Upsert settings (create if not exists, update if exists)
    const settings = await this.prisma.storeSettings.upsert({
      where: { storeId },
      update: {
        ...updateData,
        updatedAt: new Date(),
      },
      create: {
        storeId,
        ...this.getCreateDataFromDefaults(),
        ...updateData,
      },
    });

    // Emit event for cache invalidation and analytics
    this.eventEmitter.emit('system.store.settings_updated', {
      storeId,
      settings: this.toSettingsResponse(settings),
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Store settings updated for store ${storeId}`);

    return this.toSettingsResponse(settings);
  }

  /**
   * Build update data from DTO, filtering undefined values.
   * Protected for merchant override.
   */
  protected buildUpdateData(input: UpdateStoreSettingsDto): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    // Only include fields that are explicitly set (not undefined)
    const fields: (keyof UpdateStoreSettingsDto)[] = [
      'name',
      'description',
      'slug',
      'defaultCurrency',
      'defaultLocale',
      'timezone',
      'weightUnit',
      'taxIncluded',
      'autoArchiveOrders',
      'orderNumberPrefix',
      'lowStockThreshold',
      'contactEmail',
      'supportEmail',
      'phoneNumber',
      'address',
      'primaryColor',
      'logoUrl',
      'faviconUrl',
    ];

    for (const field of fields) {
      if (input[field] !== undefined) {
        data[field] = input[field];
      }
    }

    return data;
  }

  /**
   * Get create data from defaults.
   * Protected for merchant override.
   */
  protected getCreateDataFromDefaults(): Record<string, unknown> {
    const defaults = this.getDefaultSettings();
    return {
      name: defaults.name,
      description: defaults.description,
      slug: defaults.slug,
      defaultCurrency: defaults.defaultCurrency,
      defaultLocale: defaults.defaultLocale,
      timezone: defaults.timezone,
      weightUnit: defaults.weightUnit,
      taxIncluded: defaults.taxIncluded,
      autoArchiveOrders: defaults.autoArchiveOrders,
      orderNumberPrefix: defaults.orderNumberPrefix,
      lowStockThreshold: defaults.lowStockThreshold,
      contactEmail: defaults.contactEmail,
      supportEmail: defaults.supportEmail,
      phoneNumber: defaults.phoneNumber,
      address: defaults.address,
      primaryColor: defaults.primaryColor,
      logoUrl: defaults.logoUrl,
      faviconUrl: defaults.faviconUrl,
    };
  }

  /**
   * Convert Prisma StoreSettings entity to response DTO.
   * Protected for @trafi/core customization.
   */
  protected toSettingsResponse(settings: StoreSettings): StoreSettingsResponseDto {
    return {
      id: settings.id,
      storeId: settings.storeId,
      name: settings.name,
      description: settings.description,
      slug: settings.slug,
      defaultCurrency: settings.defaultCurrency,
      defaultLocale: settings.defaultLocale,
      timezone: settings.timezone,
      weightUnit: settings.weightUnit,
      taxIncluded: settings.taxIncluded,
      autoArchiveOrders: settings.autoArchiveOrders,
      orderNumberPrefix: settings.orderNumberPrefix,
      lowStockThreshold: settings.lowStockThreshold,
      contactEmail: settings.contactEmail,
      supportEmail: settings.supportEmail,
      phoneNumber: settings.phoneNumber,
      address: settings.address as StoreSettingsResponseDto['address'],
      primaryColor: settings.primaryColor,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }
}
