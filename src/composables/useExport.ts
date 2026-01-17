import { ref } from 'vue';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { EXPORT_PRESETS } from '../config/export-presets';
import { resizeImage, loadImage } from '../utils/pica-resizer';
import { traceToSVG } from '../utils/vectorizer';

export function useExport() {
  const isExporting = ref(false);
  const exportStatus = ref('');

  const createZip = async (sourceImageSrc: string, selectedPlatforms: string[] = []) => {
    isExporting.value = true;
    exportStatus.value = 'Initializing...';

    try {
      const zip = new JSZip();
      
      // Load the source image
      const sourceImage = await loadImage(
         await fetch(sourceImageSrc).then(r => r.blob())
      );

      // Filter presets based on user selection
      // If selectedPlatforms is empty, we assume all (or handle validation elsewhere, 
      // but let's assume UI handles it). 
      // Actually, if it's empty, let's export nothing or all? 
      // Better to respect the array. If array is empty, we only export source/svg if logic permits.
      // But for now let's iterate keys.

      for (const key in EXPORT_PRESETS) {
        const preset = EXPORT_PRESETS[key as keyof typeof EXPORT_PRESETS];
        
        // Skip if not in selection (check by ID)
        if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(preset.id)) {
           continue;
        }

        const folder = zip.folder(preset.folder);
        
        if (!folder) continue;

        exportStatus.value = `Generating ${preset.name}...`;

        for (const size of preset.sizes) {
          // Resize
          const blob = await resizeImage(sourceImage, size, size);
          folder.file(`icon-${size}.png`, blob);
        }

        // --- 2. Manifest Snippet (Only for Chrome) ---
        if (key === 'chrome_extension') {
          const manifestIcons: Record<string, string> = {};
          preset.sizes.forEach(size => {
            manifestIcons[size.toString()] = `icons/icon-${size}.png`;
          });
          
          const manifestContent = JSON.stringify({ icons: manifestIcons }, null, 2);
          folder.file('manifest-snippet.json', manifestContent);
        }
      }

      // --- 3. Vector Image (SVG) ---
      exportStatus.value = 'Tracing SVG...';
      // Create a temp canvas for tracing
      const canvas = document.createElement('canvas');
      canvas.width = sourceImage.width;
      canvas.height = sourceImage.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(sourceImage, 0, 0);
        const svgString = traceToSVG(canvas);
        if (svgString) {
          zip.file('icon.svg', svgString);
        }
      }

      // --- 4. Generate & Download ---
      exportStatus.value = 'Zipping...';
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'ai-icon-pack.zip');

    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed. See console for details.');
    } finally {
      isExporting.value = false;
      exportStatus.value = '';
    }
  };

  return {
    createZip,
    isExporting,
    exportStatus
  };
}
