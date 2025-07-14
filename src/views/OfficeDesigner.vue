<template>
  <div id="app" class="d-flex vh-100 vw-100">
    <!-- SETUP MODAL -->
    <div class="modal fade" id="setupModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">{{ $t('officeDesigner.setupModal.title') }}</h5>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">{{ $t('officeDesigner.setupModal.branchName') }}</label>
                        <input type="text" class="form-control" v-model="setup.branchName" :placeholder="$t('officeDesigner.setupModal.branchNamePlaceholder')">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">{{ $t('officeDesigner.setupModal.numFloors') }}</label>
                        <input type="number" class="form-control" v-model.number="setup.numFloors" min="1" max="10">
                    </div>
                    <div v-for="i in setup.numFloors" :key="i">
                        <label class="form-label">{{ $t('officeDesigner.setupModal.floorName', { floorNum: i }) }}</label>
                        <input type="text" class="form-control mb-2" v-model="setup.floorNames[i-1]" :placeholder="$t('officeDesigner.setupModal.floorNamePlaceholder')">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" @click="initializeProject">{{ $t('officeDesigner.setupModal.startDesigning') }}</button>
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
                    <label class="form-label">{{ $t('officeDesigner.editNameModal.newName') }}</label>
                    <input type="text" class="form-control" v-model="editingName" @keyup.enter="saveOfficeName">
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
            <div v-for="office in currentFloor.offices" :key="office.id"
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
            <h4 class="mb-0">{{ branchName }}</h4>
            <small class="text-muted">{{ $t('officeDesigner.main.title') }}</small>
        </div>

        <h5 class="mb-3">{{ $t('officeDesigner.main.floors') }}</h5>
        <ul class="nav nav-pills flex-column mb-3">
            <li v-for="(floor, index) in floors" :key="floor.id" class="nav-item mb-1">
                <a href="#" class="nav-link d-flex justify-content-between align-items-center" :class="{ active: currentFloorIndex === index }" @click="switchFloor(index)">
                    <span>{{ floor.name }}</span>
                    <i class="bi bi-x-circle" @click.stop="deleteFloor(index)"></i>
                </a>
            </li>
        </ul>
        <button class="btn btn-sm btn-outline-secondary mb-4" @click="addFloor">{{ $t('officeDesigner.main.addFloor') }}</button>

        <h5 class="mb-3">{{ $t('officeDesigner.main.tools') }}</h5>
        <div class="d-grid gap-2 mb-4">
            <button class="btn btn-primary" @click="addOffice('rectangle')"><i class="bi bi-plus-square-fill me-2"></i>{{ $t('officeDesigner.main.addOffice') }}</button>
            <button class="btn btn-info" @click="addOffice('circle')"><i class="bi bi-plus-circle-fill me-2"></i>{{ $t('officeDesigner.main.addDesk') }}</button>
        </div>

        <div v-if="selectedOfficeIds.length > 0" class="flex-grow-1">
            <h5 class="mb-3">{{ $t('officeDesigner.main.selection', { count: selectedOfficeIds.length }) }}</h5>
            
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
import { ref, reactive, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';
import interact from 'interactjs';
import { Modal } from 'bootstrap';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// State
const projectInitialized = ref(false);
const branchName = ref('');
const floors = ref([]);
const currentFloorIndex = ref(0);
const selectedOfficeIds = ref([]);
const isShiftPressed = ref(false);
const editingName = ref('');
const isSaving = ref(false);

let setupModal, editNameModal;
const setup = reactive({ branchName: 'My Coworking Space', numFloors: 1, floorNames: ['Ground Floor'] });

const bootstrapColors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'dark'];

// Computed Properties
const currentFloor = computed(() => floors.value[currentFloorIndex.value] || { offices: [] });

const officeStyle = (office) => ({
    width: `${office.width}px`,
    height: `${office.height}px`,
    transform: `translate(${office.x}px, ${office.y}px) rotate(${office.rotation}deg)`,
    backgroundColor: office.colorClass === 'custom' ? office.customColor : ''
});

// Methods
const initializeProject = () => {
    branchName.value = setup.branchName;
    floors.value = Array.from({ length: setup.numFloors }, (_, i) => ({
        id: Date.now() + i,
        name: setup.floorNames[i] || `Floor ${i + 1}`,
        offices: []
    }));
    projectInitialized.value = true;
    setupModal.hide();
    nextTick(initInteract);
};

const switchFloor = (index) => {
    currentFloorIndex.value = index;
    selectedOfficeIds.value = [];
    nextTick(initInteract);
};

const addFloor = () => {
    const newFloorName = prompt(t('officeDesigner.main.newFloorPrompt'), `Floor ${floors.value.length + 1}`);
    if (newFloorName) {
        floors.value.push({ id: Date.now(), name: newFloorName, offices: [] });
        switchFloor(floors.value.length - 1);
    }
};

const deleteFloor = (index) => {
    if (confirm(t('officeDesigner.main.deleteFloorConfirm', { floorName: floors.value[index].name }))) {
        floors.value.splice(index, 1);
        if (currentFloorIndex.value >= floors.value.length) {
            currentFloorIndex.value = Math.max(0, floors.value.length - 1);
        }
        switchFloor(currentFloorIndex.value);
    }
};

const addOffice = (shape) => {
    const newId = Date.now();
    currentFloor.value.offices.push({
        id: newId,
        name: `Office ${newId.toString().slice(-4)}`,
        x: 50, y: 50, width: 150, height: 100, rotation: 0,
        shape: shape, colorClass: 'bg-primary', customColor: '#0d6efd'
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

const changeSelected = (property, value) => {
    selectedOfficeIds.value.forEach(id => {
        const office = currentFloor.value.offices.find(o => o.id === id);
        if (office) {
            office[property] = value;
            if(property === 'customColor') office.colorClass = 'custom';
        }
    });
};

const openEditNameModal = () => {
    if (selectedOfficeIds.value.length !== 1) return;
    const office = currentFloor.value.offices.find(o => o.id === selectedOfficeIds.value[0]);
    editingName.value = office.name;
    editNameModal.show();
};

const saveOfficeName = () => {
    if (selectedOfficeIds.value.length !== 1) return;
    const office = currentFloor.value.offices.find(o => o.id === selectedOfficeIds.value[0]);
    office.name = editingName.value;
    editNameModal.hide();
};

const duplicateSelected = () => {
    const newOffices = [];
    selectedOfficeIds.value.forEach(id => {
        const original = currentFloor.value.offices.find(o => o.id === id);
        const newOffice = JSON.parse(JSON.stringify(original));
        newOffice.id = Date.now() + Math.random();
        newOffice.x += 20;
        newOffice.y += 20;
        newOffices.push(newOffice);
    });
    currentFloor.value.offices.push(...newOffices);
    nextTick(initInteract);
};

const deleteSelected = () => {
    currentFloor.value.offices = currentFloor.value.offices.filter(o => !selectedOfficeIds.value.includes(o.id));
    selectedOfficeIds.value = [];
};

const saveDesign = async () => {
    isSaving.value = true;
    const designData = {
        branchName: branchName.value,
        floors: floors.value
    };
    localStorage.setItem('officeDesign', JSON.stringify(designData));

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    isSaving.value = false;
    alert(t('officeDesigner.main.designSaved'));
};

const loadDesign = () => {
    const savedDesign = localStorage.getItem('officeDesign');
    if (savedDesign) {
        try {
            const designData = JSON.parse(savedDesign);
            if (designData && designData.branchName && designData.floors) {
                branchName.value = designData.branchName;
                floors.value = designData.floors;
                projectInitialized.value = true;
                nextTick(initInteract);
                return true;
            }
        } catch (e) {
            console.error("Failed to parse saved design:", e);
            localStorage.removeItem('officeDesign'); // Clear corrupted data
        }
    }
    return false;
};

const clearDesign = () => {
    if (confirm(t('officeDesigner.main.confirmReset'))) {
        localStorage.removeItem('officeDesign');
        window.location.reload();
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
                        const office = currentFloor.value.offices.find(o => o.id === id);
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
                        const office = currentFloor.value.offices.find(o => o.id === id);
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
                        const office = currentFloor.value.offices.find(o => o.id === id);
                        if (office) {
                           office.rotation = (office.rotation || 0) + event.da;
                        }
                    });
                }
            }
        });
};

// Lifecycle and Event Listeners
onMounted(() => {
    editNameModal = new Modal(document.getElementById('editNameModal'));

    if (!loadDesign()) {
        setupModal = new Modal(document.getElementById('setupModal'));
        setupModal.show();
    }
    
    const handleKeyDown = (e) => { if (e.key === 'Shift') isShiftPressed.value = true; };
    const handleKeyUp = (e) => { if (e.key === 'Shift') isShiftPressed.value = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        if (setupModal) setupModal.dispose();
        if (editNameModal) editNameModal.dispose();
    });
});

watch(currentFloorIndex, () => selectedOfficeIds.value = []);

</script>

<style scoped>
body {
    background-color: #f0f2f5;
    overflow: hidden; /* Prevent body scroll */
}
#app {
    display: flex;
    height: 100vh;
    width: 100vw;
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