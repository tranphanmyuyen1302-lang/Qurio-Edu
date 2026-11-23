/* Qurio Exam Studio — theo chủ đề: aiGenerateExam; theo đặc tả: aiGenerateExamSpec.
   DOCX đọc tại trình duyệt; PDF cần pdf.js khi có Internet.
   Chỉ gửi VĂN BẢN trích xuất đến API Qurio / Woku, không tải file nhị phân. */
(() => {
  'use strict';
  const MAX_FILE = 10 * 1024 * 1024;
  const DOCX_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const $ = id => document.getElementById(id);
  let lastFile = null;
  let lastText = '';
  let loading = null;

  function showFileStatus(message, isError = false) {
    const el = $('aiSpecParseInfo');
    if (!el) return;
    el.textContent = message;
    el.style.color = isError ? '#b42346' : '#5732a5';
  }

  function zipEntry(buffer, name) {
    const view = new DataView(buffer);
    // ZIP end of central directory (đảm bảo không tìm nhầm trong dữ liệu).
    let end = -1;
    for (let p = buffer.byteLength - 22; p >= Math.max(0, buffer.byteLength - 65557); p--) {
      if (view.getUint32(p, true) === 0x06054b50) { end = p; break; }
    }
    if (end < 0) throw Error('File Word không phải định dạng DOCX hợp lệ.');
    const count = view.getUint16(end + 10, true);
    let pos = view.getUint32(end + 16, true);
    const decoder = new TextDecoder('utf-8');
    for (let i = 0; i < count; i++) {
      if (pos + 46 > buffer.byteLength || view.getUint32(pos, true) !== 0x02014b50) break;
      const method = view.getUint16(pos + 10, true);
      const compSize = view.getUint32(pos + 20, true);
      const rawSize = view.getUint32(pos + 24, true);
      const filenameLength = view.getUint16(pos + 28, true);
      const extraLength = view.getUint16(pos + 30, true);
      const commentLength = view.getUint16(pos + 32, true);
      const localOffset = view.getUint32(pos + 42, true);
      const filename = decoder.decode(new Uint8Array(buffer, pos + 46, filenameLength));
      if (filename === name) {
        if (rawSize > 8 * 1024 * 1024) throw Error('Nội dung Word quá lớn để xử lý trên trình duyệt.');
        if (view.getUint32(localOffset, true) !== 0x04034b50) throw Error('Cấu trúc DOCX bị hỏng.');
        const start = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
        if (start + compSize > buffer.byteLength) throw Error('Nội dung file DOCX bị thiếu.');
        return { method, bytes: new Uint8Array(buffer.slice(start, start + compSize)) };
      }
      pos += 46 + filenameLength + extraLength + commentLength;
    }
    throw Error('Không tìm thấy nội dung văn bản trong DOCX.');
  }

  async function docxText(file) {
    const entry = zipEntry(await file.arrayBuffer(), 'word/document.xml');
    let raw;
    if (entry.method === 0) raw = entry.bytes.buffer;
    else if (entry.method === 8) {
      if (typeof DecompressionStream === 'undefined') {
        throw Error('Trình duyệt chưa hỗ trợ đọc DOCX. Hãy mở bằng Chrome hoặc Edge mới nhất.');
      }
      raw = await new Response(
        new Blob([entry.bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
      ).arrayBuffer();
    } else throw Error('DOCX sử dụng kiểu nén chưa được hỗ trợ.');
    if (raw.byteLength > 8 * 1024 * 1024) throw Error('Nội dung DOCX vượt giới hạn.');
    const xml = new DOMParser().parseFromString(new TextDecoder().decode(raw), 'application/xml');
    if (xml.querySelector('parsererror')) throw Error('Không đọc được cấu trúc XML trong DOCX.');
    const body = xml.getElementsByTagNameNS(DOCX_NS, 'body')[0];
    if (!body) throw Error('DOCX không có phần nội dung.');
    const paras = (element) => Array.from(element.getElementsByTagNameNS(DOCX_NS, 'p'));
    const para = p => Array.from(p.getElementsByTagNameNS(DOCX_NS, 't'))
      .map(t => t.textContent).join('').trim();
    const lines = [];
    for (const child of body.children) {
      if (child.localName === 'p') {
        const text = para(child);
        if (text) lines.push(text);
      } else if (child.localName === 'tbl') {
        for (const row of child.children) {
          if (row.localName !== 'tr') continue;
          const cells = Array.from(row.children).filter(c => c.localName === 'tc')
            .map(c => paras(c).map(para).filter(Boolean).join(' / '));
          if (cells.some(Boolean)) lines.push(cells.join(' | '));
        }
      }
    }
    return lines.join('\n').trim();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => { script.remove(); reject(Error('Không tải được thư viện đọc PDF.')); };
      document.head.appendChild(script);
    });
  }

  async function pdfText(file) {
    if (!window.pdfjsLib) {
      try { await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'); }
      catch (_) { await loadScript('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'); }
    }
    const pdf = window.pdfjsLib;
    if (!pdf) throw Error('Không tải được thư viện đọc PDF. Hãy dùng DOCX/TXT hoặc dán văn bản.');
    pdf.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const documentPDF = await pdf.getDocument({data: new Uint8Array(await file.arrayBuffer()), disableFontFace: true}).promise;
    const lines = [];
    const pageCount = Math.min(documentPDF.numPages, 70);
    for (let index = 1; index <= pageCount; index++) {
      const page = await documentPDF.getPage(index);
      const content = await page.getTextContent();
      let str = '';
      for (const item of content.items) {
        str += (item.str || '') + (item.hasEOL ? '\n' : ' ');
      }
      if (str.trim()) lines.push(`Trang ${index}:\n` + str.trim());
    }
    return lines.join('\n').trim();
  }

  async function extract(file) {
    if (!file) return '';
    if (file.size > MAX_FILE) throw Error('Tệp vượt quá 10 MB.');
    if (/\.txt$/i.test(file.name)) return file.text();
    if (/\.docx$/i.test(file.name)) return docxText(file);
    if (/\.pdf$/i.test(file.name)) return pdfText(file);
    throw Error('Chỉ hỗ trợ DOCX, PDF và TXT.');
  }

  async function readFile(file) {
    if (!file) return '';
    if (lastFile === file && lastText) return lastText;
    const text = (await extract(file)).replace(/\u0000/g, '').trim();
    if (!text || text.length < 30) {
      throw Error('Không trích xuất được văn bản. Với PDF dạng ảnh, hãy dán nội dung đặc tả vào ô bên dưới.');
    }
    lastFile = file;
    lastText = text;
    return text;
  }

  function normalizeQuestions(items) {
    return (items || []).map(q => {
      const options = (q.options || []).map(x => String(x));
      const answer = q.answer;
      let index = typeof answer === 'number' ? answer : -1;
      if (index < 0 && typeof answer === 'string') {
        const val = answer.trim();
        if (/^[A-D]$/i.test(val)) index = val.toUpperCase().charCodeAt(0) - 65;
        else if (/^[0-3]$/.test(val)) index = Number(val);
        else index = options.findIndex(x => x.toLowerCase().trim() === val.toLowerCase());
      }
      const choices = q.correct || (index >= 0 && index < options.length ? [index] : []);
      return {
        type: q.type === 'paragraph' ? 'paragraph' : 'single',
        text: String(q.prompt || q.text || q.question || ''),
        options,
        correct: Array.isArray(choices) ? choices : [],
        answer: q.type === 'paragraph' ? String(q.answer || '') : '',
        explanation: String(q.explanation || ''),
        points: Number(q.points) > 0 ? Number(q.points) : 1,
        required: true
      };
    }).filter(q => q.text.trim() && (q.type === 'paragraph' || q.options.length >= 2));
  }

  async function requestBatch({subject, grade, topic, count, difficulty}) {
    if (!window.QurioAuth?.request) throw Error('Chưa tải được kết nối đăng nhập (Chung/chung.js).');
    let result;
    try {
      result = await window.QurioAuth.request('aiGenerateExam', {
        subject: subject || 'Khác',
        grade: Number(grade) || 11,
        topic,
        count,
        difficulty: ({'Hỗn hợp':'mixed','Nhận biết':'easy','Thông hiểu':'medium','Vận dụng':'hard'})[difficulty] || difficulty || 'mixed'
      });
    } catch (error) {
      // Code.gs cũ có thể giới hạn độ dài chủ đề. Chỉ thử lại khi đúng lỗi dữ liệu.
      if (topic.length <= 250 || !/(dữ liệu nhập không hợp lệ|quá dài|too long|vượt giới hạn)/i.test(error.message || '')) throw error;
      const fallbackTopic = topic.slice(0, 245);
      result = await window.QurioAuth.request('aiGenerateExam', {
        subject: subject || 'Khác', grade: Number(grade) || 11,
        topic: fallbackTopic, count, difficulty: ({'Hỗn hợp':'mixed','Nhận biết':'easy','Thông hiểu':'medium','Vận dụng':'hard'})[difficulty] || difficulty || 'mixed'
      });
    }
    if (!result || !Array.isArray(result.questions)) {
      throw Error(result?.message || 'AI không trả về danh sách câu hỏi.');
    }
    return normalizeQuestions(result.questions);
  }

  function specSummary(content, max = 2800) {
    if (content.length <= max) return content;
    const lines = content.split(/\n+/).map(s => s.trim()).filter(Boolean);
    const priority = /(ma trận|đặc tả|mục tiêu|yêu cầu cần đạt|nhận biết|thông hiểu|vận dụng|tổng số|số câu|chủ đề|nội dung|điểm|thời gian)/i;
    const picked = [...lines.filter(x => priority.test(x)), ...lines.filter(x => !priority.test(x))];
    return picked.join('\n').slice(0, max);
  }

  async function generate(source, data) {
    const subject = String(data.subject || 'Khác').trim();
    const grade = Number(data.grade) || 11;
    const count = Math.max(1, Math.min(source === 'topic' ? 60 : 40, Number(data.count) || 20));

    
    if (source !== 'topic') {
      const manual = String(data.text || '').trim();
      const extracted = data.file ? await readFile(data.file) : '';

      const spec = !extracted ? manual :
        (!manual || extracted.startsWith(manual)
          ? extracted : manual + '\n' + extracted);

      if (spec.trim().length < 40) {
        throw Error(
          'Không đọc đủ nội dung bản đặc tả (cần ít nhất 40 ký tự).'
        );
      }

      if (!window.QurioAuth?.request) {
        throw Error('Chưa đăng nhập hoặc chưa tải kết nối Qurio.');
      }

      const specCount = Math.min(40, count);

      showFileStatus(
        'Đã đọc ' + spec.length +
        ' ký tự. Đang phân tích ma trận...'
      );

      const result = await window.QurioAuth.request(
        'aiGenerateExamSpec',
        {
          subject: String(subject).trim(),
          grade: grade,
          count: specCount,
          specText: spec.slice(0, 14000),
          sourceName: data.file?.name || 'Nội dung nhập'
        }
      );

      const questions = normalizeQuestions(result?.questions);

      if (!questions.length) {
        throw Error(
          result?.message || 'AI chưa trả về câu hỏi hợp lệ.'
        );
      }

      showFileStatus(
        'Đã tạo ' + questions.length +
        ' câu. Giáo viên kiểm tra trước khi duyệt.'
      );

      return {
        title: 'Đề kiểm tra theo đặc tả - ' +
          subject + ' ' + grade,
        subject,
        grade,
        questions,
        sections: result.sections || [],
        notices: result.notices || []
      };
    }
    const topic = String(data.topic || '').trim();

if (!topic) {
  throw new Error('Vui lòng nhập chủ đề cần tạo đề.');
}

const all = [];
    while (all.length < count) {
      const n = Math.min(20, count - all.length);
      const chunk = await requestBatch({subject, grade, topic, count:n, difficulty:data.level || 'Hỗn hợp'});
      if (!chunk.length) throw Error('AI không tạo được câu hỏi hợp lệ.');
      all.push(...chunk.slice(0,n));
      if (chunk.length < n) break;
    }
    return { title: `Đề kiểm tra – ${topic.slice(0,55)}`, subject, grade, questions:all };
  }

  document.addEventListener('change', async event => {
    if (event.target?.id !== 'aiSpecFile') return;
    const file = event.target.files?.[0];
    if (!file) return;
    lastFile = null; lastText = '';
    showFileStatus('Đang đọc nội dung ' + file.name + '…');
    loading = readFile(file);
    try {
      const text = await loading;
      if ($('aiSpecFile')?.files?.[0] !== file) return;
      showFileStatus(`✓ Đã đọc ${text.length.toLocaleString('vi-VN')} ký tự. Bạn có thể kiểm tra nội dung ngay bên dưới.`);
      const input = $('aiSpecText');
      if (input && !input.value.trim()) input.value = text.slice(0, 15000);
    } catch (error) {
      showFileStatus(error.message, true);
    } finally { loading = null; }
  });

  window.QurioExamAPI = {
    topic: data => generate('topic', data),
    spec: data => generate('spec', data),
    pdf: data => generate('pdf', {...data, count: 20, subject: data.subject || 'Khác'})
  };
  window.QurioSpecReader = {extract};
})();
