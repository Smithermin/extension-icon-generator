<script setup lang="ts">
import { ref, onUnmounted, watch, nextTick } from 'vue';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

const props = defineProps<{
  imageFile: File | null;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', croppedBlob: Blob): void;
}>();

const imageRef = ref<HTMLImageElement | null>(null);
const cropper = ref<Cropper | null>(null);
const objectUrl = ref<string | null>(null);
const cropDimensions = ref({ width: 0, height: 0 });

// Initialize Cropper when modal opens
watch(() => [props.isOpen, props.imageFile], async ([isOpen, file]) => {
  if (isOpen && file) {
    if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
    objectUrl.value = URL.createObjectURL(file as File);
    
    await nextTick();
    
    // Wait for image to load to check dimensions
    const img = imageRef.value;
    if (img) {
        // Reset styles first
        img.style.width = '';
        img.style.height = '';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        
        // Wait for natural dimensions
        if (!img.complete) {
            await new Promise(r => img.onload = r);
        }

        // Logic: If image is small (< 600px), force it to fill the container 
        // similar to object-fit: contain.
        if (img.naturalWidth < 600 || img.naturalHeight < 600) {
             const aspect = img.naturalWidth / img.naturalHeight;
             // Container aspect ratio is roughly window width / 60vh. 
             // Let's assume container is somewhat landscape or square.
             
             // If portrait (taller), limit by height
             if (aspect < 1) {
                 img.style.height = '100%';
                 img.style.width = 'auto';
             } else {
                 // If landscape (wider), limit by width
                 img.style.width = '100%';
                 img.style.height = 'auto';
             }
        }
        
        if (cropper.value) cropper.value.destroy();
        cropper.value = new Cropper(img, {
            aspectRatio: NaN,
            viewMode: 1,
            autoCropArea: 0.9,
            responsive: true,
            restore: false,
            checkCrossOrigin: false,
            crop(event: any) {
               cropDimensions.value = {
                 width: Math.round(event.detail.width),
                 height: Math.round(event.detail.height)
               };
            },
        } as any);
    }
  } else {
    if (cropper.value) {
        cropper.value.destroy();
        cropper.value = null;
    }
  }
});

const handleConfirm = () => {
  if (cropper.value) {
    (cropper.value as any).getCroppedCanvas().toBlob((blob: Blob | null) => {
        if (blob) {
            emit('confirm', blob);
        }
    }, 'image/png');
  }
};

onUnmounted(() => {
    if (objectUrl.value) URL.revokeObjectURL(objectUrl.value);
    if (cropper.value) cropper.value.destroy();
});

const setAspectRatio = (ratio: number) => {

    (cropper.value as any)?.setAspectRatio(ratio);

};



</script>



<template>

  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">

    <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">

        

        <!-- Header -->

        <div class="p-4 border-b flex justify-between items-center">

            <h3 class="text-lg font-bold text-gray-800">Crop Image</h3>

            <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">

                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />

                </svg>

            </button>

        </div>



        <!-- Editor Area -->

        <div class="flex-1 overflow-hidden bg-gray-900 relative p-4 flex items-center justify-center min-h-[400px]">

             <!-- 

                Set a fixed height for the wrapper (e.g., 60vh) so height: 100% works.

                This prevents portrait images from overflowing the screen.

             -->

             <div class="w-full h-[60vh] flex items-center justify-center">

                 <img ref="imageRef" :src="objectUrl || ''" class="block max-w-full max-h-full mx-auto" />

             </div>

        </div>



        <!-- Toolbar -->

                <div class="p-4 border-t bg-gray-50 flex flex-wrap gap-4 justify-between items-center">

                    

                    <div class="flex items-center gap-4">

                         <div class="flex gap-2">

                            <button @click="setAspectRatio(1)" title="Square" class="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100">1:1</button>

                            <button @click="setAspectRatio(16/9)" title="Widescreen" class="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100">16:9</button>

                            <button @click="setAspectRatio(NaN)" title="Free Aspect Ratio" class="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100">Free</button>

                            <button @click="cropper?.reset()" class="p-2 text-sm bg-white border rounded hover:bg-gray-100 text-gray-600" title="Reset Crop">

                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>

                            </button>

                         </div>

                        <div class="text-sm text-gray-500 font-mono border-l pl-4 border-gray-300">

                            {{ cropDimensions.width }} x {{ cropDimensions.height }} px

                        </div>

                    </div>

                    <div class="flex gap-3">

                         <button 

                            @click="$emit('close')" 

                            class="px-5 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"

                        >

                            Cancel

                        </button>

                        <button 

                            @click="handleConfirm" 

                            class="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow hover:bg-indigo-700 transition-colors"

                        >

                            Apply Crop

                        </button>

                    </div>

                </div>

        

            </div>

          </div>

        </template>

        

        <style>

        /* Override CropperJS mosaic background */

        .cropper-bg {

          background: none !important;

        }

        </style>
