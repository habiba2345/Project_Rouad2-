document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const msgEl = document.getElementById('formMsg');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const age = document.getElementById('age').value.trim();
    const address = document.getElementById('address').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !age || !address) {
      showMsg('من فضلك املأ الاسم والسن والعنوان.', false);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري الإرسال...';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age, address, message })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showMsg('تم إرسال بياناتك بنجاح، هنتواصل معاك قريبًا 🌱', true);
        form.reset();
      } else {
        showMsg(data.error || 'حصل خطأ، حاول تاني.', false);
      }
    } catch (err) {
      showMsg('تعذّر الاتصال بالسيرفر، تأكد إن الباك إند شغّال.', false);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'إرسال';
    }
  });

  function showMsg(text, ok) {
    msgEl.textContent = text;
    msgEl.className = 'form-msg show ' + (ok ? 'ok' : 'err');
  }
});
