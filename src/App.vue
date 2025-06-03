<script setup>
import Navbar from './components/Navbar.vue'
</script>

<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <header>
      <Navbar />
    </header>

    <div class="container-fluid flex-grow-1">
      <div class="row">
        <!-- Sidebar Placeholder -->
        <!-- <nav id="sidebarMenu" class="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
          <div class="position-sticky pt-3">
            <ul class="nav flex-column">
              <li class="nav-item">
                <a class="nav-link active" aria-current="page" href="#">
                  <i class="bi bi-house-door-fill me-2"></i>
                  Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">
                  <i class="bi bi-file-earmark-text-fill me-2"></i>
                  Orders
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">
                  <i class="bi bi-cart-fill me-2"></i>
                  Products
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">
                  <i class="bi bi-people-fill me-2"></i>
                  Customers
                </a>
              </li>
               <li class="nav-item">
                <a class="nav-link" href="#">
                  <i class="bi bi-graph-up me-2"></i>
                  Reports
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">
                  <i class="bi bi-puzzle-fill me-2"></i>
                  Integrations
                </a>
              </li>
            </ul>

            <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted text-uppercase">
              <span>Saved reports</span>
              <a class="link-secondary" href="#" aria-label="Add a new report">
                <i class="bi bi-plus-circle-fill"></i>
              </a>
            </h6>
            <ul class="nav flex-column mb-2">
              <li class="nav-item">
                <a class="nav-link" href="#">
                  <i class="bi bi-graph-up-arrow me-2"></i>
                  Current month
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">
                  <i class="bi bi-graph-up-arrow me-2"></i>
                  Last quarter
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">
                  <i class="bi bi-graph-up-arrow me-2"></i>
                  Social engagement
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">
                  <i class="bi bi-graph-up-arrow me-2"></i>
                  Year-end sale
                </a>
              </li>
            </ul>
          </div>
        </nav> -->

        <!-- Login -->
        <router-view />
             
      </div>
    </div>
    <footer class="bg-dark text-white text-center p-3 mt-auto">
      <p>&copy; {{ new Date().getFullYear() }} FADAA-MCM. All rights reserved.</p>
    </footer>
  </div>
</template>

<style>
/* Global styles are now primarily in src/style.css */
/* App.vue specific styles can be added here if necessary for layout that isn't covered by Bootstrap or global styles. */

/* Example: If #app needs specific flex properties not handled by .d-flex.flex-column.min-vh-100 */
/* #app {
  some-property: value;
} */
</style>
