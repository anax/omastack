#!/usr/bin/env bash
# OmaStack Docker Library - Container management, port scanner, healthchecks & RAM stats
# SPDX-License-Identifier: MIT

set -euo pipefail

is_docker_available() {
    command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1
}

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
                        GiB|GB) total_bytes=$(echo "${total_bytes} + (${val} * 1024)" | bc 2>/dev/null || echo "${total_bytes}") ;;
                        MiB|MB) total_bytes=$(echo "${total_bytes} + ${val}" | bc 2>/dev/null || echo "${total_bytes}") ;;
                        KiB|kB) total_bytes=$(echo "${total_bytes} + (${val} / 1024)" | bc 2>/dev/null || echo "${total_bytes}") ;;
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
