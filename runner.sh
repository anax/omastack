#!/usr/bin/env bash
# OmaStack Desktop Runner & Process Wrapper for Omarchy Linux
# SPDX-License-Identifier: MIT
set -euo pipefail

# 1. Expand PATH to include user and system binary paths
export PATH="${HOME}/.local/bin:/usr/local/bin:/usr/bin:/bin:${PATH}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN=""

# 2. Locate omastack binary with extensive fallback order
if command -v omastack >/dev/null 2>&1; then
    BIN="$(command -v omastack)"
elif [ -x "${HOME}/.local/bin/omastack" ]; then
    BIN="${HOME}/.local/bin/omastack"
elif [ -x "${SCRIPT_DIR}/omastack/bin/omastack" ]; then
    BIN="${SCRIPT_DIR}/omastack/bin/omastack"
elif [ -x "${SCRIPT_DIR}/bin/omastack" ]; then
    BIN="${SCRIPT_DIR}/bin/omastack"
elif [ -x "${SCRIPT_DIR}/../bin/omastack" ]; then
    BIN="${SCRIPT_DIR}/../bin/omastack"
elif [ -x "/usr/share/omastack/bin/omastack" ]; then
    BIN="/usr/share/omastack/bin/omastack"
elif [ -x "/usr/local/share/omastack/bin/omastack" ]; then
    BIN="/usr/local/share/omastack/bin/omastack"
fi

if [ -z "${BIN}" ]; then
    if command -v notify-send >/dev/null 2>&1; then
        notify-send -u critical -a "OmaStack" "Binary Not Found" "Cannot find omastack executable. Please run ./install.sh." || true
    fi
    echo "Error: omastack executable not found" >&2
    exit 127
fi

# 3. Auto-bootstrap CLI binary into ~/.local/bin/omastack if missing
if [ ! -x "${HOME}/.local/bin/omastack" ]; then
    mkdir -p "${HOME}/.local/bin" 2>/dev/null || true
    cp "${BIN}" "${HOME}/.local/bin/omastack" 2>/dev/null || true
    chmod +x "${HOME}/.local/bin/omastack" 2>/dev/null || true
fi

# 4. Auto-bootstrap library files into ~/.local/share/omastack if missing
if [ ! -d "${HOME}/.local/share/omastack/lib" ]; then
    mkdir -p "${HOME}/.local/share/omastack" 2>/dev/null || true
    if [ -d "${SCRIPT_DIR}/omastack/lib" ]; then
        cp -r "${SCRIPT_DIR}/omastack/lib" "${HOME}/.local/share/omastack/" 2>/dev/null || true
        cp -r "${SCRIPT_DIR}/omastack/templates" "${HOME}/.local/share/omastack/" 2>/dev/null || true
    elif [ -d "${SCRIPT_DIR}/lib" ]; then
        cp -r "${SCRIPT_DIR}/lib" "${HOME}/.local/share/omastack/" 2>/dev/null || true
        cp -r "${SCRIPT_DIR}/templates" "${HOME}/.local/share/omastack/" 2>/dev/null || true
    fi
fi

# 5. Ensure ~/.local/bin is present in shell startup configs
if [ -f "${HOME}/.bashrc" ] && ! grep -q '\.local/bin' "${HOME}/.bashrc" 2>/dev/null; then
    echo 'export PATH="${HOME}/.local/bin:${PATH}"' >> "${HOME}/.bashrc" 2>/dev/null || true
fi
if [ -f "${HOME}/.zshrc" ] && ! grep -q '\.local/bin' "${HOME}/.zshrc" 2>/dev/null; then
    echo 'export PATH="${HOME}/.local/bin:${PATH}"' >> "${HOME}/.zshrc" 2>/dev/null || true
fi

# 6. Optional user desktop notification for user feedback
CMD="${1:-}"
SUB="${2:-}"
if [ "${CMD}" = "up" ] && [ -n "${SUB}" ]; then
    if command -v notify-send >/dev/null 2>&1; then
        notify-send -u normal -a "OmaStack" "Starting ${SUB}..." "Spinning up Docker containers in background" 2>/dev/null || true
    fi
elif [ "${CMD}" = "down" ] && [ "${SUB}" = "--all" ]; then
    if command -v notify-send >/dev/null 2>&1; then
        notify-send -u normal -a "OmaStack" "Stopping All..." "Tearing down all active sandboxes" 2>/dev/null || true
    fi
elif [ "${CMD}" = "down" ] && [ -n "${SUB}" ]; then
    if command -v notify-send >/dev/null 2>&1; then
        notify-send -u normal -a "OmaStack" "Stopping ${SUB}..." "Tearing down Docker containers" 2>/dev/null || true
    fi
fi

# 7. Execute omastack
exec "${BIN}" "$@"
