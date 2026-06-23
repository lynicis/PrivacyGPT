# Design: Add Cursor, Trae, Windsurf, and Devin

We will add Cursor, Trae, Windsurf, and Devin to the PrivacyGPT database. These entries represent AI-native IDEs and agents. None of these providers exist in the database yet.

## Scope

- Update `src/lib/db/seedData.json` with the new records.
- Ensure they map to the correct scoring models.
- Run the seed script to update `privacy.db`.
- Validate all schema and scoring tests.

## Data Details

### Cursor (Anysphere)

- **Company Key:** anysphere
- **Company Name:** Anysphere
- **Product Name:** Cursor
- **Opt-Out:** Available via Privacy Mode toggle.
- **Retention:** Zero data retention with upstream model providers when Privacy Mode is active.

### Trae (ByteDance)

- **Company Key:** bytedance
- **Company Name:** ByteDance
- **Product Name:** Trae
- **Opt-Out:** Available via Privacy Mode toggle in IDE settings.
- **Retention:** Stops training when Privacy Mode is active.

### Windsurf (Codeium)

- **Company Key:** codeium
- **Company Name:** Codeium
- **Product Name:** Windsurf
- **Opt-Out:** Zero Data Retention is active by default. Telemetry options can be configured in settings.
- **Retention:** Text files are not stored in plaintext on servers.

### Devin (Cognition)

- **Company Key:** cognition
- **Company Name:** Cognition
- **Product Name:** Devin
- **Opt-Out:** Data training is off by default.
- **Retention:** Keeps data for the duration of the business relationship.

## Verification

We will verify changes by running tests with `bun run test` and validating that the list length increases to 39 (35 existing + 4 new).
