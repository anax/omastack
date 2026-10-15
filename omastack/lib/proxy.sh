#!/usr/bin/env bash
# OmaStack Proxy Library - Caddy reverse proxy and mkcert local HTTPS domain manager (*.oma.local)
# SPDX-License-Identifier: MIT

set -euo pipefail

PROXY_CONTAINER_NAME="omastack-proxy"
CADDYFILE_PATH="${OMASTACK_HOME}/Caddyfile"

# Ensure mkcert certificate generated for *.oma.local
ensure_local_ssl() {
    local cert_file="${OMASTACK_CERTS_DIR}/oma.local.pem"
    local key_file="${OMASTACK_CERTS_DIR}/oma.local-key.pem"

    if [ ! -f "${cert_file}" ] || [ ! -f "${key_file}" ]; then
        if command -v mkcert >/dev/null 2>&1; then
            log_info "Installing mkcert local CA & issuing certificate for *.oma.local..."
            mkcert -install >/dev/null 2>&1 || true
            (cd "${OMASTACK_CERTS_DIR}" && mkcert "*.oma.local" "oma.local" 127.0.0.1 ::1) >/dev/null 2>&1 || true
            log_success "Created trusted SSL certificate for *.oma.local"
        else
            log_warn "mkcert not found. Caddy will use self-signed certificates for *.oma.local"
        fi
    fi
}

# Generate baseline Caddyfile
init_caddyfile() {
    if [ ! -f "${CADDYFILE_PATH}" ]; then
        cat << 'EOF' > "${CADDYFILE_PATH}"
{
    admin off
    auto_https off
}

# OmaStack Dynamic Local Proxy Rules
# Generated automatically by omastack
EOF
    fi
}

# Register a domain mapping into Caddyfile
register_proxy_domain() {
    local domain="$1"      # e.g., mail.oma.local
    local target_port="$2" # e.g., 8025

    ensure_omastack_network
    ensure_local_ssl
    init_caddyfile

    # Remove existing block if present
    if grep -q "${domain}" "${CADDYFILE_PATH}" 2>/dev/null; then
        sed -i "/${domain}/,/}/d" "${CADDYFILE_PATH}"
    fi

    # Append new Caddy rule
    cat << EOF >> "${CADDYFILE_PATH}"

${domain} {
    tls /certs/oma.local.pem /certs/oma.local-key.pem
    reverse_proxy host.docker.internal:${target_port}
}
EOF

    # Reload or restart proxy container
    sync_caddy_proxy
    log_success "HTTPS Domain active: https://${domain} -> 127.0.0.1:${target_port}"
}

# Remove dynamic domain mapping
unregister_proxy_domain() {
    local domain="$1"
    if [ -f "${CADDYFILE_PATH}" ] && grep -q "${domain}" "${CADDYFILE_PATH}"; then
        sed -i "/${domain}/,/}/d" "${CADDYFILE_PATH}"
        sync_caddy_proxy
        log_info "Removed proxy mapping for ${domain}"
    fi
}

# Ensure Caddy reverse proxy container is running
sync_caddy_proxy() {
    init_caddyfile
    
    if is_docker_available; then
        if ! docker ps --format '{{.Names}}' | grep -q "^${PROXY_CONTAINER_NAME}$"; then
            log_info "Spinning up OmaStack HTTPS reverse proxy container (Caddy)..."
            docker run -d \
                --name "${PROXY_CONTAINER_NAME}" \
                --network omastack-net \
                --add-host=host.docker.internal:host-gateway \
                -p 80:80 \
                -p 443:443 \
                -v "${CADDYFILE_PATH}:/etc/caddy/Caddyfile:ro" \
                -v "${OMASTACK_CERTS_DIR}:/certs:ro" \
                --restart unless-stopped \
                caddy:2-alpine >/dev/null 2>&1 || true
        else
            docker exec "${PROXY_CONTAINER_NAME}" caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1 || true
        fi
    elif command -v caddy >/dev/null 2>&1; then
        caddy reload --config "${CADDYFILE_PATH}" >/dev/null 2>&1 || true
    else
        log_info "Local Caddyfile synced at ${CADDYFILE_PATH}."
    fi
}
