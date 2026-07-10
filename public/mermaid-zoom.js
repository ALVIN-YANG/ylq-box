(() => {
  const ZOOMED_CLASS = 'mermaid-zoomed';
  const OVERLAY_ID = 'mermaid-zoom-overlay';

  function closeOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = '';
    }
  }

  function openOverlay(svg) {
    if (document.getElementById(OVERLAY_ID)) return;

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '放大查看 Mermaid 图');
    overlay.innerHTML = `
      <button class="mermaid-zoom-close" aria-label="关闭">×</button>
      <div class="mermaid-zoom-container"></div>
    `;

    const container = overlay.querySelector('.mermaid-zoom-container');
    const clone = svg.cloneNode(true);
    clone.removeAttribute('id');
    clone.style.maxWidth = '90vw';
    clone.style.maxHeight = '90vh';
    clone.style.width = 'auto';
    clone.style.height = 'auto';
    container.appendChild(clone);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('.mermaid-zoom-close') || e.target === container) {
        closeOverlay();
      }
    });

    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') {
        closeOverlay();
        document.removeEventListener('keydown', onKey);
      }
    });

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  document.addEventListener('click', (e) => {
    const pre = e.target.closest('pre.mermaid');
    if (!pre) return;

    const svg = pre.querySelector('svg');
    if (!svg) return;

    // 避免在已放大状态下重复触发
    if (e.target.closest('#' + OVERLAY_ID)) return;

    e.preventDefault();
    openOverlay(svg);
  });
})();
