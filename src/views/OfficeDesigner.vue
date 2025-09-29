<template>
  <div id="app" class="d-flex vh-100">
    <!-- SETUP MODAL -->
    <div class="modal fade" id="setupModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ $t('officeDesigner.setupModal.title') }}</h5>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">{{ $t('officeDesigner.setupModal.branchName') }} <span class="text-danger">*</span></label>
                        <select class="form-select" v-model="setup.branchId" required>
                            <option v-for="branch in availableBranches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
                        </select>
                    </div>
                    <p v-if="!availableBranches.length" class="text-danger">{{ $t('officeDesigner.setupModal.noAvailableBranches') }}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-info" @click="closeSetup">{{ $t('common.cancel') }}</button>
                    <button type="button" class="btn btn-primary" @click="addBranchDesign" :disabled="!setup.branchId">{{ $t('officeDesigner.setupModal.startDesigning') }}</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- EDIT NAME MODAL -->
    <div class="modal fade" id="editNameModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header"><h5 class="modal-title">{{ $t('officeDesigner.editNameModal.title') }}</h5></div>
                <div class="modal-body">
                    <label class="form-label">{{ $t('officeDesigner.editNameModal.newName') }} <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" v-model="editingName" @keyup.enter="saveOfficeName" required>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">{{ $t('officeDesigner.editNameModal.cancel') }}</button>
                    <button type="button" class="btn btn-primary" @click="saveOfficeName">{{ $t('officeDesigner.editNameModal.save') }}</button>
                </div>
            </div>
        </div>
    </div>

    <!-- MAIN APP STRUCTURE -->
    <div v-if="projectInitialized" class="main-canvas-area">
        <div class="canvas">
            <div v-for="office in currentDesign.offices" :key="office.id"
                 class="office-object"
                 :class="[office.colorClass, `shape-${office.shape}`, { selected: selectedOfficeIds.includes(office.id) }]"
                 :style="officeStyle(office)"
                 :data-id="office.id"
                 @click="handleSelection($event, office.id)">
                {{ office.name }}
            </div>
        </div>
    </div>
         
    <div v-if="projectInitialized" class="control-panel">
        <div class="mb-4">
            <h4 class="mb-0">{{ currentDesign.branchName }}</h4>
            <small class="text-muted">{{ $t('officeDesigner.main.title') }}</small>
        </div>

        <h5 class="mb-3">{{ $t('officeDesigner.main.branches') }}</h5>
        <ul class="nav nav-pills flex-column mb-3">
            <li v-for="(design, index) in designs" :key="design.branchId" class="nav-item mb-1">
                <a href="javascript:void(0)" class="nav-link d-flex justify-content-between align-items-center" :class="{ active: currentDesignIndex === index }" @click.prevent="switchBranch(index)">
                    <span>{{ design.branchName }}</span>
                    <i class="bi bi-x-circle" @click.stop="deleteBranchDesign(index)"></i>
                </a>
            </li>
        </ul>
        <button class="btn btn-sm btn-outline-secondary mb-4" @click="openSetupModal">{{ $t('officeDesigner.main.addBranch') }}</button>

        <h5 class="mb-3">{{ $t('officeDesigner.main.tools') }}</h5>
        <div class="d-grid gap-2 mb-4">
            <button class="btn btn-primary" @click="addShape('rectangle')"><i class="bi bi-plus-square-fill me-2"></i>{{ $t('officeDesigner.main.addOffice') }}</button>
            <button class="btn btn-info" @click="addShape('circle')"><i class="bi bi-plus-circle-fill me-2"></i>{{ $t('officeDesigner.main.addDesk') }}</button>
        </div>

        <div v-if="selectedOfficeIds.length > 0" class="flex-grow-1">
            <h5 class="mb-3">{{ $t('officeDesigner.main.selection', { count: selectedOfficeIds.length }) }}</h5>
            
            <!-- Section: Coordinates viewer -->
            <div class="mb-3">
                <div class="row g-2 mb-2">
                    <div class="col">
                        <label class="form-label">X</label>
                        <input type="number" class="form-control" v-model.number="transformInputs.x" @change="updateSelectedOffices('x', transformInputs.x)">
                    </div>
                    <div class="col">
                        <label class="form-label">Y</label>
                        <input type="number" class="form-control" v-model.number="transformInputs.y" @change="updateSelectedOffices('y', transformInputs.y)">
                    </div>
                </div>
                <div class="row g-2">
                    <div class="col">
                        <label class="form-label">W</label>
                        <input type="number" class="form-control" v-model.number="transformInputs.width" @change="updateSelectedOffices('width', transformInputs.width)">
                    </div>
                    <div class="col">
                        <label class="form-label">H</label>
                        <input type="number" class="form-control" v-model.number="transformInputs.height" @change="updateSelectedOffices('height', transformInputs.height)">
                    </div>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="form-label">{{ $t('officeDesigner.main.layering') }}</label>
                <div class="btn-group w-100">
                    <button class="btn btn-outline-secondary" @click="changeLayer('send-to-back')"><i class="bi bi-arrow-down-square"></i></button>
                    <button class="btn btn-outline-secondary" @click="changeLayer('bring-to-front')"><i class="bi bi-arrow-up-square"></i></button>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label">{{ $t('officeDesigner.main.shape') }}</label>
                <select class="form-select" @change="changeSelected('shape', $event.target.value)">
                    <option value="rectangle">{{ $t('officeDesigner.main.rectangle') }}</option>
                    <option value="circle">{{ $t('officeDesigner.main.circle') }}</option>
                </select>
            </div>

            <div class="mb-3">
                <label class="form-label">{{ $t('officeDesigner.main.color') }}</label>
                <div class="d-flex flex-wrap gap-2">
                    <button v-for="color in bootstrapColors" :key="color" :class="`btn bg-${color}`" @click="changeSelected('colorClass', `bg-${color}`)"></button>
                    <input type="color" class="form-control form-control-color" @input="changeSelected('customColor', $event.target.value)">
                </div>
            </div>

            <div class="d-grid gap-2 mt-auto">
                <button v-if="selectedOfficeIds.length === 1" class="btn btn-outline-secondary" @click="openEditNameModal"><i class="bi bi-pencil-fill me-2"></i>{{ $t('officeDesigner.main.rename') }}</button>
                <button class="btn btn-outline-secondary" @click="duplicateSelected"><i class="bi bi-copy me-2"></i>{{ $t('officeDesigner.main.duplicate') }}</button>
                <button class="btn btn-outline-danger" @click="deleteSelected"><i class="bi bi-trash-fill me-2"></i>{{ $t('officeDesigner.main.delete') }}</button>
            </div>
        </div>
        <div v-else class="text-muted text-center mt-5">{{ $t('officeDesigner.main.noSelection') }}</div>
        
        <div class="mt-auto pt-3 border-top">
            <button class="btn btn-success w-100 mb-2" @click="saveDesign" :disabled="isSaving">
                <span v-if="isSaving" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                <i v-else class="bi bi-cloud-arrow-up-fill me-2"></i>
                {{ isSaving ? $t('officeDesigner.main.saving') : $t('officeDesigner.main.saveDesign') }}
            </button>
            <button class="btn btn-outline-danger w-100" @click="clearDesign"><i class="bi bi-arrow-counterclockwise me-2"></i>{{ $t('officeDesigner.main.resetDesign') }}</button>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import interact from 'interactjs';
import { Modal } from 'bootstrap';
import { useI18n } from 'vue-i18n';
import { useToast } from '@/helpers/toast';
import { getBranches } from '@/services/BranchService';

const router = useRouter();

const { t } = useI18n();
const { showSuccessToast, showErrorToast } = useToast();

// State
const projectInitialized = ref(false);
const designs = ref([]);
const currentDesignIndex = ref(-1);
const allBranches = ref([]);
const selectedOfficeIds = ref([]);
const isShiftPressed = ref(false);
const editingName = ref('');
const isSaving = ref(false);
const transformInputs = ref({ x: null, y: null, width: null, height: null });

let setupModal, editNameModal;
const setup = reactive({ branchId: null });

const bootstrapColors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'dark'];

// Computed Properties
const currentDesign = computed(() => {
    if (currentDesignIndex.value >= 0 && designs.value[currentDesignIndex.value]) {
        return designs.value[currentDesignIndex.value];
    }
    return { branchId: null, branchName: '', offices: [] };
});

const availableBranches = computed(() => {
    const designedBranchIds = designs.value.map(d => d.branchId);
    return allBranches.value.filter(b => !designedBranchIds.includes(b.id));
});

const officeStyle = (office) => ({
    width: `${office.width}px`,
    height: `${office.height}px`,
    transform: `translate(${office.x}px, ${office.y}px) rotate(${office.rotation}deg)`,
    backgroundColor: office.colorClass === 'custom' ? office.customColor : '',
    zIndex: office.zIndex
});

// Methods
const switchBranch = (index) => {
    currentDesignIndex.value = index;
    selectedOfficeIds.value = [];
    nextTick(initInteract);
};

const openSetupModal = () => {
    if (availableBranches.value.length === 0) {
        showErrorToast(t('officeDesigner.setupModal.noAvailableBranches'));
        return;
    }
    setup.branchId = availableBranches.value[0]?.id || null;
    setupModal.show();
}

const closeSetup = () => {
    setupModal.hide();
    if (!projectInitialized.value) {
        router.back();    
    }
}

const addBranchDesign = () => {
    if (!setup.branchId) return;
    const selectedBranch = allBranches.value.find(b => b.id === setup.branchId);
    if (!selectedBranch) return;

    designs.value.push({
        branchId: selectedBranch.id,
        branchName: selectedBranch.name,
        offices: []
    });
    
    if (!projectInitialized.value) {
        projectInitialized.value = true;
    }

    switchBranch(designs.value.length - 1);
    setupModal.hide();
};

const deleteBranchDesign = (index) => {
    const design = designs.value[index];
    if (confirm(t('officeDesigner.main.deleteBranchConfirm', { branchName: design.branchName }))) {
        designs.value.splice(index, 1);
        if (currentDesignIndex.value >= designs.value.length) {
            currentDesignIndex.value = Math.max(0, designs.value.length - 1);
        }
        if (designs.value.length === 0) {
            projectInitialized.value = false;
            openSetupModal();
        } else {
            switchBranch(currentDesignIndex.value);
        }
    }
};

const addShape = (shape) => {
    const newId = Date.now();
    currentDesign.value.offices.push({
        id: newId,
        name: `${shape=='circle'?'Desk':'Office'} ${currentDesign.value.offices.length + 1}`,
        x: 50, y: 50, width: 150, height: 100, rotation: 0,
        shape: shape, colorClass: `${shape=='circle'?'bg-info':'bg-primary'}`, customColor: '#0d6efd',
        zIndex: currentDesign.value.offices.length + 1
    });
    nextTick(initInteract);
};

const handleSelection = (event, officeId) => {
    event.stopPropagation();
    if (isShiftPressed.value) {
        const index = selectedOfficeIds.value.indexOf(officeId);
        if (index > -1) {
            selectedOfficeIds.value.splice(index, 1);
        } else {
            selectedOfficeIds.value.push(officeId);
        }
    } else {
        selectedOfficeIds.value = [officeId];
    }
};

const handleSelectionFromList = (officeId) => {
    // This allows clicking on the list item to select/deselect
    const index = selectedOfficeIds.value.indexOf(officeId);
    if (index > -1) {
        selectedOfficeIds.value.splice(index, 1);
    } else {
        selectedOfficeIds.value.push(officeId);
    }
};

const changeSelected = (property, value) => {
    selectedOfficeIds.value.forEach(id => {
        const office = currentDesign.value.offices.find(o => o.id === id);
        if (office) {
            office[property] = value;
            if(property === 'customColor') office.colorClass = 'custom';
        }
    });
};

const updateSelectedOffices = (property, value) => {
    if (value === null || value === '') return;
    const numericValue = Number(value);
    if (isNaN(numericValue)) return;

    selectedOfficeIds.value.forEach(id => {
        const office = currentDesign.value.offices.find(o => o.id === id);
        if (office) {
            office[property] = numericValue;
        }
    });
};

const openEditNameModal = () => {
    if (selectedOfficeIds.value.length !== 1) return;
    const office = currentDesign.value.offices.find(o => o.id === selectedOfficeIds.value[0]);
    editingName.value = office.name;
    editNameModal.show();
};

const saveOfficeName = () => {
    if (selectedOfficeIds.value.length !== 1) return;
    const office = currentDesign.value.offices.find(o => o.id === selectedOfficeIds.value[0]);
    office.name = editingName.value;
    editNameModal.hide();
};

const changeLayer = (direction) => {
    if (selectedOfficeIds.value.length === 0) return;

    const offices = currentDesign.value.offices;
    // Sort offices by zIndex to easily find min/max
    offices.sort((a, b) => a.zIndex - b.zIndex);

    if (direction === 'bring-to-front') {
        const maxZ = offices.length;
        selectedOfficeIds.value.forEach(id => {
            const office = offices.find(o => o.id === id);
            if (office) office.zIndex = maxZ + 1; // Move to top
        });
    } else if (direction === 'send-to-back') {
        selectedOfficeIds.value.forEach(id => {
            const office = offices.find(o => o.id === id);
            if (office) office.zIndex = 0; // Move to bottom
        });
    }

    // Re-normalize z-indexes to keep them sequential and clean
    offices.sort((a, b) => a.zIndex - b.zIndex);
    offices.forEach((office, index) => {
        office.zIndex = index + 1;
    });
};

const duplicateSelected = () => {
    const newOffices = [];
    selectedOfficeIds.value.forEach(id => {
        const original = currentDesign.value.offices.find(o => o.id === id);
        const newOffice = JSON.parse(JSON.stringify(original));
        newOffice.id = Date.now() + Math.random();
        newOffice.x += 20;
        newOffice.y += 20;
        newOffices.push(newOffice);
    });
    currentDesign.value.offices.push(...newOffices);
    nextTick(initInteract);
};

const deleteSelected = () => {
    currentDesign.value.offices = currentDesign.value.offices.filter(o => !selectedOfficeIds.value.includes(o.id));
    selectedOfficeIds.value = [];
};

const saveDesign = async () => {
    isSaving.value = true;
    localStorage.setItem('branchDesigns', JSON.stringify(designs.value));

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    isSaving.value = false;
    showSuccessToast(t('officeDesigner.main.designSaved'));
};

const loadDesigns = () => {
    const savedDesigns = localStorage.getItem('branchDesigns');
    if (savedDesigns) {
        try {
            const parsedDesigns = JSON.parse(savedDesigns);
            if (Array.isArray(parsedDesigns) && parsedDesigns.length > 0) {
                designs.value = parsedDesigns;
                currentDesignIndex.value = 0;
                projectInitialized.value = true;
                nextTick(initInteract);
                return true;
            }
        } catch (e) {
            console.error("Failed to parse saved designs:", e);
            localStorage.removeItem('branchDesigns');
        }
    }
    return false;
};

const clearDesign = () => {
    if (confirm(t('officeDesigner.main.confirmReset'))) {
        localStorage.removeItem('branchDesigns');
        // Reset state instead of reloading the page
        designs.value = [];
        currentDesignIndex.value = -1;
        projectInitialized.value = false;
        selectedOfficeIds.value = [];
        openSetupModal();
    }
};

const initInteract = () => {
    const gridSize = 10;
    interact('.office-object')
        .draggable({
            inertia: false,
            modifiers: [
                interact.modifiers.snap({
                    targets: [interact.createSnapGrid({ x: gridSize, y: gridSize })],
                    range: Infinity,
                    relativePoints: [{ x: 0, y: 0 }]
                })
            ],
            listeners: {
                move(event) {
                    const targetId = Number(event.target.dataset.id);
                    if (!selectedOfficeIds.value.includes(targetId)) return;
                    
                    selectedOfficeIds.value.forEach(id => {
                        const office = currentDesign.value.offices.find(o => o.id === id);
                        if(office){
                           office.x += event.dx;
                           office.y += event.dy;
                        }
                    });
                }
            }
        })
        .resizable({
            edges: { left: true, right: true, bottom: true, top: true },
            modifiers: [
                interact.modifiers.snapSize({
                    targets: [interact.createSnapGrid({ width: gridSize, height: gridSize })],
                })
            ],
            listeners: {
                move(event) {
                    const targetId = Number(event.target.dataset.id);
                    if (!selectedOfficeIds.value.includes(targetId)) return;
                    
                    selectedOfficeIds.value.forEach(id => {
                        const office = currentDesign.value.offices.find(o => o.id === id);
                        if (office) {
                            office.width = event.rect.width;
                            office.height = event.rect.height;
                            office.x += event.deltaRect.left;
                            office.y += event.deltaRect.top;
                        }
                    });
                }
            }
        })
        .gesturable({
            listeners: {
                move (event) {
                    const targetId = Number(event.target.dataset.id);
                    if (!selectedOfficeIds.value.includes(targetId)) return;

                    selectedOfficeIds.value.forEach(id => {
                        const office = currentDesign.value.offices.find(o => o.id === id);
                        if (office) {
                           office.rotation = (office.rotation || 0) + event.da;
                        }
                    });
                }
            }
        });
};

// Lifecycle and Event Listeners
const fetchBranches = async () => {
    try {
        const { data: response} = await getBranches();
        if (response.success){
            allBranches.value = response.data;
        } else {
            console.error("Failed to fetch branches. Reponse: ", response);
        }
    } catch (error) {
        console.error("Failed to fetch branches:", error);
        showErrorToast(t('errors.fetchFailed', { entity: 'branches' }));
    }
};

onMounted(async () => {
    editNameModal = new Modal(document.getElementById('editNameModal'));
    setupModal = new Modal(document.getElementById('setupModal'));

    await fetchBranches();

    if (!loadDesigns()) {
        openSetupModal();
    }
    
    const handleKeyDown = (e) => { if (e.key === 'Shift') isShiftPressed.value = true; };
    const handleKeyUp = (e) => { if (e.key === 'Shift') isShiftPressed.value = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    watch(selectedOfficeIds, (newVal) => {
        if (newVal.length === 1) {
            const office = currentDesign.value.offices.find(o => o.id === newVal[0]);
            if (office) {
                transformInputs.value = { x: office.x, y: office.y, width: office.width, height: office.height };
            }
        } else {
            // Clear inputs if multiple or no items are selected, as their values might differ.
            transformInputs.value = { x: null, y: null, width: null, height: null };
        }
    }, { deep: true });

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        if (setupModal) setupModal.dispose();
        if (editNameModal) editNameModal.dispose();
    });
});

</script>

<style scoped>
body {
    background-color: #f0f2f5;
    overflow: hidden; /* Prevent body scroll */
}
#app {
    display: flex;
    height: 100vh;
    width: auto;
}
.control-panel {
    width: 320px;
    background: #fff;
    padding: 1.5rem;
    box-shadow: 3px 0 15px rgba(0,0,0,0.05);
    z-index: 100;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}
.main-canvas-area {
    flex-grow: 1;
    position: relative;
    background-color: #e9ecef;
    background-image:
        linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
    background-size: 10px 10px; /* Grid size */
    overflow: hidden;
}
.canvas {
    width: 100%;
    height: 100%;
    position: relative;
}
.office-object {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-weight: 600;
    font-size: 1rem;
    cursor: move;
    user-select: none;
    box-sizing: border-box; /* Important for interact.js resizing */
    border: 2px solid transparent;
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    transition: box-shadow 0.2s, border-color 0.2s;
}
.office-object.selected {
    border-color: #0dcaf0;
    box-shadow: 0 0 0 3px rgba(13, 202, 240, 0.5);
    z-index: 50; /* Bring selected to front */
}
.shape-rectangle { border-radius: 4px; }
.shape-circle { border-radius: 50%; }

/* For rotation handle (pseudo-element) */
.office-object.selected::after {
    content: 'Alt+Drag';
    position: absolute;
    bottom: -30px;
    font-size: 10px;
    color: #fff;
    background: #343a40;
    padding: 2px 5px;
    border-radius: 3px;
    opacity: 0.7;
}
</style>