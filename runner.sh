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

# 3. Optional user desktop notification for user feedback
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

# 4. Execute omastack
exec "${BIN}" "$@"
