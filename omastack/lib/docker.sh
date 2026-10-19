#!/usr/bin/env bash
# OmaStack Docker Library - Container management, port scanner, healthchecks & RAM stats
# SPDX-License-Identifier: MIT

set -euo pipefail

# Auto-detect Docker host socket and configure environment
init_docker_env() {
    # If DOCKER_HOST is already set and working, keep it
    if [ -n "${DOCKER_HOST:-}" ] && command -v docker >/dev/null 2>&1 && command docker info >/dev/null 2>&1; then
        return 0
    fi

    local user_uid
    user_uid="$(id -u 2>/dev/null || echo 1000)"
    local runtime_dir="${XDG_RUNTIME_DIR:-/run/user/${user_uid}}"

    # Probe potential active Docker sockets (User/Rootless daemon first, then system)
    local socket_candidates=(
        "${runtime_dir}/docker.sock"
        "/run/user/${user_uid}/docker.sock"
        "${HOME}/.docker/run/docker.sock"
        "${HOME}/.docker/desktop/docker.sock"
        "/var/run/docker.sock"
        "/run/docker.sock"
    )

    for sock in "${socket_candidates[@]}"; do
        if [ -S "${sock}" ]; then
            if [ "${sock}" = "/var/run/docker.sock" ] || [ "${sock}" = "/run/docker.sock" ]; then
                local old_host="${DOCKER_HOST:-}"
                unset DOCKER_HOST 2>/dev/null || true
                if command -v docker >/dev/null 2>&1 && command docker info >/dev/null 2>&1; then
                    return 0
                fi
                if [ -n "${old_host}" ]; then
                    export DOCKER_HOST="${old_host}"
                fi
            else
                export DOCKER_HOST="unix://${sock}"
                if command -v docker >/dev/null 2>&1 && command docker info >/dev/null 2>&1; then
                    return 0
                fi
            fi
        fi
    done

    # Check user shell profile files for explicit DOCKER_HOST export
    for profile_file in "${HOME}/.bashrc" "${HOME}/.zshrc" "${HOME}/.profile" "${HOME}/.bash_profile" "${HOME}/.config/environment.d"/*.conf; do
        if [ -f "${profile_file}" ]; then
            env_host=$(grep -E '^[[:space:]]*(export[[:space:]]+)?DOCKER_HOST=' "${profile_file}" 2>/dev/null | tail -n 1 | cut -d'=' -f2 | tr -d ' "\r'"'" || true)
            if [ -n "${env_host}" ]; then
                export DOCKER_HOST="${env_host}"
                if command -v docker >/dev/null 2>&1 && command docker info >/dev/null 2>&1; then
                    return 0
                fi
            fi
        fi
    done

    # If user socket exists on filesystem but daemon is starting, retain DOCKER_HOST
    if [ -z "${DOCKER_HOST:-}" ]; then
        if [ -S "${runtime_dir}/docker.sock" ]; then
            export DOCKER_HOST="unix://${runtime_dir}/docker.sock"
        elif [ -S "/run/user/${user_uid}/docker.sock" ]; then
            export DOCKER_HOST="unix:///run/user/${user_uid}/docker.sock"
        fi
    fi
}

OMASTACK_USE_SG_DOCKER=0
OMASTACK_USE_SUDO_DOCKER=0

# Transparent docker command wrapper to handle missing active GID in GUI sessions
docker() {
    if [ "${OMASTACK_USE_SG_DOCKER:-0}" = "1" ]; then
        sg docker -c "command docker $(printf '%q ' "$@")"
    elif [ "${OMASTACK_USE_SUDO_DOCKER:-0}" = "1" ]; then
        sudo -n docker "$@"
    else
        command docker "$@"
    fi
}

can_use_docker() {
    init_docker_env
    if ! command -v docker >/dev/null 2>&1; then
        return 1
    fi

    if command docker info >/dev/null 2>&1; then
        OMASTACK_USE_SG_DOCKER=0
        return 0
    fi

    # Check if user is in docker group but current process doesn't have active GID
    if command -v sg >/dev/null 2>&1; then
        local in_docker_group=false
        local cur_user="${USER:-$(whoami 2>/dev/null || id -un 2>/dev/null || echo '')}"
        if [ -n "${cur_user}" ]; then
            if id -Gn "${cur_user}" 2>/dev/null | grep -qw "docker"; then
                in_docker_group=true
            elif getent group docker 2>/dev/null | grep -qw "${cur_user}"; then
                in_docker_group=true
            elif grep -E '^docker:.*:\b'"${cur_user}"'\b' /etc/group >/dev/null 2>&1; then
                in_docker_group=true
            fi
        fi

        if [ "${in_docker_group}" = "true" ]; then
            if sg docker -c "command docker info" >/dev/null 2>&1; then
                export OMASTACK_USE_SG_DOCKER=1
                return 0
            fi
        fi
    fi

    # Check if sudo without password works
    if command -v sudo >/dev/null 2>&1 && sudo -n docker info >/dev/null 2>&1; then
        export OMASTACK_USE_SUDO_DOCKER=1
        return 0
    fi

    return 1
}

is_docker_available() {
    can_use_docker
}

# Auto-start Docker daemon if installed but stopped
ensure_docker_daemon() {
    init_docker_env
    if is_docker_available; then
        return 0
    fi

    if ! command -v docker >/dev/null 2>&1; then
        return 1
    fi

    log_info "Docker daemon is offline or starting. Attempting to activate Docker service..."

    # 1. Try systemctl start (user rootless first, then system)
    if command -v systemctl >/dev/null 2>&1; then
        systemctl --user start docker >/dev/null 2>&1 || true
        systemctl start docker >/dev/null 2>&1 || true
    fi

    # Wait up to 3 seconds to see if socket became available
    local count=0
    while [ "${count}" -lt 3 ]; do
        init_docker_env
        if is_docker_available; then
            log_success "Docker daemon successfully started!"
            return 0
        fi
        sleep 1
        count=$((count + 1))
    done

    # 2. Try pkexec (GUI / Polkit prompt for Wayland/X11 desktops)
    if command -v pkexec >/dev/null 2>&1 && [ -n "${WAYLAND_DISPLAY:-${DISPLAY:-}}" ]; then
        log_info "Prompting for authorization to start Docker via Polkit..."
        pkexec systemctl start docker >/dev/null 2>&1 || true
        sleep 1
        init_docker_env
        if is_docker_available; then
            log_success "Docker daemon successfully started via Polkit!"
            return 0
        fi
    fi

    # 3. Try sudo non-interactively
    if command -v sudo >/dev/null 2>&1; then
        sudo -n systemctl start docker >/dev/null 2>&1 || true
        sleep 1
        init_docker_env
        if is_docker_available; then
            log_success "Docker daemon successfully started!"
            return 0
        fi
    fi

    return 1
}

# Initialize Docker environment upon library sourcing
init_docker_env

# Ensure shared Docker network exists
ensure_omastack_network() {
    if is_docker_available; then
        if ! docker network inspect omastack-net >/dev/null 2>&1; then
            log_info "Creating shared Docker network 'omastack-net'..."
            docker network create omastack-net >/dev/null 2>&1 || true
        fi
    fi
}

# Scan local listening ports using ss -tuln or nc
is_port_in_use() {
    local port="$1"
    if command -v ss >/dev/null 2>&1; then
        ss -tuln | grep -E ":${port}\b" >/dev/null 2>&1
    elif command -v netstat >/dev/null 2>&1; then
        netstat -tuln | grep -E ":${port}\b" >/dev/null 2>&1
    else
        (echo > "/dev/tcp/127.0.0.1/${port}") >/dev/null 2>&1
    fi
}

# Find next available port starting from start_port
find_available_port() {
    local start_port="$1"
    local port="${start_port}"
    local max_attempts=500
    local attempt=0
    while is_port_in_use "${port}" && [ "${attempt}" -lt "${max_attempts}" ]; do
        port=$((port + 1))
        if [ "${port}" -gt 65535 ]; then
            port=1024
        fi
        attempt=$((attempt + 1))
    done
    echo "${port}"
}

# Parse stack.conf to extract default ports
get_stack_ports() {
    local conf_file="$1"
    if [ -f "${conf_file}" ]; then
        grep -E "^PORT_" "${conf_file}" || true
    fi
}

# Wait until all containers in a stack report healthy or running
wait_for_stack_healthy() {
    local compose_file="$1"
    local timeout="${2:-45}"
    local count=0

    log_info "Waiting for containers to report healthy..."
    while [ "${count}" -lt "${timeout}" ]; do
        local unhealthies
        unhealthies=$(docker compose -f "${compose_file}" ps --format '{{.Health}}' 2>/dev/null | grep -v "healthy" | grep -v "^$" || true)
        
        if [ -z "${unhealthies}" ]; then
            log_success "All stack containers are healthy!"
            return 0
        fi
        
        sleep 1
        count=$((count + 1))
    done
    
    log_warn "Timeout reached waiting for healthchecks. Proceeding anyway..."
    return 0
}

# Get total RAM usage for stack containers
get_stack_ram_usage() {
    local stack_name="$1"
    local compose_file="${OMASTACK_STATE_DIR}/${stack_name}-compose.yml"
    local state_file="${OMASTACK_STATE_DIR}/${stack_name}.json"

    if [ ! -f "${state_file}" ] && [ ! -f "${compose_file}" ]; then
        echo "0MB"
        return
    fi

    if is_docker_available && [ -f "${compose_file}" ]; then
        local container_ids
        container_ids=$(docker compose -f "${compose_file}" ps -q 2>/dev/null || true)

        if [ -n "${container_ids}" ]; then
            local total_bytes=0
            for cid in ${container_ids}; do
                local mem_str
                mem_str=$(docker stats --no-stream --format '{{.MemUsage}}' "${cid}" 2>/dev/null | awk '{print $1}' || true)
                if [[ "${mem_str}" =~ ([0-9.]+)([KiB|MiB|GiB|B|MB|GB]+) ]]; then
                    local val="${BASH_REMATCH[1]}"
                    local unit="${BASH_REMATCH[2]}"
                    case "${unit}" in
                        GiB|GB) total_bytes=$(echo "${total_bytes} + ${val} * 1024" | bc 2>/dev/null || echo "${total_bytes}") ;;
                        MiB|MB) total_bytes=$(echo "${total_bytes} + ${val}" | bc 2>/dev/null || echo "${total_bytes}") ;;
                        KiB|kB) total_bytes=$(echo "${total_bytes} + ${val} / 1024" | bc 2>/dev/null || echo "${total_bytes}") ;;
                    esac
                fi
            done
            printf "%.0fMB" "${total_bytes}"
            return
        fi
    fi

    if [ -f "${state_file}" ]; then
        local state_ram
        state_ram=$(grep -o '"ram_mb":[0-9]*' "${state_file}" | cut -d':' -f2 || true)
        if [ -n "${state_ram}" ]; then
            echo "${state_ram}MB"
            return
        fi
    fi

    echo "180MB"
}
