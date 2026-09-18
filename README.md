# AI-Assisted IT Procedure Platform

A web application for creating, reviewing, approving, and executing IT procedures with assistance from a locally hosted AI model.
The platform combines procedure management, role-based access control, document retrieval, task assignment, and AI-assisted content generation.

## Project purpose

The application helps organizations:

- create and maintain structured IT procedures;
- manage different versions of procedures;
- submit procedures for review and approval;
- assign procedure steps to users or roles;
- attach relevant documents to individual steps;
- generate procedures and steps with AI;
- collect user feedback on AI recommendations;
- improve future AI generations using previous accepted and modified results.

## Main features

### User and role management

- JWT authentication;
- user profile management;
- role-based access control;
- permissions based on Django groups;
- administrator-managed user accounts.

### Procedure management

- manual procedure creation;
- AI-assisted procedure creation;
- procedure drafts;
- submission for approval;
- procedure review and approval;
- major and minor versioning;
- procedure version history;
- documents assigned to individual procedure steps.

### Procedure execution

- creation of an execution from an approved procedure;
- assignment of each step to a user or role;
- task board with execution statuses;
- filtering tasks assigned to the current user.

### AI assistance

- complete procedure generation;
- procedure-step generation;
- relevant-document recommendations;
- responsible-role recommendations;
- locally hosted language model;
- structured JSON responses with backend validation.

### AI feedback

The application records how users interact with generated content.

Supported feedback states:

- `pending` – generated but not evaluated;
- `accepted` – saved without changes;
- `modified` – changed before or after saving;
- `rejected` – discarded without being used.

Accepted and modified results are converted into embeddings and stored in PostgreSQL with pgvector. Similar feedback can then be included as context in future AI generations.

Currently, feedback-based retrieval is implemented for:

- complete AI-generated procedures;
- AI-generated procedure steps.

Feedback collection for document and role recommendations is planned as future development.

## Technology stack

### Backend

- Python
- Django
- Django REST Framework
- Simple JWT
- PostgreSQL
- pgvector

### Frontend

- React
- Vite
- Axios
- React Router
- Lucide React

### Artificial intelligence

- llama.cpp server
- Qwen3-4B GGUF model
- Hugging Face Transformers
- Snowflake Arctic embedding model
- semantic search
- Retrieval-Augmented Generation

### Infrastructure

- Docker
- Docker Compose
- Docker Desktop
- WSL 2
- NVIDIA Container Toolkit

## System architecture

```text
React frontend
      |
      | HTTP / JSON
      v
Django REST API
      |
      +---- PostgreSQL
      |       |
      |       +---- application data
      |       +---- pgvector embeddings
      |
      +---- llama.cpp AI server
              |
              +---- Qwen3-4B GGUF model
```

Docker Compose starts four services:

| Service | Purpose | Address |
|---|---|---|
| `frontend` | React and Vite interface | `http://localhost:5173` |
| `backend` | Django REST API | `http://localhost:8000` |
| `db` | PostgreSQL with pgvector | Host port `5433` |
| `ai` | llama.cpp model server | `http://localhost:8080` |

## AI recommendation workflow

1. The user requests a procedure or step generation.
2. Django sends a structured prompt to the local AI server.
3. The AI response is validated by the backend.
4. An `AIRecommendation` record is created with the `pending` status.
5. The frontend stores the recommendation ID.
6. When the procedure is saved, the recommendation is linked to its procedure version.
7. The generated result is compared with the saved result.
8. The recommendation becomes `accepted` or `modified`.
9. An unused recommendation can become `rejected`.
10. Accepted and modified feedback is indexed in pgvector.
11. Semantically similar feedback can be used in future generations.

## Docker setup

### Requirements

- Git
- Docker Desktop with WSL 2
- NVIDIA GPU with Docker GPU support
- NVIDIA driver compatible with the CUDA version used by the AI image
- Qwen3-4B GGUF model

### Clone the repository

```powershell
git clone REPOSITORY_URL
cd ai-assisted-it-procedure-platform
```

Replace `REPOSITORY_URL` with the repository URL.

### Configure environment variables

Create a local environment file from the example:

```powershell
Copy-Item .env.docker.example .env.docker
```

Update the required values in `.env.docker`:

```text
DJANGO_SECRET_KEY
DB_NAME
DB_USER
DB_PASSWORD
AI_MODEL_PATH
```

Do not commit `.env.docker` to Git.

### Build the Docker images

```powershell
docker compose --env-file .env.docker build
```

### Start the application

```powershell
docker compose --env-file .env.docker up -d
```

Check the containers:

```powershell
docker compose --env-file .env.docker ps
```

### Initialize the database

Apply database migrations:

```powershell
docker compose --env-file .env.docker exec backend python manage.py migrate
```

Create application roles:

```powershell
docker compose --env-file .env.docker exec backend python manage.py setup_roles
```

Create the first administrator:

```powershell
docker compose --env-file .env.docker exec backend python manage.py createsuperuser
```

Open the application:

```text
http://localhost:5173
```

## Common Docker commands

### View logs

```powershell
docker compose --env-file .env.docker logs --tail 100
```

Backend logs:

```powershell
docker compose --env-file .env.docker logs --tail 100 backend
```

AI server logs:

```powershell
docker compose --env-file .env.docker logs --tail 100 ai
```

### Run Django checks

```powershell
docker compose --env-file .env.docker exec backend python manage.py check
```

### Stop the application

```powershell
docker compose --env-file .env.docker down
```

Do not use `docker compose down -v` unless you intentionally want to delete the database volume.

### Rebuild after dependency changes

```powershell
docker compose --env-file .env.docker build backend
docker compose --env-file .env.docker up -d backend
```

Frontend:

```powershell
docker compose --env-file .env.docker build frontend
docker compose --env-file .env.docker up -d frontend
```

Changes to source code normally do not require rebuilding when the source directories are mounted as Docker volumes. Rebuilding is required after changing dependencies or Dockerfiles.


## Future improvements

- feedback tracking for role recommendations;
- feedback tracking for document recommendations;
- additional automated tests;
- production deployment configuration;
- background processing for embeddings;
- AI recommendation analytics;
- improved error monitoring;
- model and embedding revision pinning.
- audit features
## Author

Sebastian Mackiewicz

Computer Science student project developed during professional internship