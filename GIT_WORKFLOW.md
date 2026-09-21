# 🤝 Git & GitHub Collaboration Workflow Guide

This guide establishes the rules and step-by-step commands for team collaboration to prevent merge conflicts, lost work, and migration inconsistencies.

---

## 📌 1. Golden Rules of Team Collaboration

1. **NEVER push directly to `main`**:
   - `main` is the production/stable branch.
   - Always create a feature branch, make commits, and open a Pull Request (PR).
2. **Never commit secrets, virtual environments, or SQLite files**:
   - `.venv/`, `.env`, and `db.sqlite3` are already in `.gitignore`.
   - Each developer maintains their own local database and virtual environment.
3. **Always pull latest changes before starting new work**:
   - Sync your local `main` with GitHub before creating a branch.
4. **Coordinate on Django Models & Migrations**:
   - If both collaborators change the same model at the same time, migration conflicts occur. Communicate before altering `models.py`.

---

## 🧭 2. Workflow Diagram

```
GitHub (Remote)
      main ─────────────┬───────────────────────────► (Merge PR) ──► main updated
                        │                                  ▲
                        ▼                                  │
Local (You)        git checkout -b feature/auth            │ (Pull Request)
                   make commits...                         │
                   git push origin feature/auth ───────────┘
```

---

## 🛠️ 3. Step-by-Step Daily Workflow

### Scenario A: Starting a New Task

```bash
# 1. Switch to main branch
git checkout main

# 2. Pull latest code from GitHub
git pull origin main

# 3. Create and switch to your feature branch
# Naming convention: feature/<name>, bugfix/<name>, chore/<name>
git checkout -b feature/user-authentication
```

---

### Scenario B: Working, Testing & Committing

```bash
# Check status of changed files
git status

# Stage files you worked on
git add .
# OR stage specific files: git add core/settings.py

# Commit with a clear, descriptive message
git commit -m "Add user registration view and template"
```

---

### Scenario C: Pushing and Opening a Pull Request (PR)

```bash
# Push your branch to GitHub
git push -u origin feature/user-authentication
```

1. Go to your repository on **GitHub.com**.
2. Click **"Compare & pull request"**.
3. Select `base: main` <- `compare: feature/user-authentication`.
4. Add a short description of what you did.
5. Assign your collaborator as a **Reviewer**.
6. Once reviewed and approved, click **"Squash and merge"** or **"Merge pull request"**.
7. Delete the remote branch on GitHub.

---

### Scenario D: Updating Your Local Environment After a PR is Merged

Both collaborators must sync their local environment:

```bash
# 1. Switch back to main
git checkout main

# 2. Pull the newly merged code
git pull origin main

# 3. Install any new dependencies if requirements.txt changed
pip install -r requirements.txt

# 4. Apply any database migrations created by your teammate
python manage.py migrate

# 5. Delete your old local feature branch (optional cleanup)
git branch -d feature/user-authentication
```

---

## ⚡ 4. How to Handle Conflicts

### If your branch falls behind `main` while working:
```bash
git checkout main
git pull origin main
git checkout feature/your-feature
git merge main
```
If Git reports a conflict:
1. Open the highlighted files in VS Code / IDE.
2. Look for conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
3. Choose the correct code or merge both changes.
4. Save the file, run tests (`python manage.py check`).
5. Stage and commit:
   ```bash
   git add .
   git commit -m "Resolve merge conflict with main"
   git push
   ```

### If Django Migrations Conflict:
If two branches created migrations with the same numbering (e.g., both created `0002_...`):
```bash
python manage.py makemigrations --merge
git add .
git commit -m "Merge conflicting migrations"
```
