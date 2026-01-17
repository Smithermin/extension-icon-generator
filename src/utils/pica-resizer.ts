import Pica from 'pica';

const pica = Pica();

/**
 * Resize an image using Pica (Lanczos3 algorithm).
 * @param {HTMLImageElement | HTMLCanvasElement} source - Source image or canvas.
 * @param {number} width - Target width.
 * @param {number} height - Target height.
 * @returns {Promise<Blob>} - Resized image as a Blob.
 */
export async function resizeImage(
  source: HTMLImageElement | HTMLCanvasElement,
  width: number,
  height: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  // Pica expects the destination canvas to be available
  await pica.resize(source, canvas, {
    unsharpAmount: 80,
    unsharpRadius: 0.6,
    unsharpThreshold: 2
  });

  return pica.toBlob(canvas, 'image/png', 0.90);
}

/**
 * Helper to load an image file into an HTMLImageElement.
 * @param {Blob | File} file - The image file or blob.
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(file: Blob | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
