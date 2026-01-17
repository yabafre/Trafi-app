import '@testing-library/jest-dom/vitest';

// Mock ResizeObserver for Radix UI components (Tooltip, Popover, etc.)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
