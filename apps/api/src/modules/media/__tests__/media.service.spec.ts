import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MediaService, UploadedFile } from '../media.service';
import { PrismaService } from '@database/prisma.service';
import { StorageService } from '@common/storage';

// Mock sharp module
jest.mock('sharp', () => {
  const mockSharp = jest.fn(() => ({
    metadata: jest.fn().mockResolvedValue({ width: 1000, height: 800, format: 'jpeg' }),
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('optimized')),
    clone: jest.fn().mockReturnThis(),
  }));
  return mockSharp;
});

// Mock PrismaService
const mockPrismaService = {
  product: {
    findFirst: jest.fn(),
  },
  productMedia: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
  productVariant: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
};

// Mock StorageService
const mockStorageService = {
  upload: jest.fn().mockResolvedValue({ url: 'https://cdn.example.com/uploaded.webp', key: 'key' }),
  delete: jest.fn().mockResolvedValue(undefined),
  isConfigured: jest.fn().mockReturnValue(true),
};

// Mock EventEmitter2
const mockEventEmitter = {
  emit: jest.fn(),
};

describe('MediaService', () => {
  let service: MediaService;

  const mockStoreId = 'store_123';
  const mockProductId = 'prod_456';
  const mockMediaId = 'med_789';

  const mockProduct = {
    id: mockProductId,
    storeId: mockStoreId,
    name: 'Test Product',
    deletedAt: null,
    media: [],
  };

  const mockMedia = {
    id: mockMediaId,
    productId: mockProductId,
    variantId: null,
    url: 'https://cdn.example.com/test.webp',
    thumbnailUrl: 'https://cdn.example.com/test_thumb.webp',
    altText: 'Test image',
    type: 'IMAGE' as const,
    position: 0,
    isPrimary: true,
    width: 1000,
    height: 800,
    sizeInBytes: 50000,
    mimeType: 'image/jpeg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFile: UploadedFile = {
    buffer: Buffer.from('test image data'),
    mimetype: 'image/jpeg',
    originalname: 'test.jpg',
    size: 50000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('upload()', () => {
    it('should upload and create media record', async () => {
      mockPrismaService.product.findFirst = jest.fn().mockResolvedValue(mockProduct);
      mockPrismaService.productMedia.create = jest.fn().mockResolvedValue(mockMedia);

      const result = await service.upload(mockStoreId, mockProductId, mockFile);

      expect(result).toEqual(expect.objectContaining({
        id: mockMediaId,
        productId: mockProductId,
        isPrimary: true,
      }));
      expect(mockStorageService.upload).toHaveBeenCalledTimes(2); // main + thumbnail
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('media.uploaded', expect.any(Object));
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findFirst = jest.fn().mockResolvedValue(null);

      await expect(service.upload(mockStoreId, mockProductId, mockFile)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if max images reached', async () => {
      const productWithMaxMedia = {
        ...mockProduct,
        media: Array(10).fill(mockMedia),
      };
      mockPrismaService.product.findFirst = jest.fn().mockResolvedValue(productWithMaxMedia);

      await expect(service.upload(mockStoreId, mockProductId, mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid file type', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/pdf' };

      await expect(service.upload(mockStoreId, mockProductId, invalidFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for file too large', async () => {
      const largeFile = { ...mockFile, size: 15 * 1024 * 1024 }; // 15MB

      await expect(service.upload(mockStoreId, mockProductId, largeFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update()', () => {
    it('should update media alt text', async () => {
      mockPrismaService.productMedia.findUnique = jest.fn().mockResolvedValue({
        ...mockMedia,
        product: mockProduct,
      });
      mockPrismaService.productMedia.update = jest.fn().mockResolvedValue({
        ...mockMedia,
        altText: 'Updated alt text',
      });

      const result = await service.update(mockStoreId, {
        id: mockMediaId,
        altText: 'Updated alt text',
      });

      expect(result.altText).toBe('Updated alt text');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('media.updated', expect.any(Object));
    });

    it('should set media as primary and unset others', async () => {
      mockPrismaService.productMedia.findUnique = jest.fn().mockResolvedValue({
        ...mockMedia,
        isPrimary: false,
        product: mockProduct,
      });
      mockPrismaService.productMedia.updateMany = jest.fn().mockResolvedValue({ count: 1 });
      mockPrismaService.productMedia.update = jest.fn().mockResolvedValue({
        ...mockMedia,
        isPrimary: true,
      });

      await service.update(mockStoreId, {
        id: mockMediaId,
        isPrimary: true,
      });

      expect(mockPrismaService.productMedia.updateMany).toHaveBeenCalledWith({
        where: {
          productId: mockProductId,
          id: { not: mockMediaId },
        },
        data: { isPrimary: false },
      });
    });

    it('should throw NotFoundException if media not found', async () => {
      mockPrismaService.productMedia.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.update(mockStoreId, { id: mockMediaId, altText: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if media belongs to different store', async () => {
      mockPrismaService.productMedia.findUnique = jest.fn().mockResolvedValue({
        ...mockMedia,
        product: { ...mockProduct, storeId: 'different_store' },
      });

      await expect(
        service.update(mockStoreId, { id: mockMediaId, altText: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorder()', () => {
    it('should reorder media and set first as primary', async () => {
      const media1 = { ...mockMedia, id: 'med_1', position: 0 };
      const media2 = { ...mockMedia, id: 'med_2', position: 1 };

      mockPrismaService.product.findFirst = jest.fn().mockResolvedValue({
        ...mockProduct,
        media: [media1, media2],
      });
      mockPrismaService.productMedia.update = jest.fn().mockImplementation(({ where, data }) =>
        Promise.resolve({ ...mockMedia, id: where.id, ...data }),
      );
      mockPrismaService.productMedia.findMany = jest.fn().mockResolvedValue([
        { ...media2, position: 0, isPrimary: true },
        { ...media1, position: 1, isPrimary: false },
      ]);

      const result = await service.reorder(mockStoreId, {
        productId: mockProductId,
        mediaIds: ['med_2', 'med_1'],
      });

      expect(result[0].isPrimary).toBe(true);
      expect(result[0].position).toBe(0);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('media.reordered', expect.any(Object));
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        service.reorder(mockStoreId, { productId: mockProductId, mediaIds: ['med_1'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if media ID not in product', async () => {
      mockPrismaService.product.findFirst = jest.fn().mockResolvedValue({
        ...mockProduct,
        media: [mockMedia],
      });

      await expect(
        service.reorder(mockStoreId, { productId: mockProductId, mediaIds: ['med_invalid'] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete()', () => {
    it('should delete media from storage and database', async () => {
      mockPrismaService.productMedia.findUnique = jest.fn().mockResolvedValue({
        ...mockMedia,
        isPrimary: false,
        product: mockProduct,
      });
      mockPrismaService.productMedia.delete = jest.fn().mockResolvedValue(mockMedia);

      await service.delete(mockStoreId, mockMediaId);

      expect(mockStorageService.delete).toHaveBeenCalledTimes(2); // main + thumbnail
      expect(mockPrismaService.productMedia.delete).toHaveBeenCalledWith({ where: { id: mockMediaId } });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('media.deleted', expect.any(Object));
    });

    it('should set next media as primary when deleting primary', async () => {
      const nextMedia = { ...mockMedia, id: 'med_next', isPrimary: false };

      mockPrismaService.productMedia.findUnique = jest.fn().mockResolvedValue({
        ...mockMedia,
        isPrimary: true,
        product: mockProduct,
      });
      mockPrismaService.productMedia.delete = jest.fn().mockResolvedValue(mockMedia);
      mockPrismaService.productMedia.findFirst = jest.fn().mockResolvedValue(nextMedia);
      mockPrismaService.productMedia.update = jest.fn().mockResolvedValue({ ...nextMedia, isPrimary: true });

      await service.delete(mockStoreId, mockMediaId);

      expect(mockPrismaService.productMedia.update).toHaveBeenCalledWith({
        where: { id: 'med_next' },
        data: { isPrimary: true },
      });
    });

    it('should throw NotFoundException if media not found', async () => {
      mockPrismaService.productMedia.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.delete(mockStoreId, mockMediaId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listByProduct()', () => {
    it('should list all media ordered by position', async () => {
      mockPrismaService.product.findFirst = jest.fn().mockResolvedValue(mockProduct);
      mockPrismaService.productMedia.findMany = jest.fn().mockResolvedValue([mockMedia]);

      const result = await service.listByProduct(mockStoreId, mockProductId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockMediaId);
      expect(mockPrismaService.productMedia.findMany).toHaveBeenCalledWith({
        where: { productId: mockProductId },
        orderBy: { position: 'asc' },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaService.product.findFirst = jest.fn().mockResolvedValue(null);

      await expect(service.listByProduct(mockStoreId, mockProductId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findById()', () => {
    it('should return media by ID', async () => {
      mockPrismaService.productMedia.findUnique = jest.fn().mockResolvedValue({
        ...mockMedia,
        product: mockProduct,
      });

      const result = await service.findById(mockStoreId, mockMediaId);

      expect(result.id).toBe(mockMediaId);
    });

    it('should throw NotFoundException if media not found', async () => {
      mockPrismaService.productMedia.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.findById(mockStoreId, mockMediaId)).rejects.toThrow(NotFoundException);
    });
  });
});
