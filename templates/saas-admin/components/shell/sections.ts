/** The app's sections by first path segment: the breadcrumb and the command menu name them. */
export const SECTIONS: Record<string, string> = {
  tickets: 'Tickets',
  customers: 'Customers',
  team: 'Team',
  files: 'Files',
  notifications: 'Notifications',
  billing: 'Billing',
  developers: 'Developers',
  settings: 'Settings',
  'whats-new': 'What’s new',
};

/** The settings pages, in the order the settings nav lists them. */
export const SETTINGS_SECTIONS = [
  { href: '/settings', label: 'Profile', description: 'Your name, email and time zone' },
  {
    href: '/settings/workspace',
    label: 'Workspace',
    description: 'Name, help center address and hours',
  },
  {
    href: '/settings/security',
    label: 'Security',
    description: 'Password, two-factor and devices',
  },
  {
    href: '/settings/notifications',
    label: 'Notifications',
    description: 'What reaches you, and where',
  },
] as const;
