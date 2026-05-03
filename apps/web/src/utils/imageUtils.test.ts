import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resizeImage } from './imageUtils';

describe('imageUtils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should resize an image and return base64', async () => {
    // Mock FileReader
    class MockFileReader {
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
      readAsDataURL() {
        setTimeout(() => {
          this.onload?.({ target: { result: 'data:image/png;base64,mock' } } as ProgressEvent<FileReader>);
        }, 0);
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    // Mock Image
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = 1000;
      height = 500;
      set src(_val: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    vi.stubGlobal('Image', MockImage);

    // Mock Canvas
    const mockCanvas = {
      getContext: vi.fn(() => ({
        drawImage: vi.fn(),
      })),
      toDataURL: vi.fn(() => 'data:image/webp;base64,resized-mock'),
      width: 0,
      height: 0,
    };
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'canvas') return mockCanvas as unknown as HTMLCanvasElement;
      return createElement(tagName);
    }) as typeof document.createElement);

    const file = new File([''], 'test.png', { type: 'image/png' });
    const result = await resizeImage(file, 800, 800);

    expect(result).toBe('data:image/webp;base64,resized-mock');
    expect(mockCanvas.width).toBe(800); // 1000 -> 800
    expect(mockCanvas.height).toBe(400); // 500 -> 400
  });

  it('should handle portrait images correctly', async () => {
    class MockImage {
      onload: (() => void) | null = null;
      width = 500;
      height = 1000;
      set src(_val: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    vi.stubGlobal('Image', MockImage);
    
    class MockFileReader {
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
      readAsDataURL() {
        setTimeout(() => {
          this.onload?.({ target: { result: 'data:image/png;base64,mock' } } as ProgressEvent<FileReader>);
        }, 0);
      }
    }
    vi.stubGlobal('FileReader', MockFileReader);

    const mockCanvas = {
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      toDataURL: vi.fn(() => 'data:image/webp;base64,resized'),
      width: 0,
      height: 0,
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLCanvasElement);

    const file = new File([''], 'test.png', { type: 'image/png' });
    await resizeImage(file, 800, 800);

    expect(mockCanvas.width).toBe(400); // 500 -> 400
    expect(mockCanvas.height).toBe(800); // 1000 -> 800
  });
});
