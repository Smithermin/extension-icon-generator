export const EXPORT_PRESETS = {
  chrome_extension: {
    id: 'chrome',
    name: 'Chrome Extension',
    folder: 'chrome-extension',
    sizes: [16, 32, 48, 128],
    format: 'png'
  },
  ios_app: {
    id: 'ios',
    name: 'iOS App Icons',
    folder: 'ios-assets',
    // Common iOS icon sizes
    sizes: [20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180, 1024],
    format: 'png'
  },
  android_launcher: {
    id: 'android',
    name: 'Android Launcher',
    folder: 'android-launcher',
    sizes: [36, 48, 72, 96, 144, 192, 512],
    format: 'png'
  },
  web_favicon: {
    id: 'web',
    name: 'Web Favicons',
    folder: 'web-assets',
    sizes: [16, 32, 192, 512],
    format: 'png'
  }
};
