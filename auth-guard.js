// auth-guard.js — 認証ガード
// - ページ描画をブロックし、Supabase Auth のセッションを確認
// - 未認証ならログインフォームを表示、認証完了で reload
// - 認証済みならページを可視化
(function () {
  const SUPABASE_URL = 'https://abeekodehorlwsmnhoza.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZWVrb2RlaG9ybHdzbW5ob3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzAzMTksImV4cCI6MjA5Mjc0NjMxOX0.ZgOB2TUuBBRNV8pejae_UOX9kXIiFb-CS7X0alRX1uU';

  const hideStyle = document.createElement('style');
  hideStyle.setAttribute('data-auth-guard-hide', '');
  hideStyle.textContent = 'html{visibility:hidden!important}';
  (document.head || document.documentElement).appendChild(hideStyle);

  window.__appAuth = { session: null, ready: false };

  function reveal() { hideStyle.remove(); }

  async function getAuthClient() {
    for (let i = 0; i < 200; i++) {
      if (window.supabase) {
        if (typeof window.supabase.createClient === 'function') {
          return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { storageKey: 'sb-abeekodehorlwsmnhoza-auth-token' }
          });
        }
        if (window.supabase.auth && typeof window.supabase.auth.getSession === 'function') {
          return window.supabase;
        }
      }
      await new Promise(r => setTimeout(r, 50));
    }
    return null;
  }

  function showLogin(client) {
    const overlay = document.createElement('div');
    overlay.id = '__appAuthOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:#f1f5f9;z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,"Noto Sans JP",sans-serif;padding:20px;box-sizing:border-box;visibility:visible';
    overlay.innerHTML = `
      <div style="background:#fff;padding:32px 28px;border-radius:16px;box-shadow:0 8px 32px rgba(15,23,42,0.12);width:100%;max-width:400px;border:1px solid #e2e8f0">
        <div style="text-align:center;margin-bottom:24px">
          <div style="font-size:32px;margin-bottom:8px">🔒</div>
          <div style="font-size:20px;font-weight:700;color:#2563eb;letter-spacing:0.02em">顧問生精算シート</div>
          <div style="font-size:13px;color:#64748b;margin-top:6px">ログインが必要です</div>
        </div>
        <label style="display:block;font-size:13px;color:#475569;margin-bottom:6px;font-weight:500">メールアドレス</label>
        <input type="email" id="__ag_email" autocomplete="email" style="width:100%;padding:12px 14px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;font-family:inherit;font-size:15px;color:#0f172a;box-sizing:border-box;margin-bottom:14px;outline:none">
        <label style="display:block;font-size:13px;color:#475569;margin-bottom:6px;font-weight:500">パスワード</label>
        <input type="password" id="__ag_pass" autocomplete="current-password" style="width:100%;padding:12px 14px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;font-family:inherit;font-size:15px;color:#0f172a;box-sizing:border-box;margin-bottom:18px;outline:none">
        <button id="__ag_btn" style="width:100%;padding:12px;background:linear-gradient(135deg,#2563eb 0%,#3b82f6 100%);color:#fff;border:none;border-radius:8px;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:0.05em">ログイン</button>
        <div id="__ag_err" style="color:#dc2626;font-size:13px;margin-top:12px;text-align:center;min-height:18px"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    reveal();
    const btn = overlay.querySelector('#__ag_btn');
    const emailEl = overlay.querySelector('#__ag_email');
    const passEl = overlay.querySelector('#__ag_pass');
    const errEl = overlay.querySelector('#__ag_err');
    async function submit() {
      const email = emailEl.value.trim();
      const password = passEl.value;
      if (!email || !password) { errEl.textContent = 'メールとパスワードを入力してください'; return; }
      btn.disabled = true; btn.textContent = 'ログイン中...';
      errEl.textContent = '';
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        btn.disabled = false; btn.textContent = 'ログイン';
        errEl.textContent = 'メールまたはパスワードが正しくありません';
        return;
      }
      location.reload();
    }
    btn.addEventListener('click', submit);
    passEl.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    emailEl.addEventListener('keydown', e => { if (e.key === 'Enter') passEl.focus(); });
    setTimeout(() => emailEl.focus(), 100);
  }

  async function run() {
    const client = await getAuthClient();
    if (!client) { reveal(); return; }
    const { data: { session } } = await client.auth.getSession();
    window.__appAuth.session = session;
    window.__appAuth.ready = true;
    if (session) {
      reveal();
    } else {
      if (document.body) {
        showLogin(client);
      } else {
        document.addEventListener('DOMContentLoaded', () => showLogin(client));
      }
    }
  }

  run();
})();
