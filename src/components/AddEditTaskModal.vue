<script setup>
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  showModal: Boolean,
  task: Object,
});

const emit = defineEmits(['close', 'save']);

const form = ref({});

const isEditMode = computed(() => props.task && props.task.id);

watch(() => props.showModal, (isShown) => {
  if (isShown) {
    if (isEditMode.value) {
      form.value = { 
        ...props.task,
        due_date: props.task.due_date ? new Date(props.task.due_date).toISOString().split('T')[0] : ''
      };
    } else {
      form.value = {
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: new Date().toISOString().split('T')[0],
      };
    }
  }
}, { immediate: true });

function closeModal() {
  emit('close');
}

function save() {
  // Ensure due_date is in ISO format if it exists
  const payload = { ...form.value };
  if (payload.due_date) {
    payload.due_date = new Date(payload.due_date).toISOString();
  }
  emit('save', payload);
  closeModal();
}
</script>

<template>
  <div v-if="showModal" class="modal fade show d-block" tabindex="-1" @click.self="closeModal">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ isEditMode ? t('tasks.editTask') : t('tasks.addTask') }}</h5>
          <button type="button" class="btn-close" @click="closeModal"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="save">
            <div class="mb-3">
              <label for="task-title" class="form-label">{{ t('tasks.tableHeaders.title') }}</label>
              <input id="task-title" type="text" v-model="form.title" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="task-description" class="form-label">{{ t('tasks.tableHeaders.description') }}</label>
              <textarea id="task-description" v-model="form.description" class="form-control"></textarea>
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="task-priority" class="form-label">{{ t('tasks.tableHeaders.priority') }}</label>
                <select id="task-priority" v-model="form.priority" class="form-select">
                  <option value="low">{{ t('tasks.priorities.low') }}</option>
                  <option value="medium">{{ t('tasks.priorities.medium') }}</option>
                  <option value="high">{{ t('tasks.priorities.high') }}</option>
                  <option value="urgent">{{ t('tasks.priorities.urgent') }}</option>
                </select>
              </div>
              <div class="col-md-6 mb-3">
                <label for="task-status" class="form-label">{{ t('tasks.tableHeaders.status') }}</label>
                <select id="task-status" v-model="form.status" class="form-select">
                  <option value="pending">{{ t('tasks.statuses.pending') }}</option>
                  <option value="in_progress">{{ t('tasks.statuses.in_progress') }}</option>
                  <option value="completed">{{ t('tasks.statuses.completed') }}</option>
                  <option value="cancelled">{{ t('tasks.statuses.cancelled') }}</option>
                </select>
              </div>
            </div>
            <div class="mb-3">
              <label for="task-due-date" class="form-label">{{ t('tasks.tableHeaders.due_date') }}</label>
              <input id="task-due-date" type="date" v-model="form.due_date" class="form-control" />
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">{{ t('common.cancel') }}</button>
          <button type="button" class="btn btn-primary" @click="save">{{ t('common.save') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  background-color: rgba(0,0,0,0.5);
}
</style>