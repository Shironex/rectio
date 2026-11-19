import { SaasMotionParts } from '../lib/saas-motion-parts';
import { KanbanBoard as PlainKanbanBoard, type KanbanBoardProps } from './kanban-board';

export type { KanbanBoardProps };

/** KanbanBoard with the motion parts: same props, plain under reduced motion. */
export function KanbanBoard(props: KanbanBoardProps) {
  return (
    <SaasMotionParts>
      <PlainKanbanBoard {...props} />
    </SaasMotionParts>
  );
}
