// Eventbook — shared interactivity (tweaks panel, nav scroll, host protocol)

(function () {
  // ---- Persisted defaults (host rewrites this block on disk) ----
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "cardstyle": "dense",
    "filters": "rail",
    "stats": "on"
  }/*EDITMODE-END*/;

  // Read from localStorage so toggles persist across page navigation in the prototype
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem('eb_tweaks') || '{}');
      return Object.assign({}, TWEAK_DEFAULTS, saved);
    } catch (e) { return Object.assign({}, TWEAK_DEFAULTS); }
  }
  function save(t) {
    localStorage.setItem('eb_tweaks', JSON.stringify(t));
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: t }, '*');
    } catch (e) {}
  }

  let state = load();
  function apply() {
    document.body.dataset.cardstyle = state.cardstyle;
    document.body.dataset.filters = state.filters;
    document.body.dataset.stats = state.stats;
  }
  apply();

  // ---- Nav scroll shadow ----
  const nav = document.querySelector('.nav');
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 8) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- Tweaks panel ----
  function buildPanel() {
    const panel = document.createElement('div');
    panel.className = 'twk';
    panel.innerHTML = `
      <div class="twk-hd">
        <b>Tweaks</b>
        <button class="twk-x" aria-label="Close">×</button>
      </div>
      <div class="twk-body">
        <div class="twk-row">
          <label>Vendor card style</label>
          <div class="twk-seg" data-key="cardstyle">
            <button data-val="dense">Dense + rating</button>
            <button data-val="airy">Airy, no rating</button>
          </div>
        </div>
        <div class="twk-row">
          <label>Filter layout</label>
          <div class="twk-seg" data-key="filters">
            <button data-val="rail">Left rail</button>
            <button data-val="top">Top bar</button>
          </div>
        </div>
        <div class="twk-row">
          <label>Social-proof stats</label>
          <div class="twk-seg" data-key="stats">
            <button data-val="on">Show</button>
            <button data-val="off">Hide</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    function syncButtons() {
      panel.querySelectorAll('.twk-seg').forEach(seg => {
        const key = seg.dataset.key;
        seg.querySelectorAll('button').forEach(b => {
          b.classList.toggle('is-on', b.dataset.val === state[key]);
        });
      });
    }
    syncButtons();

    panel.querySelectorAll('.twk-seg button').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.parentElement.dataset.key;
        state[key] = btn.dataset.val;
        save(state);
        apply();
        syncButtons();
      });
    });

    panel.querySelector('.twk-x').addEventListener('click', () => {
      panel.classList.remove('is-open');
      try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
    });

    return panel;
  }

  const panel = buildPanel();

  // Host protocol — listener FIRST, then announce
  window.addEventListener('message', (e) => {
    const msg = e.data || {};
    if (msg.type === '__activate_edit_mode') panel.classList.add('is-open');
    else if (msg.type === '__deactivate_edit_mode') panel.classList.remove('is-open');
  });
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
})();
