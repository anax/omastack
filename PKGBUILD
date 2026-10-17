# Maintainer: Anas Mohamed <nxmohamed@gmail.com>
# OmaStack Arch Linux Package Definition for Omarchy Linux
# SPDX-License-Identifier: MIT

pkgname=omastack
pkgver=1.0.0
pkgrel=1
pkgdesc="Native, zero-bloat ephemeral full-stack sandbox launcher and Docker manager for Omarchy Linux"
arch=('any')
url="https://github.com/anax/omastack"
license=('MIT')
depends=(
    'bash'
    'docker'
    'docker-compose'
    'iproute2'
    'wl-clipboard'
)
optdepends=(
    'caddy: Local *.oma.local reverse proxy support'
    'mkcert: Automated trusted local SSL certificate generation'
    'rofi: Interactive application launcher menu'
    'walker: Fast application launcher runner'
    'waybar: Status bar module integration'
    'libnotify: Desktop notification alerts'
)
install=omastack.install
source=()
sha256sums=()

check() {
    local src_dir="${srcdir}"
    if [ ! -f "${src_dir}/install.sh" ] && [ -f "${startdir}/install.sh" ]; then
        src_dir="${startdir}"
    fi
    bash "${src_dir}/install.sh" --test
}

package() {
    local src_dir="${srcdir}"
    if [ ! -d "${src_dir}/omastack/lib" ] && [ -d "${startdir}/omastack/lib" ]; then
        src_dir="${startdir}"
    fi

    # Install using OmaStack universal installer with DESTDIR and /usr prefix
    bash "${src_dir}/install.sh" --destdir "${pkgdir}" --prefix "/usr"

    # Install license and documentation
    if [ -f "${src_dir}/LICENSE" ]; then
        install -Dm644 "${src_dir}/LICENSE" "${pkgdir}/usr/share/licenses/${pkgname}/LICENSE"
    fi
    if [ -f "${src_dir}/README.md" ]; then
        install -Dm644 "${src_dir}/README.md" "${pkgdir}/usr/share/doc/${pkgname}/README.md"
    fi
}
