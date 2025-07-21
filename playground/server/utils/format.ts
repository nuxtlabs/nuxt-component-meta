import prettier from 'prettier/standalone';
import parserBabel from 'prettier/plugins/babel';
import pluginEstree from 'prettier/plugins/estree';

export function formatJS(code: string) {
  return prettier.format(code, {
    parser: 'babel',
    plugins: [parserBabel, pluginEstree],
    semi: true,
    singleQuote: true,
    tabWidth: 2,

  });
}
