<template>
  <div class="dashboard-container container-fluid">
    <h2 class="mb-4">Assistant Dashboard</h2>

    <div class="row gy-4">
      <!-- Client Contract Renewals -->
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-file-earmark-text-fill me-2"></i>Client Contract Renewals</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="renewal in mockData.renewals" :key="renewal.id" class="list-group-item d-flex justify-content-between align-items-center">
                {{ renewal.clientName }} - {{ renewal.daysLeft }} days left
                <button class="btn btn-sm btn-fadaa-orange"><i class="bi bi-eye-fill me-1"></i>View</button>
              </li>
            </ul>
            <div v-if="!mockData.renewals.length" class="text-center text-muted mt-2">No pending renewals.</div>
          </div>
        </div>
      </div>

      <!-- Expiring Contracts -->
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-hourglass-split me-2"></i>Expiring Contracts (Next 30 Days)</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="contract in mockData.expiringContracts" :key="contract.id" class="list-group-item">
                {{ contract.clientName }} ({{ contract.officeSpace }})
              </li>
            </ul>
            <div v-if="!mockData.expiringContracts.length" class="text-center text-muted mt-2">No contracts expiring soon.</div>
          </div>
        </div>
      </div>

      <!-- Prospect List -->
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-person-lines-fill me-2"></i>Prospect List</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="prospect in mockData.prospects" :key="prospect.id" class="list-group-item d-flex justify-content-between align-items-center">
                {{ prospect.name }} - {{ prospect.status }}
                <button class="btn btn-sm btn-outline-fadaa-orange"><i class="bi bi-telephone-fill me-1"></i>Contact</button>
              </li>
            </ul>
            <div v-if="!mockData.prospects.length" class="text-center text-muted mt-2">No prospects in the list.</div>
          </div>
        </div>
      </div>

      <!-- Office Status Overview -->
      <div class="col-md-6 col-lg-8">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-building-check me-2"></i>Office Status Overview</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-sm table-hover">
                <thead class="table-light">
                  <tr>
                    <th>Office ID</th>
                    <th>Status</th>
                    <th>Occupancy</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="office in mockData.officeStatus" :key="office.id">
                    <td>{{ office.id }}</td>
                    <td><span :class="statusBadge(office.status)">{{ office.status }}</span></td>
                    <td>{{ office.occupancy }}</td>
                    <td>
                      <button class="btn btn-sm btn-fadaa-orange me-1"><i class="bi bi-pencil-square me-1"></i>Edit</button>
                      <button class="btn btn-sm btn-outline-secondary"><i class="bi bi-info-circle-fill me-1"></i>Details</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="!mockData.officeStatus.length" class="text-center text-muted mt-2">No office status data available.</div>
          </div>
        </div>
      </div>

      <!-- Tasks/Expense Approvals -->
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-check2-square me-2"></i>Tasks/Expense Approvals</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="approval in mockData.approvals" :key="approval.id" class="list-group-item d-flex justify-content-between align-items-center">
                {{ approval.item }} ({{ approval.type }})
                <div>
                  <button class="btn btn-sm btn-success me-1"><i class="bi bi-check-lg"></i></button>
                  <button class="btn btn-sm btn-danger"><i class="bi bi-x-lg"></i></button>
                </div>
              </li>
            </ul>
            <div v-if="!mockData.approvals.length" class="text-center text-muted mt-2">No pending approvals.</div>
          </div>
        </div>
      </div>

      <!-- Data Export Section -->
      <div class="col-12 mt-4">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-yellow">
            <h5 class="mb-0"><i class="bi bi-download me-2"></i>Data Export</h5>
          </div>
          <div class="card-body text-center">
            <button @click="exportData('excel')" class="btn btn-fadaa-orange me-2"><i class="bi bi-file-earmark-excel-fill me-1"></i>Excel</button>
            <button @click="exportData('csv')" class="btn btn-fadaa-orange me-2"><i class="bi bi-filetype-csv me-1"></i>CSV</button>
            <button @click="exportData('pdf')" class="btn btn-fadaa-orange"><i class="bi bi-file-earmark-pdf-fill me-1"></i>PDF</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const mockData = ref({
  renewals: [
    { id: 1, clientName: 'Client A', daysLeft: 15 },
    { id: 2, clientName: 'Client B', daysLeft: 25 },
  ],
  expiringContracts: [
    { id: 1, clientName: 'Client C', officeSpace: 'Office 101' },
    { id: 2, clientName: 'Client D', officeSpace: 'Office 202' },
  ],
  prospects: [
    { id: 1, name: 'Prospect X', status: 'Contacted' },
    { id: 2, name: 'Prospect Y', status: 'New Lead' },
  ],
  officeStatus: [
    { id: 'OFC001', status: 'Occupé', occupancy: '100%' },
    { id: 'OFC002', status: 'Nouveau', occupancy: '0%' },
    { id: 'OFC003', status: 'Actif', occupancy: '75%' },
    { id: 'OFC004', status: 'En instance', occupancy: 'Pending' },
  ],
  approvals: [
    { id: 1, item: 'Expense Report #123', type: 'Expense' },
    { id: 2, item: 'Task: Setup new client', type: 'Task' },
  ],
});

const exportData = (format) => {
  alert(`Exporting data to ${format}... (Placeholder - Full functionality in Task 3)`);
};

const statusBadge = (status) => {
  switch (status) {
    case 'Occupé': return 'badge bg-danger';
    case 'Nouveau': return 'badge bg-success';
    case 'Actif': return 'badge bg-primary';
    case 'En instance': return 'badge bg-warning text-dark';
    case 'Inactif': return 'badge bg-secondary'; // Added for consistency
    default: return 'badge bg-light text-dark';
  }
};

</script>

<style scoped>
/* Component-specific styles can go here if needed */
</style>