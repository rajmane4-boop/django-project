# 💊 Smart MedTrack

**Automated Medication Adherence & Rolling Inventory Forecasting System**  
*A clinical telemetric and safety management platform built on Django 5+, React 19, Vite 6, Celery, Redis, and Tailwind CSS.*

---

## 🌟 Executive Summary & Key Highlights

Smart MedTrack solves three fundamental defects of conventional alarm apps and plastic pillboxes:
1. **Biological Routine Anchoring**: Dosing schedules align dynamically with human routine events (`Breakfast`, `Lunch`, `Dinner`, `Bedtime` with offsets like *-15 min before breakfast*) rather than arbitrary clock alarms.
2. **Two-Tier Fail-Safe Escalation**: Unconfirmed doses trigger an automated escalation chain. If a dose is unconfirmed 30 minutes past its scheduled time, Tier 1 primary caregivers receive an urgent alert with a cryptographic, expiring frictionless action link. If unacknowledged within 60 minutes, secondary Tier 2 emergency contacts are escalated.
3. **Atomic Inventory & Depletion Forecasting**: Medication stock decrements concurrently and safely using database row locking (`select_for_update` + `transaction.atomic`). Rolling 7-day burn rates calculate exact stockout dates and trigger proactive replenishment alerts.
4. **Caregiver Live Watchdog & Safety Portal**: Multi-patient monitoring interface equipped with real-time SVG adherence comparison charts, synthetic Web Audio API urgency chimes, and native browser push notifications.
5. **Electronic Requisition & Clinical Audit Exports**: Generates print-ready clinical compliance scorecards and pharmacy purchase order manifests with one-click **CSV** and **JSON** exports for Electronic Data Interchange (EDI) and EHR systems.
6. **Progressive Web App (PWA) Offline Resilience**: Equipped with Service Worker caching and live network connectivity status detection, ensuring patients can review regimens even during intermittent internet outages.

---

## 🏗️ Architecture & Tech Stack

```
                          [ Client Browser / PWA ]
                     (React 19 + Vite 6 + Tailwind CSS)
                                    │
                       (Async Fetch /api/* + CSRF)
                                    ▼
                      [ Django 5 Application Core ]
                     /              │              \
          (Auth & ORM)        (Transaction)     (Reports & EDI)
                   /                │                \
                  ▼                 ▼                 ▼
          [ PostgreSQL 16 ]    [ Redis Broker ]   [ CSV / JSON / PDF ]
          (or SQLite engine)        │
                                    ▼
                         [ Celery Workers & Beat ]
                          ├── Daily Localized Day Generator
                          ├── 10-Min Escalation Watchdog
                          └── Outbound Notification Dispatcher
```

| Layer | Technology | Role |
|---|---|---|
| **Frontend Application** | React 19, Vite 6, Tailwind CSS 3 | Modern SPA shell, interactive dashboard, SVG sparklines, glassmorphic UI |
| **PWA & Audio Alert Subsystem** | Service Worker, Web Audio API, Push API | Offline shell caching, synthetic dual-frequency chimes, desktop alerts |
| **Backend Core & ORM** | Python 3.12+ / Django 5/6 | Authentication, transaction orchestration, models, admin interface |
| **RESTful API Bridge** | Django REST View Layer (`/api/*`) | Centralized JSON API with zero-dependency CORS & CSRF token sync |
| **Database** | PostgreSQL 16+ (or SQLite engine) | ACID relational storage, row-level locks (`select_for_update`), constraints |
| **Task Queue & Broker** | Celery 5.4+ with Redis 7+ | Periodic escalation watchdog sweeps and async notification dispatch |
| **Audit & Requisition** | Python CSV, JSON, HTML5 Print Engine | Clinical compliance scorecards and pharmacy purchase orders |

---

## 📁 Repository Structure

```
django-project/
├── core/                       # Django Project Configuration
│   ├── settings.py             # Settings (CORS, CSRF, Celery, Database)
│   ├── cors.py                 # Zero-dependency CORS middleware
│   ├── urls.py                 # Master routing (mounts /api/ and admin)
│   └── celery.py               # Celery application initialization
├── medtrack/                   # Core Clinical Domain Application
│   ├── models.py               # PatientProfile, Routine, Medication, Regimen, DoseEvent, Caregiver
│   ├── api.py                  # REST API endpoints for React frontend
│   ├── api_urls.py             # Route definitions for /api/*
│   ├── tasks.py                # Celery periodic tasks with exponential backoff retries
│   ├── tests.py                # Core unit & integration test suite (26 tests)
│   ├── tests_concurrency.py    # Multi-threaded row locking stress tests (ThreadPoolExecutor)
│   ├── tests_api.py            # REST API endpoint integration tests (8 tests)
│   └── services/               # Clinical Domain Services
│       ├── scheduling.py       # Routine anchor calculations & localized dose generator
│       ├── inventory.py        # Atomic stock decrement & rolling 7-day burn rate forecasting
│       ├── escalation.py       # 30-min Tier 1 & 60-min Tier 2 state machine
│       ├── notifications.py    # SMS and Email alert dispatchers
│       ├── acknowledgment.py   # TimestampSigner cryptographic token generator
│       └── reports.py          # Adherence compliance scorecard and requisition generator
├── frontend/                   # Modern React 19 + Vite 6 Application Root
│   ├── package.json
│   ├── vite.config.js          # Vite config with /api proxy to http://127.0.0.1:8000
│   ├── public/
│   │   ├── manifest.json       # Progressive Web App manifest
│   │   └── sw.js               # Service Worker offline cache
│   └── src/
│       ├── api/client.js       # Centralized API client with CSRF token injection
│       ├── context/AuthContext.jsx # Global user authentication state
│       ├── hooks/useOnlineStatus.js # Live network connectivity detector
│       ├── utils/
│       │   ├── soundAlert.js   # Web Audio API synthetic dual-tone chime
│       │   └── notifications.js # Browser Notification API wrapper
│       ├── components/
│       │   ├── layout/         # Header (with network pill), Sidebar, Layout (offline banner)
│       │   ├── ui/             # StatusBadge, Modal, Toast
│       │   └── dashboard/      # DoseCard, AdherenceGauge
│       └── pages/
│           ├── auth/           # LoginPage, RegisterPage
│           ├── profile/        # ProfileSetupPage (Routine anchors: Breakfast, Lunch, Dinner, Bedtime)
│           ├── dashboard/      # DashboardPage (Telemetry, Adherence Ring, Today's Doses)
│           ├── medications/    # MedicationListPage, MedicationModal
│           ├── regimens/       # RegimenListPage, RegimenModal
│           ├── caregivers/     # CaregiverListPage, CaregiverModal
│           ├── caregiver-portal/ # CaregiverPortalPage (Live Watchdog, SVG Trends, Audio/Push)
│           ├── caregiver-ack/  # CaregiverAckPage (/caregiver/ack/:token frictionless response)
│           └── reports/        # AdherenceReportPage, RequisitionManifestPage (Print/CSV/JSON)
├── start.bat                   # 1-Click concurrent orchestrator (Django + React + Browser)
├── requirements.txt            # Python dependencies
└── manage.py
```

---

## 🚀 Quickstart Guide

### ⚡ One-Click Run (Windows)
Double-click `start.bat` in the repository root, or execute in PowerShell:
```powershell
.\start.bat
```

This automated orchestrator:
1. Verifies/creates Python `.venv` and ensures dependencies from `requirements.txt`.
2. Automatically runs database migrations and seeds initial demo patient accounts.
3. Verifies frontend `node_modules` and runs `npm install` automatically if needed.
4. Spawns the **Django API Server** on `http://127.0.0.1:8000/`.
5. Spawns the **Vite React Dev Server** on `http://localhost:5173/`.
6. Automatically opens your browser to [http://localhost:5173/](http://localhost:5173/).

---

### 🔑 Demo Personas

| Role | Username | Password | Timezone | Description |
|---|---|---|---|---|
| **Patient 1** | `patient1` | `medtrack123` | `Asia/Kolkata` (IST) | Ramesh Patel — 4 active regimens, anchor routine configured |
| **Patient 2** | `patient2` | `medtrack123` | `Asia/Kolkata` (IST) | Sunita Sharma — 3 active regimens, secondary caregiver escalation |

---

## 🧪 Verification & Test Suites

The project features a comprehensive test suite across unit, integration, concurrency, and API domains:

```powershell
# 1. Run all core backend tests (26 tests):
python manage.py test medtrack

# 2. Run multi-threaded concurrency race-condition stress tests:
python manage.py test medtrack.tests_concurrency

# 3. Run REST API integration test suite:
python manage.py test medtrack.tests_api

# 4. Run frontend production build check:
npm run build --prefix frontend
```
