import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui

BarWidget {
    id: root
    moduleName: "io.github.anax.omastack"

    // Panel lifecycle tracking expected by Omarchy Quattro shell
    readonly property bool opened: panelLoader.item ? panelLoader.item.opened === true : false
    readonly property bool popoutSwitchClosing: panelLoader.item ? panelLoader.item.popoutSwitchClosing === true : false

    function open() {
        if (panelLoader.item) panelLoader.item.open()
    }

    function close() {
        if (panelLoader.item) panelLoader.item.close()
    }

    function toggle() {
        if (panelLoader.item) panelLoader.item.toggle()
    }

    function closeForPopoutSwitch() {
        if (panelLoader.item) panelLoader.item.closeForPopoutSwitch()
    }

    function injectPanel() {
        if (!panelLoader.item) return
        panelLoader.item.bar = root.bar
        panelLoader.item.anchorItem = button
        panelLoader.item.hostWidget = root
    }

    implicitWidth: button.implicitWidth
    implicitHeight: button.implicitHeight
    onBarChanged: injectPanel()

    // Real-time state properties populated from 'omastack status --widget'
    property int activeCount: 0
    property string totalRam: "0MB"
    property string statusClass: "idle"
    property var activeStacks: []

    // Background timer to refresh OmaStack status
    Timer {
        id: pollTimer
        interval: 3000
        repeat: true
        running: true
        triggeredOnStart: true
        onTriggered: {
            if (!statusProcess.running) {
                statusProcess.running = true
            }
        }
    }

    // CLI background process to fetch real-time JSON
    Process {
        id: statusProcess
        command: ["omastack", "status", "--widget"]
        running: false
        stdout: StdioCollector {
            onStreamFinished: {
                try {
                    var data = JSON.parse(this.text.trim())
                    root.activeCount = data.active_count || 0
                    root.totalRam = data.total_ram || "0MB"
                    root.statusClass = data.status_class || "idle"
                    root.activeStacks = data.active_stacks || []
                } catch(e) {
                    // Fallback on parse issue
                }
            }
        }
    }

    // Process to summon interactive Walker/Rofi menu on middle-click
    Process {
        id: menuProcess
        command: ["omastack", "menu"]
        running: false
    }

    // Embedded loader for details panel
    Loader {
        id: panelLoader
        active: true
        source: Qt.resolvedUrl("Panel.qml")
        visible: false
        onLoaded: {
            root.injectPanel()
            Qt.callLater(root.injectPanel)
        }
    }

    // Official OmaStack 3-Tier Isometric Logo Component for BarIconButton
    Component {
        id: omastackLogoComponent
        Item {
            implicitWidth: 20
            implicitHeight: 20

            Image {
                id: svgLogo
                anchors.fill: parent
                source: Qt.resolvedUrl("omastack-icon.svg")
                fillMode: Image.PreserveAspectFit
                sourceSize.width: 48
                sourceSize.height: 48
                smooth: true
            }

            // Native QML Canvas vector fallback (renders official 3-tier OmaStack logo even without external SVG)
            Canvas {
                anchors.fill: parent
                visible: svgLogo.status !== Image.Ready
                antialiasing: true
                onPaint: {
                    var ctx = getContext("2d")
                    ctx.reset()
                    var s = Math.min(width, height) / 440.0
                    ctx.save()
                    ctx.scale(s, s)
                    ctx.translate(-180, -90)

                    // Tier 3: Bottom Foundation Slab
                    ctx.fillStyle = "#465a38"
                    ctx.beginPath(); ctx.moveTo(220, 440); ctx.lineTo(400, 544); ctx.lineTo(400, 600); ctx.lineTo(220, 496); ctx.closePath(); ctx.fill()
                    ctx.fillStyle = "#2d3a24"
                    ctx.beginPath(); ctx.moveTo(400, 544); ctx.lineTo(580, 440); ctx.lineTo(580, 496); ctx.lineTo(400, 600); ctx.closePath(); ctx.fill()

                    // Cyan Inter-Tier Core
                    ctx.fillStyle = "#00f0ff"
                    ctx.beginPath(); ctx.moveTo(230, 422); ctx.lineTo(400, 520); ctx.lineTo(570, 422); ctx.lineTo(400, 324); ctx.closePath(); ctx.fill()

                    // Tier 2: Middle Runtime Slab
                    ctx.fillStyle = "#bbdd97"
                    ctx.beginPath(); ctx.moveTo(400, 246); ctx.lineTo(580, 350); ctx.lineTo(400, 454); ctx.lineTo(220, 350); ctx.closePath(); ctx.fill()
                    ctx.fillStyle = "#8cb363"
                    ctx.beginPath(); ctx.moveTo(220, 350); ctx.lineTo(400, 454); ctx.lineTo(400, 498); ctx.lineTo(220, 394); ctx.closePath(); ctx.fill()
                    ctx.fillStyle = "#678549"
                    ctx.beginPath(); ctx.moveTo(400, 454); ctx.lineTo(580, 350); ctx.lineTo(580, 394); ctx.lineTo(400, 498); ctx.closePath(); ctx.fill()

                    // Tier 1: Top "O" Slab
                    ctx.fillStyle = "#bbdd97"
                    ctx.beginPath(); ctx.moveTo(220, 260); ctx.lineTo(400, 364); ctx.lineTo(400, 314); ctx.lineTo(220, 210); ctx.closePath(); ctx.fill()
                    ctx.fillStyle = "#9ece6a"
                    ctx.beginPath(); ctx.moveTo(400, 364); ctx.lineTo(580, 260); ctx.lineTo(580, 210); ctx.lineTo(400, 314); ctx.closePath(); ctx.fill()
                    ctx.fillStyle = "#daecc6"
                    ctx.beginPath(); ctx.moveTo(400, 106); ctx.lineTo(580, 210); ctx.lineTo(400, 314); ctx.lineTo(220, 210); ctx.closePath(); ctx.fill()

                    // Inner Aperture & Cyan Kernel
                    ctx.fillStyle = "#1a1b26"
                    ctx.beginPath(); ctx.moveTo(400, 158); ctx.lineTo(490, 210); ctx.lineTo(400, 262); ctx.lineTo(310, 210); ctx.closePath(); ctx.fill()
                    ctx.fillStyle = "#00f0ff"
                    ctx.beginPath(); ctx.moveTo(400, 200); ctx.lineTo(455, 230); ctx.lineTo(400, 262); ctx.lineTo(345, 230); ctx.closePath(); ctx.fill()

                    ctx.restore()
                }
            }

            // Active sandbox indicator badge when sandboxes are running
            Rectangle {
                visible: root.activeCount > 0
                width: 7
                height: 7
                radius: 3.5
                color: "#00f0ff"
                border.color: "#1a1b26"
                border.width: 1
                anchors.right: parent.right
                anchors.bottom: parent.bottom
            }
        }
    }

    // Bar button representation with official OmaStack logo
    BarIconButton {
        id: button
        anchors.fill: parent
        bar: root.bar
        iconComponent: omastackLogoComponent
        text: ""
        tooltipText: root.activeCount > 0
            ? ("OmaStack: " + root.activeCount + " active sandboxes [" + root.totalRam + " RAM]\n• Click: Open OmaStack Panel Menu")
            : "OmaStack Sandboxes\n• Click: Open OmaStack Panel Menu"

        onPressed: function(buttonCode) {
            if (buttonCode === Qt.LeftButton || buttonCode === Qt.RightButton) {
                root.toggle()
            } else if (buttonCode === Qt.MiddleButton) {
                menuProcess.running = true
            }
        }
    }
}
