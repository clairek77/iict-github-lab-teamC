// ===== 단어 목록 정의 =====
const TOPICS_MAP = {
  "건강": ["마음", "신체", "운동", "식습관"],
  "금전": ["투자", "소비", "수입", "저축"],
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
// 기존의 KEYWORDS_LIST는 DUMMY_KEYWORDS_LIST로 대체하여 사용합니다.

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

let selectedCategory = null;  // "건강" / "금전" / "연애" / "진로"
let selectedTopic = null;     // TOPICS_MAP 중 사용자가 클릭한 단어 1개
let selectedKeyWord = null;     // DUMMY_KEYWORDS_LIST 중 사용자가 클릭한 단어 1개 (Gemini 프롬프트용)
let actualImageKeyWord = null; // CHARACTER_MAP에 사용될 4개 중 1개 (이미지용)


// 타로 결과 관련
let tarotAdvice = "";         // Gemini가 생성한 조언 텍스트

// ===== API 관련 =====
const API_KEY = "###";   // 👈 여기에 본인 키!
let receiving = false;

// 시스템 프롬프트 (타로가게 버전)
const SYSTEM_PROMPT = `
너는 "수상한 타로가게"의 타로 마스터야.
사용자가 고른 고민 카테고리(건강, 금전, 연애, 진로), 구체적인 주제, 그리고 키워드를 바탕으로,
미래를 단정하지 않고, 사용자가 스스로 선택할 여지를 남기는 조언을 해 줘.

- 한국어로 200~300자 정도 분량
- 겁주거나 공포를 조장하지 말 것
- 너무 뻔한 일반론이 아니라, 사용자가 선택한 주제와 키워드를 적어도 한 번은 자연스럽게 등장시킬 것
- 말투는 친절하고 약간 수상한 점집 느낌으로
`;

// ===== 카드/버튼 레이아웃 상수 =====
const btnWidth = 200;
const btnHeight = 50;

// 단어 카드 그리드 (topics 화면) - 2x2
const CARD_COLS = 2; // 👈 2x2 그리드
const CARD_START_X = 500; // 👈 X 시작 위치 조정 (중앙 배치)
const CARD_START_Y = 380; // 👈 Y 시작 위치 조정 (2줄이 되므로 아래로 내림)
const CARD_CELL_W = 450; // 👈 셀 너비를 넓혀 2개씩 배치
const CARD_CELL_H = 180; // 👈 셀 높이를 키워 시각적 여유 확보

// 단어 카드 그리드 (keywords 화면)(4x4)
const KWD_GRID_COLS = 4;
const KWD_START_X = 500; // 490에서 살짝 옮김
const KWD_START_Y = 200; // 훨씬 위로 올려 4줄 배치
const KWD_CELL_W = 220;  // 셀 너비를 줄여 4개 배치
const KWD_CELL_H = 180;  // 셀 높이를 확보

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
  
  // JSON 카드 데이터
  cardsData = loadJSON("cards.json");

  // 타로 카드 레이어 이미지 로드
  const allImages = Object.assign({}, BACKGROUND_MAP, CHARACTER_MAP, ITEM_MAP);

  for (const key in allImages) {
    const fileName = allImages[key];
    cardImages[key] = loadImage(fileName); // '건강', '기회', '마음' 등의 키로 이미지 객체 저장
  }
}

function setup() {
  createCanvas(1920, 1080);
  textFont("Pretendard, sans-serif");
}

function draw() {
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

  // 말풍선 (임시 사각형)
  fill(255);
  rect(620, 360, 900, 260, 30);
  fill(0);
  textAlign(LEFT, TOP);
  textSize(26);
  text("어떤 것이 가장 고민되시나요?", 650, 390);

  textSize(18);
  text("하나만 골라주시면, 그 주제에 맞는 구체적인 단어를 뽑아볼게요.", 650, 430);

  // 선택지 버튼들
  const categories = ["건강", "금전", "연애", "진로"];
  for (let i = 0; i < categories.length; i++) {
    const col = i % 2;
    const row = floor(i / 2);
    const x = 750 + col * (btnWidth + 80);
    const y = 520 + row * (btnHeight + 30);
    drawButton(x, y, btnWidth, btnHeight, categories[i]);
  }
}

// ========== TOPICS SCREEN ==========
function drawTopicsScreen() {
  drawShopBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  // 선택된 카테고리에 맞는 주제 단어 목록
  const topics = TOPICS_MAP[selectedCategory] || [];

  fill(255);
  textAlign(CENTER, TOP);
  textSize(32);
  text(`${selectedCategory} 중, 구체적으로 어떤 주제가 고민되시나요?`, width / 2, 80);

  textSize(18);
  text("4가지 주제 중 가장 마음이 끌리는 단어 하나를 골라주세요.", width / 2, 130);

  // 주제 단어 4개 그리기 (1 x 4 그리드)
  textSize(22);

 for (let i = 0; i < topics.length; i++) {
    // 👈 2x2 그리드 위치 계산
    const col = i % 2; // 열 (0, 1, 0, 1)
    const row = floor(i / 2); // 행 (0, 0, 1, 1)
    
    let x = CARD_START_X + col * CARD_CELL_W;
    let y = CARD_START_Y + row * CARD_CELL_H;

    // 선택된 단어는 색을 다르게
    if (selectedTopic === topics[i]) {
      fill(140, 110, 220, 240);
    } else {
      fill(40, 30, 70, 220);
    }
    rect(x, y, CARD_CELL_W - 40, CARD_CELL_H - 40, 16);

    fill(255);
    textAlign(CENTER, CENTER);
    text(topics[i], x + (CARD_CELL_W - 40) / 2, y + (CARD_CELL_H - 40) / 2);
  }

  // 선택된 단어 표시
  fill(255);
  textAlign(CENTER, TOP);
  textSize(20);
  if (selectedTopic) {
    text(
      `지금 선택된 주제: "${selectedTopic}"`,
      width / 2,
      height - 220
    );
  } else {
    text("카드를 눌러, 오늘 가장 마음이 가는 주제 하나를 골라주세요.", width / 2, height - 220);
  }

  // 다음 단계 버튼
  drawButton(width / 2 - btnWidth / 2, height - 140, btnWidth, btnHeight, "다음 단계로");
}

// ========== KEYWORDS SCREEN (selectedKeyWord 사용) ==========
function drawKeywordsScreen() {
  drawShopBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  // 고정된 키워드 목록
  const keywords = DUMMY_KEYWORDS_LIST;

  fill(255);
  textAlign(CENTER, TOP);
  textSize(32);
  text(`현재의 기운을 담은 키워드 선택`, width / 2, 80);

  textSize(18);
  text("당신에게 가장 강하게 끌리는 기운의 단어 하나를 골라주세요.", width / 2, 130);

  // 키워드 4개 그리기 (4 x 4 그리드)
  textSize(20);

for (let i = 0; i < keywords.length; i++) { // 4x4 그리드 위치 계산
    const col = i % KWD_GRID_COLS; 
    const row = floor(i / KWD_GRID_COLS); 

    let x = KWD_START_X + col * KWD_CELL_W;
    let y = KWD_START_Y + row * KWD_CELL_H;

    const cardW = KWD_CELL_W - 40; 
    const cardH = KWD_CELL_H - 40;

    // 선택된 단어는 색을 다르게 (selectedKeyWord 사용)
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

  // 선택된 단어 표시 (selectedKeyWord 사용)
  fill(255);
  textAlign(CENTER, TOP);
  textSize(20);
  if (selectedKeyWord) {
    text(`선택된 키워드: "${selectedKeyWord}"`, width / 2, height - 220);
  } else {
    text("카드를 눌러, 당신의 기운에 가장 맞는 키워드 하나를 골라주세요.", width / 2, height - 220);
  }
  // 카드 생성하기 버튼
  drawButton(width / 2 - btnWidth / 2, height - 140, btnWidth, btnHeight, "카드 생성하기");
}

// ========== LOADING SCREEN (selectedKeyWord 사용) ==========
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

  // 로딩 애니메이션
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

  // 제목 및 상단 주제/단어
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

  // ==== 왼쪽: Gemini 조언 텍스트 자리 ====
  const boxW = 800;
  const boxH = 380;
  const boxX = width / 2 - 520;
  const boxY = 260;

  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 20);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);
  const adviceText = tarotAdvice || "조언을 불러오는 중 문제가 발생했습니다.";
  text(adviceText, boxX + 32, boxY + 32, boxW - 64, boxH - 64);


  // ==== 오른쪽: 타로 카드 이미지 자리 ====
  const cardW = 260;
  const cardH = 380;
  const cardX = width / 2 + 300;
  const cardY = 260;

  // 이미지 레이어 그리기
  const bgKey = selectedCategory;
  const charKey = actualImageKeyWord;
  const itemKey = selectedTopic;

  imageMode(CORNER); 
  
  // 1. 배경 이미지 (Category)
  if (bgKey && cardImages[bgKey]) {
    image(cardImages[bgKey], cardX, cardY, cardW, cardH);
  } else {
    fill(40, 20, 80, 240);
    rect(cardX, cardY, cardW, cardH, 24);
  }

  // 2. 캐릭터 이미지 (KeyWord)
  if (charKey && cardImages[charKey]) {
    image(cardImages[charKey], cardX, cardY, cardW, cardH); 
  }

  // 3. 아이템 이미지 (Topic)
  if (itemKey && cardImages[itemKey]) {
    image(cardImages[itemKey], cardX, cardY, cardW, cardH);
  }

  // 모든 이미지가 로드되지 않았거나, 키가 잘못되었을 경우 텍스트 표시
  if (!bgKey || !charKey || !itemKey) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(18);
    text("타로 카드 이미지 로드 준비 중", cardX + cardW / 2, cardY + cardH / 2);
  }

  // 붉은 말 캐릭터
  if (horseImages[2]) {
    imageMode(CENTER);
    image(horseImages[2], width / 2 - 600, 535, 250, 250); 
  }
  
  // 붉은 말 대사
  textAlign(CENTER, TOP);
  textSize(18);
  text("붉은 말: \"이제, 당신을 둘러싼 흐름 카드를 한번 뽑아볼까요?\"", width / 2, boxY + boxH + 10);

  // 버튼 텍스트: '흐름 카드 뽑기'
  drawButton(width / 2 - btnWidth / 2, boxY + boxH + 40, btnWidth, btnHeight, "흐름 카드 뽑기");
}

function handleGeminiClick() {
  const boxW = 800;
  const boxH = 380;
  const boxX = width / 2 - 40;
  const boxY = 260;
  const btnX = width / 2 - btnWidth / 2;
  const btnY = boxY + boxH + 40;

  if (isInside(mouseX, mouseY, btnX, btnY, btnWidth, btnHeight)) {
    state = "flowCard";
  }
}

function drawFlowCardScreen() {
  drawResultBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  // 제목 및 상단 주제/단어
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


  // ==== 왼쪽: 흐름 카드 텍스트 자리 ====
  const boxW = 800;
  const boxH = 380;
  const boxX = width / 2 - 520;
  const boxY = 260;

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


  // ==== 오른쪽: 타로 카드 이미지 자리 ====
  const cardW = 260;
  const cardH = 380;
  const cardX = width / 2 + 300;
  const cardY = 260;

  fill(40, 20, 80, 240);
  rect(cardX, cardY, cardW, cardH, 24);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("흐름 카드 이미지 자리", cardX + cardW / 2, cardY + cardH / 2);
  
  // 붉은 말 캐릭터
  if (horseImages[3]) {
    imageMode(CENTER);
    image(horseImages[3], width / 2 - 600, 535, 250, 250); 
  }
  
  // 붉은 말 대사
  textAlign(CENTER, TOP);
  textSize(18);
  text("붉은 말: \"이번엔, 현실적인 조언 카드를 뽑아볼까요?\"", width / 2, boxY + boxH + 10);

  // 버튼: 조언 카드 뽑기
  drawButton(width / 2 - btnWidth / 2, boxY + boxH + 40, btnWidth, btnHeight, "조언 카드 뽑기");
}

function handleFlowCardClick() {
  const boxW = 800;
  const boxH = 380;
  const boxX = width / 2 - 40;
  const boxY = 260;
  const btnX = width / 2 - btnWidth / 2;
  const btnY = boxY + boxH + 40;

  if (isInside(mouseX, mouseY, btnX, btnY, btnWidth, btnHeight)) {
    state = "adviceCard";   
  }
}

function drawAdviceCardScreen() {
  drawResultBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  // 제목 및 상단 주제/단어
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


  // ==== 왼쪽: 정책 카드 텍스트 자리 ====
  const boxW = 800;
  const boxH = 380;
  const boxX = width / 2 - 520; // 👈 X 좌표를 왼쪽으로 이동
  const boxY = 260;

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


  // ==== 오른쪽: 타로 카드 이미지 자리 ====
  const cardW = 260;
  const cardH = 380;
  const cardX = width / 2 + 300;
  const cardY = 260;

  fill(40, 20, 80, 240);
  rect(cardX, cardY, cardW, cardH, 24);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("조언 카드 이미지 자리", cardX + cardW / 2, cardY + cardH / 2);
  
  // 붉은 말 캐릭터
  if (horseImages[4]) {
    imageMode(CENTER);
    image(horseImages[4], width / 2 - 600, 535, 250, 250); 
  }
  
  // 붉은 말 대사
  textAlign(CENTER, TOP);
  textSize(18);
  text("붉은 말: \"지금까지 뽑은 것들, 한 번에 정리해서 볼까요?\"", width / 2, boxY + boxH + 10);

  // 버튼: 오늘 결과 한 번에 보기
  drawButton(width / 2 - btnWidth / 2, boxY + boxH + 40, btnWidth, btnHeight, "오늘 결과 한 번에 보기");
}

function handleAdviceCardClick() {
  const boxW = 800;
  const boxH = 380;
  const boxX = width / 2 - 40;
  const boxY = 260;
  const btnX = width / 2 - btnWidth / 2;
  const btnY = boxY + boxH + 40;

  if (isInside(mouseX, mouseY, btnX, btnY, btnWidth, btnHeight)) {
    state = "summary";
  }
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

  // "다시 점치기" 버튼
  const btnX = width / 2 - btnWidth / 2;
  const btnY = boxY + boxH + 40;
  drawButton(btnX, btnY, btnWidth, btnHeight, "퇴장하기");
}

function handleSummaryClick() {
  const boxW = 1100;
  const boxH = 160;
  const boxX = width / 2 - boxW / 2;
  let boxY = 160;
  const gap = 20;

  boxY += boxH + gap;
  boxY += boxH + gap;
  const btnX = width / 2 - btnWidth / 2;
  const btnY = boxY + boxH + 40;

  if (isInside(mouseX, mouseY, btnX, btnY, btnWidth, btnHeight)) {
    // ✅ 전체 상태 초기화 후 시작 화면으로
    selectedCategory = null;
    selectedTopic = null;
    selectedKeyWord = null;
    tarotAdvice = "";
    flowCard = null;
    policyCard = null;
    state = "start";
  }
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
function mousePressed() {
  if (state === "start") {
    handleStartClick();
  } else if (state === "question") {
    handleQuestionClick();
  } else if (state === "topics") {
    handleTopicsClick();
  } else if (state === "keywords") {
    handleKeywordsClick();
  } else if (state === "loading") {
    // 로딩 중에는 클릭 무시
  } else if (state === "gemini") {
    handleGeminiClick();
  } else if (state === "flowCard") {
    handleFlowCardClick();
  } else if (state === "adviceCard") {
    handleAdviceCardClick();
  } else if (state === "summary") {
    handleSummaryClick();
  }
}

function handleStartClick() {
  if (enterNormal) {
    const imgW = enterNormal.width;
    const imgH = enterNormal.height;
    const x = width / 2 - imgW / 2;
    const y = height / 2 + 260;

    if (isInside(mouseX, mouseY, x, y, imgW, imgH)) {
      state = "question";
    }
  } else {
    const x = width / 2 - btnWidth / 2;
    const y = height / 2 + 260;
    if (isInside(mouseX, mouseY, x, y, btnWidth, btnHeight)) {
      state = "question";
    }
  }
}

function handleQuestionClick() {
  const categories = ["건강", "금전", "연애", "진로"];
  for (let i = 0; i < categories.length; i++) {
    const col = i % 2;
    const row = floor(i / 2);
    const x = 750 + col * (btnWidth + 80);
    const y = 520 + row * (btnHeight + 30);
    if (isInside(mouseX, mouseY, x, y, btnWidth, btnHeight)) {
      selectedCategory = categories[i];
      selectedTopic = null;
      selectedKeyWord = null; // 초기화
      tarotAdvice = "";
      state = "topics";
    }
  }
}

function handleTopicsClick() {
  const topics = TOPICS_MAP[selectedCategory] || [];

  // 1) 주제 단어 카드 클릭 체크
  for (let i = 0; i < topics.length; i++) {
    const col = i % 2; // 열 (0, 1, 0, 1)
    const row = floor(i / 2); // 행 (0, 0, 1, 1)

    let x = CARD_START_X + col * CARD_CELL_W;
    let y = CARD_START_Y + row * CARD_CELL_H;
    let w = CARD_CELL_W - 40;
    let h = CARD_CELL_H - 40;

    if (isInside(mouseX, mouseY, x, y, w, h)) {
      selectedTopic = topics[i];
      return;
    }
  }

  // 2) "다음 단계로" 버튼 클릭
  const btnX = width / 2 - btnWidth / 2;
  const btnY = height - 140;
  if (isInside(mouseX, mouseY, btnX, btnY, btnWidth, btnHeight)) {
    if (!selectedTopic) {
      return;
    }
    selectedKeyWord = null; // 초기화
    state = "keywords";
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
      selectedKeyWord = keywords[i]; // (16개 중 선택) Gemini 프롬프트용
      actualImageKeyWord = KEYWORD_IMAGE_MAP[keywords[i]]; // (4개 중 하나) 이미지용
      return;
    }
  }

  // 2) "카드 생성하기" 버튼 클릭
  const btnX = width / 2 - btnWidth / 2;
  const btnY = height - 140;
  if (isInside(mouseX, mouseY, btnX, btnY, btnWidth, btnHeight)) {
    if (!selectedCategory || !selectedTopic || !selectedKeyWord) { // selectedKeyWord 체크
      return;
    }
    // Gemini 호출
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

  // Topic 이름을 키로 사용하여 데이터 접근
  const topicData = cardsData.topics[topic]; 
  if (!topicData) return;

  // 카드를 flowCard와 policyCard에 저장
  if (topicData.flow && topicData.flow.length > 0) {
    flowCard = topicData.flow[0];
  }

  if (topicData.advice && topicData.advice.length > 0) {
    policyCard = topicData.advice[0];
  }
}

// ========== Gemini 호출 로직 ==========
function callGeminiTarot(category, topic, keyWord) { //keyWord는 16개 중 선택된 단어
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
