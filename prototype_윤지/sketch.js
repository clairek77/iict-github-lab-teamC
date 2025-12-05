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
  "정체", "걱정", "갈등", "혼란", 
  "선택", "균형", "전환", "결단"
];

// 16개 키워드를 4개 이미지 키워드에 매핑하는 지도
const KEYWORD_IMAGE_MAP = {
  "도전": "기회", "성장": "기회", "시작": "기회", "발전": "기회", 
  "긍정": "행운", "활력": "행운", "안정": "행운", "평화": "행운",
  "정체": "불안", "걱정": "불안", "갈등": "불안", "혼란": "불안",
  "선택": "변화", "균형": "변화", "전환": "변화", "결단": "변화",
};

// ===== state 관련 =====
// start -> question -> topics -> keywords -> loading -> gemini -> flowCard -> adviceCard -> summary

let state = "start";

let selectedCategory = null;   // "건강" / "금전" / "연애" / "진로"
let selectedTopic = null;      // TOPICS_MAP 중 사용자가 클릭한 단어 1개
let selectedKeyWord = null;    // DUMMY_KEYWORDS_LIST 중 사용자가 클릭한 단어 1개 (Gemini 프롬프트용)
let actualImageKeyWord = null; // CHARACTER_MAP에 사용될 4개 중 1개 (이미지용)

// bgm
let bgMusic = null;

// 타로 결과 관련
let tarotAdvice = "";          // Gemini가 생성한 조언 텍스트

// ===== API 관련 =====
const API_KEY = "AIzaSyAI6k-pbmWdrqlrGVlONY2hFmtetYv6gvk";
let receiving = false;

// 시스템 프롬프트 (타로가게 버전)
const SYSTEM_PROMPT = `
너는 "수상한 타로가게"의 타로 마스터야.
사용자가 고른 고민 카테고리(건강, 금전, 연애, 진로), 구체적인 주제, 그리고 키워드를 바탕으로,
미래를 단정하지 않고, 사용자가 스스로 선택할 여지를 남기는 조언을 해 줘.

- 카테고리와 주제, 키워드를 종합하여 타로카드 형식으로 조언에 맞는 아르카나 이름을 지을 것 "OO하는 XX"으로 
- XX= '기회'는 탐험가, '행운'은 수호자, '불안'은 위로자, '변화'는 항해자
- 한국어로 200~300자 정도 분량
- 볼드체나 ** 와 같은 강조 표시 없이 출력
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
// 배경
let tarotBg1 = null;  // 타로가게 배경
let tarotBg2 = null;  // 카드/결과 배경

// 입장하기 버튼 + 타이틀 로고
let enterNormal = null;
let enterHover = null;
let titleLogo = null;

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

// 출력/QR
let Print = null;
let printHover = null;
let qr = null;
let qrHover = null;

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

// ====== 카테고리별 버튼 세트 =======
let TOPICS_IMAGE_MAP = {};

// ===== JSON 카드 데이터 =====
let cardsData = null;   // cards.json 전체
let flowCard = null;    // 이번에 보여줄 '흐름' 카드
let policyCard = null;  // 이번에 보여줄 '조언(정책)' 카드

// ==== 타로 카드 이미지 ====
let cardImages = {}; // 타로 카드 이미지 저장할 객체

// 배경 (Category: 4개)
const BACKGROUND_MAP = {
  "건강": "card_bg_health.png",
  "금전": "card_bg_money.png",
  "연애": "card_bg_love.png",
  "진로": "card_bg_career.png",
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

// 🔹 클릭 가능한 이미지 버튼들을 모아두는 배열
let clickableButtons = [];

// =======================
// 공통: 이미지 버튼 그리기
// =======================
function drawImageButton(img, imgHover, x, y, callback) {
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

// ===== preload: 이미지/데이터 로드 =====
function preload() {
  // 붉은 말 캐릭터 이미지 5종
  for (let i = 1; i <= 5; i++) {
    horseImages[i - 1] = loadImage(`horse ${i}.png`);
  }

  // 배경 이미지 2종
  tarotBg1 = loadImage("tarotback1.png");
  tarotBg2 = loadImage("tarotback2.png");

  // 입장 버튼, 타이틀
  enterNormal = loadImage("enter_normal.png");
  enterHover  = loadImage("enter_hover.png");
  titleLogo   = loadImage("title_logo.png");

  // 버튼1 (대주제)
  career = loadImage("button_1_career.png");
  careerHover = loadImage("button_1_career_hover.png");
  health = loadImage("button_1_health.png");
  healthHover = loadImage("button_1_health_hover.png");
  love = loadImage("button_1_love.png");
  loveHover = loadImage("button_1_love_hover.png");
  money = loadImage("button_1_money.png");
  moneyHover = loadImage("button_1_money_hover.png");

  // '건강' 소주제
  health1 = loadImage("button_2_health1.png");
  health1Hover = loadImage("button_2_health1_hover.png");
  health2 = loadImage("button_2_health2.png");
  health2Hover = loadImage("button_2_health2_hover.png");
  health3 = loadImage("button_2_health3.png");
  health3Hover = loadImage("button_2_health3_hover.png");
  health4 = loadImage("button_2_health4.png");
  health4Hover = loadImage("button_2_health4_hover.png");

  // '금전' 소주제
  money1 = loadImage("button_2_money1.png");
  money1Hover = loadImage("button_2_money1_hover.png");
  money2 = loadImage("button_2_money2.png");
  money2Hover = loadImage("button_2_money2_hover.png");
  money3 = loadImage("button_2_money3.png");
  money3Hover = loadImage("button_2_money3_hover.png");
  money4 = loadImage("button_2_money4.png");
  money4Hover = loadImage("button_2_money4_hover.png");

  // '연애' 소주제
  love1 = loadImage("button_2_love1.png");
  love1Hover = loadImage("button_2_love1_hover.png");
  love2 = loadImage("button_2_love2.png");
  love2Hover = loadImage("button_2_love2_hover.png");
  love3 = loadImage("button_2_love3.png");
  love3Hover = loadImage("button_2_love3_hover.png");
  love4 = loadImage("button_2_love4.png");
  love4Hover = loadImage("button_2_love4_hover.png");

  // '진로' 소주제
  career1 = loadImage("button_2_career1.png");
  career1Hover = loadImage("button_2_career1_hover.png");
  career2 = loadImage("button_2_career2.png");
  career2Hover = loadImage("button_2_career2_hover.png");
  career3 = loadImage("button_2_career3.png");
  career3Hover = loadImage("button_2_career3_hover.png");
  career4 = loadImage("button_2_career4.png");
  career4Hover = loadImage("button_2_career4_hover.png");

  // 버튼3. 키워드
  anxiety = loadImage("button_3_anxiety.png");
  anxietyHover = loadImage("button_3_anxiety_hover.png");
  luck = loadImage("button_3_luck.png");
  luckHover = loadImage("button_3_luck_hover.png");
  chance = loadImage("button_3_chance.png");
  chanceHover = loadImage("button_3_chance_hover.png");
  change = loadImage("button_3_change.png");
  changeHover = loadImage("button_3_change_hover.png");

  // 기사 링크로 이동
  link = loadImage("button_link.png");
  linkHover = loadImage("button_link_hover.png");
  
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

  // 흐름카드 뽑기
  flow = loadImage("button_flow.png");
  flowHover = loadImage("button_flow_hover.png");

  // 조언카드 뽑기
  advice = loadImage("button_advice.png");
  adviceHover = loadImage("button_advice_hover.png");

  // 결과 한번에 보기
  result = loadImage("button_result.png");
  resultHover = loadImage("button_result_hover.png");

  // bgm
  bgMusic = loadSound("tarot_bgm.mp3");

  // JSON 카드 데이터
  cardsData = loadJSON("cards.json");

  // 타로 카드 레이어 이미지 로드
  const allImages = Object.assign({}, BACKGROUND_MAP, CHARACTER_MAP, ITEM_MAP);
  for (const key in allImages) {
    const fileName = allImages[key];
    cardImages[key] = loadImage(fileName);
  }
}

function setup() {
  createCanvas(1920, 1080);
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
  // 🔹 매 프레임마다 버튼 리스트 초기화
  clickableButtons = [];

  if (state === "start") {
    drawStartScreen();
  } else if (state === "question") {
    drawQuestionScreen();
  } else if (state === "topics") {
    drawTopicsScreen();
  } else if (state === "keywords") {
    drawKeywordsScreen();
  } else if (state === "loading") {
    drawLoadingScreen();
  } else if (state === "gemini") {
    drawGeminiScreen();
  } else if (state === "flowCard") {
    drawFlowCardScreen();
  } else if (state === "adviceCard") {
    drawAdviceCardScreen();
  } else if (state === "summary") {
    drawSummaryScreen();
  }
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
    image(titleLogo, width / 2, height / 2 - 220);
  } else {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(60);
    text("수상한 타로가게", width / 2, height / 2 - 220);
  }

  // 서브 문구
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(20);
  text("오늘의 기운과 한 단어의 선택으로, 당신만의 조언을 함께 봅니다.", width / 2, height / 2 - 120);

  // 붉은 말 캐릭터
  if (horseImages[0]) {
    imageMode(CENTER);
    image(horseImages[0], width / 2, height / 2 + 40, 320, 320);
  } else {
    fill(230, 200, 255);
    ellipse(width / 2, height / 2 + 40, 200, 200);
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

// ========== QUESTION SCREEN ==========
function drawQuestionScreen() {
  drawShopBackground();

  fill(0, 0, 0, 160);
  rect(0, 0, width, height);

  // 붉은 말 캐릭터
  if (horseImages[1]) {
    imageMode(CENTER);
    image(horseImages[1], 320, 650, 350, 350);
  } else {
    fill(230, 200, 255);
    ellipse(320, 650, 200, 200);
  }

  // 말풍선
  fill(255);
  rect(620, 360, 900, 260, 30);
  fill(0);
  textAlign(LEFT, TOP);
  textSize(26);
  text("어떤 것이 가장 고민되시나요?", 650, 390);

  textSize(18);
  text("하나만 골라주시면, 그 주제에 맞는 구체적인 단어를 뽑아볼게요.", 650, 430);

  const categories = ["건강", "금전", "연애", "진로"];
  const normalImages = [health, money, love, career];
  const hoverImages = [healthHover, moneyHover, loveHover, careerHover];

  imageMode(CORNER);

  const startX = 700;
  const startY = 470;
  const gapX = 300;
  const gapY = 120;

  for (let i = 0; i < categories.length; i++) {
    const col = i % 2;
    const row = floor(i / 2);

    const imgX = startX + col * gapX;
    const imgY = startY + row * gapY;

    const imgW = normalImages[i].width * 0.8;
    const imgH = normalImages[i].height * 0.8;

    const isHover =
      mouseX > imgX && mouseX < imgX + imgW &&
      mouseY > imgY && mouseY < imgY + imgH;

    if (isHover || selectedCategory === categories[i]) {
      image(hoverImages[i], imgX, imgY, imgW, imgH);
    } else {
      image(normalImages[i], imgX, imgY, imgW, imgH);
    }
  }
}

// ========== TOPICS SCREEN ==========
function drawTopicsScreen() {
  drawShopBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  const topics = TOPICS_MAP[selectedCategory] || [];
  const imageMap = TOPICS_IMAGE_MAP[selectedCategory];

  fill(255);
  textAlign(CENTER, TOP);
  textSize(32);
  text(`${selectedCategory} 중, 구체적으로 어떤 주제가 고민되시나요?`, width / 2, 80);

  textSize(18);
  text("4가지 주제 중 가장 마음이 끌리는 단어 하나를 골라주세요.", width / 2, 130);

  imageMode(CORNER);

  // 주제 단어 4개 (2x2)
  for (let i = 0; i < topics.length; i++) {
    const col = i % 2;
    const row = floor(i / 2);

    let x = CARD_START_X + col * CARD_CELL_W;
    let y = CARD_START_Y + row * CARD_CELL_H;

    if (!imageMap || !imageMap.normal[i]) {
      fill(40, 30, 70, 220);
      rect(x, y, CARD_CELL_W - 40, CARD_CELL_H - 40, 16);
      fill(255);
      textAlign(CENTER, CENTER);
      text(topics[i], x + (CARD_CELL_W - 40) / 2, y + (CARD_CELL_H - 40) / 2);
      continue;
    }

    const imgW = imageMap.normal[i].width;
    const imgH = imageMap.normal[i].height;

    const isHover =
      mouseX > x && mouseX < x + imgW &&
      mouseY > y && mouseY < y + imgH;

    if (isHover || selectedTopic === topics[i]) {
      image(imageMap.hover[i], x, y);
    } else {
      image(imageMap.normal[i], x, y);
    }
  }

  // 선택된 단어 표시
  fill(255);
  textAlign(CENTER, TOP);
  textSize(20);
  if (selectedTopic) {
    text(`지금 선택된 주제: "${selectedTopic}"`, width / 2, height - 220);
  } else {
    text("카드를 눌러, 오늘 가장 마음이 가는 주제 하나를 골라주세요.", width / 2, height - 220);
  }

  // 다음 버튼
  if (next) {
    const btnX = width / 2 - next.width / 2;
    const btnY = height - 200;

    drawImageButton(next, nextHover, btnX, btnY, () => {
      if (!selectedTopic) return;
      selectedKeyWord = null;
      state = "keywords";
    });
  } else {
    drawButton(width / 2 - btnWidth / 2, height - 140, btnWidth, btnHeight, "다음 단계로");
  }

  // 카드 클릭 처리는 여전히 handleTopicsClick 사용
  if (mouseIsPressed) handleTopicsClick();
}

// ========== KEYWORDS SCREEN ==========
function drawKeywordsScreen() {
  drawShopBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  const keywords = DUMMY_KEYWORDS_LIST;

  fill(255);
  textAlign(CENTER, TOP);
  textSize(32);
  text(`현재의 기운을 담은 키워드 선택`, width / 2, 80);

  textSize(18);
  text("당신에게 가장 강하게 끌리는 기운의 단어 하나를 골라주세요.", width / 2, 130);

  textSize(20);

  for (let i = 0; i < keywords.length; i++) {
    const col = i % KWD_GRID_COLS;
    const row = floor(i / KWD_GRID_COLS);

    let x = KWD_START_X + col * KWD_CELL_W;
    let y = KWD_START_Y + row * KWD_CELL_H;

    const cardW = KWD_CELL_W - 40;
    const cardH = KWD_CELL_H - 40;

    if (selectedKeyWord === keywords[i]) {
      fill(140, 110, 220, 240);
    } else {
      fill(40, 30, 70, 220);
    }
    rect(x, y, cardW, cardH, 16);

    fill(255);
    textAlign(CENTER, CENTER);
    text(keywords[i], x + cardW / 2, y + cardH / 2);
  }

  // 선택된 단어 표시
  fill(255);
  textAlign(CENTER, TOP);
  textSize(20);
  if (selectedKeyWord) {
    text(`선택된 키워드: "${selectedKeyWord}"`, width / 2, height - 220);
  } else {
    text("카드를 눌러, 당신의 기운에 가장 맞는 키워드 하나를 골라주세요.", width / 2, height - 220);
  }

  // 카드 생성하기 버튼
  if (createcard) {
    const imgW = createcard.width;
    const imgH = createcard.height;

    const btnX = width / 2 - imgW / 2;
    const btnY = height - 200;

    const isHover =
      mouseX > btnX && mouseX < btnX + imgW &&
      mouseY > btnY && mouseY < btnY + imgH;

    imageMode(CORNER);
    const imgToDraw = (isHover && createcardHover) ? createcardHover : createcard;
    image(imgToDraw, btnX, btnY);
  } else {
    drawButton(width / 2 - btnWidth / 2, height - 140, btnWidth, btnHeight, "카드 생성하기");
  }

  // 키워드/생성 버튼 클릭
  if (mouseIsPressed) handleKeywordsClick();
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
      ? `주제: ${selectedCategory} / 구체적 주제: ${selectedTopic} / 키워드: "${selectedKeyWord}"`
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

// ========== GEMINI SCREEN ==========
function drawGeminiScreen() {
  drawResultBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, TOP);
  textSize(32);
  text("붉은 말 타로 마스터의 첫 조언", width / 2, 80);

  textSize(20);
  text(
    selectedCategory && selectedTopic && selectedKeyWord
      ? `고민 주제: ${selectedCategory} > ${selectedTopic} / 선택한 키워드: "${selectedKeyWord}"`
      : "",
    width / 2,
    140
  );

  const contentStartY = 350;
  const boxW = 800;
  const boxH = 380;
  const boxX = width / 2 - 520;
  const boxY = contentStartY;

  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 20);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);
  const adviceText = tarotAdvice || "조언을 불러오는 중 문제가 발생했습니다.";
  text(adviceText, boxX + 32, boxY + 32, boxW - 64, boxH - 64);

  // 오른쪽 카드
  const cardW = 260;
  const cardH = 380;
  const cardX = width / 2 + 300;
  const cardY = contentStartY;

  const bgKey = selectedCategory;
  const charKey = actualImageKeyWord;
  const itemKey = selectedTopic;

  imageMode(CORNER);

  if (bgKey && cardImages[bgKey]) {
    image(cardImages[bgKey], cardX, cardY, cardW, cardH);
  } else {
    fill(40, 20, 80, 240);
    rect(cardX, cardY, cardW, cardH, 24);
  }

  if (charKey && cardImages[charKey]) {
    let img = cardImages[charKey];
    if (img.width > 1) {
      let newW = cardW * 0.85;
      let newH = img.height * (newW / img.width);
      imageMode(CENTER);
      image(img, cardX + cardW / 2, cardY + cardH / 2, newW, newH);
    }
  }

  if (itemKey && cardImages[itemKey]) {
    let img = cardImages[itemKey];
    if (img.width > 1) {
      let newW = cardW * 0.3;
      let newH = img.height * (newW / img.width);
      imageMode(CENTER);
      image(img, cardX + cardW / 2, cardY + cardH / 2 + 140, newW, newH);
    }
  }

  if (!bgKey || !charKey || !itemKey) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("타로 카드 이미지 로드 준비 중", cardX + cardW / 2, cardY + cardH / 2);
  }

  // 출력 버튼
  const btnGap = 12;

  const printW = Print.width * 0.6;
  const printH = Print.height * 0.6;

  const printBtnX = cardX + cardW / 2 - printW / 2 + 40;
  const printBtnY = cardY + cardH + 24;

  imageMode(CORNER);
  let isPrintHover =
    mouseX >= printBtnX && mouseX <= printBtnX + printW &&
    mouseY >= printBtnY && mouseY <= printBtnY + printH;

  image(
    isPrintHover ? printHover : Print,
    printBtnX, printBtnY,
    printW, printH
  );

  if (isPrintHover && mouseIsPressed) {
    window.print();
  }

  // QR 버튼
  const qrW = qr.width * 0.6;
  const qrH = qr.height * 0.6;

  const qrBtnX = cardX + cardW / 2 - qrW / 2 + 40;
  const qrBtnY = printBtnY + printH + btnGap;

  let isQrHover =
    mouseX >= qrBtnX && mouseX <= qrBtnX + qrW &&
    mouseY >= qrBtnY && mouseY <= qrBtnY + qrH;

  image(
    isQrHover ? qrHover : qr,
    qrBtnX, qrBtnY,
    qrW, qrH
  );

  if (isQrHover && mouseIsPressed) {
    console.log("QR 버튼 클릭");
  }

  // 붉은 말 캐릭터
  if (horseImages[2]) {
    imageMode(CENTER);
    image(horseImages[2], width / 2 - 600, 550, 250, 250);
  }

  textAlign(CENTER, TOP);
  textSize(18);
  const speechY = contentStartY + boxH + 10;
  text("붉은 말: \"이제, 당신을 둘러싼 흐름 카드를 한번 뽑아볼까요?\"", width / 2, speechY);

  imageMode(CORNER);

  // 흐름카드 뽑기 버튼 (✨ 여기부터는 drawImageButton + mouseReleased)
  const flowBtnX = width / 2 - flow.width / 2;
  const flowBtnY = speechY + 60;

  drawImageButton(flow, flowHover, flowBtnX, flowBtnY, () => {
    state = "flowCard";
  });
}

// ========== FLOW CARD SCREEN ==========
function drawFlowCardScreen() {
  drawResultBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, TOP);
  textSize(32);
  text("요즘, 당신을 둘러싼 흐름 카드", width / 2, 80);

  textSize(20);
  text(
    selectedCategory && selectedTopic
      ? `고민 주제: ${selectedCategory} > ${selectedTopic}`
      : "",
    width / 2,
    140
  );

  const contentStartY = 350;

  const boxW = 800;
  const boxH = 380;
  const boxX = width / 2 - 520;
  const boxY = contentStartY;

  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 20);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);

  if (flowCard) {
    text(`[흐름] ${flowCard.title}`, boxX + 32, boxY + 32, boxW - 64, 40);
    text(flowCard.summary, boxX + 32, boxY + 80, boxW - 64, boxH - 112);
  } else {
    text("이 카테고리에 등록된 흐름 카드가 없습니다.", boxX + 32, boxY + 32);
  }

  const cardW = 260;
  const cardH = 380;
  const cardX = width / 2 + 300;
  const cardY = contentStartY;

  fill(40, 20, 80, 240);
  rect(cardX, cardY, cardW, cardH, 24);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("흐름 카드 이미지 자리", cardX + cardW / 2, cardY + cardH / 2);

  // 기사 링크 버튼
  let linkBtnX = 1300;
  let linkBtnY = boxY + boxH + 40;
  let linkBtnW = 180;
  let linkBtnH = 60;

  let isLinkHover =
    mouseX > linkBtnX && mouseX < linkBtnX + linkBtnW &&
    mouseY > linkBtnY && mouseY < linkBtnY + linkBtnH;

  if (isLinkHover) {
    image(linkHover, linkBtnX, linkBtnY, linkBtnW, linkBtnH);
  } else {
    image(link, linkBtnX, linkBtnY, linkBtnW, linkBtnH);
  }

  if (horseImages[3]) {
    imageMode(CENTER);
    image(horseImages[3], width / 2 - 600, 550, 250, 250);
  }

  textAlign(CENTER, TOP);
  textSize(18);
  const speechY = contentStartY + boxH + 10;
  text("붉은 말: \"이번엔, 현실적인 조언 카드를 뽑아볼까요?\"", width / 2, speechY);

  imageMode(CORNER);

  // 조언 카드 뽑기 버튼 (drawImageButton)
  const adviceBtnX = width / 2 - advice.width / 2;
  const adviceBtnY = speechY + 60;

  drawImageButton(advice, adviceHover, adviceBtnX, adviceBtnY, () => {
    state = "adviceCard";
  });
}

// ========== ADVICE CARD SCREEN ==========
function drawAdviceCardScreen() {
  drawResultBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, TOP);
  textSize(32);
  text("당신을 위한 현실적인 조언 카드", width / 2, 80);

  textSize(20);
  text(
    selectedCategory && selectedTopic
      ? `고민 주제: ${selectedCategory} > ${selectedTopic}`
      : "",
    width / 2,
    140
  );

  const contentStartY = 350;

  const boxW = 800;
  const boxH = 380;
  const boxX = width / 2 - 520;
  const boxY = contentStartY;

  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 20);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);

  if (policyCard) {
    text(`[정책] ${policyCard.title}`, boxX + 32, boxY + 32, boxW - 64, 40);
    text(policyCard.policy, boxX + 32, boxY + 80, boxW - 64, boxH - 112);
  } else {
    text("이 카테고리에 등록된 조언 카드가 없습니다.", boxX + 32, boxY + 32);
  }

  const cardW = 260;
  const cardH = 380;
  const cardX = width / 2 + 300;
  const cardY = contentStartY;

  fill(40, 20, 80, 240);
  rect(cardX, cardY, cardW, cardH, 24);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("조언 카드 이미지 자리", cardX + cardW / 2, cardY + cardH / 2);

  if (horseImages[4]) {
    imageMode(CENTER);
    image(horseImages[4], width / 2 - 600, 550, 250, 250);
  }

  textAlign(CENTER, TOP);
  textSize(18);
  const speechY = contentStartY + boxH + 10;
  text("붉은 말: \"지금까지 뽑은 것들, 한 번에 정리해서 볼까요?\"", width / 2, speechY);

  // 오늘 결과 한 번에 보기 버튼 (drawImageButton)
  const resultBtnX = width / 2 - result.width / 2;
  const resultBtnY = speechY + 60;

  drawImageButton(result, resultHover, resultBtnX, resultBtnY, () => {
    state = "summary";
  });
}

// ========== SUMMARY SCREEN ==========
function drawSummaryScreen() {
  drawResultBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, TOP);
  textSize(32);
  text("오늘의 한 단어가 보여준 것들", width / 2, 60);

  textSize(20);
  text(
    selectedCategory && selectedTopic && selectedKeyWord
      ? `고민 주제: ${selectedCategory} > ${selectedTopic} / 선택한 키워드: "${selectedKeyWord}"`
      : "",
    width / 2,
    110
  );

  const boxW = 1100;
  const boxX = width / 2 - boxW / 2;
  let boxY = 160;
  const boxH = 160;
  const gap = 20;

  // 1) Gemini 조언
  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 20);
  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);
  text("① 타로 마스터의 조언", boxX + 24, boxY + 20);
  text(tarotAdvice || "-", boxX + 24, boxY + 50, boxW - 48, boxH - 70);

  // 2) 흐름 카드
  boxY += boxH + gap;
  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 20);
  fill(255);
  text("② 당신을 둘러싼 흐름", boxX + 24, boxY + 20);
  if (flowCard) {
    text(`[${flowCard.title}] ${flowCard.summary}`, boxX + 24, boxY + 50, boxW - 48, boxH - 70);
  } else {
    text("이 카테고리에 등록된 흐름 카드가 없습니다.", boxX + 24, boxY + 50);
  }

  // 3) 조언 카드
  boxY += boxH + gap;
  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 20);
  fill(255);
  text("③ 당신을 위한 조언", boxX + 24, boxY + 20);
  if (policyCard) {
    text(`[${policyCard.title}] ${policyCard.policy}`, boxX + 24, boxY + 50, boxW - 48, boxH - 70);
  } else {
    text("이 카테고리에 등록된 조언 카드가 없습니다.", boxX + 24, boxY + 50);
  }

  // "다시 점치기" 버튼 (drawImageButton)
  const exitBtnX = width / 2 - exit.width / 2;
  const exitBtnY = boxY + boxH + 40;

  drawImageButton(exit, exitHover, exitBtnX, exitBtnY, () => {
    selectedCategory = null;
    selectedTopic = null;
    selectedKeyWord = null;
    tarotAdvice = "";
    flowCard = null;
    policyCard = null;
    state = "start";
  });
}

// ========== 공통 버튼 ==========
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

// ========== 클릭 처리 ==========

// 마우스를 누를 때: start/question 화면만 처리
function mousePressed() {
  if (state === "start") {
    handleStartClick();
  } else if (state === "question") {
    handleQuestionClick();
  }
}

// 마우스를 뗄 때: drawImageButton으로 등록된 버튼만 처리
function mouseReleased() {
  for (const btn of clickableButtons) {
    if (isInside(mouseX, mouseY, btn.x, btn.y, btn.w, btn.h)) {
      btn.callback();
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
      state = "question";
      if (bgMusic && !bgMusic.isPlaying()) {
        bgMusic.setVolume(0.5);
        bgMusic.loop();
      }
    }
  } else {
    const x = width / 2 - btnWidth / 2;
    const y = height / 2 + 260;
    if (isInside(mouseX, mouseY, x, y, btnWidth, btnHeight)) {
      state = "question";
      if (bgMusic && !bgMusic.isPlaying()) {
        bgMusic.setVolume(0.5);
        bgMusic.loop();
      }
    }
  }
}

function handleQuestionClick() {
  const categories = ["건강", "금전", "연애", "진로"];
  const normalImages = [health, money, love, career];

  const startX = 700;
  const startY = 470;
  const gapX = 300;
  const gapY = 120;

  for (let i = 0; i < categories.length; i++) {
    const col = i % 2;
    const row = floor(i / 2);

    const imgX = startX + col * gapX;
    const imgY = startY + row * gapY;

    if (!normalImages[i]) continue;

    const imgW = normalImages[i].width * 0.8;
    const imgH = normalImages[i].height * 0.8;

    if (isInside(mouseX, mouseY, imgX, imgY, imgW, imgH)) {
      selectedCategory = categories[i];
      selectedTopic = null;
      selectedKeyWord = null;
      tarotAdvice = "";
      state = "topics";
      return;
    }
  }
}

function handleTopicsClick() {
  const topics = TOPICS_MAP[selectedCategory] || [];
  const imageMap = TOPICS_IMAGE_MAP[selectedCategory];

  for (let i = 0; i < topics.length; i++) {
    const col = i % 2;
    const row = floor(i / 2);

    let x = CARD_START_X + col * CARD_CELL_W;
    let y = CARD_START_Y + row * CARD_CELL_H;

    if (!imageMap || !imageMap.normal[i]) continue;

    let w = imageMap.normal[i].width;
    let h = imageMap.normal[i].height;

    if (isInside(mouseX, mouseY, x, y, w, h)) {
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

// ========== Gemini 호출 로직 ==========
function callGeminiTarot(category, topic, keyWord) {
  if (!API_KEY || API_KEY === "%%%%") {
    console.error("API_KEY를 설정해주세요!");
    tarotAdvice = "API 키가 설정되지 않았습니다. 스케치를 수정해 주세요.";
    state = "summary";
    return;
  }

  receiving = true;

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
      state = "gemini";
    })
    .catch(err => {
      console.error("Gemini 호출 오류:", err);
      receiving = false;
      tarotAdvice =
        "타로 마스터가 잠시 휴식 중입니다.\n잠시 후 다시 시도해 주세요.";
      state = "summary";
    });
}
