'use client';

import { TrashIcon, UserPlusIcon } from '@phosphor-icons/react';
import {
  Avatar,
  Badge,
  Button,
  Field,
  FieldError,
  FieldLabel,
  FormSection,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@rectio/ui';
import { useState } from 'react';

import { CURRENT_USER } from '@/data/company';
import { ROLES, TEAM, type Role, type TeamMember } from '@/data/team';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Who can use the books, with their role, and a row to invite someone new. */
export function TeamSection({ forceInvalid }: { forceInvalid: boolean }) {
  const [members, setMembers] = useState<readonly TeamMember[]>(TEAM);
  const [email, setEmail] = useState(forceInvalid ? 'eoin.fernhill.ie' : '');
  const [role, setRole] = useState<Role>('member');
  const [tried, setTried] = useState(forceInvalid);

  const error =
    email.trim() === ''
      ? 'Enter an email address to invite.'
      : !EMAIL.test(email.trim())
        ? 'That is not an email address: it needs an @ and a domain.'
        : members.some((m) => m.email === email.trim())
          ? 'That person is already a member.'
          : null;

  const invite = () => {
    setTried(true);
    if (error !== null) return;
    const address = email.trim();
    const name = address
      .split('@')[0]
      ?.split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    setMembers((list) => [
      ...list,
      {
        id: `u-${String(list.length + 1)}`,
        name: name ?? address,
        email: address,
        role,
        team: 'Not set',
        invited: true,
      },
    ]);
    setEmail('');
    setTried(false);
  };

  return (
    <FormSection
      id="team"
      className="scroll-mt-24 p-5 sm:p-8"
      title="Team members"
      description="Roles decide who can approve, post to the journal and change these settings."
    >
      <ul className="flex flex-col divide-y divide-line rounded-control border border-line">
        {members.map((member) => {
          const you = member.email === CURRENT_USER.email;
          return (
            <li
              key={member.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:flex-nowrap"
            >
              <Avatar name={member.name} size="md" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2 truncate text-sm font-medium">
                  {member.name}
                  {you && <span className="font-regular text-fg-subtle">(you)</span>}
                  {member.invited === true && <Badge tone="info">Invited</Badge>}
                </span>
                <span className="truncate text-sm text-fg-muted">{member.email}</span>
              </div>
              <div className="flex items-center gap-1 max-sm:w-full max-sm:ps-11">
                <Select
                  items={ROLES}
                  value={member.role}
                  disabled={you}
                  onValueChange={(value) => {
                    if (value === null) return;
                    setMembers((list) =>
                      list.map((m) => (m.id === member.id ? { ...m, role: value } : m)),
                    );
                  }}
                >
                  <SelectTrigger
                    aria-label={`Role of ${member.name}`}
                    className="w-36 max-sm:flex-1"
                  />
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  iconOnly
                  disabled={you}
                  aria-label={`Remove ${member.name}`}
                  onClick={() => {
                    setMembers((list) => list.filter((m) => m.id !== member.id));
                  }}
                >
                  <TrashIcon aria-hidden weight="bold" className="size-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Field invalid={tried && error !== null} className="flex-1">
          <FieldLabel>Invite by email</FieldLabel>
          <Input
            type="email"
            value={email}
            autoComplete="off"
            placeholder="name@fernhill.ie"
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                invite();
              }
            }}
          />
          <FieldError>{tried ? error : null}</FieldError>
        </Field>
        <Field className="sm:w-40">
          <FieldLabel>Role</FieldLabel>
          <Select
            items={ROLES}
            value={role}
            onValueChange={(value) => {
              if (value !== null) setRole(value);
            }}
          >
            <SelectTrigger />
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button type="button" variant="secondary" onClick={invite} className="sm:mt-6.5">
          <UserPlusIcon aria-hidden weight="bold" className="size-4" />
          Invite
        </Button>
      </div>
    </FormSection>
  );
}
