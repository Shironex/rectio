import type { IMetaRule } from '@noctcore/harness';
import {
  createLockfileRegistryResolutionsRule,
  createOnlyBuiltDependenciesHaveScriptsRule,
  createSingleVersionDependenciesRule,
} from '@noctcore/harness/rules';

import { uiNoHardcodedDesignValues } from './rules/design-values.mts';
import { licenseMit } from './rules/license-mit.mts';

export const META_RULES: IMetaRule[] = [
  createLockfileRegistryResolutionsRule(),
  createSingleVersionDependenciesRule({
    packages: ['typescript', 'react', 'react-dom', '@base-ui/react', 'tailwindcss'],
  }),
  createOnlyBuiltDependenciesHaveScriptsRule(),
  uiNoHardcodedDesignValues,
  licenseMit,
];
