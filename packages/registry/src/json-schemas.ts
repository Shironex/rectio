import * as z from 'zod';

import { configSchema } from './config-schema.ts';
import { registryIndexSchema, registryItemSchema } from './schema.ts';

/** JSON Schemas published next to the registry JSON, for editors and third-party tooling. */
export function jsonSchemas(): { item: unknown; index: unknown; config: unknown } {
  return {
    item: z.toJSONSchema(registryItemSchema, { io: 'input' }),
    index: z.toJSONSchema(registryIndexSchema, { io: 'input' }),
    config: z.toJSONSchema(configSchema, { io: 'input' }),
  };
}
