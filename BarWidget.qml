import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
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

    // Process to summon interactive Walker/Rofi menu on right-click
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

    // Bar button representation
    BarIconButton {
        id: button
        anchors.fill: parent
        bar: root.bar
        text: root.activeCount > 0 ? ("⚡ " + root.activeCount + " (" + root.totalRam + ")") : "⚡ 0"
        tooltipText: root.activeCount > 0
            ? ("OmaStack: " + root.activeCount + " active sandboxes [" + root.totalRam + " RAM]\n• Left-click: Toggle details panel\n• Right-click: Open Walker menu")
            : "OmaStack: No active sandboxes\n• Left-click: Launch sandboxes\n• Right-click: Open Walker menu"

        onPressed: function(buttonCode) {
            if (buttonCode === Qt.LeftButton) {
                root.toggle()
            } else if (buttonCode === Qt.RightButton) {
                menuProcess.running = true
            }
        }
    }
}
