declare module 'imagetracerjs' {
  export interface OptionPresets {
    [key: string]: any;
  }
  
  export function imagedataToSVG(imageData: ImageData, options?: any): string;
  export function appendSVGString(svgString: string, parentId: string): void;
  // Add other methods if needed
}
