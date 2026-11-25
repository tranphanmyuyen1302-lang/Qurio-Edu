
(() => {
  'use strict';

  // Xác định đường dẫn file hiện tại
  const guardSrc =
    document.currentScript?.src ||
    document.getElementById('qurioGuardJS')?.src ||
    document.querySelector(
      'script[src*="qurio-teacher-guard.js"]'
    )?.src;

  let authLoading = null;
  let checking = false;

  // Tự tải hệ thống xác thực nếu trang chưa có
  async function getAuth() {
    if (typeof window.QurioAuth?.me === 'function') {
      return window.QurioAuth;
    }

    // Dùng lại tiến trình tải chung nếu có
    if (window.__qgAuthLoading) {
      await window.__qgAuthLoading;

      if (typeof window.QurioAuth?.me === 'function') {
        return window.QurioAuth;
      }
    }

    if (!guardSrc) {
      throw new Error('Không tìm thấy đường dẫn xác thực.');
    }

    if (!authLoading) {
      authLoading = new Promise((resolve, reject) => {
        const script = document.createElement('script');

        // chung.js nằm cùng thư mục với file guard
        script.src = new URL('chung.js', guardSrc).href;

        script.onload = () => {
          if (typeof window.QurioAuth?.me === 'function') {
            resolve(window.QurioAuth);
          } else {
            reject(new Error('Không tải được QurioAuth.'));
          }
        };

        script.onerror = () => {
          reject(new Error('Không tải được chung.js.'));
        };

        document.head.appendChild(script);
      }).catch(error => {
        authLoading = null;
        throw error;
      });
    }

    return authLoading;
  }

  // Hiển thị hộp thoại thông báo
  function showDenied(message) {
    const existing = document.getElementById(
      'qurioAccessDialog'
    );

    if (existing) return;

    const dialog = document.createElement('dialog');
    dialog.id = 'qurioAccessDialog';

    dialog.innerHTML = `
      <div class="qurio-access-icon">
        <svg width="36" height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8">
          <rect x="4" y="10"
            width="16" height="11" rx="3"/>
          <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
          <path d="M12 14v3"/>
        </svg>
      </div>

      <h2>Quyền truy cập bị hạn chế</h2>

      <p></p>

      <div class="qurio-access-note">
        QURIO · PHÂN QUYỀN TÀI KHOẢN
      </div>

      <button type="button">Đã hiểu</button>
    `;

    dialog.querySelector('p').textContent = message;

    document.body.appendChild(dialog);

    dialog.querySelector('button').addEventListener(
      'click',
      () => dialog.close()
    );

    dialog.addEventListener('close', () => {
      dialog.remove();
    });

    dialog.showModal();
  }

  // Kiểm tra vai trò khi bấm mục Giáo viên
  document.addEventListener('click', async event => {
    const navLink = event.target?.closest?.(
      'a[data-nav="teachers"], a[data-nav="teacher"]'
    );

    if (!navLink) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    if (checking) return;
    checking = true;

    try {
      const auth = await getAuth();
      const user = await auth.me();

      const role = String(user?.role || '')
        .trim()
        .toLowerCase();

      // Chỉ cho phép giáo viên
      if (role === 'teacher' || role === 'gv') {
        const siteRoot = new URL('../', guardSrc);

        const teacherURL = new URL(
          'page/Giáo Viên/giao-vien.html',
          siteRoot
        );

        window.location.assign(teacherURL.href);
        return;
      }

      // Tài khoản học sinh
      showDenied(
        'Khu vực này chỉ dành cho tài khoản giáo viên. ' +
        'Tài khoản học sinh không có quyền truy cập.'
      );

    } catch (error) {
      const message = String(error?.message || '');

      if (/đăng nhập|hết hạn|phiên/i.test(message)) {
        showDenied(
          'Bạn cần đăng nhập bằng tài khoản giáo viên ' +
          'để sử dụng chức năng này.'
        );
      } else {
        showDenied(
          'Không thể kiểm tra quyền truy cập lúc này. ' +
          'Vui lòng thử lại sau.'
        );
        console.error('Qurio Teacher Guard:', error);
      }

    } finally {
      checking = false;
    }

  }, true);

})();
