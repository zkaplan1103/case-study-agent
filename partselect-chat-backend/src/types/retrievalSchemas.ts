import { z } from 'zod';
import { EnhancedProduct } from './dataSchemas';

// Search query schemas
export const SearchQuerySchema = z.object({
  query: z.string().min(1),
  category: z.enum(['refrigerator', 'dishwasher', 'all']).default('all'),
  filters: z.object({
    brand: z.string().optional(),
    priceRange: z.object({
      min: z.number().min(0).optional(),
      max: z.number().positive().optional()
    }).optional(),
    availability: z.array(z.enum(['in_stock', 'out_of_stock', 'backorder', 'discontinued'])).optional(),
    compatibility: z.string().optional(), // model number
    difficulty: z.enum(['easy', 'medium', 'hard']).optional()
  }).default({}),
  options: z.object({
    limit: z.number().int().positive().max(100).default(20).optional(),
    offset: z.number().int().nonnegative().default(0).optional(),
    includeCompatibility: z.boolean().default(true).optional(),
    includeRelated: z.boolean().default(true).optional(),
    sortBy: z.enum(['relevance', 'price', 'rating', 'popularity']).default('relevance').optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc').optional()
  }).default({})
});

// Search result schemas
export const SearchResultSchema = z.object({
  product: z.custom<EnhancedProduct>(),
  score: z.number().min(0).max(1),
  relevanceFactors: z.object({
    textScore: z.number().min(0).max(1),
    vectorScore: z.number().min(0).max(1),
    popularityScore: z.number().min(0).max(1).optional(),
    compatibilityScore: z.number().min(0).max(1).optional(),
    priceScore: z.number().min(0).max(1).optional()
  }),
  explanation: z.string().optional()
});

export const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
  totalCount: z.number().int().nonnegative(),
  searchTime: z.number().positive(),
  query: SearchQuerySchema,
  retrievalMethod: z.enum(['hybrid', 'vector_only', 'sparse_only', 'fallback']),
  suggestions: z.array(z.string()).default([]),
  filters: z.object({
    availableBrands: z.array(z.string()).default([]),
    priceRange: z.object({
      min: z.number(),
      max: z.number()
    }).optional(),
    categories: z.array(z.string()).default([])
  }).optional()
});

// Vector embedding schemas
export const EmbeddingSchema = z.object({
  id: z.string(),
  vector: z.array(z.number()),
  metadata: z.object({
    productId: z.string(),
    field: z.enum(['name', 'description', 'keywords', 'symptoms', 'combined']),
    model: z.string(),
    timestamp: z.date().default(() => new Date())
  })
});

export const EmbeddingRequestSchema = z.object({
  text: z.string().min(1),
  model: z.enum(['text-embedding-3-small', 'text-embedding-3-large', 'local-embedding']).default('text-embedding-3-small'),
  dimensions: z.number().int().positive().optional()
});

// BM25/Sparse retrieval schemas
export const BM25ConfigSchema = z.object({
  k1: z.number().positive().default(1.2),
  b: z.number().min(0).max(1).default(0.75),
  epsilon: z.number().positive().default(0.25),
  tokenizer: z.enum(['simple', 'advanced', 'domain_specific']).default('advanced')
});

export const BM25ResultSchema = z.object({
  productId: z.string(),
  score: z.number().min(0),
  matchedTerms: z.array(z.string()),
  termFrequencies: z.record(z.string(), z.number())
});

// Hybrid retrieval configuration
export const HybridRetrievalConfigSchema = z.object({
  weights: z.object({
    vector: z.number().min(0).max(1).default(0.7),
    sparse: z.number().min(0).max(1).default(0.3),
    popularity: z.number().min(0).max(1).default(0.1),
    compatibility: z.number().min(0).max(1).default(0.2)
  }),
  stages: z.object({
    initialRecall: z.number().int().positive().default(100),
    reranking: z.number().int().positive().default(20),
    finalResults: z.number().int().positive().default(10)
  }),
  thresholds: z.object({
    minRelevanceScore: z.number().min(0).max(1).default(0.1),
    vectorSimilarity: z.number().min(0).max(1).default(0.5),
    sparseSimilarity: z.number().min(0).max(1).default(0.2)
  }),
  features: z.object({
    queryExpansion: z.boolean().default(true),
    semanticReranking: z.boolean().default(true),
    contextAwareness: z.boolean().default(true),
    personalization: z.boolean().default(false)
  })
});

// Performance monitoring schemas
export const RetrievalMetricSchema = z.object({
  queryId: z.string(),
  query: z.string(),
  method: z.enum(['hybrid', 'vector_only', 'sparse_only']),
  resultCount: z.number().int().nonnegative(),
  responseTime: z.number().positive(), // milliseconds
  relevanceScore: z.number().min(0).max(1).optional(),
  userFeedback: z.number().min(1).max(5).optional(), // 1-5 rating
  timestamp: z.date().default(() => new Date()),
  metadata: z.record(z.string(), z.any()).default({})
});

export const ABTestConfigSchema = z.object({
  testId: z.string(),
  name: z.string(),
  description: z.string(),
  variants: z.array(z.object({
    name: z.string(),
    config: HybridRetrievalConfigSchema,
    trafficPercentage: z.number().min(0).max(100)
  })),
  startDate: z.date(),
  endDate: z.date(),
  metrics: z.array(z.enum(['response_time', 'relevance_score', 'user_satisfaction', 'conversion_rate'])),
  status: z.enum(['draft', 'running', 'completed', 'paused']).default('draft')
});

// Query expansion schemas
export const QueryExpansionSchema = z.object({
  originalQuery: z.string(),
  expandedTerms: z.array(z.object({
    term: z.string(),
    weight: z.number().min(0).max(1),
    source: z.enum(['synonym', 'semantic', 'domain_specific', 'user_behavior'])
  })),
  expansionMethod: z.enum(['wordnet', 'embedding_similarity', 'co_occurrence', 'llm_generated', 'hybrid', 'none']),
  confidence: z.number().min(0).max(1)
});

// Context awareness schemas
export const SearchContextSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  previousQueries: z.array(z.string()).default([]).optional(),
  userPreferences: z.object({
    preferredBrands: z.array(z.string()).default([]),
    budgetRange: z.object({
      min: z.number().optional(),
      max: z.number().optional()
    }).optional(),
    skillLevel: z.enum(['beginner', 'intermediate', 'expert']).optional()
  }).optional(),
  appliance: z.object({
    type: z.enum(['refrigerator', 'dishwasher']).optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    age: z.number().int().positive().optional() // years
  }).optional(),
  location: z.object({
    country: z.string().optional(),
    region: z.string().optional(),
    timezone: z.string().optional()
  }).optional(),
  timestamp: z.date().default(() => new Date())
});

// Type exports
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type Embedding = z.infer<typeof EmbeddingSchema>;
export type EmbeddingRequest = z.infer<typeof EmbeddingRequestSchema>;
export type BM25Config = z.infer<typeof BM25ConfigSchema>;
export type BM25Result = z.infer<typeof BM25ResultSchema>;
export type HybridRetrievalConfig = z.infer<typeof HybridRetrievalConfigSchema>;
export type RetrievalMetric = z.infer<typeof RetrievalMetricSchema>;
export type ABTestConfig = z.infer<typeof ABTestConfigSchema>;
export type QueryExpansion = z.infer<typeof QueryExpansionSchema>;
export type SearchContext = z.infer<typeof SearchContextSchema>;