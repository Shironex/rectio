// Bundlers replace `process.env.NODE_ENV` with a string; the declaration keeps the kit free of Node types.
declare const process: { env: { NODE_ENV?: string } };

function isDev() {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    // No bundler and no Node: a plain browser script, treated as production.
    return false;
  }
}

/** A console warning for a misuse the component can recover from, in development builds only. */
export function devWarn(message: string) {
  if (isDev()) console.warn(`rectio: ${message}`);
}
