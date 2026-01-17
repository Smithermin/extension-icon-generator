<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'file-selected', file: File): void
}>();

const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const onDragOver = () => {
  isDragging.value = true;
};

const onDragLeave = () => {
  isDragging.value = false;
};

const onDrop = (event: DragEvent) => {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    validateAndEmit(files[0]);
  }
};

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    validateAndEmit(target.files[0]);
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const validateAndEmit = (file: File) => {
  if (file.type.startsWith('image/')) {
    emit('file-selected', file);
  } else {
    alert('Please upload an image file.');
  }
};
</script>

<template>
  <div
    class="w-full max-w-md p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors"
    :class="[
      isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
    ]"
    @dragover.prevent="onDragOver"
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
    @click="triggerFileInput"
  >
    <input
      type="file"
      ref="fileInput"
      class="hidden"
      accept="image/*"
      @change="onFileChange"
    />
    <div class="text-center">
      <p class="text-gray-600 font-medium">
        {{ isDragging ? 'Drop image here' : 'Click or Drag & Drop to Upload' }}
      </p>
      <p class="text-xs text-gray-400 mt-2">Supports PNG, JPG, WEBP</p>
    </div>
  </div>
</template>
