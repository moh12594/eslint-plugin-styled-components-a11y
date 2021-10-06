const mergeStyledAttrsWithNodeAttrs = require('../mergeStyledAttrsWithNodeAttrs');
const getAsProp = require('../getAsProp');
const { inspect } = require('util');

module.exports = (context, styledComponents, rule, name) => ({
  JSXOpeningElement(node) {
    const func = inspectee => name.includes('scope') && context.report(node, inspect(inspectee || node));
    try {
      const originalName = node.name.type === 'JSXMemberExpression'
        ? `${node.name.object.name}.${node.name.property.name}`
        : node.name.name;
      const styledComponent = styledComponents[originalName];
      if (styledComponent) {
        const { tag, attrs } = styledComponent;
        const originalNodeAttr = node.attributes;
        try {
          const allAttrs = mergeStyledAttrsWithNodeAttrs(attrs, originalNodeAttr);
          const asProp = getAsProp(allAttrs);
          node.attributes = allAttrs;
          rule.create(context).JSXOpeningElement({ ...node, name: { name: asProp || tag, type: 'JSXIdentifier' } });
        } finally {
          node.attributes = originalNodeAttr;
        }
      }
    } catch {}
  },
});
