const parserOptionsMapper = require('./parserOptionsMapper');

const makeRuleMaker = (func) => ({
  tag = 'div',
  attrs = '{}',
  props = '',
  children = '',
  errors,
  siblings = '',
} = {}) => {
  const args = { tag, attrs, props, children, errors, siblings };
  const code = func(args);
  return [{ code, errors }].map(parserOptionsMapper)[0];
};

const regular = ({ tag, props, children, siblings }) =>
`
  const STYLED = styled.${tag}\`\`;
  const Func = () => ${
    children ? `<>${siblings}<STYLED ${props}>${children}</STYLED></>` : `<>${siblings}<STYLED ${props} /></>`
  };
`;

const withStyledAttrs = ({ tag, attrs, children, siblings }) =>
  `
  const STYLED = styled.${tag}.attrs(${attrs})\`\`;
  const Func = () => ${children ? `<>${siblings}<STYLED>${children}</STYLED></>` : `<>${siblings}<STYLED /></>`};
`;

const withStyledComponent = ({ tag, attrs, children, siblings }) =>
  `
  const STYLED = styled.${tag}.attrs(${attrs})\`\`;
  const NESTED = styled(STYLED)\`\`;
  const Func = () => ${children ? `<>${siblings}<NESTED>${children}</NESTED></>` : `<>${siblings}<NESTED /></>`};
`;

const withStyledComponentImmediatelyChained = ({ tag, attrs, children, siblings }) =>
  `
  const STYLED = styled.${tag}\`\`;
  const NESTED = styled(STYLED).attrs(${attrs})\`\`;
  const Func = () => ${children ? `<>${siblings}<NESTED>${children}</NESTED></>` : `<>${siblings}<NESTED /></>`};
`;

const withStyledComponentAsOther = ({ tag, attrs, children, siblings }) =>
  `
  const STYLED = styled.${tag === 'button' ? 'div' : 'button'}.attrs(${attrs})\`\`;
  const NESTED = styled(STYLED)\`\`;
  const Func = () => ${
    children ? `<>${siblings}<NESTED as="${tag}">${children}</NESTED></>` : `<>${siblings}<NESTED as="${tag}" /></>`
  };
`;

const withStyledComponentsAsOtherWithComponentDefinedAfterInstantiation = ({ tag, attrs, children, siblings }) =>
  `
  const Func = () => ${
    children ? `<>${siblings}<NESTED as="${tag}">${children}</NESTED></>` : `<>${siblings}<NESTED as="${tag}" /></>`
  };
  const STYLED = styled.${tag === 'button' ? 'div' : 'button'}.attrs(${attrs})\`\`;
  const NESTED = styled(STYLED)\`\`;
`;

const withBEM = ({ tag, props, children, siblings }) =>
  `
  const BLOCK = {};
  BLOCK.ELEMENT = styled.${tag}\`\`;
  const Func = () => ${
    children ? `<>${siblings}<BLOCK.ELEMENT ${props}>${children}</BLOCK.ELEMENT></>` : `<>${siblings}<BLOCK.ELEMENT ${props} /></>`
  };
`;

const makeStyledTestCases = (args) =>
  [regular, withStyledAttrs, withStyledComponent, withStyledComponentImmediatelyChained, withStyledComponentAsOther, withStyledComponentsAsOtherWithComponentDefinedAfterInstantiation, withBEM]
    .map(makeRuleMaker)
    .map((x) => x(args));

module.exports = makeStyledTestCases;
