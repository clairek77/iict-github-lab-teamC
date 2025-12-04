
// ===== 단어 15개 예시 =====
const WORDS = [
  "성공", "도전", "희망", "좌절", "노력",
  "변화", "기회", "불안", "성장", "관계",
  "인내", "행운", "위기", "선택", "균형"
];

// ===== 상태 관련 =====
// start -> question -> words -> loading -> result
let state = "start";

let selectedCategory = null;  // "건강" / "금전" / "연애" / "진로"
let selectedWord = null;      // WORDS 중 사용자가 클릭한 단어 1개

// 타로 결과 관련
let tarotAdvice = "";         // Gemini가 생성한 조언 텍스트

// ===== API 관련 =====
let receiving = false;

// 시스템 프롬프트 (타로가게 버전)
const SYSTEM_PROMPT = `
너는 "수상한 타로가게"의 타로 마스터야.
사용자가 고른 고민 카테고리(건강, 금전, 연애, 진로)와 키워드를 바탕으로,
미래를 단정하지 않고, 사용자가 스스로 선택할 여지를 남기는 조언을 해 줘.

- 한국어로 200~300자 정도 분량
- 겁주거나 공포를 조장하지 말 것
- 너무 뻔한 일반론이 아니라, 사용자가 선택한 키워드를 적어도 한 번은 자연스럽게 등장시킬 것
- 말투는 친절하고 약간 수상한 점집 느낌으로
`;

// ===== 카드/버튼 레이아웃 상수 =====
const btnWidth = 200;
const btnHeight = 50;

// 단어 카드 그리드 (words 화면)
const WORD_COLS = 5;
const WORD_START_X = 260;
const WORD_START_Y = 260;
const WORD_CELL_W = 260;
const WORD_CELL_H = 120;

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

// ===== preload: 이미지/데이터 로드 =====
function preload() {
  // cardsData = loadJSON("cards.json"); // 나중에 쓸 거면 다시 활성화

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

  cardsData = loadJSON("cards.json");
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
  } else if (state === "words") {
    drawWordsScreen();
  } else if (state === "loading") {
    drawLoadingScreen();
  } else if (state === "gemini") {
    drawGeminiScreen();       // 1단계: Gemini 조언
  } else if (state === "adviceCard") {
    drawAdviceCardScreen();   // 2단계: 정책(조언) 카드
  } else if (state === "flowCard") {
    drawFlowCardScreen();     // 3단계: 흐름 카드
  } else if (state === "summary") {
    drawSummaryScreen();      // 마지막: 세 개 요약
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
  text("하나만 골라주시면, 그 주제에 맞는 한 단어로 오늘의 기운을 뽑아볼게요.", 650, 430);

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

// ========== WORDS SCREEN ==========
function drawWordsScreen() {
  drawShopBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, TOP);
  textSize(32);
  text(`${selectedCategory}에 관한 당신의 주변 기운들`, width / 2, 80);

  textSize(18);
  text("지금 마음이 끌리는 단어 하나를 골라주세요.", width / 2, 130);

  // 단어 15개 그리기 (3 x 5 그리드)
  textSize(22);

  for (let i = 0; i < WORDS.length; i++) {
    let col = i % WORD_COLS;
    let row = floor(i / WORD_COLS);
    let x = WORD_START_X + col * WORD_CELL_W;
    let y = WORD_START_Y + row * WORD_CELL_H;

    // 선택된 단어는 색을 다르게
    if (selectedWord === WORDS[i]) {
      fill(140, 110, 220, 240);
    } else {
      fill(40, 30, 70, 220);
    }
    rect(x, y, WORD_CELL_W - 40, WORD_CELL_H - 40, 16);

    fill(255);
    textAlign(CENTER, CENTER);
    text(WORDS[i], x + (WORD_CELL_W - 40) / 2, y + (WORD_CELL_H - 40) / 2);
  }

  // 선택된 단어 표시
  fill(255);
  textAlign(CENTER, TOP);
  textSize(20);
  if (selectedWord) {
    text(
      `지금 선택된 단어: "${selectedWord}"`,
      width / 2,
      height - 220
    );
  } else {
    text("카드를 눌러, 오늘 가장 마음이 가는 단어 하나를 골라주세요.", width / 2, height - 220);
  }

  // 카드 생성하기 버튼
  drawButton(width / 2 - btnWidth / 2, height - 140, btnWidth, btnHeight, "카드 생성하기");
}

// ========== LOADING SCREEN ==========
function drawLoadingScreen() {
  drawResultBackground();
  fill(0, 0, 0, 160);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  text("타로 마스터가 당신의 단어를 해석하는 중입니다...", width / 2, height / 2 - 40);

  textSize(20);
  text(
    selectedCategory && selectedWord
      ? `주제: ${selectedCategory} / 단어: "${selectedWord}"`
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

function drawGeminiScreen() {
  drawResultBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  // 제목
  fill(255);
  textAlign(CENTER, TOP);
  textSize(32);
  text("붉은 말 타로 마스터의 첫 조언", width / 2, 80);

  // 상단 주제/단어
  textSize(20);
  text(
    selectedCategory && selectedWord
      ? `고민 주제: ${selectedCategory} / 선택한 단어: "${selectedWord}"`
      : "",
    width / 2,
    140
  );

  // 👉 붉은 말 캐릭터
  if (horseImages[2]) {
    imageMode(CENTER);
    image(horseImages[2], width / 2 - 520, 190, 220, 220);
  }

  // 왼쪽: 타로 카드 자리
  const cardW = 260;
  const cardH = 380;
  const cardX = width / 2 - 520;
  const cardY = 260;

  fill(40, 20, 80, 240);
  rect(cardX, cardY, cardW, cardH, 24);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("타로 카드 이미지 자리", cardX + cardW / 2, cardY + cardH / 2);

  // 오른쪽: Gemini 조언 텍스트
  const boxW = 800;
  const boxH = 380;
  const boxX = width / 2 - 40;
  const boxY = 260;

  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 20);

  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);
  const adviceText = tarotAdvice || "조언을 불러오는 중 문제가 발생했습니다.";
  text(adviceText, boxX + 32, boxY + 32, boxW - 64, boxH - 64);

  // 붉은 말 대사
  textAlign(CENTER, TOP);
  textSize(18);
  text("붉은 말: \"이제, 당신을 둘러싼 흐름 카드를 한번 뽑아볼까요?\"", width / 2, boxY + boxH + 10);

  // ⬇⬇ 버튼 텍스트 변경: '흐름 카드 뽑기'
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

  fill(255);
  textAlign(CENTER, TOP);
  textSize(32);
  text("요즘, 당신을 둘러싼 흐름 카드", width / 2, 80);

  textSize(20);
  text(
    selectedCategory
      ? `고민 주제: ${selectedCategory}`
      : "",
    width / 2,
    140
  );

  // 👉 붉은 말 캐릭터
  if (horseImages[3]) {
    imageMode(CENTER);
    image(horseImages[3], width / 2 - 520, 190, 220, 220);
  }

  // 왼쪽: 타로 카드 자리
  const cardW = 260;
  const cardH = 380;
  const cardX = width / 2 - 520;
  const cardY = 260;

  fill(40, 20, 80, 240);
  rect(cardX, cardY, cardW, cardH, 24);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("흐름 카드 이미지 자리", cardX + cardW / 2, cardY + cardH / 2);

  // 오른쪽: 흐름 카드 텍스트
  const boxW = 800;
  const boxH = 380;
  const boxX = width / 2 - 40;
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

  fill(255);
  textAlign(CENTER, TOP);
  textSize(32);
  text("당신을 위한 현실적인 조언 카드", width / 2, 80);

  textSize(20);
  text(
    selectedCategory
      ? `고민 주제: ${selectedCategory}`
      : "",
    width / 2,
    140
  );

  // 👉 붉은 말 캐릭터
  if (horseImages[4]) {
    imageMode(CENTER);
    image(horseImages[4], width / 2 - 520, 190, 220, 220);
  }

  // 왼쪽: 타로 카드 자리
  const cardW = 260;
  const cardH = 380;
  const cardX = width / 2 - 520;
  const cardY = 260;

  fill(40, 20, 80, 240);
  rect(cardX, cardY, cardW, cardH, 24);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  text("조언 카드 이미지 자리", cardX + cardW / 2, cardY + cardH / 2);

  // 오른쪽: 정책 카드 텍스트
  const boxW = 800;
  const boxH = 380;
  const boxX = width / 2 - 40;
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

// ========== RESULT SCREEN ==========
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
    selectedCategory && selectedWord
      ? `고민 주제: ${selectedCategory} / 선택한 단어: "${selectedWord}"`
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
    selectedWord = null;
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
  } else if (state === "words") {
    handleWordsClick();
  } else if (state === "loading") {
    // 로딩 중에는 클릭 무시
  } else if (state === "gemini") {
    handleGeminiClick();
  } else if (state === "adviceCard") {
    handleAdviceCardClick();
  } else if (state === "flowCard") {
    handleFlowCardClick();
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
      selectedWord = null;
      tarotAdvice = "";
      state = "words";
    }
  }
}

function handleWordsClick() {
  // 1) 단어 카드 클릭 체크
  for (let i = 0; i < WORDS.length; i++) {
    let col = i % WORD_COLS;
    let row = floor(i / WORD_COLS);
    let x = WORD_START_X + col * WORD_CELL_W;
    let y = WORD_START_Y + row * WORD_CELL_H;
    let w = WORD_CELL_W - 40;
    let h = WORD_CELL_H - 40;

    if (isInside(mouseX, mouseY, x, y, w, h)) {
      selectedWord = WORDS[i];
      return; // 단어만 바꾸고 끝
    }
  }

  // 2) "이 단어로 조언 받기" 버튼 클릭
  const btnX = width / 2 - btnWidth / 2;
  const btnY = height - 140;
  if (isInside(mouseX, mouseY, btnX, btnY, btnWidth, btnHeight)) {
    if (!selectedCategory || !selectedWord) {
      // 아직 선택 안 했으면 아무 것도 안 함 (원하면 경고 텍스트 추가해도 됨)
      return;
    }
    // Gemini 호출
    state = "loading";
    tarotAdvice = "";
    callGeminiTarot(selectedCategory, selectedWord);
  }
}

function handleResultClick() {
  // "다시 점치기" 버튼
  const x = width / 2 - btnWidth / 2;
  const y = 200 + 400 + 60; // boxY + boxH + 60 과 동일
  if (isInside(mouseX, mouseY, x, y, btnWidth, btnHeight)) {
    selectedWord = null;
    tarotAdvice = "";
    state = "question";
  }
}

// ========== 유틸 ==========
function isInside(mx, my, x, y, w, h) {
  return mx > x && mx < x + w && my > y && my < y + h;
}

function pickCardsFor(category) {
  flowCard = null;
  policyCard = null;

  if (!cardsData || !cardsData.categories) return;

  const catData = cardsData.categories[category];
  if (!catData) return;

  // 카테고리마다 첫 번째 카드 하나씩만 사용
  if (catData.flow && catData.flow.length > 0) {
    flowCard = catData.flow[0];
  }

  if (catData.advice && catData.advice.length > 0) {
    policyCard = catData.advice[0];
  }
}

function callGeminiTarot(category, word) {
    console.error("API_KEY를 설정해주세요!");
    tarotAdvice = "API 키가 설정되지 않았습니다. 스케치를 수정해 주세요.";
    state = "result";
    return;
  }

  receiving = true;

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

  const userText = `
사용자의 고민 주제는 "${category}"이고,
선택한 키워드는 "${word}"입니다.

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
      pickCardsFor(selectedCategory);
      state = "gemini";
    })
    .catch(err => {
      console.error("Gemini 호출 오류:", err);
      receiving = false;
      tarotAdvice =
        "타로 마스터가 잠시 휴식 중입니다.\n잠시 후 다시 시도해 주세요.";
      state = "result";
    });
}
