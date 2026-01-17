import { removeBackground } from "@imgly/background-removal";
import { ref } from 'vue';

export function useBackgroundRemoval() {
  const isRemovingBackground = ref(false);
  const error = ref<string | null>(null);

  /**
   * Removes background from an image blob using @imgly/background-removal.
   * @param imageSource - The image source (Blob, URL, Image, or Canvas).
   * @returns Promise<Blob> - The processed image blob (PNG).
   */
  const removeBackgroundWrapper = async (imageSource: Blob | string | HTMLImageElement | HTMLCanvasElement): Promise<Blob> => {
    isRemovingBackground.value = true;
    error.value = null;
    
    try {
      // The library runs locally via WebAssembly/ONNX
      const blob = await removeBackground(imageSource, {
        progress: (key: string, current: number, total: number) => {
           console.log(`Downloading ${key}: ${current} of ${total}`);
        }
      });
      return blob;
    } catch (err: any) {
      console.error("Background removal failed:", err);
      error.value = "Failed to remove background. Please try again.";
      throw err;
    } finally {
      isRemovingBackground.value = false;
    }
  };

  return {
    removeBackground: removeBackgroundWrapper,
    isRemovingBackground,
    error
  };
}
