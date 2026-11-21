'use client';

import { FolderIcon, FolderOpenIcon, FileTextIcon } from '@phosphor-icons/react';
import { Tree, type TreeNode } from '@rectio/ui';
import { useState } from 'react';

const folder = <FolderIcon weight="bold" />;
const file = <FileTextIcon weight="bold" />;

const ITEMS: TreeNode[] = [
  {
    id: 'contracts',
    label: 'Contracts',
    icon: folder,
    meta: 3,
    children: [
      { id: 'nordlicht', label: 'Nordlicht GmbH, master agreement.pdf', icon: file },
      { id: 'kestrel', label: 'Kestrel Logistics, renewal 2026.pdf', icon: file },
      { id: 'halden', label: 'Halden Print Works, NDA.pdf', icon: file },
    ],
  },
  {
    id: 'statements',
    label: 'Bank statements',
    icon: <FolderOpenIcon weight="bold" />,
    meta: 2,
    children: [
      {
        id: 'q1',
        label: 'Q1 2026',
        icon: folder,
        children: [
          { id: 'jan', label: 'January.pdf', icon: file },
          { id: 'feb', label: 'February.pdf', icon: file },
          { id: 'mar', label: 'March.pdf', icon: file },
        ],
      },
      { id: 'q2', label: 'Q2 2026', icon: folder, hasChildren: true },
    ],
  },
  { id: 'archive', label: 'Archive 2019 to 2024', icon: folder, hasChildren: true },
  { id: 'policy', label: 'Expense policy.pdf', icon: file },
];

/** Children of the folders marked `hasChildren`, as if fetched from the server. */
function loadChildren(node: TreeNode): Promise<TreeNode[]> {
  const names =
    node.id === 'q2' ? ['April.pdf', 'May.pdf', 'June.pdf'] : ['2024', '2023', '2022', '2021'];
  return new Promise((done) => {
    setTimeout(() => {
      done(names.map((name) => ({ id: `${node.id}-${name}`, label: name, icon: file })));
    }, 800);
  });
}

/** A document library: folders open with the arrow keys, archived years load when opened. */
export default function TreeDemo() {
  const [selected, setSelected] = useState<string[]>(['feb']);

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <span id="tree-library" className="text-sm font-medium text-fg">
        Finance documents
      </span>
      <div className="rounded-panel border border-line bg-surface">
        <Tree
          aria-labelledby="tree-library"
          items={ITEMS}
          defaultExpanded={['statements', 'q1']}
          selected={selected}
          onSelectedChange={setSelected}
          loadChildren={loadChildren}
          className="h-72"
        />
      </div>
    </div>
  );
}
