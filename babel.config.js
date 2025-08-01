// following babel 7, system wide config at root level
// https://babeljs.io/docs/en/next/config-files#project-wide-configuration
// https://stackoverflow.com/questions/52387820/babel7-jest-unexpected-token-export/52388264
module.exports = {
  presets: [
    [
      '@babel/preset-env', {
        targets: { node: 'current' }
      }
    ],
    '@babel/preset-react',
    '@babel/preset-typescript'
  ],
  plugins: [
    '@babel/plugin-transform-object-rest-spread',
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-optional-chaining'
  ]
};
