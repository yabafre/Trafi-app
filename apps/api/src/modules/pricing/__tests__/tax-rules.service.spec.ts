import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { TaxRulesService } from '../tax-rules.service';
import { PrismaService } from '@database/prisma.service';

/**
 * TaxRulesService Unit Tests
 *
 * Tests for tax rule CRUD operations with tenant isolation.
 * Mocks PrismaService and EventEmitter2.
 *
 * @see Story 3.6 - Product Pricing and Tax Rules
 */
describe('TaxRulesService', () => {
  let service: TaxRulesService;

  const mockStoreId = 'store_test123';
  const mockTaxRule = {
    id: 'tax_test1',
    storeId: mockStoreId,
    name: 'TVA Standard',
    rate: 20.0,
    countryIso2: 'FR',
    isDefault: true,
    appliesToShipping: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockPrismaService: any = {
    taxRule: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    country: {
      findUnique: jest.fn(),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $transaction: jest.fn((callback: any) => callback(mockPrismaService)),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxRulesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<TaxRulesService>(TaxRulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ===========================================================================
  // Create Tests
  // ===========================================================================
  describe('create', () => {
    it('should create a tax rule successfully', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(null); // No duplicate name
      mockPrismaService.country.findUnique.mockResolvedValue({ iso2: 'FR', name: 'France' });
      mockPrismaService.taxRule.create.mockResolvedValue(mockTaxRule);

      const result = await service.create(mockStoreId, {
        name: 'TVA Standard',
        rate: 20,
        countryIso2: 'FR',
        isDefault: true,
      });

      expect(result.id).toBe('tax_test1');
      expect(result.name).toBe('TVA Standard');
      expect(result.rate).toBe(20);
      expect(result.countryIso2).toBe('FR');
      expect(result.isDefault).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('taxRule.created', expect.any(Object));
    });

    it('should throw ConflictException if name already exists', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(mockTaxRule);

      await expect(
        service.create(mockStoreId, {
          name: 'TVA Standard',
          rate: 20,
          countryIso2: 'FR',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for invalid country code', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(null);
      mockPrismaService.country.findUnique.mockResolvedValue(null);

      await expect(
        service.create(mockStoreId, {
          name: 'Test Tax',
          rate: 10,
          countryIso2: 'XX',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should clear existing default when creating new default', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(null);
      mockPrismaService.country.findUnique.mockResolvedValue({ iso2: 'FR', name: 'France' });
      mockPrismaService.taxRule.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.taxRule.create.mockResolvedValue({ ...mockTaxRule, isDefault: true });

      await service.create(mockStoreId, {
        name: 'New Default',
        rate: 20,
        countryIso2: 'FR',
        isDefault: true,
      });

      expect(mockPrismaService.taxRule.updateMany).toHaveBeenCalledWith({
        where: { storeId: mockStoreId, isDefault: true },
        data: { isDefault: false },
      });
    });

    it('should uppercase country code', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(null);
      mockPrismaService.country.findUnique.mockResolvedValue({ iso2: 'FR', name: 'France' });
      mockPrismaService.taxRule.create.mockResolvedValue(mockTaxRule);

      await service.create(mockStoreId, {
        name: 'Test',
        rate: 10,
        countryIso2: 'fr', // lowercase
      });

      expect(mockPrismaService.taxRule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            countryIso2: 'FR', // uppercased
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // Update Tests
  // ===========================================================================
  describe('update', () => {
    it('should update a tax rule successfully', async () => {
      // First call: find existing rule, second call: name uniqueness check (return null = unique)
      mockPrismaService.taxRule.findFirst
        .mockResolvedValueOnce(mockTaxRule)
        .mockResolvedValueOnce(null);
      mockPrismaService.taxRule.update.mockResolvedValue({
        ...mockTaxRule,
        name: 'Updated Name',
      });

      const result = await service.update(mockStoreId, {
        id: 'tax_test1',
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('taxRule.updated', expect.any(Object));
    });

    it('should throw NotFoundException if tax rule not found', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockStoreId, {
          id: 'tax_nonexistent',
          name: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new name already exists', async () => {
      mockPrismaService.taxRule.findFirst
        .mockResolvedValueOnce(mockTaxRule) // First call: find existing rule
        .mockResolvedValueOnce({ ...mockTaxRule, id: 'tax_other', name: 'Existing Name' }); // Second call: name check

      await expect(
        service.update(mockStoreId, {
          id: 'tax_test1',
          name: 'Existing Name',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should validate country code when updating', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(mockTaxRule);
      mockPrismaService.country.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockStoreId, {
          id: 'tax_test1',
          countryIso2: 'XX',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ===========================================================================
  // Delete Tests
  // ===========================================================================
  describe('delete', () => {
    it('should delete a tax rule successfully', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue({
        ...mockTaxRule,
        _count: { variants: 0 },
      });
      mockPrismaService.taxRule.delete.mockResolvedValue(mockTaxRule);

      await service.delete(mockStoreId, 'tax_test1');

      expect(mockPrismaService.taxRule.delete).toHaveBeenCalledWith({
        where: { id: 'tax_test1' },
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('taxRule.deleted', expect.any(Object));
    });

    it('should throw NotFoundException if tax rule not found', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(null);

      await expect(service.delete(mockStoreId, 'tax_nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if tax rule has assigned variants', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue({
        ...mockTaxRule,
        _count: { variants: 5 },
      });

      await expect(service.delete(mockStoreId, 'tax_test1')).rejects.toThrow(ConflictException);
    });
  });

  // ===========================================================================
  // FindById Tests
  // ===========================================================================
  describe('findById', () => {
    it('should return a tax rule by ID', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(mockTaxRule);

      const result = await service.findById(mockStoreId, 'tax_test1');

      expect(result.id).toBe('tax_test1');
      expect(result.name).toBe('TVA Standard');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(null);

      await expect(service.findById(mockStoreId, 'tax_nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should enforce tenant isolation', async () => {
      await service.findById(mockStoreId, 'tax_test1').catch(() => {});

      expect(mockPrismaService.taxRule.findFirst).toHaveBeenCalledWith({
        where: { id: 'tax_test1', storeId: mockStoreId },
      });
    });
  });

  // ===========================================================================
  // List Tests
  // ===========================================================================
  describe('list', () => {
    it('should return paginated tax rules', async () => {
      mockPrismaService.taxRule.findMany.mockResolvedValue([mockTaxRule]);
      mockPrismaService.taxRule.count.mockResolvedValue(1);

      const result = await service.list(mockStoreId, { page: 1, limit: 50 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by country code', async () => {
      mockPrismaService.taxRule.findMany.mockResolvedValue([mockTaxRule]);
      mockPrismaService.taxRule.count.mockResolvedValue(1);

      await service.list(mockStoreId, { countryIso2: 'FR' });

      expect(mockPrismaService.taxRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: mockStoreId,
            countryIso2: 'FR',
          }),
        }),
      );
    });

    it('should filter by isDefault', async () => {
      mockPrismaService.taxRule.findMany.mockResolvedValue([mockTaxRule]);
      mockPrismaService.taxRule.count.mockResolvedValue(1);

      await service.list(mockStoreId, { isDefault: true });

      expect(mockPrismaService.taxRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            storeId: mockStoreId,
            isDefault: true,
          }),
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      mockPrismaService.taxRule.findMany.mockResolvedValue([mockTaxRule]);
      mockPrismaService.taxRule.count.mockResolvedValue(100);

      const result = await service.list(mockStoreId, { page: 1, limit: 10 });

      expect(result.hasMore).toBe(true);
    });
  });

  // ===========================================================================
  // SetDefaultTaxRule Tests
  // ===========================================================================
  describe('setDefaultTaxRule', () => {
    it('should set a tax rule as default', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue({ ...mockTaxRule, isDefault: false });
      mockPrismaService.taxRule.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.taxRule.update.mockResolvedValue({ ...mockTaxRule, isDefault: true });

      const result = await service.setDefaultTaxRule(mockStoreId, 'tax_test1');

      expect(result.isDefault).toBe(true);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('taxRule.defaultChanged', expect.any(Object));
    });

    it('should return existing rule if already default', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue({ ...mockTaxRule, isDefault: true });

      const result = await service.setDefaultTaxRule(mockStoreId, 'tax_test1');

      expect(result.isDefault).toBe(true);
      expect(mockPrismaService.taxRule.updateMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if tax rule not found', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(null);

      await expect(service.setDefaultTaxRule(mockStoreId, 'tax_nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ===========================================================================
  // GetDefaultTaxRule Tests
  // ===========================================================================
  describe('getDefaultTaxRule', () => {
    it('should return the default tax rule', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(mockTaxRule);

      const result = await service.getDefaultTaxRule(mockStoreId);

      expect(result).not.toBeNull();
      expect(result!.isDefault).toBe(true);
    });

    it('should return null if no default exists', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(null);

      const result = await service.getDefaultTaxRule(mockStoreId);

      expect(result).toBeNull();
    });

    it('should filter by country code when provided', async () => {
      mockPrismaService.taxRule.findFirst.mockResolvedValue(mockTaxRule);

      await service.getDefaultTaxRule(mockStoreId, 'FR');

      expect(mockPrismaService.taxRule.findFirst).toHaveBeenCalledWith({
        where: {
          storeId: mockStoreId,
          isDefault: true,
          countryIso2: 'FR',
        },
      });
    });
  });

  // ===========================================================================
  // ListForSelect Tests
  // ===========================================================================
  describe('listForSelect', () => {
    it('should return minimal data for dropdown', async () => {
      mockPrismaService.taxRule.findMany.mockResolvedValue([
        { id: 'tax_1', name: 'TVA 20%', rate: 20.0, isDefault: true },
        { id: 'tax_2', name: 'TVA 5.5%', rate: 5.5, isDefault: false },
      ]);

      const result = await service.listForSelect(mockStoreId);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'tax_1',
        name: 'TVA 20%',
        rate: 20,
        isDefault: true,
      });
    });

    it('should order by default first, then name', async () => {
      mockPrismaService.taxRule.findMany.mockResolvedValue([]);

      await service.listForSelect(mockStoreId);

      expect(mockPrismaService.taxRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        }),
      );
    });

    it('should convert Decimal rate to number', async () => {
      // Simulate Prisma Decimal type
      mockPrismaService.taxRule.findMany.mockResolvedValue([
        { id: 'tax_1', name: 'Test', rate: { toNumber: () => 20.0 }, isDefault: false },
      ]);

      const result = await service.listForSelect(mockStoreId);

      expect(typeof result[0].rate).toBe('number');
    });
  });
});
