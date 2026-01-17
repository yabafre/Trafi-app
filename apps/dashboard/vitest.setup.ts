import '@testing-library/jest-dom/vitest';

// Mock ResizeObserver for Radix UI components (Tooltip, Popover, etc.)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Only apply DOM-specific mocks when running in jsdom environment
// This prevents errors when tests use @vitest-environment node
if (typeof Element !== 'undefined') {
  // Mock pointer capture methods for Radix UI Select component
  // These are required by @radix-ui/react-select but not available in jsdom
  if (typeof Element.prototype.hasPointerCapture !== 'function') {
    Element.prototype.hasPointerCapture = function() { return false; };
  }
  if (typeof Element.prototype.setPointerCapture !== 'function') {
    Element.prototype.setPointerCapture = function() {};
  }
  if (typeof Element.prototype.releasePointerCapture !== 'function') {
    Element.prototype.releasePointerCapture = function() {};
  }

  // Mock scrollIntoView for Radix UI components
  if (typeof Element.prototype.scrollIntoView !== 'function') {
    Element.prototype.scrollIntoView = function() {};
  }
}
