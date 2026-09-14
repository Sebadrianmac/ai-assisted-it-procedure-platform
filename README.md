# AI-Assisted IT Procedure Platform

Description:
## Features

List of features
## Technology stack

Django, React, PostgreSQL, pgvector, llama.cpp и Docker.



## Docker setup

### Requirements

- Docker Desktop with WSL 2
- NVIDIA GPU with Docker GPU support
- NVIDIA driver compatible with CUDA 12.8
- Qwen3-4B GGUF model

### Environment configuration

Create a local Docker environment file from the example:

```powershell
Copy-Item .env.docker.example .env.docker
```

Update these values in `.env.docker`:

- `DJANGO_SECRET_KEY`
- `DB_PASSWORD`
- `AI_MODEL_PATH`

### Build and start

```powershell
docker compose --env-file .env.docker build
docker compose --env-file .env.docker up -d
```

### Initialize the application

```powershell
docker compose --env-file .env.docker exec backend python manage.py migrate
docker compose --env-file .env.docker exec backend python manage.py setup_roles
docker compose --env-file .env.docker exec backend python manage.py createsuperuser
```

Open the application at:

```text
http://localhost:5173
```

### Stop the application

```powershell
docker compose --env-file .env.docker down
```

Do not use `down -v` unless you intentionally want to delete the database volume.