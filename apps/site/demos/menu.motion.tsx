'use client';

import { MenuContent, MenuSubContent } from '@rectio/motion/navigation';
import {
  CopyIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import {
  Button,
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from '@rectio/ui';
import { useState } from 'react';

export default function MenuMotionDemo() {
  const [last, setLast] = useState<string | null>(null);
  const [showPaid, setShowPaid] = useState(true);
  const [sort, setSort] = useState('due');

  return (
    <div className="flex flex-col items-center gap-3">
      <Menu>
        <MenuTrigger render={<Button variant="secondary" />}>
          <DotsThreeIcon aria-hidden weight="bold" className="size-4" />
          Invoice 2041
        </MenuTrigger>
        <MenuContent>
          <MenuGroup label="Invoice">
            <MenuItem
              icon={<PencilSimpleIcon weight="bold" />}
              shortcut="mod+e"
              onClick={() => {
                setLast('Edit');
              }}
            >
              Edit
            </MenuItem>
            <MenuItem
              icon={<CopyIcon weight="bold" />}
              shortcut="mod+d"
              onClick={() => {
                setLast('Duplicate');
              }}
            >
              Duplicate
            </MenuItem>
            <MenuSub>
              <MenuSubTrigger icon={<DownloadSimpleIcon weight="bold" />}>Export</MenuSubTrigger>
              <MenuSubContent>
                <MenuItem
                  onClick={() => {
                    setLast('Export as PDF');
                  }}
                >
                  PDF
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setLast('Export as CSV');
                  }}
                >
                  CSV
                </MenuItem>
              </MenuSubContent>
            </MenuSub>
          </MenuGroup>
          <MenuSeparator />
          <MenuCheckboxItem checked={showPaid} onCheckedChange={setShowPaid}>
            Show paid lines
          </MenuCheckboxItem>
          <MenuSeparator />
          <MenuRadioGroup value={sort} onValueChange={setSort}>
            <MenuLabel>Sort lines by</MenuLabel>
            <MenuRadioItem value="due">Due date</MenuRadioItem>
            <MenuRadioItem value="amount">Amount</MenuRadioItem>
          </MenuRadioGroup>
          <MenuSeparator />
          <MenuItem
            tone="danger"
            icon={<TrashIcon weight="bold" />}
            onClick={() => {
              setLast('Delete draft');
            }}
          >
            Delete draft
          </MenuItem>
        </MenuContent>
      </Menu>
      <p className="text-sm text-fg-muted" aria-live="polite">
        {last === null ? 'No action chosen.' : `Chose: ${last}.`} Paid lines{' '}
        {showPaid ? 'shown' : 'hidden'}, sorted by {sort === 'due' ? 'due date' : 'amount'}.
      </p>
    </div>
  );
}
