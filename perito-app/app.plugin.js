const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withDisableScreenCaptureDetection(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Add the permission but mark it as not required
    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    // Remove any existing DETECT_SCREEN_CAPTURE permission
    androidManifest['uses-permission'] = androidManifest['uses-permission'].filter(
      (perm) => perm.$?.['android:name'] !== 'android.permission.DETECT_SCREEN_CAPTURE'
    );

    return config;
  });
};
