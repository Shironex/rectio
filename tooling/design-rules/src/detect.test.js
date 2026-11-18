// @ts-check
import { describe, expect, it } from 'vitest';

import { findDesignValueViolations } from './detect.js';

/** @param {string} text */
const matches = (text) => findDesignValueViolations(text).map((v) => v.match);

describe('findDesignValueViolations', () => {
  it.each([
    ['bg-surface text-fg border-line rounded-control shadow-raised'],
    ['duration-base ease-enter data-starting-style:opacity-0'],
    ['data-[side=top]:translate-y-1 aria-[invalid=true]:border-negative'],
    ['origin-(--transform-origin) h-control-md translate-y-(--rx-motion-shift)'],
    ['font-sans font-numeric tabular-nums text-sm'],
    ['Interest is charged monthly'],
  ])('accepts token-only classes: %s', (text) => {
    expect(matches(text)).toEqual([]);
  });

  it.each([
    ['color: #fff', '#fff'],
    ['bg-[#1f2937]', 'bg-[#1f2937]'],
    ['oklch(0.5 0.1 250)', 'oklch('],
    ['rgb(0 0 0 / 0.5)', 'rgb('],
    ['rounded-[6px]', 'rounded-[6px]'],
    ['duration-[200ms]', 'duration-[200ms]'],
    ['hover:text-[13px]', 'text-[13px]'],
    ['[color:red]', '[color:red]'],
    ['bg-slate-900', 'bg-slate-900'],
    ['text-white', 'text-white'],
    ['duration-200', 'duration-200'],
    ['ease-in-out', 'ease-in-out'],
    ['transition: opacity 200ms', '200ms'],
    ['cubic-bezier(0.2, 0, 0, 1)', 'cubic-bezier('],
    ['rounded-md', 'rounded-md'],
    ['rounded', 'rounded'],
    ['shadow-lg', 'shadow-lg'],
    ['font-serif', 'font-serif'],
    ['font-family: Inter, sans-serif', 'Inter'],
    ['"IBM Plex Sans"', 'IBM Plex'],
    ['dark:bg-surface', 'dark:'],
    ['scale-(--my-scale)', '-(--my-scale)'],
  ])('flags %s', (text, expected) => {
    expect(matches(text)).toContain(expected);
  });

  it('reports the offset of each match', () => {
    const [violation] = findDesignValueViolations('px-2 rounded-[6px]');
    expect(violation?.index).toBe(5);
  });
});
