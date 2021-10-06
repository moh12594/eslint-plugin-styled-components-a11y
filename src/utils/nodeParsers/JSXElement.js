const mergeStyledAttrsWithNodeAttrs = require('../mergeStyledAttrsWithNodeAttrs');
const getAsProp = require('../getAsProp');
const { inspect } = require('util');
module.exports = (context, styledComponents, rule, name) => ({
  JSXElement(node) {
    const func = inspectee => name.includes('scope') && context.report(node, inspect(inspectee || node));
    try {
      const originalName = node.openingElement.name.type === 'JSXMemberExpression'
        ? `${node.openingElement.name.object.name}.${node.openingElement.name.property.name}`
        : node.openingElement.name.name;
      const styledComponent = styledComponents[originalName];
      if (styledComponent) {
        const { tag, attrs } = styledComponent;
        const originalNodeAttr = node.openingElement.attributes;
        try {
          const allAttrs = mergeStyledAttrsWithNodeAttrs(attrs, originalNodeAttr);
          const asProp = getAsProp(allAttrs);
          rule.create(context).JSXElement({ ...node, openingElement: { attributes: allAttrs, name: { name: asProp || tag, type: 'JSXIdentifier' } } });
        } finally {}
      }
    } catch {}
  },
});
