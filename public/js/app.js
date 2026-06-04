(function () {
  // Tasdiqlash: data-confirm bo'lgan havolalar (masalan, chiqish)
  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[data-confirm]');
    if (!link) return;
    const message = link.getAttribute('data-confirm');
    if (message && !window.confirm(message)) {
      event.preventDefault();
    }
  });

  document.addEventListener('submit', function (event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const message = form.getAttribute('data-confirm');
    if (message && !window.confirm(message)) {
      event.preventDefault();
      return;
    }
    const submitter = event.submitter;
    if (submitter && submitter.tagName === 'BUTTON' && submitter.type === 'submit') {
      submitter.disabled = true;
      submitter.dataset.originalText = submitter.textContent || '';
      submitter.textContent = 'Saqlanmoqda…';
      setTimeout(() => {
        submitter.disabled = false;
        if (submitter.dataset.originalText) {
          submitter.textContent = submitter.dataset.originalText;
        }
      }, 4000);
    }
  });

  setTimeout(() => {
    document.querySelectorAll('.alert-success, .alert-warning').forEach((el) => {
      el.style.transition = 'opacity 0.4s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 400);
    });
  }, 4000);
})();
