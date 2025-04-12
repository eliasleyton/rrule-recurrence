// implement dispatch for diferents version of recurrence rule
import { datetime, RRule } from 'rrule';
import * as fs from 'fs';
import * as path from 'path';

// Plugin interface
interface RecurrencePlugin {
  version: string;
  processor: (config: any) => any;
}

// Version registry type definition
type VersionRegistry = {
  [version: string]: {
    processor: (config: any) => any;
  };
};

// Plugin registry
const plugins: RecurrencePlugin[] = [];

// Auto-discover and register plugins
function registerPlugins(): void {
  const pluginsDir = path.join(__dirname, 'plugins');
  
  if (!fs.existsSync(pluginsDir)) {
    console.warn('Plugins directory not found');
    return;
  }

  const versionDirs = fs.readdirSync(pluginsDir)
    .filter(dir => /^\d+\.\d+\.\d+$/.test(dir))
    .sort((a, b) => {
      const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
      const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
      return aMajor - bMajor || aMinor - bMinor || aPatch - bPatch;
    });

  for (const version of versionDirs) {
    try {
      // Import the module synchronously
      const module = require(`./plugins/${version}/CRRule`);
      plugins.push({
        version,
        processor: (config: any) => new module.CustomRecurrenceRule(config)
      });
    } catch (error) {
      console.warn(`Failed to load plugin version ${version}:`, error);
    }
  }
}

// Initialize version registry
let versionRegistry: VersionRegistry = {};

// Load plugins synchronously
registerPlugins();
versionRegistry = plugins.reduce((acc, plugin) => {
  acc[plugin.version] = {
    processor: plugin.processor
  };
  return acc;
}, {} as VersionRegistry);

/**
 * Processes data based on schema version
 * @param schemaVersion The version of the schema to use
 * @param config The configuration object
 * @returns Processed data according to the specified version
 * @throws Error if version is not supported
 */
export function processData(schemaVersion: string, config: any) {
  // Check if version exists in registry
  if (!versionRegistry[schemaVersion]) {
    throw new Error(`Unsupported schema version: ${schemaVersion}`);
  }

  // Process the data
  return versionRegistry[schemaVersion].processor(config);
}

/**
 * Gets all supported versions
 * @returns Array of supported version strings
 */
export function getSupportedVersions(): string[] {
  return Object.keys(versionRegistry).sort();
}

export { datetime, RRule };

