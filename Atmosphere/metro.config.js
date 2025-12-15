const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
    resolver: {
        // Resolve socket.io-client to CommonJS build
        resolveRequest: (context, moduleName, platform) => {
            // Redirect ESM builds to CJS for socket.io packages
            if (moduleName.includes('socket.io-client') || 
                moduleName.includes('engine.io-client') ||
                moduleName.includes('engine.io-parser')) {
                // Try to resolve to the CJS build
                const cjsPath = moduleName.replace('/build/esm/', '/build/cjs/');
                if (cjsPath !== moduleName) {
                    try {
                        return context.resolveRequest(context, cjsPath, platform);
                    } catch (e) {
                        // Fall through to default
                    }
                }
            }
            // Default resolution
            return context.resolveRequest(context, moduleName, platform);
        },
        unstable_enablePackageExports: false,
    },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
