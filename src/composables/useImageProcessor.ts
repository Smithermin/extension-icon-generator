import { ref } from 'vue';
import { loadImage } from '../utils/pica-resizer';

export interface ProcessorConfig {
  padding: number; // 0 to 0.5 (0% to 50%)
  borderRadius: number; // 0 to 0.5 (0% to 50% of size)
  backgroundColor: string; // Hex or 'transparent'
  size: number; // Canvas output size (e.g., 512, 1024)
}

export function useImageProcessor() {
  const isProcessing = ref(false);

  /**
   * Trims transparent pixels from a canvas and returns a new canvas with just the content.
   */
  const trimCanvas = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement | null => {
    const ctx = sourceCanvas.getContext('2d');
    if (!ctx) return null;

    const width = sourceCanvas.width;
    const height = sourceCanvas.height;
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let top = 0, bottom = height, left = 0, right = width;

    // Scan top
    top: for (top = 0; top < height; top++) {
      for (let x = 0; x < width; x++) {
        if (data[(top * width + x) * 4 + 3] !== 0) break top;
      }
    }

    // If image is fully transparent
    if (top === height) return null;

    // Scan bottom
    bottom: for (bottom = height - 1; bottom >= top; bottom--) {
      for (let x = 0; x < width; x++) {
        if (data[(bottom * width + x) * 4 + 3] !== 0) break bottom;
      }
    }

    // Scan left
    left: for (left = 0; left < width; left++) {
      for (let y = top; y <= bottom; y++) {
        if (data[(y * width + left) * 4 + 3] !== 0) break left;
      }
    }

    // Scan right
    right: for (right = width - 1; right >= left; right--) {
      for (let y = top; y <= bottom; y++) {
        if (data[(y * width + right) * 4 + 3] !== 0) break right;
      }
    }

    const trimWidth = right - left + 1;
    const trimHeight = bottom - top + 1;

    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = trimWidth;
    trimmedCanvas.height = trimHeight;
    const trimmedCtx = trimmedCanvas.getContext('2d');
    
    if (trimmedCtx) {
      trimmedCtx.drawImage(
        sourceCanvas,
        left, top, trimWidth, trimHeight,
        0, 0, trimWidth, trimHeight
      );
    }

    return trimmedCanvas;
  };

  /**
   * Composes the final image: Square canvas -> Background -> Centered Logo (with padding) -> Rounded Corners
   */
  const processImage = async (
    sourceBlob: Blob | string,
    config: ProcessorConfig
  ): Promise<string> => {
    isProcessing.value = true;
    try {
      let blob: Blob;
      if (typeof sourceBlob === 'string') {
          const response = await fetch(sourceBlob);
          blob = await response.blob();
      } else {
          blob = sourceBlob;
      }
      const img = await loadImage(blob);

      // 1. Create a temporary canvas to draw the image and trim it
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error("Context creation failed");
      
      tempCtx.drawImage(img, 0, 0);
      
      // Auto-Trim: Find the actual content bounding box
      const trimmedCanvas = trimCanvas(tempCanvas) || tempCanvas;

      // 2. Setup the final square canvas
      const size = config.size;
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = size;
      finalCanvas.height = size;
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) throw new Error("Final context creation failed");

      // 3. Draw Rounded Corners Mask (Clipping Path)
      // If we want a rounded icon, we must clip *before* drawing content and background if background is part of the icon.
      // However, usually "background color" is for checking transparency, OR it's part of the icon.
      // Let's assume for standard icons, if user selects a background color, it fills the square.
      
      // Clip for border radius
      if (config.borderRadius > 0) {
        const radius = size * config.borderRadius;
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(size - radius, 0);
        ctx.quadraticCurveTo(size, 0, size, radius);
        ctx.lineTo(size, size - radius);
        ctx.quadraticCurveTo(size, size, size - radius, size);
        ctx.lineTo(radius, size);
        ctx.quadraticCurveTo(0, size, 0, size - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
        ctx.clip();
      }

      // 4. Fill Background
      if (config.backgroundColor !== 'transparent') {
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, size, size);
      }

      // 5. Calculate Layout (Center & Pad)
      // Available space for the logo
      const availableSize = size * (1 - config.padding * 2);
      
      // Maintain aspect ratio of the trimmed logo
      const aspect = trimmedCanvas.width / trimmedCanvas.height;
      let drawWidth, drawHeight;

      if (aspect >= 1) {
        // Wide or Square
        drawWidth = availableSize;
        drawHeight = availableSize / aspect;
      } else {
        // Tall
        drawHeight = availableSize;
        drawWidth = availableSize * aspect;
      }

      const x = (size - drawWidth) / 2;
      const y = (size - drawHeight) / 2;

      // High quality scaling is handled by browser canvas here (usually bilinear/bicubic), 
      // but since we are often scaling DOWN from a large AI image to 512/1024, it's usually fine.
      // For very small target sizes (16/32), we use Pica later on the *result* of this function.
      ctx.drawImage(trimmedCanvas, x, y, drawWidth, drawHeight);

      return finalCanvas.toDataURL('image/png');

    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    processImage,
    isProcessing
  };
}
