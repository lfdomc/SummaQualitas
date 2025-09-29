'use client';

export interface BrowserInfo {
  isChrome: boolean;
  chromeVersion: string | null;
  userAgent: string;
  vendor: string;
  platform: string;
}

export function getBrowserInfo(): BrowserInfo {
  if (typeof window === 'undefined') {
    return {
      isChrome: false,
      chromeVersion: null,
      userAgent: '',
      vendor: '',
      platform: '',
    };
  }

  const userAgent = navigator.userAgent;
  const vendor = navigator.vendor;
  const platform = navigator.platform;
  
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(vendor);
  let chromeVersion: string | null = null;
  
  if (isChrome) {
    const match = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    chromeVersion = match ? match[1] : null;
  }

  return {
    isChrome,
    chromeVersion,
    userAgent,
    vendor,
    platform,
  };
}

export function logBrowserDiagnostics(): void {
  const browserInfo = getBrowserInfo();
  
  console.group('🌐 Browser Diagnostics');
  console.log('Is Chrome:', browserInfo.isChrome);
  console.log('Chrome Version:', browserInfo.chromeVersion);
  console.log('User Agent:', browserInfo.userAgent);
  console.log('Vendor:', browserInfo.vendor);
  console.log('Platform:', browserInfo.platform);
  
  // Verificar características específicas de Chrome
  if (browserInfo.isChrome) {
    console.log('Chrome Features:');
    console.log('- Local Storage:', typeof localStorage !== 'undefined');
    console.log('- Session Storage:', typeof sessionStorage !== 'undefined');
    console.log('- IndexedDB:', typeof indexedDB !== 'undefined');
    console.log('- Service Worker:', 'serviceWorker' in navigator);
    console.log('- Fetch API:', typeof fetch !== 'undefined');
    console.log('- WebRTC:', typeof RTCPeerConnection !== 'undefined');
  }
  
  console.groupEnd();
}

export function checkChromeCompatibility(): {
  isCompatible: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const browserInfo = getBrowserInfo();
  
  if (!browserInfo.isChrome) {
    return { isCompatible: true, issues: [] };
  }
  
  // Verificar versión mínima de Chrome
  if (browserInfo.chromeVersion) {
    const majorVersion = parseInt(browserInfo.chromeVersion.split('.')[0]);
    if (majorVersion < 90) {
      issues.push(`Chrome version ${browserInfo.chromeVersion} is too old. Please update to Chrome 90+`);
    }
  }
  
  // Verificar APIs necesarias
  if (typeof localStorage === 'undefined') {
    issues.push('Local Storage is not available');
  }
  
  if (typeof sessionStorage === 'undefined') {
    issues.push('Session Storage is not available');
  }
  
  if (typeof fetch === 'undefined') {
    issues.push('Fetch API is not available');
  }
  
  return {
    isCompatible: issues.length === 0,
    issues,
  };
}