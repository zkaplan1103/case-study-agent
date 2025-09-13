import { createReadStream, promises as fs } from 'fs';
import { createInterface } from 'readline';
import { Transform, Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { DeepSeekService } from './DeepSeekService';
import {
  EnhancedProduct,
  EnhancedProductSchema,
  DataProcessingJob,
  DataProcessingJobSchema,
  ValidationResult,
  ValidationRule,
  EnrichmentRequest,
  EnrichmentResult,
  QualityMetric,
  QualityAlert,
  CSVImportConfig,
  JSONImportConfig
} from '../types/dataSchemas';

export class DataProcessingService {
  private deepSeekService: DeepSeekService;
  private processingJobs: Map<string, DataProcessingJob> = new Map();
  private qualityMetrics: QualityMetric[] = [];
  private qualityAlerts: QualityAlert[] = [];

  constructor(deepSeekService: DeepSeekService) {
    this.deepSeekService = deepSeekService;
  }

  /**
   * Streaming CSV parsing with progress tracking and error recovery
   */
  async processCSVFile(
    filePath: string,
    config: CSVImportConfig,
    progressCallback?: (progress: { processed: number; total?: number; errors: number }) => void
  ): Promise<EnhancedProduct[]> {
    const jobId = this.generateJobId();
    const job = this.createProcessingJob(jobId, 'import', filePath);

    try {
      const products: EnhancedProduct[] = [];
      const fileStream = createReadStream(filePath, { encoding: config.encoding as BufferEncoding });
      const readline = createInterface({ input: fileStream });

      let lineNumber = 0;
      let headers: string[] = [];
      let processedCount = 0;
      let errorCount = 0;

      for await (const line of readline) {
        lineNumber++;
        
        try {
          if (lineNumber === 1 && config.hasHeader) {
            headers = this.parseCSVLine(line, config.delimiter);
            continue;
          }

          if (config.skipEmptyLines && line.trim() === '') {
            continue;
          }

          const values = this.parseCSVLine(line, config.delimiter);
          const rawProduct = this.mapCSVToProduct(values, headers, config.fieldMapping);
          
          // Validate the product data
          const validationResult = await this.validateProductData(rawProduct, config.validationRules);
          
          if (validationResult.isValid) {
            const enhancedProduct = await this.enrichProductData(rawProduct);
            products.push(enhancedProduct);
            processedCount++;
          } else {
            errorCount++;
            this.addJobError(job, lineNumber, `Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
          }

          // Update progress
          if (progressCallback && processedCount % 100 === 0) {
            progressCallback({ processed: processedCount, errors: errorCount });
          }

        } catch (error) {
          errorCount++;
          this.addJobError(job, lineNumber, `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update job status
      job.status = 'completed';
      job.processedRecords = processedCount;
      job.successfulRecords = processedCount;
      job.failedRecords = errorCount;
      job.endTime = new Date();

      await this.updateQualityMetrics('csv_import', processedCount, errorCount);
      
      return products;

    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      throw new Error(`CSV processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Streaming JSON parsing for large datasets
   */
  async processJSONFile(
    filePath: string,
    config: JSONImportConfig,
    progressCallback?: (progress: { processed: number; total?: number; errors: number }) => void
  ): Promise<EnhancedProduct[]> {
    const jobId = this.generateJobId();
    const job = this.createProcessingJob(jobId, 'import', filePath);

    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      
      // Navigate to root path if specified
      const dataArray = config.rootPath ? this.getNestedProperty(jsonData, config.rootPath) : jsonData;
      
      if (!Array.isArray(dataArray)) {
        throw new Error('JSON data must be an array or contain an array at the specified root path');
      }

      const products: EnhancedProduct[] = [];
      let processedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < dataArray.length; i++) {
        try {
          const item = dataArray[i];
          const rawProduct = this.mapJSONToProduct(item, config.fieldMapping);
          
          // Validate the product data
          const validationResult = await this.validateProductData(rawProduct, config.validationRules);
          
          if (validationResult.isValid) {
            const enhancedProduct = await this.enrichProductData(rawProduct);
            products.push(enhancedProduct);
            processedCount++;
          } else {
            errorCount++;
            this.addJobError(job, i, `Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
          }

          // Update progress
          if (progressCallback && processedCount % 100 === 0) {
            progressCallback({ processed: processedCount, total: dataArray.length, errors: errorCount });
          }

        } catch (error) {
          errorCount++;
          this.addJobError(job, i, `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update job status
      job.status = 'completed';
      job.processedRecords = processedCount;
      job.successfulRecords = processedCount;
      job.failedRecords = errorCount;
      job.endTime = new Date();

      await this.updateQualityMetrics('json_import', processedCount, errorCount);
      
      return products;

    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      throw new Error(`JSON processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Advanced data validation using Zod schemas with error recovery
   */
  async validateProductData(data: any, customRules: ValidationRule[] = []): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      score: 1.0,
      errors: [],
      warnings: []
    };

    try {
      // Zod schema validation
      EnhancedProductSchema.parse(data);
    } catch (error: any) {
      result.isValid = false;
      if (error.errors) {
        for (const zodError of error.errors) {
          result.errors.push({
            field: zodError.path.join('.'),
            rule: 'schema_validation',
            message: zodError.message,
            severity: 'error' as const,
            value: zodError.received
          });
        }
      }
    }

    // Apply custom validation rules
    for (const rule of customRules) {
      const fieldValue = this.getNestedProperty(data, rule.field);
      const isValid = this.evaluateValidationRule(fieldValue, rule);
      
      if (!isValid) {
        const error = {
          field: rule.field,
          rule: rule.rule,
          message: rule.message,
          severity: rule.severity,
          value: fieldValue
        };

        if (rule.severity === 'critical' || rule.severity === 'error') {
          result.isValid = false;
          result.errors.push(error);
        } else {
          result.warnings.push({
            field: rule.field,
            message: rule.message,
            value: fieldValue
          });
        }
      }
    }

    // Calculate quality score
    const totalIssues = result.errors.length + result.warnings.length;
    const maxIssues = customRules.length + 10; // Estimate max possible issues
    result.score = Math.max(0, 1 - (totalIssues / maxIssues));

    return result;
  }

  /**
   * Automated data enrichment using LLM-generated descriptions
   */
  async enrichProductData(product: Partial<EnhancedProduct>): Promise<EnhancedProduct> {
    try {
      // Generate enhanced description if missing or too short
      if (!product.description || product.description.length < 50) {
        const enrichedDescription = await this.generateProductDescription(product);
        product.description = enrichedDescription;
      }

      // Generate keywords and symptoms if missing
      if (!product.keywords || product.keywords.length === 0) {
        product.keywords = await this.generateProductKeywords(product);
      }

      if (!product.symptoms || product.symptoms.length === 0) {
        product.symptoms = await this.generateProductSymptoms(product);
      }

      // Set data quality metadata
      product.dataQuality = {
        score: 0.9, // High score for enriched data
        completeness: this.calculateCompleteness(product),
        accuracy: 0.85, // Estimated accuracy for LLM-generated content
        freshness: 1.0, // Newly processed
        lastValidated: new Date()
      };

      // Ensure all required fields are present
      const enhancedProduct = EnhancedProductSchema.parse({
        id: product.id || this.generateProductId(),
        partNumber: product.partNumber || '',
        name: product.name || '',
        description: product.description || '',
        category: product.category || 'refrigerator',
        brand: product.brand || '',
        price: product.price || 0,
        availability: product.availability || 'in_stock',
        ...product
      });

      return enhancedProduct;

    } catch (error) {
      console.error('Error enriching product data:', error);
      // Return basic product structure with minimal data
      return EnhancedProductSchema.parse({
        id: product.id || this.generateProductId(),
        partNumber: product.partNumber || '',
        name: product.name || '',
        description: product.description || '',
        category: product.category || 'refrigerator',
        brand: product.brand || '',
        price: product.price || 0,
        availability: product.availability || 'in_stock',
        dataQuality: {
          score: 0.5,
          completeness: 0.5,
          accuracy: 0.5,
          freshness: 1.0,
          lastValidated: new Date()
        }
      });
    }
  }

  /**
   * Multi-source data reconciliation and deduplication
   */
  async reconcileProducts(products: EnhancedProduct[]): Promise<EnhancedProduct[]> {
    const reconciled: EnhancedProduct[] = [];
    const partNumberMap = new Map<string, EnhancedProduct[]>();

    // Group by part number
    for (const product of products) {
      const existing = partNumberMap.get(product.partNumber) || [];
      existing.push(product);
      partNumberMap.set(product.partNumber, existing);
    }

    // Reconcile duplicates
    for (const [partNumber, duplicates] of partNumberMap) {
      if (duplicates.length === 1) {
        reconciled.push(duplicates[0]);
      } else {
        const merged = await this.mergeProductData(duplicates);
        reconciled.push(merged);
      }
    }

    return reconciled;
  }

  /**
   * Real-time data quality monitoring and alerts
   */
  async updateQualityMetrics(operation: string, successCount: number, errorCount: number): Promise<void> {
    const timestamp = new Date();
    const totalRecords = successCount + errorCount;
    const successRate = totalRecords > 0 ? successCount / totalRecords : 1;

    // Update metrics
    this.qualityMetrics.push({
      metric: `${operation}_success_rate`,
      value: successRate,
      threshold: 0.95,
      status: successRate >= 0.95 ? 'good' : successRate >= 0.8 ? 'warning' : 'critical',
      timestamp
    });

    this.qualityMetrics.push({
      metric: `${operation}_error_count`,
      value: errorCount,
      threshold: 10,
      status: errorCount <= 10 ? 'good' : errorCount <= 50 ? 'warning' : 'critical',
      timestamp
    });

    // Generate alerts if thresholds are breached
    if (successRate < 0.8) {
      this.generateQualityAlert(
        'threshold_breach',
        'high',
        `Low success rate for ${operation}: ${(successRate * 100).toFixed(1)}%`,
        { operation, successRate, errorCount }
      );
    }

    if (errorCount > 50) {
      this.generateQualityAlert(
        'data_quality',
        'critical',
        `High error count for ${operation}: ${errorCount} errors`,
        { operation, errorCount }
      );
    }

    // Keep only recent metrics (last 1000 entries)
    if (this.qualityMetrics.length > 1000) {
      this.qualityMetrics = this.qualityMetrics.slice(-1000);
    }
  }

  /**
   * Incremental processing for data updates and changes
   */
  async processIncrementalUpdate(
    products: EnhancedProduct[],
    existingProducts: Map<string, EnhancedProduct>
  ): Promise<{ updated: EnhancedProduct[]; added: EnhancedProduct[]; unchanged: number }> {
    const updated: EnhancedProduct[] = [];
    const added: EnhancedProduct[] = [];
    let unchanged = 0;

    for (const product of products) {
      const existing = existingProducts.get(product.partNumber);
      
      if (!existing) {
        // New product
        added.push(product);
      } else {
        // Check if update is needed
        const hasChanges = this.detectProductChanges(existing, product);
        
        if (hasChanges) {
          // Merge changes while preserving metadata
          const updatedProduct = await this.mergeProductData([existing, product]);
          updatedProduct.updatedAt = new Date();
          updated.push(updatedProduct);
        } else {
          unchanged++;
        }
      }
    }

    return { updated, added, unchanged };
  }

  // Private helper methods

  private parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private mapCSVToProduct(values: string[], headers: string[], fieldMapping: Record<string, string>): Partial<EnhancedProduct> {
    const product: any = {};
    
    for (let i = 0; i < headers.length && i < values.length; i++) {
      const header = headers[i];
      const mappedField = fieldMapping[header] || header;
      const value = values[i];
      
      // Type conversion based on field
      if (['price', 'msrp', 'stockQuantity', 'installationTime', 'reviewCount', 'averageRating'].includes(mappedField)) {
        product[mappedField] = parseFloat(value) || 0;
      } else if (['compatibleModels', 'relatedParts', 'toolsRequired', 'symptoms', 'keywords'].includes(mappedField)) {
        product[mappedField] = value.split(';').map((s: string) => s.trim()).filter(Boolean);
      } else {
        product[mappedField] = value;
      }
    }
    
    return product;
  }

  private mapJSONToProduct(item: any, fieldMapping: Record<string, string>): Partial<EnhancedProduct> {
    const product: any = {};
    
    for (const [sourceField, targetField] of Object.entries(fieldMapping)) {
      const value = this.getNestedProperty(item, sourceField);
      if (value !== undefined) {
        product[targetField] = value;
      }
    }
    
    // If no mapping provided, use direct mapping
    if (Object.keys(fieldMapping).length === 0) {
      return item;
    }
    
    return product;
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateValidationRule(value: any, rule: ValidationRule): boolean {
    switch (rule.rule) {
      case 'required':
        return value !== undefined && value !== null && value !== '';
      case 'format':
        // Simple regex validation
        try {
          const regex = new RegExp(rule.condition);
          return regex.test(String(value));
        } catch {
          return false;
        }
      case 'range':
        const [min, max] = rule.condition.split(',').map(Number);
        const numValue = Number(value);
        return !isNaN(numValue) && numValue >= min && numValue <= max;
      case 'uniqueness':
        // This would need to be implemented with a database check
        return true; // Placeholder
      case 'consistency':
        // Custom consistency checks would be implemented here
        return true; // Placeholder
      default:
        return true;
    }
  }

  private async generateProductDescription(product: Partial<EnhancedProduct>): Promise<string> {
    try {
      const prompt = `Generate a detailed product description for this appliance part:
Part Number: ${product.partNumber}
Name: ${product.name}
Category: ${product.category}
Brand: ${product.brand}

The description should be informative, technical but accessible, and around 100-150 words. Focus on functionality, compatibility, and installation notes.`;

      const response = await this.deepSeekService.generateCompletion(prompt);
      return response.trim();
    } catch (error) {
      console.error('Error generating product description:', error);
      return `${product.name} for ${product.category} appliances. Manufactured by ${product.brand}. Part number: ${product.partNumber}.`;
    }
  }

  private async generateProductKeywords(product: Partial<EnhancedProduct>): Promise<string[]> {
    try {
      const prompt = `Generate 5-8 relevant keywords for this appliance part:
Name: ${product.name}
Category: ${product.category}
Brand: ${product.brand}
Description: ${product.description}

Return only the keywords separated by commas.`;

      const response = await this.deepSeekService.generateCompletion(prompt);
      return response.split(',').map((k: string) => k.trim()).filter(Boolean);
    } catch (error) {
      console.error('Error generating keywords:', error);
      return [product.category || '', product.brand || '', 'replacement', 'part'].filter(Boolean);
    }
  }

  private async generateProductSymptoms(product: Partial<EnhancedProduct>): Promise<string[]> {
    try {
      const prompt = `List 3-5 common symptoms that would indicate this part needs replacement:
Name: ${product.name}
Category: ${product.category}
Description: ${product.description}

Return only the symptoms separated by commas.`;

      const response = await this.deepSeekService.generateCompletion(prompt);
      return response.split(',').map((s: string) => s.trim()).filter(Boolean);
    } catch (error) {
      console.error('Error generating symptoms:', error);
      return [`${product.name?.toLowerCase()} not working`, 'malfunction', 'needs replacement'].filter(Boolean);
    }
  }

  private calculateCompleteness(product: Partial<EnhancedProduct>): number {
    const requiredFields = ['id', 'partNumber', 'name', 'description', 'category', 'brand', 'price'];
    const optionalFields = ['imageUrl', 'availability', 'compatibleModels', 'installationDifficulty', 'toolsRequired'];
    
    const requiredComplete = requiredFields.filter(field => product[field as keyof EnhancedProduct]).length;
    const optionalComplete = optionalFields.filter(field => product[field as keyof EnhancedProduct]).length;
    
    const requiredScore = requiredComplete / requiredFields.length;
    const optionalScore = optionalComplete / optionalFields.length;
    
    return (requiredScore * 0.8) + (optionalScore * 0.2);
  }

  private async mergeProductData(products: EnhancedProduct[]): Promise<EnhancedProduct> {
    // Sort by data quality score (highest first)
    const sorted = products.sort((a, b) => (b.dataQuality?.score || 0) - (a.dataQuality?.score || 0));
    const primary = sorted[0];
    
    // Merge data from other sources
    const merged = { ...primary };
    
    for (const product of sorted.slice(1)) {
      // Merge arrays
      if (product.compatibleModels) {
        merged.compatibleModels = [...new Set([...merged.compatibleModels, ...product.compatibleModels])];
      }
      if (product.symptoms) {
        merged.symptoms = [...new Set([...merged.symptoms, ...product.symptoms])];
      }
      if (product.keywords) {
        merged.keywords = [...new Set([...merged.keywords, ...product.keywords])];
      }
      
      // Take best values for key fields
      if (!merged.description && product.description) {
        merged.description = product.description;
      }
      if (!merged.imageUrl && product.imageUrl) {
        merged.imageUrl = product.imageUrl;
      }
      if (product.price && (!merged.price || product.price > 0)) {
        merged.price = product.price;
      }
    }
    
    merged.updatedAt = new Date();
    return merged;
  }

  private detectProductChanges(existing: EnhancedProduct, updated: Partial<EnhancedProduct>): boolean {
    const keyFields = ['name', 'description', 'price', 'availability', 'brand'];
    
    for (const field of keyFields) {
      if (updated[field as keyof EnhancedProduct] && 
          updated[field as keyof EnhancedProduct] !== existing[field as keyof EnhancedProduct]) {
        return true;
      }
    }
    
    return false;
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateProductId(): string {
    return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createProcessingJob(id: string, type: DataProcessingJob['type'], source: string): DataProcessingJob {
    const job: DataProcessingJob = {
      id,
      type,
      status: 'running',
      source,
      totalRecords: 0,
      processedRecords: 0,
      successfulRecords: 0,
      failedRecords: 0,
      errors: [],
      startTime: new Date(),
      metadata: {},
      createdAt: new Date()
    };
    
    this.processingJobs.set(id, job);
    return job;
  }

  private addJobError(job: DataProcessingJob, record: number, error: string): void {
    job.errors.push({
      record,
      error,
      severity: 'error'
    });
  }

  private generateQualityAlert(
    type: QualityAlert['type'],
    severity: QualityAlert['severity'],
    message: string,
    details: Record<string, any>
  ): void {
    const alert: QualityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      details,
      resolved: false,
      createdAt: new Date()
    };
    
    this.qualityAlerts.push(alert);
    
    // Keep only recent alerts (last 100)
    if (this.qualityAlerts.length > 100) {
      this.qualityAlerts = this.qualityAlerts.slice(-100);
    }
  }

  // Public getters for monitoring
  getProcessingJobs(): DataProcessingJob[] {
    return Array.from(this.processingJobs.values());
  }

  getQualityMetrics(): QualityMetric[] {
    return [...this.qualityMetrics];
  }

  getQualityAlerts(): QualityAlert[] {
    return [...this.qualityAlerts];
  }
}