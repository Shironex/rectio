'use client';

import { LogoStrip } from '@rectio/blocks/marketing/motion';

const LOGOS = [
  { name: 'Nordwind' },
  { name: 'Halden' },
  { name: 'Brightwater' },
  { name: 'Kestrel' },
  { name: 'Orchard' },
  { name: 'Vantor' },
];

export default function LogoStripMarqueeMotionDemo() {
  return (
    <div className="w-full">
      <LogoStrip title="Trusted by finance teams at" logos={LOGOS} variant="marquee" />
    </div>
  );
}
