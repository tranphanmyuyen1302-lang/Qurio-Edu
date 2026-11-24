(()=>{'use strict';
const BANK={math:{name:'Toán 11',topics:[['Công thức lượng giác','Giá trị lượng giác và các công thức cơ bản',[]],['Hàm số lượng giác','Chu kỳ và tính chất hàm số lượng giác',[0]],['Phương trình lượng giác','Giải các phương trình lượng giác cơ bản',[0]],['Điều kiện nghiệm','Xác định điều kiện xác định và nghiệm hợp lệ',[2]],['Vận dụng tổng hợp','Kết hợp nhiều kiến thức để giải bài toán',[1,2,3]]],questions:[['Giá trị của sin(π/2) là bao nhiêu?',['0','1','-1','1/2'],1],['Chu kỳ của hàm số y = sin x là gì?',['π','2π','π/2','4π'],1],['Phương trình sin x = 0 có nghiệm tổng quát nào?',['x = kπ','x = π/2 + kπ','x = 2kπ + π/2','x = π/4 + kπ'],0],['Nghiệm của tan x = 1 là gì?',['x = π/2 + kπ','x = π/4 + kπ','x = kπ','x = π + 2kπ'],1],['Trong [0, 2π), phương trình sin x = 1 có bao nhiêu nghiệm?',['0','1','2','3'],1]]},physics:{name:'Vật lý 11',topics:[['Điện tích','Điện tích và tương tác điện',[]],['Định luật Coulomb','Lực tương tác giữa hai điện tích',[0]],['Điện trường','Khái niệm điện trường và cường độ điện trường',[0,1]],['Điện thế','Điện thế và hiệu điện thế',[2]],['Vận dụng điện học','Vận dụng các kiến thức điện học',[1,2,3]]],questions:[['Hai điện tích cùng dấu sẽ như thế nào?',['Hút nhau','Đẩy nhau','Không tương tác','Luôn trung hòa'],1],['Theo định luật Coulomb, lực tỉ lệ nghịch với đại lượng nào?',['Khoảng cách','Bình phương khoảng cách','Điện tích','Khối lượng'],1],['Đơn vị của cường độ điện trường là gì?',['N/C','Jun','Culông','Ôm'],0],['Đơn vị của hiệu điện thế là gì?',['Ampe','Vôn','Oát','Niutơn'],1],['Điện tích q = 2 C đi qua hiệu điện thế 3 V, công của lực điện là bao nhiêu?',['1 J','5 J','6 J','9 J'],2]]},informatics:{name:'Tin học 11',topics:[['Hệ điều hành','Vai trò và chức năng hệ điều hành',[]],['Hệ nhị phân','Biểu diễn và chuyển đổi số nhị phân',[]],['Phép toán logic','Các phép AND, OR, NOT',[1]],['Mạch logic','Biểu diễn biểu thức bằng mạch logic',[2]],['Vận dụng tổng hợp','Kết hợp biểu diễn số và logic',[1,2,3]]],questions:[['Chức năng chính của hệ điều hành là gì?',['Quản lý tài nguyên máy tính','Chỉ tạo văn bản','Chỉ duyệt web','Chỉ vẽ hình'],0],['Số nhị phân 101 tương ứng số thập phân nào?',['3','4','5','6'],2],['Kết quả 1 AND 0 là gì?',['1','0','2','Không xác định'],1],['Cổng NOT nhận đầu vào 1 sẽ cho đầu ra nào?',['1','0','2','Không đổi'],1],['Kết quả (1 OR 0) AND 1 là gì?',['0','1','2','Không xác định'],1]]}};

const EXTRA={math:[
['Giá trị cos(0) bằng bao nhiêu?',['0','1','-1','2'],1,'cos(0) = 1.'],
['Hàm số y = cos x là hàm số gì?',['Chẵn','Lẻ','Không chẵn không lẻ','Không tuần hoàn'],0,'cos(-x) = cos x nên là hàm chẵn.'],
['Phương trình cos x = 1 có nghiệm nào?',['x = kπ','x = 2kπ','x = π/2 + kπ','x = π/4 + kπ'],1,'cos x = 1 khi x = 2kπ.'],
['Biểu thức tan x xác định khi nào?',['cos x khác 0','sin x khác 0','cos x bằng 0','mọi x'],0,'tan x = sin x / cos x, mẫu phải khác 0.'],
['Trong [0,2π), cos x = -1 có nghiệm nào?',['0','π/2','π','3π/2'],2,'cos π = -1.']],
physics:[
['Đơn vị điện tích trong hệ SI là gì?',['V','C','N','A'],1,'Đơn vị điện tích là culông (C).'],
['Hai điện tích q1 và q2 tăng gấp đôi, khoảng cách không đổi, lực Coulomb thay đổi thế nào?',['Gấp đôi','Gấp bốn','Giảm hai','Không đổi'],1,'F tỉ lệ với tích độ lớn hai điện tích.'],
['Cường độ điện trường được xác định bằng công thức nào?',['E = F/q','E = q/F','E = Fq','E = Uq'],0,'E = F/q với q là điện tích thử dương.'],
['Hiệu điện thế giữa hai điểm được đo bằng đơn vị nào?',['J','C','V','N'],2,'Đơn vị hiệu điện thế là vôn (V).'],
['Nếu U = 6 V, q = 3 C, công lực điện bằng bao nhiêu?',['2 J','9 J','18 J','3 J'],2,'A = qU = 3 × 6 = 18 J.']],
informatics:[
['Hệ điều hành nào sau đây là mã nguồn mở?',['Linux','Windows','iOS','macOS'],0,'Linux là hệ điều hành mã nguồn mở.'],
['Số nhị phân 1101 tương ứng thập phân nào?',['11','12','13','14'],2,'1101₂ = 8 + 4 + 0 + 1 = 13.'],
['1 OR 0 bằng bao nhiêu?',['0','1','2','Không xác định'],1,'OR cho 1 khi ít nhất một đầu vào bằng 1.'],
['Cổng AND với đầu vào 1 và 1 cho kết quả nào?',['0','1','2','Không xác định'],1,'AND bằng 1 khi tất cả đầu vào bằng 1.'],
['NOT (1 AND 0) bằng bao nhiêu?',['0','1','2','Không xác định'],1,'1 AND 0 = 0, NOT 0 = 1.']]};
for(const id of Object.keys(BANK)){BANK[id].questions=BANK[id].questions.flatMap((q,i)=>[[...q,'Đáp án đúng: '+q[1][q[2]]+'.'],EXTRA[id][i]]);}

/* ===== QURIO: BO SUNG 5 MON KHOI 11 ===== */

Object.assign(BANK, {

  chemistry: {
    name: "Hóa học 11",
    topics: [
      ["Cân bằng hóa học", "Phản ứng thuận nghịch", []],
      ["Chuyển dịch cân bằng", "Nguyên lí Le Chatelier", [0]],
      ["Sự điện li", "Chất điện li và ion", [1]],
      ["Axit và bazơ", "Tính chất axit, bazơ", [2]],
      ["Hợp chất nitơ", "Amoniac và muối amoni", [3]]
    ],
    questions: [
      ["Phản ứng thuận nghịch diễn ra theo mấy chiều?", ["1", "2", "3", "4"], 1],
      ["Ở trạng thái cân bằng, tốc độ phản ứng thuận và nghịch như thế nào?", ["Bằng nhau", "Bằng 0", "Khác nhau", "Không xác định"], 0],
      ["Tăng nhiệt độ ưu tiên chiều phản ứng nào?", ["Tỏa nhiệt", "Thu nhiệt", "Không ảnh hưởng", "Luôn chiều thuận"], 1],
      ["Khi tăng áp suất, cân bằng khí thường chuyển về phía nào?", ["Nhiều mol khí", "Ít mol khí", "Luôn chiều thuận", "Luôn chiều nghịch"], 1],
      ["Chất nào là chất điện li mạnh?", ["HCl", "CH3COOH", "C2H5OH", "Đường"], 0],
      ["NaCl phân li thành những ion nào?", ["Na+ và Cl-", "H+ và OH-", "Na và Cl", "Na2+ và Cl2-"], 0],
      ["Dung dịch nào có tính axit?", ["NaOH", "HCl", "KOH", "NH3"], 1],
      ["NaOH làm quỳ tím chuyển thành màu gì?", ["Đỏ", "Xanh", "Vàng", "Không đổi"], 1],
      ["Công thức của amoniac là gì?", ["NH4", "NH3", "NO2", "N2O"], 1],
      ["Ion amoni có công thức nào?", ["NH3", "NH4+", "NO3-", "N2"], 1]
    ]
  },

  biology: {
    name: "Sinh học 11",
    topics: [
      ["Trao đổi nước", "Hấp thụ và vận chuyển nước", []],
      ["Quang hợp", "Tổng hợp chất hữu cơ", [0]],
      ["Hô hấp", "Chuyển hóa năng lượng", [1]],
      ["Tiêu hóa", "Tiêu hóa ở động vật", [2]],
      ["Tuần hoàn", "Vận chuyển các chất", [3]]
    ],
    questions: [
      ["Cây hấp thụ nước chủ yếu qua đâu?", ["Lá", "Rễ", "Hoa", "Thân"], 1],
      ["Nước được vận chuyển chủ yếu qua mô nào?", ["Mạch gỗ", "Mạch rây", "Biểu bì", "Mô phân sinh"], 0],
      ["Quang hợp sử dụng nguồn năng lượng nào?", ["Gió", "Ánh sáng", "Âm thanh", "Điện"], 1],
      ["Quang hợp thường giải phóng khí gì?", ["CO2", "O2", "N2", "H2"], 1],
      ["Hô hấp tế bào tạo ra năng lượng chủ yếu dưới dạng nào?", ["ATP", "Ánh sáng", "Diệp lục", "Nhiệt môi trường"], 0],
      ["Hô hấp hiếu khí sử dụng khí nào?", ["CO2", "O2", "N2", "H2"], 1],
      ["Enzyme tiêu hóa có vai trò gì?", ["Xúc tác", "Bơm máu", "Quang hợp", "Vận chuyển oxy"], 0],
      ["Tiêu hóa hóa học chủ yếu nhờ yếu tố nào?", ["Ánh sáng", "Enzyme", "Áp suất", "Lực cơ học"], 1],
      ["Cơ quan bơm máu là gì?", ["Phổi", "Tim", "Gan", "Thận"], 1],
      ["Mạch đưa máu từ tim đi là gì?", ["Tĩnh mạch", "Động mạch", "Mao mạch", "Mạch rây"], 1]
    ]
  },

  english: {
    name: "Tiếng Anh 11",
    topics: [
      ["Tenses", "Các thì động từ", []],
      ["Passive voice", "Câu bị động", [0]],
      ["Modal verbs", "Động từ khuyết thiếu", [1]],
      ["Conditionals", "Câu điều kiện", [2]],
      ["Vocabulary", "Từ vựng theo chủ đề", [3]]
    ],
    questions: [
      ["She ___ to school every day.", ["go", "goes", "going", "gone"], 1],
      ["They ___ football yesterday.", ["play", "plays", "played", "playing"], 2],
      ["English ___ in many countries.", ["speaks", "is spoken", "spoke", "speaking"], 1],
      ["The room ___ every day.", ["cleans", "is cleaned", "cleaning", "clean"], 1],
      ["You ___ wear a helmet when riding a motorbike.", ["must", "might not", "needn't", "can't"], 0],
      ["You ___ see a doctor if you feel ill.", ["should", "must not", "can't", "would not"], 0],
      ["If it rains, we ___ at home.", ["stayed", "will stay", "staying", "stays"], 1],
      ["If I had more time, I ___ travel more.", ["will", "would", "can", "am"], 1],
      ["A generation ___ refers to differences between generations.", ["gap", "bridge", "floor", "door"], 0],
      ["A healthy ___ includes enough sleep.", ["lifestyle", "lifetime", "lifespan", "lifeline"], 0]
    ]
  },

  history: {
    name: "Lịch sử 11",
    topics: [
      ["Cách mạng tư sản", "Các cuộc cách mạng tư sản", []],
      ["Chủ nghĩa tư bản", "Sự hình thành và phát triển", [0]],
      ["Chủ nghĩa xã hội", "Những sự kiện lịch sử", [1]],
      ["Đông Nam Á", "Lịch sử khu vực", [2]],
      ["Lịch sử Việt Nam", "Các dấu mốc tiêu biểu", [3]]
    ],
    questions: [
      ["Cách mạng tư sản Pháp bắt đầu năm nào?", ["1789", "1848", "1917", "1945"], 0],
      ["Cách mạng công nghiệp đầu tiên bắt đầu ở nước nào?", ["Anh", "Pháp", "Nga", "Nhật Bản"], 0],
      ["Chủ nghĩa tư bản gắn với phương thức sản xuất nào?", ["Phong kiến", "Tư bản chủ nghĩa", "Chiếm hữu nô lệ", "Cộng sản nguyên thủy"], 1],
      ["Cách mạng công nghiệp lần thứ nhất gắn với nguồn động lực nào?", ["Hơi nước", "Internet", "Năng lượng hạt nhân", "Trí tuệ nhân tạo"], 0],
      ["Cách mạng tháng Mười Nga diễn ra năm nào?", ["1789", "1917", "1945", "1975"], 1],
      ["Liên Xô được thành lập năm nào?", ["1917", "1922", "1945", "1991"], 1],
      ["ASEAN được thành lập năm nào?", ["1945", "1967", "1975", "1995"], 1],
      ["ASEAN được thành lập tại quốc gia nào?", ["Thái Lan", "Việt Nam", "Lào", "Campuchia"], 0],
      ["Chiến thắng Bạch Đằng của Ngô Quyền diễn ra năm nào?", ["938", "1010", "1226", "1288"], 0],
      ["Nhà Trần được thành lập năm nào?", ["938", "1010", "1226", "1400"], 2]
    ]
  },

  geography: {
    name: "Địa lí 11",
    topics: [
      ["Toàn cầu hóa", "Hội nhập kinh tế", []],
      ["Kinh tế tri thức", "Công nghệ và đổi mới", [0]],
      ["Liên minh châu Âu", "Liên kết khu vực", [1]],
      ["Đông Nam Á", "Tự nhiên và kinh tế", [2]],
      ["Kỹ năng địa lí", "Đọc bản đồ và biểu đồ", [3]]
    ],
    questions: [
      ["Toàn cầu hóa làm tăng điều gì?", ["Liên kết quốc tế", "Cô lập", "Tự cấp hoàn toàn", "Ngừng thương mại"], 0],
      ["Tổ chức nào liên quan đến thương mại thế giới?", ["WHO", "WTO", "FIFA", "UNICEF"], 1],
      ["Hoạt động nào thuộc ngành dịch vụ?", ["Trồng lúa", "Khai thác than", "Du lịch", "Chăn nuôi"], 2],
      ["Nguồn lực quan trọng của kinh tế tri thức là gì?", ["Đất đai", "Tri thức", "Than đá", "Dầu mỏ"], 1],
      ["EU chủ yếu nằm ở châu lục nào?", ["Châu Á", "Châu Âu", "Châu Phi", "Châu Mỹ"], 1],
      ["Đồng tiền chung của nhiều nước EU là gì?", ["USD", "Yên", "Euro", "Nhân dân tệ"], 2],
      ["Đông Nam Á chủ yếu có khí hậu nào?", ["Hàn đới", "Nhiệt đới", "Cận cực", "Ôn đới lạnh"], 1],
      ["Việt Nam giáp biển nào?", ["Biển Đỏ", "Biển Đen", "Biển Đông", "Biển Baltic"], 2],
      ["Bản đồ tỉ lệ 1:100000, 1 cm bằng bao nhiêu km thực tế?", ["1 km", "10 km", "100 km", "0,1 km"], 0],
      ["Biểu đồ tròn thường dùng để thể hiện gì?", ["Cơ cấu", "Tọa độ", "Đường đi", "Độ cao"], 0]
    ]
  }

});

/* Bo sung giai thich dap an cho 5 mon moi */
[
  "chemistry",
  "biology",
  "english",
  "history",
  "geography"
].forEach(id => {
  BANK[id].questions = BANK[id].questions.map(q => [
    ...q,
    "Đáp án đúng: " + q[1][q[2]] + "."
  ]);
});

let testQuestions=[],testSubject='math',testMode='assessment',testTopic=0,feedbackReturn=null;

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];let subject='math',selected=0,records={},answers={};const key='qurio_roadmap_v1';const goalKey='qurio_goals_v2';
function account(){try{let u=JSON.parse(localStorage.getItem('nguoiDungHienTai')||'null');return u?.email||u?.Email||u?.tenDangNhap||'local'}catch{return 'local'}}
function load(){try{return JSON.parse(localStorage.getItem(key+'_'+account())||'{}')}catch{return {}}}


function save() {
  try {
    localStorage.setItem(
      key + "_" + account(),
      JSON.stringify(records)
    );

    window.dispatchEvent(
      new CustomEvent("qurio:learning-sync", {
        detail: { records }
      })
    );

    if (window.QurioLearningSync) {
      window.QurioLearningSync.save(records)
        .catch(error => {
          console.warn(
            "Qurio đồng bộ:",
            error.message
          );
        });
    }
  } catch (error) {
    toast("Không thể lưu kết quả học tập.");
  }
}


function toast(msg){const e=$('#roadToast');e.textContent=msg;e.style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.style.display='none',3300)}
function current(){return records[subject]||null}function status(v){return v==null?'Chưa đánh giá':v>=80?'Vững':v>=60?'Cần củng cố':'Cần ưu tiên'}function cls(v){return v==null?'unknown':v>=80?'mastered':v>=60?'practice':'priority'}
function priorityOrder(scores,topics){let arr=topics.map((t,i)=>i);if(!scores)return arr;let weights=topics.map((t,i)=>{const missing=t[2].filter(j=>scores[j]!==null&&scores[j]<60).length;return {i,score:scores[i],weight:(scores[i]===null?0:100-scores[i])+missing*25}});return weights.sort((a,b)=>b.weight-a.weight||a.i-b.i).map(x=>x.i)}
function render(){renderMulti();renderHistory();const bank=BANK[subject],data=current(),scores=data?.scores||null,enabled=$('#grade').value==='11';$('#unsupported').hidden=enabled;$('#startTest').disabled=!enabled;$('#emptyStart').disabled=!enabled;$('#recommendAction').disabled=!enabled;$('#mapEmpty').hidden=!!scores;$('#mapResult').hidden=!scores;$('#journeyEmpty').hidden=!!scores;$('#journey').hidden=!scores;const known=scores?scores.filter(v=>v!==null):[];const avg=known.length?Math.round(known.reduce((a,b)=>a+b,0)/known.length):null;$('#average').textContent=avg==null?'—':avg+'%';$('#weak').textContent=scores?scores.filter(x=>x!==null&&x<60).length:'—';$('#completed').textContent=scores?scores.filter(x=>x!==null&&x>=80).length+'/5':'—';$('#state').textContent=scores?'Đã cá nhân hóa':'Chờ đánh giá';const order=priorityOrder(scores,bank.topics);$('#journey').innerHTML=order.map((i,pos)=>{let v=scores?.[i];return `<div class="step"><div class="step-num">${pos+1}</div><div class="step-body"><strong>${bank.topics[i][0]}</strong><small>${v==null?'Chưa đánh giá':v+'% thành thạo'}</small><div class="step-meter"><i style="width:${v||0}%"></i></div></div><span class="step-tag ${cls(v)}">${status(v)}</span></div>`}).join('');
const positions=[[50,12],[18,29],[82,29],[24,77],[76,77]];const nodes=$('#graphNodes');nodes.replaceChildren();bank.topics.forEach((t,i)=>{const b=document.createElement('button');b.type='button';b.className='node '+cls(scores?.[i])+(selected===i?' selected':'');b.style.left=positions[i][0]+'%';b.style.top=positions[i][1]+'%';b.textContent=t[0];const n=document.createElement('b');n.textContent=scores&&scores[i]!=null?scores[i]+'%':'—';b.append(n);b.onclick=()=>{selected=i;render()};nodes.append(b)});
const svg=$('#edges');svg.replaceChildren();const NS='http://www.w3.org/2000/svg';function line(x1,y1,x2,y2,color,dash){const el=document.createElementNS(NS,'line');Object.entries({x1,y1,x2,y2,stroke:color,'stroke-width':2,'stroke-dasharray':dash?'5 5':'0'}).forEach(([k,v])=>el.setAttribute(k,v));svg.append(el)};positions.forEach(p=>line(300,133,p[0]*6,p[1]*3.1,'#d9cef5',true));bank.topics.forEach((t,i)=>t[2].forEach(j=>line(positions[j][0]*6,positions[j][1]*3.1,positions[i][0]*6,positions[i][1]*3.1,'#b59cf1',false)));
const topic=bank.topics[selected],v=scores?.[selected];$('#topicDetail').innerHTML=`<strong>${topic[0]} · ${v==null?'Chưa đánh giá':v+'% · '+status(v)}</strong><p>${topic[1]}${topic[2].length?' · Kiến thức tiên quyết: '+topic[2].map(i=>bank.topics[i][0]).join(', '):''}.</p>`;
const first=order[0],target=bank.topics[first];$('#recommendTitle').textContent=scores?'Ưu tiên: '+target[0]:'Bắt đầu từ bài đánh giá năng lực';$('#practiceArea').hidden=!scores;$('#practiceDescription').textContent=scores?'Gợi ý tiếp theo: '+target[0]+' ('+scores[first]+'%). Làm bài luyện tập để cập nhật năng lực.':'';$('#recommendText').textContent=scores?`Mức thành thạo ước lượng ${scores[first]}%. ${target[1]}. Hãy củng cố kiến thức nền và đánh giá lại để cập nhật lộ trình.`:'Làm bài kiểm tra để Qurio xác định những chủ đề cần ưu tiên.';$('#recommendAction').textContent=scores?'Luyện tập chủ đề ưu tiên →':'Bắt đầu đánh giá →';$('#explain').textContent=scores?`Qurio ưu tiên ${target[0]} dựa trên mức thành thạo ${scores[first]}% và ${target[2].filter(i=>scores[i]<60).length} kiến thức tiên quyết đang yếu. Điểm số được cập nhật từ kết quả mới (65%) và lịch sử trước đó (35%). Kết quả mang tính tham khảo.`:'Qurio dựa trên câu trả lời của bạn để ước lượng mức thành thạo, đồng thời xem xét các quan hệ kiến thức nền. Kết quả được cập nhật khi bạn hoàn thành bài đánh giá.'}
function openTest(mode='assessment',topic=0){if($('#grade').value!=='11'){toast('Vui lòng chọn Khối 11.');return}testMode=mode;testTopic=topic;testSubject=subject;answers={};const pool=BANK[subject].questions;testQuestions=mode==='practice'?pool.slice(topic*2,topic*2+2).map((q,i)=>({q,topic,index:topic*2+i})):pool.map((q,i)=>({q,topic:Math.floor(i/2),index:i}));$('#testTitle').textContent=(mode==='practice'?'Luyện tập · '+BANK[subject].topics[topic][0]:'Đánh giá năng lực · '+BANK[subject].name);$('#questions').replaceChildren();testQuestions.forEach(({q},i)=>{const sec=document.createElement('section');sec.className='question';const title=document.createElement('strong');title.textContent=`Câu ${i+1}. ${q[0]}`;sec.append(title);q[1].forEach((opt,k)=>{const label=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='question'+i;input.value=k;input.addEventListener('change',()=>{answers[i]=k;$('#testCount').textContent=Object.keys(answers).length+'/'+testQuestions.length+' câu đã trả lời'});label.append(input,document.createTextNode(opt));sec.append(label)});$('#questions').append(sec)});$('#testCount').textContent='0/'+testQuestions.length+' câu đã trả lời';$('#testModal').hidden=false;document.body.style.overflow='hidden';$('#closeTest').focus()}
function closeTest(){$('#testModal').hidden=true;document.body.style.overflow=''}
function submit(){if(Object.keys(answers).length!==testQuestions.length){toast('Vui lòng trả lời đủ câu trước khi nộp.');return}const old=records[testSubject],correct=testQuestions.map(({q},i)=>answers[i]===q[2]);let scores=old?.scores?[...old.scores]:Array(5).fill(null);const touched=new Set(testQuestions.map(x=>x.topic));for(const t of touched){const indices=testQuestions.map((x,i)=>x.topic===t?i:-1).filter(i=>i>=0);const accuracy=indices.filter(i=>correct[i]).length/indices.length;const sample=Math.round(20+80*accuracy);scores[t]=scores[t]===null?sample:Math.round(.35*scores[t]+.65*sample)}const now=new Date().toISOString();const attempt={date:now,mode:testMode,topic:testMode==='practice'?testTopic:null,correct:correct.filter(Boolean).length,total:correct.length,scores:[...scores],answers:testQuestions.map((x,i)=>({question:x.q[0],chosen:answers[i],correct:x.q[2],options:x.q[1],explanation:x.q[3]}))};records[testSubject]={scores,attempts:(old?.attempts||0)+1,updatedAt:now,history:[...(old?.history||[]).slice(-49),attempt]};save();document.dispatchEvent(new CustomEvent('qurio:attempt',{detail:{subject:testSubject,mode:testMode,topic:testTopic,attempt}}));subject=testSubject;selected=priorityOrder(scores,BANK[subject].topics)[0];closeTest();render();showFeedback(attempt);toast('Đã lưu kết quả và tự động cập nhật bản đồ năng lực!')}
function showFeedback(attempt){const content=$('#feedbackContent');content.replaceChildren();const intro=document.createElement('div');intro.className='feedback-summary';intro.textContent=`Đúng ${attempt.correct}/${attempt.total} câu · ${Math.round(attempt.correct/attempt.total*100)}% · Đã cập nhật sơ đồ và lộ trình.`;content.append(intro);attempt.answers.forEach((a,i)=>{const el=document.createElement('div');el.className='feedback-item';const strong=document.createElement('strong');strong.textContent=(a.chosen===a.correct?'✓ ':'✕ ')+`Câu ${i+1}. ${a.question}`;const detail=document.createElement('p');detail.textContent='Bạn chọn: '+a.options[a.chosen]+' · Đáp án: '+a.options[a.correct];const explain=document.createElement('small');explain.textContent=a.explanation;el.append(strong,detail,explain);content.append(el)});$('#feedbackModal').hidden=false;document.body.style.overflow='hidden'}
function closeFeedback(){$('#feedbackModal').hidden=true;document.body.style.overflow=''}
function showMap(){closeFeedback();$('.map-panel').scrollIntoView({behavior:'smooth',block:'start'})}
function renderHistory(){const history=current()?.history||[];$('#historyList').innerHTML=history.length?history.slice().reverse().slice(0,12).map(h=>`<div class="history-item"><span>${new Date(h.date).toLocaleString('vi-VN')} · ${h.mode==='practice'?'Luyện tập':h.mode==='diagnostic'?'Chẩn đoán chuyên sâu':'Đánh giá'}</span><strong>${Number.isFinite(h.correct)?h.correct+'/'+h.total+' câu đúng':'Lần đánh giá cũ'}</strong></div>`).join(''):'<p>Chưa có lịch sử đánh giá môn này.</p>';let goals={};try{goals=JSON.parse(localStorage.getItem(goalKey+'_'+account())||'{}')}catch{}$('#goalScore').value=goals.score||80;$('#goalMinutes').value=goals.minutes||30;$('#goalNotice').textContent='Mục tiêu: '+(goals.score||80)+'% thành thạo · '+(goals.minutes||30)+' phút học mỗi ngày.'}
function saveGoals(){const score=Number($('#goalScore').value),minutes=Number($('#goalMinutes').value);if(!Number.isInteger(score)||score<60||score>100||!Number.isInteger(minutes)||minutes<10||minutes>240){toast('Mục tiêu: 60–100%, thời gian: 10–240 phút.');return}localStorage.setItem(goalKey+'_'+account(),JSON.stringify({score,minutes}));renderHistory();toast('Đã lưu mục tiêu học tập.')}
function exportData(){const payload={format:'qurio-roadmap-v2',exportedAt:new Date().toISOString(),records,goals:JSON.parse(localStorage.getItem(goalKey+'_'+account())||'{}')};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='qurio-lo-trinh-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function importData(file){if(!file)return;try{if(file.size>1024*1024)throw Error('Tệp quá lớn');const payload=JSON.parse(await file.text());if(payload.format!=='qurio-roadmap-v2'||!payload.records||typeof payload.records!=='object')throw Error('Không đúng định dạng sao lưu Qurio');const next={};for(const id of Object.keys(BANK)){const r=payload.records[id];if(!r)continue;if(!Array.isArray(r.scores)||r.scores.length!==5||r.scores.some(v=>v!==null&&(!Number.isFinite(v)||v<0||v>100))||!Array.isArray(r.history))throw Error('Dữ liệu '+id+' không hợp lệ');next[id]={scores:r.scores,attempts:Math.max(0,Number(r.attempts)||0),updatedAt:String(r.updatedAt||''),history:r.history.slice(-50)}}if(!confirm('Nhập dữ liệu sẽ thay thế kết quả hiện có trên thiết bị này. Tiếp tục?'))return;records=next;save();if(payload.goals&&typeof payload.goals==='object'){const score=Number(payload.goals.score),minutes=Number(payload.goals.minutes);if(score>=60&&score<=100&&minutes>=10&&minutes<=240)localStorage.setItem(goalKey+'_'+account(),JSON.stringify({score,minutes}))}render();toast('Đã nhập dữ liệu thành công.')}catch(e){toast('Không thể nhập: '+e.message)}finally{$('#importData').value=''}}
function initQurioSharedNavigation(){
 const sidebar=document.querySelector('.roadmap-shell > .sidebar');
 const top=document.querySelector('.roadmap-shell > .main > .topbar');
 if(!sidebar || !top)return;
 sidebar.querySelectorAll('[data-nav]').forEach(a=>{
  const active=a.dataset.nav==='roadmap';a.classList.toggle('active',active);
  if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
 });
 const toggle=top.querySelector('#sidebarToggle');
 const setOpen=(v)=>{sidebar.classList.toggle('is-open',v);toggle?.setAttribute('aria-expanded',String(v));document.body.classList.toggle('qurio-roadmap-menu-open',v)};
 toggle?.addEventListener('click',()=>setOpen(!sidebar.classList.contains('is-open')));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
 const searchForm=top.querySelector('#searchForm');searchForm?.addEventListener('submit',e=>e.preventDefault());
 const profile=top.querySelector('#profileToggle'),menu=top.querySelector('#profileMenu');
 profile?.addEventListener('click',e=>{e.stopPropagation();if(!menu)return;menu.hidden=!menu.hidden;profile.setAttribute('aria-expanded',String(!menu.hidden))});
 document.addEventListener('click',e=>{if(!e.target.closest('.profile-wrap')&&menu){menu.hidden=true;profile?.setAttribute('aria-expanded','false')}});
 const bell=top.querySelector('#notificationToggle'),popover=top.querySelector('#notificationPopover');
 bell?.addEventListener('click',e=>{e.stopPropagation();if(popover){popover.hidden=!popover.hidden;bell.setAttribute('aria-expanded',String(!popover.hidden))}});
 document.addEventListener('click',e=>{if(!e.target.closest('.notification-wrap')&&popover)popover.hidden=true});
}

function init() {
  if (window.QurioLayout?.mountHome) {
    window.QurioLayout.mountHome();
    initQurioSharedNavigation();
  }

  
records = load();

if (window.QurioLearningSync) {
  window.QurioLearningSync.refresh()
    .then(result => {
      if (result?.ok) {
        records = result.records || {};
        render();
      }
    })
    .catch(error => {
      console.warn(
        "Không tải được lộ trình:",
        error.message
      );
    });
}

if (window.QurioAuth?.request) {
  window.QurioAuth.request(
    "learningProfileLoad",
    {}
  ).then(result => {
    if (
      result?.ok &&
      result.found &&
      result.records
    ) {
      records = result.records;

      localStorage.setItem(
        key + '_' + account(),
        JSON.stringify(records)
      );

      render();
    }
  }).catch(error => {
    console.warn(
      "Đang sử dụng dữ liệu trên trình duyệt:",
      error.message
    );
  });
}


  $('#subject').onchange = event => {
    subject = event.target.value;
    selected = 0;
    render();
  };

  $('#grade').onchange = render;
  $('#startTest').onclick = () => openTest();
  $('#emptyStart').onclick = () => openTest();
  $('#recommendAction').onclick = () => {
    const result = current();
    if (!result) {
      openTest();
      return;
    }
    openTest('practice', priorityOrder(result.scores, BANK[subject].topics)[0]);
  };
  $('#practiceButton').onclick = () => {
    openTest('practice', priorityOrder(current().scores, BANK[subject].topics)[0]);
  };

  $('#saveGoal').onclick = saveGoals;
  $('#exportData').onclick = exportData;
  $('#importData').onchange = event => importData(event.target.files[0]);
  $('#resetSubject').onclick = () => {
    if (!records[subject]) return toast('Bạn chưa có kết quả đánh giá ở môn này.');
    if (confirm('Xóa toàn bộ kết quả và lịch sử của ' + BANK[subject].name + '?')) {
      delete records[subject];
      save();
      render();
      toast('Đã xóa dữ liệu môn học.');
    }
  };

  $('#closeFeedback').onclick = closeFeedback;
  $('#feedbackBackdrop').onclick = closeFeedback;
  $('#viewMap').onclick = showMap;
  $('#closeTest').onclick = closeTest;
  $('#modalBackdrop').onclick = closeTest;
  $('#submitTest').onclick = submit;

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!$('#testModal').hidden) closeTest();
      if (!$('#feedbackModal').hidden) closeFeedback();
    }
  });

  
$('#roadmapAi')?.addEventListener('click', async event => {
  const button = event.currentTarget;
  const out = $('#roadmapAiResult');

  if (!out) return;

  if (!window.QurioAuth?.request) {
    out.textContent =
      "Chưa kết nối được hệ thống tài khoản Qurio.";
    return;
  }

  const bank = BANK[subject];
  const scores = current()?.scores;

  if (!bank || !scores?.some(Number.isFinite)) {
    out.textContent =
      "Hãy hoàn thành bài đánh giá năng lực trước " +
      "để AI phân tích kết quả học tập.";
    return;
  }

  const topics = priorityOrder(scores, bank.topics)
    .filter(index => Number.isFinite(scores[index]))
    .slice(0, 3)
    .map(index => ({
      title: bank.topics[index][0],
      score: scores[index],
      prerequisites: bank.topics[index][2]
        .map(i => bank.topics[i][0])
    }));

  button.disabled = true;
  out.textContent =
    "✨ Qurio AI đang phân tích năng lực và " +
    "xây dựng lộ trình học tập cá nhân hóa…";

  try {
    const result = await window.QurioAuth.request(
      "qurioRoadmapAI",
      {
        subject: bank.name,
        topics: topics
      }
    );

    if (!result || result.ok !== true) {
      throw new Error(
        result?.message || "AI chưa trả về kết quả."
      );
    }

    out.textContent = result.output;

  } catch (error) {
    console.error("Qurio AI:", error);

    // Phuong an du phong neu Woku gap loi.
    // Day la goi y theo quy tac, khong phai AI.
    const fallback = topics.map((topic, index) => {
      const action = topic.score < 60
        ? "Ôn lại kiến thức nền, sau đó luyện bài cơ bản."
        : topic.score < 80
          ? "Luyện bài vận dụng và kiểm tra lại."
          : "Thử bài nâng cao để củng cố kiến thức.";

      return (
        (index + 1) + ". " + topic.title +
        " (" + topic.score + "%)\n" +
        "   → " + action
      );
    }).join("\n\n");

    out.textContent =
      "Chưa kết nối được AI Woku: " +
      error.message +
      "\n\nGỢI Ý TẠM THỜI THEO THUẬT TOÁN QURIO\n\n" +
      fallback;
  } finally {
    button.disabled = false;
  }
});
('click', async event => {
    const out = $('#roadmapAiResult');

    if (!out) {
      toast('Thiếu ô roadmapAiResult trong trang Lộ trình.');
      return;
    }

    if (!window.QurioAuth?.request || !window.QurioAI?.showAdvice) {
      out.textContent = 'Chưa tải chung.js hoặc qurio-connect.js.';
      return;
    }

    const bank = BANK[subject];
    const scores = current()?.scores;
    if (!scores?.some(Number.isFinite)) {
      out.textContent = 'Hãy làm một bài đánh giá hoặc luyện tập trước.';
      return;
    }

    const topics = priorityOrder(scores, bank.topics)
      .filter(index => Number.isFinite(scores[index]))
      .slice(0, 3)
      .map(index => ({
        title: bank.topics[index][0],
        score: scores[index],
        prerequisites: bank.topics[index][2].map(i => bank.topics[i][0])
      }));

    
const aiButton = event.currentTarget;
aiButton.disabled = true;
out.textContent = "✨ Qurio AI đang tạo lộ trình...";

try {
  const advice = await window.QurioAI.ask("roadmap", {
    subject: bank.name,
    topics
  });

  if (typeof advice !== "string" || !advice.trim()) {
    throw new Error("AI chưa trả về nội dung.");
  }

  out.textContent = advice;

  // Lưu đề xuất theo tài khoản đang sử dụng
  const accountKey = account();
  const storageKey = "qurio_ai_advice_v1_" + accountKey;

  localStorage.setItem(storageKey, JSON.stringify({
    subject: bank.name,
    advice: advice.trim(),
    createdAt: new Date().toISOString()
  }));

  // Tạo nút chuyển sang trang Tiến độ
  let link = document.getElementById("viewAiProgress");

  if (!link) {
    link = document.createElement("a");
    link.id = "viewAiProgress";
    out.insertAdjacentElement("afterend", link);
  }

  link.href = "../Tiến Độ/tien-do.html#qurio-ai-advice";
  link.className = "qurio-ai-progress-link";
  link.textContent = "📊 Xem đề xuất trong Tiến độ →";

} catch (error) {
  out.textContent = "Không tạo được gợi ý AI: " + error.message;
} finally {
  aiButton.disabled = false;
}

  });

  render();
}

document.addEventListener('qurio:diagnostic-complete',e=>{const d=e.detail;if(!d||d.subject!=='math'||d.topic!==0)return;const old=records.math||{},scores=old.scores?[...old.scores]:Array(5).fill(null);const before=scores[0];scores[0]=before==null?d.score:Math.round(.25*before+.75*d.score);const now=new Date().toISOString();const attempt={date:now,mode:'diagnostic',topic:0,correct:d.correct,total:d.total,scores:[...scores],errors:d.errors,answers:d.answers};records.math={scores,attempts:(old.attempts||0)+1,updatedAt:now,history:[...(old.history||[]).slice(-49),attempt]};save();subject='math';$('#subject').value='math';selected=0;render();toast('Đã cập nhật bản đồ năng lực từ bài đánh giá chuyên sâu!');});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();function renderMulti(){
 const ids=Object.keys(BANK),evaluated=ids.filter(id=>records[id]?.scores?.some(v=>v!==null)),all=evaluated.flatMap(id=>records[id].scores.filter(v=>v!==null)),avg=all.length?Math.round(all.reduce((a,b)=>a+b,0)/all.length):null;
 $('#multiMapEmpty').hidden=evaluated.length>0;$('#multiMap').hidden=evaluated.length===0;$('#multiAverage').textContent=avg===null?'—':avg+'%';$('#multiAssessed').textContent=evaluated.length+'/'+ids.length;$('#multiWeak').textContent=all.length?all.filter(v=>v!==null&&v<60).length:'—';
 

const emoji = {
  math: "📐",
  physics: "⚡",
  informatics: "💻",
  chemistry: "🧪",
  biology: "🧬",
  english: "📖",
  history: "📜",
  geography: "🌍"
};


 $('#multiSubjects').innerHTML=ids.map(id=>{let sc=records[id]?.scores,mean=sc?Math.round(sc.filter(v=>v!==null).reduce((a,b)=>a+b,0)/Math.max(1,sc.filter(v=>v!==null).length)):null;return `<button type="button" class="multi-subject ${id===subject?'active':''}" data-subject="${id}"><span class="multi-emoji"></span><span><b>${BANK[id].name}</b><small>${mean===null?'Chưa đánh giá':sc.filter(x=>x!==null&&x<60).length+' chủ đề cần ưu tiên'}</small></span><strong>${mean===null?'—':mean+'%'}</strong><div class="multi-meter"><i style="width:${mean||0}%"></i></div></button>`}).join('');
 $$('#multiSubjects [data-subject]').forEach(b=>b.onclick=()=>{subject=b.dataset.subject;$('#subject').value=subject;selected=0;render();$('.road-toolbar').scrollIntoView({behavior:'smooth',block:'start'})});
 $('#multiMap').innerHTML=`<div class="multi-hub">Qurio<small>Hồ sơ đa môn</small></div><div class="multi-branches">${ids.map(id=>{const sc=records[id]?.scores,mean=sc?Math.round(sc.filter(v=>v!==null).reduce((a,b)=>a+b,0)/Math.max(1,sc.filter(v=>v!==null).length)):null;return `<button type="button" data-subject="${id}" class="multi-branch"><span> ${BANK[id].name}</span><b>${mean===null?'Chưa đánh giá':mean+'%'}</b><small>${sc?sc.filter(v=>v!==null&&v<60).length+' chủ đề ưu tiên':'Cần làm bài đánh giá'}</small></button>`}).join('')}</div>`;
 $$('#multiMap [data-subject]').forEach(b=>b.onclick=()=>{subject=b.dataset.subject;$('#subject').value=subject;selected=0;render();$('.road-toolbar').scrollIntoView({behavior:'smooth',block:'start'})});
 const tasks=evaluated.flatMap(id=>BANK[id].topics.map((topic,i)=>({id,title:topic[0],score:records[id].scores[i],weight:100-(records[id].scores[i]||0)+topic[2].filter(k=>records[id].scores[k]!==null&&records[id].scores[k]<60).length*25}))).filter(t=>t.score!==null&&t.score<80).sort((a,b)=>b.weight-a.weight||a.score-b.score).slice(0,6);
 $('#multiJourney').innerHTML=tasks.length?tasks.map((t,i)=>`<div class="multi-task"><span>${i+1}</span><div><b>${t.title}</b><small>${BANK[t.id].name} · ${t.score}% thành thạo ước lượng</small></div><em>${t.score<60?'Ưu tiên':'Củng cố'}</em></div>`).join(''):'<p class="multi-empty">Chưa có chủ đề cần ôn được xác định. Hãy làm bài đánh giá ở từng môn để tạo lộ trình đa môn.</p>';
}
})();