import { SUBJECTS, LESSONS } from './catalog.js';
import { createAttendance } from './attendance.js';

const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const LOGIN_URL = '../Đăng Nhập/dang-nhap.html';

const PAGE_URLS = Object.fromEntries([
  ['learning','learning'], ['roadmap','roadmap'], ['progress','progress'],
  ['teachers','teacher'], ['forum','forum'], ['ai','ai'],
  ['planner','planner'], ['challenge','challenge'], ['lab','lab']
].map(([key, route])=>[key, window.QurioRoute?.url(route)]));

export function todayVN(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const value = type =>
    parts.find(part => part.type === type).value;

  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function normalizeSearch(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function formatDay(value, long = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
    return 'Chưa đặt ngày';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: long ? 'long' : 'numeric',
    ...(long ? { year: 'numeric' } : {})
  }).format(new Date(value + 'T05:00:00Z'));
}

function createApp() {
  const $ = id => document.getElementById(id);

  const state = {
    user: null,
    authenticated: false,
    today: todayVN(),
    month: todayVN().slice(0, 7),
    records: {},
    attendanceCache: {},
    goals: [],
    completedLessons: [],
    ready: true
  };

  const dialog = $('mainDialog');
  const dialogBody = $('dialogBody');

  let calendar;
  let toastTimer;
  let dialogReturnFocus;
  let initialization = false;

  let operationQueue = Promise.resolve();
  let calendarNavigation = 0;
  let pendingMonth = null;
  let dayReconciliation = false;
  let observedDay = todayVN();

  let searchActions = [];
  let readNotifications = new Set();

  function node(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }

  function button(
    text,
    action,
    className = 'secondary-button'
  ) {
    const element = node('button', className, text);
    element.type = 'button';
    element.addEventListener('click', action);
    return element;
  }

  function setText(id, text) {
    if ($(id)) {
      $(id).textContent = text;
    }
  }

  function toast(text, error = false) {
    const element = $('toast');
    if (!element) return;

    clearTimeout(toastTimer);

    element.textContent = text;
    element.classList.toggle('is-error', error);
    element.hidden = false;

    toastTimer = setTimeout(() => {
      element.hidden = true;
    }, 5000);
  }

  async function run(task, control) {
    if (control?.disabled) return;

    if (control) {
      control.disabled = true;
      control.setAttribute('aria-busy', 'true');
    }

    try {
      return await task();
    } catch (error) {
      toast(
        error.message ||
        'Chưa thực hiện được yêu cầu. Vui lòng thử lại.',
        true
      );
    } finally {
      if (control) {
        control.disabled = false;
        control.removeAttribute('aria-busy');
      }
    }
  }

  function schedule(task) {
    const work = operationQueue.then(task);

    operationQueue = work.catch(() => {});

    return work;
  }

  function requireLogin(
    message = 'Đăng nhập để lưu dữ liệu học tập của bạn.'
  ) {
    if (state.authenticated) return true;

    toast(message);
    return false;
  }

  async function request(action, data = {}) {
    if (!state.authenticated) {
      throw new Error(
        'Bạn cần đăng nhập để thực hiện thao tác này.'
      );
    }

    if (!window.QurioAuth?.request) {
      throw new Error(
        'Chưa kết nối được dữ liệu trang chủ. Vui lòng thử lại sau.'
      );
    }

    return window.QurioAuth.request(action, data);
  }

  function merge(data, month) {
    if (
      !data ||
      !Array.isArray(data.goals) ||
      !Array.isArray(data.completedLessons) ||
      typeof data.attendance !== 'object'
    ) {
      throw new Error(
        'Dữ liệu học tập chưa sẵn sàng. Vui lòng thử lại.'
      );
    }

    if (data.user?.id !== state.user?.id) {
      throw new Error(
        'Tài khoản đã thay đổi. Vui lòng tải lại trang.'
      );
    }

    state.today = data.today;
    state.goals = data.goals;

    state.completedLessons = data.completedLessons.filter(
      item => LESSONS.some(
        lesson => lesson.id === item.lessonId
      )
    );

    state.attendanceCache[month] = data.attendance || {};

    if (month === state.month) {
      state.records = data.attendance || {};
    }
  }

  async function refreshNow(updateCalendar = true) {
    const month = state.month;

    const data = await request('dashboard', { month });

    merge(data, month);
    render();

    if (
      updateCalendar &&
      pendingMonth === null &&
      !dayReconciliation
    ) {
      calendar?.update({
        today: state.today,
        month: state.month,
        records: state.records
      });
    }

    return data;
  }

  function applyGoalResult(action, data, result) {
    if (action === 'deleteGoal') {
      state.goals = state.goals.filter(
        goal => goal.id !== data.id
      );
    } else if (
      result.goal &&
      typeof result.goal.id === 'string'
    ) {
      const index = state.goals.findIndex(
        goal => goal.id === result.goal.id
      );

      if (index < 0) {
        state.goals.unshift(result.goal);
      } else {
        state.goals[index] = result.goal;
      }
    }

    render();
  }

  function changeGoal(action, data) {
    return schedule(async () => {
      const result = await request(action, data);

      applyGoalResult(action, data, result);

      try {
        await refreshNow();

        return {
          result,
          syncError: null
        };
      } catch (syncError) {
        return {
          result,
          syncError
        };
      }
    });
  }

  function showSyncIssue(outcome) {
    if (!outcome.syncError) return false;

    toast(
      'Đã lưu thay đổi. Chưa tải lại được dữ liệu; bạn có thể tải lại trang sau.',
      true
    );

    return true;
  }

  function reconcileDay() {
    const day = todayVN();

    if (!state.authenticated) {
      if (day !== observedDay) {
        observedDay = day;
        state.today = day;
        state.month = day.slice(0, 7);
        state.records = {};
        state.attendanceCache = {};

        render();

        calendar?.update({
          today: day,
          month: state.month,
          records: {},
          disabled: false
        });
      }

      return;
    }

    if (
      !state.ready ||
      initialization ||
      dayReconciliation ||
      day === observedDay
    ) {
      return;
    }

    dayReconciliation = true;
    calendarNavigation++;
    pendingMonth = null;

    calendar?.update({ disabled: true });

    schedule(async () => {
      try {
        let month = day.slice(0, 7);
        let data = await request('dashboard', { month });

        if (data.today?.slice(0, 7) !== month) {
          month = data.today.slice(0, 7);
          data = await request('dashboard', { month });
        }

        state.month = month;
        merge(data, month);

        observedDay = day;

        render();

        calendar?.update({
          today: state.today,
          month: state.month,
          records: state.records,
          disabled: false
        });
      } catch (error) {
        calendar?.update({ disabled: false });

        toast(
          error.message ||
          'Chưa cập nhật được ngày mới. Bạn thử tải lại trang nhé.',
          true
        );
      } finally {
        dayReconciliation = false;
      }
    });
  }

  function empty(text, actionLabel, action) {
    const box = node('div', 'empty-state');

    box.append(node('p', '', text));

    if (actionLabel && action) {
      box.append(
        button(actionLabel, action, 'text-button')
      );
    }

    return box;
  }

  function closeDialog() {
    if (
      dialog?.open &&
      typeof dialog.close === 'function'
    ) {
      dialog.close();
    } else {
      dialog?.removeAttribute('open');
    }

    if (dialogReturnFocus?.isConnected) {
      dialogReturnFocus.focus();
    }
  }

  function openDialog(title, content) {
    hidePopovers();

    if (!dialog.open) {
      dialogReturnFocus = document.activeElement;
    }

    $('dialogTitle').textContent = title;
    dialogBody.replaceChildren();

    if (typeof content === 'string') {
      dialogBody.append(
        node('p', 'modal-lead', content)
      );
    } else if (content) {
      dialogBody.append(content);
    }

    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    }

    $('dialogClose')?.focus();
  }

  function hideSearch() {
    if ($('searchResults')) {
      $('searchResults').hidden = true;
    }

    $('searchInput')?.setAttribute(
      'aria-expanded',
      'false'
    );
  }

  function hidePopovers(except) {
    [
      ['profileMenu', 'profileToggle'],
      ['notificationPopover', 'notificationToggle']
    ].forEach(([panel, toggle]) => {
      if (panel !== except && $(panel)) {
        $(panel).hidden = true;

        $(toggle)?.setAttribute(
          'aria-expanded',
          'false'
        );
      }
    });

    if (except !== 'searchResults') {
      hideSearch();
    }
  }

  function sidebar(open) {
    $('sidebar')?.classList.toggle(
      'is-open',
      open
    );

    if ($('sidebarBackdrop')) {
      $('sidebarBackdrop').hidden = !open;
    }

    $('sidebarToggle')?.setAttribute(
      'aria-expanded',
      String(open)
    );

    document.body.classList.toggle(
      'menu-open',
      open
    );
  }

  function scrollTo(id) {
    closeDialog();
    sidebar(false);

    $(id)?.scrollIntoView({
      behavior: window.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
      ).matches ? 'auto' : 'smooth',
      block: 'start'
    });
  }

  function goToPage(url) {
    if (!state.ready || !url) return;

    hidePopovers();
    sidebar(false);

    location.assign(url);
  }

  function openSubject(subjectId) {
    goToPage(
      SUBJECTS.find(
        subject => subject.id === subjectId
      )?.page
    );
  }

  function bindPageControl(id, url) {
    const control = $(id);
    if (!control) return;

    if (control.tagName === 'A') {
      control.href = url;
    } else {
      control.addEventListener(
        'click',
        () => goToPage(url)
      );
    }
  }

  function completion(id) {
    return state.completedLessons.some(
      item => item.lessonId === id
    );
  }

  function dueLabel(goal) {
    if (!goal.dueDate) {
      return 'Chưa đặt ngày';
    }

    if (goal.dueDate === state.today) {
      return 'Hôm nay';
    }

    return (
      goal.dueDate < state.today && !goal.done
        ? 'Quá hạn · '
        : ''
    ) + formatDay(goal.dueDate);
  }

  function orderedGoals() {
    return [...state.goals].sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        String(a.dueDate || '9999').localeCompare(
          String(b.dueDate || '9999')
        ) ||
        String(b.createdAt).localeCompare(
          String(a.createdAt)
        )
    );
  }

  function goalRow(goal, removable = false) {
    const row = node(
      'div',
      'goal-row' + (goal.done ? ' is-done' : '')
    );

    const label = node('label', 'goal-toggle');
    const checkbox = document.createElement('input');

    checkbox.type = 'checkbox';
    checkbox.checked = goal.done === true;

    checkbox.setAttribute(
      'aria-label',
      `Hoàn thành mục tiêu: ${goal.title}`
    );

    checkbox.addEventListener('change', () => {
      const desired = checkbox.checked;

      run(async () => {
        try {
          const outcome = await changeGoal(
            'toggleGoal',
            {
              id: goal.id,
              done: desired
            }
          );

          if (removable && dialog.open) {
            openGoalManager();
          }

          showSyncIssue(outcome);
        } catch (error) {
          checkbox.checked = !desired;
          throw error;
        }
      }, checkbox);
    });

    label.append(checkbox);

    const copy = node('span', 'goal-copy');

    copy.append(
      node('span', 'goal-title', goal.title),
      node('small', 'goal-meta', dueLabel(goal))
    );

    label.append(copy);
    row.append(label);

    if (removable) {
      const remove = button(
        '×',
        () => run(async () => {
          const outcome = await changeGoal(
            'deleteGoal',
            { id: goal.id }
          );

          openGoalManager();

          if (!showSyncIssue(outcome)) {
            toast('Đã xóa mục tiêu.');
          }
        }, remove),
        'icon-button'
      );

      remove.setAttribute(
        'aria-label',
        `Xóa mục tiêu: ${goal.title}`
      );

      row.append(remove);
    }

    return row;
  }

  function openNewGoal() {
    if (
      !requireLogin(
        'Đăng nhập để thêm và lưu mục tiêu của bạn.'
      )
    ) {
      return;
    }

    const form = node('form', 'goal-form');

    const intro = node(
      'p',
      'modal-lead',
      'Bắt đầu bằng một việc nhỏ, rõ ràng và vừa sức với bạn.'
    );

    const titleLabel = node(
      'label',
      'form-field',
      'Mục tiêu của bạn'
    );

    const title = document.createElement('input');
    title.name = 'title';
    title.required = true;
    title.maxLength = 100;
    title.placeholder = 'Ví dụ: Ôn 10 từ tiếng Anh';

    titleLabel.append(title);

    const dateLabel = node(
      'label',
      'form-field',
      'Ngày dự kiến · không bắt buộc'
    );

    const due = document.createElement('input');
    due.type = 'date';
    due.name = 'dueDate';
    due.min = '1900-01-01';
    due.max = '2100-12-31';

    dateLabel.append(due);

    const error = node('p', 'form-error');
    error.setAttribute('role', 'alert');
    error.hidden = true;

    const actions = node('div', 'modal-actions');
    const save = node(
      'button',
      'primary-button',
      'Lưu mục tiêu'
    );
    save.type = 'submit';

    actions.append(
      button('Hủy', closeDialog),
      save
    );

    form.append(
      intro,
      titleLabel,
      dateLabel,
      error,
      actions
    );

    form.addEventListener('submit', async event => {
      event.preventDefault();

      if (save.disabled) return;

      const value = title.value.trim();

      if (!value) {
        title.focus();
        return;
      }

      error.hidden = true;
      save.disabled = true;

      try {
        const outcome = await changeGoal(
          'saveGoal',
          {
            title: value,
            dueDate: due.value
          }
        );

        closeDialog();

        if (!showSyncIssue(outcome)) {
          toast(
            'Đã thêm mục tiêu mới. Mỗi bước nhỏ đều đáng ghi nhận!'
          );
        }
      } catch (issue) {
        error.textContent = issue.message;
        error.hidden = false;
      } finally {
        save.disabled = false;
      }
    });

    openDialog('Một mục tiêu nhỏ cho bạn', form);
    title.focus();
  }

  function openGoalManager() {
    if (
      !requireLogin(
        'Đăng nhập để xem và quản lý mục tiêu của bạn.'
      )
    ) {
      return;
    }

    const section = node('div');

    section.append(
      node(
        'p',
        'modal-lead',
        'Những việc bạn muốn hoàn thành, theo nhịp học của riêng mình.'
      )
    );

    const list = node('div', 'modal-list');

    orderedGoals().forEach(goal => {
      list.append(goalRow(goal, true));
    });

    if (!state.goals.length) {
      list.append(
        empty(
          'Bạn chưa có mục tiêu nào. Hãy bắt đầu với một việc nhỏ.'
        )
      );
    }

    section.append(
      list,
      button(
        '+ Thêm mục tiêu',
        openNewGoal,
        'primary-button'
      )
    );

    openDialog('Kế hoạch của bạn', section);
  }

  function notifications() {
    if (!state.authenticated) return [];

    const notices = [];

    const todayRecords =
      state.attendanceCache[
        state.today.slice(0, 7)
      ] || {};

    if (
      todayRecords[state.today] === 'present'
    ) {
      notices.push({
        id: `checkin-${state.today}`,
        icon: '✓',
        title: 'Bạn đã điểm danh hôm nay',
        detail: 'Giữ nhịp học đều đặn cùng Qurio.',
        action: () => scrollTo('attendanceWidget')
      });
    }

    [...state.completedLessons]
      .sort((a, b) =>
        String(b.completedAt).localeCompare(
          String(a.completedAt)
        )
      )
      .slice(0, 3)
      .forEach(item => {
        const lesson = LESSONS.find(
          lesson => lesson.id === item.lessonId
        );

        notices.push({
          id: `lesson-${item.lessonId}-${item.completedAt}`,
          icon: '✦',
          title: `Đã hoàn thành: ${lesson.title}`,
          detail: 'Một bước tiến nhỏ đã được ghi nhận.',
          action: () => openSubject(lesson.subjectId)
        });
      });

    orderedGoals()
      .filter(goal =>
        !goal.done &&
        goal.dueDate &&
        goal.dueDate <= state.today
      )
      .slice(0, 2)
      .forEach(goal => {
        notices.push({
          id: `goal-${goal.id}-${state.today}`,
          icon: '◷',
          title: goal.title,
          detail:
            goal.dueDate < state.today
              ? 'Mục tiêu đã qua ngày dự kiến.'
              : 'Mục tiêu dành cho hôm nay.',
          action: openGoalManager
        });
      });

    notices.push({
      id: 'welcome',
      icon: '✧',
      title: 'Mỗi ngày một điều mới',
      detail: 'Khám phá các môn học trong góc học tập của bạn.',
      action: () => scrollTo('subjectsSection')
    });

    return notices;
  }

  function notificationNode(item) {
    const element = button(
      '',
      () => {
        hidePopovers();
        item.action();
      },
      'notification-item'
    );

    const copy = node(
      'span',
      'notification-copy'
    );

    copy.append(
      node('strong', '', item.title),
      node('small', '', item.detail)
    );

    element.append(
      node('span', 'notification-icon', item.icon),
      copy
    );

    return element;
  }

  function readKey() {
    return `qurio_home_read_account_${state.user?.id || 'guest'}`;
  }

  function markRead() {
    if (!state.authenticated) return;

    notifications().forEach(item => {
      readNotifications.add(item.id);
    });

    try {
      localStorage.setItem(
        readKey(),
        JSON.stringify(
          [...readNotifications].slice(-100)
        )
      );
    } catch (_) {}

    renderNotifications();
  }

  function renderNotifications() {
    const items = notifications();

    $('notificationList')?.replaceChildren(
      ...(items.length
        ? items.slice(0, 3).map(notificationNode)
        : [empty('Chưa có thông báo.')])
    );

    const popover = $('notificationPopover');

    if (popover) {
      popover.replaceChildren(
        node(
          'strong',
          'popover-heading',
          'Thông báo của bạn'
        ),
        ...(items.length
          ? items.slice(0, 4).map(notificationNode)
          : [empty('Chưa có thông báo.')])
      );
    }

    const unread = items.filter(
      item => !readNotifications.has(item.id)
    ).length;

    if ($('notificationBadge')) {
      $('notificationBadge').textContent =
        String(unread);

      $('notificationBadge').hidden =
        unread === 0;
    }

    $('notificationToggle')?.setAttribute(
      'aria-label',
      unread
        ? `Thông báo, ${unread} mục chưa đọc`
        : 'Thông báo'
    );
  }

  function render() {
    const name = state.authenticated
      ? String(
          state.user.fullName ||
          state.user.username ||
          'Bạn'
        )
      : 'bạn';

    const givenName = name
      .trim()
      .split(/\s+/)
      .pop();

    setText(
      'profileName',
      state.authenticated ? name : 'Khách'
    );

    setText(
      'profileEmail',
      state.authenticated
        ? state.user.email ||
          'Chưa có email liên hệ'
        : 'Chưa đăng nhập'
    );

    setText(
      'profileRole',
      state.authenticated
        ? state.user.role === 'teacher'
          ? 'Giáo viên'
          : 'Học sinh'
        : 'Chưa đăng nhập'
    );

    setText(
      'profileAvatar',
      state.authenticated
        ? givenName.slice(0, 1).toUpperCase()
        : 'Q'
    );

    setText(
      'greetingName',
      `${givenName}!`
    );

    setText(
      'profileDescription',
      state.authenticated
        ? 'Hành trình học tập được lưu theo tài khoản này.'
        : 'Đăng nhập để lưu tiến độ và mục tiêu của bạn.'
    );

    if ($('profileLoginLink')) {
      $('profileLoginLink').hidden =
        state.authenticated;

      $('profileLoginLink').href = LOGIN_URL;
    }

    const accessButton = $('logoutButton');

    if (accessButton) {
      const icon = accessButton.querySelector('svg');

      const label = document.createTextNode(
        state.authenticated
          ? 'Đăng xuất'
          : 'Đăng nhập'
      );

      accessButton.replaceChildren(
        ...(icon ? [icon, label] : [label])
      );
    }

    const hour = Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: TIME_ZONE,
        hour: '2-digit',
        hourCycle: 'h23'
      }).format(new Date())
    );

    setText(
      'greetingLabel',
      hour < 12
        ? 'Chào buổi sáng,'
        : hour < 18
          ? 'Chào buổi chiều,'
          : 'Chào buổi tối,'
    );

    setText(
      'todayLabel',
      new Intl.DateTimeFormat('vi-VN', {
        timeZone: TIME_ZONE,
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(
        new Date(
          state.today + 'T05:00:00Z'
        )
      )
    );

    const complete =
      state.completedLessons.length;

    const percent = Math.round(
      complete / LESSONS.length * 100
    );

    setText(
      'completedStat',
      `${complete}/${LESSONS.length}`
    );

    const monthRecords =
      state.attendanceCache[
        state.today.slice(0, 7)
      ] || {};

    setText(
      'checkinStat',
      Object.values(monthRecords).filter(
        value => value === 'present'
      ).length
    );

    const done = state.goals.filter(
      goal => goal.done
    ).length;

    setText(
      'goalStat',
      `${done}/${state.goals.length}`
    );

    setText(
      'goalCount',
      `Đã hoàn thành ${done}/${state.goals.length} mục tiêu`
    );

    setText(
      'progressPercent',
      `${percent}%`
    );

    setText(
      'progressSummary',
      `${complete}/${LESSONS.length} bài khởi động đã hoàn thành`
    );

    if ($('progressRing')) {
      $('progressRing').style.setProperty(
        '--progress',
        percent
      );

      $('progressRing').setAttribute(
        'aria-valuenow',
        String(percent)
      );
    }

    SUBJECTS.forEach(subject => {
      setText(
        `${subject.id}Progress`,
        completion(subject.lessonId)
          ? 'Đã hoàn thành ✓'
          : 'Mở trang môn học'
      );
    });

    const legend = $('progressLegend');

    if (legend) {
      legend.replaceChildren(
        ...SUBJECTS.map(subject => {
          const row = node(
            'li',
            'progress-legend-item'
          );

          const dot = node('i');
          dot.style.background = subject.color;

          row.append(
            dot,
            node('span', '', subject.name),
            node(
              'strong',
              '',
              completion(subject.lessonId)
                ? '1/1'
                : '0/1'
            )
          );

          return row;
        })
      );
    }

    const goalList = $('goalList');

    if (goalList) {
      goalList.replaceChildren(
        ...(state.goals.length
          ? orderedGoals()
              .slice(0, 4)
              .map(goal => goalRow(goal))
          : [
              empty(
                'Chưa có mục tiêu. Một bước nhỏ cũng là khởi đầu tốt.',
                'Thêm mục tiêu',
                openNewGoal
              )
            ])
      );
    }

    const upcoming = orderedGoals()
      .filter(goal => !goal.done)
      .slice(0, 3);

    $('upcomingList')?.replaceChildren(
      ...(upcoming.length
        ? upcoming.map(goal => {
            const item = button(
              '',
              openGoalManager,
              'upcoming-item'
            );

            item.append(
              node(
                'span',
                'upcoming-mark',
                '◷'
              ),
              node('strong', '', goal.title),
              node(
                'small',
                '',
                dueLabel(goal)
              )
            );

            return item;
          })
        : [
            empty(
              state.goals.length
                ? 'Bạn đã hoàn thành các mục tiêu hiện tại. Hãy nghỉ ngơi một chút nhé.'
                : 'Đặt mục tiêu để sắp xếp việc học của bạn.',
              '+ Tạo mục tiêu',
              openNewGoal
            )
          ])
    );

    renderNotifications();
  }

  function renderSearch() {
    const query = normalizeSearch(
      $('searchInput').value
    );

    const results = $('searchResults');

    if (!query || !state.ready) {
      hideSearch();
      return;
    }

    hidePopovers('searchResults');
    searchActions = [];

    const matches = [];

    SUBJECTS.forEach(subject => {
      const lesson = LESSONS.find(
        item => item.id === subject.lessonId
      );

      if (
        normalizeSearch(
          `${subject.name} ${lesson.title} ${subject.subtitle}`
        ).includes(query)
      ) {
        matches.push({
          title: subject.name,
          detail: 'Mở trang môn học',
          action: () => openSubject(subject.id)
        });
      }
    });

    state.goals
      .filter(goal =>
        normalizeSearch(goal.title)
          .includes(query)
      )
      .slice(0, 3)
      .forEach(goal => {
        matches.push({
          title: goal.title,
          detail: 'Mục tiêu của bạn',
          action: openGoalManager
        });
      });

    const items = matches
      .slice(0, 6)
      .map(match => {
        searchActions.push(match.action);

        const item = button(
          '',
          () => {
            hideSearch();
            match.action();
          },
          'search-result'
        );

        item.setAttribute(
          'role',
          'option'
        );

        item.append(
          node(
            'strong',
            '',
            match.title
          ),
          node(
            'small',
            '',
            match.detail
          )
        );

        return item;
      });

    results.replaceChildren(
      ...(items.length
        ? items
        : [
            node(
              'p',
              'search-empty',
              'Chưa tìm thấy kết quả phù hợp.'
            )
          ])
    );

    results.hidden = false;

    $('searchInput').setAttribute(
      'aria-expanded',
      'true'
    );
  }

  function bind() {
    $('dialogClose')?.addEventListener(
      'click',
      closeDialog
    );

    dialog?.addEventListener(
      'click',
      event => {
        if (event.target === dialog) {
          closeDialog();
        }
      }
    );

    dialog?.addEventListener(
      'close',
      () => {
        if (
          dialogReturnFocus?.isConnected
        ) {
          dialogReturnFocus.focus();
        }
      }
    );

    $('sidebarToggle')?.addEventListener(
      'click',
      () => {
        sidebar(
          !$('sidebar')
            .classList.contains('is-open')
        );
      }
    );

    $('sidebarBackdrop')?.addEventListener(
      'click',
      () => sidebar(false)
    );

    $('addGoalButton')?.addEventListener(
      'click',
      openNewGoal
    );

    $('manageGoalsButton')?.addEventListener(
      'click',
      openGoalManager
    );

    bindPageControl(
      'progressDetailsButton',
      PAGE_URLS.progress
    );

    bindPageControl(
      'roadmapButton',
      PAGE_URLS.roadmap
    );

    bindPageControl(
      'heroPrimary',
      PAGE_URLS.learning
    );

    document
      .querySelectorAll('[data-subject]')
      .forEach(card => {
        const subject = SUBJECTS.find(
          item =>
            item.id === card.dataset.subject
        );

        if (
          subject &&
          card.tagName === 'A'
        ) {
          card.href = subject.page;
        }
      });

    $('subjectGrid')?.addEventListener(
      'click',
      event => {
        const card = event.target.closest(
          '[data-subject]'
        );

        if (
          card &&
          card.tagName !== 'A'
        ) {
          openSubject(
            card.dataset.subject
          );
        }
      }
    );

    $('notificationsAllButton')
      ?.addEventListener('click', () => {
        const list = node(
          'div',
          'modal-list'
        );

        notifications().forEach(item => {
          list.append(
            notificationNode(item)
          );
        });

        markRead();

        openDialog(
          'Thông báo của bạn',
          list
        );
      });

    $('notificationToggle')
      ?.addEventListener('click', () => {
        const panel =
          $('notificationPopover');

        const open = panel.hidden;

        hidePopovers(
          'notificationPopover'
        );

        panel.hidden = !open;

        $('notificationToggle')
          .setAttribute(
            'aria-expanded',
            String(open)
          );

        if (open) {
          markRead();
        }
      });

    $('profileToggle')
      ?.addEventListener('click', () => {
        const panel =
          $('profileMenu');

        const open = panel.hidden;

        hidePopovers('profileMenu');
        panel.hidden = !open;

        $('profileToggle')
          .setAttribute(
            'aria-expanded',
            String(open)
          );
      });

    $('logoutButton')
      ?.addEventListener(
        'click',
        async () => {
          $('logoutButton').disabled = true;

          try {
            if (state.authenticated) {
              await window.QurioAuth.logout();
            }
          } catch (_) {
            // Helper xử lý xóa phiên trên thiết bị.
          } finally {
            location.assign(LOGIN_URL);
          }
        }
      );

    $('searchInput')?.setAttribute(
      'aria-controls',
      'searchResults'
    );

    $('searchInput')?.setAttribute(
      'aria-expanded',
      'false'
    );

    $('searchInput')?.addEventListener(
      'input',
      renderSearch
    );

    $('searchInput')?.addEventListener(
      'focus',
      renderSearch
    );

    $('searchInput')?.addEventListener(
      'keydown',
      event => {
        if (
          event.key === 'ArrowDown' &&
          !$('searchResults').hidden
        ) {
          event.preventDefault();

          $('searchResults')
            .querySelector('button')
            ?.focus();
        }
      }
    );

    $('searchResults')?.addEventListener(
      'keydown',
      event => {
        const items = [
          ...$('searchResults')
            .querySelectorAll('button')
        ];

        const index = items.indexOf(
          document.activeElement
        );

        if (
          event.key === 'ArrowDown'
        ) {
          event.preventDefault();

          items[
            (index + 1) % items.length
          ]?.focus();
        }

        if (
          event.key === 'ArrowUp'
        ) {
          event.preventDefault();

          if (index <= 0) {
            $('searchInput').focus();
          } else {
            items[index - 1]?.focus();
          }
        }
      }
    );

    $('searchForm')?.addEventListener(
      'submit',
      event => {
        event.preventDefault();
        renderSearch();

        if (searchActions[0]) {
          hideSearch();
          searchActions[0]();
        }
      }
    );

    document.addEventListener(
      'click',
      event => {
        if (
          !$('profileMenu')
            ?.contains(event.target) &&
          !$('profileToggle')
            ?.contains(event.target)
        ) {
          if ($('profileMenu')) {
            $('profileMenu').hidden = true;
          }

          $('profileToggle')
            ?.setAttribute(
              'aria-expanded',
              'false'
            );
        }

        if (
          !$('notificationPopover')
            ?.contains(event.target) &&
          !$('notificationToggle')
            ?.contains(event.target)
        ) {
          if (
            $('notificationPopover')
          ) {
            $('notificationPopover')
              .hidden = true;
          }

          $('notificationToggle')
            ?.setAttribute(
              'aria-expanded',
              'false'
            );
        }

        if (
          !$('searchForm')
            ?.contains(event.target)
        ) {
          hideSearch();
        }
      }
    );

    document.addEventListener(
      'keydown',
      event => {
        if (
          event.key === '/' &&
          !event.ctrlKey &&
          !event.metaKey &&
          ![
            'INPUT',
            'TEXTAREA',
            'SELECT'
          ].includes(
            document.activeElement
              ?.tagName
          ) &&
          !document.activeElement
            ?.isContentEditable &&
          !dialog?.open
        ) {
          event.preventDefault();
          $('searchInput')?.focus();
        }

        if (
          event.key === 'Escape'
        ) {
          hidePopovers();
          sidebar(false);

          if (dialog?.open) {
            closeDialog();
          }
        }
      }
    );

    document
      .querySelectorAll('[data-nav]')
      .forEach(link => {
        const name =
          link.dataset.nav;

        if (name !== 'home') {
          if (PAGE_URLS[name]) {
            link.href =
              PAGE_URLS[name];
          }

          link.addEventListener(
            'click',
            () => sidebar(false)
          );

          return;
        }

        link.addEventListener(
          'click',
          event => {
            event.preventDefault();

            if (!state.ready) return;

            scrollTo(
              'welcomeSection'
            );
          }
        );
      });

    window.addEventListener(
      'focus',
      reconcileDay
    );

    window.addEventListener(
      'pageshow',
      reconcileDay
    );

    document.addEventListener(
      'visibilitychange',
      () => {
        if (
          document.visibilityState !== 'hidden'
        ) {
          reconcileDay();
        }
      }
    );
  }

  function mountCalendar() {
    calendarNavigation++;
    pendingMonth = null;

    calendar?.destroy();

    calendar = createAttendance(
      $('attendanceWidget'),
      {
        today: state.today,
        month: state.month,
        records: state.records,

        unavailableLabel:
          'Đăng nhập để điểm danh',

        unavailableNote:
          'Đăng nhập để lưu kết quả học tập của bạn.',

        onMonthChange: month => {
          if (!state.authenticated) {
            state.month = month;
            state.records = {};

            render();

            return {
              attendance: {},
              today: state.today
            };
          }

          const navigation =
            ++calendarNavigation;

          pendingMonth = month;

          return schedule(async () => {
            try {
              if (
                navigation !==
                calendarNavigation
              ) {
                throw new Error(
                  'Lượt xem lịch đã thay đổi.'
                );
              }

              const data = await request(
                'dashboard',
                { month }
              );

              if (
                navigation !==
                calendarNavigation
              ) {
                throw new Error(
                  'Lượt xem lịch đã thay đổi.'
                );
              }

              merge(data, month);

              state.month = month;
              state.records =
                data.attendance || {};

              render();

              return {
                attendance: state.records,
                today: state.today
              };
            } finally {
              if (
                navigation ===
                calendarNavigation
              ) {
                pendingMonth = null;
              }
            }
          });
        },

        onCheckin: state.authenticated
          ? () =>
              schedule(async () => {
                const result = await request(
                  'checkin'
                );

                state.today =
                  result.today ||
                  result.date;

                const key =
                  state.today.slice(0, 7);

                state.attendanceCache[key]
                  ||= {};

                state.attendanceCache[key][
                  result.date ||
                  result.today
                ] = result.status;

                if (
                  state.month === key
                ) {
                  state.records[
                    result.date ||
                    result.today
                  ] = result.status;
                }

                render();

                try {
                  await refreshNow(false);
                  toast(result.message);
                } catch (_) {
                  toast(
                    'Đã ghi nhận điểm danh. Chưa tải lại được dữ liệu; bạn có thể tải lại trang sau.',
                    true
                  );
                }

                return result;
              })
          : undefined,

        onDaySelect: ({
          date,
          status,
          isFuture
        }) => {
          if (!state.authenticated) {
            toast(
              'Đăng nhập để xem lịch điểm danh của bạn.'
            );

            return;
          }

          const labels = {
            present:
              'Có mặt · Đã ghi nhận điểm danh.',
            absent:
              'Vắng · Bản ghi đã được ghi nhận.'
          };

          openDialog(
            formatDay(date, true),
            labels[status] ||
              (
                isFuture
                  ? 'Ngày này chưa tới. Bạn chỉ có thể tự điểm danh cho hôm nay.'
                  : 'Chưa có bản ghi điểm danh cho ngày này. Ngày chưa có dữ liệu không được tự tính là vắng.'
              )
          );
        }
      }
    );
  }

  function resetGuest() {
    state.user = null;
    state.authenticated = false;

    state.today = todayVN();
    state.month =
      state.today.slice(0, 7);

    state.records = {};
    state.attendanceCache = {};
    state.goals = [];
    state.completedLessons = [];
    state.ready = true;

    observedDay = state.today;
    readNotifications = new Set();

    render();
    mountCalendar();
  }

  async function initialize() {
    if (initialization) return;

    initialization = true;
    resetGuest();

    try {
      if (
        !window.QurioAuth?.me ||
        !window.QurioAuth?.request
      ) {
        return;
      }

      const user =
        await window.QurioAuth.me();

      if (!user?.id) {
        throw new Error(
          'Không kiểm tra được tài khoản. Vui lòng đăng nhập lại.'
        );
      }

      let month = todayVN()
        .slice(0, 7);

      let data =
        await window.QurioAuth.request(
          'dashboard',
          { month }
        );

      if (
        data.today?.slice(0, 7) !== month
      ) {
        month =
          data.today.slice(0, 7);

        data =
          await window.QurioAuth.request(
            'dashboard',
            { month }
          );
      }

      state.user = user;
      state.authenticated = true;
      state.month = month;

      merge(data, month);

      try {
        readNotifications = new Set(
          JSON.parse(
            localStorage.getItem(
              readKey()
            ) || '[]'
          )
        );
      } catch (_) {
        readNotifications = new Set();
      }

      observedDay = todayVN();

      render();
      mountCalendar();
    } catch (error) {
      resetGuest();

      const ordinaryGuest =
        /chưa đăng nhập|hết hạn|đăng nhập lại/i.test(
          error.message || ''
        );

      if (!ordinaryGuest) {
        toast(
          error.message ||
          'Chưa tải được dữ liệu tài khoản. Bạn có thể tải lại trang sau.',
          true
        );
      }
    } finally {
      initialization = false;
    }
  }

  bind();
  initialize();

  return {
    initialize,
    getState: () => state
  };
}

if (typeof document !== 'undefined') {
  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      createApp,
      { once: true }
    );
  } else {
    createApp();
  }
}

/*FOOTER*/
(() => {
  'use strict';

  // ĐIỀN LINK TÀI KHOẢN CỦA BẠN TẠI ĐÂY.
  // Dùng đường dẫn đầy đủ bắt đầu bằng https://
  const socialLinks = {
    facebook: '',
    tiktok: '',
    instagram: '',
    youtube: '',
    threads: ''
  };

  // Sắp xếp menu và nội dung phía trên chân trang.
  function mountFooterLayout(footer) {
    const sidebar = document.getElementById('sidebar');
    const workspace = document.getElementById('workspace');

    if (!sidebar || !workspace) return;

    let shell = sidebar.parentElement;

    const alreadyWrapped =
      shell.classList.contains('qurio-page-shell') &&
      workspace.parentElement === shell;

    if (!alreadyWrapped) {
      if (sidebar.parentElement !== workspace.parentElement) {
        return;
      }

      shell = document.createElement('div');
      shell.className = 'qurio-page-shell';

      sidebar.before(shell);
      shell.append(sidebar, workspace);
    }

    if (shell.nextElementSibling !== footer) {
      shell.after(footer);
    }
  }

  function initFooter() {
    const footer = document.querySelector('.qurio-footer');

    if (!footer) return;

    mountFooterLayout(footer);

    // Tự cập nhật năm bản quyền.
    const year = footer.querySelector('[data-footer-year]');

    if (year) {
      year.textContent = new Date().getFullYear();
    }

    // Gắn các đường dẫn mạng xã hội.
    footer.querySelectorAll('[data-social]').forEach(link => {
      const address = socialLinks[link.dataset.social];

      // Chưa điền link: biểu tượng vẫn hiện.
      if (!address) return;

      let url;

      try {
        url = new URL(address);
      } catch {
        return;
      }

      if (url.protocol !== 'https:') return;

      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      link.removeAttribute('aria-disabled');
      link.removeAttribute('role');

      link.title = link.getAttribute('aria-label');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initFooter,
      { once: true }
    );
  } else {
    initFooter();
  }
})();