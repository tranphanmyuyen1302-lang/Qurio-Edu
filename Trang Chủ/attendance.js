const MIN_MONTH = '1900-01';
const MAX_MONTH = '2100-12';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/* Ngày hiện tại theo múi giờ Việt Nam */
function vietnamDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const pick = name =>
    parts.find(part => part.type === name).value;

  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

/* Kiểm tra ngày hợp lệ */
function validDate(value) {
  if (
    typeof value !== 'string' ||
    !DATE_PATTERN.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T12:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

/* Kiểm tra tháng hợp lệ */
function validMonth(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(value) &&
    value >= MIN_MONTH &&
    value <= MAX_MONTH
  );
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

/* Chỉ nhận dữ liệu điểm danh hợp lệ */
function normalizeRecords(records) {
  if (
    !records ||
    typeof records !== 'object' ||
    Array.isArray(records)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(records).filter(
      ([date, status]) =>
        validDate(date) &&
        (
          status === 'present' ||
          status === 'absent'
        )
    )
  );
}

/* Tạo 42 ô ngày, bắt đầu từ thứ Hai */
export function buildMonthDays(
  month,
  today,
  records = {}
) {
  if (
    !validMonth(month) ||
    !validDate(today)
  ) {
    throw new Error(
      'Tháng hoặc ngày không hợp lệ.'
    );
  }

  const [year, number] = month
    .split('-')
    .map(Number);

  const first = new Date(
    Date.UTC(year, number - 1, 1, 12)
  );

  const offset =
    (first.getUTCDay() + 6) % 7;

  const accepted =
    normalizeRecords(records);

  return Array.from(
    { length: 42 },
    (_, index) => {
      const current = new Date(first);

      current.setUTCDate(
        1 - offset + index
      );

      const date = dateKey(current);

      return {
        date,
        day: current.getUTCDate(),
        isCurrentMonth:
          date.startsWith(month + '-'),
        isToday: date === today,
        isFuture: date > today,
        status:
          accepted[date] || 'pending'
      };
    }
  );
}

/* Thống kê điểm danh trong tháng */
export function countAttendance(
  month,
  records = {}
) {
  let present = 0;
  let absent = 0;

  Object.entries(
    normalizeRecords(records)
  ).forEach(([date, status]) => {
    if (
      !date.startsWith(month + '-')
    ) {
      return;
    }

    if (status === 'present') {
      present++;
    } else {
      absent++;
    }
  });

  const total = present + absent;

  return {
    present,
    absent,
    rate: total
      ? Math.round(
          present / total * 100
        )
      : 0
  };
}

/* Tính tháng trước hoặc tháng sau */
function moveMonth(month, direction) {
  const [year, number] = month
    .split('-')
    .map(Number);

  const date = new Date(
    Date.UTC(
      year,
      number - 1 + direction,
      1,
      12
    )
  );

  return dateKey(date).slice(0, 7);
}

/* Tạo phần tử HTML */
function make(tag, className, text) {
  const element =
    document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

/* Khởi tạo lịch điểm danh */
export function createAttendance(
  root,
  options = {}
) {
  if (
    !root ||
    typeof root.replaceChildren !== 'function'
  ) {
    throw new Error(
      'Không tìm thấy khung điểm danh.'
    );
  }

  let today = validDate(options.today)
    ? options.today
    : vietnamDate();

  let month = validMonth(options.month)
    ? options.month
    : today.slice(0, 7);

  let records =
    normalizeRecords(options.records);

  let todayStatus =
    records[today] || null;

  let disabled =
    Boolean(options.disabled);

  let loading = false;
  let destroyed = false;
  let sequence = 0;
  let tearCleanup = null;

  const cleanups = [];

  root.classList.add(
    'attendance-widget'
  );

  /* Tờ lịch */
  const card = make(
    'section',
    'attendance-paper'
  );

  card.setAttribute(
    'aria-label',
    'Lịch điểm danh học tập'
  );

  /* Lò xo */
  const rings = make(
    'div',
    'attendance-rings'
  );

  rings.setAttribute(
    'aria-hidden',
    'true'
  );

  for (
    let index = 0;
    index < 9;
    index++
  ) {
    rings.append(make('i'));
  }

  /* Họa tiết lá */
  const leaves = make(
    'div',
    'attendance-leaves'
  );

  leaves.setAttribute(
    'aria-hidden',
    'true'
  );

  leaves.innerHTML = `
    <svg viewBox="0 0 100 120" fill="none">
      <path
        d="M27 111C56 76 65 37 73 9M51 75C28 70 22 52 22 47C47 47 58 61 51 75ZM64 44C45 35 43 18 48 12C68 20 72 33 64 44ZM59 62C85 60 94 43 91 36C71 39 62 48 59 62Z"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
  `;

  /* Tiêu đề lịch */
  const heading = make(
    'div',
    'attendance-heading'
  );

  const headingIcon = make(
    'span',
    'attendance-heading-icon'
  );

  headingIcon.setAttribute(
    'aria-hidden',
    'true'
  );

  headingIcon.innerHTML = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
    >
      <rect
        x="4"
        y="5"
        width="16"
        height="16"
        rx="3"
      />
      <path
        d="M8 3v4m8-4v4M4 10h16m-11 4h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"
      />
    </svg>
  `;

  heading.append(
    headingIcon,
    make('h2', '', 'Lịch điểm danh')
  );

  const todayButton = make(
    'button',
    'attendance-today-button',
    'Hôm nay'
  );

  todayButton.type = 'button';
  todayButton.title =
    'Quay về tháng hiện tại';

  heading.append(todayButton);

  /* Thanh chuyển tháng */
  const navigation = make(
    'div',
    'attendance-navigation'
  );

  const previous = make(
    'button',
    'attendance-month-arrow',
    '‹'
  );

  previous.type = 'button';

  previous.setAttribute(
    'aria-label',
    'Tháng trước'
  );

  const title = make(
    'strong',
    'attendance-month-title'
  );

  title.setAttribute(
    'aria-live',
    'polite'
  );

  const next = make(
    'button',
    'attendance-month-arrow',
    '›'
  );

  next.type = 'button';

  next.setAttribute(
    'aria-label',
    'Tháng sau'
  );

  navigation.append(
    previous,
    title,
    next
  );

  /* Các thứ trong tuần */
  const weekdays = make(
    'div',
    'attendance-weekdays'
  );

  weekdays.setAttribute(
    'aria-hidden',
    'true'
  );

  [
    'T2',
    'T3',
    'T4',
    'T5',
    'T6',
    'T7',
    'CN'
  ].forEach(day => {
    weekdays.append(
      make('span', '', day)
    );
  });

  /* Lưới ngày */
  const grid = make(
    'div',
    'attendance-grid'
  );

  grid.setAttribute(
    'role',
    'group'
  );

  grid.setAttribute(
    'aria-label',
    'Các ngày trong tháng'
  );

  /* Chú thích */
  const legend = make(
    'div',
    'attendance-legend'
  );

  [
    ['present', 'Có mặt'],
    ['absent', 'Vắng'],
    ['pending', 'Chưa điểm danh']
  ].forEach(([status, label]) => {
    const item = make(
      'span',
      'attendance-legend-item'
    );

    const dot = make(
      'i',
      `attendance-dot ${status}`
    );

    dot.setAttribute(
      'aria-hidden',
      'true'
    );

    item.append(
      dot,
      document.createTextNode(label)
    );

    legend.append(item);
  });

  /* Thống kê */
  const stats = make(
    'div',
    'attendance-stats'
  );

  const presentValue = make(
    'strong',
    '',
    '0'
  );

  const absentValue = make(
    'strong',
    '',
    '0'
  );

  const rateValue = make(
    'strong',
    '',
    '0%'
  );

  [
    [presentValue, 'Có mặt'],
    [absentValue, 'Vắng'],
    [rateValue, 'Chuyên cần']
  ].forEach(([value, label]) => {
    const item = make('div');

    item.append(
      value,
      make('span', '', label)
    );

    stats.append(item);
  });

  /* Nút điểm danh */
  const checkin = make(
    'button',
    'attendance-checkin',
    'Điểm danh hôm nay'
  );

  checkin.type = 'button';

  const note = make(
    'p',
    'attendance-note',
    'Ghi nhận ngày bạn chủ động học tập.'
  );

  const feedback = make(
    'p',
    'attendance-feedback'
  );

  feedback.hidden = true;

  feedback.setAttribute(
    'role',
    'status'
  );

  card.append(
    leaves,
    heading,
    navigation,
    weekdays,
    grid,
    legend,
    stats,
    checkin,
    note,
    feedback
  );

  // Lò xo đứng riêng để không bị xé theo tờ lịch.
  root.replaceChildren(
    card,
    rings
  );

  function listen(
    target,
    event,
    handler
  ) {
    target.addEventListener(
      event,
      handler
    );

    cleanups.push(() => {
      target.removeEventListener(
        event,
        handler
      );
    });
  }

  function setFeedback(
    text,
    isError = false
  ) {
    feedback.textContent = text;
    feedback.hidden = !text;

    feedback.classList.toggle(
      'is-error',
      isError
    );
  }

  function prefersReducedMotion() {
    try {
      return (
        root.ownerDocument
          ?.defaultView
          ?.matchMedia?.(
            '(prefers-reduced-motion: reduce)'
          ).matches !== false
      );
    } catch (_) {
      return true;
    }
  }

  /* Chụp lại tờ lịch cũ để tạo hiệu ứng xé */
  function snapshotSheet() {
    if (
      prefersReducedMotion() ||
      typeof card.cloneNode !== 'function' ||
      typeof card.getBoundingClientRect !== 'function'
    ) {
      return null;
    }

    const box =
      card.getBoundingClientRect();

    const host =
      root.getBoundingClientRect();

    if (
      !box.width ||
      !box.height
    ) {
      return null;
    }

    const sheet =
      card.cloneNode(true);

    sheet.classList.add(
      'attendance-turn-sheet'
    );

    sheet.setAttribute(
      'aria-hidden',
      'true'
    );

    sheet.setAttribute(
      'inert',
      ''
    );

    sheet.removeAttribute('id');
    sheet.removeAttribute('aria-label');
    sheet.removeAttribute('aria-busy');

    // Bản sao chỉ dùng để hiển thị hiệu ứng.
    sheet.querySelectorAll(
      '[id], [aria-live], [role], button, a, input, select, textarea, [tabindex]'
    ).forEach(element => {
      element.removeAttribute('id');
      element.removeAttribute('aria-live');
      element.removeAttribute('role');

      element.setAttribute(
        'tabindex',
        '-1'
      );
    });

    sheet.style.width =
      box.width + 'px';

    sheet.style.height =
      box.height + 'px';

    sheet.style.left = (
      box.left -
      host.left +
      (root.scrollLeft || 0)
    ) + 'px';

    sheet.style.top = (
      box.top -
      host.top +
      (root.scrollTop || 0)
    ) + 'px';

    return sheet;
  }

  function stopTear() {
    if (tearCleanup) {
      tearCleanup();
    }
  }

  /* Chạy hiệu ứng xé lịch */
  function tearSheet(
    sheet,
    direction,
    request
  ) {
    if (
      !sheet ||
      destroyed ||
      request !== sequence ||
      prefersReducedMotion()
    ) {
      return Promise.resolve();
    }

    stopTear();

    return new Promise(resolve => {
      let timer;
      let finished = false;

      function finish() {
        if (finished) return;

        finished = true;

        clearTimeout(timer);

        sheet.removeEventListener(
          'animationend',
          onEnd
        );

        sheet.removeEventListener(
          'animationcancel',
          onEnd
        );

        sheet.remove();

        root.classList.remove(
          'is-tearing'
        );

        card.classList.remove(
          'attendance-new-sheet'
        );

        if (
          tearCleanup === finish
        ) {
          tearCleanup = null;
        }

        resolve();
      }

      function onEnd(event) {
        if (
          event.target === sheet
        ) {
          finish();
        }
      }

      tearCleanup = finish;

      sheet.addEventListener(
        'animationend',
        onEnd
      );

      sheet.addEventListener(
        'animationcancel',
        onEnd
      );

      sheet.classList.add(
        direction > 0
          ? 'tear-next'
          : 'tear-prev'
      );

      root.append(sheet);

      root.classList.add(
        'is-tearing'
      );

      card.classList.add(
        'attendance-new-sheet'
      );

      // Dọn bản sao nếu trình duyệt không phát sự kiện kết thúc.
      timer = setTimeout(
        finish,
        760
      );
    });
  }

  /* Hiển thị nội dung lịch */
  function render() {
    if (destroyed) return;

    const [year, monthNumber] =
      month.split('-').map(Number);

    title.textContent =
      `Tháng ${monthNumber}, ${year}`;

    grid.setAttribute(
      'aria-label',
      `Các ngày tháng ${monthNumber} năm ${year}`
    );

    grid.replaceChildren();

    buildMonthDays(
      month,
      today,
      records
    ).forEach(day => {
      const button = make(
        'button',
        'attendance-day'
      );

      button.type = 'button';
      button.dataset.date = day.date;
      button.dataset.status = day.status;

      const statusName =
        day.status === 'present'
          ? 'Có mặt'
          : day.status === 'absent'
            ? 'Vắng'
            : day.isFuture
              ? 'Chưa tới ngày'
              : 'Chưa điểm danh';

      const readableDate =
        day.date
          .split('-')
          .reverse()
          .join('/');

      button.setAttribute(
        'aria-label',
        `${readableDate}: ${statusName}${day.isToday ? ', hôm nay' : ''}`
      );

      button.title =
        `${readableDate} · ${statusName}`;

      button.classList.toggle(
        'other-month',
        !day.isCurrentMonth
      );

      button.classList.toggle(
        'is-today',
        day.isToday
      );

      button.classList.toggle(
        'is-future',
        day.isFuture
      );

      if (day.isCurrentMonth) {
        button.classList.add(
          day.status
        );
      }

      if (day.isToday) {
        button.setAttribute(
          'aria-current',
          'date'
        );
      }

      button.append(
        make(
          'span',
          'attendance-day-number',
          String(day.day)
        )
      );

      button.disabled =
        disabled || loading;

      button.addEventListener(
        'click',
        () => {
          if (
            destroyed ||
            disabled ||
            loading
          ) {
            return;
          }

          if (
            options.onDaySelect
          ) {
            options.onDaySelect({
              date: day.date,
              status: day.status,
              isFuture: day.isFuture
            });
          } else {
            setFeedback(
              `${readableDate} · ${statusName}`
            );
          }
        }
      );

      grid.append(button);
    });

    const counts =
      countAttendance(
        month,
        records
      );

    presentValue.textContent =
      String(counts.present);

    absentValue.textContent =
      String(counts.absent);

    rateValue.textContent =
      `${counts.rate}%`;

    rateValue.title =
      counts.present + counts.absent
        ? 'Có mặt / số ngày đã có kết quả điểm danh trong tháng'
        : 'Chưa có kết quả điểm danh trong tháng';

    const currentStatus =
      todayStatus;

    previous.disabled =
      disabled ||
      loading ||
      month <= MIN_MONTH;

    next.disabled =
      disabled ||
      loading ||
      month >= MAX_MONTH;

    todayButton.disabled =
      disabled ||
      loading ||
      month === today.slice(0, 7);

    checkin.disabled =
      disabled ||
      loading ||
      currentStatus === 'present' ||
      currentStatus === 'absent' ||
      typeof options.onCheckin !== 'function';

    checkin.textContent = loading
      ? 'Đang tải…'
      : currentStatus === 'present'
        ? 'Đã điểm danh hôm nay ✓'
        : currentStatus === 'absent'
          ? 'Hôm nay đã có kết quả điểm danh'
          : (
              typeof options.onCheckin !== 'function' &&
              options.unavailableLabel
            )
            ? options.unavailableLabel
            : 'Điểm danh hôm nay';

    note.textContent =
      currentStatus === 'absent'
        ? 'Liên hệ người phụ trách nếu cần sửa kết quả.'
        : (
            typeof options.onCheckin !== 'function' &&
            options.unavailableNote
          )
          ? options.unavailableNote
          : 'Ghi nhận ngày bạn chủ động học tập.';

    card.setAttribute(
      'aria-busy',
      String(loading)
    );
  }

  /* Tải dữ liệu và chuyển tháng */
  async function loadMonth(target) {
    if (
      destroyed ||
      disabled ||
      loading ||
      !validMonth(target) ||
      target === month
    ) {
      return;
    }

    const request =
      ++sequence;

    const direction =
      target > month ? 1 : -1;

    const oldSheet =
      snapshotSheet();

    loading = true;

    setFeedback('');
    render();

    try {
      const result =
        typeof options.onMonthChange === 'function'
          ? await options.onMonthChange(target)
          : {};

      if (
        destroyed ||
        request !== sequence
      ) {
        return;
      }

      month = target;

      const loadedToday =
        result && result.today;

      if (
        validDate(loadedToday) &&
        loadedToday !== today
      ) {
        today = loadedToday;
        todayStatus = null;
      }

      records = normalizeRecords(
        result && result.attendance
          ? result.attendance
          : result
      );

      if (
        month === today.slice(0, 7)
      ) {
        todayStatus =
          records[today] || null;
      }

      render();

      await tearSheet(
        oldSheet,
        direction,
        request
      );
    } catch (error) {
      if (
        !destroyed &&
        request === sequence
      ) {
        setFeedback(
          error.message ||
          'Chưa tải được lịch. Bạn thử lại nhé.',
          true
        );
      }
    } finally {
      if (
        !destroyed &&
        request === sequence
      ) {
        loading = false;
        render();
      }
    }
  }

  /* Sự kiện chuyển tháng */
  listen(
    previous,
    'click',
    () => {
      loadMonth(
        moveMonth(month, -1)
      );
    }
  );

  listen(
    next,
    'click',
    () => {
      loadMonth(
        moveMonth(month, 1)
      );
    }
  );

  listen(
    todayButton,
    'click',
    () => {
      loadMonth(
        today.slice(0, 7)
      );
    }
  );

  /* Sự kiện điểm danh */
  listen(
    checkin,
    'click',
    async () => {
      if (
        disabled ||
        loading ||
        checkin.disabled
      ) {
        return;
      }

      const request =
        ++sequence;

      loading = true;

      setFeedback('');
      render();

      try {
        const result =
          await options.onCheckin();

        if (
          destroyed ||
          request !== sequence
        ) {
          return;
        }

        const checkedDate =
          result &&
          (
            result.today ||
            result.date
          );

        if (
          validDate(checkedDate) &&
          checkedDate !== today
        ) {
          today = checkedDate;
          todayStatus = null;
        }

        if (
          result &&
          result.attendance
        ) {
          records = normalizeRecords(
            result.attendance
          );
        }

        if (
          result &&
          result.status === 'present'
        ) {
          records[today] = 'present';
          todayStatus = 'present';
        }

        if (!records[today]) {
          const loaded =
            typeof options.onMonthChange === 'function'
              ? await options.onMonthChange(month)
              : null;

          if (
            destroyed ||
            request !== sequence
          ) {
            return;
          }

          if (loaded) {
            records =
              normalizeRecords(
                loaded.attendance ||
                loaded
              );
          }

          if (records[today]) {
            todayStatus =
              records[today];
          }
        }

        setFeedback(
          (
            result &&
            result.message
          ) ||
          'Đã cập nhật lịch điểm danh.'
        );
      } catch (error) {
        if (
          !destroyed &&
          request === sequence
        ) {
          setFeedback(
            error.message ||
            'Điểm danh chưa thành công. Bạn thử lại nhé.',
            true
          );
        }
      } finally {
        if (
          !destroyed &&
          request === sequence
        ) {
          loading = false;
          render();
        }
      }
    }
  );

  render();

  return {
    /* Cập nhật dữ liệu lịch từ trang chủ */
    update(patch = {}) {
      if (destroyed) return;

      sequence++;
      stopTear();
      loading = false;

      if (
        validDate(patch.today) &&
        patch.today !== today
      ) {
        today = patch.today;
        todayStatus = null;
      }

      if (
        validMonth(patch.month)
      ) {
        month = patch.month;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          patch,
          'records'
        )
      ) {
        records =
          normalizeRecords(
            patch.records
          );

        if (
          records[today] ||
          month === today.slice(0, 7)
        ) {
          todayStatus =
            records[today] || null;
        }
      }

      if (
        Object.prototype.hasOwnProperty.call(
          patch,
          'disabled'
        )
      ) {
        disabled =
          Boolean(patch.disabled);
      }

      render();
    },

    /* Dọn lịch khi cần khởi tạo lại */
    destroy() {
      if (destroyed) return;

      destroyed = true;
      sequence++;

      stopTear();

      cleanups.forEach(
        remove => remove()
      );

      root.replaceChildren();

      root.classList.remove(
        'attendance-widget'
      );
    }
  };
}