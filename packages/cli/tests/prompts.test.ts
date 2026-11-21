import { describe, expect, it } from 'vitest';

import { Prompter } from '../src/prompt/prompts.ts';
import { fitLine, PromptCancelled } from '../src/prompt/session.ts';
import { glyphs, styles } from '../src/ui/style.ts';
import { KEY, fakeTerminal, screenOf } from './fake-terminal.ts';

function prompter(color = false) {
  const term = fakeTerminal('.');
  const write = term.ctx.write ?? (() => undefined);
  const ask = new Prompter(
    { input: term.input, write, columns: 80 },
    styles(color),
    glyphs(true),
    true,
    '  ',
  );
  return { term, ask };
}

const ESC = '\u001b';

const choices = [
  { value: 'a', label: 'Alpha', hint: 'first' },
  { value: 'b', label: 'Bravo', disabled: 'not found' },
  { value: 'c', label: 'Charlie', description: 'The third one, with a description.' },
  { value: 'j', label: 'Juliet' },
];

describe('select', () => {
  it('moves with arrows and j/k, skips disabled choices and wraps', async () => {
    const { term, ask } = prompter();
    const answer = ask.select({ message: 'Pick', choices });
    await term.type('j'); // Alpha -> Charlie (Bravo is disabled)
    expect(term.screen()).toContain('› Charlie');
    expect(term.screen()).toContain('The third one, with a description.');
    await term.type('j', 'j', KEY.up, 'k', KEY.down, KEY.enter); // Juliet, Alpha, Juliet, Charlie, Juliet
    expect(await answer).toBe('j');
    expect(screenOf(term.raw()).at(-1)).toBe('  ✓ Pick                      Juliet');
  });

  it('filters as you type; j and k are letters once the filter has text', async () => {
    const { term, ask } = prompter();
    const answer = ask.select({ message: 'Pick', choices, filter: true });
    await term.type('ul');
    expect(term.screen()).toContain('filter ul');
    expect(term.screen()).toContain('› Juliet');
    expect(term.screen()).not.toContain('Alpha');
    await term.type('j'); // a letter now, not a move
    expect(term.screen()).toContain('filter ulj');
    expect(term.screen()).toContain('No match.');
    await term.type(KEY.enter); // nothing to choose: stays open
    await term.type(KEY.backspace, KEY.backspace, KEY.backspace, 'char', KEY.enter);
    expect(await answer).toBe('c');
  });

  it('starts on the initial value and shows the state in text, not color only', async () => {
    const { term, ask } = prompter();
    const answer = ask.select({ message: 'Pick', choices, initial: 'c', note: ['a note'] });
    expect(term.screen()).toMatch(/› Charlie/);
    expect(term.screen()).toMatch(/Bravo +not found/);
    expect(term.screen()).toContain('a note');
    expect(term.screen()).toContain('↑↓ move · enter choose · esc cancel');
    await term.type(KEY.enter);
    expect(await answer).toBe('c');
  });

  it('draws no color codes with color off (NO_COLOR) and colors with it on', async () => {
    const plain = prompter(false);
    const one = plain.ask.select({ message: 'Pick', choices });
    await plain.term.type(KEY.enter);
    await one;
    expect(plain.term.raw()).not.toMatch(new RegExp(`${ESC}\\[\\d+m`));

    const colored = prompter(true);
    const two = colored.ask.select({ message: 'Pick', choices });
    await colored.term.type(KEY.enter);
    await two;
    expect(colored.term.raw()).toContain('\u001b[36m');
  });

  it('rejects with PromptCancelled on Ctrl+C and restores the terminal', async () => {
    const { term, ask } = prompter();
    const answer = ask.select({ message: 'Pick', choices }).catch((error: unknown) => error);
    await term.type(KEY.ctrlC);
    expect(await answer).toBeInstanceOf(PromptCancelled);
    expect(term.rawModes).toEqual([true, false]);
    expect(term.raw().endsWith('\u001b[?25h')).toBe(true);
    expect(screenOf(term.raw()).at(-1)).toBe('  ✗ Pick');
  });
});

describe('multiselect', () => {
  it('toggles with space, all with a, and answers in list order', async () => {
    const { term, ask } = prompter();
    const all = [
      { value: 'x', label: 'x' },
      { value: 'y', label: 'y' },
      { value: 'z', label: 'z' },
    ];
    const answer = ask.multiselect({ message: 'Items', choices: all });
    await term.type('j', 'j', KEY.space, 'k', 'k', KEY.space);
    expect(term.screen()).toContain('[x] x');
    expect(term.screen()).toContain('[ ] y');
    await term.type('a'); // not all chosen: choose all
    await term.type('a'); // all chosen: clear
    await term.type(KEY.space, 'j', 'j', KEY.space, KEY.enter);
    expect(await answer).toEqual(['x', 'z']);
    expect(term.screen()).toContain('✓ Items                     x, z');
  });

  it('says none for an empty answer', async () => {
    const { term, ask } = prompter();
    const answer = ask.multiselect({ message: 'Items', choices: [{ value: 'x', label: 'x' }] });
    await term.type(KEY.enter);
    expect(await answer).toEqual([]);
    expect(term.screen()).toContain('Items                     none');
  });
});

describe('text', () => {
  it('uses the default when empty, edits in place and validates', async () => {
    const { term, ask } = prompter();
    const answer = ask.text({
      message: 'Name',
      initial: 'app',
      validate: (v) => (v.includes(' ') ? 'no spaces' : undefined),
    });
    await term.type('a', 'c', KEY.up, '\u001b[D', 'b', KEY.enter); // a c, left, b -> abc
    expect(await answer).toBe('abc');

    const second = prompter();
    const fallback = second.ask.text({ message: 'Name', initial: 'app' });
    expect(second.term.screen()).toContain('Name  app');
    await second.term.type(KEY.enter);
    expect(await fallback).toBe('app');

    const third = prompter();
    const checked = third.ask.text({
      message: 'Name',
      validate: (v) => (v.includes(' ') ? 'no spaces' : undefined),
    });
    await third.term.type('a b', KEY.enter);
    expect(third.term.screen()).toContain('! no spaces');
    await third.term.type('\u0015', 'ab', KEY.enter); // Ctrl+U clears the line
    expect(await checked).toBe('ab');
  });

  it('places the real cursor after the typed text', async () => {
    const { term, ask } = prompter();
    const answer = ask.text({ message: 'Name' });
    await term.type('xy');
    // The last frame ends by moving to the input line and showing the cursor.
    expect(term.raw()).toMatch(new RegExp(`${ESC}\\[\\d+C${ESC}\\[\\?25h$`));
    await term.type(KEY.enter);
    await answer;
  });
});

describe('confirm', () => {
  it('takes y, n and the default on enter', async () => {
    for (const [keys, initial, expected] of [
      [['y'], false, true],
      [['N'], true, false],
      [[KEY.enter], true, true],
      [['x', KEY.enter], false, false],
    ] as const) {
      const { term, ask } = prompter();
      const answer = ask.confirm({ message: 'Sure?', initial });
      expect(term.screen()).toContain(initial ? '(Y/n)' : '(y/N)');
      await term.type(...keys);
      expect(await answer).toBe(expected);
    }
  });
});

describe('fitLine', () => {
  it('cuts a line that would wrap, so the redraw stays in place', () => {
    expect(fitLine('short', 80)).toBe('short');
    const long = `\u001b[2m${'x'.repeat(100)}\u001b[22m`;
    expect(fitLine(long, 40)).toBe(`${'x'.repeat(38)}…`);
  });
});
