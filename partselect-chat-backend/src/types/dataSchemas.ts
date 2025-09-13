import { z } from 'zod';

// Enhanced Product Data Schemas with rich metadata
export const EnhancedProductSchema = z.object({
  // Core product information
  id: z.string(),
  partNumber: z.string(),
  name: z.string(),
  description: z.string(),
  
  // Hierarchical categories
  category: z.enum(['refrigerator', 'dishwasher']),
  subcategory: z.string().optional(),
  brand: z.string(),
  manufacturerPartNumber: z.string().optional(),
  
  // Pricing and availability
  price: z.number().positive(),
  msrp: z.number().positive().optional(),
  currency: z.string().default('USD'),
  availability: z.enum(['in_stock', 'out_of_stock', 'backorder', 'discontinued']),
  stockQuantity: z.number().int().nonnegative().optional(),
  
  // Rich metadata
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  weight: z.number().positive().optional(),
  dimensions: z.object({
    length: z.number().positive().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    unit: z.string().default('inches')
  }).optional(),
  
  // Semantic relationships
  compatibleModels: z.array(z.string()).default([]),
  relatedParts: z.array(z.string()).default([]),
  replacementFor: z.array(z.string()).default([]),
  
  // Installation metadata
  installationDifficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  installationTime: z.number().int().positive().optional(), // minutes
  toolsRequired: z.array(z.string()).default([]),
  safetyWarnings: z.array(z.string()).default([]),
  
  // Customer data
  symptoms: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  reviewCount: z.number().int().nonnegative().default(0),
  averageRating: z.number().min(0).max(5).optional(),
  
  // Data quality and processing metadata
  warranty: z.string().optional(),
  dataSource: z.string().optional(),
  dataQuality: z.object({
    score: z.number().min(0).max(1),
    completeness: z.number().min(0).max(1),
    accuracy: z.number().min(0).max(1),
    freshness: z.number().min(0).max(1),
    lastValidated: z.date()
  }).optional(),
  
  // Timestamps
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  lastPriceUpdate: z.date().optional(),
  lastStockUpdate: z.date().optional()
});

// Data processing schemas
export const DataProcessingJobSchema = z.object({
  id: z.string(),
  type: z.enum(['import', 'enrich', 'validate', 'reconcile', 'update']),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  source: z.string(),
  totalRecords: z.number().int().nonnegative(),
  processedRecords: z.number().int().nonnegative().default(0),
  successfulRecords: z.number().int().nonnegative().default(0),
  failedRecords: z.number().int().nonnegative().default(0),
  errors: z.array(z.object({
    record: z.number().int().nonnegative(),
    error: z.string(),
    severity: z.enum(['warning', 'error', 'critical'])
  })).default([]),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  createdAt: z.date().default(() => new Date())
});

// Data validation schemas
export const ValidationRuleSchema = z.object({
  field: z.string(),
  rule: z.enum(['required', 'format', 'range', 'uniqueness', 'consistency']),
  condition: z.string(),
  severity: z.enum(['warning', 'error', 'critical']),
  message: z.string()
});

export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  score: z.number().min(0).max(1),
  errors: z.array(z.object({
    field: z.string(),
    rule: z.string(),
    message: z.string(),
    severity: z.enum(['warning', 'error', 'critical']),
    value: z.any().optional()
  })).default([]),
  warnings: z.array(z.object({
    field: z.string(),
    message: z.string(),
    value: z.any().optional()
  })).default([])
});

// Data enrichment schemas
export const EnrichmentRequestSchema = z.object({
  productId: z.string(),
  fields: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  source: z.enum(['llm', 'external_api', 'manual']).default('llm')
});

export const EnrichmentResultSchema = z.object({
  productId: z.string(),
  enrichedFields: z.record(z.string(), z.any()),
  confidence: z.number().min(0).max(1),
  source: z.string(),
  timestamp: z.date().default(() => new Date())
});

// Quality monitoring schemas
export const QualityMetricSchema = z.object({
  metric: z.string(),
  value: z.number(),
  threshold: z.number(),
  status: z.enum(['good', 'warning', 'critical']),
  timestamp: z.date().default(() => new Date())
});

export const QualityAlertSchema = z.object({
  id: z.string(),
  type: z.enum(['data_quality', 'processing_error', 'threshold_breach']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string(),
  details: z.record(z.string(), z.any()).default({}),
  resolved: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  resolvedAt: z.date().optional()
});

// CSV/JSON import schemas
export const CSVImportConfigSchema = z.object({
  delimiter: z.string().default(','),
  hasHeader: z.boolean().default(true),
  encoding: z.string().default('utf-8'),
  skipEmptyLines: z.boolean().default(true),
  fieldMapping: z.record(z.string(), z.string()).default({}),
  validationRules: z.array(ValidationRuleSchema).default([])
});

export const JSONImportConfigSchema = z.object({
  rootPath: z.string().optional(),
  fieldMapping: z.record(z.string(), z.string()).default({}),
  validationRules: z.array(ValidationRuleSchema).default([])
});

// Type exports
export type EnhancedProduct = z.infer<typeof EnhancedProductSchema>;
export type DataProcessingJob = z.infer<typeof DataProcessingJobSchema>;
export type ValidationRule = z.infer<typeof ValidationRuleSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type EnrichmentRequest = z.infer<typeof EnrichmentRequestSchema>;
export type EnrichmentResult = z.infer<typeof EnrichmentResultSchema>;
export type QualityMetric = z.infer<typeof QualityMetricSchema>;
export type QualityAlert = z.infer<typeof QualityAlertSchema>;
export type CSVImportConfig = z.infer<typeof CSVImportConfigSchema>;
export type JSONImportConfig = z.infer<typeof JSONImportConfigSchema>;