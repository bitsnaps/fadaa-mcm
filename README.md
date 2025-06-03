**Global Guide lines:**

*   We'll be using Vue3 for the frontend.
*   We'll be using Node and Hono for the backend.
*   We'll be using PostgreSQL for the database.
*   We'll be using Git for version control.

** Main Color Scheme:**
*   **Yellow:** ##FFD700
*   **Orange:** #FD9800

---

**Task 1: Foundational UI, Core User Roles, and Superadmin/Assistant Dashboards (MVP Shell)**

*   **Focus:** Establish the visual identity, navigation, core user roles (FADAA internal), basic data structures, and the primary dashboards for Superadmin and Assistant. Get a clickable, visually representative shell of the application for FADAA's internal users.
*   **Duration Estimate:** **10 - 16 weeks**

*   **Key Deliverables & Scope from PRD:**
    1.  **UI/UX Foundation & "Homepage" (Dashboards):**
        *   Develop the overall application shell: layout, navigation menu structure, branding elements.
        *   Implement login/authentication UI.
        *   **Superadmin Dashboard (UI & Basic Data Hooks - 4.8.1):** Design and build the UI for the Superadmin dashboard including widgets for:
            *   Overall business health (mock/placeholder data initially).
            *   Branch performance comparison (list/table view).
            *   User activity summary (placeholder).
            *   Pending approvals section (for future "En instance" bookings - 4.3.4, high-value expenses - 4.5.1).
            *   Key alerts section (placeholder).
        *   **Assistant Dashboard (UI & Basic Data Hooks - 4.8.2):** Design and build the UI for the Assistant dashboard including:
            *   Client contract renewal list (table view, mock data).
            *   Expiring contracts list (table view, mock data).
            *   Prospect list (table view, mock data).
            *   Office status overview (simple display, mock data).
            *   Tasks assigned / pending expense approvals (placeholder).
        *   Basic UI for list views (tables) with sorting, pagination, and search capabilities.
        *   Data Export stubs (UI buttons for Excel, CSV, PDF - 4.8.3) without full functionality yet.
    2.  **Core User Roles & Account Management (FADAA Internal):**
        *   Backend for User Authentication & Authorization (Superadmin, Assistant roles primarily - 3.1, 3.2).
        *   Superadmin: Create, edit, activate/deactivate Assistant accounts (4.2.2 - First Name, Last Name, Email, Phone, Password, Role, Assigned Branch(es)). Email verification (5.7.1).
        *   Initial setup for Superadmin accounts (4.2.1).
    3.  **Branch Management (Basic CRUD for Superadmin):**
        *   Superadmin can create and manage branches (name, location - 4.1.1).
        *   Data models for Branches.
    4.  **Office Management (Basic Structure & Statuses for Superadmin):**
        *   Superadmin can define offices with Number/ID, Branch, Space (superficie in m²) (4.3.1).
        *   Implement core Office Statuses in the backend: Nouveau, En instance, Occupé, Actif, Inactif (4.3.2).
        *   Superadmin: List offices per branch with statuses (4.3.3). Basic UI for this.
    5.  **Non-Functional Requirements (Initial Focus):**
        *   **Usability (5.4):** Focus on intuitive navigation and clear presentation for Superadmin and Assistant dashboards.
        *   **Security (5.2):** Secure login, basic role-based access for implemented features. HTTPS setup.
        *   **Data Validation (5.7):** Basic input validation for user and branch creation forms.
        *   **Maintainability (5.6):** Establish good project structure and coding standards.

---

**Task 2: FADAA Operational Core & Financials**

*   **Focus:** Build out the core functionalities FADAA staff (Superadmin, Assistant) need to manage clients, detailed office operations, and internal finances. This involves significant backend logic and connecting it to the UI shells built in Task 1.
*   **Duration Estimate:** **14 - 20 weeks**

*   **Key Deliverables & Scope from PRD:**
    1.  **Client (Tenant) Management (Full Cycle - 4.4):**
        *   Assistants/Superadmins: Add new clients (all fields from 4.4.1, including file attachments).
        *   Office booking during client creation (office must be available).
        *   Client Type/Service Type definitions (4.4.2).
        *   Automated Contract Renewal List generation (<15 days) & UI actions (4.4.3).
        *   Client Statuses management (4.4.4).
        *   End of Contract / Deletion to Prospect List logic (4.4.5). Office availability updates. Superadmin permanent deletion.
    2.  **Office Management (Advanced & Booking Workflow - 4.3):**
        *   Full "En instance" office booking workflow (4.3.4): Assistant attempt, system prevention if "Nouveau" available, Superadmin approval dashboard integration, notification logic.
        *   Superadmin management of "Actif/Inactif" office status.
    3.  **Financial Management (FADAA Operations - 4.5):**
        *   Expense Management:
            *   Superadmin defines fixed costs (yearly/ad-hoc, 4.5.1).
            *   Superadmin defines expense categories (4.5.1).
            *   Assistants declare variable costs (assigned branches, predefined categories, Superadmin approval if above threshold - 4.5.1).
        *   Revenue Management (derived from client contracts - 4.5.2).
        *   Branch net profit calculation (Revenues - Fixed - Variable Costs - 4.1.2).
    4.  **Investor Account Management (by Superadmin - 4.2.3):**
        *   Superadmin creates Investor accounts (details, investment per branch: amount, % share, contract dates). Many-to-many with branches.
        *   Investment contract end date calculation.
    5.  **Notification System (Initial Implementation - 4.9):**
        *   Investor contract expiration (Superadmin, Assistant - 4.9.1).
        *   High-value monetary transaction (Superadmin - 4.9.2).
        *   "En instance" office booking requests (Superadmin - 4.9.3).
    6.  **Dashboard Enhancements:**
        *   Populate Superadmin and Assistant dashboards with real data from implemented features.
        *   Enable basic filtering and sorting on dashboard tables.
    7.  **Non-Functional Requirements (Continued Focus):**
        *   **Performance (5.1):** Ensure common operations (client/office lists, financial calculations) are performant.
        *   **Security (5.2):** Secure handling of financial data and PII.
        *   **Reliability (5.5):** Basic data backup procedures.
        *   **Data Validation (5.7):** Comprehensive validation for all new forms and financial inputs.

---

**Task 3: External Portals (Investor & Client), Advanced Reporting & System Polish**

*   **Focus:** Develop the portals for external users (Investors and Clients), implement comprehensive audit trails, finalize notifications, and ensure all NFRs are met. This includes the value-added CRM/Financial tools for clients.
*   **Duration Estimate:** **12 - 18 weeks**

*   **Key Deliverables & Scope from PRD:**
    1.  **Investor Portal & Reporting (Full - 4.6):**
        *   Dedicated Investor login and portal.
        *   Display investment details, profit share history, documents (4.6.2).
        *   Implement interactive statistics and graphs (ROI, net profit, profit share, revenue/expense breakdown) with filters (4.6.3).
        *   Investor Payout Calculation logic (linking to FADAA financials - 4.5.3).
    2.  **Client (Tenant) Portal: CRM & Financial Tools (Full - 3.4, 4.7):**
        *   Superadmin enables/disables Client Portal access (4.2.4).
        *   Dedicated Client login and isolated portal.
        *   Basic CRM: Contact management, lead/opportunity tracking, activity logging, task management (4.7.2).
        *   Basic Financial Tools: Client expense/income tracking (4.7.3).
        *   Tax Form Filing Aid (Algerian G50, G7, G12 - 4.7.4): Tools/templates to populate forms based on client-entered data.
        *   Strict data isolation between clients (4.7.5, 5.2.4).
    3.  **Audit Trail (Full Implementation - 4.10, 4.1.3):**
        *   Log key transactions (financial, user accounts, critical data changes).
        *   Ensure immutability of validated historical records.
    4.  **Notification System (Finalization - 4.9):**
        *   Implement any remaining notifications (e.g., client deletion - 4.9.4).
        *   Ensure notification delivery mechanisms are robust.
    5.  **Data Export (Full Functionality - 4.8.3):**
        *   Implement Excel, CSV, PDF export for all dashboards and data tables.
    6.  **Non-Functional Requirements (Full Compliance):**
        *   **Scalability (5.3):** Review and optimize for anticipated growth.
        *   **Reliability (5.5):** Implement full data backup and recovery plan (RPO/RTO).
        *   **Security (5.2):** Conduct security review/testing, especially for client portal and financial data. OWASP Top 10 considerations.
        *   **Legal & Compliance (5.8):** Ensure system aligns with Algerian law 18/07 and FADAA's ToS.
        *   **Performance (5.1):** Final performance tuning and testing under expected load.
    7.  **Success Metrics Implementation (7):**
        *   Ensure data points needed for success metrics are being captured.
    8.  **Documentation:** User manuals for each role, technical documentation.
