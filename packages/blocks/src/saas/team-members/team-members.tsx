import {
  ArrowClockwiseIcon,
  EnvelopeSimpleIcon,
  PaperPlaneTiltIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersThreeIcon,
  XIcon,
} from '@phosphor-icons/react';
import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  cn,
} from '@rectio/ui';
import { useId, useRef, useState, type SyntheticEvent } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { resolveLocale } from '../../lib/finance';
import { ActionMenu } from '../lib/action-menu';
import { Avatar } from '../lib/avatar';
import { focusFirstInvalid, useNow, useReturnFocus } from '../lib/focus';
import { plural, relativeTime } from '../lib/saas';
import { useSaasParts } from '../lib/saas-parts';
import {
  ROLE_HINTS,
  ROLE_LABELS,
  assignableRoles,
  canManage,
  inviteError,
  parseInviteEmails,
  seatUsage,
  sortMembers,
  type PendingInvite,
  type TeamMember,
  type TeamRole,
} from './team-members.logic';

export interface TeamMembersProps {
  members: readonly TeamMember[];
  invites?: readonly PendingInvite[];
  /** The role of the person looking: it decides who they may invite, change and remove. */
  currentRole: TeamRole;
  /** Seats on the plan; pending invites hold a seat. Omit for no limit. */
  seats?: number;
  /** Shows the invite form. Called with valid, new addresses only. */
  onInvite?: (emails: string[], role: TeamRole) => void;
  onChangeRole?: (memberId: string, role: TeamRole) => void;
  /** Asked to confirm first, in a dialog naming the person. */
  onRemove?: (memberId: string) => void;
  onResendInvite?: (inviteId: string) => void;
  onRevokeInvite?: (inviteId: string) => void;
  /** The moment "last active" is measured from. */
  now?: Date;
  locale?: string;
  title?: string;
  className?: string;
}

/**
 * Who is on the team and what they may do: members with their role, pending invites with resend
 * and revoke, and an invite form that takes pasted addresses. Roles follow one rule set (see
 * `canManage`), so nobody can lock the workspace out of its last owner.
 */
export function TeamMembers({
  members,
  invites = [],
  currentRole,
  seats,
  onInvite,
  onChangeRole,
  onRemove,
  onResendInvite,
  onRevokeInvite,
  now: requestedNow,
  locale: requestedLocale,
  title = 'Team members',
  className,
}: TeamMembersProps) {
  const now = useNow(requestedNow);
  const invitePanel = useReturnFocus();
  const panel = useRef<HTMLElement | null>(null);
  // The opener may be gone once the form closes (the empty state's button): find the header one.
  const inviteTrigger = () => panel.current?.querySelector<HTMLElement>('[data-invite-trigger]');
  const locale = resolveLocale(requestedLocale);
  const { Button } = useBlockParts();
  const { Items, Item } = useSaasParts();
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const usage = seatUsage(members, invites, seats);
  const activity = (member: TeamMember) =>
    member.lastActive === undefined
      ? 'Never signed in'
      : `Active ${relativeTime(member.lastActive, now, locale)}`;
  const canInvite = onInvite !== undefined && assignableRoles(currentRole).length > 0;
  const sorted = sortMembers(members);
  const alone = members.length <= 1 && invites.length === 0;

  const description = [
    plural(members.length, 'member'),
    invites.length > 0 ? `${String(invites.length)} invited` : null,
    usage.left === null ? null : `${plural(usage.left, 'seat')} left`,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <BlockPanel
      ref={panel}
      title={title}
      description={description}
      actions={
        canInvite && !inviting && !alone ? (
          <Button
            data-invite-trigger
            onClick={() => {
              invitePanel.remember();
              setInviting(true);
            }}
          >
            <UserPlusIcon aria-hidden weight="bold" className="size-4" />
            Invite people
          </Button>
        ) : undefined
      }
      className={className}
      bodyClassName="gap-5"
    >
      {canInvite && inviting && (
        <InviteForm
          members={members}
          invites={invites}
          currentRole={currentRole}
          seatsLeft={usage.left}
          onCancel={() => {
            setInviting(false);
            invitePanel.restore(inviteTrigger);
          }}
          onInvite={(emails, role) => {
            onInvite(emails, role);
            setInviting(false);
            invitePanel.restore(inviteTrigger);
          }}
        />
      )}

      {/* Column names over the wide layout; the rows carry their own labels for assistive tech. */}
      {members.length > 0 && (
        <div
          aria-hidden
          className="-mb-3 hidden items-center gap-3 border-b border-line pb-2 text-xs font-medium tracking-caps text-fg-muted uppercase @xl:flex"
        >
          <span className="flex-1">Member</span>
          <span className="hidden w-36 @2xl:block">Last active</span>
          <span className="w-32 px-(--rx-field-padding-x)">Role</span>
          <span className="w-(--rx-button-height-sm)" />
        </div>
      )}
      <ul aria-label="Members" className="flex flex-col">
        <Items>
          {sorted.map((member) => {
            const manageable = canManage(currentRole, member, members);
            return (
              <Item
                key={member.id}
                className="flex items-center gap-3 py-2.5 not-last:border-b not-last:border-line"
              >
                <Avatar name={member.name} src={member.avatarUrl} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-medium" title={member.name}>
                      {member.name}
                    </span>
                    {member.you === true && <Badge>You</Badge>}
                    {/* Narrow: the role column folds into a tag beside the name. */}
                    <Badge className="@xl:hidden">{ROLE_LABELS[member.role]}</Badge>
                  </span>
                  {/* The email may truncate; the folded activity wraps to its own line instead. */}
                  <span className="text-sm text-fg-muted">
                    <span className="block truncate @2xl:inline">{member.email}</span>
                    {/* Narrow: the activity column folds into the email line. */}
                    <span className="block @2xl:hidden">{activity(member)}</span>
                  </span>
                </div>
                <span className="hidden w-36 text-sm whitespace-nowrap text-fg-muted @2xl:block">
                  {activity(member)}
                </span>
                <span className="hidden @xl:block">
                  {manageable && onChangeRole !== undefined ? (
                    <RoleSelect
                      label={`Role for ${member.name}`}
                      value={member.role}
                      roles={assignableRoles(currentRole)}
                      onChange={(role) => {
                        onChangeRole(member.id, role);
                      }}
                    />
                  ) : (
                    <span className="inline-flex h-(--rx-control-height-sm) w-32 items-center border border-transparent px-(--rx-field-padding-x) text-sm text-fg-muted">
                      {ROLE_LABELS[member.role]}
                    </span>
                  )}
                </span>
                <span className="flex w-(--rx-button-height-sm) justify-end">
                  {manageable && (onRemove !== undefined || onChangeRole !== undefined) && (
                    <ActionMenu
                      label={`Actions for ${member.name}`}
                      actions={[
                        ...(onChangeRole === undefined
                          ? []
                          : assignableRoles(currentRole)
                              .filter((role) => role !== member.role)
                              .map((role) => ({
                                id: `role-${role}`,
                                label: `Make ${ROLE_LABELS[role].toLowerCase()}`,
                                onSelect: () => {
                                  onChangeRole(member.id, role);
                                },
                              }))),
                        ...(onRemove === undefined
                          ? []
                          : [
                              {
                                id: 'remove',
                                label: 'Remove from team',
                                icon: UserMinusIcon,
                                danger: true,
                                onSelect: () => {
                                  setRemoving(member);
                                },
                              },
                            ]),
                      ]}
                    />
                  )}
                </span>
              </Item>
            );
          })}
        </Items>
      </ul>

      {invites.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-line pt-4">
          <h3 className="text-sm font-medium text-fg-muted">
            Pending invites <span className="numeric text-fg-subtle">{invites.length}</span>
          </h3>
          <ul aria-label="Pending invites" className="flex flex-col">
            <Items>
              {invites.map((invite) => (
                <Item
                  key={invite.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 not-last:border-b not-last:border-line"
                >
                  <span
                    aria-hidden
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed border-line-strong text-fg-subtle"
                  >
                    <EnvelopeSimpleIcon weight="bold" className="size-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium" title={invite.email}>
                      {invite.email}
                    </span>
                    {/* The who and when wrap rather than cut the inviter's name. */}
                    <span className="text-sm text-pretty text-fg-muted">
                      {ROLE_LABELS[invite.role]}, invited{' '}
                      {relativeTime(invite.invitedAt, now, locale)}
                      {invite.invitedBy !== undefined && ` by ${invite.invitedBy}`}
                    </span>
                  </div>
                  {/* Narrow: the two actions fold into a menu, so the address keeps the width. */}
                  {(onResendInvite !== undefined || onRevokeInvite !== undefined) && (
                    <span className="@xl:hidden">
                      <ActionMenu
                        label={`Actions for the invite to ${invite.email}`}
                        actions={[
                          ...(onResendInvite === undefined
                            ? []
                            : [
                                {
                                  id: 'resend',
                                  label: 'Resend invite',
                                  icon: ArrowClockwiseIcon,
                                  onSelect: () => {
                                    onResendInvite(invite.id);
                                  },
                                },
                              ]),
                          ...(onRevokeInvite === undefined
                            ? []
                            : [
                                {
                                  id: 'revoke',
                                  label: 'Revoke invite',
                                  icon: XIcon,
                                  danger: true,
                                  onSelect: () => {
                                    onRevokeInvite(invite.id);
                                  },
                                },
                              ]),
                        ]}
                      />
                    </span>
                  )}
                  <span className="hidden items-center gap-2 @xl:flex pointer-coarse:gap-5">
                    {onResendInvite !== undefined && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Resend invite to ${invite.email}`}
                        onClick={() => {
                          onResendInvite(invite.id);
                        }}
                      >
                        <ArrowClockwiseIcon aria-hidden weight="bold" className="size-3.5" />
                        Resend
                      </Button>
                    )}
                    {onRevokeInvite !== undefined && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Revoke invite to ${invite.email}`}
                        onClick={() => {
                          onRevokeInvite(invite.id);
                        }}
                      >
                        <XIcon aria-hidden weight="bold" className="size-3.5" />
                        Revoke
                      </Button>
                    )}
                  </span>
                </Item>
              ))}
            </Items>
          </ul>
        </div>
      )}

      {alone && !inviting && (
        <div className="flex flex-col items-center gap-3 rounded-control border border-dashed border-line px-4 py-10 text-center text-sm text-fg-muted">
          <span
            aria-hidden
            className="inline-flex size-10 items-center justify-center rounded-full bg-surface-sunken text-fg-muted"
          >
            <UsersThreeIcon weight="bold" className="size-5" />
          </span>
          <div className="flex max-w-sm flex-col gap-1">
            <p className="font-medium text-fg">It is just you so far</p>
            <p className="text-pretty">
              {canInvite
                ? 'Invite the people you work with. They get an email and join with the role you pick.'
                : 'An owner or admin can invite the people you work with.'}
            </p>
          </div>
          {canInvite && (
            <Button
              data-invite-trigger
              onClick={() => {
                invitePanel.remember();
                setInviting(true);
              }}
            >
              <UserPlusIcon aria-hidden weight="bold" className="size-4" />
              Invite people
            </Button>
          )}
        </div>
      )}

      <RemoveDialog
        member={removing}
        onCancel={() => {
          setRemoving(null);
        }}
        onConfirm={(member) => {
          onRemove?.(member.id);
          setRemoving(null);
        }}
      />
    </BlockPanel>
  );
}

function RoleSelect({
  label,
  value,
  roles,
  onChange,
  className,
}: {
  label: string;
  value: TeamRole;
  roles: readonly TeamRole[];
  onChange: (role: TeamRole) => void;
  className?: string;
}) {
  const items = roles.map((role) => ({ value: role, label: ROLE_LABELS[role] }));
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        const role = roles.find((r) => r === next);
        if (role !== undefined) onChange(role);
      }}
    >
      <SelectTrigger
        aria-label={label}
        className={cn('h-(--rx-control-height-sm) w-32 text-sm', className)}
      />
      <SelectContent className="max-w-72">
        {roles.map((role) => (
          <SelectItem key={role} value={role}>
            <span className="flex flex-col py-0.5">
              <span>{ROLE_LABELS[role]}</span>
              <span className="text-sm whitespace-normal text-fg-muted">{ROLE_HINTS[role]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function InviteForm({
  members,
  invites,
  currentRole,
  seatsLeft,
  onCancel,
  onInvite,
}: {
  members: readonly TeamMember[];
  invites: readonly PendingInvite[];
  currentRole: TeamRole;
  seatsLeft: number | null;
  onCancel: () => void;
  onInvite: (emails: string[], role: TeamRole) => void;
}) {
  const { Button } = useBlockParts();
  const headingId = useId();
  const roles = assignableRoles(currentRole);
  const [text, setText] = useState('');
  const [role, setRole] = useState<TeamRole>(roles.includes('member') ? 'member' : 'viewer');
  const [tried, setTried] = useState(false);
  const parse = parseInviteEmails(text, members, invites);
  const error = inviteError(parse, seatsLeft);

  const form = useRef<HTMLFormElement | null>(null);

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    if (error !== null) {
      focusFirstInvalid(form.current);
      return;
    }
    onInvite(parse.valid, role);
  };

  return (
    <form
      ref={form}
      onSubmit={submit}
      noValidate
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-control border border-line bg-surface-sunken p-4"
    >
      <h3 id={headingId} className="font-medium">
        Invite people
      </h3>
      <div className="flex flex-col gap-3 @xl:flex-row @xl:items-start">
        <Field invalid={tried && error !== null} className="flex-1">
          <FieldLabel>Email addresses</FieldLabel>
          <Input
            autoFocus
            value={text}
            placeholder="ines@fernhill.io, tomasz@fernhill.io"
            onChange={(event) => {
              setText(event.target.value);
            }}
          />
          {tried && error !== null ? (
            <FieldError>{error}</FieldError>
          ) : (
            <FieldDescription>
              {parse.valid.length > 0
                ? `${plural(parse.valid.length, 'invite')} ready to send`
                : 'Separate several with commas or spaces.'}
            </FieldDescription>
          )}
        </Field>
        <Field className="@xl:w-40">
          <FieldLabel>Role</FieldLabel>
          <RoleSelect
            label="Role for the invited people"
            value={role}
            roles={roles}
            onChange={setRole}
            className="h-(--rx-field-height) w-full text-base"
          />
        </Field>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <PaperPlaneTiltIcon aria-hidden weight="bold" className="size-4" />
          {parse.valid.length > 1 ? `Send ${String(parse.valid.length)} invites` : 'Send invite'}
        </Button>
      </div>
    </form>
  );
}

function RemoveDialog({
  member,
  onCancel,
  onConfirm,
}: {
  member: TeamMember | null;
  onCancel: () => void;
  onConfirm: (member: TeamMember) => void;
}) {
  const { Button } = useBlockParts();
  // While the dialog closes it keeps naming the person, instead of an empty title.
  const [shown, setShown] = useState(member);
  if (member !== null && member !== shown) setShown(member);
  return (
    <Dialog
      open={member !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {shown?.name}?</DialogTitle>
          <DialogDescription>
            They lose access at once and their seat frees up. Their work stays in the workspace.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (shown !== null) onConfirm(shown);
            }}
          >
            Remove from team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
