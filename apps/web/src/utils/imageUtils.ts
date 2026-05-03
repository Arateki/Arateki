/**
 * Resizes an image file and returns it as a Base64 string.
 * @param file The image file to resize.
 * @param maxWidth Max width in pixels.
 * @param maxHeight Max height in pixels.
 * @returns A promise that resolves to a Base64 string.
 */
export async function resizeImage(file: File, maxWidth = 800, maxHeight = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Export as WebP for best compression/quality ratio
        const base64 = canvas.toDataURL('image/webp', 0.8);
        resolve(base64);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
