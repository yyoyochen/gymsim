
// ================================================================ language (En / 中文, Traditional Chinese)
let LANG = (() => { try { return localStorage.getItem('gymsim.lang') || 'en'; } catch (e) { return 'en'; } })();
const ZH = {
  // panel groups and buttons
  'Run': '執行', 'Monitors': '監測', 'Day': '當日', 'Members': '會員', 'Gym': '健身房', 'Plots': '圖表',
  'Setup': '設定', 'Go': '開始', 'Pause': '暫停', 'Step': '單步', 'Go (new day)': '開始（新的一天）',
  'Sound off': '音效：關', 'Sound on': '音效：開', 'Copy results': '複製結果', 'Seed': '種子', 'Random seed': '隨機種子',
  'applies on Setup': '按「設定」後生效', '· Setup': '· 設定', 'On': '開', 'Off': '關',
  'Behaviour sliders apply immediately.': '行為類滑桿會立即生效。',
  'Some settings change the building or the day: press Setup to apply them.': '部分設定會改變場館或當日安排：按「設定」套用。',
  // accessibility labels
  'Pixel-art gym diorama': '像素風健身房場景', 'Rotate left': '向左旋轉', 'Rotate right': '向右旋轉', 'Zoom out': '縮小', 'Zoom in': '放大',
  // sliders and choosers
  'Speed (gym seconds per real second)': '速度（每實際一秒經過的館內秒數）',
  'Arrival curve': '到場曲線', 'Weekday': '平日', 'Weekend': '週末', 'January rush': '新年人潮', 'Holiday week': '連假週',
  'Members per day': '每日會員數', 'Mean visit length': '平均停留時間',
  'Setting': '環境', 'Urban': '都市', 'Suburban': '郊區', 'Rural': '鄉村',
  'Weather': '天氣', 'Clear': '晴天', 'Rain': '雨天', 'Heatwave': '熱浪',
  'Setting and rain show at once. How members travel (scooter, bus, on foot, dropped off), bus frequency and the heatwave curve apply on Setup.':
    '環境與雨天會立即顯示。會員的交通方式（機車、公車、步行、接送）、公車班距和熱浪時的到場曲線，按「設定」後生效。',
  'Archetype mix (sums to 100 %, applies on Setup)': '會員類型組成（合計 100%，按「設定」後生效）',
  'Powerlifter': '健力選手', 'Olympic lifter': '舉重選手', 'Bodybuilder': '健美選手', 'Beginner': '新手', 'Coach with client': '教練帶學員',
  'Patience before swapping': '換器材前的耐心', 'Work-in willingness': '輪流使用意願', 'Rest between sets': '組間休息', 'Re-rack habit': '槓片歸位習慣',
  'Power racks': '健力架', 'Olympic platforms': '舉重台', 'Adjustable benches': '可調式訓練椅', 'Cleaners': '清潔人員',
  'Capacity cap at the turnstile': '入口閘門人數上限', 'Racks used for curls': '有人在健力架做彎舉',
  // monitors
  'Clock': '時鐘', 'Inside now': '館內人數', 'Waiting now': '等待人數', 'Avg wait': '平均等待', 'Longest queue': '最長隊伍',
  'PRs today': '今日 PR', 'Stray weights': '未歸位', 'Visits': '到訪人次', 'Rack queue': '架前排隊',
  // plots
  'Occupancy vs capacity cap': '館內人數與上限', 'Rack queue length': '健力架排隊人數', 'Zone use (stacked)': '各區使用人數（堆疊）',
  'Wait times (minutes)': '等待時間（分鐘）', 'today': '今日', 'earlier runs': '先前執行', 'earlier runs (faded)': '先前執行（淡色）', 'cap': '上限',
  'waits finished today': '今日完成的等待',
  'Cardio': '有氧', 'Machines': '器械', 'Dumbbells': '啞鈴', 'Racks': '健力架', 'Platforms': '舉重台', 'Machine': '器械', 'DB': '啞鈴', 'Rack': '健力架', 'Platform': '舉重台',
  // hud and toasts
  'Drag to pan · tap someone to follow them': '拖曳平移 · 點選人物即可跟隨',
  'Pinch to zoom · two fingers to pan · tap someone to follow': '雙指縮放 · 雙指平移 · 點選人物即可跟隨',
  'Day complete · press Setup or Go for a new day': '今日結束 · 按「設定」或「開始」進入新的一天',
  'Results copied': '已複製結果', 'Copy was blocked here': '此處無法複製',
  'This diorama needs WebGL, which isn\'t available in this browser.': '這個場景需要 WebGL，但此瀏覽器不支援。',
  // follow card: states
  'Gone home': '已回家', 'Arriving': '抵達中', 'Waiting outside (gym full)': '在門外等候（館內已滿）', 'Checking in': '報到中',
  'At the front desk': '在櫃檯', 'Heading to the changing room': '前往更衣室', 'Changing': '更衣中', 'Done, heading to change': '練完了，前往更衣',
  'Leaving': '離開中', 'Waiting for the bus': '等公車', 'Parking': '停車中', 'Waiting for a spotter': '等待保護者', 'Stretching': '伸展',
  'Stripping the bar': '卸下槓片', 'Stripping a loaded bar': '卸下別人留下的槓片', 'Returning stray dumbbells': '歸位散落的啞鈴',
  'Wiping down equipment': '擦拭器材', 'On patrol': '巡場中', 'Front desk': '櫃檯', 'Spotting': '幫忙保護', 'Coaching the floor': '場內指導',
  'Client (with coach)': '學員（有教練）', 'Staff': '員工', 'Cleaner': '清潔人員', 'Head coach': '總教練', 'Personal coach': '私人教練',
  'Power rack': '健力架', 'Olympic platform': '舉重台', 'Adjustable bench': '可調式訓練椅', 'Dumbbell spot': '啞鈴區', 'Sled lane': '推雪橇道', 'Stretch mat': '伸展墊',
  'free': '空著', 'nobody': '沒有人', 'Stop following': '停止跟隨', 'Close': '關閉',
  'treadmill': '跑步機', 'bike': '飛輪', 'rower': '划船機', 'airbike': '風扇車',
  // lifts
  'Squat': '深蹲', 'Front squat': '前蹲舉', 'Bench press': '臥推', 'Deadlift': '硬舉', 'Overhead press': '站姿肩推', 'Curls (in the rack)': '彎舉（在健力架）',
  'Snatch': '抓舉', 'Clean & jerk': '挺舉', 'DB bench': '啞鈴臥推', 'DB shoulder press': '啞鈴肩推', 'DB curl': '啞鈴彎舉', 'Lateral raise': '側平舉',
  'Cable fly': '繩索夾胸', 'Lat pulldown': '滑輪下拉', 'Seated row': '坐姿划船', 'Chest press': '胸推機', 'Shoulder press': '肩推機', 'Pec deck': '蝴蝶機',
  'Leg extension': '腿伸展', 'Leg curl': '腿彎舉', 'Leg press': '腿推', 'Hack squat': '哈克深蹲', 'Hip thrust': '臀推', 'Belt squat': '腰帶深蹲',
  'Pull-up': '引體向上', 'Dip': '雙槓撐體', 'Sled push': '推雪橇'
};
const zh = () => LANG === 'zh';
const tr = (s) => (zh() && ZH[s] !== undefined ? ZH[s] : s);
// a sentence with numbers in it: English and Chinese written side by side at the call site
const tx = (en, zhs) => (zh() ? zhs : en);
// "Coach Mara" -> "Mara 教練"
const trName = (n) => (zh() && n.startsWith('Coach ') ? n.slice(6) + ' 教練' : n);
const MIN = () => tx(' min', ' 分');
function setLang(l) {
  LANG = l; try { localStorage.setItem('gymsim.lang', l); } catch (e) {}
  document.documentElement.lang = zh() ? 'zh-Hant-TW' : 'en';
  const b = document.getElementById('langBtn'); if (b) b.querySelectorAll('span[data-l]').forEach(s => s.classList.toggle('on', s.dataset.l === l));
  const sub = document.getElementById('hudSub'); if (sub) sub.textContent = tr(matchMedia('(pointer: coarse)').matches ? 'Pinch to zoom · two fingers to pan · tap someone to follow' : 'Drag to pan · tap someone to follow them');
  [['c', 'Pixel-art gym diorama'], ['rotL', 'Rotate left'], ['rotR', 'Rotate right'], ['zoomOut', 'Zoom out'], ['zoomIn', 'Zoom in']].forEach(([id, k]) => { const e = document.getElementById(id); if (e) e.setAttribute('aria-label', tr(k)); });
  const fb = document.getElementById('fallback'); if (fb) fb.textContent = tr('This diorama needs WebGL, which isn\'t available in this browser.');
  if (typeof buildPanel === 'function' && panel.childElementCount) {
    const open = !panel.classList.contains('closed'), tab = panel.querySelector('.tabs button.on'), tk = tab ? tab.dataset.t : 'Run', st = panel.scrollTop;
    buildPanel(); placePlots(); refreshGo(); refreshPending(); showTab(tk); panel.classList.toggle('closed', !open); panel.scrollTop = st;
    refreshSnd();
  }
}
