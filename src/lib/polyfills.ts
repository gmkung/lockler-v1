
// Polyfill for Node.js assert module
class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

export function assert(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(message || 'Assertion failed');
  }
}

// Add to window for global access if needed
window.assert = assert;

// Add to global for compatibility
(window as any).global = window;

// Declare assert on window
declare global {
  interface Window {
    assert: typeof assert;
  }
}
