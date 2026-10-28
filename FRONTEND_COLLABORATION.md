# Smart MedTrack — React Frontend Collaboration & Architecture Dossier

> **Hybrid Django + React Architecture**  
> **Django 5 Backend** (Models, Atomic Transactions, Celery Watchdog, REST API) + **React 19 / Vite 6 Frontend** (Tailwind CSS, Glassmorphic UI, Reactive State Machine)

---

## 1. Executive Overview

Smart MedTrack has transitioned from an HTMX server-rendered prototype into a decoupled, modern web application:
- **Backend:** Retains all existing Python business logic (`scheduling.py`, `inventory.py`, `escalation.py`, `reports.py`, `acknowledgment.py`), Celery async workers, and SQLite/PostgreSQL models. A RESTful JSON bridge is mounted under `/api/`.
- **Frontend:** Written from the ground up in **React 19**, **Vite 6**, and **Tailwind CSS 3** located in the `frontend/` directory. Requests to `/api/*` are proxied to Django (`http://127.0.0.1:8000`) during development.
- **Zero Backend Compromise:** All 26 Django unit/integration tests and all multi-threaded concurrency stress tests pass cleanly (`OK`).

---

## 2. Collaborator Division & Responsibilities Matrix

The frontend and full-stack architecture is partitioned into two equal, modular domains:

| Module Domain | Lead Collaborator | Git Author | Components / Pages / Services |
| :--- | :--- | :--- | :--- |
| **Part 1: Core Shell, Auth, Dashboard & Inventory** | **Collaborator 1** | `Arnav2739 <dhiwararnav14@gmail.com>` | - `context/AuthContext.jsx`<br>- `components/layout/*` (`Sidebar`, `Header`, `Layout`)<br>- `components/ui/*` (`StatusBadge`, `Modal`, `Toast`)<br>- `pages/auth/*` (`LoginPage`, `RegisterPage`)<br>- `pages/profile/ProfileSetupPage.jsx`<br>- `components/dashboard/*` (`DoseCard`, `AdherenceGauge`)<br>- `pages/dashboard/DashboardPage.jsx`<br>- `pages/medications/*` (`MedicationListPage`, `MedicationModal`) |
| **Part 2: Regimens, Caregiver Escalation & Clinical Reports** | **Collaborator 2** | `Pushkaraj Mane <pushkaraj.mane4gmail.com>` | - `pages/regimens/*` (`RegimenListPage`, `RegimenModal`)<br>- `pages/caregivers/*` (`CaregiverListPage`, `CaregiverModal`)<br>- `pages/caregiver-portal/CaregiverPortalPage.jsx`<br>- `pages/caregiver-ack/CaregiverAckPage.jsx`<br>- `pages/reports/AdherenceReportPage.jsx`<br>- `pages/reports/RequisitionManifestPage.jsx`<br>- `utils/soundAlert.js` (Web Audio API Chime Engine)<br>- `utils/notifications.js` (Browser Push Dispatcher)<br>- `hooks/useOnlineStatus.js` (Network Sync Detector)<br>- `medtrack/tests_concurrency.py` (Race condition test suite)<br>- `medtrack/tasks.py` (Exponential backoff & retries)<br>- `start.bat` (Full-Stack Concurrent Launcher) |

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
│   ├── tasks.py              # Celery periodic tasks with exponential backoff & auto-retry
│   ├── tests_concurrency.py  # Multi-threaded row locking stress tests
│   └── services/             # Clinical, inventory & escalation services
├── start.bat                 # 1-Click concurrent launcher (Django + React + Browser)
└── frontend/                 # React 19 + Vite 6 Application Root
    ├── package.json
    ├── vite.config.js        # Port 5173 with proxy: /api -> http://127.0.0.1:8000
    ├── tailwind.config.js    # Clinical teal brand palette, glassmorphism
    ├── src/
    │   ├── api/
    │   │   └── client.js     # Centralized async API client & CSRF synchronization
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── hooks/
    │   │   └── useOnlineStatus.js # Real-time online/offline detector
    │   ├── utils/
    │   │   ├── soundAlert.js     # Web Audio API synthetic dual-tone chime
    │   │   └── notifications.js # Browser Notification API wrapper
    │   ├── components/
    │   │   ├── layout/       # Sidebar, Header (with connectivity pill), Layout (offline banner)
    │   │   ├── ui/           # StatusBadge, Modal, Toast
    │   │   └── dashboard/    # DoseCard, AdherenceGauge
    │   ├── pages/
    │   │   ├── auth/         # LoginPage, RegisterPage
    │   │   ├── profile/      # ProfileSetupPage (Routine anchors: Breakfast, Lunch, Dinner, Bedtime)
    │   │   ├── dashboard/    # DashboardPage (Telemetry, Adherence Ring, Today's Doses)
    │   │   ├── medications/  # MedicationListPage, MedicationModal
    │   │   ├── regimens/     # RegimenListPage, RegimenModal
    │   │   ├── caregivers/   # CaregiverListPage, CaregiverModal
    │   │   ├── caregiver-portal/ # CaregiverPortalPage (Live Watchdog, SVG Trends, Audio/Push)
    │   │   ├── caregiver-ack/    # CaregiverAckPage (/caregiver/ack/:token frictionless response)
    │   │   └── reports/      # AdherenceReportPage (Print/CSV/JSON), RequisitionManifestPage (Print/CSV/JSON)
    │   ├── App.jsx           # React Router DOM configuration & protected route guard
    │   └── main.jsx
```

---

## 4. Key Advanced Features Implemented by Collaborator 2

### 1. Caregiver Portal Visual Analytics & Cohort Benchmarking
- Interactive compliance metrics summary: Optimal (≥80%), Needs Followup (<80%), and Active Escalations.
- Responsive horizontal SVG comparison bars displaying adherence scores side-by-side.
- Per-patient daily progress tracking bars directly inside roster cards.

### 2. Dual-Tier Audio Chime & Browser Push Notification Dispatcher
- Synthesized Web Audio API sound generator (`utils/soundAlert.js`) that produces:
  - **Tier 1 Alert:** Dual-harmonic chime (587Hz → 880Hz).
  - **Tier 2 Critical:** Fast dual-burst triangle pulse (880Hz → 1174Hz / 1318Hz) for overdue dose breaches.
- Browser desktop Notification API integration with user permission toggles and direct focus actions.

### 3. Electronic Data Interchange (EDI) Export for Pharmacy Requisitions
- One-click **CSV Export** formatted for direct upload into community pharmacy procurement software.
- One-click **JSON Export** following structured purchase order schemas.
- Preserves full clinical print-to-PDF formatting for physical prescription drop-offs.

### 4. Clinical Adherence Scorecard CSV & JSON Telemetry Export
- Structured CSV export with patient demographics, audit windows, summary compliance rates, and per-drug intake metrics.
- Machine-readable JSON export designed for Electronic Health Record (EHR) ingestion.

### 5. Resilient Offline Detection & Reconnection Banner
- Reactive custom React hook (`hooks/useOnlineStatus.js`) detecting network disconnects instantly.
- Global warning banner in `Layout.jsx` informing users that cached dose data remains accessible.
- Network status pill in `Header.jsx` displaying live connection state.

### 6. Multi-Threaded Concurrency Stress Test Suite
- `medtrack/tests_concurrency.py` simulates concurrent threads firing against the same dose event.
- Proves row-level locking (`select_for_update()`) and idempotency guards prevent duplicate stock decrements under double-click race conditions.

### 7. Celery Task Hardening with Exponential Backoff
- `medtrack/tasks.py` tasks configure `bind=True`, `autoretry_for=(Exception,)`, `retry_backoff=True`, `retry_jitter=True`, and `max_retries=3` to handle transient network issues safely.

### 8. Full-Stack Concurrent Launcher (`start.bat`)
- Single-click Windows orchestrator that boots Python virtual environment, applies migrations, seeds demo patients, launches Django API on port 8000, launches Vite React frontend on port 5173, and launches the browser automatically.

---

## 5. Development & Execution Instructions

### One-Click Launch (Windows)
Double-click `start.bat` in the repository root, or run in PowerShell:
```powershell
.\start.bat
```

### Manual Execution

#### Step 1: Run Django Backend
```bash
.venv\Scripts\activate.bat
python manage.py migrate
python manage.py seed_db
python manage.py runserver 127.0.0.1:8000
```

#### Step 2: Run React Frontend
```bash
cd frontend
npm run dev
```
Navigate to `http://localhost:5173/`.

### Step 3: Verification Commands
```bash
# Verify backend unit, integration, and concurrency tests:
python manage.py test medtrack

# Verify frontend production build:
npm run build --prefix frontend
```
