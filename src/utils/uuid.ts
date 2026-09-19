/**
 * Universal UUID v4 generator with fallback for non-secure contexts (e.g. mobile access over local HTTP)
 */

// Cache native implementation if available in Secure Context
const nativeRandomUUID =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID.bind(crypto)
    : null;

export function generateUUID(): string {
  if (nativeRandomUUID) {
    try {
      return nativeRandomUUID();
    } catch {
      // fallback if native throws
    }
  }

  // RFC4122 version 4 compliant fallback (never recursively calls crypto.randomUUID)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Safely polyfill window.crypto.randomUUID if missing, without infinite loop
if (typeof window !== 'undefined') {
  if (!window.crypto) {
    try {
      (window as unknown as { crypto: Record<string, unknown> }).crypto = {};
    } catch {}
  }

  if (window.crypto && typeof window.crypto.randomUUID !== 'function') {
    try {
      Object.defineProperty(window.crypto, 'randomUUID', {
        value: generateUUID,
        configurable: true,
        writable: true,
      });
    } catch {
      try {
        (window.crypto as { randomUUID: () => string }).randomUUID = generateUUID;
      } catch {}
    }
  }
}
