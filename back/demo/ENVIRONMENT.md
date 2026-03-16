# Backend Environment

## Local DB

```bash
cd back/demo
cp .env.local.example .env.local
set -a
source .env.local
set +a
./mvnw spring-boot:run
```

## Server DB from local machine

```bash
cd back/demo
cp .env.server.example .env.server
set -a
source .env.server
set +a
./mvnw spring-boot:run
```

`.env.local` and `.env.server` stay on your machine and are ignored by git.
