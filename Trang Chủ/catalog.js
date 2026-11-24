// Danh mục môn học.
// Các trang trong thư mục page vẫn để trắng để bạn thiết kế sau.

export const SUBJECTS = [
  {
    id: 'math',
    name: 'Toán học',
    subtitle: 'Tư duy logic, mở lối sáng tạo',
    color: '#7d68df',
    lessonId: 'math-linear',
    page: '../page/Khám Phá/kham-pha.html'
  },
  {
    id: 'history',
    name: 'Lịch sử',
    subtitle: 'Hiểu hôm qua, khám phá hôm nay',
    color: '#d59659',
    lessonId: 'history-1945',
    page: '../page/Khám Phá/kham-pha.html'
  },
  {
    id: 'english',
    name: 'Ngoại ngữ',
    subtitle: 'Tự tin kết nối với thế giới',
    color: '#5e9a8f',
    lessonId: 'english-present',
    page: '../page/Khám Phá/kham-pha.html'
  },
  {
    id: 'it',
    name: 'Tin học',
    subtitle: 'Bắt đầu hành trình công nghệ',
    color: '#6a94cd',
    lessonId: 'it-algorithm',
    page: '../page/Khám Phá/kham-pha.html'
  }
];

// Giữ mã bài để đọc đúng tiến độ đã lưu trong Google Sheets.
export const LESSONS = [
  {
    id: 'math-linear',
    subjectId: 'math',
    title: 'Bắt đầu với phương trình',
    minutes: 3,
    answer: 1
  },
  {
    id: 'history-1945',
    subjectId: 'history',
    title: 'Một dấu mốc năm 1945',
    minutes: 3,
    answer: 2
  },
  {
    id: 'english-present',
    subjectId: 'english',
    title: 'Thói quen với hiện tại đơn',
    minutes: 3,
    answer: 0
  },
  {
    id: 'it-algorithm',
    subjectId: 'it',
    title: 'Thuật toán quanh ta',
    minutes: 3,
    answer: 1
  }
];