const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Android-optimized settings
config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

// Increase workers for better Android performance  
config.maxWorkers = Math.max(2, Math.floor(require('os').cpus().length / 2));

// Ensure Android compatibility
config.resolver.platforms = ['android', 'native', 'web'];

// Android-specific exclusions
config.resolver.blockList = [
  /node_modules[\/\\]react[\/\\]dist[\/\\].*/,
  /node_modules[\/\\].*[\/\\]__tests__[\/\\].*/,
];

// Optimize for Android bundle size
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;