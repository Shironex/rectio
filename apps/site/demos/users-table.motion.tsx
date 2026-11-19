'use client';

import { UsersTable } from '@rectio/blocks/motion';

import { useUsersTableDemo } from './users-table';

export default function UsersTableMotionDemo() {
  const props = useUsersTableDemo();
  return (
    <div className="w-full">
      <UsersTable {...props} />
    </div>
  );
}
