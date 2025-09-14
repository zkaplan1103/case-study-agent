import { SearchService } from './services/SearchService';
import { CompatibilityTool } from './tools/CompatibilityTool';
import { InstallationTool } from './tools/InstallationTool';
import { ProductSearchTool } from './tools/ProductSearchTool';
import { TroubleshootingTool } from './tools/TroubleshootingTool';

async function runTests() {
    console.log("---------------------------------------");
    console.log("Running Backend Tool Tests");
    console.log("---------------------------------------");

    const searchService = new SearchService();
    const compatibilityTool = new CompatibilityTool(searchService);
    const installationTool = new InstallationTool(searchService);
    const productSearchTool = new ProductSearchTool(searchService);
    const troubleshootingTool = new TroubleshootingTool(searchService);

    // Test Case 1: Product Search
    console.log("\n--- Testing ProductSearchTool ---");
    let searchResult = await productSearchTool.execute({ query: "control board for dishwasher" });
    console.log("Search Result:", JSON.stringify(searchResult, null, 2));

    searchResult = await productSearchTool.execute({ partNumber: "PS11752778" });
    console.log("\nSearch by Part Number Result:", JSON.stringify(searchResult, null, 2));


    // Test Case 2: Compatibility Check
    console.log("\n--- Testing CompatibilityTool ---");
    let compatibilityResult = await compatibilityTool.execute({ partNumber: "PS11752778", modelNumber: "KUDE48FXSS" });
    console.log("Compatible Part Result:", JSON.stringify(compatibilityResult, null, 2));

    compatibilityResult = await compatibilityTool.execute({ partNumber: "W10326462", modelNumber: "WDT780SAEM1" });
    console.log("\nIncompatible Part Result:", JSON.stringify(compatibilityResult, null, 2));


    // Test Case 3: Installation Guide
    console.log("\n--- Testing InstallationTool ---");
    let installationResult = await installationTool.execute({ partNumber: "PS11752778" });
    console.log("Installation Guide Result:", JSON.stringify(installationResult, null, 2));

    installationResult = await installationTool.execute({ partNumber: "NON_EXISTENT_PART" });
    console.log("\nNon-Existent Part Installation Result:", JSON.stringify(installationResult, null, 2));


    // Test Case 4: Troubleshooting
    console.log("\n--- Testing TroubleshootingTool ---");
    let troubleshootingResult = await troubleshootingTool.execute({ symptom: "ice maker not working", category: "refrigerator" });
    console.log("Troubleshooting Result:", JSON.stringify(troubleshootingResult, null, 2));

    troubleshootingResult = await troubleshootingTool.execute({ symptom: "door won't close", category: "dishwasher" });
    console.log("\nTroubleshooting Result 2:", JSON.stringify(troubleshootingResult, null, 2));
}

runTests();