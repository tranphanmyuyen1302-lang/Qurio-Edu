/* Qurio: common tools for every HTML page. No API keys in browser. */
(() => {
  'use strict';
  if (window.__QURIO_GLOBAL_TOOLS__) return;
  window.__QURIO_GLOBAL_TOOLS__ = true;

  function findSiteRoot() {
    const script = document.querySelector('script[src*="qurio-global.js"]');
    if (!script) return new URL('./', location.href);
    return new URL('../', new URL(script.getAttribute('src'), location.href));
  }
  const root = findSiteRoot();
  const link = path => new URL(path, root).href;

  // Keep the original full dark footer. Change only the copyright wording.
  function normalizeFooter() {
    const copyright = '<span class="qg-copyright-only">© 2026 Qurio. All rights reserved.<span>Thiết kế và phát triển bởi <strong>Trần Phan Mỹ Uyên</strong></span><span>Học hôm nay · Kiến tạo ngày mai.</span></span>';
    document.querySelectorAll('.qurio-footer-bottom > p').forEach(p => {
      if (p.dataset.qgCopyrightReady === '1') return;
      p.innerHTML = copyright;
      p.dataset.qgCopyrightReady = '1';
    });
  }
  function hideAIFromSidebar() {
    document.querySelectorAll('[data-nav="ai"], .sidebar a[href*="gia-su-ai"], .sidebar a[href*="Gia%20S%C6%B0%20AI"]').forEach(el => el.remove());
  }
  function showTools() {
    if (document.getElementById('qurio-global-tools')) return;
    const wrap = document.createElement('div');
    wrap.id = 'qurio-global-tools';
    wrap.innerHTML = `
      <section id="qg-panel" class="qg-chat-panel" aria-label="Chatbox AI Qurio" hidden>
        <div class="qg-chat-head">
          <div class="qg-chat-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 2 2.1 6.1L20 10l-5.9 2L12 18l-2.1-6L4 10l5.9-1.9L12 2Z"/><path d="m19 17 .8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8L19 17Z"/></svg></div>
          <div class="qg-chat-heading"><strong>Qurio AI</strong><small><span class="qg-online"></span>Trợ lý học tập thông minh</small></div>
          <button type="button" class="qg-chat-close" id="qg-close" aria-label="Đóng chat"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
        </div>
        <div class="qg-chat-messages" id="qg-messages" aria-live="polite">
          <div class="qg-message">Xin chào! ✨ Mình có thể giúp bạn giải thích bài học, ôn tập hoặc xây dựng kế hoạch học phù hợp.</div>
        </div>
        <form class="qg-chat-form" id="qg-form">
          <input class="qg-chat-input" id="qg-input" maxlength="1200" placeholder="Hỏi Qurio điều bạn cần…" aria-label="Câu hỏi gửi AI" required autocomplete="off">
          <button class="qg-chat-send" type="submit" id="qg-send" aria-label="Gửi câu hỏi"><svg viewBox="0 0 24 24"><path d="m4 11 16-7-6.5 16-2.6-7.1L4 11Z"/><path d="m10.9 12.9 4.9-4.9"/></svg></button>
        </form>
      </section>
      <button type="button" id="qg-top" class="qg-top" aria-label="Về đầu trang" title="Lên đầu trang"><svg viewBox="0 0 24 24"><path d="m6 14 6-6 6 6"/><path d="M12 8v11"/></svg></button>
      <button type="button" id="qg-toggle" class="qg-toggle" aria-expanded="false" aria-controls="qg-panel"><span class="qg-toggle-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 2 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z"/><path d="m19 16 1 2.5 2.5 1-2.5 1L19 23l-1-2.5-2.5-1 2.5-1L19 16Z"/></svg></span><span>Hỏi Qurio AI</span></button>`;
    document.body.appendChild(wrap);
    const panel = wrap.querySelector('#qg-panel');
    const toggle = wrap.querySelector('#qg-toggle');
    const close = wrap.querySelector('#qg-close');
    const messages = wrap.querySelector('#qg-messages');
    const form = wrap.querySelector('#qg-form');
    const input = wrap.querySelector('#qg-input');
    const send = wrap.querySelector('#qg-send');
    const top = wrap.querySelector('#qg-top');
    let busy = false;
    function togglePanel(open) {
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) input.focus();
    }
    toggle.addEventListener('click', () => togglePanel(panel.hidden));
    close.addEventListener('click', () => togglePanel(false));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !panel.hidden) togglePanel(false);
    });
    function add(text, kind='assistant') {
      const item = document.createElement('div');
      item.className = 'qg-message' + (kind === 'user' ? ' qg-user' : kind === 'system' ? ' qg-system' : '');
      item.textContent = String(text || '');
      messages.appendChild(item);
      messages.scrollTop = messages.scrollHeight;
      return item;
    }
    async function getAuth() {
      if (window.QurioAuth?.request) return window.QurioAuth;
      // Some pages do not load the common auth module, so load it once on demand.
      if (!window.__qgAuthLoading) {
        window.__qgAuthLoading = new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = link('Chung/chung.js');
          script.onload = () => resolve(window.QurioAuth);
          script.onerror = () => reject(new Error('Không tải được kết nối Qurio.'));
          document.head.appendChild(script);
        });
      }
      return window.__qgAuthLoading;
    }
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (busy) return;
      const question = input.value.trim();
      if (!question) return;
      add(question,'user');input.value='';
      busy=true;send.disabled=true;
      const placeholder=add('Qurio AI đang trả lời…');
      try {
        const auth = await getAuth();
        if (!auth?.request) throw new Error('Chưa tải được API Qurio.');
        // Uses the existing server-side tutor handler. Server stores the AI key.
        const response = await auth.request('aiTutor', {content:question});
        const answer = response?.answer || response?.output;
        if (!answer || typeof answer !== 'string') throw new Error('AI chưa trả về câu trả lời.');
        placeholder.textContent = answer;
      } catch (error) {
        const msg = String(error?.message || 'Không xác định được lỗi.');
        placeholder.className='qg-message qg-system';
        placeholder.textContent = /đăng nhập|phiên|hết hạn/i.test(msg)
          ? 'Bạn cần đăng nhập để sử dụng Qurio AI. Vào trang Đăng nhập rồi thử lại.'
          : 'Chưa gửi được câu hỏi: ' + msg;
        if (/đăng nhập|phiên|hết hạn/i.test(msg)) {
          const a=document.createElement('a');a.href=link('Đăng Nhập/dang-nhap.html');a.textContent=' Mở trang đăng nhập →';
          a.style.cssText='color:#7048e8;font-weight:700;display:block;margin-top:7px';
          placeholder.appendChild(a);
        }
      } finally {busy=false;send.disabled=false;input.focus();}
    });
    const updateTop=() => {
      const scroll = Math.max(window.scrollY, document.documentElement.scrollTop, document.body.scrollTop);
      top.classList.toggle('is-visible', scroll > 250);
    };
    window.addEventListener('scroll',updateTop,{passive:true});
    document.addEventListener('scroll',updateTop,{capture:true,passive:true});
    top.addEventListener('click', () => {
      window.scrollTo({top:0,behavior:'smooth'});
      for(const el of document.querySelectorAll('.workspace,.main,.lab-main,.progress-content,.roadmap-content,.content')){
        if(el.scrollTop>0)el.scrollTo({top:0,behavior:'smooth'});
      }
    });
    updateTop();
  }
  function init() { normalizeFooter(); hideAIFromSidebar(); showTools(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
  // Layout scripts can replace footer mounts shortly after initial HTML processing.
  window.addEventListener('load', () => {normalizeFooter(); hideAIFromSidebar();}, {once:true});
  const observer = new MutationObserver(() => {normalizeFooter(); hideAIFromSidebar();});
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
