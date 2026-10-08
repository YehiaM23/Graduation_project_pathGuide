# PathGuide

> Your Career Compass — bridging the gap between academia and industry.

PathGuide is a career-guidance platform for students, recruiters, and admins. It
offers career-path recommendations, internship listings and applications, course
and internship reviews, AI-assisted CV suggestions, and AI mock interviews. The
repository contains the **web app** (ASP.NET Core API + React SPA), a **Flutter
mobile app**, the **AI & recommendation services** (Python), and the **database**
schema/seed dump.

---

## Repository structure

```
.
├── web/                              # Web application (ASP.NET Core + React)
│   ├── grad_project.slnx             #   Visual Studio solution
│   ├── grad_project.Server/          #   ASP.NET Core 9 Web API (C#)
│   │   ├── Controllers/              #     REST endpoints (Auth, Internships, …)
│   │   ├── Models/  DTOs/  Data/     #     EF Core entities, DTOs, DbContext
│   │   ├── Services/                 #     Auth, email, CV parsing, LiveKit token
│   │   ├── Migrations/  Sql/  Scripts/ #   SQL migration/helper scripts
│   │   ├── Program.cs                #     App startup & DI
│   │   ├── web.config                #     IIS hosting config
│   │   └── appsettings*.example.json #     Config templates (copy → real files)
│   └── grad_project.client/          #   React 19 + TypeScript + Vite SPA
│       ├── src/                      #     Pages, components, contexts, api client
│       └── package.json              #     Frontend dependencies & scripts
│
├── pathguide_app/                    # Flutter mobile app (Android/iOS)
│   ├── lib/                          #   Dart source (feature-first, BLoC)
│   └── pubspec.yaml                  #   Flutter dependencies
│
├── ai-and-recommendation/            # Python AI services
│   ├── mock-interview/               #   RAG mock-interview agent (LiveKit + OpenAI)
│   │   ├── *.py                      #     Agent, RAG, report generation
│   │   ├── chroma_db/                #     Vector store
│   │   ├── requirements.txt          #     Python dependencies
│   │   └── .env.example              #     Env template (copy → .env)
│   └── recommenation-planning/       #   Career-path planner — deployed as a FastAPI service
│       ├── scripts/                  #     FastAPI app (api.py) + DQN/recommender modules
│       └── data/                     #     CSV datasets (skills, roles, prerequisites)
│
└── db/
    └── pathguide-db.sql              # SQL Server schema + seed data dump
```

> **Note:** `pathguide_app/grad_project/` contains an older, pre-restructure copy
> of the backend (including a `12182025publish/` build output). The current,
> maintained backend lives under `web/`.

---

## Tech stack

| Layer        | Technology |
|--------------|------------|
| Backend API  | ASP.NET Core 9 (C#), Entity Framework Core 9, SQL Server |
| Auth         | JWT bearer tokens, BCrypt password hashing |
| Frontend     | React 19, TypeScript, Vite 7, Tailwind CSS 4, React Router 7 |
| Mobile       | Flutter (Dart 3), BLoC, go_router, Dio |
| Email        | Brevo (transactional email API) |
| AI features  | LiveKit (mock-interview voice), OpenAI (CV suggestions) |
| AI services  | Python — FastAPI (career-path planner), RAG agent (ChromaDB) |
| Hosting      | IIS (in-process) for .NET; FastAPI via IIS httpPlatform or NSSM; mock-interview agent as an NSSM service |

---

## Prerequisites

- [.NET SDK 9.0+](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/) and npm
- SQL Server (Express/Developer) or SQL Server in a container
- [Flutter SDK 3.1+](https://docs.flutter.dev/get-started/install) (mobile app only)
- [Python 3.10+](https://www.python.org/downloads/) (AI & recommendation services only)

---

## Configuration

Real configuration files contain secrets and are **git-ignored**. Copy the
`*.example.json` templates and fill in your own values:

```bash
cd web/grad_project.Server
cp appsettings.example.json             appsettings.json
cp appsettings.Development.example.json  appsettings.Development.json
cp appsettings.Production.example.json   appsettings.Production.json   # for deploy
```

Then edit each file:

| Key | Purpose |
|-----|---------|
| `ConnectionStrings:DefaultConnection` | SQL Server connection string |
| `Jwt:Key` | Long random secret used to sign auth tokens |
| `Brevo:ApiKey` | Brevo API key for sending email |
| `AppSettings:FrontendUrl` | Allowed CORS origin / SPA URL |
| `AppSettings:CareerPlannerUrl` | URL of the FastAPI career-path planner (default `http://localhost:8000`) |
| `LiveKit:*` (Development) | LiveKit URL/key/secret for mock interviews |
| `OpenAi:ApiKey` (Production) | OpenAI key for CV suggestions |

> The real `appsettings.*.json` and the `dp-keys/` (Data Protection keys) folder
> are excluded from git by design — keep them out of source control.

---

## Database setup

The database is provided as a full SQL Server dump (`db/pathguide-db.sql`,
database name **`PathGuide`**). Restore it before running the API.

Using `sqlcmd`:

```bash
# Create the database, then load the dump
sqlcmd -S localhost -U sa -P "<your-password>" -Q "CREATE DATABASE PathGuide"
sqlcmd -S localhost -U sa -P "<your-password>" -d PathGuide -i db/pathguide-db.sql
```

Or open `db/pathguide-db.sql` in SQL Server Management Studio (SSMS) and execute it.
Incremental SQL changes live under `web/grad_project.Server/Migrations/`, `Sql/`,
and `Scripts/` — apply any newer ones as needed.

---

## Local development

### Backend + frontend together

From Visual Studio, open `web/grad_project.slnx` and run `grad_project.Server`.
The project is configured with **SPA Proxy**: it launches `npm run dev`
automatically and proxies the Vite dev server.

Or from the command line:

```bash
# 1) Frontend dev server (Vite, https://localhost:62246)
cd web/grad_project.client
npm install
npm run dev

# 2) Backend API (in another terminal)
cd web/grad_project.Server
dotnet restore
dotnet run            # http://localhost:5064  /  https://localhost:7243
```

- API: `http://localhost:5064` (HTTP) / `https://localhost:7243` (HTTPS)
- SPA dev server: `https://localhost:62246`

### Useful frontend scripts (`web/grad_project.client`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build production bundle to `dist/` |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

---

## Mobile app (Flutter)

```bash
cd pathguide_app
flutter pub get
flutter run
```

Point the app at your backend by editing `lib/core/config/api_config.dart` — set
`_host` to your machine's LAN IP (find it with `ipconfig`) and `_port` to the API
port (default `5064`):

```dart
static const String _host = '192.168.1.3';   // your PC's IP
static const int _port = 5064;
```

Build a release APK:

```bash
flutter build apk --release
```

---

## AI & recommendation services (`ai-and-recommendation/`)

Two independent Python services back the AI features. Each runs in its own
virtual environment.

### Career-path planner — FastAPI (`recommenation-planning/scripts/`)

The contents of `recommenation-planning/scripts/` are **deployed as a FastAPI
service**. `api.py` exposes the DQN-based career planner and the hybrid
recommender over REST (Swagger UI at `/docs`), listening on **port 8000** —
which matches `AppSettings:CareerPlannerUrl` (`http://localhost:8000`) in the
.NET API.

Endpoints: `GET /health`, `GET /roles`, `GET /skills`, `POST /plan`,
`POST /recommend`, `POST /recommend/save`.

**Run locally:**

```bash
cd ai-and-recommendation/recommenation-planning/scripts
python -m venv .venv
.venv\Scripts\activate            # Windows  (source .venv/bin/activate on *nix)
pip install fastapi uvicorn pydantic numpy pandas torch   # + any other imports
uvicorn api:app --reload --port 8000
```

**Deploy — option A: IIS (httpPlatformHandler).** `web.config` in the `scripts/`
folder launches uvicorn behind IIS. Install the
[HttpPlatformHandler](https://www.iis.net/downloads/microsoft/httpplatformhandler)
module, then update the `processPath` in `web.config` to point at your venv's
`python.exe` (it currently points at `C:\ML\scripts\venv\Scripts\python.exe`) and
host the `scripts/` folder as an IIS site/application.

**Deploy — option B: Windows service (NSSM).** Run `service_install.bat` **as
Administrator** to register a `CareerPlannerAPI` auto-start service (requires
[NSSM](https://nssm.cc/download) and a `.venv` in the project folder). It serves
on port 8000 with logs under `scripts/logs/`. Remove it with
`service_uninstall.bat`.

### Mock-interview agent (`mock-interview/`)

A RAG voice-interview agent (LiveKit + OpenAI, ChromaDB vector store). Copy the
env template and fill in real keys before running:

```bash
cd ai-and-recommendation/mock-interview
cp .env.example .env                # then edit with real keys
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python agent.py
```

> The real `.env` (OpenAI/LiveKit/PathGuide keys) is git-ignored — only
> `.env.example` is committed. `PATHGUIDE_AGENT_API_KEY` must match
> `MockInterview:AgentApiKey` in the .NET `appsettings`.

**Deploy — Windows service (NSSM).** In production, `agent.py` runs as a
[NSSM](https://nssm.cc/download)-managed Windows service:

| Setting | Value |
|---------|-------|
| Service name | `PathGuide-Agent` |
| Display name | `PathGuide Mock Interview Agent` |
| Executable | the venv's `python.exe` running `agent.py` |
| Working dir | `ai-and-recommendation/mock-interview` |

Register and manage it (run the shell **as Administrator**):

```bat
REM Install — point at the project's venv python and agent.py
nssm install PathGuide-Agent "<path>\.venv\Scripts\python.exe" agent.py
nssm set     PathGuide-Agent AppDirectory "<path>\ai-and-recommendation\mock-interview"
nssm set     PathGuide-Agent DisplayName "PathGuide Mock Interview Agent"
nssm set     PathGuide-Agent Start SERVICE_AUTO_START
nssm start   PathGuide-Agent

REM Manage
nssm restart PathGuide-Agent
nssm stop    PathGuide-Agent
nssm remove  PathGuide-Agent confirm
```

The service reads its keys from the local `.env` (kept on the server, never
committed). Ensure the venv is created and `requirements.txt` installed before
starting the service.

---

## Production deployment (IIS)

The backend publishes as a self-contained site that also serves the built SPA
from `wwwroot` (the `.csproj` copies the client `dist/` output during publish).

1. **Build the frontend:**
   ```bash
   cd web/grad_project.client
   npm install
   npm run build
   ```

2. **Publish the backend** (bundles the SPA into `wwwroot`):
   ```bash
   cd web/grad_project.Server
   dotnet publish -c Release -o ./publish
   ```

3. **Deploy to IIS:**
   - Copy the `publish/` output to your IIS site folder.
   - Ensure the [.NET Hosting Bundle](https://dotnet.microsoft.com/download/dotnet/9.0)
     is installed on the server (provides the `AspNetCoreModuleV2`).
   - `web.config` sets `ASPNETCORE_ENVIRONMENT=Production` and in-process hosting,
     so the server reads `appsettings.Production.json` — make sure that file (with
     real secrets) is present on the server but **not** in source control.
   - The app keeps Data Protection keys in `dp-keys/`; provision/persist that
     folder on the server (it is not committed).

4. **Database:** restore `db/pathguide-db.sql` to the production SQL Server and
   update the connection string in `appsettings.Production.json`.

---

## API surface

REST controllers under `web/grad_project.Server/Controllers` include:

`Auth`, `Students`, `Recruiters`, `Admin` / `AdminManagement`, `Internships`,
`Applications`, `InternshipReviews`, `CourseReviews`, `CareerPaths`,
`CareerPlanner`, `SavedCareerPlans`, `Interests`, `Skills`, `Majors`,
`Universities`, `MockInterview`.

---

## Security notes

- Never commit real `appsettings.*.json`, `dp-keys/`, or other secrets — they are
  git-ignored on purpose.
- Rotate any API keys (Brevo, LiveKit, OpenAI) and the JWT signing key if they
  have ever been committed or shared.
- The seeded database dump contains user records; treat it as sample data and
  scrub/replace credentials before any real use.
