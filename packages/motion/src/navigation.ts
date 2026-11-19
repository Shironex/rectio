/**
 * The motion add-on for navigation and overlays, a second entry point so the main one stays
 * within its size budget: an app that never imports it never loads its code.
 *
 *   import { MenuItem, Tabs, TabsTab } from '@rectio/ui';
 *   import { MenuContent, TabsList, TabsPanel } from '@rectio/motion/navigation';
 *
 * Each export has the same name and props as its plain twin. The command menu, tooltip, sheet and
 * sidebar have no motioned twin on purpose: the command menu and tooltips are used too often to
 * animate, and the sheet already moves with the finger.
 */
export { MotionPreferenceProvider, usePlainMotion, type MotionPreference } from './lib/mode';
export { MenuContent, MenuSubContent, type MenuContentProps } from './menu/menu';
export { PopoverContent, type PopoverContentProps } from './popover/popover';
export { HoverCardContent, type HoverCardContentProps } from './hover-card/hover-card';
export { TabsList, TabsPanel, type TabsListProps, type TabsPanelProps } from './tabs/tabs';
