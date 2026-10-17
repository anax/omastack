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
    composeContent: `version: '3.8'

networks:
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
    composeContent: `version: '3.8'

networks:
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
    name: 'Next.js + Postgres',
    description: 'PostgreSQL 16, Redis Alpine, and Adminer database management web interface.',
    services: [
      { name: 'postgres', image: 'postgres:16-alpine', defaultPort: 5432, assignedPort: 5432, status: 'healthy' },
      { name: 'redis', image: 'redis:alpine', defaultPort: 6379, assignedPort: 6379, status: 'healthy' },
      { name: 'adminer', image: 'adminer:latest', defaultPort: 8080, assignedPort: 8080, status: 'healthy' },
    ],
    domains: [{ domain: 'db.oma.local', portVar: 'PORT_ADMINER' }],
    confContent: `# stack.conf - Metadata and Default Ports for nextjs-postgres
STACK_NAME="nextjs-postgres"
STACK_DESCRIPTION="Next.js Full-Stack Essentials: PostgreSQL 16, Redis Alpine & Adminer UI"
PORT_POSTGRES=5432
PORT_REDIS=6379
PORT_ADMINER=8080

DOMAIN_ADMINER="db.oma.local:PORT_ADMINER"`,
    composeContent: `version: '3.8'

networks:
  omastack-net:
    external: true

services:
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
    composeContent: `version: '3.8'

networks:
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
    composeContent: `version: '3.8'

networks:
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
    composeContent: `version: '3.8'

networks:
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
    composeContent: `version: '3.8'

networks:
  omastack-net:
    external: true

services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: omastack-ai-qdrant
    restart: unless-stopped
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
    composeContent: `version: '3.8'

networks:
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
    composeContent: `version: '3.8'

networks:
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
    ports:
      - "127.0.0.1:\${PORT_REDIS:-6379}:6379"
    networks:
      - omastack-net`,
  },
];

