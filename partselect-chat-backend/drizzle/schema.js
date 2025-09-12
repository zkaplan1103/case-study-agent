"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installationGuides = exports.compatibility = exports.products = exports.chatMessages = exports.chatSessions = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.chatSessions = (0, sqlite_core_1.sqliteTable)('chat_sessions', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    updatedAt: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
    userPreferences: (0, sqlite_core_1.text)('user_preferences'),
});
exports.chatMessages = (0, sqlite_core_1.sqliteTable)('chat_messages', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    sessionId: (0, sqlite_core_1.text)('session_id').references(() => exports.chatSessions.id),
    role: (0, sqlite_core_1.text)('role'),
    content: (0, sqlite_core_1.text)('content'),
    metadata: (0, sqlite_core_1.text)('metadata'),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
});
exports.products = (0, sqlite_core_1.sqliteTable)('products', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    partNumber: (0, sqlite_core_1.text)('part_number').unique(),
    name: (0, sqlite_core_1.text)('name'),
    description: (0, sqlite_core_1.text)('description'),
    category: (0, sqlite_core_1.text)('category'),
    brand: (0, sqlite_core_1.text)('brand'),
    price: (0, sqlite_core_1.real)('price'),
    imageUrl: (0, sqlite_core_1.text)('image_url'),
    availability: (0, sqlite_core_1.text)('availability'),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `CURRENT_TIMESTAMP`),
});
exports.compatibility = (0, sqlite_core_1.sqliteTable)('compatibility', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    productId: (0, sqlite_core_1.text)('product_id').references(() => exports.products.id),
    modelNumber: (0, sqlite_core_1.text)('model_number'),
    isCompatible: (0, sqlite_core_1.integer)('is_compatible', { mode: 'boolean' }),
    confidence: (0, sqlite_core_1.real)('confidence'),
});
exports.installationGuides = (0, sqlite_core_1.sqliteTable)('installation_guides', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    productId: (0, sqlite_core_1.text)('product_id').references(() => exports.products.id),
    steps: (0, sqlite_core_1.text)('steps'),
    toolsRequired: (0, sqlite_core_1.text)('tools_required'),
    difficulty: (0, sqlite_core_1.text)('difficulty'),
    estimatedTime: (0, sqlite_core_1.integer)('estimated_time'),
    safetyWarnings: (0, sqlite_core_1.text)('safety_warnings'),
});
//# sourceMappingURL=schema.js.map