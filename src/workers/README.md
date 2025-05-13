# Temporal Worker Structure

## Directories
- `workflows/` — workflow definitions
- `activities/` — activity implementations
- `index.ts` — worker entry point (dynamically registers everything from workflows and activities)
- `types.ts` — (optional) worker-specific types

## Local Run

```bash
npm install
npx ts-node src/workers/index.ts
```

## Example Structure

```
src/workers/
  workflows/
    exampleWorkflow.ts
  activities/
    exampleActivity.ts
  index.ts
  types.ts
  README.md
``` 