/**
 * The currencies Intl knows in the build's runtime, with English names, read when the page is
 * built. Historic codes and units that are not money (metals, funds, testing) are left out.
 */
export function currencies(): { codes: string[]; names: Record<string, string> } {
  const display = new Intl.DisplayNames(['en'], { type: 'currency', fallback: 'none' });
  const names: Record<string, string> = {};
  const codes = Intl.supportedValuesOf('currency').filter((code) => {
    const name = display.of(code);
    if (name === undefined || /\(\d{4}/.test(name)) return false;
    // The X codes are mostly metals, funds and testing units; keep the ones that are money.
    if (code.startsWith('X') && !/franc|dollar/i.test(name)) return false;
    names[code] = name;
    return true;
  });
  return { codes, names };
}
