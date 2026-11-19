import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';

import { Demo } from '@/demos';

import { ComponentSource } from './preview/component-source';
import { Preview } from './preview/preview';
import { ProBadge } from './pro-badge';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Preview,
    Demo,
    ComponentSource,
    TypeTable,
    Tabs,
    Tab,
    Steps,
    Step,
    ProBadge,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;
