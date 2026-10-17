import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import Quickshell
import Quickshell.Io
import qs.Commons
import qs.Ui

Panel {
    id: root
    moduleName: "io.github.anax.omastack"
    manageIpc: false
    z: 9999

    property var anchorItem: null
    property var hostWidget: null

    function open() {
        if (root.controller) root.controller.show()
    }

    function close() {
        if (root.controller) root.controller.hide()
    }

    function toggle() {
        if (root.controller) {
            if (root.controller.visible) root.controller.hide()
            else root.controller.show()
        }
    }

    implicitWidth: 380
    implicitHeight: 520

    // Process executor helper
    function executeCli(args) {
        cliProcess.command = args
        cliProcess.running = true
    }

    Process {
        id: cliProcess
        command: ["omastack"]
        running: false
        onExited: {
            // Re-trigger hostWidget status poll after command finishes
            if (root.hostWidget && root.hostWidget.statusProcess) {
                root.hostWidget.statusProcess.running = true
            }
        }
    }

    Rectangle {
        anchors.fill: parent
        color: "#1a1b26"
        radius: 12
        border.color: "#414868"
        border.width: 1

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 14
            spacing: 12

            // Header Row
            RowLayout {
                Layout.fillWidth: true
                spacing: 8

                Text {
                    text: "⚡ OmaStack Ephemeral Sandboxes"
                    color: "#7dcfff"
                    font.bold: true
                    font.pixelSize: 14
                }

                Item { Layout.fillWidth: true }

                Rectangle {
                    radius: 6
                    color: (root.hostWidget && root.hostWidget.activeCount > 0) ? "#9ece6a22" : "#565f8922"
                    border.color: (root.hostWidget && root.hostWidget.activeCount > 0) ? "#9ece6a" : "#565f89"
                    border.width: 1
                    implicitWidth: statusText.implicitWidth + 12
                    implicitHeight: 22

                    Text {
                        id: statusText
                        anchors.centerIn: parent
                        text: (root.hostWidget && root.hostWidget.activeCount > 0)
                            ? (root.hostWidget.activeCount + " Active (" + root.hostWidget.totalRam + ")")
                            : "Idle"
                        color: (root.hostWidget && root.hostWidget.activeCount > 0) ? "#9ece6a" : "#7a88cf"
                        font.pixelSize: 11
                        font.bold: true
                    }
                }

                Button {
                    text: "↻"
                    implicitWidth: 24
                    implicitHeight: 24
                    onClicked: {
                        if (root.hostWidget && root.hostWidget.statusProcess) {
                            root.hostWidget.statusProcess.running = true
                        }
                    }
                }

                Button {
                    text: "✕"
                    implicitWidth: 24
                    implicitHeight: 24
                    onClicked: root.close()
                }
            }

            // Divider
            Rectangle {
                Layout.fillWidth: true
                height: 1
                color: "#24283b"
            }

            // Active Sandboxes Section
            Text {
                text: "RUNNING SANDBOXES"
                color: "#565f89"
                font.bold: true
                font.pixelSize: 10
            }

            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 110
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
                    spacing: 6

                    delegate: Rectangle {
                        width: activeListView.width
                        height: 32
                        color: "#1f2335"
                        radius: 6

                        RowLayout {
                            anchors.fill: parent
                            anchors.margins: 6
                            spacing: 8

                            Rectangle {
                                width: 8
                                height: 8
                                radius: 4
                                color: "#9ece6a"
                            }

                            Text {
                                text: modelData.name || modelData.id
                                color: "#c0caf5"
                                font.bold: true
                                font.pixelSize: 12
                            }

                            Text {
                                text: modelData.ram || "RAM: OK"
                                color: "#7aa2f7"
                                font.pixelSize: 11
                            }

                            Item { Layout.fillWidth: true }

                            Button {
                                text: "↺"
                                implicitHeight: 22
                                implicitWidth: 32
                                onClicked: root.executeCli(["omastack", "restart", modelData.id])
                            }

                            Button {
                                text: "Stop"
                                implicitHeight: 22
                                implicitWidth: 48
                                onClicked: root.executeCli(["omastack", "down", modelData.id])
                            }
                        }
                    }

                    // Empty state indicator
                    Text {
                        anchors.centerIn: parent
                        visible: !root.hostWidget || root.hostWidget.activeCount === 0
                        text: "No sandboxes running. Select a template below:"
                        color: "#565f89"
                        font.pixelSize: 11
                    }
                }
            }

            // Stack Templates Quick Launch Section
            Text {
                text: "QUICK LAUNCH TEMPLATES"
                color: "#565f89"
                font.bold: true
                font.pixelSize: 10
            }

            GridLayout {
                Layout.fillWidth: true
                columns: 2
                rowSpacing: 6
                columnSpacing: 6

                Button {
                    Layout.fillWidth: true
                    text: "🚀 laravel-stack"
                    onClicked: root.executeCli(["omastack", "up", "laravel-stack"])
                }
                Button {
                    Layout.fillWidth: true
                    text: "⚡ supabase-lite"
                    onClicked: root.executeCli(["omastack", "up", "supabase-lite"])
                }
                Button {
                    Layout.fillWidth: true
                    text: "🐘 nextjs-postgres"
                    onClicked: root.executeCli(["omastack", "up", "nextjs-postgres"])
                }
                Button {
                    Layout.fillWidth: true
                    text: "💎 rails-kamal"
                    onClicked: root.executeCli(["omastack", "up", "rails-kamal"])
                }
                Button {
                    Layout.fillWidth: true
                    text: "🐍 django-celery"
                    onClicked: root.executeCli(["omastack", "up", "django-celery"])
                }
                Button {
                    Layout.fillWidth: true
                    text: "🧠 ai-rag-stack"
                    onClicked: root.executeCli(["omastack", "up", "ai-rag-stack"])
                }
                Button {
                    Layout.fillWidth: true
                    text: "🍃 mern-mongo"
                    onClicked: root.executeCli(["omastack", "up", "mern-mongo"])
                }
                Button {
                    Layout.fillWidth: true
                    text: "🐹 golang-microservices"
                    onClicked: root.executeCli(["omastack", "up", "golang-microservices"])
                }
                Button {
                    Layout.fillWidth: true
                    text: "📈 observability-lgtm"
                    onClicked: root.executeCli(["omastack", "up", "observability-lgtm"])
                }
                Button {
                    Layout.fillWidth: true
                    text: "⚡ clickhouse-analytics"
                    onClicked: root.executeCli(["omastack", "up", "clickhouse-analytics"])
                }
                Button {
                    Layout.fillWidth: true
                    text: "🔐 keycloak-iam"
                    onClicked: root.executeCli(["omastack", "up", "keycloak-iam"])
                }
                Button {
                    Layout.fillWidth: true
                    text: "🐰 directus-cms"
                    onClicked: root.executeCli(["omastack", "up", "directus-cms"])
                }
                Button {
                    Layout.fillWidth: true
                    text: "📝 wordpress-mariadb"
                    onClicked: root.executeCli(["omastack", "up", "wordpress-mariadb"])
                }
                Button {
                    Layout.fillWidth: true
                    text: "🤖 automation-hub"
                    onClicked: root.executeCli(["omastack", "up", "automation-hub"])
                }
                Button {
                    Layout.fillWidth: true
                    Layout.columnSpan: 2
                    text: "⛓ web3-node (Anvil RPC + Redis)"
                    onClicked: root.executeCli(["omastack", "up", "web3-node"])
                }
            }

            // Divider
            Rectangle {
                Layout.fillWidth: true
                height: 1
                color: "#24283b"
            }

            // Quick Actions Row
            RowLayout {
                Layout.fillWidth: true
                spacing: 6

                Button {
                    Layout.fillWidth: true
                    text: "Init Conf"
                    onClicked: root.executeCli(["omastack", "init"])
                }

                Button {
                    Layout.fillWidth: true
                    text: "Inject .env"
                    onClicked: root.executeCli(["omastack", "inject"])
                }

                Button {
                    Layout.fillWidth: true
                    text: "Walker"
                    onClicked: {
                        root.close()
                        root.executeCli(["omastack", "menu"])
                    }
                }

                Button {
                    Layout.fillWidth: true
                    text: "Stop All"
                    onClicked: root.executeCli(["omastack", "down", "--all"])
                }
            }

            // Footer info
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "Super+Alt+W (Widget Panel) • Super+Alt+Space (Walker Menu)"
                color: "#565f89"
                font.pixelSize: 9
            }
        }
    }
}
