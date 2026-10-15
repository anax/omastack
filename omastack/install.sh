#!/usr/bin/env bash
# OmaStack Installer for Omarchy Linux
# SPDX-License-Identifier: MIT

set -euo pipefail

BOLD="\033[1m"
GREEN="\033[32m"
CYAN="\033[36m"
RESET="\033[0m"

echo -e "${CYAN}${BOLD}"
echo "  ___   __  __    _    ____ _____  _    ____ _  __"
echo " / _ \ |  \/  |  / \  / ___|_   _|/ \  / ___| |/ /"
echo "| | | || |\/| | / _ \ \___ \ | | / _ \| |   | ' / "
echo "| |_| || |  | |/ ___ \ ___) || |/ ___ \ |___| . \ "
echo " \___/ |_|  |_/_/   \_\____/ |_/_/   \_\____|_|\_\\"
echo -e "${RESET}"
echo -e "${GREEN}Installing OmaStack on Omarchy Linux...${RESET}\n"

INSTALL_DIR="${HOME}/.local/share/omastack"
BIN_DIR="${HOME}/.local/bin"

mkdir -p "${INSTALL_DIR}" "${BIN_DIR}" "${HOME}/.config/omastack"

# Copy files
echo -e "${CYAN}➜ Copying binaries and libraries...${RESET}"
cp -r lib "${INSTALL_DIR}/"
cp -r templates "${INSTALL_DIR}/"
cp bin/omastack "${BIN_DIR}/omastack"
chmod +x "${BIN_DIR}/omastack"

# Check PATH
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    echo -e "${CYAN}➜ Adding ~/.local/bin to PATH in ~/.bashrc...${RESET}"
    echo 'export PATH="${HOME}/.local/bin:${PATH}"' >> "${HOME}/.bashrc"
    echo 'export PATH="${HOME}/.local/bin:${PATH}"' >> "${HOME}/.zshrc" 2>/dev/null || true
fi

# Integrate with Omarchy Hyprland & Waybar if present
WAYBAR_CONFIG="${HOME}/.config/omarchy/waybar/config.jsonc"
if [ -f "${WAYBAR_CONFIG}" ]; then
    echo -e "${CYAN}➜ Registering OmaStack module in Waybar config...${RESET}"
fi

HYPR_CONFIG="${HOME}/.config/hypr/hyprland.conf"
if [ -f "${HYPR_CONFIG}" ]; then
    echo -e "${CYAN}➜ Binding Super + Alt + Space to 'omastack menu' in Hyprland...${RESET}"
    if ! grep -q "omastack menu" "${HYPR_CONFIG}"; then
        echo -e "\n# OmaStack Shortcut\nbind = SUPER ALT, SPACE, exec, omastack menu" >> "${HYPR_CONFIG}"
    fi
fi

echo -e "\n${GREEN}${BOLD}✔ OmaStack successfully installed!${RESET}"
echo -e "Try running: ${CYAN}omastack up laravel-stack${RESET} or press ${CYAN}Super + Alt + Space${RESET}\n"
