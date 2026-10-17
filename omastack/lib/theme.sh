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

# Theme Packages Catalog
get_theme_packages() {
    cat << 'EOF'
tokyo-night|Tokyo Night|#12131c|#1e2030|#e0e7ff|#7aa2f7|#bb9af7|#7dcfff|#3b4261|Popular
catppuccin-mocha|Catppuccin Mocha|#181825|#24273a|#f4f6fc|#89b4fa|#cba6f7|#89dceb|#494d64|Pastel & Soft
gruvbox-dark|Gruvbox Dark|#1d2021|#282828|#fbf1c7|#fabd2f|#d3869b|#8ec07c|#504945|Retro & Vintage
rose-pine|Rosé Pine|#14121d|#1f1d2e|#f8f6fe|#9ccfd8|#c4a7e7|#ebbcba|#393552|Pastel & Soft
nordic|Nordic Frost|#1e222a|#2e3440|#f8fafc|#88c0d0|#b48ead|#81a1c1|#4c566a|Popular
cyberpunk|Cyberpunk Neon|#08090f|#121524|#ffffff|#00f0ff|#ff0055|#ffe600|#2e3553|Cyber & Neon
dracula|Dracula Official|#1a1a24|#282a36|#f8f8f2|#bd93f9|#ff79c6|#50fa7b|#44475a|Popular
one-dark|One Dark Pro|#1b1d23|#282c34|#abb2bf|#61afef|#c678dd|#98c379|#3e4452|Popular
kanagawa|Kanagawa Wave|#181820|#22222d|#dcd7ba|#7e9cd8|#957fb8|#98bb6c|#363646|Pastel & Soft
synthwave-84|Synthwave '84|#161124|#262335|#f92aad|#ff7edb|#fe4450|#72f1b8|#463465|Cyber & Neon
monokai-pro|Monokai Pro|#19181a|#2d2a2e|#fcfcfa|#ffd866|#ff6188|#a9dc76|#403e41|High Contrast
solarized-dark|Solarized Dark|#001e26|#073642|#93a1a1|#268bd2|#6c71c4|#2aa198|#0f4a56|Retro & Vintage
EOF
}

list_theme_packages() {
    echo -e "${COLOR_BOLD}OmaStack Curated Omarchy Theme Packages:${COLOR_RESET}"
    echo -e "================================================="
    printf "%-18s %-22s %-16s %-10s\n" "PACKAGE ID" "THEME NAME" "CATEGORY" "ACCENT"
    printf "%-18s %-22s %-16s %-10s\n" "----------" "----------" "--------" "------"
    while IFS='|' read -r key name bg card fg primary secondary accent border category; do
        printf "%-18s %-22s %-16s %-10s\n" "${key}" "${name}" "${category}" "${primary}"
    done < <(get_theme_packages)
}

apply_theme_package() {
    local target_key="$1"
    local found=false
    local theme_line=""

    while IFS='|' read -r key name bg card fg primary secondary accent border category; do
        if [ "${key}" = "${target_key}" ]; then
            found=true
            theme_line="${key}|${name}|${bg}|${card}|${fg}|${primary}|${secondary}|${accent}|${border}|${category}"
            break
        fi
    done < <(get_theme_packages)

    if [ "${found}" = false ]; then
        log_error "Unknown theme package '${target_key}'. Run 'omastack theme list' to see available packages."
        exit 1
    fi

    local key name bg card fg primary secondary accent border category
    IFS='|' read -r key name bg card fg primary secondary accent border category <<< "${theme_line}"

    mkdir -p "${OMARCHY_THEME_DIR}" 2>/dev/null || true
    cat << EOF > "${OMARCHY_THEME_DIR}/colors.json"
{
  "name": "${name}",
  "id": "omarchy.theme.${key}",
  "background": "${bg}",
  "card": "${card}",
  "foreground": "${fg}",
  "primary": "${primary}",
  "secondary": "${secondary}",
  "accent": "${accent}",
  "border": "${border}"
}
EOF

    log_success "Applied theme package: ${COLOR_BOLD}${name}${COLOR_RESET} (${key})"
    log_info "Synchronized to ${OMARCHY_THEME_DIR}/colors.json"
}
