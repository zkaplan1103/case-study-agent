import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Chat Sessions
export const chatSessions = sqliteTable('chat_sessions', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  userPreferences: text('user_preferences'), // JSON string
});

// Chat Messages
export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => chatSessions.id),
  role: text('role'), // 'user' | 'assistant'
  content: text('content'),
  metadata: text('metadata'), // JSON string for rich content
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Products (for PartSelect parts)
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  partNumber: text('part_number').unique(),
  name: text('name'),
  description: text('description'),
  category: text('category'), // 'refrigerator' | 'dishwasher'
  brand: text('brand'),
  price: real('price'),
  imageUrl: text('image_url'),
  availability: text('availability'), // 'in_stock' | 'out_of_stock' | 'backorder'
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Compatibility (model to part relationships)
export const compatibility = sqliteTable('compatibility', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => products.id),
  modelNumber: text('model_number'),
  isCompatible: integer('is_compatible', { mode: 'boolean' }),
  confidence: real('confidence'), // 0.0 to 1.0
});

// Installation Guides
export const installationGuides = sqliteTable('installation_guides', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => products.id),
  steps: text('steps'), // JSON array of step objects
  toolsRequired: text('tools_required'), // JSON array
  difficulty: text('difficulty'), // 'easy' | 'medium' | 'hard'
  estimatedTime: integer('estimated_time'), // minutes
  safetyWarnings: text('safety_warnings'), // JSON array
});