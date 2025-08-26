// Firebase Remote Config Blocker
// This script runs before React loads to prevent Firebase Remote Config from initializing

(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;
  
  console.log('Firebase Remote Config Blocker: Initializing...');
  
  // Block Firebase Remote Config before it can initialize
  try {
    // Method 1: Block the firebase object
    Object.defineProperty(window, 'firebase', {
      value: {
        remoteConfig: {
          getValue: () => ({ asString: () => '', asNumber: () => 0, asBoolean: () => false }),
          setDefaults: () => {},
          fetchAndActivate: () => Promise.resolve(true),
          activate: () => Promise.resolve(true),
        },
        analytics: {
          logEvent: () => {},
          setCurrentScreen: () => {},
          setUserId: () => {},
        },
        performance: {
          trace: () => ({
            start: () => {},
            stop: () => {},
            putAttribute: () => {},
            putMetric: () => {},
          }),
        },
      },
      writable: false,
      configurable: false,
    });
    
    // Method 2: Block firebaseRemoteConfig specifically
    Object.defineProperty(window, 'firebaseRemoteConfig', {
      value: {
        getValue: () => ({ asString: () => '', asNumber: () => 0, asBoolean: () => false }),
        setDefaults: () => {},
        fetchAndActivate: () => Promise.resolve(true),
        activate: () => Promise.resolve(true),
      },
      writable: false,
      configurable: false,
    });
    
    // Method 3: Override Object.defineProperty to catch any attempts to set firebase properties
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj: any, prop: PropertyKey, descriptor: PropertyDescriptor) {
      if (obj === window && (prop === 'firebase' || prop === 'firebaseRemoteConfig' || prop === 'firebaseAnalytics' || prop === 'firebasePerformance')) {
        console.log('Firebase Remote Config Blocker: Blocked attempt to set', prop);
        return obj;
      }
      return originalDefineProperty.call(this, obj, prop, descriptor);
    };
    
    // Method 4: Block any script tags that might load Firebase Remote Config
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName: string) {
      const element = originalCreateElement.call(this, tagName);
      if (tagName.toLowerCase() === 'script') {
        const originalSetAttribute = element.setAttribute;
        element.setAttribute = function(name: string, value: string) {
          if (name === 'src' && value.includes('firebase') && value.includes('remote-config')) {
            console.log('Firebase Remote Config Blocker: Blocked script with src:', value);
            return element;
          }
          return originalSetAttribute.call(this, name, value);
        };
      }
      return element;
    };
    
    console.log('Firebase Remote Config Blocker: Successfully initialized');
  } catch (error) {
    console.error('Firebase Remote Config Blocker: Error during initialization:', error);
  }

  // Method 5: Catch unhandled promise rejections from rogue scripts (like extensions)
  window.addEventListener('unhandledrejection', function(event) {
    const errorReason = event.reason || {};
    // Specifically target the IndexedDB error caused by faulty Remote Config initialization
    if (errorReason.code === 'remoteconfig/storage-open' || (typeof errorReason.message === 'string' && errorReason.message.includes('indexedDB'))) {
      console.warn(
        'Firebase Blocker: Caught an unhandled promise rejection, likely from a browser extension conflicting with Firebase. ' +
        'The app will attempt to continue. For a stable experience, consider disabling browser extensions.',
        errorReason
      );
      // Prevent this error from bubbling up and causing a fatal crash
      event.preventDefault();
    }
  });
})();
