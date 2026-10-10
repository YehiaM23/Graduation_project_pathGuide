# PathGuide — Career Development Platform

A collaborative graduation project bringing together career recommendations, learning plans, internship applications, and AI mock interviews across web and mobile interfaces.

**React · TypeScript · ASP.NET Core · SQL Server · Flutter · Python**

[Features](#features) · [Architecture](#architecture) · [Setup](#setup) · [My contributions](#my-contributions)

## Overview

PathGuide helps students explore career directions, understand skill gaps, and find internships. Recruiters manage opportunities and applications, while administrators oversee users and platform content. The project combines a React website, an ASP.NET Core API, a Flutter client, and Python services for recommendations and interviews.

This checkout contains implementations at different stages. Web/API features and Python services should be distinguished from mobile screens that still use sample data.

## Features

- Student and recruiter registration, login, email-verification, and password-reset endpoints and web pages.
- Student profiles with skills, interests, CV upload, and CV parsing/suggestion services.
- Internship browsing, recruiter posting/editing, student applications, and application-status management.
- Career recommendation and planning endpoints; saved plans and course-completion tracking.
- Course and internship review workflows.
- LiveKit-based web mock interviews, report submission, and application-linked report retrieval/sharing.
- Admin dashboards and management of users, internships, applications, and reviews.
- Flutter screens for student/recruiter workflows with BLoC state and Dio API services.

**Mobile scope:** roadmap and recommended-career screens contain static sample data. The mobile client should not be presented as having the complete web mock-interview or live AI workflow. External integrations require configuration; end-to-end operation was not verified during this review.

## Architecture

| Component | Location | Responsibility |
| --- | --- | --- |
| Website | `web/grad_project.client/` | React 19, TypeScript, Vite, Tailwind, React Router, Axios, LiveKit client |
| REST API | `web/grad_project.Server/` | ASP.NET Core 9, EF Core 9, JWT, BCrypt, SQL Server |
| Mobile | `pathguide_app/` | Flutter, BLoC, GoRouter, Dio, token storage |
| Recommendations | `ai-and-recommendation/recommenation-planning/` | FastAPI, hybrid recommendation modules, gap analysis, PyTorch DQN planner |
| Mock interview | `ai-and-recommendation/mock-interview/` | LiveKit Agents, OpenAI, LangGraph/LangChain, ChromaDB |
| Database | `db/pathguide-db.sql` | SQL Server schema and seed dump |

The website proxies `/api` to the .NET API and `/career-api` to the Python planner during Vite development. The mobile app calls the .NET API through its configured base URL. Python interview services communicate with LiveKit and the platform API.

## Setup

### Prerequisites

- .NET SDK 9 and SQL Server.
- Node.js compatible with the checked-in Vite 7 dependency; Node 22.12+ is a suitable baseline.
- Flutter with a Dart version and framework APIs compatible with `pathguide_app/pubspec.yaml` and the current source.
- Python environment for the AI components, a SQL Server ODBC driver, and service credentials for the integrations you enable.

```bash
git clone https://github.com/YehiaM23/Graduation_project_pathGuide.git
cd Graduation_project_pathGuide
```

### 1. Configure and initialize the database

Create a new local SQL Server database named `PathGuide`, then execute [db/pathguide-db.sql](db/pathguide-db.sql) using SQL Server Management Studio. The dump starts with `USE [PathGuide]`; it does not create the database. Use a disposable development database and inspect seed data before importing it.

### 2. Configure the API

From `web/grad_project.Server/`, copy:

- `appsettings.example.json` to `appsettings.json`.
- `appsettings.Development.example.json` to `appsettings.Development.json`.

Set your own values for:

| Configuration | Purpose |
| --- | --- |
| `ConnectionStrings:DefaultConnection` | Local SQL Server connection |
| `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience` | Token signing and validation |
| `AppSettings:FrontendUrl` | Website origin used by API configuration |
| `AppSettings:CareerPlannerUrl` | Python planner URL, normally `http://localhost:8000` |
| `Brevo:*` | Email delivery for verification and reset flows |
| `LiveKit:*` | Interview server and agent configuration |
| `MockInterview:AgentApiKey` | Shared credential for agent-to-API reporting |
| `OpenAi:ApiKey` or `OPENAI_API_KEY` | OpenAI-backed CV functionality, where used |

Keep real secrets outside committed documentation. The production example contains additional settings; use it as a reference for integrations without assuming development inherits production configuration.

```bash
cd web/grad_project.Server
dotnet restore
dotnet run --launch-profile http
```

The HTTP launch profile uses port `5064`. The project also has SPA Proxy settings pointing to `https://localhost:62246`, while the current Vite configuration does not set that HTTPS endpoint. Align these settings when using automatic SPA startup. For separate startup, disable the SPA hosting-startup setting in the local launch configuration and run the frontend below.

### 3. Start the website in another terminal

```bash
cd web/grad_project.client
npm install
npm run dev
```

Open the URL printed by Vite. Configure the API's frontend origin to match it. `npm run build` type-checks and bundles the website; `npm run lint` is also declared.

### 4. Start the Flutter client

```bash
cd pathguide_app
flutter doctor
flutter pub get
```

Edit `lib/core/config/api_config.dart` for a backend reachable from the target device. Resolve the missing `assets/images/` directory declared in `pubspec.yaml` before building. Google sign-in contains a placeholder OAuth client ID and requires additional setup/integration.

```bash
flutter devices
flutter run
```

### 5. Start the career-planning service

From `ai-and-recommendation/recommenation-planning/scripts/`, create and activate a virtual environment. A dedicated requirements file was not found for this service; the following packages are derived from source imports, not a tested lockfile:

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
python -m pip install fastapi uvicorn pydantic numpy pandas torch pyodbc
uvicorn api:app --reload --port 8000
```

Set `DB_CONNECTION_STRING` in the process environment to your local SQL Server connection, using an installed ODBC driver. Keep the sibling `data/` CSV files in place. The API includes health, roles, skills, plan, and recommendation routes. The service has not been executed against a configured database in this review.

### 6. Start the mock-interview agent

From `ai-and-recommendation/mock-interview/`, copy `.env.example` to `.env`, then configure OpenAI, LiveKit, the PathGuide API URL, and the reporting API key. `PATHGUIDE_AGENT_API_KEY` must match the API's `MockInterview:AgentApiKey`.

```bash
python -m venv .venv
# Activate the virtual environment for your shell.
python -m pip install -r requirements.txt
python agent.py dev
```

The entry point uses the LiveKit Agents CLI. Python/package compatibility and LiveKit connectivity must be verified in your configured environment.

## How to use

Students build a profile, explore career recommendations and learning plans, apply to internships, and use the configured web mock-interview workflow. Recruiters post opportunities and manage applicants. Administrators moderate users, listings, and reviews. The Flutter client covers a subset of these workflows.

## My contributions

I am **Yehia Moataz**, the sole Flutter/mobile developer in a **four-member team**. My work covered the mobile interface, BLoC state management, and REST API communication, alongside contributions to the website frontend. The platform's backend, AI services, and other responsibilities were collaborative team work.

## Presentation and verification

No application screenshots or verified hosted demo were found in this checkout. Framework placeholder icons are not presented as PathGuide branding. Setup commands were checked against source/configuration, but .NET/Flutter builds and the external-service workflows were not run in this review.

## Suggested improvements

- Connect the remaining sample mobile screens to live APIs.
- Align local frontend/API startup settings.
- Add a pinned planner dependency file, integration tests, and real web/mobile screenshots.

These are suggestions rather than confirmed roadmap commitments.
