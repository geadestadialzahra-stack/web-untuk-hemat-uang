/**
 * app.js — Expense & Budget Visualizer v3
 * Selalu mulai dari BERANDA setiap kali dibuka.
 */

'use strict';

/* ================================================================
   BAGIAN 1 — KONSTANTA & STATE
   ================================================================ */

const STORAGE_KEYS = {
  TRANSACTIONS: 'ebv_transactions',
  CATEGORIES:   'ebv_categories',
  BUDGET:       'ebv_budget',
  THEME:        'ebv_theme',
};

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

const CHART_COLORS = [
  '#6c63ff', '#43c59e', '#f59e0b',
  '#f05252', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316',
  '#84cc16', '#06b6d4', '#a855f7',
];

/* Daftar makanan untuk AI Assistant */
const FOOD_SUGGESTIONS = [
  { name: 'Ayam Geprek', price: 15000 },
  { name: 'Nasi Uduk', price: 10000 },
  { name: 'Mie Ayam', price: 12000 },
  { name: 'Nasi Padang', price: 20000 },
  { name: 'Roti Bakar', price: 8000 },
  { name: 'Mie Instan', price: 5000 },
  { name: 'Nasi Goreng', price: 14000 },
  { name: 'Bakso', price: 13000 },
];

const state = {
  transactions: [],
  customCategories: [],
  budget: 0,
  theme: 'light',
};

/* ================================================================
   BAGIAN 2 — UTILITAS
   ================================================================ */

function formatRupiah(value) {
  return 'Rp ' + Math.abs(Math.round(value)).toLocaleString('id-ID');
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getCategoryColor(index) {
  return CHART_COLORS[index % CHART_COLORS.length];
}

function getTotalExpense() {
  return state.transactions.reduce((sum, t) => sum + t.amount, 0);
}

function getExpenseByCategory() {
  return state.transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getDaysInMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();
}

function getDaysLeftInMonth() {
  const d = new Date();
  const total = getDaysInMonth();
  return total - d.getDate() + 1;
}

function getTodayExpense() {
  const todayKey = getTodayKey();
  return state.transactions.reduce((sum, t) => {
    const txKey = t.date.slice(0, 10);
    return txKey === todayKey ? sum + t.amount : sum;
  }, 0);
}

function getDailyAllowance() {
  if (state.budget <= 0) return 0;
  const totalSpent = getTotalExpense();
  const sisa = Math.max(state.budget - totalSpent, 0);
  const daysLeft = getDaysLeftInMonth();
  return daysLeft > 0 ? sisa / daysLeft : 0;
}

function getInitialDailyAllocation() {
  if (state.budget <= 0) return 0;
  return state.budget / getDaysInMonth();
}

/* ================================================================
   BAGIAN 3 — PERSISTENSI
   ================================================================ */

function saveToStorage() {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
  localStorage.setItem(STORAGE_KEYS.CATEGORIES,   JSON.stringify(state.customCategories));
  localStorage.setItem(STORAGE_KEYS.BUDGET,       JSON.stringify(state.budget));
  localStorage.setItem(STORAGE_KEYS.THEME,        state.theme);
}

function loadFromStorage() {
  try {
    const tx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (tx) state.transactions = JSON.parse(tx);
  } catch { state.transactions = []; }

  try {
    const cats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (cats) state.customCategories = JSON.parse(cats);
  } catch { state.customCategories = []; }

  try {
    const budget = localStorage.getItem(STORAGE_KEYS.BUDGET);
    if (budget !== null) state.budget = Number(JSON.parse(budget));
  } catch { state.budget = 0; }

  state.theme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
}

/* ================================================================
   BAGIAN 4 — DOM REFERENCES
   ================================================================ */
const dom = {
  landingPage:  document.getElementById('landingPage'),
  startAppBtn:  document.getElementById('startAppBtn'),
  appWrapper:   document.getElementById('appWrapper'),
  homeBtn:      document.getElementById('homeBtn'),
  html:         document.documentElement,
  themeToggle:  document.getElementById('themeToggle'),
  themeIcon:    document.getElementById('themeIcon'),
  totalAmount:  document.getElementById('totalAmount'),
  budgetDisplay: document.getElementById('budgetDisplay'),
  budgetProgressWrap: document.getElementById('budgetProgressWrap'),
  budgetProgressBar:  document.getElementById('budgetProgressBar'),
  budgetStatus: document.getElementById('budgetStatus'),
  budgetCard:   document.querySelector('.budget-card'),
  editBudgetBtn: document.getElementById('editBudgetBtn'),
  todayDate:        document.getElementById('todayDate'),
  dailyAllowance:   document.getElementById('dailyAllowance'),
  dailyProgressBar: document.getElementById('dailyProgressBar'),
  dailySpent:       document.getElementById('dailySpent'),
  dailyRemaining:   document.getElementById('dailyRemaining'),
  dailyCard:        document.querySelector('.daily-card:not(.info-card)'),
  monthLabel:       document.getElementById('monthLabel'),
  monthlyBudget:    document.getElementById('monthlyBudget'),
  monthlySpent:     document.getElementById('monthlySpent'),
  dailyAllocation:  document.getElementById('dailyAllocation'),
  daysLeft:         document.getElementById('daysLeft'),
  expenseForm:    document.getElementById('expenseForm'),
  itemName:       document.getElementById('itemName'),
  itemAmount:     document.getElementById('itemAmount'),
  itemCategory:   document.getElementById('itemCategory'),
  itemNameError:  document.getElementById('itemNameError'),
  itemAmountError:document.getElementById('itemAmountError'),
  itemCategoryError: document.getElementById('itemCategoryError'),
  newCategoryInput: document.getElementById('newCategoryInput'),
  addCategoryBtn:   document.getElementById('addCategoryBtn'),
  categoryTags:     document.getElementById('categoryTags'),
  categoryError:    document.getElementById('categoryError'),
  expenseChart:   document.getElementById('expenseChart'),
  chartEmptyMsg:  document.getElementById('chartEmptyMsg'),
  transactionList: document.getElementById('transactionList'),
  emptyMsg:        document.getElementById('emptyMsg'),
  clearAllBtn:     document.getElementById('clearAllBtn'),
  budgetModal:     document.getElementById('budgetModal'),
  budgetInput:     document.getElementById('budgetInput'),
  budgetInputError:document.getElementById('budgetInputError'),
  saveBudgetBtn:   document.getElementById('saveBudgetBtn'),
  cancelBudgetBtn: document.getElementById('cancelBudgetBtn'),
  warningModal:    document.getElementById('warningModal'),
  warningTitle:    document.getElementById('warningTitle'),
  warningText:     document.getElementById('warningText'),
  warningOkBtn:    document.getElementById('warningOkBtn'),
  toast:           document.getElementById('toast'),
};

/* ================================================================
   BAGIAN 5 — CHART
   ================================================================ */
let chartInstance = null;

function renderChart() {
  const byCategory = getExpenseByCategory();
  const labels  = Object.keys(byCategory);
  const data    = Object.values(byCategory);
  const isEmpty = labels.length === 0;

  dom.chartEmptyMsg.classList.toggle('visible', isEmpty);

  const allCategories = getAllCategories();
  const colors = labels.map(label => {
    const idx = allCategories.indexOf(label);
    return getCategoryColor(idx >= 0 ? idx : 0);
  });

  if (isEmpty) {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    return;
  }

  const isDark = dom.html.getAttribute('data-theme') === 'dark';

  const config = {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: isDark ? 'rgba(26,29,46,0.8)' : 'rgba(255,255,255,0.9)',
        borderWidth: 3,
        hoverOffset: 10,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 14,
            boxWidth: 12,
            boxHeight: 12,
            font: { size: 12, family: "'Segoe UI', sans-serif" },
            color: isDark ? '#9ea3c0' : '#6b7280',
          },
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct   = ((ctx.parsed / total) * 100).toFixed(1);
              return `  ${ctx.label}: ${formatRupiah(ctx.parsed)} (${pct}%)`;
            },
          },
        },
      },
      animation: { animateRotate: true, duration: 500 },
    },
  };

  if (chartInstance) {
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = data;
    chartInstance.data.datasets[0].backgroundColor = colors;
    chartInstance.data.datasets[0].borderColor = config.data.datasets[0].borderColor;
    chartInstance.options.plugins.legend.labels.color = config.options.plugins.legend.labels.color;
    chartInstance.update();
  } else {
    chartInstance = new Chart(dom.expenseChart, config);
  }
}

/* ================================================================
   BAGIAN 6 — RENDER UI
   ================================================================ */

function getAllCategories() {
  return [...DEFAULT_CATEGORIES, ...state.customCategories];
}

function renderCategorySelect() {
  const current = dom.itemCategory.value;
  const categories = getAllCategories();
  dom.itemCategory.innerHTML = categories
    .map(cat => `<option value="${cat}">${cat}</option>`)
    .join('');
  if (categories.includes(current)) dom.itemCategory.value = current;
}

function renderCategoryTags() {
  const allCats = getAllCategories();
  dom.categoryTags.innerHTML = allCats.map((cat, idx) => {
    const isDefault = DEFAULT_CATEGORIES.includes(cat);
    return `
      <span class="category-tag${isDefault ? ' default-tag' : ''}">
        <span class="tag-dot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${getCategoryColor(idx)};margin-right:2px;"></span>
        ${escapeHtml(cat)}
        <button class="tag-remove-btn" data-category="${escapeHtml(cat)}" ${isDefault ? 'tabindex="-1"' : ''}>✕</button>
      </span>`;
  }).join('');
}

function renderSummary() {
  const total = getTotalExpense();
  dom.totalAmount.textContent = formatRupiah(total);

  const sisa = Math.max(state.budget - total, 0);
  dom.budgetDisplay.textContent = state.budget > 0 ? formatRupiah(sisa) : 'Rp 0';

  if (state.budget > 0) {
    const pct = Math.min((total / state.budget) * 100, 100);
    dom.budgetProgressWrap.classList.add('visible');
    dom.budgetProgressBar.style.width = pct + '%';

    if (total > state.budget) {
      const excess = formatRupiah(total - state.budget);
      dom.budgetStatus.textContent = `⚠️ Melebihi uang bulanan ${excess}!`;
      dom.budgetStatus.className = 'budget-status over';
      dom.budgetProgressBar.classList.add('over-limit');
      dom.budgetCard.classList.remove('over-budget');
      void dom.budgetCard.offsetWidth;
      dom.budgetCard.classList.add('over-budget');
    } else {
      dom.budgetStatus.textContent = `Sisa dari uang bulanan: ${formatRupiah(sisa)}`;
      dom.budgetStatus.className = 'budget-status';
      dom.budgetProgressBar.classList.remove('over-limit');
      dom.budgetCard.classList.remove('over-budget');
    }
  } else {
    dom.budgetProgressWrap.classList.remove('visible');
    dom.budgetStatus.textContent = 'Belum diatur. Klik ✏️ Atur';
    dom.budgetCard.classList.remove('over-budget');
  }
}

function renderDaily() {
  const today = new Date();
  const todayStr = today.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const monthStr = today.toLocaleDateString('id-ID', {
    month: 'long', year: 'numeric',
  });

  dom.todayDate.textContent = todayStr;
  dom.monthLabel.textContent = monthStr;

  const allowance = getDailyAllowance();
  const todaySpent = getTodayExpense();
  const remaining = Math.max(allowance - todaySpent, 0);

  dom.dailyAllowance.textContent = state.budget > 0
    ? formatRupiah(allowance)
    : 'Atur uang bulanan dulu';
  dom.dailySpent.textContent = formatRupiah(todaySpent);
  dom.dailyRemaining.textContent = state.budget > 0 ? formatRupiah(remaining) : '—';

  if (allowance > 0) {
    const pct = Math.min((todaySpent / allowance) * 100, 100);
    dom.dailyProgressBar.style.width = pct + '%';
    dom.dailyProgressBar.classList.remove('warning', 'danger');
    dom.dailyCard.classList.remove('warning-state', 'danger-state');

    if (todaySpent > allowance) {
      dom.dailyProgressBar.classList.add('danger');
      dom.dailyCard.classList.add('danger-state');
    } else if (pct >= 75) {
      dom.dailyProgressBar.classList.add('warning');
      dom.dailyCard.classList.add('warning-state');
    }
  } else {
    dom.dailyProgressBar.style.width = '0%';
    dom.dailyProgressBar.classList.remove('warning', 'danger');
    dom.dailyCard.classList.remove('warning-state', 'danger-state');
  }

  dom.monthlyBudget.textContent = formatRupiah(state.budget);
  dom.monthlySpent.textContent = formatRupiah(getTotalExpense());
  dom.dailyAllocation.textContent = state.budget > 0
    ? formatRupiah(getInitialDailyAllocation())
    : 'Rp 0';
  dom.daysLeft.textContent = getDaysLeftInMonth() + ' hari';
}

function createTransactionElement(transaction, categoryIndex) {
  const li = document.createElement('li');
  li.className = 'transaction-item';
  li.dataset.id = transaction.id;

  const dotColor = getCategoryColor(categoryIndex);

  li.innerHTML = `
    <span class="transaction-dot" style="background:${dotColor};"></span>
    <div class="transaction-info">
      <p class="transaction-name" title="${escapeHtml(transaction.name)}">${escapeHtml(transaction.name)}</p>
      <p class="transaction-meta">${escapeHtml(transaction.category)} · ${formatDate(transaction.date)}</p>
    </div>
    <span class="transaction-amount">-${formatRupiah(transaction.amount)}</span>
    <button class="delete-btn" data-id="${transaction.id}">🗑</button>`;

  return li;
}

function renderTransactionList() {
  const isEmpty = state.transactions.length === 0;
  dom.emptyMsg.classList.toggle('visible', isEmpty);
  dom.clearAllBtn.style.display = isEmpty ? 'none' : '';

  const allCats = getAllCategories();
  const fragment = document.createDocumentFragment();

  [...state.transactions].reverse().forEach(tx => {
    const catIdx = allCats.indexOf(tx.category);
    fragment.appendChild(createTransactionElement(tx, catIdx >= 0 ? catIdx : 0));
  });

  dom.transactionList.innerHTML = '';
  dom.transactionList.appendChild(fragment);
}

function renderAll() {
  renderSummary();
  renderDaily();
  renderTransactionList();
  renderChart();
  renderCategoryTags();
  renderCategorySelect();
}

/* ================================================================
   BAGIAN 7 — VALIDASI FORM
   ================================================================ */

function clearFormErrors() {
  dom.itemName.classList.remove('invalid');
  dom.itemAmount.classList.remove('invalid');
  dom.itemCategory.classList.remove('invalid');
  dom.itemNameError.textContent = '';
  dom.itemAmountError.textContent = '';
  dom.itemCategoryError.textContent = '';
}

function validateForm() {
  clearFormErrors();
  let isValid = true;

  const name   = dom.itemName.value.trim();
  const amount = dom.itemAmount.value.trim();
  const category = dom.itemCategory.value;

  if (!name) {
    dom.itemName.classList.add('invalid');
    dom.itemNameError.textContent = 'Nama barang wajib diisi.';
    isValid = false;
  } else if (name.length > 100) {
    dom.itemName.classList.add('invalid');
    dom.itemNameError.textContent = 'Maks. 100 karakter.';
    isValid = false;
  }

  if (!amount) {
    dom.itemAmount.classList.add('invalid');
    dom.itemAmountError.textContent = 'Jumlah wajib diisi.';
    isValid = false;
  } else if (isNaN(Number(amount)) || Number(amount) <= 0) {
    dom.itemAmount.classList.add('invalid');
    dom.itemAmountError.textContent = 'Harus angka > 0.';
    isValid = false;
  } else if (Number(amount) > 1_000_000_000) {
    dom.itemAmount.classList.add('invalid');
    dom.itemAmountError.textContent = 'Maks. Rp 1.000.000.000.';
    isValid = false;
  }

  if (!category) {
    dom.itemCategory.classList.add('invalid');
    dom.itemCategoryError.textContent = 'Pilih kategori.';
    isValid = false;
  }

  return isValid;
}

/* ================================================================
   BAGIAN 8 — CRUD TRANSAKSI + SMART WARNING
   ================================================================ */

function addTransaction(name, amount, category) {
  const tx = {
    id:       generateId(),
    name:     name.trim(),
    amount:   Number(amount),
    category,
    date:     new Date().toISOString(),
  };

  state.transactions.push(tx);
  saveToStorage();
  renderAll();

  showToast(`"${name}" ditambahkan!`, 'success');

  const allowance = getDailyAllowance();
  const spentToday = getTodayExpense();

  if (allowance > 0 && spentToday > allowance) {
    const over = spentToday - allowance;
    const percent = ((spentToday / allowance) * 100).toFixed(0);
    showBorosWarning(over, percent);
    showToast(`⚠️ Over jatah harian ${formatRupiah(over)}!`, 'warning');
  } else if (allowance > 0 && spentToday > allowance * 0.8) {
    showToast(`⚠️ Hati-hati, sudah ${((spentToday/allowance)*100).toFixed(0)}% dari jatah harian`, 'warning');
  }

  if (state.budget > 0 && getTotalExpense() > state.budget) {
    const over = getTotalExpense() - state.budget;
    setTimeout(() => {
      showToast(`🚨 Uang bulanan habis! Lebih ${formatRupiah(over)}`, 'error', 4000);
    }, 1500);
  }
}

function showBorosWarning(overAmount, percent) {
  dom.warningTitle.textContent = 'Kamu Sudah Terlalu Boros! 🚨';
  dom.warningText.innerHTML = `
    Pengeluaran jajan hari ini <strong>${percent}%</strong> dari jatah harian.<br/>
    Kamu sudah melebihi jatah sebesar <strong style="color:#f05252">${formatRupiah(overAmount)}</strong>.<br/><br/>
    Uang bulananmu otomatis dipotong untuk menutup keborosan ini.
    Sisa uang bulanan akan berkurang dan jatah harian besok menyesuaikan.
  `;
  dom.warningModal.hidden = false;
}

function deleteTransaction(id) {
  const li = dom.transactionList.querySelector(`[data-id="${id}"]`);

  if (li) {
    li.classList.add('removing');
    li.addEventListener('animationend', () => {
      state.transactions = state.transactions.filter(t => t.id !== id);
      saveToStorage();
      renderAll();
      showToast('Transaksi dihapus.', 'error');
    }, { once: true });
  } else {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveToStorage();
    renderAll();
  }
}

function clearAllTransactions() {
  if (state.transactions.length === 0) return;
  if (!window.confirm('Yakin ingin menghapus semua transaksi? Tindakan ini tidak dapat dibatalkan.')) return;

  state.transactions = [];
  saveToStorage();
  renderAll();
  showToast('Semua transaksi dihapus.', 'error');
}

/* ================================================================
   BAGIAN 9 — KATEGORI
   ================================================================ */

function addCustomCategory() {
  const rawName = dom.newCategoryInput.value.trim();
  dom.categoryError.textContent = '';

  if (!rawName) {
    dom.categoryError.textContent = 'Nama kategori tidak boleh kosong.';
    dom.newCategoryInput.focus();
    return;
  }

  const name = rawName;
  const allCats = getAllCategories();
  if (allCats.some(c => c.toLowerCase() === name.toLowerCase())) {
    dom.categoryError.textContent = `Kategori "${name}" sudah ada.`;
    return;
  }

  if (name.length > 30) {
    dom.categoryError.textContent = 'Maks. 30 karakter.';
    return;
  }

  state.customCategories.push(name);
  saveToStorage();
  dom.newCategoryInput.value = '';
  renderCategoryTags();
  renderCategorySelect();
  showToast(`Kategori "${name}" ditambahkan.`, 'success');
}

function removeCustomCategory(categoryName) {
  if (DEFAULT_CATEGORIES.includes(categoryName)) return;

  const usedInTx = state.transactions.some(t => t.category === categoryName);
  if (usedInTx) {
    showToast(`Kategori "${categoryName}" masih dipakai.`, 'warning');
    return;
  }

  state.customCategories = state.customCategories.filter(c => c !== categoryName);
  saveToStorage();
  renderCategoryTags();
  renderCategorySelect();
  showToast(`Kategori "${categoryName}" dihapus.`, 'error');
}

/* ================================================================
   BAGIAN 10 — BUDGET
   ================================================================ */

function openBudgetModal() {
  dom.budgetInput.value = state.budget > 0 ? state.budget : '';
  dom.budgetInputError.textContent = '';
  dom.budgetModal.hidden = false;
  setTimeout(() => dom.budgetInput.focus(), 100);
}

function closeBudgetModal() {
  dom.budgetModal.hidden = true;
}

function saveBudget() {
  const val = dom.budgetInput.value.trim();
  dom.budgetInputError.textContent = '';

  if (val === '' || Number(val) < 0) {
    dom.budgetInputError.textContent = 'Masukkan angka valid (0 untuk nonaktifkan).';
    dom.budgetInput.focus();
    return;
  }

  state.budget = Number(val);
  saveToStorage();
  closeBudgetModal();
  renderAll();
  showToast(
    state.budget > 0
      ? `Uang bulanan: ${formatRupiah(state.budget)} · Jatah/hari: ${formatRupiah(getInitialDailyAllocation())}`
      : 'Uang bulanan dinonaktifkan.',
    'success', 3500
  );
}

/* ================================================================
   BAGIAN 11 — TEMA
   ================================================================ */

function applyTheme(theme) {
  state.theme = theme;
  dom.html.setAttribute('data-theme', theme);
  dom.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  if (chartInstance) renderChart();
}

function toggleTheme() {
  applyTheme(state.theme === 'light' ? 'dark' : 'light');
  saveToStorage();
}

/* ================================================================
   BAGIAN 12 — TOAST
   ================================================================ */
let toastTimer = null;

function showToast(message, type = '', duration = 2800) {
  if (toastTimer) clearTimeout(toastTimer);

  dom.toast.textContent = message;
  dom.toast.className = `toast${type ? ' ' + type : ''}`;
  void dom.toast.offsetWidth;
  dom.toast.classList.add('show');

  toastTimer = setTimeout(() => {
    dom.toast.classList.remove('show');
  }, duration);
}

/* ================================================================
   BAGIAN 13 — SECURITY
   ================================================================ */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* ================================================================
   BAGIAN 14 — LANDING / APP SWITCH
   ================================================================ */

function showApp() {
  dom.landingPage.classList.add('hidden');
  dom.appWrapper.classList.remove('hidden');
  renderAll();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function showLanding() {
  dom.appWrapper.classList.add('hidden');
  dom.landingPage.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ================================================================
   BAGIAN 15 — EVENT LISTENERS
   ================================================================ */

function attachEventListeners() {
  dom.startAppBtn.addEventListener('click', showApp);
  dom.homeBtn.addEventListener('click', showLanding);

  dom.expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    addTransaction(
      dom.itemName.value,
      dom.itemAmount.value,
      dom.itemCategory.value,
    );

    dom.expenseForm.reset();
    clearFormErrors();
    dom.itemName.focus();
  });

  dom.itemName.addEventListener('input', () => {
    dom.itemName.classList.remove('invalid');
    dom.itemNameError.textContent = '';
  });
  dom.itemAmount.addEventListener('input', () => {
    dom.itemAmount.classList.remove('invalid');
    dom.itemAmountError.textContent = '';
  });

  dom.transactionList.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;
    const id = btn.dataset.id;
    if (id) deleteTransaction(id);
  });

  dom.clearAllBtn.addEventListener('click', clearAllTransactions);

  dom.addCategoryBtn.addEventListener('click', addCustomCategory);
  dom.newCategoryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addCustomCategory(); }
  });
  dom.newCategoryInput.addEventListener('input', () => {
    dom.categoryError.textContent = '';
  });
  dom.categoryTags.addEventListener('click', (e) => {
    const btn = e.target.closest('.tag-remove-btn');
    if (!btn) return;
    const catName = btn.dataset.category;
    if (catName) removeCustomCategory(catName);
  });

  dom.editBudgetBtn.addEventListener('click', openBudgetModal);
  dom.saveBudgetBtn.addEventListener('click', saveBudget);
  dom.cancelBudgetBtn.addEventListener('click', closeBudgetModal);
  dom.budgetModal.addEventListener('click', (e) => {
    if (e.target === dom.budgetModal) closeBudgetModal();
  });
  dom.budgetInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveBudget();
    if (e.key === 'Escape') closeBudgetModal();
  });

  dom.warningOkBtn.addEventListener('click', () => {
    dom.warningModal.hidden = true;
  });
  dom.warningModal.addEventListener('click', (e) => {
    if (e.target === dom.warningModal) dom.warningModal.hidden = true;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!dom.budgetModal.hidden) closeBudgetModal();
      if (!dom.warningModal.hidden) dom.warningModal.hidden = true;
    }
  });

  dom.themeToggle.addEventListener('click', toggleTheme);
}

/* ================================================================
   BAGIAN 16 — INIT
   ================================================================ */

function init() {
  loadFromStorage();
  applyTheme(state.theme);
  attachEventListeners();
  renderAll();

  // ── SELALU tampilkan BERANDA saat pertama buka / refresh ──
  dom.appWrapper.classList.add('hidden');
  dom.landingPage.classList.remove('hidden');

  console.log('%c💰 Expense & Budget Visualizer v3 — by GEA DESTADIA AL-ZAHRA', 'color:#6c63ff;font-weight:bold;font-size:14px;');
  console.log('%c🏠 Selalu mulai dari beranda. Klik "Mulai Sekarang" untuk masuk.', 'color:#43c59e;font-weight:bold;');
}

document.addEventListener('DOMContentLoaded', init);