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
];
