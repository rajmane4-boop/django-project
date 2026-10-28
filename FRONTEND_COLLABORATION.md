# Smart MedTrack — React Frontend Collaboration & Architecture Dossier

> **Hybrid Django + React Architecture**  
> **Django 5 Backend** (Models, Atomic Transactions, Celery Watchdog, REST API) + **React 19 / Vite 6 Frontend** (Tailwind CSS, Glassmorphic UI, Reactive State Machine)

---

## 1. Executive Overview

Smart MedTrack has transitioned from an HTMX server-rendered prototype into a decoupled, modern web application:
- **Backend:** Retains all existing Python business logic (`scheduling.py`, `inventory.py`, `escalation.py`, `reports.py`, `acknowledgment.py`), Celery async workers, and SQLite/PostgreSQL models. A RESTful JSON bridge is mounted under `/api/`.
- **Frontend:** Written from the ground up in **React 19**, **Vite 6**, and **Tailwind CSS 3** located in the `frontend/` directory. Requests to `/api/*` are proxied to Django (`http://127.0.0.1:8000`) during development.
- **Zero Backend Compromise:** All 26 Django unit and integration tests pass cleanly (`Ran 26 tests, OK`).

---

## 2. Collaborator Division & Responsibilities Matrix

The frontend architecture is partitioned into two equal, modular domains:

| Module Domain | Lead Collaborator | Git Author | Components / Pages |
| :--- | :--- | :--- | :--- |
| **Part 1: Core Shell, Auth, Dashboard & Inventory** | **Collaborator 1** | `Arnav2739 <dhiwararnav14@gmail.com>` | - `context/AuthContext.jsx`<br>- `components/layout/*` (`Sidebar`, `Header`, `Layout`)<br>- `components/ui/*` (`StatusBadge`, `Modal`, `Toast`)<br>- `pages/auth/*` (`LoginPage`, `RegisterPage`)<br>- `pages/profile/ProfileSetupPage.jsx`<br>- `components/dashboard/*` (`DoseCard`, `AdherenceGauge`)<br>- `pages/dashboard/DashboardPage.jsx`<br>- `pages/medications/*` (`MedicationListPage`, `MedicationModal`) |
| **Part 2: Regimens, Caregiver Escalation & Clinical Reports** | **Collaborator 2** | `Pushkaraj Mane <pushkaraj.mane4gmail.com>` | - `pages/regimens/*` (`RegimenListPage`, `RegimenModal`)<br>- `pages/caregivers/*` (`CaregiverListPage`, `CaregiverModal`)<br>- `pages/caregiver-portal/CaregiverPortalPage.jsx`<br>- `pages/caregiver-ack/CaregiverAckPage.jsx`<br>- `pages/reports/AdherenceReportPage.jsx`<br>- `pages/reports/RequisitionManifestPage.jsx`<br>- `FRONTEND_COLLABORATION.md` |

---

## 3. Directory Layout

```
django-project/
├── core/
│   ├── settings.py           # SimpleCorsMiddleware & CSRF_TRUSTED_ORIGINS
│   ├── cors.py               # Zero-dependency CORS handler
│   └── urls.py               # Routes /api/ to medtrack.api_urls
├── medtrack/
│   ├── api.py                # REST endpoints (Auth, Doses, Inventory, Caregivers, Reports)
│   ├── api_urls.py           # URL mapping for /api/*
│   ├── models.py             # Untouched models (PatientProfile, Medication, Regimen, DoseEvent, etc.)
│   └── services/             # Untouched clinical & escalation services
└── frontend/                 # React 19 + Vite 6 Application Root
    ├── package.json
    ├── vite.config.js        # Port 5173 with proxy: /api -> http://127.0.0.1:8000
    ├── tailwind.config.js    # Clinical teal brand palette, glassmorphism
    ├── src/
    │   ├── api/
    │   │   └── client.js     # Centralized async API client & CSRF synchronization
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── components/
    │   │   ├── layout/       # Sidebar, Header, Layout
    │   │   ├── ui/           # StatusBadge, Modal, Toast
    │   │   └── dashboard/    # DoseCard, AdherenceGauge
    │   ├── pages/
    │   │   ├── auth/         # LoginPage, RegisterPage
    │   │   ├── profile/      # ProfileSetupPage (Routine anchors: Breakfast, Lunch, Dinner, Bedtime)
    │   │   ├── dashboard/    # DashboardPage (Telemetry, Adherence Ring, Today's Doses)
    │   │   ├── medications/  # MedicationListPage, MedicationModal
    │   │   ├── regimens/     # RegimenListPage, RegimenModal
    │   │   ├── caregivers/   # CaregiverListPage, CaregiverModal
    │   │   ├── caregiver-portal/ # CaregiverPortalPage (Live Watchdog & Multi-patient roster)
    │   │   ├── caregiver-ack/    # CaregiverAckPage (/caregiver/ack/:token frictionless response)
    │   │   └── reports/      # AdherenceReportPage, RequisitionManifestPage
    │   ├── App.jsx           # React Router DOM configuration & protected route guard
    │   └── main.jsx
```

---

## 4. RESTful API Interface Specification (`/api/*`)

All JSON endpoints automatically read and inject Django `X-CSRFToken` cookies for mutating requests (`POST`, `PUT`, `DELETE`).

### Authentication & Profile
- `GET /api/auth/csrf/` → `{ csrfToken: string }`
- `POST /api/auth/login/` → Body: `{ username, password }` → `{ success: true, user: {...} }`
- `POST /api/auth/register/` → Body: `{ username, password, first_name, last_name, email, timezone, emergency_phone, primary_physician }`
- `POST /api/auth/logout/` → `{ success: true }`
- `GET /api/auth/me/` → `{ authenticated: boolean, user: {...} }`
- `GET /api/profile/` → `{ timezone, emergency_phone, primary_physician, routine: { breakfast_time, lunch_time, dinner_time, bedtime } }`
- `PUT /api/profile/` → Updates patient profile & daily routine anchor times.

### Patient Intake & Doses
- `GET /api/dashboard/` → Returns `{ stats, doses, lowStockMeds }`
- `POST /api/doses/:id/take/` → Atomically marks dose as `TAKEN` (or `TAKEN_LATE`) using `select_for_update()` and decrements medication inventory units.
- `POST /api/doses/:id/skip/` → Marks dose as `SKIPPED`.

### Inventory & Regimens
- `GET /api/medications/` | `POST /api/medications/` | `PUT /api/medications/:id/` | `DELETE /api/medications/:id/`
- `GET /api/regimens/` | `POST /api/regimens/` | `PUT /api/regimens/:id/` | `DELETE /api/regimens/:id/`
  - Anchor choices: `BREAKFAST`, `LUNCH`, `DINNER`, `BEDTIME`, `CUSTOM`.
  - Offset minutes: `-60` to `+60`.

### Caregiver Escalation & Frictionless Ack (Phase 3)
- `GET /api/caregivers/` | `POST /api/caregivers/` | `PUT /api/caregivers/:id/` | `DELETE /api/caregivers/:id/`
- `GET /api/caregiver/portal/` → Live multi-patient monitor with urgent escalation triggers.
- `POST /api/caregiver/portal/dose/:id/action/` → Body: `{ action: 'TAKE' | 'SKIP' | 'FALSE_ALARM' }`
- `GET /api/caregiver/ack/:token/` → Validates cryptographic `TimestampSigner` token from SMS/Email links; returns dose event and patient info without requiring login.
- `POST /api/caregiver/ack/:token/` → Body: `{ action: 'TAKE' | 'FALSE_ALARM' | 'SKIP' }` → Completes intake and clears watchdog escalation alert.

### Clinical Audits & Pharmacy Manifests (Phase 4)
- `GET /api/reports/adherence/?days=30` → Full 30-day compliance scorecard, per-medication rates, and physician sign-off block.
- `GET /api/reports/requisition/?days=30&all=0` → Pharmacy purchase order manifest with rolling burn rates, remaining days, and 14-day lead-time buffer replenishment quantities.

---

## 5. Development & Execution Instructions for Collaborator 2

### Prerequisites
1. Python 3.12+ (Virtualenv in `.venv`)
2. Node.js v18+ and npm

### Step 1: Run Django Backend
From the root repository directory:
```bash
# Activate virtual environment
.venv\Scripts\activate.bat

# Apply migrations & seed demo data (if fresh DB)
python manage.py migrate
python manage.py seed_db

# Start Django development server
python manage.py runserver 8000
```
*Backend runs on `http://127.0.0.1:8000`.*

### Step 2: Run React Frontend
In a second terminal:
```bash
cd frontend
npm install        # (already installed, instant)
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### Step 3: Test Login & Personas
- **Patient 1 Persona:** User: `patient1`, Password: `medtrack123` (Ramesh Patel)
- **Patient 2 Persona:** User: `patient2`, Password: `medtrack123` (Sunita Sharma)
- **Frictionless Link Test:** Navigate directly to `/caregiver/ack/<token>` in your browser to verify token-based actioning.

### Step 4: Verification Commands
```bash
# Verify backend unit and integration test suite:
python manage.py test medtrack

# Verify frontend production build:
npm run build --prefix frontend
```

---

## 6. How Collaborator 2 Can Continue Development

Pushkaraj Mane (Collaborator 2) can seamlessly build upon this foundation:

1. **Enhanced Portal Analytics (`CaregiverPortalPage.jsx`):**
   - Add chart visualizations (e.g. SVG adherence bar charts) comparing adherence trends across all assigned patients.
2. **Push Notifications / Sound Alerts:**
   - In `CaregiverPortalPage.jsx`, trigger browser `Notification` API or audio chime when an urgent `TIER_1` or `TIER_2` alert appears.
3. **Pharmacy Manifest Export Options (`RequisitionManifestPage.jsx`):**
   - Add CSV or JSON export buttons alongside the existing print/PDF view for electronic EDI integration with local pharmacies.
4. **Offline Sync & Service Worker:**
   - Integrate PWA caching for offline dose review when network connectivity is intermittent.
