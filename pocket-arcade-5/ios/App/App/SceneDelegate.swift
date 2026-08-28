import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private weak var bridgeVC: CAPBridgeViewController?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else { return }

        window = UIWindow(windowScene: windowScene)
        let vc = CAPBridgeViewController()
        bridgeVC = vc
        window?.rootViewController = vc
        window?.makeKeyAndVisible()

        // Serve the app's files from an editable copy in Documents (visible
        // in the Files app) instead of the read-only copy baked into the
        // app, so the code can be viewed and edited on-device.
        EditableAssets.seedIfNeeded()
        vc.setServerBasePath(path: EditableAssets.wwwURL.path)

        if let window = window { installResetButton(on: window) }

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    // A small always-available button, outside the web view, so resetting
    // still works even if the web code itself is broken. Prefers a
    // JS-managed backup if one exists, falling back to the original files
    // baked into the app.
    private func installResetButton(on window: UIWindow) {
        let button = UIButton(type: .system)
        button.translatesAutoresizingMaskIntoConstraints = false
        let cfg = UIImage.SymbolConfiguration(pointSize: 15, weight: .bold)
        button.setImage(UIImage(systemName: "arrow.uturn.backward.circle.fill", withConfiguration: cfg), for: .normal)
        button.tintColor = UIColor(white: 0.9, alpha: 1)
        button.backgroundColor = UIColor(white: 0.15, alpha: 0.85)
        button.layer.cornerRadius = 18
        button.addTarget(self, action: #selector(resetTapped), for: .touchUpInside)

        window.addSubview(button)
        NSLayoutConstraint.activate([
            button.widthAnchor.constraint(equalToConstant: 36),
            button.heightAnchor.constraint(equalToConstant: 36),
            button.trailingAnchor.constraint(equalTo: window.safeAreaLayoutGuide.trailingAnchor, constant: -10),
            button.bottomAnchor.constraint(equalTo: window.safeAreaLayoutGuide.bottomAnchor, constant: -10)
        ])
    }

    @objc private func resetTapped() {
        guard let vc = bridgeVC else { return }
        let alert = UIAlertController(
            title: "Reset Code?",
            message: "Restores the app's original files, undoing any edits you made. This can't be undone.",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        alert.addAction(UIAlertAction(title: "Reset", style: .destructive) { _ in
            EditableAssets.resetToFactory()
            vc.webView?.reloadFromOrigin()
        })
        vc.present(alert, animated: true)
    }
}

// Manages the editable copy of the app's files in Documents.
enum EditableAssets {
    static var documentsURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
    static var wwwURL: URL { documentsURL.appendingPathComponent("www", isDirectory: true) }
    static var factoryURL: URL { documentsURL.appendingPathComponent("www-factory", isDirectory: true) }

    // Runs once on first launch: creates the live editable copy (www) and a
    // separate untouched reference copy (www-factory) used for resetting.
    static func seedIfNeeded() {
        let fm = FileManager.default
        if !fm.fileExists(atPath: wwwURL.path) {
            copyBundleTo(wwwURL)
        }
        if !fm.fileExists(atPath: factoryURL.path) {
            copyBundleTo(factoryURL)
        }
    }

    private static func copyBundleTo(_ destination: URL) {
        let fm = FileManager.default
        guard let bundlePublic = Bundle.main.url(forResource: "public", withExtension: nil) else { return }
        try? fm.removeItem(at: destination)
        try? fm.copyItem(at: bundlePublic, to: destination)
    }

    static func resetToFactory() {
        let fm = FileManager.default
        try? fm.removeItem(at: wwwURL)
        if fm.fileExists(atPath: factoryURL.path) {
            try? fm.copyItem(at: factoryURL, to: wwwURL)
        } else {
            copyBundleTo(wwwURL)
        }
    }
}
