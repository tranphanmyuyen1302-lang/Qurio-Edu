(() => {
  'use strict';

  if (window.QurioAuth) return;

  // Dán lại URL Apps Script của bạn, kết thúc bằng /exec.
  const API_URL = 'https://script.google.com/macros/s/AKfycbzB94y2i27gDUvH6stYkV5FqpI4aLAfXVomNfl9TSw8ckREkc7VvjCzjbnqqAISV2OL/exec';

  const HOME_URL = '../Trang Chủ/trang-chu.html';

  const STORAGE_KEY = 'qurio_session';
  const $ = id => document.getElementById(id);

  const message = $('message');
  const loginForm = $('loginForm');
  const registerForm = $('registerForm');

  function show(text, type = 'info') {
    if (!message) return;

    message.textContent = text;
    message.className = 'message ' + type;
    message.hidden = false;

    message.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }
  function clearMessage() {
    if (message) message.hidden = true;
  }

    async function api(action, data = {}) {
    const isAi = action === 'qurioAi' || action === 'qurioChatHistory';
    const endpoint = isAi ? window.QURIO_SITE?.aiApiUrl : API_URL;

    if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint || '')) {
      throw new Error(isAi
        ? 'Kiểm tra aiApiUrl trong Chung/site-config.js.'
        : 'Kiểm tra API_URL trong Chung/chung.js.');
    }

    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        redirect: 'follow',
        body: JSON.stringify({ action, ...data })
      });
    } catch (_) {
      throw new Error('Không kết nối được Apps Script. Kiểm tra mạng và quyền truy cập Web App.');
    }

    let result;
    try {
      result = await response.json();
    } catch (_) {
      throw new Error('API không trả về JSON. Kiểm tra URL /exec và quyền truy cập Web App.');
    }

    if (!response.ok || !result?.ok) {
      throw new Error(result?.message || 'Yêu cầu không thành công.');
    }

    return result;
  }

  async function submit(form, label, task) {
    const button = form.querySelector(
      'button[type="submit"]'
    );

    if (button.disabled) return;

    clearMessage();
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');

    show(label);

    try {
      await task();
    } catch (error) {
      show(error.message, 'error');
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  function loadSession() {
    // A stale per-tab session must not conceal a valid remembered session.
    const sessions = [];
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) continue;
        const value = JSON.parse(raw);
        if (value && typeof value.token === 'string' &&
            Number(value.expiresAt) > Date.now()) sessions.push(value);
      } catch (_) { /* Storage is unavailable or contains invalid data. */ }
    }
    sessions.sort((a, b) => Number(b.expiresAt) - Number(a.expiresAt));
    return sessions[0] || null;
  }

  function afterLoginURL() {
    const next = new URLSearchParams(location.search).get('next');
    if (next && next.startsWith('/') && !next.startsWith('//') &&
        !next.includes('\\')) {
      try {
        const target = new URL(next, location.origin);
        if (target.origin === location.origin &&
            !decodeURIComponent(target.pathname).endsWith('/Đăng Nhập/dang-nhap.html')) {
          return target.href;
        }
      } catch (_) { /* Ignore malformed return URLs. */ }
    }
    return HOME_URL;
  }

  function clearSession() {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }

  window.QurioAuth = {
    async request(action, data = {}) {
  const saved = loadSession();

  if (!saved || saved.expiresAt <= Date.now()) {
    throw new Error('Vui lòng đăng nhập lại để tiếp tục.');
  }

  return api(action, {
    ...data,
    token: saved.token
  });
},
    async social(idToken, options = {}) {
      const result = await api('oauth', {
        idToken,
        intent: options.intent,
        agreeTerms: options.agreeTerms === true,
        remember: options.remember === true
      });

      clearSession();

      const storage = options.remember
        ? localStorage
        : sessionStorage;

      storage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: result.token,
          expiresAt: result.expiresAt
        })
      );

      show(result.message, 'success');

      window.location.assign(afterLoginURL());

      return result.user;
    },

    async me() {
      const saved = loadSession();

      if (!saved) {
        throw new Error('Bạn chưa đăng nhập.');
      }

      if (saved.expiresAt <= Date.now()) {
        clearSession();
        throw new Error('Phiên đăng nhập đã hết hạn.');
      }

      const result = await api('me', {
        token: saved.token
      });

      return result.user;
    },

    async logout() {
      const saved = loadSession();

      try {
        if (saved) {
          await api('logout', {
            token: saved.token
          });
        }
      } finally {
        clearSession();
      }
    }
  };

  document.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('input', clearMessage);
    input.addEventListener('change', clearMessage);
  });

  if (message) {
    message.setAttribute('aria-live', 'polite');
  }

  // ===== HIỆN / ẨN MẬT KHẨU =====

  const eye = visible => `
    <svg class="eye-icon" viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round"
      aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
      ${visible ? '<path d="m3 3 18 18"/>' : ''}
    </svg>
  `;

  document
    .querySelectorAll('[data-toggle], #togglePassword')
    .forEach(button => {
      button.innerHTML = eye(false);
      button.setAttribute('aria-pressed', 'false');

      button.addEventListener('click', () => {
        const input = $(
          button.dataset.toggle || 'password'
        );

        const visible = input.type === 'password';

        input.type = visible ? 'text' : 'password';
        button.innerHTML = eye(visible);

        button.setAttribute(
          'aria-pressed',
          String(visible)
        );

        button.setAttribute(
          'aria-label',
          visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
        );

        button.title = visible
          ? 'Ẩn mật khẩu'
          : 'Hiện mật khẩu';
      });
    });

  // ===== ĐĂNG KÝ BẰNG BIỂU MẪU =====

  if (registerForm) {
    function updateRole() {
      const teacher =
        registerForm.elements.role.value === 'teacher';

      $('studentRole').classList.toggle('active', !teacher);
      $('teacherRole').classList.toggle('active', teacher);

      $('studentFields').hidden = teacher;
      $('teacherFields').hidden = !teacher;

      $('className').disabled = teacher;
      $('className').required = !teacher;

      ['subject', 'adminCode'].forEach(id => {
        $(id).disabled = !teacher;
        $(id).required = teacher;
      });

      $('submitLabel').textContent = teacher
        ? 'Tạo tài khoản giáo viên'
        : 'Tạo tài khoản học sinh';

      clearMessage();
    }

    registerForm
      .querySelectorAll('[name="role"]')
      .forEach(input => {
        input.addEventListener('change', updateRole);
      });

    updateRole();

    registerForm.addEventListener('submit', event => {
      event.preventDefault();

      [
        'username',
        'fullName',
        'email',
        'className',
        'adminCode'
      ].forEach(id => {
        $(id).value = $(id).value.trim();
      });

      if (!registerForm.reportValidity()) return;

      const password = $('password').value;

      if (
        !/[a-z]/.test(password) ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password)
      ) {
        show(
          'Mật khẩu cần có chữ hoa, chữ thường và số.',
          'error'
        );

        $('password').focus();
        return;
      }

      if (password !== $('confirmPassword').value) {
        show('Mật khẩu xác nhận không khớp.', 'error');
        $('confirmPassword').focus();
        return;
      }

      submit(
        registerForm,
        'Đang tạo tài khoản, vui lòng chờ…',
        async () => {
          const result = await api('register', {
            username: $('username').value.trim(),
            fullName: $('fullName').value.trim(),
            email: $('email').value.trim(),
            password: $('password').value,
            role: registerForm.elements.role.value,
            className: $('className').value.trim(),
            subject: $('subject').value,
            adminCode: $('adminCode').value.trim(),
            agreeTerms: $('agreeTerms').checked
          });

          registerForm.reset();
          updateRole();

          show(result.message, 'success');
        }
      );
    });
  }

  // ===== ĐĂNG NHẬP BẰNG BIỂU MẪU =====

  if (loginForm) {
    loginForm.addEventListener('submit', event => {
      event.preventDefault();

      if (!loginForm.reportValidity()) return;

      submit(
        loginForm,
        'Đang kiểm tra tài khoản, vui lòng chờ…',
        async () => {
          const remember = $('remember').checked;

          const result = await api('login', {
            identifier: $('email').value.trim(),
            password: $('password').value,
            remember
          });

          clearSession();

          const storage = remember
            ? localStorage
            : sessionStorage;

          storage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              token: result.token,
              expiresAt: result.expiresAt
            })
          );

          $('password').value = '';
          show(result.message, 'success');

          window.location.assign(afterLoginURL());
        }
      );
    });
  }

  if ($('forgotPassword')) {
    $('forgotPassword').addEventListener('click', event => {
      event.preventDefault();
      show('Chức năng quên mật khẩu chưa được kết nối.');
    });
  }

  // ===== ĐĂNG NHẬP / ĐĂNG KÝ GOOGLE =====

  const firebaseConfig = {
    apiKey: 'AIzaSyARi-VNnGkD14HrbC7bykFGc2b3JX-KmhY',
    authDomain: 'qurio-d7925.firebaseapp.com',
    projectId: 'qurio-d7925',
    appId: '1:775300269266:web:4b61a28423a23a576c990b'
  };

  let firebase;
  let firebaseError;
  let googleBusy = false;

  const googleButtons = [
    'googleLogin',
    'googleRegister'
  ].map($).filter(Boolean);

  if (googleButtons.length) {
    Promise.all([
      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js')
    ]).then(([appSdk, authSdk]) => {
      const app = appSdk.initializeApp(
        firebaseConfig,
        'qurio-google'
      );

      const auth = authSdk.initializeAuth(app, {
        persistence: authSdk.inMemoryPersistence,
        popupRedirectResolver:
          authSdk.browserPopupRedirectResolver
      });

      firebase = {
        auth,
        sdk: authSdk
      };
    }).catch(error => {
      console.error('Không tải được Firebase SDK:', error);

      firebaseError =
        'Không tải được Firebase. Kiểm tra mạng, tải lại trang và xem lỗi trong F12 → Console.';
    });
  }

  googleButtons.forEach(button => {
    button.addEventListener('click', async () => {
      if (googleBusy) return;

      if (firebaseError) {
        show(firebaseError, 'error');
        return;
      }

      if (!firebase) {
        show(
          'Đang tải Firebase, bạn chờ một chút rồi bấm Google lại nhé.'
        );
        return;
      }

      if (registerForm) {
        if (
          registerForm.elements.role.value === 'teacher'
        ) {
          show(
            'Tài khoản giáo viên cần đăng ký bằng biểu mẫu và mã xác nhận.',
            'error'
          );
          return;
        }

        if (!$('agreeTerms').checked) {
          show(
            'Bạn cần tích đồng ý điều khoản trước khi đăng ký bằng Google.',
            'error'
          );

          $('agreeTerms').focus();
          return;
        }
      }

      googleBusy = true;

      googleButtons.forEach(item => {
        item.disabled = true;
      });

      button.setAttribute('aria-busy', 'true');
      show('Đang mở cửa sổ Google…');

      try {
        const provider =
          new firebase.sdk.GoogleAuthProvider();

        provider.setCustomParameters({
          prompt: 'select_account'
        });

        const result =
          await firebase.sdk.signInWithPopup(
            firebase.auth,
            provider
          );

        const idToken =
          await result.user.getIdToken(true);

        show('Đang kết nối tài khoản với Qurio…');

        await window.QurioAuth.social(idToken, {
          intent: registerForm ? 'register' : 'login',
          agreeTerms: !!$('agreeTerms')?.checked,
          remember: !!$('remember')?.checked
        });
      } catch (error) {
        const errors = {
          'auth/unauthorized-domain':
            'Mở website bằng localhost thay cho 127.0.0.1. Kiểm tra Authorized domains trong Firebase.',

          'auth/popup-blocked':
            'Trình duyệt đang chặn popup. Cho phép cửa sổ bật lên rồi thử lại.',

          'auth/popup-closed-by-user':
            'Bạn đã đóng cửa sổ Google. Bấm lại để tiếp tục.',

          'auth/operation-not-allowed':
            'Cần bật Google trong Firebase Authentication.',

          'auth/network-request-failed':
            'Không kết nối được Firebase. Kiểm tra mạng rồi thử lại.',

          'auth/account-exists-with-different-credential':
            'Email đã dùng phương thức đăng nhập khác. Hãy dùng phương thức đã đăng ký.'
        };

        show(
          errors[error.code] || (
            error.code
              ? 'Lỗi Google: ' + error.code
              : error.message
          ),
          'error'
        );
      } finally {
        try {
          await firebase.sdk.signOut(firebase.auth);
        } catch (_) {}

        googleBusy = false;

        googleButtons.forEach(item => {
          item.disabled = false;
        });

        button.removeAttribute('aria-busy');
      }
    });
  });
})();