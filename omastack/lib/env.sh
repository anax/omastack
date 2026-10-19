#!/usr/bin/env bash
# OmaStack Env Library - Connection string formatting, wl-copy sync, and .env injection
# SPDX-License-Identifier: MIT

set -euo pipefail

# Generate or load per-sandbox random credentials stored with 0600 permissions
ensure_stack_secrets() {
    local stack_name="$1"
    if [[ ! "${stack_name}" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        stack_name="generic"
    fi

    local secrets_file="${OMASTACK_STATE_DIR}/${stack_name}.secrets.env"
    if [ ! -f "${secrets_file}" ]; then
        local db_pass secret_key
        if command -v openssl >/dev/null 2>&1; then
            db_pass=$(openssl rand -hex 16)
            secret_key=$(openssl rand -hex 24)
        else
            db_pass=$(LC_ALL=C tr -dc 'a-f0-9' < /dev/urandom | head -c 32 || echo "omastack_local_db")
            secret_key=$(LC_ALL=C tr -dc 'a-f0-9' < /dev/urandom | head -c 48 || echo "omastack_local_key")
        fi
        (
            umask 077
            cat << EOF > "${secrets_file}"
OMASTACK_DB_PASS=${db_pass}
OMASTACK_SECRET_KEY=${secret_key}
EOF
        )
        chmod 600 "${secrets_file}" 2>/dev/null || true
    fi

    # Safely parse the generated secrets file without eval
    while IFS='=' read -r k v; do
        if [[ "${k}" =~ ^OMASTACK_[A-Z0-9_]+$ ]] && [[ "${v}" =~ ^[a-zA-Z0-9_]+$ ]]; then
            export "${k}=${v}"
        fi
    done < "${secrets_file}"
}

# Generate environment variables & connection string snippet based on stack ports
generate_env_snippet() {
    local stack_name="$1"
    local port_mapping="$2" # Format: DB_PORT=3306 REDIS_PORT=6379 ...

    ensure_stack_secrets "${stack_name}"
    local db_pass="${OMASTACK_DB_PASS}"
    local secret_key="${OMASTACK_SECRET_KEY}"

    local snippet="# --- OmaStack Generated Envs for ${stack_name} ---"
    
    # Parse port_mapping safely without eval
    for item in ${port_mapping}; do
        if [[ "${item}" =~ ^[A-Z0-9_]+=[0-9]+$ ]]; then
            export "${item}"
        fi
    done

    case "${stack_name}" in
        laravel-stack)
            snippet="${snippet}
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=${PORT_MYSQL:-3306}
DB_DATABASE=laravel
DB_USERNAME=laravel
DB_PASSWORD=${db_pass}
REDIS_HOST=127.0.0.1
REDIS_PORT=${PORT_REDIS:-6379}
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=${PORT_MAILPIT_SMTP:-1025}
MEILISEARCH_HOST=http://127.0.0.1:${PORT_MEILI:-7700}
MEILISEARCH_KEY=${secret_key}
DATABASE_URL=mysql://laravel:${db_pass}@127.0.0.1:${PORT_MYSQL:-3306}/laravel
REDIS_URL=redis://127.0.0.1:${PORT_REDIS:-6379}"
            ;;
        supabase-lite)
            snippet="${snippet}
DATABASE_URL=postgres://postgres:${db_pass}@127.0.0.1:${PORT_POSTGRES:-5432}/postgres
SUPABASE_URL=http://127.0.0.1:${PORT_STUDIO:-3000}
SUPABASE_ANON_KEY=${secret_key}
POSTGREST_URL=http://127.0.0.1:${PORT_POSTGREST:-3000}
PGADMIN_URL=http://127.0.0.1:${PORT_PGADMIN:-5050}"
            ;;
        nextjs-postgres)
            snippet="${snippet}
NEXT_PUBLIC_APP_URL=http://localhost:${PORT_NEXTJS:-3000}
DATABASE_URL=postgresql://appuser:${db_pass}@127.0.0.1:${PORT_POSTGRES:-5432}/appdb?schema=public
REDIS_URL=redis://127.0.0.1:${PORT_REDIS:-6379}
ADMINER_URL=http://127.0.0.1:${PORT_ADMINER:-8080}"
            ;;
        automation-hub)
            snippet="${snippet}
N8N_URL=https://n8n.oma.local
N8N_PORT=${PORT_N8N:-5678}
DATABASE_URL=postgres://n8n:${db_pass}@127.0.0.1:${PORT_POSTGRES:-5432}/n8n
REDIS_URL=redis://127.0.0.1:${PORT_REDIS:-6379}"
            ;;
        web3-node)
            snippet="${snippet}
ETH_RPC_URL=http://127.0.0.1:${PORT_RPC:-8545}
REDIS_URL=redis://127.0.0.1:${PORT_REDIS:-6379}
DATABASE_URL=postgres://web3:${db_pass}@127.0.0.1:${PORT_POSTGRES:-5432}/web3db"
            ;;
        rails-kamal)
            snippet="${snippet}
DATABASE_URL=postgres://rails:${db_pass}@127.0.0.1:${PORT_POSTGRES:-5432}/rails_development
REDIS_URL=redis://127.0.0.1:${PORT_REDIS:-6379}/0
SMTP_ADDRESS=127.0.0.1
SMTP_PORT=${PORT_MAILPIT_SMTP:-1025}
AWS_ENDPOINT_URL=http://127.0.0.1:${PORT_MINIO_API:-9000}
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=${secret_key}"
            ;;
        ai-rag-stack)
            snippet="${snippet}
QDRANT_URL=http://127.0.0.1:${PORT_QDRANT_HTTP:-6333}
QDRANT_API_KEY=${secret_key}
QDRANT_GRPC_PORT=${PORT_QDRANT_GRPC:-6334}
DATABASE_URL=postgresql://aiuser:${db_pass}@127.0.0.1:${PORT_POSTGRES:-5432}/ai_vectors
REDIS_URL=redis://default:${secret_key}@127.0.0.1:${PORT_REDIS:-6379}
REDIS_PASSWORD=${secret_key}"
            ;;
        mern-mongo)
            snippet="${snippet}
MONGODB_URI=mongodb://admin:${db_pass}@127.0.0.1:${PORT_MONGO:-27017}/app?authSource=admin
MONGO_EXPRESS_URL=http://127.0.0.1:${PORT_MONGO_EXPRESS:-8081}
REDIS_URL=redis://127.0.0.1:${PORT_REDIS:-6379}"
            ;;
        golang-microservices)
            snippet="${snippet}
DATABASE_URL=postgres://gouser:${db_pass}@127.0.0.1:${PORT_POSTGRES:-5432}/microservice_db?sslmode=disable
AMQP_URL=amqp://guest:${db_pass}@127.0.0.1:${PORT_RABBITMQ_AMQP:-5672}/
RABBITMQ_MANAGEMENT_URL=http://127.0.0.1:${PORT_RABBITMQ_UI:-15672}
OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:${PORT_JAEGER_OTLP:-4317}
JAEGER_UI_URL=http://127.0.0.1:${PORT_JAEGER_UI:-16686}
REDIS_URL=redis://127.0.0.1:${PORT_REDIS:-6379}"
            ;;
        django-celery)
            snippet="${snippet}
DATABASE_URL=postgres://django:${db_pass}@127.0.0.1:${PORT_POSTGRES:-5432}/djangodb
CELERY_BROKER_URL=redis://127.0.0.1:${PORT_REDIS:-6379}/0
CELERY_RESULT_BACKEND=redis://127.0.0.1:${PORT_REDIS:-6379}/0
FLOWER_URL=http://127.0.0.1:${PORT_FLOWER:-5555}
EMAIL_HOST=127.0.0.1
EMAIL_PORT=${PORT_MAILPIT_SMTP:-1025}"
            ;;
        observability-lgtm)
            snippet="${snippet}
GRAFANA_URL=http://127.0.0.1:${PORT_GRAFANA:-3001}
PROMETHEUS_URL=http://127.0.0.1:${PORT_PROMETHEUS:-9090}
LOKI_URL=http://127.0.0.1:${PORT_LOKI:-3100}
REDIS_URL=redis://127.0.0.1:${PORT_REDIS:-6379}"
            ;;
        clickhouse-analytics)
            snippet="${snippet}
CLICKHOUSE_URL=http://default:${db_pass}@127.0.0.1:${PORT_CLICKHOUSE_HTTP:-8123}
CLICKHOUSE_HOST=127.0.0.1
CLICKHOUSE_PORT=${PORT_CLICKHOUSE_NATIVE:-9009}
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=${db_pass}
CLICKHOUSE_DB=analytics
REDPANDA_CONSOLE_URL=http://127.0.0.1:${PORT_REDPANDA_UI:-8082}
REDIS_URL=redis://127.0.0.1:${PORT_REDIS:-6379}"
            ;;
        keycloak-iam)
            snippet="${snippet}
KEYCLOAK_ISSUER_URL=http://127.0.0.1:${PORT_KEYCLOAK:-8084}/realms/master
KEYCLOAK_ADMIN_URL=http://127.0.0.1:${PORT_KEYCLOAK:-8084}/admin
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=${secret_key}
DATABASE_URL=postgresql://keycloak:${db_pass}@127.0.0.1:${PORT_POSTGRES:-5432}/keycloak
SMTP_URL=smtp://127.0.0.1:${PORT_MAILPIT_SMTP:-1025}"
            ;;
        directus-cms)
            snippet="${snippet}
DIRECTUS_URL=http://127.0.0.1:${PORT_DIRECTUS:-8055}
DIRECTUS_ADMIN_EMAIL=admin@omastack.local
DIRECTUS_ADMIN_PASSWORD=${secret_key}
DATABASE_URL=postgresql://directus:${db_pass}@127.0.0.1:${PORT_POSTGRES:-5432}/directus
REDIS_URL=redis://127.0.0.1:${PORT_REDIS:-6379}"
            ;;
        wordpress-mariadb)
            snippet="${snippet}
DB_NAME=wordpress
DB_USER=wpuser
DB_PASSWORD=${db_pass}
DB_HOST=127.0.0.1:${PORT_MARIADB:-3306}
WP_REDIS_HOST=127.0.0.1
WP_REDIS_PORT=${PORT_REDIS:-6379}
PHPMYADMIN_URL=http://127.0.0.1:${PORT_PMA:-8083}
SMTP_HOST=127.0.0.1
SMTP_PORT=${PORT_MAILPIT_SMTP:-1025}"
            ;;
        *)
            snippet="${snippet}
# Generic Stack Config
OMASTACK_ACTIVE=true"
            ;;
    esac

    echo "${snippet}"
}

# Copy connection snippet to Wayland clipboard using wl-copy
copy_to_clipboard() {
    local content="$1"
    if command -v wl-copy >/dev/null 2>&1; then
        echo -n "${content}" | wl-copy
        log_success "Connection variables copied to Wayland clipboard (wl-copy)!"
    elif command -v xclip >/dev/null 2>&1; then
        echo -n "${content}" | xclip -selection clipboard
        log_success "Connection variables copied to X11 clipboard!"
    else
        log_warn "Neither wl-copy nor xclip found. Outputting to terminal:"
        echo -e "${content}"
    fi
}

# Safely inject environment variables into current directory .env file
inject_local_env() {
    local env_snippet="$1"
    local target_env="${2:-.env}"
    local old_umask
    old_umask=$(umask)
    umask 077

    if [ -f "${target_env}" ]; then
        log_info "Backing up existing ${target_env} to ${target_env}.omastack.bak"
        cp -p "${target_env}" "${target_env}.omastack.bak"
        chmod 600 "${target_env}.omastack.bak" 2>/dev/null || true
    fi

    log_info "Injecting OmaStack variables into ${target_env}..."
    echo "" >> "${target_env}"
    echo "${env_snippet}" >> "${target_env}"
    chmod 600 "${target_env}" 2>/dev/null || true
    umask "${old_umask}"
    log_success "Successfully updated ${target_env}!"
}
