<template>
  <div class="client-portal-container container-fluid">
    <h2 class="mb-4">Portail Client</h2>

    <!-- Section: Contract Management -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-file-text-fill me-2"></i>Gestion des Contrats</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>ID Contrat</th>
                    <th>Service</th>
                    <th>Date de Début</th>
                    <th>Date de Fin</th>
                    <th>Statut</th>
                    <th>Document</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="contract in contracts" :key="contract.id">
                    <td>{{ contract.id }}</td>
                    <td>{{ contract.service }}</td>
                    <td>{{ contract.startDate }}</td>
                    <td>{{ contract.endDate }}</td>
                    <td><span :class="`badge bg-${getContractStatusClass(contract.status)}`">{{ contract.status }}</span></td>
                    <td>
                      <a :href="contract.documentUrl" target="_blank" class="btn btn-sm btn-outline-primary" :disabled="!contract.documentUrl || contract.documentUrl === '#'">
                        <i class="bi bi-download me-1"></i> Voir
                      </a>
                    </td>
                  </tr>
                  <tr v-if="!contracts.length">
                    <td colspan="6" class="text-center text-muted">Aucun contrat trouvé.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section: Payment History -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-credit-card-fill me-2"></i>Historique des Paiements</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>ID Paiement</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Facture</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="payment in paymentHistory" :key="payment.id">
                    <td>{{ payment.id }}</td>
                    <td>{{ payment.date }}</td>
                    <td>{{ payment.description }}</td>
                    <td>{{ payment.amount }}</td>
                    <td><span :class="`badge bg-${getPaymentStatusClass(payment.status)}`">{{ payment.status }}</span></td>
                    <td>
                      <a :href="payment.invoiceUrl" target="_blank" class="btn btn-sm btn-outline-primary" :disabled="!payment.invoiceUrl || payment.invoiceUrl === '#'">
                        <i class="bi bi-receipt me-1"></i> Voir
                      </a>
                    </td>
                  </tr>
                  <tr v-if="!paymentHistory.length">
                    <td colspan="6" class="text-center text-muted">Aucun historique de paiement trouvé.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section: Service Requests -->
    <div class="row mb-4">
      <div class="col-md-8">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-tools me-2"></i>Demandes de Service</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="request in serviceRequests" :key="request.id" class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                  <h6 class="mb-1">{{ request.type }} - {{ request.id }}</h6>
                  <small>{{ request.dateSubmitted }}</small>
                </div>
                <p class="mb-1">{{ request.description }}</p>
                <small>Statut: <span :class="`badge bg-${getServiceRequestStatusClass(request.status)}`">{{ request.status }}</span></small>
              </li>
              <li v-if="!serviceRequests.length" class="list-group-item text-center text-muted">Aucune demande de service trouvée.</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-plus-circle-dotted me-2"></i>Nouvelle Demande</h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="submitServiceRequest">
              <div class="mb-3">
                <label for="requestType" class="form-label">Type de Demande</label>
                <select class="form-select" id="requestType" v-model="newRequest.type" required>
                  <option disabled value="">Choisissez...</option>
                  <option>Maintenance</option>
                  <option>IT Support</option>
                  <option>Réservation</option>
                  <option>Autre</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="requestDescription" class="form-label">Description</label>
                <textarea class="form-control" id="requestDescription" rows="3" v-model="newRequest.description" required></textarea>
              </div>
              <button type="submit" class="btn btn-fadaa-blue w-100"><i class="bi bi-send-fill me-2"></i>Soumettre</button>
            </form>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useToast } from '@/helpers/toast';

const contracts = ref([
  { id: 'C001', service: 'Suite Bureaux Privée A', startDate: '15/01/2023', endDate: '14/01/2024', status: 'Actif', documentUrl: '#' },
  { id: 'C002', service: 'Poste de Travail Coworking', startDate: '01/06/2023', endDate: '31/12/2023', status: 'Expiré', documentUrl: '#' },
  { id: 'C003', service: 'Forfait Bureau Virtuel', startDate: '01/02/2024', endDate: '31/01/2025', status: 'En attente d\'activation', documentUrl: '#' }
]);

const paymentHistory = ref([
  { id: 'P001', date: '15/12/2023', description: 'Facture INV00123 - Suite A', amount: 1200.00, status: 'Payé', invoiceUrl: '#' },
  { id: 'P002', date: '15/11/2023', description: 'Facture INV00122 - Suite A', amount: 1200.00, status: 'Payé', invoiceUrl: '#' },
  { id: 'P003', date: '05/01/2024', description: 'Demande SR0045 - Nettoyage Extra', amount: 50.00, status: 'En attente', invoiceUrl: '#' }
]);

const serviceRequests = ref([
  { id: 'SR001', dateSubmitted: '10/01/2024', type: 'Maintenance', description: 'Climatiseur bureau A ne refroidit pas.', status: 'En cours' },
  { id: 'SR002', dateSubmitted: '05/01/2024', type: 'Support IT', description: 'Impossible de se connecter au Wi-Fi.', status: 'Résolu' },
  { id: 'SR003', dateSubmitted: '20/12/2023', type: 'Réservation', description: 'Demande de réservation salle B pour le 15 Jan.', status: 'Confirmé' }
]);

const newRequest = ref({
  type: '',
  description: ''
});

const { showErrorToast, showSuccessToast } = useToast();

const getContractStatusClass = (status) => {
  if (status === 'Actif') return 'success';
  if (status === 'Expiré') return 'secondary';
  if (status === 'En attente d\'activation') return 'warning text-dark';
  return 'light text-dark';
};

const getPaymentStatusClass = (status) => {
  if (status === 'Payé') return 'success';
  if (status === 'En attente') return 'warning text-dark';
  if (status === 'Échoué') return 'danger';
  return 'light text-dark';
};

const getServiceRequestStatusClass = (status) => {
  if (status === 'En cours') return 'info';
  if (status === 'Résolu') return 'success';
  if (status === 'Confirmé') return 'primary';
  if (status === 'Annulé') return 'danger';
  if (status === 'Nouveau') return 'warning text-dark';
  return 'secondary';
};

const submitServiceRequest = () => {
  if (!newRequest.value.type || !newRequest.value.description) {
    showErrorToast('Veuillez remplir tous les champs pour la demande de service.');
    return;
  }
  // Simulate submission
  serviceRequests.value.unshift({
    id: `SR${String(Date.now()).slice(-3)}`,
    dateSubmitted: new Date().toLocaleDateString('fr-FR'),
    type: newRequest.value.type,
    description: newRequest.value.description,
    status: 'Nouveau'
  });
  showSuccessToast('Demande de service soumise !');
  newRequest.value.type = '';
  newRequest.value.description = '';
};

</script>

<style scoped>
.client-portal-container {
  padding-top: 20px; /* Add padding if navbar is fixed */
}
.card-header {
  font-weight: 500;
}
.table th {
  font-weight: 600;
}
.badge {
  font-size: 0.85em;
}
</style>