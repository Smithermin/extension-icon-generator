<script setup lang="ts">
const props = defineProps<{
  iconSrc: string | null;
}>();
</script>

<template>
  <div class="mt-8 space-y-8">
    <h2 class="text-sm font-bold uppercase text-gray-400 tracking-wider mb-4">Real-world Preview</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Scenario 1: Chrome Extension Bar -->
      <div class="bg-gray-100 rounded-xl p-4 border border-gray-200">
        <h3 class="text-xs font-semibold text-gray-500 mb-3 uppercase">Chrome Toolbar</h3>
        <!-- Chrome UI Mockup -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-300 p-2 flex items-center gap-2">
          <!-- Address Bar Mockup -->
          <div class="flex-1 bg-gray-100 rounded-full h-8 flex items-center px-3 text-xs text-gray-400">
            <span>https://google.com</span>
          </div>
          <!-- Extension Area -->
          <div class="flex items-center gap-3 px-2 border-l border-gray-200 pl-3">
             <!-- Generic Icons -->
             <div class="w-4 h-4 rounded-full bg-gray-300"></div>
             <div class="w-4 h-4 rounded-full bg-gray-300"></div>
             
             <!-- THE USER ICON (16px context) -->
             <div class="relative group cursor-pointer">
                <img 
                  v-if="iconSrc" 
                  :src="iconSrc" 
                  class="w-4 h-4 object-contain"
                  alt="Extension Icon"
                />
                <div v-else class="w-4 h-4 bg-indigo-100 border border-indigo-300 rounded-sm"></div>
                
                <!-- Tooltip -->
                <div class="absolute top-full right-0 mt-2 hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                  Your Extension
                </div>
             </div>
          </div>
          <!-- Menu -->
          <div class="w-1 h-4 border-r border-gray-300"></div>
          <div class="flex flex-col gap-[2px]">
             <div class="w-1 h-1 bg-gray-500 rounded-full"></div>
             <div class="w-1 h-1 bg-gray-500 rounded-full"></div>
             <div class="w-1 h-1 bg-gray-500 rounded-full"></div>
          </div>
        </div>
        <p class="text-[10px] text-gray-400 mt-2 text-center">Simulated 16px rendering</p>
      </div>

      <!-- Scenario 2: iOS Home Screen -->
      <div class="bg-gray-100 rounded-xl p-4 border border-gray-200 flex flex-col items-center">
        <h3 class="text-xs font-semibold text-gray-500 mb-3 uppercase">iOS Home Screen</h3>
        
        <!-- iPhone Wallpaper Mockup -->
        <div class="relative w-64 h-[300px] bg-gradient-to-b from-blue-300 to-pink-300 rounded-[2rem] shadow-inner overflow-hidden border-4 border-gray-800">
           <!-- Notch -->
           <div class="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-b-xl z-20"></div>
           
           <!-- Grid -->
           <div class="p-6 pt-12 grid grid-cols-4 gap-4">
              <!-- Random Apps -->
              <div v-for="i in 3" :key="i" class="flex flex-col items-center gap-1">
                 <div class="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-[10px]"></div>
                 <div class="w-8 h-1 bg-white/30 rounded-full"></div>
              </div>

              <!-- USER APP -->
              <div class="flex flex-col items-center gap-1">
                 <div class="w-11 h-11 bg-white rounded-[10px] shadow-sm overflow-hidden relative">
                    <img 
                      v-if="iconSrc" 
                      :src="iconSrc" 
                      class="w-full h-full object-cover" 
                      alt="App Icon"
                    />
                    <div v-else class="w-full h-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-400">?</div>
                 </div>
                 <span class="text-[8px] text-white font-medium drop-shadow-md">My App</span>
              </div>

              <!-- More Random Apps -->
              <div v-for="i in 11" :key="'more'+i" class="flex flex-col items-center gap-1">
                 <div class="w-11 h-11 bg-white/20 backdrop-blur-sm rounded-[10px]"></div>
                 <!-- <div class="w-8 h-1 bg-white/30 rounded-full"></div> -->
              </div>
           </div>

           <!-- Dock -->
           <div class="absolute bottom-2 left-2 right-2 h-16 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-around px-2">
              <div v-for="i in 4" :key="'dock'+i" class="w-11 h-11 bg-white/40 rounded-[10px]"></div>
           </div>
        </div>
      </div>

    </div>
  </div>
</template>
