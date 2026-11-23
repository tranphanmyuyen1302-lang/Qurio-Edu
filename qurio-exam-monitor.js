
/**
 * QURIO - GIÁM SÁT BÀI KIỂM TRA
 * File: Chung/qurio-exam-monitor.js
 *
 * Chức năng:
 * - Ghi nhận chuyển tab
 * - Ghi nhận mất tiêu điểm cửa sổ
 * - Ghi nhận mất và khôi phục kết nối
 * - Gửi sự kiện tới Apps Script
 * - Dừng theo dõi khi kết thúc bài
 *
 * Không quay video, chụp ảnh,
 * ghi âm hoặc truy cập camera.
 */

(function () {
  "use strict";

  function start(config) {
    var send = config && config.send;

    var assignmentId = String(
      (config && config.assignmentId) || ""
    );

    var trackTab =
      config && config.trackTab === true;

    if (
      !trackTab ||
      !assignmentId ||
      typeof send !== "function"
    ) {
      return function () {};
    }

    var stopped = false;

    var pending = Promise.resolve();

    var lastEvent = Object.create(null);

    var listeners = [];

    var allowed = [
      "tab_hidden",
      "tab_visible",
      "window_blur",
      "window_focus",
      "offline",
      "online"
    ];

    // ========================================
    // GỬI SỰ KIỆN GIÁM SÁT
    // ========================================

    function report(type) {
      if (
        stopped ||
        allowed.indexOf(type) === -1
      ) {
        return;
      }

      var now = Date.now();

      // Tránh gửi sự kiện liên tục.
      if (
        lastEvent[type] &&
        now - lastEvent[type] < 2000
      ) {
        return;
      }

      lastEvent[type] = now;

      pending = pending
        .catch(function () {})
        .then(function () {
          if (stopped) return;

          return Promise.resolve(
            send({
              action: "monitorEvent",
              assignmentId: assignmentId,
              eventType: type
            })
          ).catch(function (error) {
            console.warn(
              "[Qurio Monitor] Không gửi được:",
              error
            );
          });
        });
    }

    // ========================================
    // ĐĂNG KÝ SỰ KIỆN
    // ========================================

    function on(target, name, callback) {
      target.addEventListener(
        name,
        callback
      );

      listeners.push([
        target,
        name,
        callback
      ]);
    }

    // Học sinh chuyển sang tab khác.
    on(
      document,
      "visibilitychange",
      function () {
        report(
          document.hidden
            ? "tab_hidden"
            : "tab_visible"
        );
      }
    );

    // Cửa sổ mất tiêu điểm.
    on(
      window,
      "blur",
      function () {
        report("window_blur");
      }
    );

    // Quay lại cửa sổ.
    on(
      window,
      "focus",
      function () {
        report("window_focus");
      }
    );

    // Mất kết nối Internet.
    on(
      window,
      "offline",
      function () {
        report("offline");
      }
    );

    // Khôi phục kết nối Internet.
    on(
      window,
      "online",
      function () {
        report("online");
      }
    );

    // ========================================
    // DỪNG GIÁM SÁT
    // ========================================

    return function stop() {
      if (stopped) return;

      stopped = true;

      listeners.forEach(function (item) {
        item[0].removeEventListener(
          item[1],
          item[2]
        );
      });

      listeners = [];
    };
  }

  // ========================================
  // CUNG CẤP API CHO WEBSITE
  // ========================================

  window.QurioExamMonitor = {
    start: start
  };

})();
