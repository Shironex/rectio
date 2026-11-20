/**
 * The theme generator's shared core, for the docs page and the CLI: theme inputs, the theme code,
 * the derivation with its contrast correction, and the theme CSS writer. No Node APIs.
 */
export {
  CODE_PARAM,
  CODE_VERSION,
  ThemeCodeError,
  decodeTheme,
  encodeTheme,
  extractCode,
  isThemeReference,
} from './code.ts';
export {
  fontDependencies,
  renderThemeCss,
  templateColors,
  usedFonts,
  type CssOptions,
} from './css.ts';
export {
  DEFAULT_FONTS,
  DEFAULT_NAME,
  DEFAULT_SELECTED_CHROMA,
  DEFAULT_STEPS,
  DEFAULT_TEXT,
  FONTS,
  RADII,
  RANGES,
  colorOf,
  fontById,
  generatorPresets,
  radiusById,
  slugName,
  type ColorInputs,
  type Density,
  type FontChoice,
  type FontId,
  type FontRole,
  type GeneratorPreset,
  type Overrides,
  type RadiusId,
  type RadiusScale,
  type ThemeInputs,
} from './inputs.ts';
export {
  colorRoles,
  expandPairs,
  pairsOf,
  passCount,
  resolveTheme,
  type GeneratorData,
  type ModeResult,
  type PackedPair,
  type ResolvedTheme,
  type ShippedColors,
} from './resolve.ts';
export { cuspLightness, type Correction, type Mode, type Preset } from '../scripts/derive-core.ts';
export { parseOklch, toHex, type Pair, type Result } from '../scripts/evaluate.ts';
export { fitSrgb, formatOklch, type Oklch } from '../scripts/color.ts';
