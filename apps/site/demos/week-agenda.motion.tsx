'use client';

import { WeekAgenda } from '@rectio/blocks/motion';

import { useWeekAgendaDemo } from './week-agenda';

export default function WeekAgendaMotionDemo() {
  const props = useWeekAgendaDemo();
  return (
    <div className="w-full">
      <WeekAgenda {...props} />
    </div>
  );
}
