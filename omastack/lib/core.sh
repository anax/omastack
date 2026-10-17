#!/usr/bin/env bash
# OmaStack Core Library - Logging, dependency checks, state tracking
# SPDX-License-Identifier: MIT

set -euo pipefail

OMASTACK_VERSION="1.0.0"
OMASTACK_HOME="${OMASTACK_HOME:-${HOME}/.local/share/omastack}"
OMASTACK_CONFIG_DIR="${OMASTACK_CONFIG_DIR:-${HOME}/.config/omastack}"
OMASTACK_STATE_DIR="${OMASTACK_STATE_DIR:-${OMASTACK_HOME}/state}"
OMASTACK_CERTS_DIR="${OMASTACK_CERTS_DIR:-${OMASTACK_HOME}/certs}"
OMASTACK_TEMPLATES_DIR="${OMASTACK_TEMPLATES_DIR:-${OMASTACK_HOME}/templates}"
if [ ! -d "${OMASTACK_TEMPLATES_DIR}" ] && [ -d "/usr/share/omastack/templates" ]; then
    OMASTACK_TEMPLATES_DIR="/usr/share/omastack/templates"
fi

if [ -w "$(dirname "${OMASTACK_HOME}")" ] || [ -w "${OMASTACK_HOME}" ]; then
    mkdir -p -m 700 "${OMASTACK_HOME}" "${OMASTACK_STATE_DIR}" "${OMASTACK_CERTS_DIR}" 2>/dev/null || true
    chmod 700 "${OMASTACK_HOME}" "${OMASTACK_STATE_DIR}" "${OMASTACK_CERTS_DIR}" 2>/dev/null || true
else
    # Fallback to user home directory if OMASTACK_HOME is read-only (e.g. /usr/share/omastack)
    OMASTACK_STATE_DIR="${HOME}/.local/share/omastack/state"
    OMASTACK_CERTS_DIR="${HOME}/.local/share/omastack/certs"
    mkdir -p -m 700 "${HOME}/.local/share/omastack" "${OMASTACK_STATE_DIR}" "${OMASTACK_CERTS_DIR}" 2>/dev/null || true
fi
mkdir -p -m 700 "${OMASTACK_CONFIG_DIR}" 2>/dev/null || true

# ANSI Colors
COLOR_RESET="\033[0m"
COLOR_BOLD="\033[1m"
COLOR_CYAN="\033[36m"
COLOR_GREEN="\033[32m"
COLOR_YELLOW="\033[33m"
COLOR_RED="\033[31m"
COLOR_MAGENTA="\033[35m"

log_info() {
    echo -e "${COLOR_CYAN}⚡ [OmaStack]${COLOR_RESET} $1" >&2
}

log_success() {
    echo -e "${COLOR_GREEN}✔ [OmaStack]${COLOR_RESET} $1" >&2
}

log_warn() {
    echo -e "${COLOR_YELLOW}⚠ [OmaStack]${COLOR_RESET} $1" >&2
}

log_error() {
    echo -e "${COLOR_RED}✖ [OmaStack]${COLOR_RESET} $1" >&2
}

notify_desktop() {
    local title="$1"
    local message="$2"
    local urgency="${3:-normal}"
    if command -v notify-send >/dev/null 2>&1; then
        notify-send -u "${urgency}" -a "OmaStack" -i "dialog-information" -h "string:x-canonical-private-synchronous:omastack" "${title}" "${message}" 2>/dev/null || \
        notify-send -u "${urgency}" -a "OmaStack" -i "dialog-information" "${title}" "${message}" 2>/dev/null || true
    fi
}

check_dependencies() {
    local missing=()
    local required_cmds=("docker" "ss" "wl-copy")

    for cmd in "${required_cmds[@]}"; do
        if ! command -v "${cmd}" >/dev/null 2>&1; then
            missing+=("${cmd}")
        fi
    done

    # Check docker compose plugin
    if command -v docker >/dev/null 2>&1; then
        if ! docker compose version >/dev/null 2>&1; then
            missing+=("docker-compose")
        fi
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        log_warn "Missing recommended system binaries: ${missing[*]}"
        log_info "For full Omarchy native experience, install: docker, iproute2 (ss), wl-clipboard, libnotify, gum, fzf, walker, caddy, mkcert"
    fi
}

get_active_stacks() {
    local active=()
    if [ -d "${OMASTACK_STATE_DIR}" ]; then
        for state_file in "${OMASTACK_STATE_DIR}"/*.json; do
            if [ -f "${state_file}" ]; then
                local stack_name
                stack_name=$(basename "${state_file}" .json)
                if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
                    if docker compose -f "${OMASTACK_STATE_DIR}/${stack_name}-compose.yml" ps --quiet 2>/dev/null | grep -q .; then
                        active+=("${stack_name}")
                    fi
                else
                    if grep -q '"status":"running"' "${state_file}" 2>/dev/null; then
                        active+=("${stack_name}")
                    fi
                fi
            fi
        done
    fi
    echo "${active[@]:-}"
}

save_stack_state() {
    local stack_name="$1"
    local json_data="$2"
    echo "${json_data}" > "${OMASTACK_STATE_DIR}/${stack_name}.json"
}

remove_stack_state() {
    local stack_name="$1"
    rm -f "${OMASTACK_STATE_DIR}/${stack_name}.json"
    rm -f "${OMASTACK_STATE_DIR}/${stack_name}-compose.yml"
}
