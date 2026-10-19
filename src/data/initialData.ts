import { StackTemplate } from '../types';

export const INITIAL_TEMPLATES: StackTemplate[] = [
  {
    id: 'laravel-stack',
    name: 'Laravel Full-Stack',
    description: 'MySQL 8.0, Redis Alpine, Mailpit SMTP catcher & Meilisearch search engine.',
    services: [
      { name: 'mysql', image: 'mysql:8.0', defaultPort: 3306, assignedPort: 3306, status: 'healthy' },
      { name: 'redis', image: 'redis:alpine', defaultPort: 6379, assignedPort: 6379, status: 'healthy' },
      { name: 'mailpit', image: 'axllent/mailpit:latest', defaultPort: 8025, assignedPort: 8025, status: 'healthy' },
      { name: 'meilisearch', image: 'getmeili/meilisearch:v1.6', defaultPort: 7700, assignedPort: 7700, status: 'healthy' },
    ],
    domains: [
      { domain: 'mail.oma.local', portVar: 'PORT_MAILPIT_HTTP' },
      { domain: 'search.oma.local', portVar: 'PORT_MEILI' },
    ],
    confContent: `# stack.conf - Metadata and Default Ports for laravel-stack
STACK_NAME="laravel-stack"
STACK_DESCRIPTION="Full Laravel Stack: MySQL 8.0, Redis Alpine, Mailpit SMTP catcher, Meilisearch"
PORT_MYSQL=3306
PORT_REDIS=6379
PORT_MAILPIT_HTTP=8025
PORT_MAILPIT_SMTP=1025
PORT_MEILI=7700

DOMAIN_MAIL="mail.oma.local:PORT_MAILPIT_HTTP"
DOMAIN_MEILI="search.oma.local:PORT_MEILI"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  mysql:
    image: mysql:8.0
    container_name: omastack-laravel-mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: '\${DB_DATABASE:-laravel}'
      MYSQL_USER: '\${DB_USERNAME:-laravel}'
      MYSQL_PASSWORD: '\${DB_PASSWORD:-secret}'
      MYSQL_ROOT_PASSWORD: '\${DB_PASSWORD:-secret}'
    ports:
      - "\${PORT_MYSQL:-3306}:3306"
    networks:
      - omastack-net
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:alpine
    container_name: omastack-laravel-redis
    restart: unless-stopped
    command: redis-server --requirepass \${OMASTACK_SECRET_KEY:-secret}
    environment:
      - REDISCLI_AUTH=\${OMASTACK_SECRET_KEY:-secret}
    ports:
      - "\${PORT_REDIS:-6379}:6379"
    networks:
      - omastack-net

  mailpit:
    image: axllent/mailpit:latest
    container_name: omastack-laravel-mailpit
    restart: unless-stopped
    ports:
      - "\${PORT_MAILPIT_HTTP:-8025}:8025"
      - "\${PORT_MAILPIT_SMTP:-1025}:1025"
    networks:
      - omastack-net

  meilisearch:
    image: getmeili/meilisearch:v1.6
    container_name: omastack-laravel-meilisearch
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: '\${MEILISEARCH_KEY:-masterKey123}'
      MEILI_ENV: 'development'
    ports:
      - "\${PORT_MEILI:-7700}:7700"
    networks:
      - omastack-net`,
  },
  {
    id: 'supabase-lite',
    name: 'Supabase Lite',
    description: 'PostgreSQL 16 with pgvector extension, PostgREST API, GoTrue Auth & PgAdmin UI.',
    services: [
      { name: 'postgres', image: 'pgvector/pgvector:pg16', defaultPort: 5432, assignedPort: 5432, status: 'healthy' },
      { name: 'postgrest', image: 'postgrest/postgrest:v12.0.2', defaultPort: 3000, assignedPort: 3000, status: 'healthy' },
      { name: 'pgadmin', image: 'dpage/pgadmin4:latest', defaultPort: 5051, assignedPort: 5051, status: 'healthy' },
    ],
    domains: [
      { domain: 'supabase.oma.local', portVar: 'PORT_PGADMIN' },
      { domain: 'api.supabase.oma.local', portVar: 'PORT_POSTGREST' },
    ],
    confContent: `# stack.conf - Metadata and Default Ports for supabase-lite
STACK_NAME="supabase-lite"
STACK_DESCRIPTION="Lightweight Supabase Backend: PostgreSQL 16 pgvector, PostgREST & PgAdmin UI"
PORT_POSTGRES=5432
PORT_POSTGREST=3000
PORT_PGADMIN=5051

DOMAIN_STUDIO="supabase.oma.local:PORT_PGADMIN"
DOMAIN_API="api.supabase.oma.local:PORT_POSTGREST"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: omastack-supabase-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
    ports:
      - "\${PORT_POSTGRES:-5432}:5432"
    networks:
      - omastack-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  postgrest:
    image: postgrest/postgrest:v12.0.2
    container_name: omastack-supabase-rest
    restart: unless-stopped
    environment:
      PGRST_DB_URI: "postgres://postgres:postgrespassword@postgres:5432/postgres"
      PGRST_DB_SCHEMA: "public"
      PGRST_DB_ANON_ROLE: "postgres"
    ports:
      - "\${PORT_POSTGREST:-3000}:3000"
    networks:
      - omastack-net

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: omastack-supabase-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: "admin@omastack.local"
      PGADMIN_DEFAULT_PASSWORD: "admin"
    ports:
      - "\${PORT_PGADMIN:-5051}:80"
    networks:
      - omastack-net`,
  },
  {
    id: 'nextjs-postgres',
    name: 'Next.js 14 Full-Stack',
    description: 'Next.js 14 App Router, PostgreSQL 16, Redis Alpine & Adminer UI on localhost:3000.',
    services: [
      { name: 'nextjs', image: 'node:20-alpine', defaultPort: 3000, assignedPort: 3000, status: 'healthy' },
      { name: 'postgres', image: 'postgres:16-alpine', defaultPort: 5432, assignedPort: 5432, status: 'healthy' },
      { name: 'redis', image: 'redis:alpine', defaultPort: 6379, assignedPort: 6379, status: 'healthy' },
      { name: 'adminer', image: 'adminer:latest', defaultPort: 8080, assignedPort: 8080, status: 'healthy' },
    ],
    domains: [
      { domain: 'next.oma.local', portVar: 'PORT_NEXTJS' },
      { domain: 'db.oma.local', portVar: 'PORT_ADMINER' },
    ],
    confContent: `# stack.conf - Metadata and Default Ports for nextjs-postgres
STACK_NAME="nextjs-postgres"
STACK_DESCRIPTION="Next.js Full-Stack Essentials: App Router, PostgreSQL 16, Redis Alpine & Adminer UI"
PORT_NEXTJS=3000
PORT_POSTGRES=5432
PORT_REDIS=6379
PORT_ADMINER=8080

DOMAIN_APP="next.oma.local:PORT_NEXTJS"
DOMAIN_ADMINER="db.oma.local:PORT_ADMINER"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  nextjs:
    image: node:20-alpine
    container_name: omastack-nextjs-app
    restart: unless-stopped
    ports:
      - "\${PORT_NEXTJS:-3000}:3000"
    networks:
      - omastack-net

  postgres:
    image: postgres:16-alpine
    container_name: omastack-nextjs-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: apppassword
    ports:
      - "\${PORT_POSTGRES:-5432}:5432"
    networks:
      - omastack-net

  redis:
    image: redis:alpine
    container_name: omastack-nextjs-redis
    restart: unless-stopped
    command: redis-server --requirepass \${OMASTACK_SECRET_KEY:-apppassword}
    ports:
      - "\${PORT_REDIS:-6379}:6379"
    networks:
      - omastack-net

  adminer:
    image: adminer:latest
    container_name: omastack-nextjs-adminer
    restart: unless-stopped
    ports:
      - "\${PORT_ADMINER:-8080}:8080"
    networks:
      - omastack-net`,
  },
  {
    id: 'automation-hub',
    name: 'n8n Automation Hub',
    description: 'Self-hosted n8n workflow automation with PostgreSQL 16 & Redis queue worker.',
    services: [
      { name: 'n8n', image: 'docker.n8n.io/n8nio/n8n:latest', defaultPort: 5678, assignedPort: 5678, status: 'healthy' },
      { name: 'postgres', image: 'postgres:16-alpine', defaultPort: 5432, assignedPort: 5432, status: 'healthy' },
      { name: 'redis', image: 'redis:alpine', defaultPort: 6379, assignedPort: 6379, status: 'healthy' },
    ],
    domains: [{ domain: 'n8n.oma.local', portVar: 'PORT_N8N' }],
    confContent: `# stack.conf - Metadata and Default Ports for automation-hub
STACK_NAME="automation-hub"
STACK_DESCRIPTION="Self-Hosted Workflow Automation: n8n, PostgreSQL 16, Redis Alpine & Cloudflared Tunnel"
PORT_N8N=5678
PORT_POSTGRES=5432
PORT_REDIS=6379

DOMAIN_N8N="n8n.oma.local:PORT_N8N"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: omastack-automation-n8n
    restart: unless-stopped
    ports:
      - "\${PORT_N8N:-5678}:5678"
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=n8npassword
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PASSWORD=\${OMASTACK_SECRET_KEY:-n8nsecret}
    networks:
      - omastack-net

  postgres:
    image: postgres:16-alpine
    container_name: omastack-automation-db
    restart: unless-stopped
    ports:
      - "\${PORT_POSTGRES:-5432}:5432"
    networks:
      - omastack-net

  redis:
    image: redis:alpine
    container_name: omastack-automation-redis
    restart: unless-stopped
    command: redis-server --requirepass \${OMASTACK_SECRET_KEY:-n8nsecret}
    ports:
      - "\${PORT_REDIS:-6379}:6379"
    networks:
      - omastack-net`,
  },
  {
    id: 'web3-node',
    name: 'Web3 RPC Node',
    description: 'Local Anvil/Hardhat RPC proxy, PostgreSQL 16 & Redis caching for blockchain dev.',
    services: [
      { name: 'rpc-proxy', image: 'nginx:alpine', defaultPort: 8545, assignedPort: 8545, status: 'healthy' },
      { name: 'postgres', image: 'postgres:16-alpine', defaultPort: 5432, assignedPort: 5432, status: 'healthy' },
      { name: 'redis', image: 'redis:alpine', defaultPort: 6379, assignedPort: 6379, status: 'healthy' },
    ],
    domains: [{ domain: 'rpc.oma.local', portVar: 'PORT_RPC' }],
    confContent: `# stack.conf - Metadata and Default Ports for web3-node
STACK_NAME="web3-node"
STACK_DESCRIPTION="Local Web3 / EVM Environment: Anvil/Hardhat RPC Proxy, PostgreSQL 16 & Redis Caching"
PORT_RPC=8545
PORT_POSTGRES=5432
PORT_REDIS=6379

DOMAIN_RPC="rpc.oma.local:PORT_RPC"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  rpc-proxy:
    image: nginx:alpine
    container_name: omastack-web3-rpc
    restart: unless-stopped
    ports:
      - "\${PORT_RPC:-8545}:8545"
    networks:
      - omastack-net

  postgres:
    image: postgres:16-alpine
    container_name: omastack-web3-db
    restart: unless-stopped
    ports:
      - "\${PORT_POSTGRES:-5432}:5432"
    networks:
      - omastack-net

  redis:
    image: redis:alpine
    container_name: omastack-web3-redis
    restart: unless-stopped
    command: redis-server --requirepass \${OMASTACK_SECRET_KEY:-web3secret}
    ports:
      - "\${PORT_REDIS:-6379}:6379"
    networks:
      - omastack-net`,
  },
  {
    id: 'rails-kamal',
    name: 'Rails 8 + Kamal Stack',
    description: 'PostgreSQL 16, Redis/SolidQueue, Mailpit SMTP catcher & MinIO S3 object storage.',
    services: [
      { name: 'postgres', image: 'postgres:16-alpine', defaultPort: 5432, assignedPort: 5432, status: 'healthy' },
      { name: 'redis', image: 'redis:alpine', defaultPort: 6379, assignedPort: 6379, status: 'healthy' },
      { name: 'mailpit', image: 'axllent/mailpit:latest', defaultPort: 8025, assignedPort: 8025, status: 'healthy' },
      { name: 'minio', image: 'minio/minio:latest', defaultPort: 9000, assignedPort: 9000, status: 'healthy' },
    ],
    domains: [
      { domain: 'rails-mail.oma.local', portVar: 'PORT_MAILPIT_HTTP' },
      { domain: 's3.oma.local', portVar: 'PORT_MINIO_CONSOLE' },
    ],
    confContent: `# stack.conf - Metadata and Default Ports for rails-kamal
STACK_NAME="rails-kamal"
STACK_DESCRIPTION="Ruby on Rails 8 & Kamal Stack: PostgreSQL 16, Redis/SolidQueue, Mailpit SMTP & MinIO S3"
PORT_POSTGRES=5432
PORT_REDIS=6379
PORT_MAILPIT_HTTP=8025
PORT_MAILPIT_SMTP=1025
PORT_MINIO_API=9000
PORT_MINIO_CONSOLE=9001

DOMAIN_MAIL="rails-mail.oma.local:PORT_MAILPIT_HTTP"
DOMAIN_S3="s3.oma.local:PORT_MINIO_CONSOLE"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  postgres:
    image: postgres:16-alpine
    container_name: omastack-rails-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: rails_development
      POSTGRES_USER: rails
      POSTGRES_PASSWORD: railspassword
    ports:
      - "127.0.0.1:\${PORT_POSTGRES:-5432}:5432"
    networks:
      - omastack-net

  redis:
    image: redis:alpine
    container_name: omastack-rails-redis
    restart: unless-stopped
    command: redis-server --requirepass \${OMASTACK_SECRET_KEY:-railspassword}
    ports:
      - "127.0.0.1:\${PORT_REDIS:-6379}:6379"
    networks:
      - omastack-net

  mailpit:
    image: axllent/mailpit:latest
    container_name: omastack-rails-mailpit
    restart: unless-stopped
    ports:
      - "127.0.0.1:\${PORT_MAILPIT_HTTP:-8025}:8025"
      - "127.0.0.1:\${PORT_MAILPIT_SMTP:-1025}:1025"
    networks:
      - omastack-net

  minio:
    image: minio/minio:latest
    container_name: omastack-rails-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadminpassword
    ports:
      - "127.0.0.1:\${PORT_MINIO_API:-9000}:9000"
      - "127.0.0.1:\${PORT_MINIO_CONSOLE:-9001}:9001"
    networks:
      - omastack-net`,
  },
  {
    id: 'ai-rag-stack',
    name: 'AI Vector & RAG Sandbox',
    description: 'Qdrant Vector Database, PostgreSQL 16 with pgvector extension & Redis Semantic Cache.',
    services: [
      { name: 'qdrant', image: 'qdrant/qdrant:latest', defaultPort: 6333, assignedPort: 6333, status: 'healthy' },
      { name: 'postgres', image: 'pgvector/pgvector:pg16', defaultPort: 5432, assignedPort: 5432, status: 'healthy' },
      { name: 'redis', image: 'redis:alpine', defaultPort: 6379, assignedPort: 6379, status: 'healthy' },
    ],
    domains: [{ domain: 'qdrant.oma.local', portVar: 'PORT_QDRANT_HTTP' }],
    confContent: `# stack.conf - Metadata and Default Ports for ai-rag-stack
STACK_NAME="ai-rag-stack"
STACK_DESCRIPTION="AI & RAG Vector Sandbox: Qdrant Vector DB, PostgreSQL 16 pgvector & Redis Cache"
PORT_QDRANT_HTTP=6333
PORT_QDRANT_GRPC=6334
PORT_POSTGRES=5432
PORT_REDIS=6379

DOMAIN_QDRANT="qdrant.oma.local:PORT_QDRANT_HTTP"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: omastack-ai-qdrant
    restart: unless-stopped
    environment:
      QDRANT__SERVICE__API_KEY: \${OMASTACK_SECRET_KEY:-secretKey}
    ports:
      - "127.0.0.1:\${PORT_QDRANT_HTTP:-6333}:6333"
      - "127.0.0.1:\${PORT_QDRANT_GRPC:-6334}:6334"
    networks:
      - omastack-net

  postgres:
    image: pgvector/pgvector:pg16
    container_name: omastack-ai-pgvector
    restart: unless-stopped
    environment:
      POSTGRES_DB: ragdb
      POSTGRES_USER: aiuser
      POSTGRES_PASSWORD: aipassword
    ports:
      - "127.0.0.1:\${PORT_POSTGRES:-5432}:5432"
    networks:
      - omastack-net

  redis:
    image: redis:alpine
    container_name: omastack-ai-redis
    restart: unless-stopped
    command: redis-server --requirepass \${OMASTACK_SECRET_KEY:-secretKey}
    ports:
      - "127.0.0.1:\${PORT_REDIS:-6379}:6379"
    networks:
      - omastack-net`,
  },
  {
    id: 'mern-mongo',
    name: 'MERN + MongoDB 7',
    description: 'MongoDB 7 document database, Mongo Express Web UI & Redis Alpine session store.',
    services: [
      { name: 'mongodb', image: 'mongo:7', defaultPort: 27017, assignedPort: 27017, status: 'healthy' },
      { name: 'mongo-express', image: 'mongo-express:latest', defaultPort: 8081, assignedPort: 8081, status: 'healthy' },
      { name: 'redis', image: 'redis:alpine', defaultPort: 6379, assignedPort: 6379, status: 'healthy' },
    ],
    domains: [{ domain: 'mongo.oma.local', portVar: 'PORT_MONGO_EXPRESS' }],
    confContent: `# stack.conf - Metadata and Default Ports for mern-mongo
STACK_NAME="mern-mongo"
STACK_DESCRIPTION="MERN & Document Stack: MongoDB 7, Mongo Express Web UI & Redis Alpine"
PORT_MONGO=27017
PORT_MONGO_EXPRESS=8081
PORT_REDIS=6379

DOMAIN_MONGO="mongo.oma.local:PORT_MONGO_EXPRESS"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  mongodb:
    image: mongo:7
    container_name: omastack-mern-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: mongopassword
      MONGO_INITDB_DATABASE: merndb
    ports:
      - "127.0.0.1:\${PORT_MONGO:-27017}:27017"
    networks:
      - omastack-net

  mongo-express:
    image: mongo-express:latest
    container_name: omastack-mern-mongo-express
    restart: unless-stopped
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: mongopassword
      ME_CONFIG_MONGODB_URL: "mongodb://admin:mongopassword@mongodb:27017/"
      ME_CONFIG_BASICAUTH: "false"
    ports:
      - "127.0.0.1:\${PORT_MONGO_EXPRESS:-8081}:8081"
    networks:
      - omastack-net

  redis:
    image: redis:alpine
    container_name: omastack-mern-redis
    restart: unless-stopped
    command: redis-server --requirepass \${OMASTACK_SECRET_KEY:-mongopassword}
    ports:
      - "127.0.0.1:\${PORT_REDIS:-6379}:6379"
    networks:
      - omastack-net`,
  },
  {
    id: 'golang-microservices',
    name: 'Go & Rust Microservices',
    description: 'RabbitMQ 3 Management Broker, Jaeger OpenTelemetry Tracing, PostgreSQL 16 & Redis.',
    services: [
      { name: 'rabbitmq', image: 'rabbitmq:3-management-alpine', defaultPort: 5672, assignedPort: 5672, status: 'healthy' },
      { name: 'jaeger', image: 'jaegertracing/all-in-one:latest', defaultPort: 16686, assignedPort: 16686, status: 'healthy' },
      { name: 'postgres', image: 'postgres:16-alpine', defaultPort: 5432, assignedPort: 5432, status: 'healthy' },
      { name: 'redis', image: 'redis:alpine', defaultPort: 6379, assignedPort: 6379, status: 'healthy' },
    ],
    domains: [
      { domain: 'amqp.oma.local', portVar: 'PORT_RABBITMQ_UI' },
      { domain: 'trace.oma.local', portVar: 'PORT_JAEGER_UI' },
    ],
    confContent: `# stack.conf - Metadata and Default Ports for golang-microservices
STACK_NAME="golang-microservices"
STACK_DESCRIPTION="Distributed Go/Rust Microservices: RabbitMQ Management, Jaeger Tracing, PostgreSQL 16 & Redis"
PORT_RABBITMQ_AMQP=5672
PORT_RABBITMQ_UI=15672
PORT_JAEGER_UI=16686
PORT_JAEGER_OTLP=4318
PORT_POSTGRES=5432
PORT_REDIS=6379

DOMAIN_RABBITMQ="amqp.oma.local:PORT_RABBITMQ_UI"
DOMAIN_JAEGER="trace.oma.local:PORT_JAEGER_UI"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: omastack-go-rabbitmq
    restart: unless-stopped
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "127.0.0.1:\${PORT_RABBITMQ_AMQP:-5672}:5672"
      - "127.0.0.1:\${PORT_RABBITMQ_UI:-15672}:15672"
    networks:
      - omastack-net

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: omastack-go-jaeger
    restart: unless-stopped
    environment:
      COLLECTOR_OTLP_ENABLED: "true"
    ports:
      - "127.0.0.1:\${PORT_JAEGER_UI:-16686}:16686"
      - "127.0.0.1:\${PORT_JAEGER_OTLP:-4318}:4318"
    networks:
      - omastack-net

  postgres:
    image: postgres:16-alpine
    container_name: omastack-go-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: microdb
      POSTGRES_USER: micro
      POSTGRES_PASSWORD: micropassword
    ports:
      - "127.0.0.1:\${PORT_POSTGRES:-5432}:5432"
    networks:
      - omastack-net

  redis:
    image: redis:alpine
    container_name: omastack-go-redis
    restart: unless-stopped
    command: redis-server --requirepass \${OMASTACK_SECRET_KEY:-gopassword}
    ports:
      - "127.0.0.1:\${PORT_REDIS:-6379}:6379"
    networks:
      - omastack-net`,
  },
  {
    id: 'django-celery',
    name: 'Python Django + Celery',
    description: 'PostgreSQL 16, Redis Celery Broker, Flower Task Monitor UI & Mailpit SMTP.',
    services: [
      { name: 'postgres', image: 'postgres:16-alpine', defaultPort: 5432, assignedPort: 5432, status: 'healthy' },
      { name: 'redis', image: 'redis:alpine', defaultPort: 6379, assignedPort: 6379, status: 'healthy' },
      { name: 'flower', image: 'mher/flower:latest', defaultPort: 5555, assignedPort: 5555, status: 'healthy' },
      { name: 'mailpit', image: 'axllent/mailpit:latest', defaultPort: 8025, assignedPort: 8025, status: 'healthy' },
    ],
    domains: [
      { domain: 'flower.oma.local', portVar: 'PORT_FLOWER' },
      { domain: 'django-mail.oma.local', portVar: 'PORT_MAILPIT_HTTP' },
    ],
    confContent: `# stack.conf - Metadata and Default Ports for django-celery
STACK_NAME="django-celery"
STACK_DESCRIPTION="Python Django & FastAPI Stack: PostgreSQL 16, Redis Broker, Flower Celery UI & Mailpit"
PORT_POSTGRES=5432
PORT_REDIS=6379
PORT_FLOWER=5555
PORT_MAILPIT_HTTP=8025
PORT_MAILPIT_SMTP=1025

DOMAIN_FLOWER="flower.oma.local:PORT_FLOWER"
DOMAIN_MAIL="django-mail.oma.local:PORT_MAILPIT_HTTP"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  postgres:
    image: postgres:16-alpine
    container_name: omastack-django-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: djangodb
      POSTGRES_USER: django
      POSTGRES_PASSWORD: djangopassword
    ports:
      - "127.0.0.1:\${PORT_POSTGRES:-5432}:5432"
    networks:
      - omastack-net

  redis:
    image: redis:alpine
    container_name: omastack-django-redis
    restart: unless-stopped
    command: redis-server --requirepass \${OMASTACK_SECRET_KEY:-djangopassword}
    ports:
      - "127.0.0.1:\${PORT_REDIS:-6379}:6379"
    networks:
      - omastack-net

  flower:
    image: mher/flower:latest
    container_name: omastack-django-flower
    restart: unless-stopped
    environment:
      CELERY_BROKER_URL: "redis://default:\${OMASTACK_SECRET_KEY:-djangopassword}@redis:6379/0"
      FLOWER_PORT: 5555
    ports:
      - "127.0.0.1:\${PORT_FLOWER:-5555}:5555"
    networks:
      - omastack-net

  mailpit:
    image: axllent/mailpit:latest
    container_name: omastack-django-mailpit
    restart: unless-stopped
    ports:
      - "127.0.0.1:\${PORT_MAILPIT_HTTP:-8025}:8025"
      - "127.0.0.1:\${PORT_MAILPIT_SMTP:-1025}:1025"
    networks:
      - omastack-net`,
  },
  {
    id: 'observability-lgtm',
    name: 'Grafana Observability',
    description: 'Grafana OSS Dashboards, Prometheus Metrics, Loki Log Aggregation & Redis Cache.',
    services: [
      { name: 'grafana', image: 'grafana/grafana-oss:latest', defaultPort: 3001, assignedPort: 3001, status: 'healthy' },
      { name: 'prometheus', image: 'prom/prometheus:latest', defaultPort: 9090, assignedPort: 9090, status: 'healthy' },
      { name: 'loki', image: 'grafana/loki:latest', defaultPort: 3100, assignedPort: 3100, status: 'healthy' },
      { name: 'redis', image: 'redis:alpine', defaultPort: 6379, assignedPort: 6379, status: 'healthy' },
    ],
    domains: [
      { domain: 'grafana.oma.local', portVar: 'PORT_GRAFANA' },
      { domain: 'prometheus.oma.local', portVar: 'PORT_PROMETHEUS' },
    ],
    confContent: `# stack.conf - Metadata and Default Ports for observability-lgtm
STACK_NAME="observability-lgtm"
STACK_DESCRIPTION="Grafana LGTM Observability: Grafana Dashboards, Prometheus Metrics, Loki Logs & Redis"
PORT_GRAFANA=3001
PORT_PROMETHEUS=9090
PORT_LOKI=3100
PORT_REDIS=6379

DOMAIN_GRAFANA="grafana.oma.local:PORT_GRAFANA"
DOMAIN_PROMETHEUS="prometheus.oma.local:PORT_PROMETHEUS"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  grafana:
    image: grafana/grafana-oss:latest
    container_name: omastack-obs-grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: adminpassword
      GF_AUTH_ANONYMOUS_ENABLED: "false"
    ports:
      - "127.0.0.1:\${PORT_GRAFANA:-3001}:3000"
    networks:
      - omastack-net

  prometheus:
    image: prom/prometheus:latest
    container_name: omastack-obs-prometheus
    restart: unless-stopped
    ports:
      - "127.0.0.1:\${PORT_PROMETHEUS:-9090}:9090"
    networks:
      - omastack-net

  loki:
    image: grafana/loki:latest
    container_name: omastack-obs-loki
    restart: unless-stopped
    ports:
      - "127.0.0.1:\${PORT_LOKI:-3100}:3100"
    networks:
      - omastack-net

  redis:
    image: redis:alpine
    container_name: omastack-obs-redis
    restart: unless-stopped
    command: redis-server --requirepass \${OMASTACK_SECRET_KEY:-adminpassword}
    ports:
      - "127.0.0.1:\${PORT_REDIS:-6379}:6379"
    networks:
      - omastack-net`,
  },
  {
    id: 'clickhouse-analytics',
    name: 'ClickHouse + Redpanda',
    description: 'ClickHouse OLAP Analytics Server, Redpanda Kafka Console UI & Redis Alpine.',
    services: [
      { name: 'clickhouse', image: 'clickhouse/clickhouse-server:latest', defaultPort: 8123, assignedPort: 8123, status: 'healthy' },
      { name: 'redpanda-console', image: 'redpandadata/console:latest', defaultPort: 8082, assignedPort: 8082, status: 'healthy' },
      { name: 'redis', image: 'redis:alpine', defaultPort: 6379, assignedPort: 6379, status: 'healthy' },
    ],
    domains: [
      { domain: 'clickhouse.oma.local', portVar: 'PORT_CLICKHOUSE_HTTP' },
      { domain: 'kafka.oma.local', portVar: 'PORT_REDPANDA_UI' },
    ],
    confContent: `# stack.conf - Metadata and Default Ports for clickhouse-analytics
STACK_NAME="clickhouse-analytics"
STACK_DESCRIPTION="Real-Time Analytics & Event Streaming: ClickHouse OLAP DB, Redpanda Console & Redis"
PORT_CLICKHOUSE_HTTP=8123
PORT_CLICKHOUSE_NATIVE=9009
PORT_REDPANDA_UI=8082
PORT_REDIS=6379

DOMAIN_CLICKHOUSE="clickhouse.oma.local:PORT_CLICKHOUSE_HTTP"
DOMAIN_KAFKA="kafka.oma.local:PORT_REDPANDA_UI"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  clickhouse:
    image: clickhouse/clickhouse-server:latest
    container_name: omastack-analytics-clickhouse
    restart: unless-stopped
    environment:
      CLICKHOUSE_DB: analytics
      CLICKHOUSE_USER: default
      CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT: 1
    ports:
      - "127.0.0.1:\${PORT_CLICKHOUSE_HTTP:-8123}:8123"
      - "127.0.0.1:\${PORT_CLICKHOUSE_NATIVE:-9009}:9000"
    networks:
      - omastack-net

  redpanda-console:
    image: redpandadata/console:latest
    container_name: omastack-analytics-redpanda
    restart: unless-stopped
    ports:
      - "127.0.0.1:\${PORT_REDPANDA_UI:-8082}:8080"
    networks:
      - omastack-net

  redis:
    image: redis:alpine
    container_name: omastack-analytics-redis
    restart: unless-stopped
    command: redis-server --requirepass \${OMASTACK_SECRET_KEY:-analyticspassword}
    ports:
      - "127.0.0.1:\${PORT_REDIS:-6379}:6379"
    networks:
      - omastack-net`,
  },
  {
    id: 'keycloak-iam',
    name: 'Keycloak OIDC / IAM',
    description: 'Keycloak 24 Identity & Access Management (OAuth2/OIDC), PostgreSQL 16 & Mailpit.',
    services: [
      { name: 'keycloak', image: 'quay.io/keycloak/keycloak:24.0', defaultPort: 8084, assignedPort: 8084, status: 'healthy' },
      { name: 'postgres', image: 'postgres:16-alpine', defaultPort: 5432, assignedPort: 5432, status: 'healthy' },
      { name: 'mailpit', image: 'axllent/mailpit:latest', defaultPort: 8025, assignedPort: 8025, status: 'healthy' },
    ],
    domains: [
      { domain: 'auth.oma.local', portVar: 'PORT_KEYCLOAK' },
      { domain: 'auth-mail.oma.local', portVar: 'PORT_MAILPIT_HTTP' },
    ],
    confContent: `# stack.conf - Metadata and Default Ports for keycloak-iam
STACK_NAME="keycloak-iam"
STACK_DESCRIPTION="Identity & SSO Auth Sandbox: Keycloak 24 OIDC/OAuth2, PostgreSQL 16 & Mailpit SMTP"
PORT_KEYCLOAK=8084
PORT_POSTGRES=5432
PORT_MAILPIT_HTTP=8025
PORT_MAILPIT_SMTP=1025

DOMAIN_AUTH="auth.oma.local:PORT_KEYCLOAK"
DOMAIN_MAIL="auth-mail.oma.local:PORT_MAILPIT_HTTP"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  postgres:
    image: postgres:16-alpine
    container_name: omastack-keycloak-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: keycloak
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloakpassword
    ports:
      - "127.0.0.1:\${PORT_POSTGRES:-5432}:5432"
    networks:
      - omastack-net

  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    container_name: omastack-keycloak-iam
    restart: unless-stopped
    command: start-dev
    environment:
      KC_DB: postgres
      KC_DB_URL: "jdbc:postgresql://postgres:5432/keycloak"
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloakpassword
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: adminpassword
      KC_HTTP_ENABLED: "true"
    ports:
      - "127.0.0.1:\${PORT_KEYCLOAK:-8084}:8080"
    networks:
      - omastack-net

  mailpit:
    image: axllent/mailpit:latest
    container_name: omastack-keycloak-mailpit
    restart: unless-stopped
    ports:
      - "127.0.0.1:\${PORT_MAILPIT_HTTP:-8025}:8025"
      - "127.0.0.1:\${PORT_MAILPIT_SMTP:-1025}:1025"
    networks:
      - omastack-net`,
  },
  {
    id: 'directus-cms',
    name: 'Directus Headless CMS',
    description: 'Directus 11 Instant REST+GraphQL Data Studio, PostgreSQL 16 & Redis Cache.',
    services: [
      { name: 'directus', image: 'directus/directus:latest', defaultPort: 8055, assignedPort: 8055, status: 'healthy' },
      { name: 'postgres', image: 'postgres:16-alpine', defaultPort: 5432, assignedPort: 5432, status: 'healthy' },
      { name: 'redis', image: 'redis:alpine', defaultPort: 6379, assignedPort: 6379, status: 'healthy' },
    ],
    domains: [{ domain: 'cms.oma.local', portVar: 'PORT_DIRECTUS' }],
    confContent: `# stack.conf - Metadata and Default Ports for directus-cms
STACK_NAME="directus-cms"
STACK_DESCRIPTION="Headless CMS & Data Studio: Directus 11 API/Admin, PostgreSQL 16 & Redis Cache"
PORT_DIRECTUS=8055
PORT_POSTGRES=5432
PORT_REDIS=6379

DOMAIN_CMS="cms.oma.local:PORT_DIRECTUS"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  postgres:
    image: postgres:16-alpine
    container_name: omastack-directus-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: directus
      POSTGRES_USER: directus
      POSTGRES_PASSWORD: directuspassword
    ports:
      - "127.0.0.1:\${PORT_POSTGRES:-5432}:5432"
    networks:
      - omastack-net

  redis:
    image: redis:alpine
    container_name: omastack-directus-redis
    restart: unless-stopped
    command: redis-server --requirepass \${OMASTACK_SECRET_KEY:-directuspassword}
    ports:
      - "127.0.0.1:\${PORT_REDIS:-6379}:6379"
    networks:
      - omastack-net

  directus:
    image: directus/directus:latest
    container_name: omastack-directus-cms
    restart: unless-stopped
    environment:
      SECRET: "omastack-directus-local-secret-key-2026"
      DB_CLIENT: "pg"
      DB_HOST: "postgres"
      DB_PORT: "5432"
      DB_DATABASE: "directus"
      DB_USER: "directus"
      DB_PASSWORD: "directuspassword"
      CACHE_ENABLED: "true"
      CACHE_STORE: "redis"
      REDIS: "redis://default:\${OMASTACK_SECRET_KEY:-directuspassword}@redis:6379"
      ADMIN_EMAIL: "admin@omastack.local"
      ADMIN_PASSWORD: "adminpassword"
    ports:
      - "127.0.0.1:\${PORT_DIRECTUS:-8055}:8055"
    networks:
      - omastack-net`,
  },
  {
    id: 'wordpress-mariadb',
    name: 'WordPress + MariaDB 11',
    description: 'MariaDB 11 database, Redis Object Cache, phpMyAdmin Web UI & Mailpit SMTP.',
    services: [
      { name: 'mariadb', image: 'mariadb:11', defaultPort: 3306, assignedPort: 3306, status: 'healthy' },
      { name: 'redis', image: 'redis:alpine', defaultPort: 6379, assignedPort: 6379, status: 'healthy' },
      { name: 'phpmyadmin', image: 'phpmyadmin:latest', defaultPort: 8083, assignedPort: 8083, status: 'healthy' },
      { name: 'mailpit', image: 'axllent/mailpit:latest', defaultPort: 8025, assignedPort: 8025, status: 'healthy' },
    ],
    domains: [
      { domain: 'pma.oma.local', portVar: 'PORT_PMA' },
      { domain: 'wp-mail.oma.local', portVar: 'PORT_MAILPIT_HTTP' },
    ],
    confContent: `# stack.conf - Metadata and Default Ports for wordpress-mariadb
STACK_NAME="wordpress-mariadb"
STACK_DESCRIPTION="WordPress & WooCommerce Stack: MariaDB 11, Redis Object Cache, phpMyAdmin & Mailpit"
PORT_MARIADB=3306
PORT_REDIS=6379
PORT_PMA=8083
PORT_MAILPIT_HTTP=8025
PORT_MAILPIT_SMTP=1025

DOMAIN_PMA="pma.oma.local:PORT_PMA"
DOMAIN_MAIL="wp-mail.oma.local:PORT_MAILPIT_HTTP"`,
    composeContent: `networks:
  omastack-net:
    external: true

services:
  mariadb:
    image: mariadb:11
    container_name: omastack-wp-mariadb
    restart: unless-stopped
    environment:
      MARIADB_DATABASE: wordpress
      MARIADB_USER: wpuser
      MARIADB_PASSWORD: wppassword
      MARIADB_ROOT_PASSWORD: wppassword
    ports:
      - "127.0.0.1:\${PORT_MARIADB:-3306}:3306"
    networks:
      - omastack-net

  redis:
    image: redis:alpine
    container_name: omastack-wp-redis
    restart: unless-stopped
    command: redis-server --requirepass \${OMASTACK_SECRET_KEY:-wppassword}
    ports:
      - "127.0.0.1:\${PORT_REDIS:-6379}:6379"
    networks:
      - omastack-net

  phpmyadmin:
    image: phpmyadmin:latest
    container_name: omastack-wp-phpmyadmin
    restart: unless-stopped
    environment:
      PMA_HOST: mariadb
      PMA_PORT: 3306
      PMA_USER: wpuser
      PMA_PASSWORD: wppassword
    ports:
      - "127.0.0.1:\${PORT_PMA:-8083}:80"
    networks:
      - omastack-net

  mailpit:
    image: axllent/mailpit:latest
    container_name: omastack-wp-mailpit
    restart: unless-stopped
    ports:
      - "127.0.0.1:\${PORT_MAILPIT_HTTP:-8025}:8025"
      - "127.0.0.1:\${PORT_MAILPIT_SMTP:-1025}:1025"
    networks:
      - omastack-net`,
  },
];


