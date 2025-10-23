<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import apiClient from '@/services/ApiClient';

// Props
const props = defineProps({
  modelValue: {
    type: [String, Number, null],
    default: null
  },
  items: {
    type: Array,
    default: () => []
  },
  fetchUrl: {
    type: String,
    default: null
  },
  fetchParams: {
    type: Object,
    default: () => ({})
  },
  pageSize: {
    type: Number,
    default: 20
  },
  debounce: {
    type: Number,
    default: 300
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: false
  },
  labelKey: {
    type: String,
    default: 'label'
  },
  valueKey: {
    type: String,
    default: 'id'
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'search', 'load-more', 'open', 'close']);

// Refs
const containerRef = ref(null);
const triggerRef = ref(null);
const dropdownRef = ref(null);
const searchInputRef = ref(null);
const optionsRef = ref(null);

// State
const isOpen = ref(false);
const searchQuery = ref('');
const highlightedIndex = ref(-1);
const loading = ref(false);
const loadingMore = ref(false);
const serverItems = ref([]);
const currentPage = ref(1);
const totalItems = ref(0);
const abortController = ref(null);

// Unique ID for ARIA
const dropdownId = `smart-select-${Math.random().toString(36).substr(2, 9)}`;

// Computed
const isServerMode = computed(() => !!props.fetchUrl);

const displayItems = computed(() => {
  if (isServerMode.value) {
    return serverItems.value;
  } else {
    // Client-side filtering
    if (!searchQuery.value.trim()) {
      return props.items;
    }
    const query = searchQuery.value.toLowerCase();
    return props.items.filter(item => {
      const label = getItemLabel(item).toLowerCase();
      return label.includes(query);
    });
  }
});

const hasMorePages = computed(() => {
  if (!isServerMode.value) return false;
  return serverItems.value.length < totalItems.value;
});

const selectedLabel = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) return '';
  
  const allItems = isServerMode.value ? serverItems.value : props.items;
  const selected = allItems.find(item => getItemValue(item) === props.modelValue);
  
  return selected ? getItemLabel(selected) : '';
});

// Helper functions
const getItemValue = (item) => item[props.valueKey];
const getItemLabel = (item) => item ? item[props.labelKey] : '';

const isSelected = (item) => {
  if (!item || props.modelValue === null) return false;
  return getItemValue(item) === props.modelValue;
};

// Dropdown control
const openDropdown = async () => {
  if (props.disabled || isOpen.value) return;
  
  isOpen.value = true;
  emit('open');
  
  await nextTick();
  searchInputRef.value?.focus();
  
  // Load full list for server mode if only the initial item is present
  if (isServerMode.value) {
    const shouldFetchFullList = serverItems.value.length <= 1;
    if (shouldFetchFullList) {
      await fetchServerItems(true); // `true` to reset the list
    }
  }
};

const closeDropdown = () => {
  if (!isOpen.value) return;
  
  isOpen.value = false;
  searchQuery.value = '';
  highlightedIndex.value = -1;
  emit('close');
};

const toggleDropdown = () => {
  if (isOpen.value) {
    closeDropdown();
  } else {
    openDropdown();
  }
};

// Selection
const selectItem = (item) => {
  emit('update:modelValue', getItemValue(item));
  closeDropdown();
};

const clearSelection = () => {
  emit('update:modelValue', null);
};

// Server-side fetch with debounce
let debounceTimer = null;

const fetchServerItems = async (reset = true) => {
  if (!props.fetchUrl) return;
  
  // Cancel previous request
  if (abortController.value) {
    abortController.value.abort();
  }
  
  abortController.value = new AbortController();
  
  const page = reset ? 1 : currentPage.value;
  if (reset) {
    loading.value = true;
    serverItems.value = [];
    currentPage.value = 1;
  } else {
    loadingMore.value = true;
  }
  
  try {
    const params = {
      q: searchQuery.value,
      page: page,
      pageSize: props.pageSize,
      ...props.fetchParams
    };
    
    const response = await apiClient.get(props.fetchUrl, {
      params: params,
      signal: abortController.value.signal
    });
    
    const data = response.data;
    
    if (reset) {
      serverItems.value = data.items || [];
    } else {
      serverItems.value = [...serverItems.value, ...(data.items || [])];
    }
    
    totalItems.value = data.total || 0;
    currentPage.value = page;
    
    emit('search', { query: searchQuery.value, results: data.items || [] });
    
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Fetch error:', error);
      serverItems.value = [];
      totalItems.value = 0;
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
    abortController.value = null;
  }
};

const loadMore = () => {
  if (loadingMore.value || !hasMorePages.value) return;
  
  currentPage.value += 1;
  emit('load-more', { page: currentPage.value });
  fetchServerItems(false);
};

const fetchInitialSelectedItem = async (id) => {
  if (!isServerMode.value || !id) return;
  
  // Check if the item is already in the list
  if (serverItems.value.some(item => getItemValue(item) === id)) {
    return;
  }
  
  // Construct a URL to fetch a single item.
  // This assumes a RESTful convention like /api/clients/123.
  // We remove the '-available' part for single-item fetching.
  const singleItemUrl = props.fetchUrl.replace('-available', '');
  
  loading.value = true;
  try {
    const response = await apiClient.get(`${singleItemUrl}/${id}`);
    if (response.data.success && response.data.item) {
      // Add the fetched item to the list if it's not already there
      const exists = serverItems.value.some(item => getItemValue(item) === getItemValue(response.data.item));
      if (!exists) {
        serverItems.value.unshift(response.data.item);
      }
    }
  } catch (error) {
    console.error(`Failed to fetch initial selected item ${id}:`, error);
  } finally {
    loading.value = false;
  }
};

// Watch search query with debounce
watch(searchQuery, (newQuery) => {
  clearTimeout(debounceTimer);
  highlightedIndex.value = -1;
  
  if (isServerMode.value) {
    // Server-side search with debounce
    debounceTimer = setTimeout(() => {
      fetchServerItems(true);
    }, props.debounce);
  } else {
    // Client-side search (emit for tracking)
    debounceTimer = setTimeout(() => {
      emit('search', { query: newQuery, results: displayItems.value });
    }, props.debounce);
  }
});

// Keyboard navigation
const handleTriggerKeydown = (e) => {
  if (props.disabled) return;
  
  switch (e.key) {
    case 'Enter':
    case ' ':
    case 'ArrowDown':
      e.preventDefault();
      openDropdown();
      break;
    case 'ArrowUp':
      e.preventDefault();
      openDropdown();
      break;
    case 'Escape':
      e.preventDefault();
      closeDropdown();
      break;
  }
};

const handleSearchKeydown = (e) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (highlightedIndex.value < displayItems.value.length - 1) {
        highlightedIndex.value++;
        scrollToHighlighted();
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (highlightedIndex.value > 0) {
        highlightedIndex.value--;
        scrollToHighlighted();
      }
      break;
    case 'Home':
      e.preventDefault();
      highlightedIndex.value = 0;
      scrollToHighlighted();
      break;
    case 'End':
      e.preventDefault();
      highlightedIndex.value = displayItems.value.length - 1;
      scrollToHighlighted();
      break;
    case 'Enter':
      e.preventDefault();
      if (highlightedIndex.value >= 0 && highlightedIndex.value < displayItems.value.length) {
        selectItem(displayItems.value[highlightedIndex.value]);
      }
      break;
    case 'Escape':
      e.preventDefault();
      closeDropdown();
      triggerRef.value?.focus();
      break;
  }
};

const scrollToHighlighted = () => {
  nextTick(() => {
    const highlightedEl = optionsRef.value?.querySelector('.highlighted');
    if (highlightedEl) {
      highlightedEl.scrollIntoView({ block: 'nearest' });
    }
  });
};

// Click outside to close
const handleClickOutside = (e) => {
  if (containerRef.value && !containerRef.value.contains(e.target)) {
    closeDropdown();
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  if (isServerMode.value && props.modelValue) {
    fetchInitialSelectedItem(props.modelValue);
  }
});

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue, oldValue) => {
  if (newValue !== oldValue && isServerMode.value && newValue) {
    fetchInitialSelectedItem(newValue);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  clearTimeout(debounceTimer);
  if (abortController.value) {
    abortController.value.abort();
  }
});
</script>

<template>
  <div 
    class="smart-select" 
    :class="{ 'disabled': disabled }"
    ref="containerRef"
  >
    <!-- Selected value display / trigger -->
    <div
      ref="triggerRef"
      class="smart-select-trigger form-control d-flex align-items-center justify-content-between"
      :class="{ 'is-invalid': false }"
      tabindex="0"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-controls="dropdownId"
      :aria-activedescendant="highlightedIndex >= 0 ? `${dropdownId}-item-${highlightedIndex}` : undefined"
      :aria-disabled="disabled"
      @click="toggleDropdown"
      @keydown="handleTriggerKeydown"
    >
      <span v-if="selectedLabel" class="smart-select-value">{{ selectedLabel }}</span>
      <span v-else class="smart-select-placeholder text-muted">{{ placeholder || 'Select...' }}</span>
      <div class="smart-select-icons d-flex align-items-center gap-1">
        <button
          v-if="clearable && modelValue !== null && modelValue !== undefined"
          type="button"
          class="btn btn-link btn-sm p-0 text-secondary"
          style="line-height: 1;"
          @click.stop="clearSelection"
          aria-label="Clear selection"
        >
          <span aria-hidden="true">&times;</span>
        </button>
        <span class="dropdown-arrow" :class="{ 'rotated': isOpen }">▼</span>
      </div>
    </div>

    <!-- Dropdown panel -->
    <div
      v-show="isOpen"
      :id="dropdownId"
      ref="dropdownRef"
      class="smart-select-dropdown"
      role="listbox"
    >
      <!-- Search input -->
      <div class="smart-select-search p-2 border-bottom">
        <input
          ref="searchInputRef"
          type="text"
          class="form-control form-control-sm"
          placeholder="Search..."
          v-model="searchQuery"
          @keydown="handleSearchKeydown"
          aria-label="Search options"
        />
      </div>

      <!-- Options list -->
      <div class="smart-select-options" ref="optionsRef">
        <!-- Loading indicator -->
        <div v-if="loading" class="smart-select-loading p-3 text-center text-muted">
          <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Loading...
        </div>

        <!-- No results -->
        <div 
          v-else-if="displayItems.length === 0" 
          class="smart-select-no-results p-3 text-center text-muted"
        >
          No results found
        </div>

        <!-- Options -->
        <template v-else>
          <div
            v-for="(item, index) in displayItems"
            :key="getItemValue(item)"
            :id="`${dropdownId}-item-${index}`"
            class="smart-select-option px-3 py-2"
            :class="{
              'active': isSelected(item),
              'highlighted': highlightedIndex === index
            }"
            role="option"
            :aria-selected="isSelected(item)"
            @click="selectItem(item)"
            @mouseenter="highlightedIndex = index"
          >
            {{ getItemLabel(item) }}
          </div>

          <!-- Load more button (server-side only) -->
          <div
            v-if="isServerMode && hasMorePages"
            class="smart-select-load-more p-2 border-top"
          >
            <button
              type="button"
              class="btn btn-sm btn-outline-secondary w-100"
              :disabled="loadingMore"
              @click="loadMore"
            >
              <span v-if="loadingMore" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ loadingMore ? 'Loading...' : 'Load more' }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.smart-select {
  position: relative;
  width: 100%;
}

.smart-select.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.smart-select-trigger {
  cursor: pointer;
  user-select: none;
  min-height: 38px;
  padding-right: 2.5rem;
  position: relative;
}

.smart-select-trigger:focus {
  outline: none;
  border-color: #86b7fe;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.smart-select-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.smart-select-placeholder {
  flex: 1;
}

.smart-select-icons {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
}

.dropdown-arrow {
  font-size: 0.7em;
  transition: transform 0.2s;
  display: inline-block;
  color: #6c757d;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.smart-select-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  display: flex;
  flex-direction: column;
}

.smart-select-search {
  flex-shrink: 0;
  background: #f8f9fa;
}

.smart-select-options {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.smart-select-option {
  cursor: pointer;
  transition: background-color 0.15s;
  border-bottom: 1px solid #f0f0f0;
}

.smart-select-option:last-child {
  border-bottom: none;
}

.smart-select-option:hover,
.smart-select-option.highlighted {
  background-color: #f8f9fa;
}

.smart-select-option.active {
  background-color: #0d6efd;
  color: white;
}

.smart-select-option.active:hover {
  background-color: #0b5ed7;
}

.smart-select-loading,
.smart-select-no-results {
  font-size: 0.875rem;
}

.smart-select-load-more {
  flex-shrink: 0;
  background: #f8f9fa;
}
</style>