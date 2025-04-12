# Recurrence Rules Schema

This project implements a plugin-based recurrence rule system based on [rrule.js](https://github.com/jakubroztocil/rrule) with schema versioning support. The system uses a plugin architecture to handle different versions of recurrence rules, making it easy to add new versions and maintain backward compatibility.

## Features

- Plugin-based architecture for version management
- Generation of recurring dates (daily, weekly, monthly, etc.)
- Timezone and local time adjustment
- Specific date exclusion
- Specific date replacement
- Time offset application
- Automatic version detection and processing

## Project Structure

- `index.ts`: Main entry point with plugin management and version dispatch
- `plugins/`: Directory containing version-specific implementations
  - `1.0.0/`: Version-specific plugin implementation
  - `1.0.1/`: Version-specific plugin implementation
- `example.ts`: Example usage of the recurrence system
- `schema-cli.ts`: CLI for managing the schema from the terminal
- `jest.config.js`: Jest configuration for testing
- `tsconfig.json`: TypeScript configuration
- `scripts/`: Directory containing utility scripts
  - `new-plugin.js`: Script for creating new plugin versions

## Installation

```bash
npm install
```

## Basic Usage

```typescript
import { processData } from './index';
import { datetime, RRule } from 'rrule';

const config = {
    freq: RRule.DAILY,
    interval: 2,
    dtstart: datetime(2025, 4, 1, 10, 0, 0),
    until: datetime(2025, 4, 30, 10, 0, 0),
    tzid: "America/Santiago",
    excludeDates: [
        datetime(2025, 4, 19, 10, 0, 0)
    ],
    keepLocalTime: true,
    targetTimezone: "America/Santiago",
    timeOffset: { hours: 2 },
    replaceDates: [
        {
            date: datetime(2025, 4, 13, 10, 0, 0),
            newDate: datetime(2025, 4, 13, 14, 20, 0)
        }
    ]
};

try {
    const recurrence = processData("1.0.1", config);
    recurrence.printAllDates();
} catch (error) {
    console.error(error);
}
```

## Plugin System

The project uses a plugin-based architecture to handle different versions of recurrence rules. Each version is implemented as a separate plugin in the `plugins` directory. The system automatically discovers and loads plugins at runtime.

### Plugin Structure

Each plugin version should be placed in its own directory under `plugins/` with the following structure:

```
plugins/
  └── 1.0.1/
      ├── CRRule.ts
      └── RecurrenceSchema.ts
```

### Adding a New Version

1. Create a new version using one of the following commands:
   ```bash
   npm run new-plugin:major  # For major version changes
   npm run new-plugin:minor  # For minor version changes
   npm run new-plugin:patch  # For patch version changes
   ```
   This will create a new directory under `plugins/` with the next version number and copy all files from the latest version.

2. Implement the version-specific logic in `CRRule.ts` and `RecurrenceSchema.ts`

## Version Management

The system automatically handles version management through the plugin system. To get all supported versions:

```typescript
import { getSupportedVersions } from './index';

const versions = getSupportedVersions();
console.log('Supported versions:', versions);
```

## Testing

Run the test suite:

```bash
npm test
```

For watch mode during development:

```bash
npm run test:watch
```

## Dependencies

- rrule: For recurrence rule generation
- luxon: For timezone handling
- ajv: For schema validation
- jest: For testing

## License

MIT