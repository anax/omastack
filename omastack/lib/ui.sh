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
    elif command -v fzf >/dev/null 2>&1; then
        local fzf_opts
        fzf_opts=$(get_fzf_colors)
        selected=$(echo -e "${options}" | fzf ${fzf_opts} --prompt="OmaStack > ")
    elif command -v gum >/dev/null 2>&1; then
        selected=$(echo -e "${options}" | gum choose --header="OmaStack Sandbox Launcher")
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
    local templates=("laravel-stack" "supabase-lite" "nextjs-postgres" "automation-hub" "web3-node")
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
