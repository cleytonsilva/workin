/**
 * Babel Configuration for WorkIn Extension
 */

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
          browsers: ['last 2 Chrome versions']
        },
        modules: 'commonjs'
      }
    ]
  ],
  plugins: [],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            },
            modules: 'commonjs'
          }
        ]
      ]
    }
  }
};