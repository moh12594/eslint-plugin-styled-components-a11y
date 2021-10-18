const isStyledCallExpression = (node) => node.tag.type === 'CallExpression';

const isStyledFunc = (node) => node.tag.callee?.name === 'styled';
const isStyledFuncWithAttrs = (node) => node.tag.callee?.object?.callee?.name === 'styled';

const isPlainSTE = (node) => node.tag.type === 'MemberExpression' && node.tag?.object?.name === 'styled';
const isAttrs = ({ tag }) => tag.callee?.property?.name === 'attrs';

const getAttrsType = (node) => {
  const type = node.tag?.arguments?.[0]?.type;
  return type === 'FunctionExpression'
    ? 'func'
    : type === 'ArrowFunctionExpression'
    ? 'arrow'
    : type === 'ObjectExpression'
    ? 'object'
    : '';
};
const { inspect } = require('util');
const { __UNKNOWN_IDENTIFER__ } = require('./constants');

module.exports = (styledComponentsDict, context, name) => ({
  TaggedTemplateExpression(node) {
    let scName = node.parent.id && node.parent.id.name;
    if (!scName) {
      scName = node.parent.type === 'AssignmentExpression' && node.parent.left && node.parent.left.object && node.parent.left.property
        ? `${node.parent.left.object.name}.${node.parent.left.property.name}`
        : '';
      if (!scName) {
        return;
      }
    }
    let attrs = [];
    let tag = '';
    const func = (inspectee) => name.includes('anchor-is-valid') && context.report(node, inspect(inspectee || node));
    // styled(Component)`` || styled.div.attrs(...)``
    if (isStyledCallExpression(node)) {
      // styled(Component)``
      if (isStyledFunc(node)) {
        const ancestorScName = node.tag.arguments[0].name;
        if (!styledComponentsDict[ancestorScName]) return;
        ({ attrs } = styledComponentsDict[ancestorScName]);
        ({ tag } = styledComponentsDict[ancestorScName]);
      }
      // styled.div.attrs(...)`` || styled(Component).attrs(...)``
      if (isAttrs(node) || isStyledFuncWithAttrs(node)) {
        const isComponentAttrsCall = isStyledFuncWithAttrs(node);
        let attrsPropertiesArr = [];
        const attrsNode = node.tag.arguments[0];

        if (isComponentAttrsCall) {
          const ancestorScName = node.tag.callee.object.arguments[0].name;
          if (!styledComponentsDict[ancestorScName]) return;
          attrs = styledComponentsDict[ancestorScName].attrs;
          tag = styledComponentsDict[ancestorScName].tag;
        } else {
          tag = node.tag.callee.object.property?.name;
        }
        const attrsType = getAttrsType(node);
        if (!tag || !attrsType) return;
        // styled.div.attrs(function() { return {} })``

        // TODO all these empty array defaults are a temp fix. Should get a better way of actually trying to see what
        //  is returned from function attrs in the case they aren't just simple immediate returns, e.g., if else statements
        if (attrsType === 'arrow') {
          attrsPropertiesArr = attrsNode?.body?.properties || [];
          // styled.div.attrs(() => ({}))``
        } else if (attrsType === 'func') {
          attrsPropertiesArr =
            attrsNode?.body?.body?.find((x) => x.type === 'ReturnStatement')?.argument?.properties || [];
          // styled.div.attrs({})``
        } else if (attrsType === 'object') {
          attrsPropertiesArr = attrsNode?.properties || [];
        }
        const arithmeticUnaryOperators = ['+', '-'];
        // filter out spread elements (which have no key nor value)
        attrs = attrs.concat(
          attrsPropertiesArr
            .filter((x) => x.key)
            .map((x) => ({
              key: x.key.name || x.key.value,
              // this is pretty useless. would need to generate code from any template expression for this to really work
              value:
                x.value.type === 'TemplateLiteral'
                  ? // need to grab falsy vals like empty strings, thus the x ? x : identifier instead of x|| identifier
                    typeof x.value.quasis[0].value.raw === 'undefined'
                    ? __UNKNOWN_IDENTIFER__
                    : x.value.quasis[0].value.raw
                  : x.value.type === 'UnaryExpression' && arithmeticUnaryOperators.includes(x.value.operator)
                  ? // if simple arithemetic, concat the symbol and the strings (like a negative) and then coerce to a number
                    +(x.value.operator + x.value.argument.value)
                  : x.value.type === 'Identifier'
                  ? x.value.name === 'undefined'
                    ? undefined
                    : __UNKNOWN_IDENTIFER__
                  : typeof x.value.value === 'undefined'
                  ? // if property exists, but no value found, just set it to our unknown identifier so it returns truthy and not something specific like a number or boolean or undefined as these are tested in specific ways for different linting rules
                    // too many options for what this could be, but this can approxinate what is needed for linting
                    // need to grab falsy vals like empty strings, thus the x ? x : identifier instead of x|| identifier
                    __UNKNOWN_IDENTIFER__
                  : x.value.value,
            })),
        );
      }
      styledComponentsDict[scName] = { name: scName, attrs, tag };
    }
    // const A = styled.div``
    if (isPlainSTE(node)) {
      tag = node.tag.property.name;
      styledComponentsDict[scName] = {
        name: scName,
        tag,
        attrs,
      };
    }
  },
});
