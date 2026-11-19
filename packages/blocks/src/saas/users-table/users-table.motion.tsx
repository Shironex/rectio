import { SaasMotionParts } from '../lib/saas-motion-parts';
import { UsersTable as PlainUsersTable, type UsersTableProps } from './users-table';

export type { UsersTableProps };

/** UsersTable with the motion parts: same props, plain under reduced motion. */
export function UsersTable(props: UsersTableProps) {
  return (
    <SaasMotionParts>
      <PlainUsersTable {...props} />
    </SaasMotionParts>
  );
}
