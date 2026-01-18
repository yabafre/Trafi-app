export { DatabaseModule } from './database.module';
export { PrismaService } from './prisma.service';

// ID Prefix Configuration (Story 3.R2)
export {
  ID_PREFIXES,
  getIdPrefix,
  hasIdPrefix,
  getConfiguredModels,
} from './id-prefixes.config';

// Prefixed IDs Extension
export { generatePrefixedId, prefixedIdsExtension } from './prefixed-ids.extension';
