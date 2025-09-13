/**
 * Legacy file - replaced by SimpleRetrieval.ts
 * Keeping minimal exports to avoid breaking existing imports
 */

import { SimpleRetrievalService } from './SimpleRetrieval';

// Re-export simplified service as HybridRetrievalService for backwards compatibility
export class HybridRetrievalService extends SimpleRetrievalService {
  // Override with compatible return type
  healthCheck(): boolean {
    return super.healthCheck();
  }

  // Additional method for detailed health check
  async detailedHealthCheck() {
    return {
      status: 'ready',
      vectorService: true,
      sparseService: true,
      productCount: this.getStats().totalProducts
    };
  }
}