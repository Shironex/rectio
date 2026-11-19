'use client';

import { ActivityFeed } from '@rectio/blocks/motion';

import { EVENTS, NOW } from './activity-feed';

export default function ActivityFeedMotionDemo() {
  return (
    <div className="w-full">
      <ActivityFeed events={EVENTS} filterable now={NOW} locale="en-GB" />
    </div>
  );
}
