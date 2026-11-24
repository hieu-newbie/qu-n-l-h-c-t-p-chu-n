/* ============================================================================
   STUDYHUB PWA MANAGER
   - Registers ./sw.js Service Worker (HTTPS & localhost safe, relative subpath safe)
   - Captures native beforeinstallprompt (Android Chrome/Edge & Desktop Chrome/Edge)
   - Detects iOS Safari & standalone installed mode
   - Renders floating install banner + native prompt / step-by-step guide modal
   - Monitors online/offline status & SW update lifecycle
   ============================================================================ */
(function (global) {
  "use strict";

  const DISMISS_KEY = "studyhub_pwa_banner_dismissed";
  let deferredPrompt = null;
  let swReady = false;
  let swStatus = "checking"; // checking | active | unsupported | file_protocol | error

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: window-controls-overlay)").matches ||
      window.navigator.standalone === true
    );
  }

  function isIOS() {
    const ua = window.navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function isSecureForSW() {
    return (
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }

  function getStatus() {
    return {
      installed: isStandalone(),
      canNativeInstall: Boolean(deferredPrompt),
      isIOS: isIOS(),
      swReady,
      swStatus,
      online: navigator.onLine !== false,
    };
  }

  function notifyUI() {
    renderInstallBanner();
    if (global.StudyHubApp && typeof global.StudyHubApp.refreshPWAButtons === "function") {
      global.StudyHubApp.refreshPWAButtons();
    }
  }

  function dismissBanner() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    const root = document.getElementById("pwa-banner-root");
    if (root) root.innerHTML = "";
  }

  function isBannerDismissed() {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  }

  function renderInstallBanner() {
    const root = document.getElementById("pwa-banner-root");
    if (!root) return;

    if (isStandalone() || isBannerDismissed()) {
      root.innerHTML = "";
      return;
    }

    // Show floating banner automatically when native prompt is ready OR on iOS mobile Safari
    if (!deferredPrompt && !isIOS()) {
      root.innerHTML = "";
      return;
    }

    const subtitle = deferredPrompt
      ? "Cài đặt như ứng dụng gốc, mở toàn màn hình & dùng được khi ngoại tuyến."
      : "Trên iPhone/iPad: Thêm vào Màn hình chính để dùng như app gốc.";

    root.innerHTML = `
      <div class="pwa-banner" role="region" aria-label="Cài đặt ứng dụng STUDYHUB">
        <img src="./icons/icon-192.png" alt="STUDYHUB" class="pwa-banner-icon" width="42" height="42" />
        <div class="pwa-banner-text">
          <strong>Tải app STUDYHUB về máy</strong>
          <p>${subtitle}</p>
        </div>
        <div class="pwa-banner-actions">
          <button type="button" class="btn btn-primary btn-sm btn-shine" id="pwa-banner-install">
            ${deferredPrompt ? "Cài đặt" : "Hướng dẫn"}
          </button>
          <button type="button" class="btn btn-ghost btn-icon" id="pwa-banner-close" style="width:32px;height:32px" aria-label="Đóng gợi ý cài đặt">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    `;

    document.getElementById("pwa-banner-install")?.addEventListener("click", () => triggerInstall());
    document.getElementById("pwa-banner-close")?.addEventListener("click", dismissBanner);
  }

  function openInstallGuideModal() {
    const app = global.StudyHubApp;
    if (!app) return;

    const ios = isIOS();
    const isFile = window.location.protocol === "file:";

    let bodyHtml = "";
    if (isStandalone()) {
      bodyHtml = `
        <div class="alert alert-info">
          <span><strong>STUDYHUB đã được cài đặt!</strong> Bạn đang sử dụng ứng dụng ở chế độ toàn màn hình độc lập (PWA).</span>
        </div>
      `;
    } else if (isFile) {
      bodyHtml = `
        <div class="stack" style="gap:12px;font-size:13.5px">
          <div class="alert alert-warning">
            <span>Bạn đang mở file trực tiếp từ máy tính (<code>file://</code>). Trình duyệt chỉ cho phép cài đặt app PWA khi trang web chạy qua đường dẫn <strong>HTTPS</strong> (GitHub Pages, Vercel, Netlify) hoặc <code>localhost</code>.</span>
          </div>
          <p class="muted">Sau khi đẩy thư mục <strong>studyhub-web</strong> lên GitHub Pages hoặc Vercel Drop, mở link web bằng Chrome / Edge / Safari là nút <strong>"Cài đặt ứng dụng"</strong> sẽ hoạt động ngay!</p>
        </div>
      `;
    } else if (ios) {
      bodyHtml = `
        <div class="stack" style="gap:12px;font-size:13.5px">
          <p class="muted">Safari trên iPhone / iPad yêu cầu thêm ứng dụng vào Màn hình chính qua 3 bước nhanh:</p>
          <div class="pwa-step"><span class="pwa-step-num">1</span><div>Bấm nút <strong>Chia sẻ (Share ↑)</strong> ở thanh công cụ dưới cùng của trình duyệt Safari.</div></div>
          <div class="pwa-step"><span class="pwa-step-num">2</span><div>Cuộn xuống và chọn <strong>"Thêm vào MH chính" (Add to Home Screen)</strong>.</div></div>
          <div class="pwa-step"><span class="pwa-step-num">3</span><div>Bấm <strong>"Thêm" (Add)</strong> ở góc trên bên phải — biểu tượng STUDYHUB sẽ xuất hiện như ứng dụng gốc!</div></div>
        </div>
      `;
    } else {
      bodyHtml = `
        <div class="stack" style="gap:12px;font-size:13.5px">
          <p class="muted">STUDYHUB đã sẵn sàng cài đặt làm ứng dụng (PWA) trên điện thoại và máy tính:</p>
          <div class="pwa-step"><span class="pwa-step-num">1</span><div><strong>Trên máy tính (Chrome / Edge):</strong> Bấm biểu tượng <strong>Cài đặt (màn hình có mũi tên tải xuống)</strong> ở góc phải thanh địa chỉ, hoặc vào Menu (⋮) → <strong>Truyền, lưu và chia sẻ → Cài đặt STUDYHUB</strong>.</div></div>
          <div class="pwa-step"><span class="pwa-step-num">2</span><div><strong>Trên điện thoại Android (Chrome / Edge):</strong> Bấm Menu góc trên phải (⋮) → chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào màn hình chính"</strong>.</div></div>
          <div class="pwa-step"><span class="pwa-step-num">3</span><div><strong>Trên iPhone / iPad (Safari):</strong> Bấm nút <strong>Chia sẻ (↑)</strong> → <strong>"Thêm vào MH chính"</strong>.</div></div>
        </div>
      `;
    }

    app.openModal(
      "Tải ứng dụng STUDYHUB về máy (PWA)",
      "Mở toàn màn hình không cần thanh trình duyệt & sử dụng được ngay cả khi mất mạng.",
      `${bodyHtml}<div style="display:flex;justify-content:flex-end;margin-top:16px"><button type="button" class="btn btn-primary btn-sm" data-close-modal>Đã hiểu</button></div>`
    );
  }

  async function triggerInstall() {
    const app = global.StudyHubApp;

    if (isStandalone()) {
      if (app) app.toast("STUDYHUB đã được cài đặt trên thiết bị này", "success");
      return { outcome: "already_installed" };
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        deferredPrompt = null;
        notifyUI();
        if (choice && choice.outcome === "accepted") {
          if (global.StudyHubCharts) global.StudyHubCharts.fireConfetti({ count: 70 });
          if (app) app.toast("Đang cài đặt STUDYHUB về máy!", "success", "Biểu tượng ứng dụng sẽ xuất hiện trên màn hình chính.");
        }
        return choice;
      } catch {
        openInstallGuideModal();
        return { outcome: "fallback_guide" };
      }
    }

    openInstallGuideModal();
    return { outcome: "guide_shown" };
  }

  async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      swStatus = "unsupported";
      notifyUI();
      return;
    }
    if (!isSecureForSW()) {
      swStatus = "file_protocol";
      notifyUI();
      return;
    }
    try {
      const reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
      swReady = true;
      swStatus = "active";
      notifyUI();

      // Automatically activate updated service worker cleanly
      reg.addEventListener("updatefound", () => {
        const next = reg.installing;
        if (!next) return;
        next.addEventListener("statechange", () => {
          if (next.state === "installed" && navigator.serviceWorker.controller) {
            next.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    } catch (err) {
      swStatus = "error";
      console.warn("[STUDYHUB PWA] Service Worker registration skipped:", err);
      notifyUI();
    }
  }

  // Listen for native PWA install prompt
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notifyUI();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    dismissBanner();
    notifyUI();
    if (global.StudyHubCharts) global.StudyHubCharts.fireConfetti({ count: 80 });
    if (global.StudyHubApp) {
      global.StudyHubApp.toast("Cài đặt STUDYHUB thành công!", "success", "Bạn có thể mở ứng dụng ngay từ Màn hình chính.");
    }
  });

  window.addEventListener("offline", () => {
    if (global.StudyHubApp) {
      global.StudyHubApp.toast("Đang ở chế độ ngoại tuyến (Offline)", "info", "Mọi thay đổi học tập & chi tiêu vẫn được lưu trên máy.");
    }
    notifyUI();
  });

  window.addEventListener("online", () => {
    if (global.StudyHubApp) {
      global.StudyHubApp.toast("Đã khôi phục kết nối mạng", "success");
    }
    notifyUI();
  });

  window.addEventListener("DOMContentLoaded", () => {
    registerServiceWorker();
    renderInstallBanner();
  });

  global.StudyHubPWA = {
    isStandalone,
    isIOS,
    getStatus,
    triggerInstall,
    openInstallGuideModal,
    renderInstallBanner,
  };
})(window);
