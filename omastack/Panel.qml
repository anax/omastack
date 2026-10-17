import QtQuick
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui

Panel {
    id: root
    moduleName: "io.github.anax.omastack"
    manageIpc: false
    property var anchorItem: null
    property var hostWidget: null

    readonly property string pluginDir: {
        var u = Qt.resolvedUrl("Panel.qml").toString()
        if (u.indexOf("file://") === 0) u = u.substring(7)
        var slash = u.lastIndexOf('/')
        if (slash !== -1) {
            u = u.substring(0, slash)
        }
        return u
    }

    property string statusNotice: ""

    Timer {
        id: statusNoticeTimer
        interval: 4000
        repeat: false
        onTriggered: root.statusNotice = ""
    }

    Timer {
        id: refreshDelayTimer
        interval: 1500
        repeat: false
        onTriggered: {
            if (root.hostWidget && typeof root.hostWidget.refreshStatus === "function") {
                root.hostWidget.refreshStatus()
            }
        }
    }

    Timer {
        id: refreshSecondTimer
        interval: 3500
        repeat: false
        onTriggered: {
            if (root.hostWidget && typeof root.hostWidget.refreshStatus === "function") {
                root.hostWidget.refreshStatus()
            }
        }
    }

    function open() {
        root.controller.show()
    }

    function close() {
        root.controller.hide()
    }

    function toggle() {
        if (root.opened)
            root.close()
        else
            root.open()
    }

    function switchPanel(direction) {
        if (root.bar && typeof root.bar.switchPanelFrom === "function")
            return root.bar.switchPanelFrom(root.hostWidget || root, direction)
        return false
    }

    function buildShellCommand(subArgs) {
        var pdir = root.pluginDir
        var argsEscaped = subArgs.map(function(a) {
            return "'" + String(a).replace(/'/g, "'\\''") + "'"
        }).join(" ")

        return 'export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"; '
            + 'PDIR="' + pdir + '"; '
            + 'BIN=""; '
            + 'if command -v omastack >/dev/null 2>&1; then BIN="$(command -v omastack)"; '
            + 'elif [ -f "$HOME/.local/bin/omastack" ]; then BIN="$HOME/.local/bin/omastack"; '
            + 'elif [ -f "$PDIR/runner.sh" ]; then BIN="$PDIR/runner.sh"; '
            + 'elif [ -f "$PDIR/omastack/runner.sh" ]; then BIN="$PDIR/omastack/runner.sh"; '
            + 'elif [ -f "$PDIR/bin/omastack" ]; then BIN="$PDIR/bin/omastack"; '
            + 'elif [ -f "$PDIR/omastack/bin/omastack" ]; then BIN="$PDIR/omastack/bin/omastack"; '
            + 'elif [ -f "/usr/share/omastack/bin/omastack" ]; then BIN="/usr/share/omastack/bin/omastack"; '
            + 'elif [ -f "/usr/local/share/omastack/bin/omastack" ]; then BIN="/usr/local/share/omastack/bin/omastack"; '
            + 'fi; '
            + 'if [ -n "$BIN" ]; then exec bash "$BIN" ' + argsEscaped + '; '
            + 'else if command -v notify-send >/dev/null 2>&1; then notify-send -u critical -a "OmaStack" "Binary Not Found" "Cannot find omastack executable."; fi; exit 127; fi'
    }

    function showNotification(title, msg) {
        try {
            if (typeof Util !== "undefined" && typeof Util.execDetached === "function") {
                Util.execDetached("notify-send -a 'OmaStack' -u normal '" + title + "' '" + msg + "'")
            } else if (typeof Quickshell !== "undefined" && typeof Quickshell.execDetached === "function") {
                Quickshell.execDetached(["notify-send", "-a", "OmaStack", "-u", "normal", title, msg])
            }
        } catch(e) {}
    }

    // Process executor helper
    function executeCli(args) {
        var subArgs = (typeof args === "string") ? [args] : args.slice()
        if (subArgs.length > 0 && subArgs[0] === "omastack") {
            subArgs.shift()
        }

        var subCmd = subArgs[0] || ""
        var target = subArgs[1] || ""

        if (subCmd === "up") {
            root.statusNotice = "Starting " + target + "..."
            root.showNotification("OmaStack", "Starting " + target + " sandbox...")
        } else if (subCmd === "down" && target === "--all") {
            root.statusNotice = "Stopping all..."
            root.showNotification("OmaStack", "Stopping all sandboxes...")
        } else if (subCmd === "down") {
            root.statusNotice = "Stopping " + target + "..."
            root.showNotification("OmaStack", "Stopping " + target + " sandbox...")
        } else if (subCmd === "restart") {
            root.statusNotice = "Restarting " + target + "..."
            root.showNotification("OmaStack", "Restarting " + target + " sandbox...")
        } else if (subCmd === "init") {
            root.statusNotice = "Initializing..."
            root.showNotification("OmaStack", "Inspecting project and creating config...")
        } else if (subCmd === "inject") {
            root.statusNotice = "Injecting .env..."
            root.showNotification("OmaStack", "Injecting connection strings into .env...")
        } else if (subCmd === "menu") {
            root.statusNotice = "Opening Walker..."
        }

        statusNoticeTimer.restart()
        refreshDelayTimer.restart()
        refreshSecondTimer.restart()

        var shellCmd = root.buildShellCommand(subArgs)

        // Dispatch via Omarchy native Util.execDetached, bar.run, Quickshell.execDetached, or cliProcess
        var launched = false
        try {
            if (typeof Util !== "undefined" && typeof Util.execDetached === "function") {
                Util.execDetached(shellCmd)
                launched = true
            }
        } catch(e) {}

        if (!launched && root.bar && typeof root.bar.run === "function") {
            try {
                root.bar.run(shellCmd)
                launched = true
            } catch(e) {}
        }

        if (!launched && typeof Quickshell !== "undefined" && typeof Quickshell.execDetached === "function") {
            try {
                Quickshell.execDetached(["sh", "-c", shellCmd])
                launched = true
            } catch(e) {}
        }

        if (!launched) {
            cliProcess.running = false
            cliProcess.command = ["sh", "-c", shellCmd]
            cliProcess.running = true
        }
    }

    Process {
        id: cliProcess
        command: ["sh", "-c", "true"]
        running: false
        onExited: {
            if (root.hostWidget && typeof root.hostWidget.refreshStatus === "function") {
                root.hostWidget.refreshStatus()
            }
        }
    }

    property var templatesList: [
        { id: "laravel-stack", label: "🚀 laravel-stack" },
        { id: "supabase-lite", label: "⚡ supabase-lite" },
        { id: "nextjs-postgres", label: "🐘 nextjs-postgres" },
        { id: "rails-kamal", label: "💎 rails-kamal" },
        { id: "django-celery", label: "🐍 django-celery" },
        { id: "ai-rag-stack", label: "🧠 ai-rag-stack" },
        { id: "mern-mongo", label: "🍃 mern-mongo" },
        { id: "golang-microservices", label: "🐹 golang-micro" },
        { id: "observability-lgtm", label: "📈 observability" },
        { id: "clickhouse-analytics", label: "⚡ clickhouse" },
        { id: "keycloak-iam", label: "🔐 keycloak-iam" },
        { id: "directus-cms", label: "🐰 directus-cms" },
        { id: "wordpress-mariadb", label: "📝 wordpress-db" },
        { id: "automation-hub", label: "🤖 automation-hub" },
        { id: "web3-node", label: "⛓ web3-node" }
    ]

    KeyboardPanel {
        id: panel
        anchorItem: root.anchorItem
        owner: root.hostWidget || root
        bar: root.bar
        open: root.opened
        focusTarget: keyCatcher
        contentWidth: panel.fittedContentWidth(Style.space(380))
        contentHeight: panel.fittedContentHeight(content.implicitHeight)

        PanelKeyCatcher {
            id: keyCatcher
            anchors.fill: parent
            onCloseRequested: root.close()
            onTabRequested: function(direction) {
                root.switchPanel(direction)
            }

            Column {
                id: content
                width: parent.width
                spacing: Style.space(10)

                // 1. Header Row with Official OmaStack Logo
                Item {
                    width: parent.width
                    height: 28

                    Row {
                        anchors.left: parent.left
                        anchors.verticalCenter: parent.verticalCenter
                        spacing: 8

                        Image {
                            width: 20
                            height: 20
                            anchors.verticalCenter: parent.verticalCenter
                            source: Qt.resolvedUrl("omastack-icon.svg")
                            fillMode: Image.PreserveAspectFit
                            sourceSize.width: 40
                            sourceSize.height: 40
                        }

                        Text {
                            anchors.verticalCenter: parent.verticalCenter
                            text: "OmaStack Sandboxes"
                            color: "#7dcfff"
                            font.bold: true
                            font.pixelSize: 13
                        }
                    }

                    Row {
                        anchors.right: parent.right
                        anchors.verticalCenter: parent.verticalCenter
                        spacing: 6

                        Rectangle {
                            radius: 6
                            color: root.statusNotice !== ""
                                ? "#7dcfff22"
                                : ((root.hostWidget && root.hostWidget.activeCount > 0) ? "#9ece6a22" : "#565f8922")
                            border.color: root.statusNotice !== ""
                                ? "#7dcfff"
                                : ((root.hostWidget && root.hostWidget.activeCount > 0) ? "#9ece6a" : "#565f89")
                            border.width: 1
                            width: statusText.implicitWidth + 14
                            height: 22

                            Text {
                                id: statusText
                                anchors.centerIn: parent
                                text: root.statusNotice !== ""
                                    ? root.statusNotice
                                    : ((root.hostWidget && root.hostWidget.activeCount > 0)
                                        ? (root.hostWidget.activeCount + " Active (" + root.hostWidget.totalRam + ")")
                                        : "Idle")
                                color: root.statusNotice !== ""
                                    ? "#7dcfff"
                                    : ((root.hostWidget && root.hostWidget.activeCount > 0) ? "#9ece6a" : "#7a88cf")
                                font.pixelSize: 10
                                font.bold: true
                            }
                        }

                        // Refresh Button
                        Rectangle {
                            width: 22
                            height: 22
                            radius: 5
                            color: refreshMouse.containsMouse ? "#292e42" : "#1f2335"
                            border.color: "#414868"
                            border.width: 1

                            Text {
                                anchors.centerIn: parent
                                text: "↻"
                                color: "#c0caf5"
                                font.pixelSize: 12
                            }

                            MouseArea {
                                id: refreshMouse
                                anchors.fill: parent
                                hoverEnabled: true
                                cursorShape: Qt.PointingHandCursor
                                onClicked: {
                                    if (root.hostWidget && typeof root.hostWidget.refreshStatus === "function") {
                                        root.hostWidget.refreshStatus()
                                    }
                                }
                            }
                        }

                        // Close Button
                        Rectangle {
                            width: 22
                            height: 22
                            radius: 5
                            color: closeMouse.containsMouse ? "#f7768e33" : "#1f2335"
                            border.color: closeMouse.containsMouse ? "#f7768e" : "#414868"
                            border.width: 1

                            Text {
                                anchors.centerIn: parent
                                text: "✕"
                                color: closeMouse.containsMouse ? "#f7768e" : "#c0caf5"
                                font.pixelSize: 11
                            }

                            MouseArea {
                                id: closeMouse
                                anchors.fill: parent
                                hoverEnabled: true
                                cursorShape: Qt.PointingHandCursor
                                onClicked: root.close()
                            }
                        }
                    }
                }

                // Divider
                Rectangle {
                    width: parent.width
                    height: 1
                    color: "#24283b"
                }

                // 2. Running Sandboxes Section
                Text {
                    text: "RUNNING SANDBOXES"
                    color: "#565f89"
                    font.bold: true
                    font.pixelSize: 10
                }

                Rectangle {
                    width: parent.width
                    height: 92
                    color: "#16161e"
                    radius: 8
                    border.color: "#24283b"
                    border.width: 1

                    ListView {
                        id: activeListView
                        anchors.fill: parent
                        anchors.margins: 6
                        clip: true
                        model: (root.hostWidget && root.hostWidget.activeStacks) ? root.hostWidget.activeStacks : []
                        spacing: 5

                        delegate: Rectangle {
                            width: activeListView.width
                            height: 28
                            color: "#1f2335"
                            radius: 6

                            Item {
                                anchors.fill: parent
                                anchors.leftMargin: 8
                                anchors.rightMargin: 8

                                Row {
                                    anchors.left: parent.left
                                    anchors.verticalCenter: parent.verticalCenter
                                    spacing: 8

                                    Rectangle {
                                        width: 7
                                        height: 7
                                        radius: 3.5
                                        color: "#9ece6a"
                                        anchors.verticalCenter: parent.verticalCenter
                                    }

                                    Text {
                                        text: modelData.name || modelData.id
                                        color: "#c0caf5"
                                        font.bold: true
                                        font.pixelSize: 11
                                        anchors.verticalCenter: parent.verticalCenter
                                    }

                                    Text {
                                        text: modelData.ram || "RAM: OK"
                                        color: "#7aa2f7"
                                        font.pixelSize: 10
                                        anchors.verticalCenter: parent.verticalCenter
                                    }
                                }

                                Row {
                                    anchors.right: parent.right
                                    anchors.verticalCenter: parent.verticalCenter
                                    spacing: 4

                                    Rectangle {
                                        width: 24
                                        height: 20
                                        radius: 4
                                        color: restartItemMouse.containsMouse ? "#292e42" : "#16161e"
                                        border.color: "#414868"
                                        border.width: 1

                                        Text {
                                            anchors.centerIn: parent
                                            text: "↺"
                                            color: "#7dcfff"
                                            font.pixelSize: 11
                                        }

                                        MouseArea {
                                            id: restartItemMouse
                                            anchors.fill: parent
                                            hoverEnabled: true
                                            cursorShape: Qt.PointingHandCursor
                                            onClicked: root.executeCli(["omastack", "restart", modelData.id])
                                        }
                                    }

                                    Rectangle {
                                        width: 42
                                        height: 20
                                        radius: 4
                                        color: stopItemMouse.containsMouse ? "#f7768e33" : "#16161e"
                                        border.color: "#f7768e66"
                                        border.width: 1

                                        Text {
                                            anchors.centerIn: parent
                                            text: "Stop"
                                            color: "#f7768e"
                                            font.pixelSize: 10
                                            font.bold: true
                                        }

                                        MouseArea {
                                            id: stopItemMouse
                                            anchors.fill: parent
                                            hoverEnabled: true
                                            cursorShape: Qt.PointingHandCursor
                                            onClicked: root.executeCli(["omastack", "down", modelData.id])
                                        }
                                    }
                                }
                            }
                        }

                        Text {
                            anchors.centerIn: parent
                            visible: !root.hostWidget || root.hostWidget.activeCount === 0
                            text: "No sandboxes running. Click a template below:"
                            color: "#565f89"
                            font.pixelSize: 11
                        }
                    }
                }

                // 3. Quick Launch Templates Section (15 Curated Sandboxes)
                Text {
                    text: "QUICK LAUNCH TEMPLATES (15)"
                    color: "#565f89"
                    font.bold: true
                    font.pixelSize: 10
                }

                Grid {
                    id: templatesGrid
                    width: parent.width
                    columns: 2
                    rowSpacing: 5
                    columnSpacing: 6

                    Repeater {
                        model: root.templatesList
                        delegate: Rectangle {
                            width: (templatesGrid.width - 6) / 2
                            height: 26
                            radius: 6
                            color: tmplMouse.containsMouse ? "#292e42" : "#1f2335"
                            border.color: tmplMouse.containsMouse ? "#7dcfff" : "#2f3549"
                            border.width: 1

                            Text {
                                anchors.left: parent.left
                                anchors.leftMargin: 8
                                anchors.verticalCenter: parent.verticalCenter
                                text: modelData.label
                                color: tmplMouse.containsMouse ? "#7dcfff" : "#c0caf5"
                                font.pixelSize: 11
                                font.bold: tmplMouse.containsMouse
                                elide: Text.ElideRight
                                width: parent.width - 14
                            }

                            MouseArea {
                                id: tmplMouse
                                anchors.fill: parent
                                hoverEnabled: true
                                cursorShape: Qt.PointingHandCursor
                                onClicked: root.executeCli(["omastack", "up", modelData.id])
                            }
                        }
                    }
                }

                // Divider
                Rectangle {
                    width: parent.width
                    height: 1
                    color: "#24283b"
                }

                // 4. Quick Actions Row
                Row {
                    id: actionsRow
                    width: parent.width
                    spacing: 6

                    Repeater {
                        model: [
                            { label: "Init Conf", cmd: ["omastack", "init"], closeFirst: false, danger: false },
                            { label: "Inject .env", cmd: ["omastack", "inject"], closeFirst: false, danger: false },
                            { label: "Walker", cmd: ["omastack", "menu"], closeFirst: true, danger: false },
                            { label: "Stop All", cmd: ["omastack", "down", "--all"], closeFirst: false, danger: true }
                        ]

                        delegate: Rectangle {
                            width: (actionsRow.width - 18) / 4
                            height: 26
                            radius: 6
                            color: actMouse.containsMouse
                                ? (modelData.danger ? "#f7768e33" : "#292e42")
                                : "#1f2335"
                            border.color: modelData.danger ? "#f7768e66" : "#414868"
                            border.width: 1

                            Text {
                                anchors.centerIn: parent
                                text: modelData.label
                                color: modelData.danger ? "#f7768e" : "#c0caf5"
                                font.pixelSize: 10
                                font.bold: true
                            }

                            MouseArea {
                                id: actMouse
                                anchors.fill: parent
                                hoverEnabled: true
                                cursorShape: Qt.PointingHandCursor
                                onClicked: {
                                    if (modelData.closeFirst) {
                                        root.close()
                                    }
                                    root.executeCli(modelData.cmd)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
