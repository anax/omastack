#!/usr/bin/env bash
# OmaStack Theme Library - Omarchy active theme detection & gum/fzf dynamic styling
# SPDX-License-Identifier: MIT

set -euo pipefail

OMARCHY_THEME_DIR="${HOME}/.config/omarchy/current/theme"

# Detect primary and secondary theme colors from Omarchy environment or default to Tokyo Night
detect_omarchy_theme() {
    local bg="#1a1b26"
    local fg="#c0caf5"
    local primary="#7aa2f7"
    local secondary="#bb9af7"
    local accent="#7dcfff"
    local border="#414868"

    if [ -f "${OMARCHY_THEME_DIR}/colors.json" ]; then
        if command -v jq >/dev/null 2>&1; then
            bg=$(jq -r '.background // "#1a1b26"' "${OMARCHY_THEME_DIR}/colors.json")
            fg=$(jq -r '.foreground // "#c0caf5"' "${OMARCHY_THEME_DIR}/colors.json")
            primary=$(jq -r '.primary // "#7aa2f7"' "${OMARCHY_THEME_DIR}/colors.json")
            secondary=$(jq -r '.secondary // "#bb9af7"' "${OMARCHY_THEME_DIR}/colors.json")
            accent=$(jq -r '.accent // "#7dcfff"' "${OMARCHY_THEME_DIR}/colors.json")
            border=$(jq -r '.border // "#414868"' "${OMARCHY_THEME_DIR}/colors.json")
        fi
    elif [ -f "${OMARCHY_THEME_DIR}/hyprland.conf" ]; then
        # Parse active Hyprland active border color
        local parsed_accent
        parsed_accent=$(grep -i "col.active_border" "${OMARCHY_THEME_DIR}/hyprland.conf" | head -n1 | sed -E 's/.*rgb\((.*)\).*/#\1/' || true)
        if [ -n "${parsed_accent}" ]; then
            accent="#${parsed_accent//#/}"
        fi
    fi

    export OMASTACK_THEME_BG="${bg}"
    export OMASTACK_THEME_FG="${fg}"
    export OMASTACK_THEME_PRIMARY="${primary}"
    export OMASTACK_THEME_SECONDARY="${secondary}"
    export OMASTACK_THEME_ACCENT="${accent}"
    export OMASTACK_THEME_BORDER="${border}"
}

# Export environment variables for Charmbracelet gum
export_gum_theme() {
    detect_omarchy_theme
    export GUM_CHOOSE_CURSOR_FOREGROUND="${OMASTACK_THEME_ACCENT}"
    export GUM_CHOOSE_HEADER_FOREGROUND="${OMASTACK_THEME_PRIMARY}"
    export GUM_CHOOSE_ITEM_FOREGROUND="${OMASTACK_THEME_FG}"
    export GUM_CONFIRM_PROMPT_FOREGROUND="${OMASTACK_THEME_PRIMARY}"
    export GUM_CONFIRM_SELECTED_BACKGROUND="${OMASTACK_THEME_PRIMARY}"
    export GUM_INPUT_CURSOR_FOREGROUND="${OMASTACK_THEME_ACCENT}"
    export GUM_INPUT_PROMPT_FOREGROUND="${OMASTACK_THEME_PRIMARY}"
}

# Get fzf color arguments
get_fzf_colors() {
    detect_omarchy_theme
    echo "--color=bg:${OMASTACK_THEME_BG},fg:${OMASTACK_THEME_FG},hl:${OMASTACK_THEME_ACCENT},bg+:${OMASTACK_THEME_BORDER},fg+:${OMASTACK_THEME_PRIMARY},prompt:${OMASTACK_THEME_ACCENT},pointer:${OMASTACK_THEME_SECONDARY}"
}
