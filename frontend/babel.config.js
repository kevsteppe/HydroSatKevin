module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
  ],
  plugins: [
    // Plugin to transform import.meta
    function() {
      return {
        visitor: {
          MetaProperty(path) {
            if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
              path.replaceWithSourceString('({ env: { VITE_API_BASE_URL: "http://localhost:3000" } })');
            }
          }
        }
      };
    }
  ]
};