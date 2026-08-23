import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        let bridgeVC = CAPBridgeViewController()
        window?.rootViewController = bridgeVC
        window?.makeKeyAndVisible()

        // Serve the game files from an editable copy in Documents (visible in
        // the Files app) instead of the read-only copy baked into the app.
        EditableAssets.seedIfNeeded()
        bridgeVC.setServerBasePath(path: EditableAssets.documentsWWWURL.path)

        if let window = window {
            RestoreOverlay.shared.install(on: window, bridgeVC: bridgeVC)
        }

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

// MARK: - Editable assets

/// Manages an editable copy of the game files in the app's Documents
/// directory. With UIFileSharingEnabled set in Info.plist, this folder shows
/// up under Files → On My iPhone → Pocket Arcade, so the HTML/JS/CSS can be
/// viewed and edited on-device with any text editor app that supports
/// "Open in Place".
enum EditableAssets {

    static var documentsWWWURL: URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return docs.appendingPathComponent("www", isDirectory: true)
    }

    /// Copies the bundled (read-only) game files into Documents/www the
    /// first time the app runs. Later launches leave any edits in place.
    static func seedIfNeeded() {
        guard !FileManager.default.fileExists(atPath: documentsWWWURL.path) else { return }
        restoreFromBundle()
    }

    /// Overwrites Documents/www with a fresh copy of the original bundled
    /// files. Used on first launch and by the in-app Restore button. This
    /// only touches the game code — saved high scores live in the web
    /// view's local storage and are unaffected.
    @discardableResult
    static func restoreFromBundle() -> Bool {
        let fm = FileManager.default
        guard let bundlePublic = Bundle.main.url(forResource: "public", withExtension: nil) else {
            return false
        }
        do {
            if fm.fileExists(atPath: documentsWWWURL.path) {
                try fm.removeItem(at: documentsWWWURL)
            }
            try fm.copyItem(at: bundlePublic, to: documentsWWWURL)
            return true
        } catch {
            CAPLog.print("EditableAssets restore failed: \(error)")
            return false
        }
    }
}

// MARK: - Restore button

/// A small native button pinned to the corner of the screen, outside the
/// web view, so it keeps working even if the game files are edited into a
/// broken state. Press and hold to confirm, then it restores the original
/// files and reloads.
final class RestoreOverlay: NSObject {
    static let shared = RestoreOverlay()
    private weak var bridgeVC: CAPBridgeViewController?

    func install(on window: UIWindow, bridgeVC: CAPBridgeViewController) {
        self.bridgeVC = bridgeVC

        let button = UIButton(type: .system)
        button.translatesAutoresizingMaskIntoConstraints = false
        let symbolConfig = UIImage.SymbolConfiguration(pointSize: 15, weight: .bold)
        button.setImage(UIImage(systemName: "arrow.uturn.backward.circle.fill", withConfiguration: symbolConfig), for: .normal)
        button.tintColor = UIColor(red: 0.58, green: 0.75, blue: 0.50, alpha: 1)
        button.backgroundColor = UIColor(red: 0.11, green: 0.10, blue: 0.08, alpha: 0.82)
        button.layer.cornerRadius = 18
        button.layer.borderWidth = 1
        button.layer.borderColor = UIColor(white: 1, alpha: 0.12).cgColor
        button.accessibilityLabel = "Restore default games. Press and hold."

        window.addSubview(button)
        NSLayoutConstraint.activate([
            button.widthAnchor.constraint(equalToConstant: 36),
            button.heightAnchor.constraint(equalToConstant: 36),
            button.trailingAnchor.constraint(equalTo: window.safeAreaLayoutGuide.trailingAnchor, constant: -10),
            button.bottomAnchor.constraint(equalTo: window.safeAreaLayoutGuide.bottomAnchor, constant: -10)
        ])

        let longPress = UILongPressGestureRecognizer(target: self, action: #selector(handleLongPress(_:)))
        longPress.minimumPressDuration = 0.9
        button.addGestureRecognizer(longPress)
    }

    @objc private func handleLongPress(_ gesture: UILongPressGestureRecognizer) {
        guard gesture.state == .began, let vc = bridgeVC else { return }

        UINotificationFeedbackGenerator().notificationOccurred(.warning)

        let alert = UIAlertController(
            title: "Restore Default Games?",
            message: "This puts back the original game files and undoes any edits you made. High scores are kept.",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        alert.addAction(UIAlertAction(title: "Restore", style: .destructive) { _ in
            if EditableAssets.restoreFromBundle() {
                vc.webView?.reloadFromOrigin()
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            }
        })
        vc.present(alert, animated: true)
    }
}
