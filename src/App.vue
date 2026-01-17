<script setup lang="ts">
import { ref, watch, reactive } from 'vue';
import DropZone from './components/upload/DropZone.vue';
import { useBackgroundRemoval } from './composables/useBackgroundRemoval';
import { useImageProcessor, type ProcessorConfig } from './composables/useImageProcessor';
import { useExport } from './composables/useExport';
import ScenarioPreview from './components/preview/ScenarioPreview.vue';
import ImageCropperModal from './components/upload/ImageCropperModal.vue';
import { EXPORT_PRESETS } from './config/export-presets';

const { removeBackground, isRemovingBackground } = useBackgroundRemoval();
const { processImage, isProcessing } = useImageProcessor();
const { createZip, isExporting, exportStatus } = useExport();

const originalFile = ref<File | null>(null);
const processedImageSrc = ref<string | null>(null);

// Cropper State
const isCropperOpen = ref(false);
const fileToCrop = ref<File | null>(null);

// Configuration State
const config = reactive<ProcessorConfig>({
  padding: 0.1,      // 10%
  borderRadius: 0,   // 0%
  backgroundColor: 'transparent',
  size: 1024         // Work at 1024x1204 internally
});

// Export Selection State
// Default select all available presets
const availablePresets = Object.values(EXPORT_PRESETS);
const selectedPlatformIds = ref<string[]>(availablePresets.map(p => p.id));

const isBackgroundRemoved = ref(false);
const rawNoBgBlob = ref<Blob | null>(null); // Cache the background-removed blob

// 1. Handle File Upload (Triggers Cropper)
const handleFileSelected = async (file: File) => {
  originalFile.value = file;
  isBackgroundRemoved.value = false;
  rawNoBgBlob.value = null;
  // Trigger initial processing
  await updatePreview();
};

// Handle Crop Confirmation
const handleCropConfirm = async (croppedBlob: Blob) => {
  isCropperOpen.value = false;
  
  // Convert Blob to File to keep downstream logic consistent
  const fileName = fileToCrop.value?.name || 'cropped-image.png';
  const croppedFile = new File([croppedBlob], fileName, { type: 'image/png' });

  originalFile.value = croppedFile;
  // If we crop, we might want to reset background removal state as the image content changed
  isBackgroundRemoved.value = false; 
  rawNoBgBlob.value = null;
  
  await updatePreview();
};

// 2. Toggle Background Removal
const toggleBackgroundRemoval = async () => {
  if (!originalFile.value) return;

  if (isBackgroundRemoved.value) {
    // User wants to remove background
    if (!rawNoBgBlob.value) {
      try {
        rawNoBgBlob.value = await removeBackground(originalFile.value);
      } catch (e) {
        isBackgroundRemoved.value = false; // Revert switch on failure
        alert("Could not remove background.");
        return;
      }
    }
  }
  // Re-run layout processing
  await updatePreview();
};

// 3. Main Update Pipeline
const updatePreview = async () => {
  const source = isBackgroundRemoved.value && rawNoBgBlob.value 
    ? rawNoBgBlob.value 
    : originalFile.value;
    
  if (!source) return;

  processedImageSrc.value = await processImage(source, config);
};

// Watchers for real-time updates
watch(
  () => [config.padding, config.borderRadius, config.backgroundColor],
  () => { if (originalFile.value) updatePreview(); }
);

// Demo Logic
const loadDemoImage = async () => {
  try {
    // A simple robot head SVG as a blob
    const demoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#6366f1"/><path d="M256 160c-52.9 0-96 43.1-96 96s43.1 96 96 96 96-43.1 96-96-43.1-96-96-96zm0 160c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z" fill="#ffffff"/><circle cx="200" cy="230" r="16" fill="#1e293b"/><circle cx="312" cy="230" r="16" fill="#1e293b"/></svg>`;
    const blob = new Blob([demoSvg], { type: 'image/svg+xml' });
    // Convert to File object to mimic upload
    const file = new File([blob], "demo-robot.svg", { type: "image/svg+xml" });
    await handleFileSelected(file);
  } catch (e) {
    console.error("Failed to load demo", e);
  }
};


</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-800 p-8 font-sans">
    
    <!-- Header -->
    <header class="mb-8 text-center">
      <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Extension Icon Generator</h1>
      <p class="text-slate-500 mt-2">Create perfect 16, 48, 128px icons for your browser extensions.</p>
    </header>

    <main class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Left: Editor Controls -->
      <section class="lg:col-span-1 space-y-6">
        
        <!-- Upload -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 class="text-sm font-bold uppercase text-gray-400 mb-4 tracking-wider">Source</h2>
          <DropZone @file-selected="handleFileSelected" />
          
          <div v-if="!originalFile" class="mt-4 text-center">
            <span class="text-xs text-gray-400">or</span>
            <button 
              @click="loadDemoImage"
              class="ml-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              Try with Sample Image
            </button>
          </div>

          <div v-if="originalFile" class="mt-4 flex flex-col gap-3">
             <div class="flex items-center justify-between text-xs text-gray-500">
                <div class="flex items-center gap-2">
                   <span class="w-2 h-2 rounded-full bg-green-500"></span>
                   <span class="truncate max-w-[150px]" :title="originalFile.name">{{ originalFile.name }}</span>
                </div>
                <button @click="originalFile = null; processedImageSrc = null" class="text-red-400 hover:text-red-600">
                  Remove
                </button>
             </div>
             
             <button 
                @click="() => { fileToCrop = originalFile; isCropperOpen = true; }" 
                class="w-full py-2 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200"
             >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                Crop / Edit Source
             </button>
          </div>
        </div>

        <!-- Cropper Modal -->
        <ImageCropperModal 
          :is-open="isCropperOpen" 
          :image-file="fileToCrop"
          @close="isCropperOpen = false"
          @confirm="handleCropConfirm"
        />

        <!-- Controls (Only visible if file loaded) -->
        <div v-if="originalFile" class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <h2 class="text-sm font-bold uppercase text-gray-400 mb-4 tracking-wider">Adjustments</h2>

          <!-- Background Removal -->
          <div class="flex items-center justify-between">
            <label class="font-medium text-gray-700">Remove Background</label>
            <button 
              @click="() => { isBackgroundRemoved = !isBackgroundRemoved; toggleBackgroundRemoval(); }"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              :class="isBackgroundRemoved ? 'bg-indigo-600' : 'bg-gray-200'"
              :disabled="isRemovingBackground"
            >
              <span 
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="isBackgroundRemoved ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>
          <div v-if="isRemovingBackground" class="text-xs text-indigo-500 animate-pulse">
            Running AI Model... (First run may be slow)
          </div>

          <!-- Padding Slider -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="font-medium text-gray-700">Padding</label>
              <span class="text-sm text-gray-500">{{ Math.round(config.padding * 100) }}%</span>
            </div>
            <input 
              type="range" min="0" max="0.5" step="0.01" 
              v-model.number="config.padding"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <!-- Border Radius -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="font-medium text-gray-700">Roundness</label>
              <span class="text-sm text-gray-500">{{ Math.round(config.borderRadius * 100) }}%</span>
            </div>
            <input 
              type="range" min="0" max="0.5" step="0.01" 
              v-model.number="config.borderRadius"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

           <!-- Background Color -->
           <div>
            <label class="font-medium text-gray-700 block mb-2">Background Color</label>
            <div class="flex gap-3">
              <button 
                v-for="color in ['transparent', '#ffffff', '#000000', '#f8fafc']"
                :key="color"
                @click="config.backgroundColor = color"
                class="w-8 h-8 rounded-full border-2 focus:ring-2 ring-indigo-500 ring-offset-2"
                :class="config.backgroundColor === color ? 'border-indigo-600' : 'border-gray-200'"
                :style="{ backgroundColor: color === 'transparent' ? '' : color }"
                :title="color"
              >
                <div v-if="color === 'transparent'" class="w-full h-full rounded-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhYWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')]"></div>
              </button>
            </div>
          </div>

        </div>
      </section>

      <!-- Right: Preview Canvas -->
      <section class="lg:col-span-2">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
           <h2 class="text-sm font-bold uppercase text-gray-400 mb-6 tracking-wider">Preview</h2>
           
           <div class="flex-1 flex items-center justify-center bg-slate-100 rounded-lg border-2 border-dashed border-slate-200 relative overflow-hidden min-h-[400px]">
              
              <!-- Loading Overlay -->
              <div v-if="isProcessing || isRemovingBackground" class="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm">
                <div class="flex flex-col items-center">
                  <svg class="animate-spin h-8 w-8 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span class="text-sm font-medium text-gray-600">
                    {{ isRemovingBackground ? 'Removing Background...' : 'Processing...' }}
                  </span>
                </div>
              </div>

              <!-- Main Preview Image -->
              <img 
                v-if="processedImageSrc" 
                :src="processedImageSrc" 
                class="max-w-[80%] max-h-[80%] shadow-2xl transition-all duration-300"
                alt="Preview" 
              />
              <div v-else class="text-center p-8">
                <div class="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900">No Image Loaded</h3>
                <p class="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                  Upload an image from the left panel or select the sample to see the magic happen.
                </p>
              </div>

           </div>

           <!-- Quick Actions -->
           <div v-if="processedImageSrc" class="mt-6 flex flex-col gap-4 items-end">
             
             <!-- Export Options -->
             <div class="flex flex-wrap justify-end gap-3 text-sm">
                <label 
                  v-for="preset in availablePresets" 
                  :key="preset.id"
                  class="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  :class="{ 'border-indigo-200 bg-indigo-50 text-indigo-700': selectedPlatformIds.includes(preset.id) }"
                >
                  <input 
                    type="checkbox" 
                    :value="preset.id" 
                    v-model="selectedPlatformIds"
                    class="accent-indigo-600 rounded"
                  />
                  <span class="font-medium">{{ preset.name }}</span>
                </label>
             </div>

             <div class="flex flex-wrap justify-end gap-4 items-center w-full">
                <div v-if="isExporting" class="flex items-center gap-2 text-sm font-medium text-indigo-600 animate-pulse">
                  <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ exportStatus }}
                </div>

                <button 
                    @click="createZip(processedImageSrc!, selectedPlatformIds)"
                    :disabled="isExporting || selectedPlatformIds.length === 0"
                    class="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                  <span>📦 Export ZIP</span>
                </button>

                <a 
                    :href="processedImageSrc" 
                    download="processed-icon.png"
                    class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                  >
                  Download PNG
                </a>
             </div>
           </div>

           <!-- Real-world Previews -->
           <ScenarioPreview :icon-src="processedImageSrc" />

        </div>
      </section>

    </main>
  </div>
</template>
