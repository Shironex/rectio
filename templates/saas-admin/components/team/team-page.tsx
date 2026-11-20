'use client';

import { CheckIcon, MinusIcon } from '@phosphor-icons/react';
import { BlockPanel, ROLES, ROLE_HINTS, ROLE_LABELS, type PendingInvite } from '@rectio/blocks';
import { TeamMembers } from '@rectio/blocks/motion';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  useToast,
} from '@rectio/ui';
import { useState } from 'react';

import { AGENTS, CURRENT_ROLE, INVITES, PERMISSIONS, SEATS, type Agent } from '@/data/team';
import { LOCALE, NOW, addDays, plural } from '@/data/workspace';
import { PageHeader } from '../page-header';
import { ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';

/** What each role may do, so a role change is never a guess. */
function RolesTable() {
  return (
    <BlockPanel
      title="Roles"
      description="Owners also manage billing and can delete the workspace"
      bodyClassName="px-0 pb-0"
    >
      <div className="overflow-x-auto">
        <Table>
          <TableCaption className="sr-only">What each role can do</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-5">Permission</TableHead>
              {ROLES.map((role) => (
                <TableHead key={role} align="center">
                  <abbr title={ROLE_HINTS[role]} className="no-underline">
                    {ROLE_LABELS[role]}
                  </abbr>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSIONS.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="ps-5">{p.label}</TableCell>
                {ROLES.map((role) => (
                  <TableCell key={role} align="center">
                    {p.roles[role] ? (
                      <CheckIcon
                        weight="bold"
                        className="inline size-4 text-positive-strong"
                        aria-label="Yes"
                      />
                    ) : (
                      <MinusIcon className="inline size-4 text-fg-subtle" aria-label="No" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </BlockPanel>
  );
}

export function TeamPage() {
  const state = usePageState();
  const toast = useToast();
  const [members, setMembers] = useState<readonly Agent[]>(AGENTS);
  const [invites, setInvites] = useState<readonly PendingInvite[]>(INVITES);
  const shownMembers = state === 'empty' ? members.filter((m) => m.you === true) : members;
  const shownInvites = state === 'empty' ? [] : invites;
  const taken = shownMembers.length + shownInvites.length;

  return (
    <>
      <PageHeader
        title="Team and roles"
        description={`${plural(shownMembers.length, 'member')}, ${String(SEATS - taken)} of ${String(SEATS)} seats free`}
      />
      {state === 'loading' ? (
        <LoadingRegion label="Loading the team">
          <LoadingPanel kind="list" rows={7} toolbar />
          <LoadingPanel kind="table" rows={5} columns={4} />
        </LoadingRegion>
      ) : state === 'error' ? (
        <ErrorPanel title="The team did not load" />
      ) : (
        <>
          <div id="invite" className="scroll-mt-24">
            <TeamMembers
              title="Members"
              members={shownMembers}
              invites={shownInvites}
              currentRole={CURRENT_ROLE}
              seats={SEATS}
              now={NOW}
              locale={LOCALE}
              onInvite={(emails, role) => {
                setInvites((list) => [
                  ...list,
                  ...emails.map((email, i) => ({
                    id: `inv-${String(list.length + i + 1)}`,
                    email,
                    role,
                    invitedAt: new Date(),
                    expiresAt: addDays(new Date(), 7),
                  })),
                ]);
                toast.add({
                  type: 'success',
                  title: `${plural(emails.length, 'invite')} sent`,
                  description: emails.join(', '),
                });
              }}
              onChangeRole={(id, role) => {
                setMembers((list) => list.map((m) => (m.id === id ? { ...m, role } : m)));
              }}
              onRemove={(id) => {
                setMembers((list) => list.filter((m) => m.id !== id));
              }}
              onResendInvite={(id) => {
                const invite = invites.find((i) => i.id === id);
                toast.add({ title: 'Invite sent again', description: invite?.email ?? '' });
              }}
              onRevokeInvite={(id) => {
                setInvites((list) => list.filter((i) => i.id !== id));
              }}
            />
          </div>
          <RolesTable />
        </>
      )}
    </>
  );
}
