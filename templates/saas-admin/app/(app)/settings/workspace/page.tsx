import type { Metadata } from 'next';

import { WorkspaceSettingsPage } from '@/components/settings/workspace-page';

export const metadata: Metadata = { title: 'Workspace settings' };

export default function Page() {
  return <WorkspaceSettingsPage />;
}
