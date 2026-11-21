// @ts-check
import {
  SELECTOR_METHODS,
  findDesignValueViolations,
  findInvisibleOutlineVariants,
} from './detect.js';

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

/**
 * True when `node` is the first argument of `x.querySelector(...)`, `x.closest(...)` and the other
 * selector methods, optional chaining included.
 *
 * @param {any} node
 */
function isSelectorArgument(node) {
  const call = node.parent;
  if (call?.type !== 'CallExpression' || call.arguments[0] !== node) return false;
  const callee = call.callee;
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier' &&
    SELECTOR_METHODS.has(callee.property.name)
  );
}

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
     * @param {boolean} [selector] The text is a CSS selector, not a class list.
     */
    function check(node, text, offset, selector = false) {
      const start = node.range?.[0];
      if (start === undefined) return;
      for (const v of findDesignValueViolations(text, { selector })) {
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
        if (typeof node.value === 'string') check(node, node.value, 1, isSelectorArgument(node));
      },
      TemplateElement(node) {
        // A template element sits in a template literal; the literal is the call's argument.
        check(node, node.value.raw, 0, isSelectorArgument(/** @type {any} */ (node).parent));
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

/** Functions that merge class lists; their arguments are one element's classes. */
const CLASS_MERGERS = new Set(['cn', 'clsx', 'cx', 'twMerge']);

/**
 * Every class named in string literals under `node`: through arrays, template literals,
 * conditionals, `&&` and nested class merger calls. Identifiers are not followed.
 *
 * @param {any} node
 * @returns {string[]}
 */
function classesIn(node) {
  if (node === null || node === undefined) return [];
  switch (node.type) {
    case 'Literal':
      return typeof node.value === 'string' ? node.value.split(/\s+/).filter(Boolean) : [];
    case 'TemplateLiteral':
      return node.quasis.flatMap((/** @type {any} */ q) =>
        q.value.raw.split(/\s+/).filter(Boolean),
      );
    case 'ArrayExpression':
      return node.elements.flatMap(classesIn);
    case 'ConditionalExpression':
      return [...classesIn(node.consequent), ...classesIn(node.alternate)];
    case 'LogicalExpression':
      return [...classesIn(node.left), ...classesIn(node.right)];
    case 'CallExpression':
      return node.callee.type === 'Identifier' && CLASS_MERGERS.has(node.callee.name)
        ? node.arguments.flatMap(classesIn)
        : [];
    case 'JSXExpressionContainer':
      return classesIn(node.expression);
    default:
      return [];
  }
}

/** True when `node` sits inside a className attribute or a class merger call. */
function insideClassList(/** @type {any} */ node) {
  for (let up = node.parent; up; up = up.parent) {
    if (up.type === 'JSXAttribute' && up.name?.name === 'className') return true;
    if (
      up.type === 'CallExpression' &&
      up.callee.type === 'Identifier' &&
      CLASS_MERGERS.has(up.callee.name)
    ) {
      return true;
    }
  }
  return false;
}

/** @type {import('eslint').Rule.RuleModule} */
const noInvisibleFocusRing = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'A class list with outline-none must give its focus ring an outline style, or the ring draws nothing.',
    },
    schema: [],
    messages: {
      invisible:
        'outline-none with {{variant}}outline-<width> draws no ring in Tailwind v4: add {{variant}}outline-solid.',
    },
  },
  create(context) {
    /** @param {any} node @param {any} value */
    function check(node, value) {
      for (const variant of findInvisibleOutlineVariants(classesIn(value))) {
        context.report({ node, messageId: 'invisible', data: { variant } });
      }
    }
    return {
      /** @param {any} node */
      JSXAttribute(node) {
        if (node.name?.name === 'className') check(node, node.value);
      },
      /** @param {any} node */
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || !CLASS_MERGERS.has(node.callee.name)) return;
        if (!insideClassList(node)) check(node, node);
      },
      /** @param {any} node */
      VariableDeclarator(node) {
        const init = node.init;
        if (init === null || insideClassList(init)) return;
        if (init.type === 'ObjectExpression') {
          // A record of class lists, such as one per size: each value is its own element.
          for (const property of init.properties) {
            if (property.type === 'Property') check(property, property.value);
          }
        } else if (init.type !== 'CallExpression') {
          check(node, init);
        }
      },
    };
  },
};

const plugin = {
  meta: { name: '@rectio/design-rules' },
  rules: {
    'no-hardcoded-design-values': noHardcodedDesignValues,
    'no-invisible-focus-ring': noInvisibleFocusRing,
  },
};

export default plugin;
