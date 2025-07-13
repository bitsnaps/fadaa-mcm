<template>
  <div class="compliance-management-container container-fluid">
    <h2 class="mb-4">{{ $t('complianceManagement.title') }}</h2>

    <!-- Section 1: Compliance Status Overview -->
    <div class="row mb-4">
      <div class="col-md-4">
        <div class="card text-center shadow-sm h-100">
          <div class="card-body">
            <i class="bi bi-shield-check display-4 text-success mb-3"></i>
            <h5 class="card-title">{{ $t('complianceManagement.overview.overallStatus') }}</h5>
            <p class="card-text fs-4 fw-bold text-success">{{ $t('complianceManagement.overview.compliant') }}</p>
            <small class="text-muted">{{ $t('complianceManagement.overview.lastChecked') }}: {{ lastCheckDate }}</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-center shadow-sm h-100">
          <div class="card-body">
            <i class="bi bi-file-earmark-text display-4 text-fadaa-blue mb-3"></i>
            <h5 class="card-title">{{ $t('complianceManagement.overview.activeDocuments') }}</h5>
            <p class="card-text fs-4 fw-bold">{{ activeDocuments }}</p>
            <small class="text-muted">{{ $t('complianceManagement.overview.policiesAndProcedures') }}</small>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card text-center shadow-sm h-100">
          <div class="card-body">
            <i class="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
            <h5 class="card-title">{{ $t('complianceManagement.overview.activeAlerts') }}</h5>
            <p class="card-text fs-4 fw-bold text-warning">{{ activeAlerts }}</p>
            <small class="text-muted">{{ $t('complianceManagement.overview.needsAttention') }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Upcoming Deadlines -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-calendar-check-fill me-2"></i>{{ $t('complianceManagement.upcomingDeadlines.title') }}</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>{{ $t('complianceManagement.upcomingDeadlines.task') }}</th>
                    <th>{{ $t('complianceManagement.upcomingDeadlines.description') }}</th>
                    <th>{{ $t('complianceManagement.upcomingDeadlines.dueDate') }}</th>
                    <th>{{ $t('complianceManagement.upcomingDeadlines.priority') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="deadline in upcomingDeadlines" :key="deadline.id">
                    <td>{{ deadline.title }}</td>
                    <td>{{ deadline.description }}</td>
                    <td>{{ deadline.dueDate }}</td>
                    <td>
                      <span :class="`badge bg-${deadline.priority === 'High' ? 'danger' : deadline.priority === 'Medium' ? 'warning text-dark' : 'info'}`">
                        {{ getPriorityTranslation(deadline.priority) }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!upcomingDeadlines.length">
                    <td colspan="4" class="text-center text-muted">{{ $t('complianceManagement.upcomingDeadlines.noDeadlines') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Recent Compliance Activities -->
    <div class="row">
      <div class="col-12">
        <div class="card shadow-sm">
          <div class="card-header bg-fadaa-light-blue">
            <h5 class="mb-0"><i class="bi bi-list-task me-2"></i>{{ $t('complianceManagement.recentActivities.title') }}</h5>
          </div>
          <div class="card-body">
            <ul class="list-group list-group-flush">
              <li v-for="activity in recentActivities" :key="activity.id" class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                  <h6 class="mb-1">{{ activity.title }}</h6>
                  <small class="text-muted">{{ activity.date }}</small>
                </div>
                <p class="mb-1 text-muted small">{{ activity.description }}</p>
                <span :class="`badge bg-${activity.status === 'Completed' ? 'success' : activity.status === 'In Progress' ? 'primary' : 'secondary'}`">
                  {{ getActivityStatusTranslation(activity.status) }}
                </span>
                
              </li>
              <li v-if="!recentActivities.length" class="list-group-item text-center text-muted">
                {{ $t('complianceManagement.recentActivities.noActivities') }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const lastCheckDate = ref(new Date().toLocaleDateString());
const activeDocuments = ref(25);
const activeAlerts = ref(2);

const upcomingDeadlines = ref([
  {
    id: 1,
    title: 'Révision Politique AML',
    description: 'Mise à jour annuelle de la politique anti-blanchiment.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toLocaleDateString('fr-FR'),
    priority: 'High',
  },
  {
    id: 2,
    title: 'Formation Conformité RGPD',
    description: 'Session de formation pour les nouveaux employés.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toLocaleDateString('fr-FR'),
    priority: 'Medium',
  },
  {
    id: 3,
    title: 'Rapport Trimestriel Régulateur',
    description: 'Soumission du rapport Q3 aux autorités compétentes.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 45)).toLocaleDateString('fr-FR'),
    priority: 'High',
  },
   {
    id: 4,
    title: 'Test de Pénétration Système',
    description: 'Vérification annuelle de la sécurité des systèmes d\'information.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 60)).toLocaleDateString('fr-FR'),
    priority: 'Low',
  },
]);

const recentActivities = ref([
  {
    id: 1,
    title: 'Audit Interne de Sécurité',
    description: 'Vérification des protocoles de sécurité des données clients.',
    date: new Date(new Date().setDate(new Date().getDate() - 5)).toLocaleDateString('fr-FR'),
    status: 'Completed',
  },
  {
    id: 2,
    title: 'Mise à jour Logiciel de Surveillance',
    description: 'Déploiement de la dernière version du logiciel de surveillance des transactions.',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toLocaleDateString(),
    status: 'Completed',
  },
  {
    id: 3,
    title: 'Examen de la Documentation KYC',
    description: 'Revue des documents KYC pour les nouveaux clients du mois.',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toLocaleDateString(),
    status: 'In Progress',
  },
]);

const getPriorityTranslation = (priority) => {
  return t(`complianceManagement.upcomingDeadlines.priorities.${priority.toLowerCase()}`);
};

const getActivityStatusTranslation = (status) => {
  const key = status.replace(/\s+/g, '_').toLowerCase();
  return t(`complianceManagement.recentActivities.statuses.${key}`);
};

</script>

<style scoped>
.compliance-management-container {
  padding: 20px;
}

.card-header.bg-fadaa-light-blue {
  background-color: #e7f3fe; /* A light, professional blue */
  color: #0d6efd; /* FADAA Blue for text */
  border-bottom: 1px solid #dee2e6;
}

.text-fadaa-blue {
  color: #0D6EFD !important;
}

.display-4 {
  font-size: 3rem; /* Slightly smaller for card icons */
}

.badge {
  font-size: 0.8em;
}

.list-group-item h6 {
  font-weight: 500;
}

.card {
  margin-bottom: 1.5rem; /* Consistent spacing */
}
</style>