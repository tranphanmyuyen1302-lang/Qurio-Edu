/* Qurio — đồng bộ thông tin tài khoản thật trên mọi trang.
 * Nguồn tin cậy duy nhất: QurioAuth.me() -> Apps Script -> Qurio_Users.
 * Không sử dụng hồ sơ demo hoặc localStorage để giả làm tài khoản đã xác thực.
 */
(() => {
  'use strict';
  if (window.QurioAccountUI) return;

  const base = new URL('../', document.currentScript.src);
  const loginURL = new URL('Đăng Nhập/dang-nhap.html', base).href;
  const $ = id => document.getElementById(id);
  const SESSION_KEY = 'qurio_session';

  let currentUser = null;
  let pending = null;
  let status = 'loading';

  function sessionExists() {
    try {
      return [sessionStorage, localStorage].some(store => {
        try {
          const value = store.getItem(SESSION_KEY);
          if (!value) return false;
          const parsed = JSON.parse(value);
          return Boolean(parsed && typeof parsed.token === 'string' &&
            Number(parsed.expiresAt) > Date.now());
        } catch (_) { return false; }
      });
    } catch (_) {
      return false;
    }
  }

  function getLoginURL() {
    // Preserve the current page while preventing off-site return destinations.
    const url = new URL(loginURL);
    if (!decodeURIComponent(location.pathname).endsWith('/Đăng Nhập/dang-nhap.html')) {
      url.searchParams.set('next', location.pathname + location.search + location.hash);
    }
    return url.href;
  }

  function handleGuestLoginClick(event) {
    if (!(event.target instanceof Element)) return;
    const control = event.target.closest(
      '#profileToggle, #teacherProfileTrigger, #qUserLink, #profileLoginLink'
    );
    if (!control) return;
    // An authenticated profile should still open its normal account menu.
    if (currentUser || (status === 'loading' && sessionExists())) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.assign(getLoginURL());
  }

  function setText(id, value) {
    const element = $(id);
    if (element && element.textContent !== value) element.textContent = value;
  }

  function render() {
    const user = currentUser;
    const name = user ? String(user.fullName || user.username || user.name || 'Người dùng') : 'Khách';
    const email = user ? String(user.email || '') : '';
    const role = user ? (user.role === 'teacher' || user.role === 'GV' ? 'Giáo viên' : 'Học sinh') :
      (status === 'error' ? 'Không thể xác thực' : 'Chưa đăng nhập');
    const avatar = user ? (name.trim().split(/\s+/).slice(-2).map(part => part[0] || '').join('').toUpperCase() || 'Q') : 'Q';

    for (const id of ['profileName', 'teacherHeaderName', 'teacherName', 'teacherMenuName', 'qUserName']) {
      setText(id, name);
    }
    for (const id of ['profileRole', 'teacherHeaderSubtitle', 'qUserRole']) {
      setText(id, role);
    }
    for (const id of ['profileAvatar', 'teacherAvatar', 'teacherMenuAvatar', 'qAvatar']) {
      setText(id, avatar);
    }
    setText('profileEmail', email || (user ? 'Chưa có email' : 'Bạn chưa đăng nhập'));
    setText('teacherMenuEmail', email || (user ? 'Chưa có email' : 'Chưa đăng nhập'));
    setText('profileDescription', user ? 'Thông tin được đồng bộ từ tài khoản Qurio.' : 'Đăng nhập để lưu tiến độ học tập.');
    setText('qLogoutText', user ? 'Đăng xuất' : 'Đăng nhập');

    const button = $('logoutButton');
    if (button) {
      const textLabel = user ? 'Đăng xuất' : 'Đăng nhập';
      // Giữ nguyên biểu tượng SVG của thiết kế.
      const textNode = [...button.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      const label = button.querySelector('[data-account-label]');
      if (label) label.textContent = textLabel;
      else if (textNode) textNode.textContent = '\n ' + textLabel + '\n';
      else button.insertAdjacentText('beforeend', textLabel);
      button.title = textLabel;
    }
    const loginLink = $('profileLoginLink');
    if (loginLink) { loginLink.hidden = !!user; loginLink.href = getLoginURL(); }
    const qLink = $('qUserLink');
    if (qLink) qLink.href = user ? new URL('Trang Chủ/trang-chu.html', base).href : getLoginURL();
    window.dispatchEvent(new CustomEvent('qurio:account', { detail: { user, status } }));
  }

  function apply(user, newStatus) {
    currentUser = user && user.id ? user : null;
    status = newStatus;
    render();
    return currentUser;
  }

  async function refresh() {
    if (pending) return pending;
    if (!sessionExists()) return apply(null, 'guest');
    if (typeof window.QurioAuth?.me !== 'function') return apply(null, 'error');

    pending = window.QurioAuth.me()
      .then(user => apply(user, 'authenticated'))
      .catch(error => {
        console.warn('Qurio: Không xác thực được phiên đăng nhập:', error?.message || error);
        // Không xóa token khi mạng lỗi; người dùng có thể tải lại sau.
        const message = String(error?.message || '');
        return apply(null, /hết hạn|chưa đăng nhập|đăng nhập lại|không còn hoạt động/i.test(message) ? 'guest' : 'error');
      })
      .finally(() => { pending = null; });
    return pending;
  }

  async function handleLogout(event) {
    const button = event.target.closest('#logoutButton, #teacherProfileLogout, #qLogout');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!currentUser) {
      location.assign(getLoginURL());
      return;
    }
    button.disabled = true;
    try {
      if (!window.QurioAuth?.logout) throw new Error('Chưa tải được chức năng đăng xuất.');
      await window.QurioAuth.logout();
      apply(null, 'guest');
      location.assign(getLoginURL());
    } catch (error) {
      console.warn('Qurio: Đăng xuất gặp lỗi:', error?.message || error);
      // Không giả vờ đã đăng xuất khi phía máy chủ chưa xác nhận.
      button.disabled = false;
      alert('Không thể đăng xuất. Vui lòng kiểm tra kết nối và thử lại.');
    }
  }

  function init() {
    // Ghi đè handler demo điều hướng về Đăng nhập khi người dùng chọn Đăng xuất.
    document.addEventListener('click', handleGuestLoginClick, true);
    document.addEventListener('click', handleLogout, true);
    refresh();
  }

  window.QurioAccountUI = { get user() { return currentUser; }, get status() { return status; }, refresh };
  window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
  window.addEventListener('storage', event => { if (event.key === SESSION_KEY) refresh(); });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
