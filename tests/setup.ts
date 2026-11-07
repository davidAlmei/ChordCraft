import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Mock window.HTMLCanvasElement.prototype.getContext for text metrics if needed
if (typeof window !== 'undefined' && window.HTMLCanvasElement) {
  const originalGetContext = window.HTMLCanvasElement.prototype.getContext;
  window.HTMLCanvasElement.prototype.getContext = function (contextType: string, ...args: any[]) {
    if (contextType === '2d') {
      return {
        font: '16px sans-serif',
        measureText: (text: string) => {
          // Average character width simulation ~8.5px for 16px font
          const width = text.length * 8.5;
          return {
            width,
            actualBoundingBoxAscent: 12,
            actualBoundingBoxDescent: 4,
          };
        },
      } as any;
    }
    return originalGetContext.call(this, contextType, ...args);
  };
}
