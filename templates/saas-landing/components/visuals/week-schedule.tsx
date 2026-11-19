import { CheckIcon, WarningIcon } from '@phosphor-icons/react';
import { Avatar, Badge, cn } from '@rectio/ui';

import { DAYS, filledOn, NEEDED, ROLES, TEAM_WEEK, type Role, type Shift } from '@/data/schedule';

/** Each role's shifts in one identity colour pair from the tokens, so roles read apart in any theme. */
const ROLE_TONE: Record<Role['identity'], string> = {
  1: 'bg-identity-1-subtle text-identity-1-strong',
  2: 'bg-identity-2-subtle text-identity-2-strong',
  3: 'bg-identity-3-subtle text-identity-3-strong',
  4: 'bg-identity-4-subtle text-identity-4-strong',
};

/** The legend's swatch: the strong half of the pair, so it reads at swatch size. */
const ROLE_DOT: Record<Role['identity'], string> = {
  1: 'bg-identity-1-strong',
  2: 'bg-identity-2-strong',
  3: 'bg-identity-3-strong',
  4: 'bg-identity-4-strong',
};

/**
 * Days that drop out as the schedule narrows, so a phone still shows whole shifts: the first three
 * days always, the rest as the container widens.
 */
const DAY_VISIBILITY = [
  '',
  '',
  '',
  '@max-sm:sr-only',
  '@max-md:sr-only',
  '@max-lg:sr-only',
  '@max-lg:sr-only',
];

/** First name and initial, such as "Priya N.", so every name fits its column. */
function shortName(name: string): string {
  const [first, ...rest] = name.split(' ');
  const last = rest.at(-1);
  return last === undefined ? (first ?? name) : `${first ?? ''} ${last.charAt(0)}.`;
}

const FALLBACK_ROLE: Role = { id: 'front', label: 'Shift', identity: 1 };

function roleOf(shift: Shift): Role {
  return ROLES.find((role) => role.id === shift.role) ?? FALLBACK_ROLE;
}

function ShiftChip({ shift }: { shift: Shift }) {
  const role = roleOf(shift);
  return (
    <span
      className={cn(
        'flex min-w-0 flex-col rounded-control px-1.5 py-1 text-start',
        ROLE_TONE[role.identity],
      )}
    >
      <span className="numeric text-xs font-strong">
        {shift.start}
        <span className="sr-only"> to {shift.end}</span>
      </span>
      <span className="truncate text-xs @max-2xl:sr-only">{role.label}</span>
    </span>
  );
}

/**
 * One team's week as the product shows it: people down the side, days across, every shift in its
 * role's colour and a coverage line that flags the days still short. A real table, so a screen
 * reader can walk it by row and column.
 */
export function WeekSchedule({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        '@container flex flex-col overflow-hidden rounded-panel border border-line bg-surface text-fg',
        className,
      )}
    >
      <div className="flex flex-col gap-2 border-b border-line px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-fg">Harbour Street Café</span>
          <Badge tone="positive">Published</Badge>
        </div>
        <ul aria-label="Roles" className="flex flex-wrap gap-x-3 gap-y-1">
          {ROLES.map((role) => (
            <li key={role.id} className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
              <span aria-hidden className={cn('size-2.5 rounded-badge', ROLE_DOT[role.identity])} />
              {role.label}
            </li>
          ))}
        </ul>
      </div>
      <table className="w-full table-fixed border-collapse text-sm">
        <caption className="sr-only">Shifts for the week of 17 November, by person and day</caption>
        <thead>
          <tr className="border-b border-line">
            <th
              scope="col"
              className="w-24 px-3 py-2 text-start font-medium text-fg-muted @md:w-36"
            >
              <span className="sr-only">Person</span>
            </th>
            {DAYS.map((day, index) => (
              <th
                key={day.short}
                scope="col"
                className={cn(
                  'px-1 py-2 text-start font-medium text-fg-muted',
                  DAY_VISIBILITY[index],
                )}
              >
                <span className="block text-xs">{day.short}</span>
                <span className="numeric block text-base text-fg">{day.date}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TEAM_WEEK.map((person) => (
            <tr key={person.id} className="border-b border-line">
              <th scope="row" className="px-3 py-2 text-start font-regular">
                <span className="flex min-w-0 items-center gap-2">
                  <Avatar name={person.name} size="sm" />
                  <span className="truncate text-fg">
                    <span className="@md:hidden">{person.name.split(' ')[0]}</span>
                    <span className="hidden @md:inline">{shortName(person.name)}</span>
                  </span>
                </span>
              </th>
              {person.week.map((shift, index) => (
                <td key={DAYS[index]?.short} className={cn('px-1 py-1.5', DAY_VISIBILITY[index])}>
                  {shift === null ? (
                    <span className="sr-only">Off</span>
                  ) : (
                    <ShiftChip shift={shift} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="px-3 py-2.5 text-start text-xs font-medium text-fg-muted">
              Covered
            </th>
            {DAYS.map((day, index) => {
              const filled = filledOn(index);
              const needed = NEEDED[index] ?? filled;
              const short = filled < needed;
              return (
                <td
                  key={day.short}
                  className={cn(
                    'px-1 py-2.5 text-xs font-medium',
                    short ? 'text-warning-strong' : 'text-fg-muted',
                    DAY_VISIBILITY[index],
                  )}
                >
                  <span className="inline-flex items-center gap-1 numeric">
                    {short ? (
                      <WarningIcon aria-hidden weight="bold" className="size-3.5 shrink-0" />
                    ) : (
                      <CheckIcon aria-hidden weight="bold" className="size-3.5 shrink-0" />
                    )}
                    {filled}/{needed}
                    {short && <span className="sr-only"> (short)</span>}
                  </span>
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
