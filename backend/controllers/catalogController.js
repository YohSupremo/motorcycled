// Re-export Category and Brand controllers from their dedicated controller files
export * from "./categoryController.js";
export * from "./brandController.js";

import { seedCategoryDefaults } from "./categoryController.js";
import { seedBrandDefaults } from "./brandController.js";

// Combined seed helper for startup
export const seedCatalogDefaults = async () => {
  await seedCategoryDefaults();
  await seedBrandDefaults();
};
