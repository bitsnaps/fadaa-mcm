# Project Overview

This document provides a high-level overview of the FADAA-MCM project, including its architecture, technologies, and key features.

## Summary

The project is a full-stack web application for management and consulting. It consists of a Vue.js single-page application (SPA) for the frontend and a Node.js backend API. The application is designed to be role-based, with different dashboards and permissions for administrators, assistants, investors, and clients.

## Frontend

The frontend is a modern Vue.js 3 application built with Vite.

*   **Framework:** [Vue.js 3](https://vuejs.org/) with the Composition API and `<script setup>` syntax.
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **UI Library:** [Bootstrap 5](https://getbootstrap.com/) with [BootstrapVueNext](https://bootstrap-vue-next.github.io/) for Vue components.
*   **State Management:** [Pinia](https://pinia.vuejs.org/) is used for centralized state management.
*   **Routing:** [Vue Router](https://router.vuejs.org/) handles client-side routing with a hash-based history. The routing includes authentication and role-based authorization middleware.
*   **HTTP Client:** [Axios](https://axios-http.com/) is used for making API requests to the backend.
*   **Internationalization:** [Vue I18n](https://vue-i18n.intlify.dev/) is used for localization, with support for English, French, and Arabic.

### Key Files and Directories

*   **`src/main.js`**: The entry point of the Vue application where the app is initialized with plugins like Pinia, Vue Router, and BootstrapVueNext.
*   **`src/router.js`**: Defines all client-side routes and implements navigation guards for authentication and role-based access control.
*   **`src/stores/`**: Contains Pinia store modules for managing global state.
    *   **`auth.js`**: Manages user authentication state, including the JWT token and user role.
    *   **`notification.js`**: Manages global notifications and alerts.
*   **`src/services/`**: Contains modules responsible for making API calls to the backend. Each service typically corresponds to a set of related API endpoints (e.g., `ClientService.js`, `InvestmentService.js`).
    *   **`ApiClient.js`**: The configured Axios instance used by all other services. It handles setting the base URL and authentication headers.
*   **`src/views/`**: Contains the top-level components for each page/route in the application.
*   **`src/components/`**: Contains reusable UI components used across different views (e.g., `Navbar.vue`, `Sidebar.vue`).
*   **`src/helpers/`**: Utility functions for common tasks like file handling (`files.js`) and displaying toasts (`toast.js`).
*   **`src/i18n.js`** and **`src/locales/`**: Configure and provide the translation strings for internationalization.

## Backend

The backend is a Node.js application built with the Hono framework.

*   **Framework:** [Hono](https://hono.dev/), a lightweight and fast web framework for Node.js.
*   **Database:** The application uses [Sequelize](https://sequelize.org/) as an ORM to interact with a relational database. It is configured to work with both MySQL and SQLite.
*   **Authentication:** Authentication is handled using JSON Web Tokens (JWT).
*   **API Structure:** The API is organized into a modular structure with routes, controllers, services, and models.
*   **Scheduled Tasks:** The application uses `node-cron` to run scheduled tasks, such as checking for expiring investments.

### Key Files and Directories

*   **`api/index.js`**: The main entry point for the backend. It initializes the Hono app, sets up middleware (CORS, static file serving), and registers all the API routes.
*   **`api/models/index.js`**: Configures the Sequelize database connection based on the environment and initializes all the database models.
*   **`api/models/`**: Defines the schema for each database table (e.g., `user.js`, `client.js`, `investment.js`).
*   **`api/routes/`**: Defines the API endpoints for each resource. Each file in this directory creates a Hono sub-app and attaches controller functions to specific routes (e.g., `users.js`, `contracts.js`).
*   **`api/controllers/`**: Contains the core business logic for handling API requests. Controllers process input, interact with models and services, and send back the HTTP response.
*   **`api/services/`**: Contains reusable logic that can be shared across different controllers, such as sending notifications (`notificationService.js`) or managing files (`fileService.js`).
*   **`api/middleware/`**: Contains Hono middleware functions, such as `auth.js` for verifying JWT tokens and `branchRestriction.js` for enforcing data access policies.
*   **`api/lib/`**: Contains utility libraries and helpers, such as `auth.js` for password hashing and token generation, and `filesHelper.js` for managing uploads.
*   **`api/cron/`**: Contains scheduled tasks that run at specific intervals, managed by `node-cron`.

## Design Architecture

The project follows a client-server architecture.

*   **Client (Frontend):** The Vue.js SPA is responsible for the user interface and user experience. It communicates with the backend via a RESTful API.
*   **Server (Backend):** The Node.js/Hono server provides the API endpoints for the frontend to consume. It handles business logic, data storage, and authentication.

This separation of concerns allows for independent development and deployment of the frontend and backend.

## General Rules:

- Do not use any third-party libraries or frameworks other than the ones provided unless it's really required.
- Use the latest version of the programming language and libraries or packages.
- Follow the coding standards and best practices.
- Write clean, readable, and maintainable code.
- Reuse code whenever possible.

## Project Rules:

1. Output only the code without any explanation unless asked.
2. Always try to use the existing code as much as possible.
3. Do not explain what you're going to do unless asked.
4. We always use `pnpm` instead of `npm` for all projects.
5. I'm always running both the frontend and the backend using `pnpm`, so you don't need to do so at any case.
6. Be brief and don't explain in details what you are doing, just focus on doing the task.
7. We use `vue3` and `bootstrap5` with `bootstrap-vue-next` library for the frontend in this project.
8. We use `Hono` with Node for the backend api in this project.
9. We do not manage migrations for this project, so you wont need to create them.
10. Do not make assumption about what could be available in the code, you even have to it lookup or ask the user.
11. Do not install any package until you ask for permission first.
12. We use `Vitest` for unit testing of the backend api in isolation from the DB, ORM...etc., and we use the pre-made `pnpm test` script command to check the test output.

## Commons repetitive mistakes to avoid:

- The `sortBy` prop for the `<BTable>` component from `bootstrap-vue-next` must be an array of strings.
- The `@activate-tab` event for the `<BTabs>` component should not be used to update the `v-model` of the active tab, as this can cause a recursive loop.
- Avoid importing compiler macros, like `defineExpose` in Vue components.


## Documentation & Spec

You can find more info about this project including: PRD, DB Schema, API Components... at the `docs` directory.
