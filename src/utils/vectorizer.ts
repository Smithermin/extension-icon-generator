import ImageTracer from 'imagetracerjs';

export function traceToSVG(sourceCanvas: HTMLCanvasElement): string {
  // ImageTracer needs an ImageData object
  const ctx = sourceCanvas.getContext('2d');
  if (!ctx) return '';
  
  const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  
  // Use default options or tune for logos
  // Documentation: https://github.com/jankovicsandras/imagetracerjs
  const options = {
    ltr: 0, // Linear Trace
    qtrs: 0, // Quadratic Trace
    pathomit: 8, // Simplify paths shorter than 8
    colorsampling: 2, // 0=disabled, 1=random, 2=deterministic
    numberofcolors: 16, // Reduce palette for cleaner vector
    mincolorratio: 0.02,
    scale: 1,
    simplification: 0, // 0=none
    strokewidth: 0,
    viewbox: true, // Add viewBox
    desc: false, // No description
  };

  // The npm version of imagetracerjs might behave differently than the browser global one.
  // Usually `ImageTracer.imagedataToSVG` is the synchronous method.
  
  try {
     return ImageTracer.imagedataToSVG(imageData, options);
  } catch (e) {
    console.error("Vectorization failed", e);
    return '';
  }
}
