/**
 * Example usage and integration of the DataProcessingService
 * This demonstrates how to use the enhanced data processing pipeline
 */

import { DataProcessingService } from '../services/DataProcessingService';
import { DeepSeekService } from '../services/DeepSeekService';
import { sampleProducts } from '../data/sampleProducts';
import { EnhancedProduct, CSVImportConfig, JSONImportConfig } from '../types/dataSchemas';

export class DataProcessingExample {
  private dataProcessingService: DataProcessingService;
  private deepSeekService: DeepSeekService;

  constructor() {
    this.deepSeekService = new DeepSeekService();
    this.dataProcessingService = new DataProcessingService(this.deepSeekService);
  }

  /**
   * Demonstrate processing existing sample data with enrichment
   */
  async enrichExistingSampleData(): Promise<EnhancedProduct[]> {
    console.log('🔄 Processing existing sample data with enrichment...');
    
    const enrichedProducts: EnhancedProduct[] = [];
    
    for (const product of sampleProducts) {
      try {
        console.log(`  📦 Processing: ${product.partNumber} - ${product.name}`);
        
        // Convert sample product to partial EnhancedProduct format
        const partialProduct = {
          id: product.id,
          partNumber: product.partNumber,
          name: product.name,
          description: product.description,
          category: product.category,
          brand: product.brand,
          price: product.price,
          imageUrl: product.imageUrl,
          availability: product.availability,
          compatibleModels: product.compatibleModels,
          symptoms: product.symptoms,
          toolsRequired: product.toolsRequired,
          installationDifficulty: product.installationDifficulty,
          installationTime: product.installationTime,
          warranty: product.warranty
        };

        // Enrich the product data
        const enrichedProduct = await this.dataProcessingService.enrichProductData(partialProduct);
        enrichedProducts.push(enrichedProduct);
        
        console.log(`  ✅ Enhanced with quality score: ${enrichedProduct.dataQuality?.score.toFixed(2)}`);
        
      } catch (error) {
        console.error(`  ❌ Error processing ${product.partNumber}:`, error);
      }
    }
    
    console.log(`✅ Successfully processed ${enrichedProducts.length} products`);
    return enrichedProducts;
  }

  /**
   * Demonstrate CSV import configuration
   */
  getCsvImportConfig(): CSVImportConfig {
    return {
      delimiter: ',',
      hasHeader: true,
      encoding: 'utf-8',
      skipEmptyLines: true,
      fieldMapping: {
        'part_number': 'partNumber',
        'part_name': 'name',
        'description': 'description',
        'category': 'category',
        'brand': 'brand',
        'price': 'price',
        'image_url': 'imageUrl',
        'stock_status': 'availability',
        'compatible_models': 'compatibleModels',
        'tools_required': 'toolsRequired',
        'difficulty': 'installationDifficulty',
        'install_time': 'installationTime'
      },
      validationRules: [
        {
          field: 'partNumber',
          rule: 'required',
          condition: '',
          severity: 'critical',
          message: 'Part number is required'
        },
        {
          field: 'name',
          rule: 'required',
          condition: '',
          severity: 'critical',
          message: 'Product name is required'
        },
        {
          field: 'price',
          rule: 'range',
          condition: '0,10000',
          severity: 'error',
          message: 'Price must be between 0 and 10000'
        },
        {
          field: 'partNumber',
          rule: 'format',
          condition: '^[A-Z0-9]{6,15}$',
          severity: 'warning',
          message: 'Part number should be 6-15 alphanumeric characters'
        }
      ]
    };
  }

  /**
   * Demonstrate JSON import configuration
   */
  getJsonImportConfig(): JSONImportConfig {
    return {
      rootPath: 'products',
      fieldMapping: {
        'id': 'id',
        'partNumber': 'partNumber',
        'name': 'name',
        'description': 'description',
        'category': 'category',
        'brand': 'brand',
        'price': 'price',
        'imageUrl': 'imageUrl',
        'availability': 'availability',
        'compatibleModels': 'compatibleModels',
        'symptoms': 'symptoms',
        'toolsRequired': 'toolsRequired',
        'installationDifficulty': 'installationDifficulty',
        'installationTime': 'installationTime',
        'warranty': 'warranty'
      },
      validationRules: [
        {
          field: 'partNumber',
          rule: 'required',
          condition: '',
          severity: 'critical',
          message: 'Part number is required'
        },
        {
          field: 'category',
          rule: 'format',
          condition: '^(refrigerator|dishwasher)$',
          severity: 'error',
          message: 'Category must be refrigerator or dishwasher'
        }
      ]
    };
  }

  /**
   * Create sample CSV data for testing
   */
  generateSampleCSV(): string {
    const headers = [
      'part_number',
      'part_name', 
      'description',
      'category',
      'brand',
      'price',
      'image_url',
      'stock_status',
      'compatible_models',
      'tools_required',
      'difficulty',
      'install_time'
    ].join(',');

    const rows = sampleProducts.map(product => [
      product.partNumber,
      `"${product.name}"`,
      `"${product.description}"`,
      product.category,
      product.brand,
      product.price,
      product.imageUrl || '',
      product.availability,
      product.compatibleModels.join(';'),
      product.toolsRequired.join(';'),
      product.installationDifficulty,
      product.installationTime
    ].join(',')).join('\n');

    return [headers, rows].join('\n');
  }

  /**
   * Create sample JSON data for testing
   */
  generateSampleJSON(): object {
    return {
      metadata: {
        source: 'PartSelect API',
        generated: new Date().toISOString(),
        version: '1.0'
      },
      products: sampleProducts
    };
  }

  /**
   * Demonstrate data quality monitoring
   */
  async monitorDataQuality(): Promise<void> {
    console.log('📊 Data Quality Monitoring Report');
    console.log('================================');

    const metrics = this.dataProcessingService.getQualityMetrics();
    const alerts = this.dataProcessingService.getQualityAlerts();
    const jobs = this.dataProcessingService.getProcessingJobs();

    console.log(`📈 Quality Metrics: ${metrics.length} recorded`);
    metrics.slice(-5).forEach(metric => {
      console.log(`  ${metric.metric}: ${metric.value.toFixed(3)} (${metric.status})`);
    });

    console.log(`🚨 Active Alerts: ${alerts.filter(a => !a.resolved).length}`);
    alerts.filter(a => !a.resolved).slice(-3).forEach(alert => {
      console.log(`  ${alert.severity.toUpperCase()}: ${alert.message}`);
    });

    console.log(`⚙️  Processing Jobs: ${jobs.length} total`);
    jobs.slice(-3).forEach(job => {
      const duration = job.endTime && job.startTime ? 
        (job.endTime.getTime() - job.startTime.getTime()) / 1000 : 'running';
      console.log(`  ${job.id}: ${job.status} (${duration}s, ${job.successfulRecords}/${job.processedRecords} success)`);
    });
  }

  /**
   * Demonstrate incremental processing
   */
  async demonstrateIncrementalProcessing(): Promise<void> {
    console.log('🔄 Demonstrating incremental processing...');

    // Create existing products map
    const existingProducts = new Map<string, EnhancedProduct>();
    const enrichedSample = await this.enrichExistingSampleData();
    
    enrichedSample.forEach(product => {
      existingProducts.set(product.partNumber, product);
    });

    // Simulate new/updated products
    const updatedProducts = [...enrichedSample];
    // Modify some products
    if (updatedProducts[0]) {
      updatedProducts[0].price = updatedProducts[0].price * 1.1; // Price increase
      updatedProducts[0].description = updatedProducts[0].description + ' Updated model.';
    }

    // Add a new product
    const newProduct = await this.dataProcessingService.enrichProductData({
      partNumber: 'NEW12345',
      name: 'Test New Product',
      category: 'refrigerator' as const,
      brand: 'Test Brand',
      price: 99.99,
      description: 'A new test product for demonstration'
    });
    updatedProducts.push(newProduct);

    // Process incremental update
    const result = await this.dataProcessingService.processIncrementalUpdate(
      updatedProducts,
      existingProducts
    );

    console.log(`✅ Incremental processing complete:`);
    console.log(`  📦 Added: ${result.added.length} products`);
    console.log(`  🔄 Updated: ${result.updated.length} products`);
    console.log(`  ⏹️  Unchanged: ${result.unchanged} products`);

    result.added.forEach(product => {
      console.log(`  + ${product.partNumber}: ${product.name}`);
    });

    result.updated.forEach(product => {
      console.log(`  ~ ${product.partNumber}: ${product.name}`);
    });
  }

  /**
   * Run all demonstrations
   */
  async runAllDemonstrations(): Promise<void> {
    console.log('🚀 Starting DataProcessingService demonstrations...\n');

    try {
      // 1. Enrich existing data
      await this.enrichExistingSampleData();
      console.log('');

      // 2. Show configurations
      console.log('⚙️  CSV Import Configuration:');
      console.log(JSON.stringify(this.getCsvImportConfig(), null, 2));
      console.log('');

      console.log('⚙️  JSON Import Configuration:');
      console.log(JSON.stringify(this.getJsonImportConfig(), null, 2));
      console.log('');

      // 3. Monitor data quality
      await this.monitorDataQuality();
      console.log('');

      // 4. Demonstrate incremental processing
      await this.demonstrateIncrementalProcessing();
      console.log('');

      console.log('✅ All demonstrations completed successfully!');

    } catch (error) {
      console.error('❌ Error during demonstrations:', error);
    }
  }
}

// Export a function to run the example
export async function runDataProcessingExample(): Promise<void> {
  const example = new DataProcessingExample();
  await example.runAllDemonstrations();
}