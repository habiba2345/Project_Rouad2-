/* ===========================================================
   منطق صفحة "اتعلم الفرز": بطاقات الأنواع، أداة البحث،
   السحب والإفلات، الكويز، تحدي السبع أيام، نصيحة اليوم
=========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  renderWasteTypeGrid();
  setupLookupTool('lookupForm', 'lookupInput', 'lookupResult', 'lookupChips', true);
  setupLookupTool('askForm', 'askInput', 'askResult', null, false);
  setupDragAndDrop();
  setupQuiz();
  setupChallenge();
  setDailyTip();
});

/* ---------- 1) بطاقات أنواع المخلفات ---------- */
function renderWasteTypeGrid() {
  const grid = document.getElementById('wasteTypeGrid');
  if (!grid) return;
  grid.innerHTML = Object.values(WASTE_CATEGORIES).map(cat => `
    <div class="waste-card" style="--cat-color:${cat.color}">
      <span class="emoji">${cat.emoji}</span>
      <h4>${cat.name}</h4>
      <p class="examples">${cat.examples}</p>
      <div class="tip">💡 ${cat.tip}</div>
    </div>
  `).join('');
}

/* ---------- 2) أداة "المخلف ده يتحط فين؟" / اسأل رواد البيئة ---------- */
function findWasteItem(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return WASTE_ITEMS.find(item => item.name.toLowerCase().includes(q) || q.includes(item.name.toLowerCase()));
}

function renderLookupAnswer(resultEl, query) {
  const item = findWasteItem(query);
  resultEl.classList.add('show');
  if (item) {
    const cat = WASTE_CATEGORIES[item.category];
    resultEl.classList.remove('notfound');
    resultEl.classList.add('found');
    resultEl.innerHTML = `
      <strong>${item.emoji} ${item.name}</strong> — النوع: <strong>${cat.emoji} ${cat.name}</strong><br>
      ${item.advice}`;
  } else {
    resultEl.classList.remove('found');
    resultEl.classList.add('notfound');
    resultEl.innerHTML = `مفيش عندنا معلومة مؤكدة عن «${query}» دلوقتي، وبعض المخلفات بتختلف حسب نظام الجمع المتاح في منطقتك. جرّب تتأكد من الجهة المسؤولة عن جمع المخلفات عندك، أو اكتب اسم مخلف تاني.`;
  }
}

function setupLookupTool(formId, inputId, resultId, chipsId, withChips) {
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);
  const resultEl = document.getElementById(resultId);
  if (!form || !input || !resultEl) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!input.value.trim()) return;
    renderLookupAnswer(resultEl, input.value);
  });

  if (withChips) {
    const chipsEl = document.getElementById(chipsId);
    if (chipsEl) {
      chipsEl.innerHTML = WASTE_ITEMS.slice(0, 6).map(item =>
        `<button type="button" class="chip" data-name="${item.name}">${item.emoji} ${item.name}</button>`
      ).join('');
      chipsEl.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
          input.value = chip.dataset.name;
          renderLookupAnswer(resultEl, chip.dataset.name);
        });
      });
    }
  }
}

/* ---------- 3) لعبة السحب والإفلات ---------- */
function setupDragAndDrop() {
  const itemsEl = document.getElementById('dndItems');
  const targetsEl = document.getElementById('dndTargets');
  const statusEl = document.getElementById('dndStatus');
  if (!itemsEl || !targetsEl) return;

  // نختار عينة من المخلفات لكل فئة موجودة
  const chosen = [];
  const seenCats = new Set();
  WASTE_ITEMS.forEach(item => {
    if (!seenCats.has(item.category)) { chosen.push(item); seenCats.add(item.category); }
  });
  // أضف عنصرين إضافيين للتنويع
  chosen.push(WASTE_ITEMS.find(i => i.name === 'جريدة'));
  chosen.push(WASTE_ITEMS.find(i => i.name === 'علبة كونسروة'));

  itemsEl.innerHTML = chosen.map((item, i) => `
    <div class="dnd-item" draggable="true" data-category="${item.category}" data-id="dnd-${i}">
      <span>${item.emoji}</span><span>${item.name}</span>
    </div>`).join('');

  targetsEl.innerHTML = Object.entries(WASTE_CATEGORIES).map(([key, cat]) => `
    <div class="dnd-target" data-category="${key}">
      <span style="font-size:1.6rem">${cat.emoji}</span>
      <h5>${cat.name}</h5>
      <div class="placed-emojis"></div>
    </div>`).join('');

  let placedCount = 0;
  const totalItems = chosen.length;
  let draggedEl = null;

  itemsEl.querySelectorAll('.dnd-item').forEach(item => {
    item.addEventListener('dragstart', () => { draggedEl = item; item.classList.add('dragging'); });
    item.addEventListener('dragend', () => item.classList.remove('dragging'));
  });

  targetsEl.querySelectorAll('.dnd-target').forEach(target => {
    target.addEventListener('dragover', e => { e.preventDefault(); target.classList.add('over'); });
    target.addEventListener('dragleave', () => target.classList.remove('over'));
    target.addEventListener('drop', e => {
      e.preventDefault();
      target.classList.remove('over');
      if (!draggedEl) return;
      const correct = draggedEl.dataset.category === target.dataset.category;
      if (correct) {
        target.querySelector('.placed-emojis').textContent += draggedEl.querySelector('span').textContent + ' ';
        draggedEl.classList.add('placed');
        placedCount++;
        statusEl.style.color = 'var(--ok)';
        statusEl.textContent = `أحسنت! (${placedCount}/${totalItems})`;
        if (placedCount === totalItems) {
          statusEl.textContent = 'أحسنت! أنت جاهز تبدأ الفرز في بيتك ♻️';
        }
      } else {
        statusEl.style.color = 'var(--danger)';
        statusEl.textContent = 'مش النوع الصح، حاول تاني 🙂';
      }
    });
  });
}

/* ---------- 4) الكويز ---------- */
function setupQuiz() {
  const box = document.getElementById('quizBox');
  if (!box) return;
  let current = 0;
  let score = 0;

  function renderQuestion() {
    const total = QUIZ_QUESTIONS.length;
    if (current >= total) {
      renderResult();
      return;
    }
    const q = QUIZ_QUESTIONS[current];
    box.innerHTML = `
      <div class="quiz-progress"><div class="quiz-progress-bar" style="width:${(current / total) * 100}%"></div></div>
      <div class="quiz-question">${current + 1}. ${q.q}</div>
      <div class="quiz-options">
        ${q.options.map((opt, i) => `<button class="quiz-option" data-i="${i}">${opt}</button>`).join('')}
      </div>
      <div class="quiz-feedback" id="quizFeedback"></div>
    `;
    box.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        if (box.dataset.answered === 'true') return;
        box.dataset.answered = 'true';
        const i = parseInt(btn.dataset.i, 10);
        const feedback = document.getElementById('quizFeedback');
        if (i === q.correct) {
          btn.classList.add('correct');
          score++;
          feedback.style.color = 'var(--ok)';
        } else {
          btn.classList.add('wrong');
          box.querySelectorAll('.quiz-option')[q.correct].classList.add('correct');
          feedback.style.color = 'var(--danger)';
        }
        feedback.textContent = q.explain;
        setTimeout(() => {
          current++;
          box.dataset.answered = 'false';
          renderQuestion();
        }, 1600);
      });
    });
  }

  function renderResult() {
    const total = QUIZ_QUESTIONS.length;
    box.innerHTML = `
      <div class="quiz-result">
        <div class="quiz-progress"><div class="quiz-progress-bar" style="width:100%"></div></div>
        <h3>🎉 مبروك! خلصت أساسيات الفرز.</h3>
        <p>نتيجتك: ${score} من ${total}</p>
        <div class="badge">🌱 رائد بيئي مبتدئ</div>
        <br><br>
        <button class="btn btn-outline" id="quizRetry">أعد الاختبار</button>
      </div>`;
    document.getElementById('quizRetry').addEventListener('click', () => {
      current = 0; score = 0; renderQuestion();
    });
  }

  box.dataset.answered = 'false';
  renderQuestion();
}

/* ---------- 5) تحدي السبع أيام ---------- */
function setupChallenge() {
  const listEl = document.getElementById('challengeList');
  const progressEl = document.getElementById('challengeProgress');
  if (!listEl) return;

  const STORAGE_KEY = 'rowad_challenge_progress';
  let progress = [];
  try { progress = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { progress = []; }

  function render() {
    listEl.innerHTML = CHALLENGE_DAYS.map((day, i) => `
      <div class="day-item ${progress.includes(i) ? 'done' : ''}" data-i="${i}">
        <span class="check">${progress.includes(i) ? '✓' : ''}</span>
        <div><strong>${day.title}</strong> — ${day.desc}</div>
      </div>`).join('');
    const pct = Math.round((progress.length / CHALLENGE_DAYS.length) * 100);
    progressEl.style.width = pct + '%';

    listEl.querySelectorAll('.day-item').forEach(el => {
      el.addEventListener('click', () => {
        const i = parseInt(el.dataset.i, 10);
        if (progress.includes(i)) {
          progress = progress.filter(x => x !== i);
        } else {
          progress.push(i);
        }
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (e) {}
        render();
      });
    });
  }
  render();
}

/* ---------- 6) نصيحة اليوم ---------- */
function setDailyTip() {
  const el = document.getElementById('dailyTipText');
  if (!el) return;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  el.textContent = DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}
