const mergeStyledAttrsWithNodeAttrs = require('../mergeStyledAttrsWithNodeAttrs');
const getAsProp = require('../getAsProp');
const { inspect } = require('util');

module.exports = (context, styledComponents, rule, name) => ({
  JSXOpeningElement(node) {
    const func = inspectee => name.includes('') && context.report(node, inspect(inspectee || node));
    try {
      const originalName = node.name.type === 'JSXMemberExpression'
        ? `${node.name.object.name}.${node.name.property.name}`
        : node.name.name;
      const styledComponent = styledComponents[originalName];
      if (styledComponent) {
        const { tag, attrs } = styledComponent;
        const originalNodeAttr = node.attributes;
        const allAttrs = mergeStyledAttrsWithNodeAttrs(attrs, originalNodeAttr);
        const asProp = getAsProp(allAttrs);

        allAttrs.forEach(atr => {
          let parent = atr.parent;
          if (!parent) {
            parent = node
          }
          try {
            rule.create(context).JSXAttribute({
              ...atr,
              loc: node.loc,
              parent: {
                ...parent,
                name: {
                  ...parent.name,
                  name: asProp || tag
                },
                attributes: allAttrs,
              }
            }, func);
          } catch {}
        });
      }
    } catch {}
  },
});
