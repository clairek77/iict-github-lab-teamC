// ===== 새로운 화면 텍스트 정의 =====
const FLOW_TEXTS = {
  intro_1: {
    text: `
환영합니다. 저는 이 가게의 **타로마스터**입니다.
가만히 보니 한창 고민이 많은 **청년 시기**를 보내고 있군요.
`
  },
  intro_2: {
    text: `
**2026년** 다가오는 **붉은 말의 해**, 
내년의 당신은 어떤 모습일지 궁금하다면...
이곳에서 잠깐 머물다 가시죠.
`
  },
  intro_3: {
    text: `
여기는 그저 흔한 타로 가게는 아니에요.
이곳에서 만나게 될 **타로 카드**는 조금 **특별**하거든요.
`
  },
  tutorial_0: {
    text: `
    당신은 앞으로 **3장의 카드**를 뽑게 됩니다.
    `
  },
  tutorial_1: {
    text: `
**첫 번째 카드**는, 이 세상에 오직 하나뿐인 타로 카드예요.
당신이 선택한 **고민**과 내년의 기운을 나타내는 **한 단어**로 만든 카드이죠. 
`
  },
  tutorial_2: {
    text: `
**두 번째 카드**로는, 당신의 고민과 맞닿아 있는 **'세상의 흐름'**을 보여줄 거예요.
다른 청년들도 어쩌면 당신과 비슷한 고민을 하고 있을지도 모르죠.
(HINT: 여기 사람들은 **기사**라는 텍스트를 통해 세상의 흐름을 읽는다죠?)
`
  },
  tutorial_3: {
    text: `
**마지막 카드**로는, 당신의 고민과 관련된 **실질적인 조언**을 드릴게요. 
당신께 현실적으로 도움이 될 법한 다양한 정보를 드리겠습니다. 후후.
`
  },
  tutorial_fin: {
    text: `
그럼 **붉은 말의 해**를 미리 엿볼 준비가 되셨나요?
아래 버튼을 눌러 지금 확인해볼 수 있어요!
`
  },
};

// ====== 초기화 변수 =======
let lastInteractionTime = 0; 
const IDLE_TIMEOUT = 30000; // 3분(1000*60*3), 테스트용 30초
const WARNING_THRESHOLD = 10000; // 30초 전부터 경고 시작, 테스트용 10초
let isResetting = false; // 리셋 중임을 알리는 플래그 (중복 실행 방지)



// ===== 단어 목록 정의 =====
const TOPICS_MAP = {
  "건강": ["마음", "신체", "운동", "식습관"],
  "금전": ["투자", "저축", "소비", "수입"],
  "연애": ["솔로", "썸", "연애중", "이별"],
  "진로": ["취업", "학업", "적성", "전공"],
};

// ==== 단어 목록 정의 수정 ====
// 타로 카드 이미지 생성에 사용될 실제 키워드 (4개) - 캐릭터 이미지의 키로 사용됩니다.
const ACTUAL_IMAGE_KEYWORDS = ["기회", "행운", "불안", "변화"]; 

// 사용자가 화면에서 선택할 16개의 키워드 목록 (Gemini 프롬프트에 사용)
const DUMMY_KEYWORDS_LIST = [
  "도전", "성장", "시작", "발전", 
  "긍정", "활력", "안정", "평화", 
  "고민", "걱정", "근심", "위로", 
  "선택", "균형", "전환", "결단"
];

// 16개 키워드를 4개 이미지 키워드에 매핑하는 지도
const KEYWORD_IMAGE_MAP = {
  "도전": "기회", "성장": "기회", "시작": "기회", "발전": "기회", 
  "긍정": "행운", "활력": "행운", "안정": "행운", "평화": "행운",
  "고민": "불안", "걱정": "불안", "근심": "불안", "위로": "불안",
  "선택": "변화", "균형": "변화", "전환": "변화", "결단": "변화",
};

// ===== state 관련 =====
// start -> intro_1 -> intro_2 -> intro_3 -> tutorial_0 -> tutorial_1 -> tutorial_2 -> tutorial_3 -> tutorial_fin -> question -> topics -> pre_keywords -> keywords -> loading -> gemini -> pre_flowCard -> flowCard -> pre_adviceCard -> adviceCard-> pre_summary-> summary

let state = "start";

let selectedCategory = null;   // "건강" / "금전" / "연애" / "진로"
let selectedTopic = null;      // TOPICS_MAP 중 사용자가 클릭한 단어 1개
let selectedKeyWord = null;    // DUMMY_KEYWORDS_LIST 중 사용자가 클릭한 단어 1개 (Gemini 프롬프트용)
let actualImageKeyWord = null; // CHARACTER_MAP에 사용될 4개 중 1개 (이미지용)

// bgm
let bgMusic = null;
let clickSound = null;
let magicChargeSound = null;
let magicRevealSound = null;

//font
let fontRegular, fontBold;

//수정구슬
let rubProgress = 0;
let isKeywordSelected = false;

//카드 뒤집기
let isCardFlipped = false;

let selectedCardIndex = -1;

// 타로 결과 관련
let tarotAdvice = "";          // Gemini가 생성한 조언 텍스트

// ===== API 관련 ====
const API_KEY = "AIzaSyBV3reieFlVr27XDEJj84t-uWWCTAT4orc";
let receiving = false; 
let geminiStatus = "idle";
// idle | loading | success | error

// 시스템 프롬프트 (타로가게 버전)
const SYSTEM_PROMPT = `
너는 "수상한 타로가게"의 타로 마스터야.
사용자가 고른 고민 카테고리(건강, 금전, 연애, 진로), 구체적인 주제, 그리고 키워드를 바탕으로,
미래를 단정하지 않고, 사용자가 스스로 선택할 여지를 남기는 조언을 해 줘.

- 카테고리와 주제, 키워드를 종합하여 타로카드 형식으로 조언에 맞는 아르카나 이름을 지을 것. 
- 아르카나 이름의 형식은 "OO하는 XX"으로 지을 것.
- XX는 다음과 같이 연결됨.
- 키워드가 "도전", "성장", "시작", "발전"일 때 XX는 "탐험가"
- 키워드가 "긍정", "활력", "안정", "평화"일 때 XX는 "수호자"
- 키워드가 "정체", "걱정", "갈등", "혼란"일 때 XX는 "위로자"
- 키워드가 "선택", "균형", "전환", "결단"일 때 XX는 "항해자"

- 출력양식: 'OO하는 XX'을 가장 처음 줄에 출력. 그 다음줄에 '2026년 당신을 나타내는 카드는 OO하는 XX입니다.'로 이후 줄넘김 없이 조언을 시작할 것.
- **으로 중요 부분에 마크업할 것. 'OO하는 XX'에는 무조건 **로 볼드 마크업을 할 것.
- !주의! 공백 포함 250자를 절대 넘겨선 안 됨.
- 겁주거나 공포를 조장하지 말 것
- 너무 뻔한 일반론이 아니라, 사용자가 선택한 주제와 키워드를 적어도 한 번은 자연스럽게 등장시킬 것
- 말투는 친절하고 약간 수상한 점집 느낌으로
`;

// ===== 카드/버튼 레이아웃 상수 =====
const btnWidth = 200;
const btnHeight = 50;

// 단어 카드 그리드 (topics 화면) - 2x2
const CARD_COLS = 2;
const CARD_START_X = 590;
const CARD_START_Y = 320;
const CARD_CELL_W = 450;
const CARD_CELL_H = 260;

// 단어 카드 그리드 (keywords 화면)(4x4)
const KWD_GRID_COLS = 4;
const KWD_START_X = 500;
const KWD_START_Y = 200;
const KWD_CELL_W = 220;
const KWD_CELL_H = 180;

// ==== 이미지 애셋 ====
// 붉은 말 캐릭터
let horseImages = []; // horseImages[0] ~ horseImages[4]
//붉은 말 액자
let horseFrame = null;

// 새로운 말 그림
let horse_re1 = null; 
let horse_re2 = null;

// 수정구슬 그림
let crystalball = null;
let crystalball_transparent = null;

// 배경
let tarotBg1 = null;  // 타로가게 배경
let tarotBg2 = null;  // 카드/결과 배경

// 입장하기 버튼 + 타이틀 로고
let enterNormal = null;
let enterHover = null;
let titleLogo = null;

//소제목
let title1= null;
let title2=null;
let title3=null;

// 버튼1 (대주제)
let career = null;
let careerHover = null;
let health = null;
let healthHover = null;
let love = null;
let loveHover = null;
let money = null;
let moneyHover = null;

// 버튼2 (소주제)
// '진로' (career)
let career1 = null;
let career1Hover = null;
let career2 = null;
let career2Hover = null;
let career3 = null;
let career3Hover = null;
let career4 = null;
let career4Hover = null;

// '건강' (health)
let health1 = null;
let health1Hover = null;
let health2 = null;
let health2Hover = null;
let health3 = null;
let health3Hover = null;
let health4 = null;
let health4Hover = null;

// '금전' (money)
let money1 = null;
let money1Hover = null;
let money2 = null;
let money2Hover = null;
let money3 = null;
let money3Hover = null;
let money4 = null;
let money4Hover = null;

// '연애' (love)
let love1 = null;
let love1Hover = null;
let love2 = null;
let love2Hover = null;
let love3 = null;
let love3Hover = null;
let love4 = null;
let love4Hover = null;

// 버튼3 (키워드)
let anxiety = null;
let anxietyHover = null;
let luck = null;
let luckHover = null;
let chance = null;
let chanceHover = null;
let change = null;
let changeHover = null;

// 기사 링크로 이동
let link = null;
let linkHover = null;
let advicelink = null;
let advicelinkHover = null;

// 출력/QR
let Print = null;
let printHover = null;
let qr = null;
let qrHover = null;
let qrButton = null;
let qrKey = null;
const SUPABASE_URL = "https://wmfghjrimlraztofxpsq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZmdoanJpbWxyYXp0b2Z4cHNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDkyNDMsImV4cCI6MjA4MTUyNTI0M30.x0d9onTCCBJlc1CsjZkaw75Mfq6P-uS-Pan1Gv4IzQc";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// pdf와 링크 팝업
let pdfModalEl = null;
let urlModalEl = null;

function openPdfModal(pdfPath) {
  closePdfModal();
  lastInteractionTime = millis(); // 모달을 여는 순간 타이머 리셋

  pdfModalEl = createDiv("");
  pdfModalEl.position(0, 0);
  pdfModalEl.style("position", "fixed");
  pdfModalEl.style("inset", "0");
  pdfModalEl.style("display", "flex");
  pdfModalEl.style("align-items", "center");
  pdfModalEl.style("justify-content", "center");
  pdfModalEl.style("background", "rgba(20,15,40,0.55)");
  pdfModalEl.style("z-index", "9999");

  const box = createDiv("");
  box.parent(pdfModalEl);
  box.style("width", "min(1200px, 92vw)");
  box.style("height", "min(760px, 88vh)");
  box.style("background", "#111");
  box.style("border-radius", "16px");
  box.style("overflow", "hidden");
  box.style("position", "relative");
  box.style("border", "1px solid rgba(220, 180, 255, 0.35)");
  box.style("box-shadow", "0 0 0 1px rgba(255,255,255,0.06), 0 0 40px rgba(190,120,255,0.35), 0 0 120px rgba(90,40,160,0.25)");
  box.style("backdrop-filter", "blur(10px)");
  box.style("-webkit-backdrop-filter", "blur(10px)");
  box.style("background", "rgba(20, 15, 35, 0.72)");

  const closeBtn = createButton("닫기 ✕");
  closeBtn.parent(box);
  closeBtn.style("position", "absolute");
  closeBtn.style("right", "14px");
  closeBtn.style("top", "14px");
  closeBtn.style("z-index", "2");
  closeBtn.style("padding", "12px 16px");
  closeBtn.style("border", "1px solid rgba(255,255,255,0.35)");
  closeBtn.style("border-radius", "999px");
  closeBtn.style("cursor", "pointer");
  closeBtn.style("color", "#fff");
  closeBtn.style("font-weight", "700");
  closeBtn.style("letter-spacing", "0.2px");
  closeBtn.style("background", "linear-gradient(135deg, rgba(190,120,255,0.95), rgba(90,40,160,0.95))");
  closeBtn.style("box-shadow", "0 0 0 1px rgba(255,255,255,0.08), 0 10px 30px rgba(160,90,255,0.35), 0 0 24px rgba(200,140,255,0.5)");
  closeBtn.elt.addEventListener("mouseenter", () => {
  closeBtn.style("transform", "translateY(-1px) scale(1.02)");
  closeBtn.style("box-shadow", "0 0 0 1px rgba(255,255,255,0.14), 0 14px 34px rgba(160,90,255,0.45), 0 0 30px rgba(200,140,255,0.65)");
});
closeBtn.elt.addEventListener("mouseleave", () => {
  closeBtn.style("transform", "none");
  closeBtn.style("box-shadow", "0 0 0 1px rgba(255,255,255,0.08), 0 10px 30px rgba(160,90,255,0.35), 0 0 24px rgba(200,140,255,0.5)");
});
  closeBtn.mousePressed(closePdfModal);

  const iframe = createElement("iframe");
  iframe.parent(box);
  iframe.attribute("src", pdfPath);
  iframe.attribute("width", "100%");
  iframe.attribute("height", "100%");
  iframe.style("border", "0");

  pdfModalEl.mousePressed((e) => {
    lastInteractionTime = millis();
    if (e.target === pdfModalEl.elt) closePdfModal();
  });
}

function closePdfModal() {
  if (pdfModalEl) {
    pdfModalEl.remove();
    pdfModalEl = null;
  }
}

function closeUrlModal() {
  if (urlModalEl) {
    urlModalEl.remove();
    urlModalEl = null;
  }
}

function openUrlModal(url) {
  closeUrlModal();

  urlModalEl = createDiv("");
  urlModalEl.position(0, 0);
  urlModalEl.style("position", "fixed");
  urlModalEl.style("inset", "0");
  urlModalEl.style("display", "flex");
  urlModalEl.style("align-items", "center");
  urlModalEl.style("justify-content", "center");
  urlModalEl.style("background", "rgba(20,15,40,0.55)");
  urlModalEl.style("z-index", "9999");

  const box = createDiv("");
  box.parent(urlModalEl);
  box.style("width", "min(1200px, 92vw)");
  box.style("height", "min(760px, 88vh)");
  box.style("border-radius", "16px");
  box.style("overflow", "hidden");
  box.style("position", "relative");
  box.style("border", "1px solid rgba(220, 180, 255, 0.35)");
  box.style("box-shadow", "0 0 40px rgba(190,120,255,0.35)");
  box.style("background", "rgba(20, 15, 35, 0.72)");
  box.style("backdrop-filter", "blur(10px)");
  box.style("-webkit-backdrop-filter", "blur(10px)");

  // ✅ box 안에서 클릭하면 배경(overlay)로 이벤트가 안 퍼지게 막기 (중요!)
  box.elt.addEventListener("mousedown", (e) => e.stopPropagation());
  box.elt.addEventListener("click", (e) => e.stopPropagation());

  // ✅ 상단 바 (항상 표시)
  const topBar = createDiv(`
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
      <div style="font-size:13px; line-height:1.4; opacity:0.95;">
        일부 사이트는 보안 정책으로 화면 안에서 열리지 않을 수 있어요.<br/>
        <strong>(확인 후에 꼭 창을 닫아주세요!)</strong>
      </div>
      <button id="openNewTabBtn"
        style="
          padding:10px 14px; border-radius:999px; cursor:pointer;
          border:1px solid rgba(255,255,255,0.35);
          color:#fff; font-weight:700;
          background:linear-gradient(135deg, rgba(190,120,255,0.95), rgba(90,40,160,0.95));
          box-shadow:0 10px 26px rgba(160,90,255,0.35);
        ">
        🔗 새 창 열기
      </button>
    </div>
  `);
  topBar.parent(box);
  topBar.style("position", "absolute");
  topBar.style("left", "0");
  topBar.style("top", "0");
  topBar.style("right", "0");
  topBar.style("z-index", "3");
  topBar.style("padding", "14px 16px");
  topBar.style("background", "rgba(10, 8, 18, 0.55)");
  topBar.style("border-bottom", "1px solid rgba(255,255,255,0.10)");

  // ✅ 닫기 버튼
  const closeBtn = createButton("닫기 ✕");
  closeBtn.parent(box);
  closeBtn.style("position", "absolute");
  closeBtn.style("right", "14px");
  closeBtn.style("top", "14px");
  closeBtn.style("z-index", "4");
  closeBtn.style("padding", "12px 16px");
  closeBtn.style("border", "1px solid rgba(255,255,255,0.35)");
  closeBtn.style("border-radius", "999px");
  closeBtn.style("cursor", "pointer");
  closeBtn.style("color", "#fff");
  closeBtn.style("font-weight", "800");
  closeBtn.style("background", "linear-gradient(135deg, rgba(255,140,200,0.95), rgba(120,70,255,0.95))");

  // ✅ 닫기 버튼 클릭이 overlay로 퍼지지 않게
  closeBtn.elt.addEventListener("click", (e) => e.stopPropagation());
  closeBtn.mousePressed(closeUrlModal);

  // ✅ iframe 컨테이너: topBar 높이만큼 내려서 배치
  const iframeWrap = createDiv("");
  iframeWrap.parent(box);
  iframeWrap.style("position", "absolute");
  iframeWrap.style("left", "0");
  iframeWrap.style("right", "0");
  iframeWrap.style("top", "72px");
  iframeWrap.style("bottom", "0");
  iframeWrap.style("z-index", "1");
  iframeWrap.style("background", "#fff");

  const iframe = createElement("iframe");
  iframe.parent(iframeWrap);
  iframe.attribute("src", url);
  iframe.attribute("width", "100%");
  iframe.attribute("height", "100%");
  iframe.style("border", "0");

  // ✅ 새 창 열기 버튼: 전파 차단 + 팝업 차단 감지
  const openBtn = topBar.elt.querySelector("#openNewTabBtn");
  openBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) {
      alert("팝업이 차단됐어요! 주소창 옆 팝업 허용을 켜주세요.");
    }
  });

  // ✅ 배경(overlay) 클릭하면 닫기 (box 밖만)
  urlModalEl.elt.addEventListener("mousedown", (e) => {
    if (e.target === urlModalEl.elt) closeUrlModal();
  });
}

//이전, 다음 버튼
let before =null;
let after =null;
let beforeHover = null;
let afterHover = null;

let next = null;
let nextHover = null;
let createcard = null;
let createcardHover = null;

// flow/advice/result/exit
let flow = null;
let flowHover = null;
let advice = null;
let adviceHover = null;
let result = null;
let resultHover = null;
let exit = null;
let exitHover = null;

// 새로운 버튼 (tutorial_fin용)
let generateCard1 = null;
let generateCard1Hover = null;
let generateCard2 = null;
let generateCard2Hover = null;
let generateCard3 = null;
let generateCard3Hover = null;

// ====== 카테고리별 버튼 세트 =======
let TOPICS_IMAGE_MAP = {};

// ===== JSON 카드 데이터 =====
let cardsData = null;   // cards.json 전체
let flowCard = null;    // 이번에 보여줄 '흐름' 카드
let policyCard = null;  // 이번에 보여줄 '조언(정책)' 카드

// ==== 타로 카드 이미지 ====
let cardImages = {}; // 타로 카드 이미지 저장할 객체
let back_card = null;
let flow_card = null;
let advice_card = null;
let flowCardImgs = {};
let adviceCardImgs = {};

// 배경 (Category: 4개)
const BACKGROUND_MAP = {
  "건강": "card_bg_health.png",
  "금전": "card_bg_money.png",
  "연애": "card_bg_love.png",
  "진로": "card_bg_career.png",
};

// 흐름/조언 카드 (Category: 4개)
const FLOW_CARD_IMG_MAP = {
  "건강": "flow_card_health.png",
  "금전": "flow_card_money.png",
  "연애": "flow_card_love.png",
  "진로": "flow_card_career.png",
};

const ADVICE_CARD_IMG_MAP = {
  "건강": "advice_card_health_checked.png",
  "금전": "advice_card_money_more.png",
  "연애": "advice_card_love_enjoy.png",
  "진로": "advice_card_career_help.png",
};


// 캐릭터 (KeyWord: 4개)
const CHARACTER_MAP = {
  "기회": "card_char_chance.png",
  "행운": "card_char_luck.png",
  "불안": "card_char_anxiety.png",
  "변화": "card_char_change.png",
};

// 아이템 (Topic: 16개)
const ITEM_MAP = {
  // 건강
  "마음": "card_item_mind.png",
  "신체": "card_item_body.png",
  "운동": "card_item_exercise.png",
  "식습관": "card_item_diet.png",
  // 금전
  "투자": "card_item_invest.png",
  "소비": "card_item_consume.png",
  "수입": "card_item_income.png",
  "저축": "card_item_save.png",
  // 연애
  "솔로": "card_item_solo.png",
  "썸": "card_item_flirt.png",
  "연애중": "card_item_inlove.png",
  "이별": "card_item_breakup.png",
  // 진로
  "취업": "card_item_job.png",
  "학업": "card_item_study.png",
  "적성": "card_item_aptitude.png",
  "전공": "card_item_major.png",
};


// ===== preload: 이미지/데이터 로드 =====
function preload() {
  // 붉은 말 캐릭터 이미지 5종
  for (let i = 1; i <= 5; i++) {
    horseImages[i - 1] = loadImage(`horse ${i}.png`);
  }
  //붉은 말 액자
  horseFrame = loadImage("horse_frame.png")

  // 카드 뒷면, 조언 카드, 흐름 카드 
  back_card = loadImage("back_card.png");
  flow_card = loadImage("flow_card_money.png");
  advice_card = loadImage("advice_card_love_help.png");

  // 새로운 말 그림 (horse_re1) 추가
  horse_re1 = loadImage("horse_re1.png");
  horse_re2 = loadImage("horse_re2.png");
  
  // 수정구슬 이미지
  crystalball_transparent = loadImage("crystalball_transparent.png")
  crystalball = loadImage("crystalball.png")

  // 배경 이미지 2종
  tarotBg1 = loadImage("tarotback1.png");
  tarotBg2 = loadImage("tarotback2.png");

  //말풍선
  textbox1 = loadImage("textbox_1.png");
  textbox2 = loadImage("textbox_2.png");
  textbox3 = loadImage("textbox_3.png");

  // 입장 버튼, 타이틀
  enterNormal = loadImage("enter_normal.png");
  enterHover  = loadImage("enter_hover.png");
  titleLogo   = loadImage("title_logo.png");
  title1=loadImage("title_firstcard.png")
  title2=loadImage("title_secondcard.png")
  title3=loadImage("title_thirdcard.png")

  // 버튼1 (대주제)
  career = loadImage("rebutton_1_career.png");
  careerHover = loadImage("rebutton_1_career_hover.png");
  health = loadImage("rebutton_1_health.png");
  healthHover = loadImage("rebutton_1_health_hover.png");
  love = loadImage("rebutton_1_love.png");
  loveHover = loadImage("rebutton_1_love_hover.png");
  money = loadImage("rebutton_1_money.png");
  moneyHover = loadImage("rebutton_1_money_hover.png");

  // '건강' 소주제
  health1 = loadImage("rebutton_2_health1.png");
  health1Hover = loadImage("rebutton_2_health1_hover.png");
  health2 = loadImage("rebutton_2_health2.png");
  health2Hover = loadImage("rebutton_2_health2_hover.png");
  health3 = loadImage("rebutton_2_health3.png");
  health3Hover = loadImage("rebutton_2_health3_hover.png");
  health4 = loadImage("rebutton_2_health4.png");
  health4Hover = loadImage("rebutton_2_health4_hover.png");

  // '금전' 소주제
  money1 = loadImage("rebutton_2_money1.png");
  money1Hover = loadImage("rebutton_2_money1_hover.png");
  money2 = loadImage("rebutton_2_money2.png");
  money2Hover = loadImage("rebutton_2_money2_hover.png");
  money3 = loadImage("rebutton_2_money3.png");
  money3Hover = loadImage("rebutton_2_money3_hover.png");
  money4 = loadImage("rebutton_2_money4.png");
  money4Hover = loadImage("rebutton_2_money4_hover.png");

  // '연애' 소주제
  love1 = loadImage("rebutton_2_love1.png");
  love1Hover = loadImage("rebutton_2_love1_hover.png");
  love2 = loadImage("rebutton_2_love2.png");
  love2Hover = loadImage("rebutton_2_love2_hover.png");
  love3 = loadImage("rebutton_2_love3.png");
  love3Hover = loadImage("rebutton_2_love3_hover.png");
  love4 = loadImage("rebutton_2_love4.png");
  love4Hover = loadImage("rebutton_2_love4_hover.png");

  // '진로' 소주제
  career1 = loadImage("rebutton_2_career1.png");
  career1Hover = loadImage("rebutton_2_career1_hover.png");
  career2 = loadImage("rebutton_2_career2.png");
  career2Hover = loadImage("rebutton_2_career2_hover.png");
  career3 = loadImage("rebutton_2_career3.png");
  career3Hover = loadImage("rebutton_2_career3_hover.png");
  career4 = loadImage("rebutton_2_career4.png");
  career4Hover = loadImage("rebutton_2_career4_hover.png");

  // 버튼3. 키워드
  anxiety = loadImage("button_3_anxiety.png");
  anxietyHover = loadImage("button_3_anxiety_hover.png");
  luck = loadImage("button_3_luck.png");
  luckHover = loadImage("button_3_luck_hover.png");
  chance = loadImage("button_3_chance.png");
  chanceHover = loadImage("button_3_chance_hover.png");
  change = loadImage("button_3_change.png");
  changeHover = loadImage("button_3_change_hover.png");
  createcard = loadImage("rebutton_createcard.png");     
  createcardHover = loadImage("rebutton_createcard_hover.png");

  // 기사 링크로 이동
  link = loadImage("button_link.png");
  linkHover = loadImage("button_link_hover.png");
  
  //조언 링크로 이동
  advicelink = loadImage("button_advicelink.png");
  advicelinkHover = loadImage("button_advicelink_hover.png")
  
  // 출력
  Print = loadImage("button_print.png");
  printHover = loadImage("button_print_hover.png");

  // QR
  qr = loadImage("button_qr.png");
  qrHover = loadImage("button_qr_hover.png");

  // 다음으로
  next = loadImage("button_next.png");
  nextHover = loadImage("button_next_hover.png");

  // 퇴장
  exit = loadImage("button_exit_normal.png");
  exitHover = loadImage("button_exit_hover.png");

  //이전, 다음
  before = loadImage("button_before.png")
  beforeHover=loadImage("button_before_hover.png")
  after = loadImage("button_after.png")
  afterHover = loadImage("button_after_hover.png")

  // 흐름카드 뽑기
  flow = loadImage("button_flow.png");
  flowHover = loadImage("button_flow_hover.png");

  // 조언카드 뽑기
  advice = loadImage("button_advice.png");
  adviceHover = loadImage("button_advice_hover.png");

  
  // 새로운 카드 뽑기 버튼
  generateCard1 = loadImage("rebutton_generate_card1.png"); // 버튼 이미지 파일 이름은 확인 필요
  generateCard1Hover = loadImage("rebutton_generate_card1_hover.png"); // 버튼 이미지 파일 이름은 확인 필요
  generateCard2 = loadImage("rebutton_generate_card2.png"); // 버튼 이미지 파일 이름은 확인 필요
  generateCard2Hover = loadImage("rebutton_generate_card2_hover.png"); // 버튼 이미지 파일 이름은 확인 필요
  generateCard3 = loadImage("rebutton_generate_card3.png"); // 버튼 이미지 파일 이름은 확인 필요
  generateCard3Hover = loadImage("rebutton_generate_card3_hover.png"); // 버튼 이미지 파일 이름은 확인 필요

  // 결과 한번에 보기
  result = loadImage("button_result.png");
  resultHover = loadImage("button_result_hover.png");

  // bgm
  bgMusic = loadSound("tarot_bgm.mp3");
  clickSound = loadSound("click.mp3");
  magicChargeSound = loadSound("magic_charge.mp3"); 
  magicRevealSound = loadSound("magic_reveal.mp3");

  // font
  
  fontRegular = loadFont('Sunflower-Light.ttf');
  fontBold = loadFont('Sunflower-Bold.ttf');

  // JSON 카드 데이터
  cardsData = loadJSON("cards.json");

  // 타로 카드 레이어 이미지 로드
  const allImages = Object.assign({}, BACKGROUND_MAP, CHARACTER_MAP, ITEM_MAP);
  for (const key in allImages) {
    const fileName = allImages[key];
    cardImages[key] = loadImage(fileName);
  }

  for (const cat in FLOW_CARD_IMG_MAP) {
  flowCardImgs[cat] = loadImage(FLOW_CARD_IMG_MAP[cat]);
} for (const cat in ADVICE_CARD_IMG_MAP) {
  adviceCardImgs[cat] = loadImage(ADVICE_CARD_IMG_MAP[cat]);
}
}

function setup() {
  const c = createCanvas(1920, 1080);
  c.parent("stage");
  textFont("Pretendard, sans-serif");
  // 카테고리별 이미지 버튼 세트
  TOPICS_IMAGE_MAP = {
    "건강": {
      normal: [health1, health2, health3, health4],
      hover: [health1Hover, health2Hover, health3Hover, health4Hover]
    },
    "금전": {
      normal: [money1, money2, money3, money4],
      hover: [money1Hover, money2Hover, money3Hover, money4Hover]
    },
    "연애": {
      normal: [love1, love2, love3, love4],
      hover: [love1Hover, love2Hover, love3Hover, love4Hover]
    },
    "진로": {
      normal: [career1, career2, career3, career4],
      hover: [career1Hover, career2Hover, career3Hover, career4Hover]
    }
  };
}

function draw() {
  // [수정 사항 1] 매 프레임 버튼 배열 초기화 (중복 클릭 방지)
  clickableButtons = [];

  // [수정 사항 2] 3분 타임아웃 체크 (첫 화면이 아닐 때만)
  let idleTime = millis() - lastInteractionTime;
  if (state !== "start" && idleTime > IDLE_TIMEOUT) { // 180,000ms = 3분
    resetSystem();
    return;
  }

  if (state === "start") {
    drawStartScreen();
  } else if (state === "intro_1") {
    drawIntroScreen(FLOW_TEXTS.intro_1, "start", "intro_2", true);
  } else if (state === "intro_2") {
    drawIntroScreen(FLOW_TEXTS.intro_2, "intro_1", "intro_3", true);
  } else if (state === "intro_3") {
    drawIntroScreen(FLOW_TEXTS.intro_3, "intro_2", "tutorial_0", true);
  } else if (state === "tutorial_0") {
    drawTutorialCardScreen(FLOW_TEXTS.tutorial_0, "intro_3", "tutorial_1", 0); // 카드 0장 뒤집힘
  } else if (state === "tutorial_1") {
    drawTutorialCardScreen(FLOW_TEXTS.tutorial_1, "tutorial_0", "tutorial_2", 1); // 카드 1장 뒤집힘 (오른쪽)
  } else if (state === "tutorial_2") {
    drawTutorialCardScreen(FLOW_TEXTS.tutorial_2, "tutorial_1", "tutorial_3", 2); // 카드 2장 뒤집힘 (가운데)
  } else if (state === "tutorial_3") {
    drawTutorialCardScreen(FLOW_TEXTS.tutorial_3, "tutorial_2", "tutorial_fin", 3); // 카드 3장 뒤집힘 (왼쪽)
  } else if (state === "tutorial_fin") {
    drawTutorialFinScreen();
  } else if (state === "question") {
    drawQuestionScreen();
  } else if (state === "topics") {
    drawTopicsScreen();
  } else if (state === "keywords") {
    drawKeywordsScreen();
  } else if (state === "loading") {
    drawLoadingScreen();
  } else if (state === "card_selection") {
    drawCardSelectionScreen();
  } else if (state === "gemini") {
    drawGeminiScreen();
  } else if (state === "pre_flowCard") {
    drawPre_flowCardScreen();
  } else if (state === "flowCard") {
    drawFlowCardScreen();
  } else if (state === "pre_adviceCard") {
    drawPre_adviceCardScreen();
  } else if (state === "adviceCard") {
    drawAdviceCardScreen();
  } else if (state === "pre_summary") {
    drawPre_summaryScreen();
  } else if (state === "summary") {
    drawSummaryScreen();
  }

  drawTimeoutWarning();
}

// 공통: 가게 배경 (tarotback1)
function drawShopBackground() {
  if (tarotBg1) {
    imageMode(CORNER);
    image(tarotBg1, 0, 0, width, height);
  } else {
    background(20, 15, 35);
  }
}

// 공통: 결과/카드 배경 (tarotback2)
function drawResultBackground() {
  if (tarotBg2) {
    imageMode(CORNER);
    image(tarotBg2, 0, 0, width, height);
  } else {
    background(20, 15, 35);
  }
}

// ========== START SCREEN ==========
function drawStartScreen() {
  drawShopBackground();

  // 살짝 어둡게
  fill(0, 0, 0, 120);
  rect(0, 0, width, height);

  // 타이틀 로고
  if (titleLogo) {
    imageMode(CENTER);
    image(titleLogo, width / 2, height / 2 - 120);
  } else {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(60);
    text("수상한 타로가게", width / 2, height / 2 - 120);
  }

  // 입장하기 버튼 (이미지 사이즈 그대로 사용)
  if (enterNormal) {
    const imgW = enterNormal.width;
    const imgH = enterNormal.height;

    const btnX = width / 2 - imgW / 2;
    const btnY = height / 2 + 260;

    const isHover =
      mouseX > btnX && mouseX < btnX + imgW &&
      mouseY > btnY && mouseY < btnY + imgH;

    imageMode(CORNER);
    const imgToDraw = (isHover && enterHover) ? enterHover : enterNormal;
    image(imgToDraw, btnX, btnY);
  } else {
    const btnX = width / 2 - btnWidth / 2;
    const btnY = height / 2 + 260;
    drawButton(btnX, btnY, btnWidth, btnHeight, "입장하기");
  }
}


// 공통: 시작/튜토리얼 단계 배경
function drawStartTutorialBackground() {
  // start 화면과 동일한 배경 사용
  drawShopBackground();

  // 살짝 어둡게
  fill(0, 0, 0, 120);
  rect(0, 0, width, height);
}


// ========== INTRO/TUTORIAL 공통 화면 ==========
function drawIntroScreen(txtObj, prevState, nextState, showHorse) {
  drawStartTutorialBackground();

  // question 단계와 동일한 위치에 설명 박스 배치
  const boxW = 1100;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 680; 

  // 말 그림 (intro_1, intro_2, intro_3 에서만 표시)
  if (showHorse && horse_re1) {
    const horseSize = 500;
    
    // 설명 박스 위 중앙에 띄우고, 하단이 박스 상단과 닿게 조정
    const horseX = boxX + boxW / 2 - horseSize / 2; 
    const horseY = boxY - horseSize + 100; 

    // 비율 유지
    const aspectRatio = horse_re1.width / horse_re1.height;
    let drawH = horseSize;
    let drawW = horseSize * aspectRatio;

    imageMode(CORNER);
    image(horse_re1,horseX + (horseSize - drawW)/2, horseY, drawW, drawH);
  }

  // 설명 박스
  image(textbox1, boxX, boxY);

  // 텍스트
  fill(0);

  const baseFontSize = 28;
  const lineHeight = 45;
  const boldScaleFactor = 1.2;

  if (fontRegular && fontBold) {
      drawStyledText(
          txtObj.text, 
          boxX + boxW / 2, // 중앙 정렬 기준 X
          boxY + boxH / 2, // 중앙 정렬 기준 Y
          boxW - 60,       // 최대 너비
          lineHeight,      // 줄 간격
          fontRegular,     // 일반 폰트
          fontBold,         // 볼드 폰트
          baseFontSize,        // 기본 폰트 크기
          boldScaleFactor   // 볼드 확대 비율
      );

  } else {
      // 폰트가 로드되지 않았으면 일반 텍스트로 대체
      textAlign(CENTER, CENTER);
      text(txtObj.text, boxX + boxW / 2, boxY + boxH / 2);
  }

  // 이전/다음 버튼
  const baseY = boxY + boxH / 2 - before.width / 2
  drawPrevNextButtons(prevState, nextState, baseY);
}


// ========== TUTORIAL 카드 시뮬레이션 화면 ==========
// flippedCount: 0:전부 뒷면, 1:왼쪽 뒤집힘, 2:가운데 뒤집힘, 3:오른쪽 뒤집힘
function drawTutorialCardScreen(txtObj, prevState, nextState, flippedCount) {
    drawStartTutorialBackground();

    // 1. 카드 크기 설정 (원본 비율 유지)
    const targetW = 250; // 원하는 카드 너비 (기준)
    
    let cardW = targetW;
    let cardH = 260; // 기본값. 로딩이 안 됐을 경우 대비.
    
    if (back_card && back_card.width > 0) {
        // back_card의 종횡비를 계산하여 높이를 설정
        const aspectRatio = back_card.width / back_card.height;
        cardH = targetW / aspectRatio; 
    }
    
    // 최종 카드 크기 정의
    cardW = targetW;
    
    const cardGap = 80;
    
    // 설명 박스 위치를 기준으로 카드 상단 위치 조정
    const boxY_new = 680; // 설명 박스 위치
    const cardY = boxY_new - cardH - 50; // 설명 박스 위에 카드 배치

    // 2. 카드 위치 정의 (왼쪽, 중앙, 오른쪽 순)
    const cardPositions = [
        { x: width / 2 - cardW - cardGap - cardW / 2, y: cardY }, // [0] 왼쪽 (Gemini 카드)
        { x: width / 2 - cardW / 2, y: cardY },                   // [1] 중앙 (흐름 카드)
        { x: width / 2 + cardW / 2 + cardGap, y: cardY }          // [2] 오른쪽 (조언 카드)
    ];

    imageMode(CORNER);
    
    // =======================================================
    // 3. 카드 1 (왼쪽: Gemini 카드)
    // =======================================================
    if (flippedCount === 1) { 
        // 뒤집힘: Gemini 조합 카드 표시
        const cX = cardPositions[0].x;
        const cY = cardPositions[0].y;
        
        // **수정**: 이제 cardW와 cardH는 비율이 유지된 값입니다.
        image(cardImages['건강'], cX, cY, cardW, cardH); 
        image(cardImages['기회'], cX, cY, cardW, cardH); 
        image(cardImages['마음'], cX, cY, cardW, cardH); 
        
    } else {
        // 뒷면: back_card 표시
        image(back_card, cardPositions[0].x, cardPositions[0].y, cardW, cardH);
    }

    // =======================================================
    // 4. 카드 2 (중앙: 흐름 카드)
    // =======================================================
    if (flippedCount === 2) { 
        // 뒤집힘: 흐름 카드 표시
        image(flow_card, cardPositions[1].x, cardPositions[1].y, cardW, cardH);
    } else {
        // 뒷면: back_card 표시
        image(back_card, cardPositions[1].x, cardPositions[1].y, cardW, cardH);
    }
    
    // =======================================================
    // 5. 카드 3 (오른쪽: 조언 카드)
    // =======================================================
    if (flippedCount === 3) {
        // 뒤집힘: 조언 카드 표시
        image(advice_card, cardPositions[2].x, cardPositions[2].y, cardW, cardH);
    } else {
        // 뒷면: back_card 표시
        image(back_card, cardPositions[2].x, cardPositions[2].y, cardW, cardH);
    }


    // 6. 설명 박스 (새로운 위치)
    const boxW = 1100;
    const boxH = 230;
    const boxX = width / 2 - boxW / 2;
    const boxY = boxY_new; // 680

    image(textbox1, boxX, boxY, boxW, boxH);

    // 텍스트
    fill(0);

    const baseFontSize = 28;
    const lineHeight = 45;
    const boldScaleFactor = 1.2;

  if (fontRegular && fontBold) {
      drawStyledText(
          txtObj.text, 
          boxX + boxW / 2, // 중앙 정렬 기준 X
          boxY + boxH / 2, // 중앙 정렬 기준 Y
          boxW - 60,       // 최대 너비
          lineHeight,      // 줄 간격
          fontRegular,     // 일반 폰트
          fontBold,         // 볼드 폰트
          baseFontSize,        // 기본 폰트 크기
          boldScaleFactor   // 볼드 확대 비율
     );  
  } else {
      // 폰트가 로드되지 않았으면 일반 텍스트로 대체
      textAlign(CENTER, CENTER);
      text(txtObj.text, boxX + boxW / 2, boxY + boxH / 2);
  }


    // 8. 이전/다음 버튼
    const baseY = boxY + boxH / 2 - before.width / 2;
    drawPrevNextButtons(prevState, nextState, baseY);
}


// ========== TUTORIAL FIN SCREEN (마지막 단계) ==========
function drawTutorialFinScreen() {
  drawStartTutorialBackground();

  const boxW = 1100;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 680;

  // 말 그림 (intro 단계와 동일한 위치)
  if (horse_re1) {
    const horseSize = 500;
    const horseX = boxX + boxW / 2 - horseSize / 2;
    const horseY = boxY - horseSize + 100;

  // 1. 비율 유지 계산
    const aspectRatio = horse_re1.width / horse_re1.height;
    let drawH = horseSize;
    let drawW = horseSize * aspectRatio;

    imageMode(CORNER);
    image(horse_re1, horseX + (horseSize - drawW)/2, horseY, drawW, drawH);
  }

 // 설명 박스 (intro 단계와 동일한 위치)
  image(textbox1, boxX, boxY, boxW, boxH);

// 텍스트
  fill(0);
  textAlign(CENTER, CENTER);

  const baseFontSize = 28;
  const lineHeight = 45;
  const boldScaleFactor = 1.2;

  if (fontRegular && fontBold) {
      drawStyledText(
          FLOW_TEXTS.tutorial_fin.text, 
          boxX + boxW / 2, // 중앙 정렬 기준 X
          boxY + boxH / 2, // 중앙 정렬 기준 Y
          boxW - 60,       // 최대 너비
          lineHeight,      // 줄 간격
          fontRegular,     // 일반 폰트
          fontBold,         // 볼드 폰트
          baseFontSize,        // 기본 폰트 크기
          boldScaleFactor   // 볼드 확대 비율
      );

  } else {
      // 폰트가 로드되지 않았으면 일반 텍스트로 대체
      textAlign(CENTER, CENTER);
      text(txtObj.text, boxX + boxW / 2, boxY + boxH / 2);
  }
  
  // 1) 이전 버튼
  const baseY = boxY + boxH / 2 - before.width / 2;
  const margin = 200;
  const prevW = before.width;
  const prevX = margin;

  drawImageButton(before, beforeHover, prevX, baseY, () => {
    state = "tutorial_3"; // 이전 버튼은 tutorial_3로
  });


  // 2) generate_card1 버튼 (설명 박스 아래 중앙)
  if (generateCard1 && generateCard1Hover) {
    const btnW = generateCard1.width;
    const btnH = generateCard1.height;
    const btnX = width / 2 - btnW / 2;
    const btnY = boxY + boxH; 

    drawImageButton(generateCard1, generateCard1Hover, btnX, btnY, () => {
      state = "question"; // 다음 단계는 question으로
    });
  }
}


// ========== QUESTION SCREEN ==========
function drawQuestionScreen() {
  drawResultBackground();

  fill(0, 0, 0, 160);
  rect(0, 0, width, height);

  // ================================
  // 🔶 1) 4개 카테고리 버튼 (상단 중앙)
  // ================================
  const categories = ["건강", "진로", "금전", "연애"];
  const normalImages = [health, career, money, love];
  const hoverImages = [healthHover, careerHover, moneyHover, loveHover];

  const btnW = normalImages[0].width * 0.9;
  const btnH = normalImages[0].height * 0.9;

  const startX = width / 2 - (btnW * 1.2);
  const startY = 240;
  const gapX = btnW + 80;
  const gapY = btnH + 40;

  imageMode(CORNER);

  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = floor(i / 2);

    const x = startX + col * gapX;
    const y = startY + row * gapY;

    const isHover =
      mouseX > x && mouseX < x + btnW &&
      mouseY > y && mouseY < y + btnH;

    const img = (isHover || selectedCategory === categories[i])
      ? hoverImages[i]
      : normalImages[i];

    image(img, x, y, btnW, btnH);
  }

  // ================================
  // 🔶 2) 말 + 설명 박스
  // ================================
  const boxW = 800;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 680;

  image(textbox2, boxX-35, boxY);

  // 말 이미지
  const horseW = 140;
  if (horse_re2) {
    let hW = (horse_re2.width > 0) ? horse_re2.width : 1;
    let hH = (horse_re2.height > 0) ? horse_re2.height : 1;
    const aspectRatio = hW / hH;
    const horseH = horseW / aspectRatio; 
    const horseX = boxX - horseW - 60;  
    const horseY = boxY + boxH / 2 - horseH / 2;
    imageFlipX(horse_re2, horseX, horseY, horseW, horseH);
  }


    // 텍스트
  fill(0);
  textAlign(CENTER, CENTER)

  const baseFontSize = 28;
  const lineHeight = 45;
  const boldScaleFactor = 1.2;

  let currentText

  if (fontRegular && fontBold) {
    if(selectedCategory) {
      if (selectedCategory === '금전' || selectedCategory === '건강'){
        currentText = `음.. **${selectedCategory}**이 궁금하시군요.
        후후 알겠습니다. 계속 따라오시죠...`
      } 
      else {
        currentText = `음.. **${selectedCategory}**가 궁금하시군요.
        후후 알겠습니다. 계속 따라오시죠...`}
      
      drawStyledText(
            currentText, 
            boxX + boxW / 2+25, // 중앙 정렬 기준 X
            boxY + boxH / 2, // 중앙 정렬 기준 Y
            boxW - 60,       // 최대 너비
            lineHeight,      // 줄 간격
            fontRegular,     // 일반 폰트
            fontBold,         // 볼드 폰트
            baseFontSize,     // 기본 폰트 크기
            boldScaleFactor   // 볼드 확대 비율
        );
    } else {
            drawStyledText(
            `먼저, 다가오는 2026년에 가장 궁금한 고민거리를 골라주세요.`, 
            boxX + boxW / 2+25, // 중앙 정렬 기준 X
            boxY + boxH / 2, // 중앙 정렬 기준 Y
            boxW - 60,       // 최대 너비
            lineHeight,      // 줄 간격
            fontRegular,     // 일반 폰트
            fontBold,         // 볼드 폰트
            baseFontSize,     // 기본 폰트 크기
            boldScaleFactor   // 볼드 확대 비율
        );
    }
  } else {
      // 폰트가 로드되지 않았으면 일반 텍스트로 대체
      textAlign(CENTER, CENTER);
      text(txtObj.text, boxX + boxW / 2, boxY + boxH / 2);
  }

  // ================================
  // 🔶 3) 이전/다음 버튼 (기존 그대로)
  // ================================
  const baseY = boxY + boxH / 2 - before.width / 2;
  drawPrevNextButtons("tutorial_fin", selectedCategory ? "topics" : null, baseY);
}


// ========== TOPICS SCREEN ==========
function drawTopicsScreen() {
  drawResultBackground();

  fill(0, 0, 0, 160);
  rect(0, 0, width, height);

  const topics = TOPICS_MAP[selectedCategory] || [];
  const imageMap = TOPICS_IMAGE_MAP[selectedCategory];

  imageMode(CORNER);

  // ================================
  // 🔶 1) 4개 topic 버튼
  // ================================
  const btnW = imageMap.normal[0].width * 0.9;
  const btnH = imageMap.normal[0].height * 0.9;

  const startX = width / 2 - (btnW * 1.2);

  const startY = 240;

  const gapX = btnW + 80;
  const gapY = btnH + 40;

  for (let i = 0; i < topics.length; i++) {
    const col = i % 2;
    const row = floor(i / 2);

    const x = startX + col * gapX;
    const y = startY + row * gapY;

    const normal = imageMap.normal[i];
    const hover = imageMap.hover[i];

    const isHover =
      mouseX > x && mouseX < x + btnW &&
      mouseY > y && mouseY < y + btnH;

    const img = (isHover || selectedTopic === topics[i]) ? hover : normal;

    image(img, x, y, btnW, btnH);
  }

  // ================================
  // 🔶 2) 말 + 설명 박스
  // ================================
  const boxW = 800;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 680;

  image(textbox2, boxX-35, boxY);

  // 말 이미지
  const horseW = 140;
  if (horse_re2) {
    let hW = (horse_re2.width > 0) ? horse_re2.width : 1;
    let hH = (horse_re2.height > 0) ? horse_re2.height : 1;
    const aspectRatio = hW / hH;
    const horseH = horseW / aspectRatio; 
    const horseX = boxX - horseW - 60;  
    const horseY = boxY + boxH / 2 - horseH / 2;
    imageFlipX(horse_re2, horseX, horseY, horseW, horseH);
  }

  fill(0);
  textAlign(CENTER, CENTER)

  const baseFontSize = 28;
  const lineHeight = 45;
  const boldScaleFactor = 1.2;

  if (selectedTopic) {
    drawStyledText(
            `좋아요! 당신의 고민이 무엇인지 이제 잘 알겠습니다.
계속 따라오시면 당신에게서 느껴지는 기운을 알려드리죠.`, 
            boxX + boxW / 2 +25, // 중앙 정렬 기준 X
            boxY + boxH / 2, // 중앙 정렬 기준 Y
            boxW - 60,       // 최대 너비
            lineHeight,      // 줄 간격
            fontRegular,     // 일반 폰트
            fontBold,         // 볼드 폰트
            baseFontSize,     // 기본 폰트 크기
            boldScaleFactor   // 볼드 확대 비율
    )
  } else {
        drawStyledText(
           `당신의 고민에 대해 조금 더 자세히 말씀해주세요.
당신은 구체적으로 무엇이 궁금하나요?`,
            boxX + boxW / 2+25, // 중앙 정렬 기준 X
            boxY + boxH / 2, // 중앙 정렬 기준 Y
            boxW - 60,       // 최대 너비
            lineHeight,      // 줄 간격
            fontRegular,     // 일반 폰트
            fontBold,         // 볼드 폰트
            baseFontSize,     // 기본 폰트 크기
            boldScaleFactor   // 볼드 확대 비율
        )
  }

  // ================================
  // 🔶 3) 이전/다음 버튼
  // ================================
  const baseY = boxY + boxH / 2 - before.width / 2;
  drawPrevNextButtons("question", selectedTopic ? "keywords" : null, baseY);
}

// ========== KEYWORDS SCREEN ==========
function drawKeywordsScreen() {
  drawResultBackground();

  // 배경 어둡게
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  // 변수 안전장치
  if (typeof rubProgress === 'undefined' || isNaN(rubProgress)) rubProgress = 0;
  if (typeof isKeywordSelected === 'undefined') isKeywordSelected = false;

  // ================================
  // 🔶 말 + 설명 박스
  // ================================
  const boxW = 800;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 680;

  image(textbox2, boxX-35, boxY);

  // 말 이미지
  const horseW = 140;
  if (horse_re2) {
    let hW = (horse_re2.width > 0) ? horse_re2.width : 1;
    let hH = (horse_re2.height > 0) ? horse_re2.height : 1;
    const aspectRatio = hW / hH;
    const horseH = horseW / aspectRatio; 
    const horseX = boxX - horseW - 60;  
    const horseY = boxY + boxH / 2 - horseH / 2;
    imageFlipX(horse_re2, horseX, horseY, horseW, horseH);
  }

  // 텍스트 출력
  fill(0);
  textAlign(CENTER, CENTER)

  const baseFontSize = 28;
  const lineHeight = 45;
  const boldScaleFactor = 1.2;

  if (!isKeywordSelected) {
    drawStyledText(
            `마우스를 클릭한 채 [수정구슬]을 문질러보시죠.
당신의 기운이 모여 **운명의 단어**가 나타날겁니다!
(게이지가 가득 차면 자동으로 선택됩니다)`,
            boxX + boxW / 2+25, // 중앙 정렬 기준 X
            boxY + boxH / 2, // 중앙 정렬 기준 Y
            boxW - 60,       // 최대 너비
            lineHeight,      // 줄 간격
            fontRegular,     // 일반 폰트
            fontBold,         // 볼드 폰트
            baseFontSize,     // 기본 폰트 크기
            boldScaleFactor   // 볼드 확대 비율
    )
  } else {
    drawStyledText(
            `당신에게서 **${selectedKeyWord}**의 기운이 강하게 느껴지네요..
이 기운으로 **세상에 단 하나뿐인** 타로 카드를 만들어드겠습니다.
      (단어가 마음에 들지 않는다면 이전 버튼을 눌러 돌아가세요.)`,
            boxX + boxW / 2+25, // 중앙 정렬 기준 X
            boxY + boxH / 2, // 중앙 정렬 기준 Y
            boxW - 60,       // 최대 너비
            lineHeight,      // 줄 간격
            fontRegular,     // 일반 폰트
            fontBold,         // 볼드 폰트
            baseFontSize,     // 기본 폰트 크기
            boldScaleFactor   // 볼드 확대 비율
    )
  }

  // ================================
  // 수정 구슬 (위치 계산 및 그리기)
  // ================================
  const crystalballSize = 550;
  let drawW = crystalballSize; 
  let drawH = crystalballSize;
  
  if (crystalball_transparent && crystalball_transparent.width > 0) {
     const aspectRatio = crystalball_transparent.width / crystalball_transparent.height;
     drawW = crystalballSize * aspectRatio;
  }
  let crystalballX = width / 2 - drawW / 2;
  let crystalballY = boxY - drawH;

  let isRubbing = false;
  let movement = 0; 

  if (!isKeywordSelected && mouseIsPressed && 
      isInside(mouseX, mouseY, crystalballX, crystalballY, drawW, drawH)) {
      
      movement = dist(mouseX, mouseY, pmouseX, pmouseY);
      
      if (movement > 0.5) {
          isRubbing = true;
      }
  }

  if (crystalball_transparent && crystalball_transparent.width > 0) {
    imageMode(CORNER);
    
    let shakeX = 0;
    if (isRubbing) {
        shakeX = random(-3, 3); 
    }
    image(crystalball_transparent, crystalballX + shakeX, crystalballY, drawW, drawH);
  } else {
    fill(255, 255, 255, 50);
    ellipse(width/2, crystalballY + drawH/2, drawW, drawH);
  }


  if (!isKeywordSelected) {
    
    if (isRubbing) { 
      rubProgress += 0.5; 

      if (magicChargeSound && magicChargeSound.isLoaded()) {
          if (!magicChargeSound.isPlaying()) {
              magicChargeSound.loop();
          }
          let dynamicVol = map(rubProgress, 0, 100, 0.1, 1.0);
          magicChargeSound.setVolume(dynamicVol); 
      }
      
      if (typeof DUMMY_KEYWORDS_LIST !== 'undefined') {
          textAlign(CENTER, CENTER);
          textStyle(BOLD);
          const centerX = width / 2;
          const centerY = height / 2 - 100; 

          for (let i = 0; i < DUMMY_KEYWORDS_LIST.length; i++) {
              let radius = 250 + (i * 35); 
              let angleOffset = (TWO_PI / DUMMY_KEYWORDS_LIST.length) * i;
              
              let speed = 0.005; 
              let time = frameCount * speed * (1 + (i % 2) * 0.5); 
              let currentAngle = angleOffset + time;

              let wx = centerX + cos(currentAngle) * radius;
              let wy = centerY + sin(currentAngle) * radius;

              textSize(24 + (i % 3) * 5); 
              
              // 게이지가 찰수록 글씨가 점점 밝게 빛남 (시각적 피드백 유지)
              let alpha = map(rubProgress, 0, 100, 100, 255);
              fill(255, 255, 200, alpha); 
              text(DUMMY_KEYWORDS_LIST[i], wx, wy);
          }
          textStyle(NORMAL);
      }

    } else {
      // 문지르지 않으면 게이지 감소
      rubProgress -= 1.0; 
      
      if (magicChargeSound && magicChargeSound.isPlaying()) {
          magicChargeSound.stop();
      }
    }
    
    rubProgress = constrain(rubProgress, 0, 100);

    // 게이지 바
    const barW = 400;  
    const barH = 20;   
    const barX = width / 2 - barW / 2;
    const barY = boxY - 80;

    noStroke();
    fill(50, 50, 80, 200);
    rect(barX, barY, barW, barH, 10); 

    fill(180, 100, 255); 
    let currentBarW = map(rubProgress, 0, 100, 0, barW);
    rect(barX, barY, currentBarW, barH, 10);

    // 100% 달성 시
    if (rubProgress >= 100) {
      if (magicChargeSound && magicChargeSound.isPlaying()) magicChargeSound.stop();
      if (magicRevealSound && magicRevealSound.isLoaded()) {
          magicRevealSound.setVolume(1.0);
          magicRevealSound.play();
      }

      rubProgress = 100;

      // 셔플 뽑기
      let mixedList = shuffle(DUMMY_KEYWORDS_LIST, false);
      selectedKeyWord = mixedList[0];
      if (!selectedKeyWord) selectedKeyWord = "운명"; 
      
      actualImageKeyWord = KEYWORD_IMAGE_MAP[selectedKeyWord];
      isKeywordSelected = true; 
    }

  } else {
    push();
    fill(200, 120, 255); 
    textSize(80);
    textAlign(CENTER, CENTER);
    textFont(fontBold);
    
    if (typeof drawingContext !== 'undefined') {
        drawingContext.shadowBlur = 30;
        drawingContext.shadowColor = 'rgba(180, 50, 255, 0.9)'; 
    }
    text(selectedKeyWord, width/2, crystalballY + drawH/2 - 60);
    
    if (typeof drawingContext !== 'undefined') drawingContext.shadowBlur = 0;
    pop();
    textStyle(NORMAL);

    // 카드 생성 버튼
    let btnW, btnH, btnX, btnY;
    if (createcard && createcard.width > 1) {
       btnW = createcard.width;
       btnH = createcard.height;
       btnX = width / 2 - btnW / 2;
       btnY = height - 170; 

       drawImageButton(createcard, createcardHover, btnX, btnY, () => {
           state = "loading"; 
           tarotAdvice = "";
           callGeminiTarot(selectedCategory, selectedTopic, selectedKeyWord);
       });
    } else {
       btnW = 200; btnH = 60;
       btnX = width / 2 - 100; btnY = height - 200;
       drawButton(btnX, btnY, btnW, btnH, "카드 생성하기");
       
       if (mouseIsPressed && isInside(mouseX, mouseY, btnX, btnY, btnW, btnH)) {
           state = "loading";
           tarotAdvice = "";
           callGeminiTarot(selectedCategory, selectedTopic, selectedKeyWord);
       }
    }
  }

  // 이전 버튼
  if (before && before.width > 0) {
    const baseY = boxY + boxH / 2 - before.width / 2;
    drawImageButton(before, beforeHover, 200, baseY, () => {
        if (magicChargeSound && magicChargeSound.isPlaying()) magicChargeSound.stop();
        state = "topics"; 
        isKeywordSelected = false; 
        rubProgress = 0;
    });
  }
}

// ========== LOADING SCREEN ==========
function drawLoadingScreen() {
  drawResultBackground();
  fill(0, 0, 0, 160);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  text("타로 마스터가 당신의 선택을 해석하는 중입니다...", width / 2, height / 2 - 40);

  textSize(20);
  text(
    selectedCategory && selectedTopic && selectedKeyWord
      ? `${selectedCategory} > ${selectedTopic} > ${selectedKeyWord}`
      : "",
    width / 2,
    height / 2 + 10
  );

  push();
  translate(width / 2, height / 2 + 80);
  noFill();
  stroke(255);
  strokeWeight(6);
  let angle = frameCount * 0.1;
  arc(0, 0, 80, 80, angle, angle + PI * 1.5);
  pop();
}

// ========== CARD SELECTION SCREEN (3장 중 택1) ==========
function drawCardSelectionScreen() {
  drawResultBackground(); // 공통 배경
  fill(0, 0, 0, 180);     // 약간 어둡게
  rect(0, 0, width, height);
  
  // 타이틀 (없으면 텍스트로)
  if (title1) {
      drawStageTitle(title1);
  } else {
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(40);
      text("운명의 카드를 선택하세요", width/2, 150);
  }

  const cardW = 260;
  const cardH = 380;
  const gap = 50; // 카드 사이 간격
  
  // 전체 카드 그룹의 너비 계산 (카드3개 + 간격2개)
  const totalW = (cardW * 3) + (gap * 2);
  const startX = (width - totalW) / 2; // 중앙 정렬을 위한 시작점
  const cardY = height / 2 - cardH / 2 + 50;

  imageMode(CORNER);

  // 3장의 카드 그리기 Loop
  for (let i = 0; i < 3; i++) {
      let x = startX + (i * (cardW + gap));
      let y = cardY;

      // 1) 아직 아무것도 선택하지 않은 상태 (-1)
      if (selectedCardIndex === -1) {
          // 마우스 올렸을 때 살짝 위로 뜨는 효과 (Hover)
          if (isInside(mouseX, mouseY, x, y, cardW, cardH)) {
              y -= 20; 
              // 커서 변경 힌트 (선택사항)
              cursor(HAND); 
          }
          
          // 카드 뒷면 그리기
          if (back_card) image(back_card, x, y, cardW, cardH);
          else { fill(50); rect(x,y,cardW,cardH); }
      
      } 
      // 2) 무언가 선택된 상태
      else {
          cursor(ARROW); // 커서 복구

          if (i === selectedCardIndex) {
              // 👉 선택된 카드: 뒤집힘 (앞면 보여주기 - 3단 합체)
              
              // (배경)
              if (cardImages[selectedCategory]) image(cardImages[selectedCategory], x, y, cardW, cardH);
              // (캐릭터)
              if (cardImages[actualImageKeyWord]) image(cardImages[actualImageKeyWord], x, y, cardW, cardH);
              // (아이템)
              if (cardImages[selectedTopic]) image(cardImages[selectedTopic], x, y, cardW, cardH);

              // 선택된 카드는 강조 테두리
              noFill();
              stroke(255, 215, 0);
              strokeWeight(4);
              rect(x, y, cardW, cardH);
              noStroke();

          } else {
              // 선택되지 않은 나머지 카드: 어둡게 처리 (비활성화 느낌)
              if (back_card) image(back_card, x, y, cardW, cardH);
              else { fill(50); rect(x,y,cardW,cardH); }

              // 반투명 검은막 덮기
              fill(0, 0, 0, 200);
              rect(x, y, cardW, cardH);
          }
      }
  }

  // ==========================================
  // 안내 문구 및 다음 버튼
  // ==========================================
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(24);

  if (selectedCardIndex === -1) {
      text("가장 마음이 끌리는 카드 한 장을 선택해주세요.", width/2, height - 150);
  } else {
      text("운명이 결정되었습니다.", width/2, height - 180);

      // [결과 확인하러 가기] 버튼 등장
      // (기존 '다음' 버튼 이미지 사용하거나 텍스트 버튼 사용)
      if (next && nextHover) {
          let btnW = next.width;
          let btnH = next.height;
          drawImageButton(next, nextHover, width/2 - btnW/2, height - 120, () => {
              state = "gemini"; // 결과 상세 화면으로 이동
          });
      } else {
          drawButton(width/2 - 100, height - 120, 200, 60, "해석 보기");
          if (mouseIsPressed && isInside(mouseX, mouseY, width/2 - 100, height - 120, 200, 60)) {
              state = "gemini";
          }
      }
  }
}

// ========== GEMINI SCREEN ==========
function drawGeminiScreen() {
    drawResultBackground();
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);
    
    drawStageTitle(title1);

    // =======================================================
    // 1. 카드 (중앙 상단 위치 유지)
    // =======================================================
    const cardW = 260;
    const cardH = 380;
    
    const cardX = width / 2 - cardW / 2;
    const cardY = 200;

    // 그림자
    noStroke();
    fill(0, 0, 0, 80);
    rect(cardX + 10, cardY + 10, cardW, cardH);

    imageMode(CORNER);

    // 완성된 타로 카드 그리기 (3단 합체)
    if (cardImages[selectedCategory]) image(cardImages[selectedCategory], cardX, cardY, cardW, cardH);
    if (cardImages[actualImageKeyWord]) image(cardImages[actualImageKeyWord], cardX, cardY, cardW, cardH);
    if (cardImages[selectedTopic]) image(cardImages[selectedTopic], cardX, cardY, cardW, cardH);

    // 테두리 강조
    noFill();
    stroke(255, 215, 0);
    strokeWeight(3);
    rect(cardX, cardY, cardW, cardH);
    noStroke();

    // =======================================================
    // 2. 텍스트 박스 (카드 아래 중앙으로 이동)
    // =======================================================
    const boxW = 1000;
    const boxH = 400; 
    
    // ★ 변경: 텍스트 박스를 살짝 왼쪽에 배치
    const boxOffset = 50; 
    const boxX = width / 2 - boxW / 2 + boxOffset;
    const boxY = cardY + cardH + 30; 

    image(textbox3, boxX-35, boxY);

    // -------------------------------------------------------
    // 3. 텍스트 내용 (박스 내부 중앙에 LEFT 정렬 텍스트 배치)
    // -------------------------------------------------------
    const textMargin = 50; // 중앙 배치를 위한 내부 여백
    
    // 텍스트 영역의 시작점과 크기
    const textX = boxX + textMargin;
    const textY = boxY + boxH/2;
    const textW = boxW - textMargin * 2; // 좌우 여백 제외한 너비
    const textH = boxH - textMargin * 2; // 상하 여백 제외한 높이

    fill(0);
    const baseFontSize = 24;      // 기본 폰트 크기
    const lineHeight = 45;        // 줄 간격 (20px 크기에 맞춰 적절히 설정)
    const boldScaleFactor = 1.3;  // 볼드 폰트 확대 비율 (예: 10% 확대)
    
    // ★ 함수 호출해 텍스트 쓰기
    drawLeftStyledText(
        tarotAdvice, 
        textX+35, 
        textY, 
        textW, 
        lineHeight, 
        fontRegular, 
        fontBold, 
        baseFontSize, 
        boldScaleFactor
    );


    // =======================================================
    // 4. 말 이미지 (텍스트 박스 밖 왼쪽으로 분리)
    // =======================================================
    const horseW = 140;
    if (horse_re2) {
        const aspectRatio = horse_re2.width / horse_re2.height;
        const horseH = horseW / aspectRatio; 
        
        // ★ 변경: 텍스트 박스 왼쪽, 상단 맞춤으로 배치
        const horseMargin = 60; // 텍스트 박스와의 간격
        const horseX = boxX - horseW - horseMargin;
        
        // 텍스트 박스의 상단 Y좌표와 맞춤 (혹은 중앙에 오도록 조정 가능)
        const horseY = boxY + boxH - textMargin - horseH; 
        
        imageFlipX(horse_re2, horseX, horseY, horseW, horseH);
    }
    
    // =======================================================
    // 5. QR 버튼 삭제 완료 (QR 관련 코드 모두 제거됨)
    // =======================================================
    
    // =======================================================
    // 6. 다음 버튼 (위치 유지)
    // =======================================================
    const margin = 200;
    const nextW = after.width;
    const nextX = width - margin - nextW;
    const btnY = 795 - before.width / 2; 

    drawImageButton(after, afterHover, nextX, btnY, () => {
        state = "pre_flowCard";
    });
}

// ========== pre_flowCard Screen ==========
function drawPre_flowCardScreen() {
  drawStartTutorialBackground();

  const boxW = 1100;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 680;

  // 말 그림 (intro 단계와 동일한 위치)
  if (horse_re1) {
    const horseSize = 500;
    const horseX = boxX + boxW / 2 - horseSize / 2;
    const horseY = boxY - horseSize + 100;

  // 1. 비율 유지 계산
    const aspectRatio = horse_re1.width / horse_re1.height;
    let drawH = horseSize;
    let drawW = horseSize * aspectRatio;

    imageMode(CORNER);
    image(horse_re1, horseX + (horseSize - drawW)/2, horseY, drawW, drawH);
  }

  // 설명 박스 (intro 단계와 동일한 위치)
  image(textbox1, boxX, boxY);

  // 텍스트
  fill(0);
  textAlign(CENTER, CENTER);
  const baseFontSize = 28;
  const lineHeight = 45;
  const boldScaleFactor = 1.2;

  drawStyledText(
      `첫 번째 카드로 당신만을 위한 타로 카드를 뽑아봤으니,
이제 두 번째 **흐름의 카드**도 함께 볼까요?`, 
        boxX + boxW / 2, // 중앙 정렬 기준 X
        boxY + boxH / 2, // 중앙 정렬 기준 Y
        boxW - 60,       // 최대 너비
        lineHeight,      // 줄 간격
        fontRegular,     // 일반 폰트
        fontBold,         // 볼드 폰트
        baseFontSize,        // 기본 폰트 크기
        boldScaleFactor   // 볼드 확대 비율
     );  
  
  // 1) 이전 버튼
  const baseY = boxY + boxH / 2 - before.width / 2;
  const margin = 200;
  const prevW = before.width;
  const prevX = margin;

  drawImageButton(before, beforeHover, prevX, baseY, () => {
    state = "gemini"; // 이전 버튼은 gemini로
  });

  // 2) generate_card2 버튼 (설명 박스 아래 중앙)
  if (generateCard2 && generateCard2Hover) {
    const btnW = generateCard2.width;
    const btnH = generateCard2.height;
    const btnX = width / 2 - btnW / 2;
    const btnY = boxY + boxH ; 

    drawImageButton(generateCard2, generateCard2Hover, btnX, btnY, () => {
     state = "flowCard"; // 다음 단계는 flowCard로
    });
  }
}


// ========== FLOW CARD SCREEN ==========
function drawFlowCardScreen() {

  drawResultBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);
    
  drawStageTitle(title2);

// ====== 1. 중앙 상단 카드 ========
  const cardW = 260;
  const cardH = 380;
    
  const cardX = width / 2 - cardW / 2;
  const cardY = 200;

  // 그림자
  noStroke();
  fill(0, 0, 0, 80);
  rect(cardX + 10, cardY + 10, cardW, cardH);

  imageMode(CORNER);

  const img = flowCardImgs[selectedCategory] || flow_card;
  image(img, cardX, cardY, cardW, cardH);

  // 테두리 강조
  noFill();
  stroke(255, 215, 0);
  strokeWeight(3);
  rect(cardX, cardY, cardW, cardH);
  noStroke();

  // 2. 텍스트 박스 (카드 아래 중앙으로 이동)
  // =======================================================
    const boxW = 1000;
    const boxH = 400; 
    
    // ★ 변경: 텍스트 박스를 살짝 왼쪽에 배치
    const boxOffset = 50; 
    const boxX = width / 2 - boxW / 2 + boxOffset;
    const boxY = cardY + cardH + 30; 

    image(textbox3, boxX-35, boxY);

      
    // -------------------------------------------------------
    // 3. 텍스트 내용 (박스 내부 중앙에 LEFT 정렬 텍스트 배치)
    // -------------------------------------------------------
    const textMargin = 50; // 중앙 배치를 위한 내부 여백
    
    // 텍스트 영역의 시작점과 크기
    const textX = boxX + textMargin;
    const textY = boxY + boxH/2;
    const textW = boxW - textMargin * 2; // 좌우 여백 제외한 너비
    const textH = boxH - textMargin * 2; // 상하 여백 제외한 높이

    fill(0);
    
    const baseFontSize = 24;      // 기본 폰트 크기
    const lineHeight = 45;        // 줄 간격 (20px 크기에 맞춰 적절히 설정)
    const boldScaleFactor = 1.3;  // 볼드 폰트 확대 비율 (예: 10% 확대)
    
    // ★ 함수 호출해 텍스트 쓰기
    drawLeftStyledText(
        flowCard.summary, 
        textX+35, 
        textY, 
        textW, 
        lineHeight, 
        fontRegular, 
        fontBold, 
        baseFontSize, 
        boldScaleFactor
    );

  // =======================================================
  // 4. 말 이미지 (텍스트 박스 밖 왼쪽으로 분리)
  // =======================================================
  const horseW = 140;
  if (horse_re2) {
      const aspectRatio = horse_re2.width / horse_re2.height;
      const horseH = horseW / aspectRatio; 
      
      // ★ 변경: 텍스트 박스 왼쪽, 상단 맞춤으로 배치
      const horseMargin = 60; // 텍스트 박스와의 간격
      const horseX = boxX - horseW - horseMargin;
       
      // 텍스트 박스의 상단 Y좌표와 맞춤 (혹은 중앙에 오도록 조정 가능)
      const horseY = boxY + boxH - textMargin - horseH; 
      
      imageFlipX(horse_re2, horseX, horseY, horseW, horseH);
  }

  // ===== 기사 링크 버튼 =====
  const linkW = link.width * 0.8;
  const linkH = link.height * 0.8;
  const linkBtnX = cardX + cardW + 15; 
  const linkBtnY = cardY + cardH - linkH;

  drawImageButtonScaled(
    link,
    linkHover,
    linkBtnX,
    linkBtnY,
    linkW,
    linkH,
    () => {
      if (flowCard?.link) openPdfModal(`articles/${flowCard.link}`);
    }
  );

  // 안내 문구
  const tooltipText = `
  < 아래를 눌러 
  기사 전문을 확인하세요! >
  `;

  textSize(18);
  const tooltipW = textWidth(tooltipText) + 20;
  const tooltipH = 35;
  const tooltipX = linkBtnX + (linkW / 2) - (tooltipW / 2);
  const tooltipY = linkBtnY - tooltipH - 10; // 버튼 위 10px 간격

  fill(255);
  textAlign(CENTER, CENTER);
  text(tooltipText, tooltipX + tooltipW / 2, tooltipY + tooltipH / 2);

  // 🔹 이전/다음 버튼 추가  
  drawPrevNextButtons("pre_flowCard", "pre_adviceCard",  795 - before.width / 2);
}

// ========== pre_adviceCard Screen ==========
function drawPre_adviceCardScreen(){
  drawStartTutorialBackground();

  const boxW = 1100;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 680;

  // 말 그림 (intro 단계와 동일한 위치)
  if (horse_re1) {
    const horseSize = 500;
    const horseX = boxX + boxW / 2 - horseSize / 2;
    const horseY = boxY - horseSize + 100;

  // 1. 비율 유지 계산
    const aspectRatio = horse_re1.width / horse_re1.height;
    let drawH = horseSize;
    let drawW = horseSize * aspectRatio;

    imageMode(CORNER);
    image(horse_re1, horseX + (horseSize - drawW)/2, horseY, drawW, drawH);
  }

  // 설명 박스 (intro 단계와 동일한 위치)
  image(textbox1, boxX, boxY);

  // 텍스트
  fill(255);
  textAlign(CENTER, CENTER);
  const baseFontSize = 28;
  const lineHeight = 45;
  const boldScaleFactor = 1.2;

  drawStyledText(
      `두 번째 카드는 어떠셨나요? 이러한 흐름과 연결하여
세 번째 카드로 **유용한 조언**을 찾아드릴 수 있습니다만...`, 
        boxX + boxW / 2, // 중앙 정렬 기준 X
        boxY + boxH / 2, // 중앙 정렬 기준 Y
        boxW - 60,       // 최대 너비
        lineHeight,      // 줄 간격
        fontRegular,     // 일반 폰트
        fontBold,         // 볼드 폰트
        baseFontSize,        // 기본 폰트 크기
        boldScaleFactor   // 볼드 확대 비율
     );
  
  // 1) 이전 버튼
  const baseY = boxY + boxH / 2 - before.width / 2;
  const margin = 200;
  const prevW = before.width;
  const prevX = margin;

  drawImageButton(before, beforeHover, prevX, baseY, () => {
    state = "flowCard"; // 이전 버튼은 flowCard로
  });

  // 2) generate_card3 버튼 (설명 박스 아래 중앙)
  if (generateCard3 && generateCard3Hover) {
    const btnW = generateCard3.width;
    const btnH = generateCard3.height;
    const btnX = width / 2 - btnW / 2;
    const btnY = boxY + boxH ; 

    drawImageButton(generateCard3, generateCard3Hover, btnX, btnY, () => {
     state = "adviceCard"; // 다음 단계는 adviceCard로
    });
  }
}


// ========== ADVICE CARD SCREEN ==========
function drawAdviceCardScreen() {
  drawResultBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);
    
  drawStageTitle(title3);

// ====== 1. 중앙 상단 카드 ========
  const cardW = 260;
  const cardH = 380;
    
  const cardX = width / 2 - cardW / 2;
  const cardY = 200;

  // 그림자
  noStroke();
  fill(0, 0, 0, 80);
  rect(cardX + 10, cardY + 10, cardW, cardH);

  imageMode(CORNER);

  const img = adviceCardImgs[selectedCategory] || advice_card; 
  image(img, cardX, cardY, cardW, cardH);

  // 테두리 강조
  noFill();
  stroke(255, 215, 0);
  strokeWeight(3);
  rect(cardX, cardY, cardW, cardH);
  noStroke();

  // 2. 텍스트 박스 (카드 아래 중앙으로 이동)
  // =======================================================
    const boxW = 1000;
    const boxH = 400; 
    
    // ★ 변경: 텍스트 박스를 살짝 왼쪽에 배치
    const boxOffset = 50; 
    const boxX = width / 2 - boxW / 2 + boxOffset;
    const boxY = cardY + cardH + 30; 

    image(textbox3, boxX-35, boxY);

      
    // -------------------------------------------------------
    // 3. 텍스트 내용 (박스 내부 중앙에 LEFT 정렬 텍스트 배치)
    // -------------------------------------------------------
    const textMargin = 50; // 중앙 배치를 위한 내부 여백
    
    // 텍스트 영역의 시작점과 크기
    const textX = boxX + textMargin;
    const textY = boxY + boxH/2;;
    const textW = boxW - textMargin * 2; // 좌우 여백 제외한 너비
    const textH = boxH - textMargin * 2; // 상하 여백 제외한 높이

    fill(0);
    
    const baseFontSize = 24;      // 기본 폰트 크기
    const lineHeight = 45;        // 줄 간격 (20px 크기에 맞춰 적절히 설정)
    const boldScaleFactor = 1.3;  // 볼드 폰트 확대 비율 (예: 10% 확대)
    
    // ★ 함수 호출해 텍스트 쓰기
    drawLeftStyledText(
        policyCard.policy, 
        textX+35, 
        textY, 
        textW, 
        lineHeight, 
        fontRegular, 
        fontBold, 
        baseFontSize, 
        boldScaleFactor
    );


  // =======================================================
  // 4. 말 이미지 (텍스트 박스 밖 왼쪽으로 분리)
  // =======================================================
  const horseW = 140;
  if (horse_re2) {
      const aspectRatio = horse_re2.width / horse_re2.height;
      const horseH = horseW / aspectRatio; 
      
      // ★ 변경: 텍스트 박스 왼쪽, 상단 맞춤으로 배치
      const horseMargin = 60; // 텍스트 박스와의 간격
      const horseX = boxX - horseW - horseMargin;
       
      // 텍스트 박스의 상단 Y좌표와 맞춤 (혹은 중앙에 오도록 조정 가능)
      const horseY = boxY + boxH - textMargin - horseH; 
      
      imageFlipX(horse_re2, horseX, horseY, horseW, horseH);
  }


  // ===== 정책 링크 버튼 =====
  const advicelinkW = advicelink.width * 0.8;
  const advicelinkH = advicelink.height * 0.8;
  const advicelinkBtnX = cardX + cardW + 15; 
  const advicelinkBtnY = cardY + cardH - advicelinkH;

drawImageButtonScaled(
  advicelink,
  advicelinkHover,
  advicelinkBtnX,
  advicelinkBtnY,
  advicelinkW,
  advicelinkH,
  () => {
    if (policyCard?.link) {
      openUrlModal(policyCard.link);
    }
  }
);


  // 안내 문구
  const tooltipText = `
  < 아래를 눌러 
  자세히 알아보세요! >
  `;

  textSize(18);
  const tooltipW = textWidth(tooltipText) + 20;
  const tooltipH = 35;
  const tooltipX = advicelinkBtnX + (advicelinkW / 2) - (tooltipW / 2);
  const tooltipY = advicelinkBtnY - tooltipH - 10; // 버튼 위 10px 간격

  fill(255);
  textAlign(CENTER, CENTER);
  text(tooltipText, tooltipX + tooltipW / 2, tooltipY + tooltipH / 2);

  // 🔹 이전/다음 버튼 추가
  const btnY = boxY + boxH + 90;
  drawPrevNextButtons("pre_adviceCard", "pre_summary",  795 - before.width / 2);
}


// ========= Pre_summary Screen ===========
function drawPre_summaryScreen(){
  drawStartTutorialBackground();

  const boxW = 1100;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 680;

  // 말 그림 (intro 단계와 동일한 위치)
  if (horse_re1) {
    const horseSize = 500;
    const horseX = boxX + boxW / 2 - horseSize / 2;
    const horseY = boxY - horseSize + 100;

  // 1. 비율 유지 계산
    const aspectRatio = horse_re1.width / horse_re1.height;
    let drawH = horseSize;
    let drawW = horseSize * aspectRatio;

    imageMode(CORNER);
    image(horse_re1, horseX + (horseSize - drawW)/2, horseY, drawW, drawH);
  }

  // 설명 박스 (intro 단계와 동일한 위치)
  image(textbox1, boxX, boxY);

// 텍스트
  fill(0);
  textAlign(CENTER, CENTER);
  const baseFontSize = 28;
  const lineHeight = 45;
  const boldScaleFactor = 1.2;

  drawStyledText(
      `이렇게 당신의 **세 카드**를 모두 살펴봤어요!
  결과를 한 눈에 볼 수 있게 **QR 코드**로 정리해 드릴게요.`, 
        boxX + boxW / 2, // 중앙 정렬 기준 X
        boxY + boxH / 2, // 중앙 정렬 기준 Y
        boxW - 60,       // 최대 너비
        lineHeight,      // 줄 간격
        fontRegular,     // 일반 폰트
        fontBold,         // 볼드 폰트
        baseFontSize,        // 기본 폰트 크기
        boldScaleFactor   // 볼드 확대 비율
     );

  // 1) 이전 버튼
  const baseY = boxY + boxH / 2 - before.width / 2;
  const margin = 200;
  const prevW = before.width;
  const prevX = margin;

  drawImageButton(before, beforeHover, prevX, baseY, () => {
    state = "adviceCard"; // 이전 버튼은 adviceCard로
  });

  // 2) 결과보기 버튼 (설명 박스 아래 중앙)
  if (result && resultHover) {
    const btnW = result.width;
    const btnH = result.height;
    const btnX = width / 2 - btnW / 2;
    const btnY = boxY + boxH; 

drawImageButton(result, resultHover, btnX, btnY, () => {
  state = "summary";               // 👉 바로 화면 전환

  // 👉 Supabase 저장은 기다리지 않고 실행
  saveResultToSupabase()
    .then((id) => {
      qrKey = id;                  // 성공하면 QR용 key만 저장
    })
    .catch((e) => {
      console.error("Supabase 저장 실패", e);
      // 실패해도 아무것도 안 함 (UX 유지)
    });
  });
}
}



// ========== SUMMARY SCREEN (COMPLETE FINAL VERSION) ==========
function drawSummaryScreen() {
  drawResultBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  // =============================
  // 🔶 1) 말 + 텍스트 박스
  // =============================
  const boxW = 800;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 680;

  image(textbox2, boxX-35, boxY);

  // 말 이미지
  const horseW = 140;
  if (horse_re2) {
    let hW = (horse_re2.width > 0) ? horse_re2.width : 1;
    let hH = (horse_re2.height > 0) ? horse_re2.height : 1;
    const aspectRatio = hW / hH;
    const horseH = horseW / aspectRatio;
    const horseX = boxX - horseW - 60;
    const horseY = boxY + boxH / 2 - horseH / 2;
    imageFlipX(horse_re2, horseX, horseY, horseW, horseH);
  }

  // =============================
  // 🔶 2) summary 텍스트 분기
  // =============================
  let summaryText;

  if (geminiStatus === "error") {
    summaryText =
      "타로 마스터가 잠시 휴식 중입니다.\n" +
      "잠시 후 다시 시도해 주세요.";
  } else {
    summaryText =
      "부디 고민 많은 청년 여러분께\n" +
      "수상한 타로 가게의 카드들이 도움이 되었기를 바랍니다.\n" +
      "**당신의 2026년을 붉은 말이 계속해서 응원할게요!**";
  }

  // 텍스트 스타일
  fill(0);
  textAlign(CENTER, CENTER);
  const baseFontSize = 28;
  const lineHeight = 45;
  const boldScaleFactor = 1.2;

  drawStyledText(
    summaryText,
    boxX + boxW / 2+25,   // 중앙 정렬 기준 X
    boxY + boxH / 2,   // 중앙 정렬 기준 Y
    boxW - 60,         // 최대 너비
    lineHeight,        // 줄 간격
    fontRegular,       // 일반 폰트
    fontBold,          // 볼드 폰트
    baseFontSize,      // 기본 폰트 크기
    boldScaleFactor    // 볼드 확대 비율
  );

  // =============================
  // 🔶 3) QR 영역 (기존 그대로)
  // =============================
  if (geminiStatus !== "error") {
    const qrSize = 220;
    const qrX = width / 2 - qrSize / 2;
    const qrY = 380;

    drawQRCode(qrX, qrY, qrSize);

    fill(200);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(
      "QR을 스캔해 결과를 저장하세요",
      width / 2,
      qrY + qrSize + 20
    );
  }


  // const boxColor = color(30, 25, 60, 230);

  // // =============================
  // // 🔶 2) 상단 요약 박스 3개
  // // =============================
  // push();
  // textAlign(LEFT, TOP);
  // textSize(18);
  // textLeading(22);
  // const summaryLeftX = boxX;

  // const bigW = 900;
  // const bigH = 260;

  // const smallW = 430;
  // const smallH = 220;
  // const gap = 30;

  // // 첫 번째 박스 (타로 조언)
  // const firstY = 150;

  // fill(boxColor);
  // rect(summaryLeftX, firstY, bigW, bigH, 25);

  // fill(255);
  // text("① 타로 마스터의 해석", summaryLeftX + 24, firstY + 20);
  // text(
  //   tarotAdvice || "-",
  //   summaryLeftX + 24,
  //   firstY + 60,
  //   bigW - 48,
  //   bigH - 80
  // );

  // // 두 번째 & 세 번째 박스 (좌/우)
  // const secondY = firstY + bigH + gap;

  // // 흐름 카드
  // fill(boxColor);
  // rect(summaryLeftX, secondY, smallW, smallH, 20);

  // fill(255);
  // text("② 흐름의 카드", summaryLeftX + 20, secondY + 20);

  // if (flowCard) {
  //   text(
  //     flowCard.summary,
  //     summaryLeftX + 20,
  //     secondY + 55,
  //     smallW - 40,
  //     smallH - 75
  //   );
  // } else {
  //   text("등록된 흐름 카드가 없습니다.", summaryLeftX + 20, secondY + 55);
  // }

  // // 조언 카드
  // const rightBoxX = summaryLeftX + smallW + 20;

  // fill(boxColor);
  // rect(rightBoxX, secondY, smallW, smallH, 20);

  // fill(255);
  // text("③ 조언의 카드", rightBoxX + 20, secondY + 20);

  // if (policyCard) {
  //   text(
  //     policyCard.policy,
  //     rightBoxX + 20,
  //     secondY + 55,
  //     smallW - 40,
  //     smallH - 75
  //   );
  // } else {
  //   text("등록된 조언 카드가 없습니다.", rightBoxX + 20, secondY + 55);
  // }
  // pop();

  // // =============================
  // // 🔶 3) QR 버튼
  // // =============================
  // const qrW = qr.width * 0.55;
  // const qrH = qr.height * 0.55;

  // const qrX = rightBoxX + smallW + 30;
  // const qrY = secondY + smallH / 2 - qrH / 2;

  // drawImageButtonScaled(
  //   qr,
  //   qrHover,
  //   qrX,
  //   qrY,
  //   qrW,
  //   qrH,
  //   () => {
  // const QRPage = "https://iamsaeun.github.io/tarot/qr_result.html";

  // const url =
  //   QRPage +
  //   "?bg=" + encodeURIComponent(BACKGROUND_MAP[selectedCategory]) +
  //   "&char=" + encodeURIComponent(CHARACTER_MAP[actualImageKeyWord]) +
  //   "&item=" + encodeURIComponent(ITEM_MAP[selectedTopic]) +
  //   "&advice=" + encodeURIComponent(tarotAdvice);

  // return `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=300`;

  //   }
  // );

  // =============================
  // 🔶 4) 이전 / 다음 버튼
  // =============================
  const btnY = 720;  

  drawPrevNextButtons("pre_summary", "start", btnY);

}

// ========== 작은 말풍선 텍스트 쓰기 함수 ===========
function drawStyledText(
    textStr, x, y, maxWidth, lineHeight,
    regularFont, boldFont,
    baseSize, boldScale
) { fill(0);
    if (!regularFont || !boldFont) return;

    const boldSize = baseSize * boldScale;

    textAlign(LEFT, BASELINE);

    const lines = textStr.trim().split('\n');
    const textBlockHeight = lines.length * lineHeight;
    let currentY = y - textBlockHeight / 2 + lineHeight / 2;

    for (const line of lines) {
        const parts = line.split('**');
        let totalLineWidth = 0;

        // 기준 폰트 descent 계산
        textFont(regularFont);
        textSize(baseSize);
        const regularDescent = textDescent();

        // 1단계: 줄 전체 너비 계산
        for (let i = 0; i < parts.length; i++) {
            const isBold = i % 2 !== 0;
            textFont(isBold ? boldFont : regularFont);
            textSize(isBold ? boldSize : baseSize);
            totalLineWidth += textWidth(parts[i]);
        }

        let currentX = x - totalLineWidth / 2;

        // 2단계: 실제 출력
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isBold = i % 2 !== 0;

            textFont(isBold ? boldFont : regularFont);
            textSize(isBold ? boldSize : baseSize);

            // 현재 폰트 descent
            const currentDescent = textDescent();

            // 하단 정렬을 위한 y 보정
            const yOffset = regularDescent - currentDescent;

            text(part, currentX, currentY + yOffset);
            currentX += textWidth(part);
        }
        currentY += lineHeight;
    }
    // 원상 복구
    textFont(regularFont);
    textSize(baseSize);
}

// =========== 큰 말풍선 텍스트 쓰기 함수 =============
function drawLeftStyledText(
    textStr, x, y, maxWidth, lineHeight,
    regularFont, boldFont,
    baseSize, boldScale
) {
    if (!regularFont || !boldFont) return;

    const boldSize = baseSize * boldScale;
    textAlign(LEFT, BASELINE);
    fill(0);

    // 기준 descent 계산
    textFont(regularFont);
    textSize(baseSize);
    const regularDescent = textDescent();

    // 개행 기준 분리
    const paragraphs = textStr.split(/\r?\n/);

    // --------------------------------------------------------
    // [1단계] 전체 높이 미리 계산하기
    // --------------------------------------------------------
    let totalHeight = 0;
    let tempCursorX = 0;
    let lineCount = 0;

    for (let i = 0; i < paragraphs.length; i++) {
        const tokens = paragraphs[i].split(/(\*\*.*?\*\*|\s+)/);
        tempCursorX = 0;
        lineCount++; // 새로운 문단 시작 시 줄 수 증가

        for (const token of tokens) {
            if (!token) continue;

            const isBold = token.startsWith('**') && token.endsWith('**');
            const content = isBold ? token.slice(2, -2) : token;
            
            textFont(isBold ? boldFont : regularFont);
            textSize(isBold ? boldSize : baseSize);
            const w = textWidth(content);

            if (tempCursorX + w > maxWidth) {
                tempCursorX = w;
                lineCount++;
            } else {
                tempCursorX += w;
            }
        }
    }
    totalHeight = lineCount * lineHeight;

    // --------------------------------------------------------
    // [2단계] 중앙 정렬된 시작 위치 계산 및 실제 출력
    // --------------------------------------------------------
    // y는 텍스트박스의 중앙 좌표라고 가정합니다.
    // 박스 중앙(y)에서 전체 높이의 절반을 빼서 시작점 결정
    let cursorX = x;
    let cursorY = y - (totalHeight / 2) + baseSize; 

    for (const line of paragraphs) {
        const tokens = line.split(/(\*\*.*?\*\*|\s+)/);

        for (const token of tokens) {
            if (!token) continue;

            // 공백 토큰 처리
            if (/^\s+$/.test(token)) {
                textFont(regularFont);
                textSize(baseSize);
                const w = textWidth(token);

                if (cursorX + w > x + maxWidth) {
                    cursorX = x;
                    cursorY += lineHeight;
                } else {
                    cursorX += w;
                }
                continue;
            }

            // 볼드 여부 및 텍스트 설정
            const isBold = token.startsWith('**') && token.endsWith('**');
            const content = isBold ? token.slice(2, -2) : token;

            textFont(isBold ? boldFont : regularFont);
            textSize(isBold ? boldSize : baseSize);

            const w = textWidth(content);
            const currentDescent = textDescent();
            const yOffset = regularDescent - currentDescent;

            // 자동 줄바꿈
            if (cursorX + w > x + maxWidth) {
                cursorX = x;
                cursorY += lineHeight;
            }

            text(content, cursorX, cursorY + yOffset);
            cursorX += w;
        }

        // 문단 종료 후 명시적 줄바꿈
        cursorX = x;
        cursorY += lineHeight;
    }

    // 설정 복구
    textFont(regularFont);
    textSize(baseSize);
}



// ========== 예비 버튼 (이미지 버튼이 출력 안될시)==========
function drawButton(x, y, w, h, label) {
  let isHover =
    mouseX > x && mouseX < x + w &&
    mouseY > y && mouseY < y + h;

  if (isHover) {
    fill(120, 90, 200, 240);
  } else {
    fill(90, 60, 170, 240);
  }

  noStroke();
  rect(x, y, w, h, 16);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(20);
  text(label, x + w / 2, y + h / 2);
}


// 🔹 클릭 가능한 이미지 버튼들을 모아두는 배열
let clickableButtons = [];

// =======================
// 공통: 이미지 버튼 그리기
// =======================
function drawImageButton(img, imgHover, x, y, callback) {
  imageMode(CORNER);
  const w = img.width;
  const h = img.height;

  // hover 체크
  let isHover = mouseX >= x && mouseX <= x + w &&
                mouseY >= y && mouseY <= y + h;

  // hover 이미지 / 일반 이미지
  image(isHover ? imgHover : img, x, y);

  // 🔥 여기서는 "클릭"을 수행하지 않는다.
  // 대신 나중에 mouseReleased에서 처리할 수 있도록 정보만 저장한다.
  clickableButtons.push({ x, y, w, h, callback });
}

// =======================
// 공통: 크기를 조절한 이미지 버튼 그리기
// =======================
function drawImageButtonScaled(img, imgHover, x, y, w, h, callback) {
  imageMode(CORNER);
  // hover 판정
  let isHover =
    mouseX >= x && mouseX <= x + w &&
    mouseY >= y && mouseY <= y + h;

  // 이미지 출력
  image(isHover ? imgHover : img, x, y, w, h);

  // 클릭영역 등록
  clickableButtons.push({ x, y, w, h, callback });
}

// =======================
// 공통: 이전/다음 버튼 그리기
// =======================

function drawPrevNextButtons(prevState, nextState, baseY) {
  const margin = 200;
  const prevW = before.width;
  const nextW = after.width;

  const prevX = margin;
  const nextX = width - margin - nextW;
  const y = baseY;

  // 이전 버튼
  drawImageButton(before, beforeHover, prevX, y, () => {
    if (prevState) state = prevState;
  });

  if (nextState) {
    // 카테고리가 선택되어 nextState가 존재할 때만 '클릭 가능한 버튼'으로 등록
    drawImageButton(after, afterHover, nextX, y, () => {
      if (state === "summary" && nextState === "start") {
        resetSystem();
      } else {
        state = nextState;
      }
    });
  } else {
    // 카테고리가 선택되지 않았을 때는 '그냥 이미지'만 그림 (클릭 영역 등록 안 함)
    push();
    tint(255, 100); // 누를 수 없다는 것을 시각적으로 표시
    image(after, nextX, y);
    pop();
  }
}




// ========== 클릭 처리 ==========

// 마우스를 누를 때: start/question 화면만 처리

function mousePressed() {
  lastInteractionTime = millis(); // 타이머 갱신
  for (const btn of clickableButtons) {
    if (isInside(mouseX, mouseY, btn.x, btn.y, btn.w, btn.h)) {
      if (clickSound && clickSound.isLoaded()) {
        clickSound.play();
      }
      break;
    }
  }
  if (state === "start") {
    handleStartClick();
    return;
  }

  if (state === "question") {
    handleQuestionClick();   // 선택만 하고 페이지는 안 넘김
    return;
  }

  if (state === "topics") {
    handleTopicsClick();     // 주제 선택 
    return;
  }

  if (state === "gemini") {
      let cardW = 350;
      let cardH = 550;
      let cardX = width / 2 - 450;
      let cardY = height / 2 - 275;

      if (!isCardFlipped && isInside(mouseX, mouseY, cardX, cardY, cardW, cardH)) {
          isCardFlipped = true;
          
          if (clickSound && clickSound.isLoaded()) clickSound.play();
      }
  }

  if (state === "card_selection") {
      // 이미 선택했다면 클릭 무시 (혹은 다시 선택하게 할 수도 있음)
      if (selectedCardIndex !== -1) return; 

      const cardW = 260;
      const cardH = 380;
      const gap = 50;
      const totalW = (cardW * 3) + (gap * 2);
      const startX = (width - totalW) / 2;
      const cardY = height / 2 - cardH / 2 + 50;

      // 3장 중 어디를 눌렀나 확인
      for (let i = 0; i < 3; i++) {
          let x = startX + (i * (cardW + gap));
          let y = cardY; // Hover시 y가 바뀌지만 클릭 판정은 원래 위치로 해도 무방

          if (isInside(mouseX, mouseY, x, y, cardW, cardH)) {
              selectedCardIndex = i; // i번째 카드 선택!
              
              // 효과음 재생
              if (magicRevealSound && magicRevealSound.isLoaded()) {
                   magicRevealSound.setVolume(1.0);
                   magicRevealSound.play();
              } else if (clickSound && clickSound.isLoaded()) {
                   clickSound.play();
              }
              break;
          }
      }
  }
}

// 마우스를 뗄 때: drawImageButton으로 등록된 버튼만 처리
function mouseReleased() {

  for (const btn of clickableButtons) {
    if (isInside(mouseX, mouseY, btn.x, btn.y, btn.w, btn.h)) {
      const result = btn.callback();
      if (typeof result === "string") window.open(result, "_blank");
      break;
    }
  }
  clickableButtons = [];
}


function handleStartClick() {
  if (enterNormal) {
    const imgW = enterNormal.width;
    const imgH = enterNormal.height;
    const x = width / 2 - imgW / 2;
    const y = height / 2 + 260;

    if (isInside(mouseX, mouseY, x, y, imgW, imgH)) {
      state = "intro_1";
      if (bgMusic && !bgMusic.isPlaying()) {
        bgMusic.setVolume(0.5);
        bgMusic.loop();
      }
    }
  } else {
    const x = width / 2 - btnWidth / 2;
    const y = height / 2 + 260;
    if (isInside(mouseX, mouseY, x, y, btnWidth, btnHeight)) {
      state = "intro_1";
      if (bgMusic && !bgMusic.isPlaying()) {
        bgMusic.setVolume(0.5);
        bgMusic.loop();
      }
    }
  }
}

function handleQuestionClick() {
  const categories = ["건강", "진로", "금전", "연애"];
  const normalImages = [health, career, money, love];

// 렌더링 코드와 동일하게 버튼 크기를 계산
  const btnW = normalImages[0].width * 0.9;
  const btnH = normalImages[0].height * 0.9;

  // 렌더링 코드와 동일하게 위치를 계산
  const startX = width / 2 - (btnW * 1.2);
  const startY = 240;  // drawQuestionScreen의 startY
  const gapX = btnW + 80;
  const gapY = btnH + 40;

  for (let i = 0; i < categories.length; i++) {
    const col = i % 2;
    const row = floor(i / 2);

    const x = startX + col * gapX;
    const y = startY + row * gapY;

    if (
      isInside(mouseX, mouseY, x, y, btnW, btnH)
    ) {
      selectedCategory = categories[i];
      selectedTopic = null;
      selectedKeyWord = null;
      tarotAdvice = "";
      return;
    }
  }
}

function handleTopicsClick() {
  const topics = TOPICS_MAP[selectedCategory] || [];
  const imageMap = TOPICS_IMAGE_MAP[selectedCategory];

  if (!imageMap) return;

  const btnW = imageMap.normal[0].width * 0.9;
  const btnH = imageMap.normal[0].height * 0.9;

  const startX = width / 2 - (btnW * 1.2);

// ★ drawTopicsScreen()과 동일하게 240으로 수정
  const startY = 240; 

  const gapX = btnW + 80;
  const gapY = btnH + 40;

  for (let i = 0; i < topics.length; i++) {
    const col = i % 2;
    const row = floor(i / 2);

    const x = startX + col * gapX;
    const y = startY + row * gapY;

    // 클릭 영역도 btnW, btnH 사용
    if (isInside(mouseX, mouseY, x, y, btnW, btnH)) {
      selectedTopic = topics[i];
      return;
    }
  }
}

function handleKeywordsClick() {
  const keywords = DUMMY_KEYWORDS_LIST;

  // 1) 키워드 카드 클릭 체크
  for (let i = 0; i < keywords.length; i++) {
    const col = i % KWD_GRID_COLS;
    const row = floor(i / KWD_GRID_COLS);

    let x = KWD_START_X + col * KWD_CELL_W;
    let y = KWD_START_Y + row * KWD_CELL_H;
    let w = KWD_CELL_W - 40;
    let h = KWD_CELL_H - 40;

    if (isInside(mouseX, mouseY, x, y, w, h)) {
      selectedKeyWord = keywords[i];
      actualImageKeyWord = KEYWORD_IMAGE_MAP[keywords[i]];
      return;
    }
  }

  // 2) "카드 생성하기" 버튼 클릭
  let btnX, btnY, btnW, btnH;

  if (createcard) {
    btnW = createcard.width;
    btnH = createcard.height;
    btnX = width / 2 - btnW / 2;
    btnY = height - 140;
  } else {
    btnW = btnWidth;
    btnH = btnHeight;
    btnX = width / 2 - btnW / 2;
    btnY = height - 140;
  }

  if (isInside(mouseX, mouseY, btnX, btnY, btnW, btnH)) {
    if (!selectedCategory || !selectedTopic || !selectedKeyWord) {
      return;
    }
    state = "loading";
    tarotAdvice = "";
    callGeminiTarot(selectedCategory, selectedTopic, selectedKeyWord);
  }
}

// ========== 유틸 ==========
function drawStageTitle(img) {
  if (!img) return;
  push();
  imageMode(CENTER);
  const w = img.width *0.8
  const h = img.height *0.8
  const x = width/2;                // 화면 좌측 여백
  const y = 130;                // 화면 상단 여백

  image(img, x, y, w, h);
  pop();
}

function resetAll() {
  selectedCategory = null;
  selectedTopic = null;
  selectedKeyWord = null;
  actualImageKeyWord = null;

  tarotAdvice = "";
  flowCard = null;
  policyCard = null;

  receiving = false;
  clickableButtons = [];

  isKeywordSelected = false; 
  rubProgress = 0;

  isCardFlipped = false;

  if (bgMusic && bgMusic.isPlaying()) {
      bgMusic.stop();
  }
}


function isInside(mx, my, x, y, w, h) {
  return mx > x && mx < x + w && my > y && my < y + h;
}

function loadCardsByTopic(topic) {
  flowCard = null;
  policyCard = null;

  if (!cardsData || !cardsData.topics) return;

  const topicData = cardsData.topics[topic];
  if (!topicData) return;

  if (topicData.flow && topicData.flow.length > 0) {
    flowCard = topicData.flow[0];
  }

  if (topicData.advice && topicData.advice.length > 0) {
    policyCard = topicData.advice[0];
  }
}

// 사용자 반응 있을 경우 초기화 X
function mouseMoved() {
  lastInteractionTime = millis(); // 마우스 움직임만으로도 타이머 갱신
}

function keyPressed() {
  lastInteractionTime = millis(); // 키보드 입력 시 타이머 갱신
}

//액자 그리기 함수//
function drawFramedHorse(horseImg, x, y, w, h) {
  if (!horseImg || !horseFrame) return;

  // 액자 비율 계산 (프레임 이미지는 말 이미지보다 약간 크게)
  const framePadding = w * 0.1; // 프레임 두께 감각적으로 맞춘값
  
  // 2. 액자(horseFrame)를 그릴 최종 위치와 크기
  const frameX = x; 
  const frameY = y;
  const frameW = w;
  const frameH = h;
  
  // 3. 프레임 내부에 그려질 말 이미지의 크기 및 위치 계산
  // 말 이미지 크기를 프레임 두께의 2배만큼 줄여서 프레임 내부에 배치
  const innerPadding = framePadding; // 좌우상하 동일한 패딩 적용
  
  const innerW = frameW - innerPadding * 2; // 전체 너비에서 좌/우 패딩 제거
  const innerH = frameH - innerPadding * 2; // 전체 높이에서 상/하 패딩 제거
  
  const innerX = frameX + innerPadding; // 프레임 X + 패딩
  const innerY = frameY + innerPadding; // 프레임 Y + 패딩


  // A. 액자 그리기 (먼저 그려서 뒤로 가게 함)
  imageMode(CORNER);
  image(horseFrame, frameX, frameY, frameW, frameH);

  // B. 말 이미지 그리기 (프레임 내부에 작게)
  image(horseImg, innerX, innerY, innerW, innerH);
}

// ========= 말 이미지 뒤집기 ===========
function imageFlipX(img, x, y, w = img.width, h = img.height) {
  push();
  translate(x + w, y);
  scale(-1, 1);
  image(img, 0, 0, w, h);
  pop();
}

// ========== QR코드==========
function makeQRData() {
  return {
    bg: BACKGROUND_MAP[selectedCategory],
    char: CHARACTER_MAP[actualImageKeyWord],
    item: ITEM_MAP[selectedTopic],

    tarotAdvice: tarotAdvice,
    flowText: flowCard?.summary || "",
    policyText: policyCard?.policy || ""
  };
}

function generateQRString() {
  const baseURL = "https://iamsaeun.github.io/tarot/qr_result.html";
  if (!qrKey) return null; // 아직 저장 안 됐으면 QR 못 그림
  return `${baseURL}?key=${encodeURIComponent(qrKey)}`;
}
function drawQRCode(x, y, size) {
  const url = generateQRString();
  if (!url) return;

  const QRCodeGen = window.qrcode;
  if (!QRCodeGen) {
    console.error("QRCode library not loaded");
    return;
  }

  const qr = QRCodeGen(0, 'M');
  qr.addData(url);
  qr.make();

  const cellCount = qr.getModuleCount();
  const cellSize = size / cellCount;

  push();
  translate(x, y);
  noStroke();

  for (let r = 0; r < cellCount; r++) {
    for (let c = 0; c < cellCount; c++) {
      fill(qr.isDark(r, c) ? 0 : 255);
      rect(c * cellSize, r * cellSize, cellSize, cellSize);
    }
  }
  pop();
}


async function saveResultToSupabase() {
  const { data, error } = await supabaseClient
    .from("tarot_results")
    .insert([{
  bg: BACKGROUND_MAP[selectedCategory],
  char: CHARACTER_MAP[actualImageKeyWord],
  item: ITEM_MAP[selectedTopic],
  tarot_advice: tarotAdvice,
  flow_text: flowCard?.summary || "",
  flow_link: flowCard?.url || "", 
  policy_text: policyCard?.policy || "",
  policy_link: policyCard?.link || ""

}])
    .select("id")
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return data.id;
}



// ========== 초기화 함수==========
// 모든 데이터를 태초의 상태로 되돌리는 함수
function resetSystem() {
  isResetting = true;

  closePdfModal();

  state = "start"; // 첫 화면으로
  lastInteractionTime = millis(); // 타이머 리셋

  // 1. 선택 데이터 초기화
  selectedCategory = null;
  selectedTopic = null;
  selectedKeyWord = null;
  actualImageKeyWord = null;
  selectedCardIndex = -1;
  isCardFlipped = false;

  // 2. 결과 및 상태 데이터 초기화
  tarotAdvice = "";
  flowCard = null;
  policyCard = null;
  qrKey = null;
  geminiStatus = "idle";
  receiving = false;

  // 3. 인터랙션 요소 초기화
  rubProgress = 0;
  isKeywordSelected = false;
  clickableButtons = []; // 버튼 배열 비우기

  // 4. 사운드 제어
  if (bgMusic && bgMusic.isPlaying()) bgMusic.stop();
  if (magicChargeSound && magicChargeSound.isPlaying()) magicChargeSound.stop();
  
  isResetting = false;
  console.log("시스템이 초기화되었습니다.");
}

//============ 초기화 경고 함수=============
function drawTimeoutWarning() {
  // 첫 화면("start")에서는 경고를 띄우지 않음
  if (state === "start") return;

  let elapsed = millis() - lastInteractionTime;
  let remaining = IDLE_TIMEOUT - elapsed;

  // 남은 시간이 30초 이하일 때만 실행
  if (remaining <= WARNING_THRESHOLD && remaining > 0) {
    push(); // 기존 스타일 보존
    
    // 1. 배경 어둡게 (오버레이)
    fill(0, 0, 0, 180);
    noStroke();
    rect(0, 0, width, height);

    // 2. 경고 문구 박스 (선택 사항)
    rectMode(CENTER);
    fill(255, 255, 255, 230);
    rect(width / 2, height / 2, 600, 400, 20);

    // 3. 안내 텍스트
    textAlign(CENTER, CENTER);
    fill(0);
    textFont(fontBold || 'sans-serif'); // 볼드 폰트 사용
    textSize(36);
    text("잠시 후 초기화됩니다", width / 2, height / 2 - 80);

    // 4. 카운트다운 숫자
    textSize(100);
    fill(220, 50, 50); // 붉은색 강조
    let seconds = ceil(remaining / 1000); // 올림 처리하여 초 단위 계산
    text(seconds, width / 2, height / 2 + 30);

    // 5. 하단 안내
    textSize(22);
    fill(100);
    textFont(fontRegular || 'sans-serif');
    text("화면을 클릭하거나 움직이면 계속할 수 있습니다!", width / 2, height / 2 + 130);
    
    pop(); // 스타일 복구
  }
}


// ========== Gemini 호출 로직 ==========
function callGeminiTarot(category, topic, keyWord) {
  if (!API_KEY || API_KEY === "%%%%") {
    console.error("API_KEY를 설정해주세요!");
    tarotAdvice = "API 키가 설정되지 않았습니다. 스케치를 수정해 주세요.";
    geminiStatus = "error";
    state = "summary";
    return;
  }

  receiving = true;
  geminiStatus = "loading";

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  const userText = `
사용자의 고민 주제는 "${category}"이고,
구체적으로 "${topic}"에 대해 알고 싶어 합니다.
선택된 키워드는 "${keyWord}"입니다.

이 정보를 바탕으로, 위에 설명한 역할에 맞게 조언을 해 주세요.
`;

  fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: [
        {
          parts: [{ text: userText }]
        }
      ]
    })
  })
    .then(async (res) => {
      if (!res.ok) {
        const errText = await res.text();
        console.error("Gemini HTTP Error:", res.status, errText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log("Gemini 응답:", data);
      receiving = false;
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "조언 텍스트를 불러오지 못했습니다.";
      tarotAdvice = text;
      loadCardsByTopic(selectedTopic);
      
      geminiStatus = "success";
      selectedCardIndex = -1; // 선택 상태 초기화
      state = "card_selection";
    })
    .catch(err => {
      console.error("Gemini 호출 오류:", err);
      receiving = false;
      tarotAdvice =
        "타로 마스터가 잠시 휴식 중입니다.\n잠시 후 다시 시도해 주세요.";
      geminiStatus = "error";
      state = "summary";
    });
}
