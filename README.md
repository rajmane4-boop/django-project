# Django Project

A collaborative Django web application setup.

---

## 🚀 Quickstart: Local Setup

### 1. Clone the repository (For Collaborator)
```bash
git clone <repository-url>
cd django-project
```

### 2. Create and Activate Virtual Environment

**On Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```
*(If PowerShell restricts script execution, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`)*

**On macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run Migrations & Start Server
```bash
python manage.py migrate
python manage.py runserver
```
Visit `http://127.0.0.1:8000/` in your browser.

---

## 🤝 GitHub Collaboration Workflow

Refer to [GIT_WORKFLOW.md](GIT_WORKFLOW.md) for the complete guide on branching, pull requests, and best practices.
