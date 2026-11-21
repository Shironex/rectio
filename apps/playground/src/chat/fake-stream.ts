/**
 * A stand-in for a model's streaming API: it sends `text` in uneven bursts (a word, then a
 * handful, then a pause), the way real tokens arrive, so the thread's scroll anchoring, the caret
 * and the motion twin's even reveal all get exercised. Stop it with the returned function.
 */
export function fakeStream(
  text: string,
  {
    onChunk,
    onDone,
    speed = 1,
  }: {
    onChunk: (received: string) => void;
    onDone: () => void;
    /** 2 is twice as fast. */
    speed?: number;
  },
): () => void {
  const words = text.split(/(?<=\s)/);
  let index = 0;
  let received = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  // A fixed sequence, so every run streams the same way.
  const bursts = [1, 4, 2, 7, 3, 1, 5, 2, 9, 3];
  const pauses = [60, 140, 90, 220, 70, 110, 40, 180, 90, 130];
  let step = 0;

  const tick = () => {
    const take = bursts[step % bursts.length] ?? 3;
    received += words.slice(index, index + take).join('');
    index += take;
    onChunk(received);
    if (index >= words.length) {
      onDone();
      return;
    }
    timer = setTimeout(tick, (pauses[step % pauses.length] ?? 100) / speed);
    step += 1;
  };
  timer = setTimeout(tick, 300 / speed);
  return () => {
    clearTimeout(timer);
  };
}
