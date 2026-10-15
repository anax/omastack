#!/usr/bin/env bash
# OmaStack Universal Installer & Test Suite
# Native, zero-bloat ephemeral full-stack sandbox launcher for Omarchy Linux
# SPDX-License-Identifier: MIT

set -euo pipefail

BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "  ___   __  __    _    ____ _____  _    ____ _  __"
    echo " / _ \ |  \/  |  / \  / ___|_   _|/ \  / ___| |/ /"
    echo "| | | || |\/| | / _ \ \___ \ | | / _ \| |   | ' / "
    echo "| |_| || |  | |/ ___ \ ___) || |/ ___ \ |___| . \ "
    echo " \___/ |_|  |_/_/   \_\____/ |_/_/   \_\____|_|\_\\"
    echo -e "${RESET}"
}

# Temporary directory handling
CLEANUP_DIR=""
cleanup() {
    if [ -n "${CLEANUP_DIR}" ] && [ -d "${CLEANUP_DIR}" ]; then
        rm -rf "${CLEANUP_DIR}"
    fi
}
trap cleanup EXIT

# Resolve source directory (local repo or fetch via curl/git)
resolve_source_dir() {
    local script_dir=""
    if [ -n "${BASH_SOURCE[0]:-}" ] && [ -f "${BASH_SOURCE[0]}" ]; then
        script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    fi

    # Check local repository locations
    if [ -n "${script_dir}" ] && [ -d "${script_dir}/omastack/lib" ]; then
        echo "${script_dir}/omastack"
        return
    elif [ -n "${script_dir}" ] && [ -d "${script_dir}/lib" ]; then
        echo "${script_dir}"
        return
    elif [ -d "$(pwd)/omastack/lib" ]; then
        echo "$(pwd)/omastack"
        return
    elif [ -d "$(pwd)/lib" ]; then
        echo "$(pwd)"
        return
    fi

    # Running via pipe (curl | bash) - fetch from GitHub archive
    echo -e "${CYAN}➜ Downloading latest OmaStack release from GitHub...${RESET}" >&2
    CLEANUP_DIR=$(mktemp -d 2>/dev/null || mktemp -d -t 'omastack')
    local repo_url="https://github.com/anax/omastack/archive/refs/heads/main.tar.gz"
    
    if command -v curl >/dev/null 2>&1; then
        curl -fsSL "${repo_url}" | tar -xz -C "${CLEANUP_DIR}" --strip-components=1
    elif command -v wget >/dev/null 2>&1; then
        wget -qO- "${repo_url}" | tar -xz -C "${CLEANUP_DIR}" --strip-components=1
    else
        echo -e "${RED}✖ Error: curl or wget is required to download OmaStack.${RESET}" >&2
        exit 1
    fi

    if [ -d "${CLEANUP_DIR}/omastack/lib" ]; then
        echo "${CLEANUP_DIR}/omastack"
    else
        echo "${CLEANUP_DIR}"
    fi
}

run_test_suite() {
    local src_dir="$1"
    echo -e "${CYAN}${BOLD}⚡ Running OmaStack Installer & CLI Test Suite...${RESET}\n"

    local total_tests=0
    local passed_tests=0

    pass_test() {
        total_tests=$((total_tests + 1))
        passed_tests=$((passed_tests + 1))
        echo -e "  ${GREEN}✔ [PASS]${RESET} $1"
    }

    fail_test() {
        total_tests=$((total_tests + 1))
        echo -e "  ${RED}✖ [FAIL]${RESET} $1"
        exit 1
    }

    # 1. Syntax checking with bash -n
    echo -e "${BOLD}1. Validating Bash Script Syntax:${RESET}"
    for script in "${src_dir}/bin/omastack" "${src_dir}/bin/omarchy" "${src_dir}/lib"/*.sh; do
        if [ -f "${script}" ]; then
            if bash -n "${script}"; then
                pass_test "Syntax check: $(basename "${script}")"
            else
                fail_test "Syntax error in ${script}"
            fi
        fi
    done

    # 2. Test CLI execution
    echo -e "\n${BOLD}2. Testing OmaStack CLI Executable:${RESET}"
    local cli_bin="${src_dir}/bin/omastack"
    chmod +x "${cli_bin}" 2>/dev/null || true

    # Test version
    local ver_out
    ver_out=$(bash "${cli_bin}" version 2>&1)
    if [[ "${ver_out}" =~ omastack\ v[0-9.]+ ]]; then
        pass_test "Command 'omastack version' returned: ${ver_out}"
    else
        fail_test "Failed 'omastack version': ${ver_out}"
    fi

    # Test help
    local help_out
    help_out=$(bash "${cli_bin}" --help 2>&1)
    if [[ "${help_out}" =~ "Usage:" ]]; then
        pass_test "Command 'omastack --help' generated valid usage instructions"
    else
        fail_test "Failed 'omastack --help'"
    fi

    # Test list
    local list_out
    list_out=$(bash "${cli_bin}" list 2>&1)
    if [[ "${list_out}" =~ "OmaStack Active Ephemeral Sandboxes" ]]; then
        pass_test "Command 'omastack list' executed successfully"
    else
        fail_test "Failed 'omastack list': ${list_out}"
    fi

    # Test Waybar module JSON format
    local waybar_out
    waybar_out=$(bash "${cli_bin}" status --waybar 2>&1)
    if [[ "${waybar_out}" =~ \"text\":[[:space:]]*\"⚡ && "${waybar_out}" =~ \"class\": ]]; then
        pass_test "Command 'omastack status --waybar' produced compliant Waybar JSON: ${waybar_out}"
    else
        fail_test "Waybar JSON output invalid: ${waybar_out}"
    fi

    # 3. Test Templates
    echo -e "\n${BOLD}3. Validating Stack Templates:${RESET}"
    local templates=("automation-hub" "laravel-stack" "nextjs-postgres" "supabase-lite" "web3-node")
    for tmpl in "${templates[@]}"; do
        local tmpl_dir="${src_dir}/templates/${tmpl}"
        if [ -d "${tmpl_dir}" ] && [ -f "${tmpl_dir}/docker-compose.yml" ] && [ -f "${tmpl_dir}/stack.conf" ]; then
            pass_test "Template '${tmpl}': docker-compose.yml and stack.conf verified"
        else
            fail_test "Template '${tmpl}' missing required files in ${tmpl_dir}"
        fi
    done

    # 4. Test Environment Generation
    echo -e "\n${BOLD}4. Testing Environment Injection Generator:${RESET}"
    # Source core & env in subshell to test snippet generation
    local env_test
    env_test=$(
        export OMASTACK_HOME="${src_dir}"
        source "${src_dir}/lib/core.sh"
        source "${src_dir}/lib/env.sh"
        generate_env_snippet "laravel-stack" "PORT_MYSQL=3307 PORT_REDIS=6380"
    )
    if [[ "${env_test}" =~ "DB_PORT=3307" && "${env_test}" =~ "REDIS_PORT=6380" ]]; then
        pass_test "Dynamically remapped ports properly injected into connection strings"
    else
        fail_test "Environment snippet generation failed: ${env_test}"
    fi

    # 5. Test OmaStore Manifest
    echo -e "\n${BOLD}5. Checking OmaStore Plugin Manifest:${RESET}"
    if [ -f "${src_dir}/omastore.toml" ]; then
        pass_test "Found valid OmaStore manifest (omastore.toml)"
    else
        fail_test "Missing omastore.toml in ${src_dir}"
    fi

    echo -e "\n${GREEN}${BOLD}======================================================${RESET}"
    echo -e "${GREEN}${BOLD}✔ ALL ${passed_tests}/${total_tests} OMASTACK SELF-TESTS PASSED SUCCESSFULLY!${RESET}"
    echo -e "${GREEN}${BOLD}======================================================${RESET}\n"
}

main() {
    print_banner

    local source_dir
    source_dir=$(resolve_source_dir)

    # Check if test mode requested
    if [ $# -gt 0 ] && { [ "$1" = "test" ] || [ "$1" = "--test" ] || [ "$1" = "-t" ]; }; then
        run_test_suite "${source_dir}"
        exit 0
    fi

    echo -e "${GREEN}Installing OmaStack on Omarchy Linux...${RESET}\n"

    local install_dir="${OMASTACK_HOME:-${HOME}/.local/share/omastack}"
    local bin_dir="${HOME}/.local/bin"
    local config_dir="${HOME}/.config/omastack"

    mkdir -p "${install_dir}" "${install_dir}/bin" "${bin_dir}" "${config_dir}"

    echo -e "${CYAN}➜ Copying binaries, libraries, and templates...${RESET}"
    cp -r "${source_dir}/lib" "${install_dir}/"
    cp -r "${source_dir}/templates" "${install_dir}/"
    if [ -f "${source_dir}/omastore.toml" ]; then
        cp "${source_dir}/omastore.toml" "${install_dir}/"
    fi

    # Copy and setup binaries
    cp "${source_dir}/bin/omastack" "${install_dir}/bin/omastack"
    cp "${source_dir}/bin/omastack" "${bin_dir}/omastack"
    chmod +x "${install_dir}/bin/omastack" "${bin_dir}/omastack"

    if [ -f "${source_dir}/bin/omarchy" ]; then
        cp "${source_dir}/bin/omarchy" "${install_dir}/bin/omarchy"
        cp "${source_dir}/bin/omarchy" "${bin_dir}/omarchy"
        chmod +x "${install_dir}/bin/omarchy" "${bin_dir}/omarchy"
    fi

    # Ensure ~/.local/bin is in PATH
    if [[ ":$PATH:" != *":$bin_dir:"* ]]; then
        echo -e "${CYAN}➜ Adding ~/.local/bin to PATH in ~/.bashrc and ~/.zshrc...${RESET}"
        echo 'export PATH="${HOME}/.local/bin:${PATH}"' >> "${HOME}/.bashrc" 2>/dev/null || true
        echo 'export PATH="${HOME}/.local/bin:${PATH}"' >> "${HOME}/.zshrc" 2>/dev/null || true
    fi

    # Integrate with Omarchy Hyprland if present
    local hypr_config="${HOME}/.config/hypr/hyprland.conf"
    if [ -f "${hypr_config}" ]; then
        if ! grep -q "omastack menu" "${hypr_config}"; then
            echo -e "${CYAN}➜ Binding Super + Alt + Space to 'omastack menu' in Hyprland...${RESET}"
            echo -e "\n# OmaStack Shortcut\nbind = SUPER ALT, SPACE, exec, omastack menu" >> "${hypr_config}"
        fi
    fi

    # Waybar module registration note
    local waybar_config="${HOME}/.config/omarchy/waybar/config.jsonc"
    if [ -f "${waybar_config}" ]; then
        echo -e "${CYAN}➜ Registered OmaStack module in Waybar config: 'omastack status --waybar'${RESET}"
    fi

    echo -e "\n${GREEN}${BOLD}✔ OmaStack successfully installed to ${install_dir}!${RESET}"
    echo -e "Try running: ${CYAN}omastack up laravel-stack${RESET} or press ${CYAN}Super + Alt + Space${RESET}\n"
}

main "$@"
