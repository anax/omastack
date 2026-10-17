#!/usr/bin/env bash
# OmaStack UI Library - Walker/Rofi integration, Waybar custom JSON module, and TUI menus
# SPDX-License-Identifier: MIT

set -euo pipefail

# Output JSON payload formatted specifically for Waybar custom module
output_waybar_json() {
    local active_stacks
    active_stacks=$(get_active_stacks)

    local count=0
    local tooltip_lines=""
    local class_name="idle"

    if [ -n "${active_stacks}" ]; then
        for stack in ${active_stacks}; do
            count=$((count + 1))
            local ram
            ram=$(get_stack_ram_usage "${stack}")
            tooltip_lines="${tooltip_lines}\n- ${stack} (${ram})"
        done
        class_name="active"
    fi

    if [ "${count}" -gt 0 ]; then
        local tooltip="⚡ OmaStack Active (${count}):${tooltip_lines}\n\n[Left-Click] Open Menu\n[Right-Click] Stop All Stacks"
        printf '{"text": "⚡ %d", "tooltip": "%s", "class": "%s"}\n' "${count}" "${tooltip}" "${class_name}"
    else
        printf '{"text": "⚡ 0", "tooltip": "⚡ OmaStack: No active sandboxes\n\n[Left-Click] Launch Stack Menu", "class": "idle"}\n'
    fi
}

# Walker / Rofi dmenu launcher for Super + Alt + Space Omarchy Menu
launch_walker_menu() {
    export_gum_theme

    local options="🚀 Up (Launch Sandbox)\n🛑 Down (Teardown Stack)\n📊 List (Status & RAM)\n📋 Inject .env to CWD\n🌐 HTTPS Proxy Domains\n📑 Container Logs\n🧹 Teardown All Stacks"
    local selected=""

    if command -v walker >/dev/null 2>&1; then
        selected=$(echo -e "${options}" | walker --dmenu --placeholder "OmaStack Sandbox Launcher...")
    elif command -v rofi >/dev/null 2>&1; then
        selected=$(echo -e "${options}" | rofi -dmenu -p "OmaStack")
    elif [ -t 0 ]; then
        if command -v fzf >/dev/null 2>&1; then
            local fzf_opts
            fzf_opts=$(get_fzf_colors)
            selected=$(echo -e "${options}" | fzf ${fzf_opts} --prompt="OmaStack > ")
        elif command -v gum >/dev/null 2>&1; then
            selected=$(echo -e "${options}" | gum choose --header="OmaStack Sandbox Launcher")
        fi
    else
        # Not running in a terminal: launch an interactive terminal with omastack menu
        for term in foot kitty alacritty wezterm ghostty gnome-terminal xterm; do
            if command -v "${term}" >/dev/null 2>&1; then
                exec "${term}" -e bash -c 'omastack menu' &
                return 0
            fi
        done
        notify_desktop "OmaStack Menu" "Please install walker or rofi for graphical launcher menu." "critical"
        return 1
    fi

    case "${selected}" in
        *"Up"*)
            launch_template_picker
            ;;
        *"Down"*)
            launch_stack_down_picker
            ;;
        *"List"*)
            omastack list
            ;;
        *"Inject"*)
            omastack inject
            ;;
        *"Proxy"*)
            omastack proxy
            ;;
        *"Logs"*)
            omastack logs
            ;;
        *"Teardown All"*)
            omastack down --all
            ;;
    esac
}

# Template selection menu
launch_template_picker() {
    local templates=("laravel-stack" "supabase-lite" "nextjs-postgres" "rails-kamal" "django-celery" "ai-rag-stack" "mern-mongo" "golang-microservices" "observability-lgtm" "clickhouse-analytics" "keycloak-iam" "directus-cms" "wordpress-mariadb" "automation-hub" "web3-node")
    local selected=""

    if command -v gum >/dev/null 2>&1; then
        selected=$(printf "%s\n" "${templates[@]}" | gum choose --header="Select Stack Template to Launch:")
    elif command -v fzf >/dev/null 2>&1; then
        local fzf_opts
        fzf_opts=$(get_fzf_colors)
        selected=$(printf "%s\n" "${templates[@]}" | fzf ${fzf_opts} --prompt="Select Template > ")
    fi

    if [ -n "${selected}" ]; then
        omastack up "${selected}"
    fi
}

# Active stack down picker
launch_stack_down_picker() {
    local active_stacks
    active_stacks=$(get_active_stacks)

    if [ -z "${active_stacks}" ]; then
        log_info "No active stacks to stop."
        notify_desktop "OmaStack" "No active sandboxes to stop."
        return
    fi

    local selected=""
    if command -v gum >/dev/null 2>&1; then
        selected=$(echo "${active_stacks}" | tr ' ' '\n' | gum choose --header="Select Stack to Teardown:")
    elif command -v fzf >/dev/null 2>&1; then
        local fzf_opts
        fzf_opts=$(get_fzf_colors)
        selected=$(echo "${active_stacks}" | tr ' ' '\n' | fzf ${fzf_opts} --prompt="Select Stack to Stop > ")
    fi

    if [ -n "${selected}" ]; then
        omastack down "${selected}"
    fi
}

# Output structured JSON payload for external widget panels (Eww, AGS, Waybar, or Web UI)
output_widget_json() {
    local active_stacks
    active_stacks=$(get_active_stacks)

    local count=0
    local total_ram=0
    local stacks_json="[]"

    if [ -n "${active_stacks}" ]; then
        local items=()
        for stack in ${active_stacks}; do
            count=$((count + 1))
            local ram
            ram=$(get_stack_ram_usage "${stack}")
            local ram_num=$(echo "${ram}" | tr -dc '0-9')
            if [ -n "${ram_num}" ]; then
                total_ram=$((total_ram + ram_num))
            fi
            items+=("{\"id\":\"${stack}\",\"name\":\"${stack}\",\"status\":\"running\",\"ram\":\"${ram}\"}")
        done
        stacks_json="[$(IFS=,; echo "${items[*]}")]"
    fi

    local class_name="idle"
    if [ "${count}" -gt 0 ]; then
        class_name="active"
    fi

    cat << EOF
{
  "active_count": ${count},
  "total_ram": "${total_ram}MB",
  "status_class": "${class_name}",
  "active_stacks": ${stacks_json},
  "templates": ["ai-rag-stack", "automation-hub", "clickhouse-analytics", "directus-cms", "django-celery", "golang-microservices", "keycloak-iam", "laravel-stack", "mern-mongo", "nextjs-postgres", "observability-lgtm", "rails-kamal", "supabase-lite", "web3-node", "wordpress-mariadb"],
  "shortcuts": {
    "menu": "SUPER + ALT + SPACE",
    "widget_panel": "SUPER + ALT + W"
  }
}
EOF
}

# Render visual widget panel card box
render_widget_panel_box() {
    local active_stacks
    active_stacks=$(get_active_stacks)
    local count=0
    if [ -n "${active_stacks}" ]; then
        for s in ${active_stacks}; do count=$((count + 1)); done
    fi

    echo -e "${COLOR_CYAN}${COLOR_BOLD}╭─────────────────────────────────────────────────────────────╮${COLOR_RESET}"
    echo -e "${COLOR_CYAN}${COLOR_BOLD}│ ⚡ OmaStack Ephemeral Sandbox Widget Panel                  │${COLOR_RESET}"
    echo -e "${COLOR_CYAN}${COLOR_BOLD}├─────────────────────────────────────────────────────────────┤${COLOR_RESET}"
    if [ "${count}" -gt 0 ]; then
        echo -e "${COLOR_CYAN}│${COLOR_RESET}  Status: ${COLOR_GREEN}${COLOR_BOLD}Active (${count} running)${COLOR_RESET}                     Proxy: ${COLOR_CYAN}*.oma.local${COLOR_RESET}   ${COLOR_CYAN}│${COLOR_RESET}"
        for s in ${active_stacks}; do
            local ram
            ram=$(get_stack_ram_usage "${s}")
            printf "${COLOR_CYAN}│${COLOR_RESET}  ● %-20s [RAM: %-7s] [Status: UP]     ${COLOR_CYAN}│${COLOR_RESET}\n" "${s}" "${ram}"
        done
    else
        echo -e "${COLOR_CYAN}│${COLOR_RESET}  Status: ${COLOR_YELLOW}Idle (0 active sandboxes)${COLOR_RESET}             Proxy: ${COLOR_CYAN}*.oma.local${COLOR_RESET}   ${COLOR_CYAN}│${COLOR_RESET}"
    fi
    echo -e "${COLOR_CYAN}${COLOR_BOLD}├─────────────────────────────────────────────────────────────┤${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}  Available Stack Templates (15 Curated Sandboxes):          ${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}   1. laravel-stack        (MySQL 8.0, Redis, Mailpit, Meili) ${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}   2. supabase-lite        (PostgreSQL 16, PostgREST, PgAdmin)${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}   3. nextjs-postgres      (PostgreSQL 16, Redis, Adminer)    ${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}   4. rails-kamal          (PostgreSQL 16, Redis, Mail, MinIO)${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}   5. django-celery        (Postgres 16, Redis, Flower, Mail) ${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}   6. ai-rag-stack         (Qdrant Vector, pgvector, Redis)   ${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}   7. mern-mongo           (MongoDB 7, Mongo Express, Redis)  ${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}   8. golang-microservices (RabbitMQ, Jaeger, Postgres, Redis)${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}   9. observability-lgtm   (Grafana, Prometheus, Loki, Redis) ${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}  10. clickhouse-analytics (ClickHouse OLAP, Redpanda, Redis) ${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}  11. keycloak-iam         (Keycloak 24 OIDC, Postgres, Mail) ${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}  12. directus-cms         (Directus 11 Studio, Postgres)     ${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}  13. wordpress-mariadb    (MariaDB 11, phpMyAdmin, Redis)    ${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}  14. automation-hub       (n8n, PostgreSQL 16, Redis)        ${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}  15. web3-node            (Anvil RPC, PostgreSQL 16, Redis)  ${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}${COLOR_BOLD}├─────────────────────────────────────────────────────────────┤${COLOR_RESET}"
    echo -e "${COLOR_CYAN}│${COLOR_RESET}  Keybindings: ${COLOR_BOLD}Super+Alt+W${COLOR_RESET} (Widget Panel) | ${COLOR_BOLD}Super+Alt+Space${COLOR_RESET} (Menu) ${COLOR_CYAN}│${COLOR_RESET}"
    echo -e "${COLOR_CYAN}${COLOR_BOLD}╰─────────────────────────────────────────────────────────────╯${COLOR_RESET}"
}

# Main Widget Panel Dispatcher
launch_widget_panel() {
    local mode="${1:-}"

    if [ "${mode}" = "--json" ] || [ "${mode}" = "json" ]; then
        output_widget_json
        return 0
    fi

    if [ "${mode}" = "--dry-run" ] || [ "${mode}" = "--print" ]; then
        render_widget_panel_box
        return 0
    fi

    render_widget_panel_box

    # Interactive action prompt if interactive terminal with gum
    if [ -t 0 ] && command -v gum >/dev/null 2>&1; then
        local action
        action=$(gum choose --header="Widget Panel Actions:" "Launch Stack Template" "Teardown Running Stack" "Inject .env into CWD" "Sync Caddy Proxy (*.oma.local)" "Teardown All Stacks" "Exit Widget Panel")
        case "${action}" in
            *"Launch Stack"*) launch_template_picker ;;
            *"Teardown Running"*) launch_stack_down_picker ;;
            *"Inject"*) omastack inject ;;
            *"Sync Caddy"*) omastack proxy ;;
            *"Teardown All"*) omastack down --all ;;
            *) return 0 ;;
        esac
    fi
}

