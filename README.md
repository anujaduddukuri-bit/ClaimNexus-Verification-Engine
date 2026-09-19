# ClaimNexus

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-Agentic%20AI-00f0ff?style=for-the-badge" alt="Agentic AI" />
  <img src="https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TypeScript-3a86ff?style=for-the-badge" alt="React Vite" />
  <img src="https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11-9d4edd?style=for-the-badge" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Graph-React%20Flow-10b981?style=for-the-badge" alt="React Flow" />
  <img src="https://img.shields.io/badge/License-MIT-e5ded0?style=for-the-badge" alt="MIT" />
</p>

<p align="center"><strong>Investigate Claims. Compare Evidence. Understand the Truth.</strong></p>

ClaimNexus is an **agentic claim-verification and evidence engine**. A user submits a statement. Independent AI research agents investigate it in parallel, live web sources are retrieved and classified, semantically similar statements are clustered, conflicts are flagged, and an explainable verdict is produced with **exact article URLs** — not homepage links.

It is built so that **LLM agreement is not treated as proof**. Models can agree and still be wrong. The verdict is driven by grounded evidence, source quality, claim type (absolute / extraordinary / comparative), and an auditable 11-stage pipeline.

---

## Table of contents

1. [What this project is](#1-what-this-project-is)
2. [Why this project exists](#2-why-this-project-exists)
3. [How it works](#3-how-it-works)
4. [Who it is for](#4-who-it-is-for)
5. [What it is not](#5-what-it-is-not)
6. [Features (every screen and capability)](#6-features-every-screen-and-capability)
7. [11-stage workflow](#7-11-stage-workflow)
8. [Algorithms](#8-algorithms)
9. [Tech stack](#9-tech-stack)
10. [Repository layout](#10-repository-layout)
11. [Prerequisites](#11-prerequisites)
12. [Environment variables](#12-environment-variables)
13. [Local run commands](#13-local-run-commands)
14. [API reference](#14-api-reference)
15. [Testing](#15-testing)
16. [Docker](#16-docker)
17. [Push the project to GitHub](#17-push-the-project-to-github)
18. [Host backend on Render](#18-host-backend-on-render)
19. [Host frontend on Vercel](#19-host-frontend-on-vercel)
20. [Link Vercel and Render](#20-link-vercel-and-render)
21. [Security notes](#21-security-notes)
22. [Known constraints](#22-known-constraints)
23. [Future scope](#23-future-scope)
24. [What to add when you extend it](#24-what-to-add-when-you-extend-it)
25. [License](#25-license)

---

## 1. What this project is

ClaimNexus is a full-stack research product:

| Layer | Role |
| --- | --- |
| **Frontend** | React 18 + Vite + TypeScript workspace for submitting claims, watching the live agent graph, exploring evidence, and reading the synthesis report |
| **Backend** | FastAPI orchestrator that runs Gemini + Groq, retrieves web evidence, scores verdicts, and stores every run |
| **Evidence layer** | Wikipedia, DuckDuckGo, and Gemini Google Search grounding — filtered so only live, article-level URLs survive |
| **Consensus layer** | Sentence embeddings cluster overlapping statements and detect contradictions between models |
| **Verdict layer** | Confidence is **P(claim is true)**, not “how confident the models sounded” |

Default local URLs:

| Service | URL |
| --- | --- |
| App (UI) | [http://localhost:5174](http://localhost:5174) |
| Workspace | [http://localhost:5174/workspace](http://localhost:5174/workspace) |
| History | [http://localhost:5174/history](http://localhost:5174/history) |
| Backend API | [http://127.0.0.1:8000](http://127.0.0.1:8000) |
| Swagger docs | [http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs) |
| Health | [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health) |
| WebSocket | `ws://127.0.0.1:8000/ws/executions/{execution_id}` |

---

## 2. Why this project exists

Single-model chat answers are fluent, fast, and often **wrong with confidence**. That is dangerous for journalism, policy, education, due diligence, and everyday fact-checking.

ClaimNexus exists to:

1. **Investigate, not autocomplete.** A claim is treated as a case file, not a prompt.
2. **Use more than one brain.** Gemini and Groq research independently so one provider’s hallucination does not become the whole story.
3. **Ground the answer in sources.** The UI shows exact article URLs (for example `https://en.wikipedia.org/wiki/Extraterrestrial_life`), never a bare homepage like `https://www.reuters.com/`.
4. **Separate model agreement from evidence.** Two LLMs saying the same thing is interesting. A high-quality source confirming or refuting it is what the verdict uses.
5. **Punish extraordinary claims.** “Aliens visited Earth in 2026” must not score 91% because a TV page mentioned aliens. Without high-quality support, those claims land around **4–18% likelihood** and **Contradicted / Unverified**.
6. **Stay explainable.** Every run produces supporting evidence, contradictory evidence, limitations, critic findings, and a “why this result” breakdown.
7. **Keep secrets off the browser.** API keys never leave the backend `.env` / Render environment.

---

## 3. How it works

```
User claim  →  Claim analyzer  →  Gemini + Groq (parallel)
                                      │
                                      ▼
                         Live web retrieval + URL filter
                                      │
                                      ▼
                    Classify SUPPORTS / CONTRADICTS / NEUTRAL
                                      │
                                      ▼
              Embed claims → cluster consensus → detect conflicts
                                      │
                                      ▼
                       Critic audit → Verdict engine
                                      │
                                      ▼
                     Synthesis report + persisted execution
                                      │
                                      ▼
              Workspace graph, Evidence, Claims, History, Analytics
```

End-to-end path:

1. User opens **Verify Claim** (`/workspace`) and types a statement.
2. Frontend `POST /api/v1/consensus/run` (Vite proxies `/api` and `/ws` to port 8000 in local dev).
3. Orchestrator emits 11 WebSocket stages so the React Flow graph can show the live pointer.
4. Evidence engine gathers Wikipedia + DuckDuckGo (+ Gemini grounding URLs), rejects homepages, and HEAD/GET-checks that links are live.
5. Verdict engine scores **likelihood the claim is true**.
6. Synthesis agent writes the report with real source links.
7. The full case is stored in SQLite (local) or PostgreSQL (production) and appears in **Executions**.

Partial failure is allowed: if Gemini is rate-limited (429) and Groq succeeds, the pipeline still returns a report.

---

## 4. Who it is for

| Audience | Use |
| --- | --- |
| Students / researchers | Check a factual statement before citing it |
| Journalists / analysts | See supporting vs contradicting sources side by side |
| Product / AI teams | Demo a multi-agent verification architecture |
| Educators | Teach why “the model said so” is not evidence |
| Founders / due diligence | Sanity-check market or scientific claims |

Example queries the engine is designed for:

- Comparative: *“Solar is cheaper than coal for new electricity generation.”*
- Predictive: *“Global CO₂ emissions will peak by 2030.”*
- Absolute: *“Vaccines never cause side effects.”*
- Extraordinary: *“Aliens visited Earth in 2026.”* → should be contradicted / unverified with low likelihood.

---

## 5. What it is not

- Not a court of law or a substitute for expert review.
- Not a search engine ranking all of the web.
- Not a live news wire; retrieval uses public Wikipedia / DuckDuckGo / model grounding.
- Not guaranteed to be correct — it is an **evidence assistant** with an explicit limitations section.
- Not a place to put API keys in the frontend.

---

## 6. Features (every screen and capability)

### 6.1 Overview (`/`)

Marketing + product landing page. Explains the 11-stage workflow, independent research agents, evidence classification, and the verdict engine. Primary CTA goes to **Verify Claim**.

### 6.2 Verify Claim / Workspace (`/workspace`)

The main investigation console.

- Claim input (minimum 3 characters).
- Execution modes:
  - **FAST** — 25s provider timeout (quick pass).
  - **BALANCED** — 40s (default).
  - **DEEP** — 50s (more time for research).
- Live **11-stage React Flow graph** with an active-stage pointer.
- **Model cards** for Gemini and Groq: status (COMPLETED / FAILED), latency, tokens, and research text (markdown-safe: `**bold**` renders, leftover `*` is stripped).
- **Synthesis panel**: verdict label, claim-likelihood %, supporting / contradicting / limitation evidence with clickable exact URLs, critic notes, and “why this result”.
- Error boundary so a render bug cannot white-screen the whole app.

### 6.3 Executions / History (`/history`)

Persisted case file list.

- Recent runs with verdict, confidence, mode, and timestamps.
- Open a past run to re-read synthesis and sources.
- Delete one execution (cascading DB cleanup).
- Clear all executions.
- Corrupt rows are skipped instead of crashing the page.
- In-flight request guard + 20s GET timeout so polling cannot pile up.

### 6.4 Claims (`/claims`)

Extracted statements from each model, grouped after semantic clustering. Useful to see *what the models actually asserted*, not just the final paragraph.

### 6.5 Evidence (`/evidence`)

Grounding items with:

| Field | Meaning |
| --- | --- |
| Relationship | **Supports** ✓, **Contradicts** ✕, **Neutral** ○ |
| Quality | HIGH / MEDIUM / LOW from host allow/deny lists |
| Source title | Article title or Wikipedia page title |
| Exact URL | Full article path, never a homepage-only link |
| Research agent | Which retrieval path found it |

### 6.6 Consensus (`/consensus`)

Visual consensus vs conflict view: cluster status (Strong / Moderate / Weak / Conflicting / Single Source) and pairwise contradictions between Gemini and Groq statements.

### 6.7 Analytics (`/analytics`)

Aggregate stats from stored runs:

- Total executions and average latency
- Average claim-likelihood
- Verdict distribution
- Per-model success rate, latency, average extracted claims
- Conflict category counts

### 6.8 Settings (`/settings`)

Runtime algorithm knobs (no secrets):

- Similarity threshold (default **0.82**)
- Temperature (default **0.7**)
- Max tokens (default **1024**)
- Read-only flags: whether Gemini / Groq / xAI keys are configured on the server

Keys are **never** returned to the browser.

### 6.9 Live providers + WebSocket

Sidebar shows Gemini • Groq as live providers. During a run, `ws://…/ws/executions/{id}` streams stage events so the graph does not need to poll the whole pipeline.

### 6.10 Zero-trust credentials

`GEMINI_API_KEY` and `GROQ_API_KEY` load from `Major/.env` with `override=True` so a stale Windows environment key cannot silently win. Gemini `AQ.` keys use `x-goog-api-key` (Vertex express fallback). Groq `gsk_` keys go to Groq.

### 6.11 Source honesty

- Homepage-only URLs are rejected (`/`, `/news`, `/wiki`).
- DuckDuckGo redirect wrappers are unwrapped to the real `uddg=` target.
- Live URL filter (HEAD then GET) drops dead links.
- Cap of **10** evidence items per run.
- Extraordinary claims trigger extra scientific-consensus searches.

### 6.12 Resilience

- Provider timeout isolation (one model can fail).
- SQLite fallback if Postgres is not configured.
- In-memory / Redis-optional cache URL.
- Sentence-Transformers embeddings with a lightweight fallback encoder if the model cannot load.
- Demo / mock provider exists for tests.

---

## 7. 11-stage workflow

These are the exact orchestrator events (`backend/app/agents/orchestrator.py`):

| # | Stage | What happens |
| --- | --- | --- |
| 1 | `CLAIM_RECEIVED` | Query + mode recorded |
| 2 | `CLAIM_ANALYZED` | Subject, type, absolute qualifiers, extraordinary flag |
| 3 | `GEMINI_RESEARCH` | Gemini (`gemini-3.6-flash`) fact-check with Google Search grounding when available |
| 4 | `GROQ_RESEARCH` | Groq (`openai/gpt-oss-120b`) independent fact-check |
| 5 | `EVIDENCE_RETRIEVAL` | Wikipedia + DuckDuckGo + model-cited URLs |
| 6 | `EVIDENCE_ANALYSIS` | Classify supports / contradicts / neutral; score source quality |
| 7 | `CLAIM_CLUSTERING` | Embed extracted sentences; group near-duplicates (cosine ≥ threshold) |
| 8 | `CONFLICT_DETECTION` | Same-topic, opposite-polarity pairs become conflicts |
| 9 | `CRITIC_REVIEW` | Single-source clusters, divergent clusters, conflict severity |
| 10 | `VERDICT_GENERATION` | Likelihood the **claim is true** + human label |
| 11 | `FINAL_SYNTHESIS` | Explainable report persisted as one execution |

Gemini and Groq run as `asyncio` tasks. A failure in one does not cancel the other.

---

## 8. Algorithms

### 8.1 Claim structure analysis

`claim_analyzer.py` tags the input:

| Type | Trigger |
| --- | --- |
| Comparative | “cheaper than”, “vs”, “compared to”, … |
| Extraordinary | alien / UFO / flat earth / time travel / … |
| Absolute | always, never, only, all, none, 100%, … |
| Predictive | will, by 2030, future, … |
| Causal | causes, leads to, results in |
| Factual | default |

Absolute and extraordinary flags **raise the proof bar**.

### 8.2 Evidence classification

Cue-based classifier over title + snippet:

- **Refute cues:** no evidence, debunked, hoax, scientific consensus, myth, …
- **Support cues:** officially confirmed, peer-reviewed evidence, historical record shows, …
- Extraordinary claims: weak topical overlap is **not** support. Without strong confirmation, they classify as **CONTRADICTS**.
- Token overlap is used for ordinary factual claims.

### 8.3 Source quality

Host lists in `web_search.py`:

- **HIGH:** Wikipedia, Nature, Science, Reuters, AP, BBC, NASA, NIH, CDC, WHO, arXiv, Britannica, PubMed, …
- **LOW:** Reddit, Quora, Pinterest, X/Twitter, Facebook, TikTok
- **MEDIUM:** everything else that still has a real article path

### 8.4 Semantic clustering (consensus)

1. Split model output into sentences.
2. Encode with `all-MiniLM-L6-v2` (or fallback n-gram vectors).
3. Greedy clustering: seed a cluster, attach neighbors with cosine similarity ≥ `similarity_threshold` (default **0.82**) or strong lexical overlap.
4. Cluster status from how many models participate and how tight the group is.

### 8.5 Conflict detection

Pairs of claims with high topical similarity but opposing polarity (negation / refute language) become `ConflictSchema` with severity.

### 8.6 Critic agent

Rule auditor, not another LLM call:

- Escalates conflicts.
- Flags **single-source** clusters as hypotheses.
- Flags **divergent** clusters as high severity.
- If clean, emits a verified / proceed finding.

### 8.7 Verdict engine (claim likelihood)

Confidence is **not** “how sure the models were”. It is an estimate of **whether the user’s claim is true**.

| Situation | Typical verdict | Typical likelihood |
| --- | --- | --- |
| No usable URLs + extraordinary | Contradicted / Unverified | ~8% |
| Extraordinary + no HIGH support | Contradicted / Unverified | **4–18%** |
| Only contradicting evidence | Contradicted / False | low |
| Contradicts dominate | Likely Contradicted | ~12–36% |
| Only supporting, ordinary claim | Supported | up to ~88% |
| Supporting but absolute/extraordinary | Likely Supported | capped ~78% |
| Mixed support and contradiction | Partially Supported | ~28–62% |
| Unclear | Inconclusive | ~40% |

Hard clamp: confidence stays in **3.0 – 92.0**. Extraordinary claims cannot inflate to 90%+ on weak or topical-only hits.

### 8.8 Synthesis

The report always includes:

1. Supporting evidence with exact links
2. Contradictory evidence with exact links
3. Limitations / scope (neutral items + extraordinary-claim warning)
4. Honest model-agreement scores derived from each model’s own verdict language — **not** hardcoded 88/84
5. Why-this-result counts (support vs contradict, HQ sources, grounded URLs, absolute/extraordinary flags)

---

## 9. Tech stack

### Frontend

| Piece | Choice |
| --- | --- |
| UI | React 18, TypeScript, Vite 5 |
| Routing | React Router 6 |
| Styling | Tailwind CSS — research editorial theme (`#0D1512` background, `#B46A45` accent) |
| Motion | Framer Motion |
| 3D background | Three.js + React Three Fiber + Drei |
| Workflow graph | React Flow (`@xyflow/react`) |
| Charts | Recharts |
| HTTP | Axios (`/api/v1`, 20s GET / 120s consensus POST) |
| Icons | Lucide |

### Backend

| Piece | Choice |
| --- | --- |
| Runtime | Python 3.11+ |
| API | FastAPI + Uvicorn + Pydantic v2 |
| Orchestration | asyncio task graph |
| ORM | SQLAlchemy 2 (SQLite default, PostgreSQL + pgvector ready) |
| Cache | Redis optional (`REDIS_URL`) |
| Embeddings | Sentence-Transformers `all-MiniLM-L6-v2`, scikit-learn, NumPy |
| HTTP clients | httpx (providers + live URL checks) |
| Realtime | Native WebSockets |
| Config | python-dotenv, `override=True` |

### Models (current defaults)

| Provider | Model id | Role |
| --- | --- | --- |
| Google Gemini | `gemini-3.6-flash` | Research + Google Search grounding |
| Groq | `openai/gpt-oss-120b` | Independent research |
| xAI (optional) | via `XAI_API_KEY` | Provider stub; not in the default workspace pair |

### Data stores

- **Local:** `backend/claimnexus.db` (SQLite)
- **Production:** PostgreSQL (`DATABASE_URL=postgresql+asyncpg://…`)
- **Docker Compose:** `pgvector/pgvector:pg16` + Redis 7

---

## 10. Repository layout

```
Major/
├── .env.example              # Template — copy to .env, never commit secrets
├── .gitignore
├── README.md                 # This file
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py           # FastAPI app, CORS, WS mount
│   │   ├── agents/           # Orchestrator, critic, verdict, synthesis
│   │   ├── api/v1/           # REST routers
│   │   ├── consensus/        # Claim analyzer + clustering engine
│   │   ├── core/config.py    # Env, models, CORS
│   │   ├── database/         # SQLAlchemy session
│   │   ├── embeddings/       # Vector encode + cosine
│   │   ├── evidence/         # Web search + classification
│   │   ├── models/           # ORM entities
│   │   ├── providers/        # Gemini, Groq, xAI, mock
│   │   ├── schemas/          # Pydantic domain models
│   │   └── websocket/        # Stage event broadcast
│   └── tests/test_consensus.py
└── frontend/
    ├── Dockerfile            # nginx serving Vite dist
    ├── package.json
    ├── vite.config.ts        # port 5174, proxy /api and /ws
    └── src/
        ├── App.tsx           # Routes + error boundaries
        ├── pages/            # Landing, Workspace, History, …
        ├── components/       # Sidebar, graph, synthesis, model cards
        ├── services/         # Axios + WebSocket client
        ├── three/            # Neural background
        └── utils/formatText.tsx
```

---

## 11. Prerequisites

- **Python 3.11+**
- **Node.js 18+** (20 LTS recommended)
- **npm**
- Gemini API key and Groq API key (xAI optional)
- Optional: Docker Desktop, Redis, PostgreSQL

Windows note: prefer **no `--reload`** on Uvicorn. WatchFiles + `--reload` can deadlock history polling on Windows.

---

## 12. Environment variables

Copy the template:

```bash
cd Major
copy .env.example .env
```

On macOS/Linux: `cp .env.example .env`

Fill **only** in `.env` (gitignored):

```env
# Provider credentials — server side only
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
XAI_API_KEY=

# Local default
DATABASE_URL=sqlite:///./claimnexus.db

# Optional
REDIS_URL=redis://localhost:6379/0

# CORS / frontend origin
FRONTEND_URL=http://localhost:5174
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

| Variable | Used by | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Backend | Gemini (also accepts `GOOGLE_API_KEY`) |
| `GROQ_API_KEY` | Backend | Groq |
| `XAI_API_KEY` | Backend | Optional xAI |
| `DATABASE_URL` | Backend | SQLite or Postgres |
| `REDIS_URL` | Backend | Optional cache |
| `FRONTEND_URL` | Backend CORS | Allowed origin |
| `VITE_API_BASE_URL` | Frontend **build** | Production API base. Locally, Vite proxy makes this optional |

Never put keys in `frontend/`. Never commit `.env`.

---

## 13. Local run commands

From the `Major` folder.

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Swagger: [http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs)

If you must use auto-reload on macOS/Linux only:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev -- --port 5174
```

App: [http://localhost:5174](http://localhost:5174)

Vite already proxies:

- `/api` → `http://localhost:8000`
- `/ws` → `ws://localhost:8000`

So the browser can call `/api/v1/...` without CORS pain in local dev.

### Production-like frontend build

```bash
cd frontend
npm run build
npm run preview
```

### One-shot health check

```bash
curl http://127.0.0.1:8000/api/v1/health
```

PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health
```

---

## 14. API reference

Base path: `/api/v1`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Process up + which keys are present (booleans only) |
| `POST` | `/consensus/run` | Run the full verification pipeline |
| `GET` | `/executions?limit=20` | List recent runs |
| `GET` | `/executions/{id}` | One run, full graph |
| `DELETE` | `/executions/{id}` | Delete one run (cascade) |
| `DELETE` | `/executions` | Clear all runs |
| `GET` | `/executions/{id}/claims` | Claims for a run |
| `GET` | `/providers` | Gemini / Groq configured + model ids |
| `GET` | `/analytics` | Aggregates |
| `GET` | `/settings` | Algorithm params + key configured flags |
| `PUT` | `/settings` | Update threshold / temperature / max tokens |
| `WS` | `/ws/executions/{id}` | Live stage events |

`POST /consensus/run` body:

```json
{
  "query": "Aliens visited earth on 2026",
  "models": ["gemini", "groq"],
  "mode": "BALANCED",
  "temperature": 0.7,
  "max_tokens": 1024,
  "similarity_threshold": 0.82,
  "demo_mode": false
}
```

---

## 15. Testing

```bash
cd backend
python -m pytest
```

Coverage today includes mock provider generation, claim extraction/clustering, extraordinary-claim low likelihood, and homepage URL rejection.

```bash
cd frontend
npm run build
npm run lint
```

---

## 16. Docker

From `Major/`:

```bash
docker compose up --build
```

Services:

| Service | Port | Notes |
| --- | --- | --- |
| frontend | 5173 → 80 | nginx static build |
| backend | 8000 | Uvicorn |
| postgres | 5432 | pgvector/pg16 |
| redis | 6379 | cache |

Compose injects `XAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY` from your shell / `.env`.

Backend image: `python:3.11-slim` + `uvicorn app.main:app --host 0.0.0.0 --port 8000`  
Frontend image: Node 20 build → nginx alpine.

---

## 17. Push the project to GitHub

Do this from `Major/` (or the git root you actually use). Confirm `.env` is gitignored first.

```bash
git status
```

If this folder is not a repo yet:

```bash
git init
git add .
git commit -m "Add ClaimNexus multi-agent claim verification engine"
```

Create the GitHub repo (GitHub CLI):

```bash
gh repo create ClaimNexus --private --source=. --remote=origin --push
```

Or with git remotes:

```bash
git remote add origin https://github.com/<your-username>/ClaimNexus.git
git branch -M main
git push -u origin main
```

**Do not** `git add .env`. If a key was committed by mistake, rotate it immediately on Groq / Google AI Studio; removing it from git history later is not enough.

Suggested `.gitignore` already covers `.env`, `node_modules/`, `*.db`, `dist/`, `__pycache__/`.

---

## 18. Host backend on Render

1. Push the repo to GitHub (previous section).
2. Open [https://dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service** → connect the GitHub repo.
3. Settings:

| Field | Value |
| --- | --- |
| Root directory | `backend` (if the GitHub repo root is `Major`; if you pushed `Major` as root, leave blank **or** set `backend`) |
| Runtime | Python 3 |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

4. Environment variables on Render:

```text
GEMINI_API_KEY=...
GROQ_API_KEY=...
XAI_API_KEY=          (optional)
DATABASE_URL=         (Render PostgreSQL internal URL; SQLAlchemy needs postgresql+asyncpg:// or postgresql://)
REDIS_URL=            (optional Render Redis)
FRONTEND_URL=https://<your-app>.vercel.app
```

5. Add a **Render PostgreSQL** instance and paste its URL into `DATABASE_URL`. Convert `postgres://` → `postgresql://` if SQLAlchemy complains.

6. CORS: after you know the Vercel URL, add it to `CORS_ORIGINS` in `backend/app/core/config.py` **or** extend config to read `FRONTEND_URL`. Redeploy backend.

7. Open `https://<your-service>.onrender.com/api/v1/health` — should return `"status": "online"`.

Free Render web services **spin down**. First request after idle can take 30–60s; the frontend 120s consensus timeout is sized for that plus model time.

Optional `render.yaml` (repo root or `backend/`):

```yaml
services:
  - type: web
    name: claimnexus-api
    runtime: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GEMINI_API_KEY
        sync: false
      - key: GROQ_API_KEY
        sync: false
      - key: DATABASE_URL
        fromDatabase:
          name: claimnexus-db
          property: connectionString
      - key: FRONTEND_URL
        value: https://your-app.vercel.app
```

---

## 19. Host frontend on Vercel

1. Open [https://vercel.com](https://vercel.com) → **Add New** → **Project** → import the GitHub repo.
2. Framework preset: **Vite**.
3. Settings:

| Field | Value |
| --- | --- |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

4. Environment variable (Production + Preview):

```text
VITE_API_BASE_URL=https://<your-backend>.onrender.com/api/v1
```

`VITE_*` is baked in at **build** time. If you change the API URL, **redeploy** the frontend.

5. SPA routing: add `frontend/vercel.json` so `/workspace` and `/history` do not 404 on refresh:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

6. Deploy. App URL looks like `https://claimnexus.vercel.app`.

WebSockets from the browser should target the Render host (`wss://<backend>.onrender.com/ws/executions/...`). If the production client still points at relative `/ws`, either proxy WS on Vercel (limited) or set a `VITE_WS_BASE_URL` and read it in `frontend/src/services/websocket.ts`.

---

## 20. Link Vercel and Render

This is the production wiring. Miss one step and the UI loads but every run fails.

```
Browser (Vercel)
    │  HTTPS  POST /api/v1/consensus/run
    │  WSS    /ws/executions/{id}
    ▼
FastAPI (Render)
    │
    ├── Gemini API
    ├── Groq API
    ├── Wikipedia / DuckDuckGo
    └── PostgreSQL (+ optional Redis)
```

Checklist:

1. Frontend `VITE_API_BASE_URL` = `https://<render-service>.onrender.com/api/v1` (no trailing path mistakes).
2. Backend `CORS_ORIGINS` includes `https://<app>.vercel.app` (and the `*.vercel.app` preview URLs you actually use).
3. Backend `FRONTEND_URL` matches the Vercel origin.
4. Render env has real `GEMINI_API_KEY` and `GROQ_API_KEY`.
5. `DATABASE_URL` points at Render Postgres, not a local sqlite file (the container filesystem is ephemeral).
6. Confirm:
   - `https://<render>/api/v1/health`
   - `https://<render>/api/v1/providers`
   - Vercel `/workspace` → submit a short claim → history fills.

Local linking (already configured):

```text
Vite :5174  --proxy /api,/ws-->  Uvicorn :8000
```

---

## 21. Security notes

- API keys stay on the server. Settings API returns `gemini_configured: true/false` only.
- `.env` is gitignored. Rotate any key that ever hit a chat log or commit.
- CORS should be tightened in production (`*` is convenient for local demos, not for a public API with your quota).
- Live URL fetching is server-side with a fixed User-Agent; do not proxy arbitrary user URLs without timeouts (already using httpx timeouts).
- Do not log raw provider payloads that might contain keys.

---

## 22. Known constraints

- Gemini may return **429 quota** or **503 high demand**; Groq often still completes the run.
- Wikipedia/DuckDuckGo can return **topically related** pages (a TV show named *Alien: Earth*) that are not proof of the claim. The extraordinary-claim rules exist because of this.
- Source titles sometimes fall back to URL path fragments.
- Embeddings download `all-MiniLM-L6-v2` on first use (needs network once).
- Uvicorn `--reload` on Windows can hang “Waiting for connections to close”.
- This is an evidence assistant, not ground truth.

---

## 23. Future scope

Product and research directions that fit this architecture:

1. **Human-in-the-loop review** — analyst can override a relationship (SUPPORTS → CONTRADICTS) and freeze the case.
2. **More providers** — enable the xAI path in the workspace model picker; add Claude / OpenAI as optional third researchers.
3. **Citation graph UI** — click a URL and see which cluster and which model cited it.
4. **PDF / URL claim intake** — paste an article; extract atomic claims; verify each.
5. **Multilingual claims** — retrieve in the source language; report in the user’s language.
6. **Authenticated workspaces** — per-user history, sharing links, team review queues.
7. **pgvector production search** — store evidence embeddings and retrieve similar past cases.
8. **Eval harness** — gold set of true/false/extraordinary claims with expected likelihood bands; CI gate.
9. **Rate-limit & cost dashboard** — tokens, Gemini grounding calls, Groq latency SLOs.
10. **Browser extension** — highlight a sentence on the web, send to ClaimNexus.
11. **Export** — PDF / Markdown verification reports for research notebooks.
12. **Stronger live retrieval** — official news APIs, Crossref, Semantic Scholar, instead of DuckDuckGo HTML.
13. **Calibration** — map engine scores to empirical accuracy (reliability diagrams).
14. **Abuse controls** — auth, quotas, and prompt-injection hardening on user claims.

---

## 24. What to add when you extend it

Use this as a build checklist so new work does not recreate old bugs.

| If you add… | Also add… |
| --- | --- |
| A new LLM provider | `providers/<name>_provider.py`, factory entry, health/providers flags, **no** frontend key field |
| A new page | Route in `App.tsx` wrapped in `ErrorBoundary`, sidebar link, API types |
| A new evidence source | Homepage rejection + live URL check + quality host list |
| A new verdict rule | Unit test in `tests/test_consensus.py` (especially extraordinary + low likelihood) |
| A new DB column | SQLite `ALTER` in `init_db()` **and** Postgres migration story |
| Production frontend URL | CORS origin + `FRONTEND_URL` + rebuild with `VITE_API_BASE_URL` |
| Auth | Do not put JWT secrets in Vite; keep sessions on FastAPI |
| File uploads | Virus/size limits; never send files to the model without stripping |
| `--reload` | Document Windows hang; prefer process restart |

Code conventions that already saved this project:

- `selectinload` (not cartesian `joinedload`) for execution lists.
- Skip corrupt history rows instead of 500-ing the whole list.
- Confidence = P(claim is true), never “models sounded sure”.
- Exact article URLs only.

---

## 25. License

MIT License. ClaimNexus — Multi-Agent Claim Verification & Evidence Engine.

---

**Investigate a claim:** [http://localhost:5174/workspace](http://localhost:5174/workspace)  
**API docs:** [http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs)
