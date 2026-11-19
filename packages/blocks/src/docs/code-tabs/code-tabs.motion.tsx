import { motioned } from '../lib/motion-parts';
import {
  CodeTabs as PlainCodeTabs,
  InstallTabs as PlainInstallTabs,
  type CodeTabsProps,
  type InstallTabsProps,
} from './code-tabs';

export type { CodeTabsProps, InstallTabsProps };

/** CodeTabs whose indicator glides to the picked tab; it jumps under reduced motion. */
export const CodeTabs = motioned<CodeTabsProps>(PlainCodeTabs, 'CodeTabs');
/** InstallTabs whose indicator glides to the picked package manager. */
export const InstallTabs = motioned<InstallTabsProps>(PlainInstallTabs, 'InstallTabs');
