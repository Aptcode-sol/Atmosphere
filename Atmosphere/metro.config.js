const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const path = require('path');

const config = {
    resolver: {
        extraNodeModules: {
            events: path.resolve(__dirname, 'node_modules', 'events'),
        },
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
