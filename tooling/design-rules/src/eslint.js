// @ts-check
import { findDesignValueViolations } from './detect.js';

/** Style properties that carry a design decision and must read a token (`var(--rx-...)`). */
const DESIGN_STYLE_PROPS = new Set([
  'color',
  'background',
  'backgroundColor',
  'borderColor',
  'outlineColor',
  'fill',
  'stroke',
  'borderRadius',
  'fontFamily',
  'boxShadow',
  'transition',
  'transitionDuration',
  'transitionTimingFunction',
  'animation',
  'animationDuration',
  'animationTimingFunction',
]);

/** @type {import('eslint').Rule.RuleModule} */
const noHardcodedDesignValues = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Components take colour, radius, font, shadow, duration and easing from design tokens only.',
    },
    schema: [],
    messages: {
      hardcoded: '{{match}}: {{reason}}.',
      styleProp:
        'style.{{prop}} must read a token (var(--rx-...)): themes cannot restyle a literal value.',
    },
  },
  create(context) {
    const source = context.sourceCode;

    /**
     * @param {import('estree').Node} node
     * @param {string} text
     * @param {number} offset Where `text` starts inside the node's source range.
     */
    function check(node, text, offset) {
      const start = node.range?.[0];
      if (start === undefined) return;
      for (const v of findDesignValueViolations(text)) {
        const begin = start + offset + v.index;
        context.report({
          node,
          loc: {
            start: source.getLocFromIndex(begin),
            end: source.getLocFromIndex(begin + v.match.length),
          },
          messageId: 'hardcoded',
          data: { match: v.match, reason: v.reason },
        });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value, 1);
      },
      TemplateElement(node) {
        check(node, node.value.raw, 0);
      },
      /** @param {any} node */
      JSXAttribute(node) {
        if (node.name?.name !== 'style') return;
        const expression = node.value?.expression;
        if (expression?.type !== 'ObjectExpression') return;
        for (const property of expression.properties) {
          if (property.type !== 'Property' || property.key.type !== 'Identifier') continue;
          if (!DESIGN_STYLE_PROPS.has(property.key.name)) continue;
          const value = property.value;
          const isTokenRead =
            (value.type === 'Literal' &&
              typeof value.value === 'string' &&
              value.value.startsWith('var(--rx-')) ||
            (value.type === 'TemplateLiteral' &&
              value.quasis[0]?.value.raw.startsWith('var(--rx-'));
          if (!isTokenRead) {
            context.report({
              node: property,
              messageId: 'styleProp',
              data: { prop: property.key.name },
            });
          }
        }
      },
    };
  },
};

const plugin = {
  meta: { name: '@rectio/design-rules' },
  rules: { 'no-hardcoded-design-values': noHardcodedDesignValues },
};

export default plugin;
