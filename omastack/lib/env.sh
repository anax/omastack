#!/usr/bin/env bash
# OmaStack Env Library - Connection string formatting, wl-copy sync, and .env injection
# SPDX-License-Identifier: MIT

set -euo pipefail

# Generate environment variables & connection string snippet based on stack ports
generate_env_snippet() {
    local stack_name="$1"
    local port_mapping="$2" # Format: DB_PORT=3306 REDIS_PORT=6379 ...

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
DB_PASSWORD=secret
REDIS_HOST=127.0.0.1
REDIS_PORT=${PORT_REDIS:-6379}
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=${PORT_MAILPIT_SMTP:-1025}
MEILISEARCH_HOST=http://127.0.0.1:${PORT_MEILI:-7700}
MEILISEARCH_KEY=masterKey123
DATABASE_URL=mysql://laravel:secret@127.0.0.1:${PORT_MYSQL:-3306}/laravel
REDIS_URL=redis://127.0.0.1:${PORT_REDIS:-6379}"
            ;;
        supabase-lite)
            snippet="${snippet}
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:${PORT_POSTGRES:-5432}/postgres
SUPABASE_URL=http://127.0.0.1:${PORT_STUDIO:-3000}
SUPABASE_ANON_KEY=eyJhY2NvdW50Ijoib21hc3RhY2siLCJyb2xlIjoiYW5vbiJ9
POSTGREST_URL=http://127.0.0.1:${PORT_POSTGREST:-3000}
PGADMIN_URL=http://127.0.0.1:${PORT_PGADMIN:-5050}"
            ;;
        nextjs-postgres)
            snippet="${snippet}
DATABASE_URL=postgresql://appuser:apppassword@127.0.0.1:${PORT_POSTGRES:-5432}/appdb?schema=public
REDIS_URL=redis://127.0.0.1:${PORT_REDIS:-6379}
ADMINER_URL=http://127.0.0.1:${PORT_ADMINER:-8080}"
            ;;
        automation-hub)
            snippet="${snippet}
N8N_URL=https://n8n.oma.local
N8N_PORT=${PORT_N8N:-5678}
DATABASE_URL=postgres://n8n:n8npassword@127.0.0.1:${PORT_POSTGRES:-5432}/n8n
REDIS_URL=redis://127.0.0.1:${PORT_REDIS:-6379}"
            ;;
        web3-node)
            snippet="${snippet}
ETH_RPC_URL=http://127.0.0.1:${PORT_RPC:-8545}
REDIS_URL=redis://127.0.0.1:${PORT_REDIS:-6379}
DATABASE_URL=postgres://web3:web3secret@127.0.0.1:${PORT_POSTGRES:-5432}/web3db"
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

    if [ -f "${target_env}" ]; then
        log_info "Backing up existing ${target_env} to ${target_env}.omastack.bak"
        cp "${target_env}" "${target_env}.omastack.bak"
    fi

    log_info "Injecting OmaStack variables into ${target_env}..."
    echo "" >> "${target_env}"
    echo "${env_snippet}" >> "${target_env}"
    log_success "Successfully updated ${target_env}!"
}
