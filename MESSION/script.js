// ========================================
// SMART CLASS MONITOR – MAIN SCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  setupSidebar();
  setupClock();
  setupDateLine();
  animateOnScroll();
  setupTasks();
  setupNotifications();
  setupSearch();
  setupRipple();
  setupNavItems();
});

// ========================================
// SIDEBAR – desktop collapse + mobile drawer
// ========================================

function setupSidebar() {
  const sidebar   = document.getElementById('sidebar');
  const toggle    = document.getElementById('sidebarToggle');
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const overlay   = document.getElementById('overlay');

  // Desktop: collapse/expand
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // Mobile: slide-in drawer
  mobileBtn.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
  });

  // Close drawer when overlay is clicked
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
  });

  // Clean up on resize
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    }
  });
}

// ========================================
// LIVE CLOCK
// ========================================

function setupClock() {
  const el = document.getElementById('clock-display');
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString('en-US', { hour12: true });
  };
  tick();
  setInterval(tick, 1000);
}

// ========================================
// DATE LINE
// ========================================

function setupDateLine() {
  const el = document.getElementById('date-line');
  el.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
}

// ========================================
// INTERSECTION OBSERVER – fade-in + count-up
// ========================================

function animateOnScroll() {
  const items = document.querySelectorAll('.stat-card, .card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');

        // Trigger count-up for stat numbers inside stat cards
        if (entry.target.classList.contains('stat-card')) {
          entry.target.querySelectorAll('[data-target]').forEach(countEl => countUp(countEl));
        }

        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  items.forEach(el => observer.observe(el));

  // Animate donut after a short delay
  setTimeout(animateDonut, 600);
}

// ========================================
// COUNT-UP ANIMATION
// ========================================

function countUp(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 900;
  const startTime = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    el.textContent = Math.floor(easeOut(progress) * target);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target;
    }
  };

  requestAnimationFrame(step);
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

// ========================================
// DONUT CHART ANIMATION (fixed)
// ========================================

function animateDonut() {
  const circle = document.getElementById('donutFill');
  const pctEl  = document.getElementById('donutPct');
  if (!circle || !pctEl) return;

  const circumference = 2 * Math.PI * 50; // 314.16
  const targetPct    = 75;
  const targetOffset = circumference * (1 - targetPct / 100);

  // Animate the SVG stroke
  circle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)';
  circle.style.strokeDashoffset = targetOffset;

  // Animate the percentage text
  const duration = 1200;
  const startTime = performance.now();
  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    pctEl.textContent = Math.round(easeOut(progress) * targetPct) + '%';
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ========================================
// TASKS – checkbox toggle + add task
// ========================================

function setupTasks() {
  // Wire up existing checkboxes
  wireCheckboxes(document.querySelectorAll('.task-check'));

  // Add Task button
  const addBtn   = document.getElementById('addTaskBtn');
  const input    = document.getElementById('newTaskInput');
  const topBtn   = document.getElementById('newTaskBtn');

  addBtn.addEventListener('click', addTask);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

  // "New Task" header button scrolls to and focuses the input
  topBtn.addEventListener('click', () => {
    input.focus();
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  function addTask() {
    const val = input.value.trim();
    if (!val) { input.focus(); return; }

    const id  = 'task-' + Date.now();
    const row = document.createElement('div');
    row.className = 'task-row';
    row.dataset.status = 'pending';
    row.innerHTML = `
      <div class="task-left">
        <input type="checkbox" class="task-check" id="${id}">
        <label class="task-label" for="${id}"></label>
        <div class="task-info">
          <h4>${escHtml(val)}</h4>
          <p>Added just now</p>
        </div>
      </div>
      <span class="badge badge-pending">Pending</span>`;

    const list = document.getElementById('taskList');
    list.insertBefore(row, list.firstChild);

    // Wire the new checkbox
    wireCheckboxes(row.querySelectorAll('.task-check'));

    input.value = '';
    showToast(`"${val}" added`, 'success');
  }
}

function wireCheckboxes(checkboxes) {
  checkboxes.forEach(cb => {
    cb.addEventListener('change', function () {
      const row   = this.closest('.task-row');
      const badge = row.querySelector('.badge');
      row.classList.toggle('done-row', this.checked);
      badge.className  = this.checked ? 'badge badge-done' : 'badge badge-pending';
      badge.textContent = this.checked ? 'Done' : 'Pending';
      showToast('Task updated', 'success');
    });
  });
}

// ========================================
// NOTIFICATIONS
// ========================================

function setupNotifications() {
  const btn     = document.getElementById('notifBtn');
  const panel   = document.getElementById('notifPanel');
  const markAll = document.getElementById('markAllRead');

  btn.addEventListener('click', e => {
    e.stopPropagation();
    panel.classList.toggle('open');
  });

  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && e.target !== btn) {
      panel.classList.remove('open');
    }
  });

  markAll.addEventListener('click', () => {
    document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    const dot = btn.querySelector('.notif-dot');
    if (dot) dot.style.display = 'none';
    showToast('All notifications marked as read', 'info');
    panel.classList.remove('open');
  });
}

// ========================================
// SEARCH / FILTER TASKS
// ========================================

function setupSearch() {
  const input = document.getElementById('taskSearch');
  input.addEventListener('input', () => {
    const query = input.value.toLowerCase();
    document.querySelectorAll('#taskList .task-row').forEach(row => {
      const text = row.querySelector('h4').textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  });
}

// ========================================
// NAV ITEM ACTIVE STATE
// ========================================

function setupNavItems() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Close mobile drawer on nav click
      if (window.innerWidth < 768) {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
      }
    });
  });
}

// ========================================
// RIPPLE EFFECT
// ========================================

function setupRipple() {
  document.querySelectorAll('.btn-primary, .btn-add-task').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const r    = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);

      r.className = 'ripple';
      r.style.width  = r.style.height = size + 'px';
      r.style.left   = (e.clientX - rect.left - size / 2) + 'px';
      r.style.top    = (e.clientY - rect.top  - size / 2) + 'px';

      this.appendChild(r);
      setTimeout(() => r.remove(), 600);
    });
  });
}

// ========================================
// TOAST NOTIFICATION
// ========================================

let toastTimer;

function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  const icon  = toast.querySelector('i');

  msgEl.textContent = msg;
  toast.className   = type;
  toast.classList.add('show');
  icon.className    = type === 'success'
    ? 'fas fa-check-circle'
    : 'fas fa-info-circle';

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ========================================
// UTILITY – HTML escape
// ========================================

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ========================================
// CONSOLE SIGNATURE
// ========================================

console.log('%cSmartClass Monitor', 'font-size:20px;color:#6366f1;font-weight:bold;');
console.log('%cDashboard loaded ✨', 'color:#10b981;font-size:14px;');