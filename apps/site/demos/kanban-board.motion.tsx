'use client';

import { KanbanBoard } from '@rectio/blocks/motion';

import { useKanbanBoardDemo } from './kanban-board';

export default function KanbanBoardMotionDemo() {
  const props = useKanbanBoardDemo();
  return (
    <div className="w-full">
      <KanbanBoard {...props} />
    </div>
  );
}
