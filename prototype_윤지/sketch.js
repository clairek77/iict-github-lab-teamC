// ===== 새로운 화면 텍스트 정의 =====
const FLOW_TEXTS = {
  intro_1: {
    text: `
환영합니다. 저는 이 가게의 타로마스터입니다.
가만히 보니 한창 고민이 많은 청년 시기를 보내고 있군요.
`
  },
  intro_2: {
    text: `
2026년 다가오는 붉은 말의 해, 
내년의 당신은 어떤 모습일지 궁금하다면...
이곳에서 잠깐 머물다 가시죠.
`
  },
  intro_3: {
    text: `
여기는 그저 흔한 타로 가게는 아니에요.
이곳에서 만나게 될 타로 카드는 조금 특별하거든요.
`
  },
  tutorial_0: {
    text: `
    당신은 앞으로 3장의 카드를 뽑게 됩니다.
    `
  },
  tutorial_1: {
    text: `
첫 번째는, 당신의 고민을 들어본 뒤에
내년의 기운을 강하게 나타내는 하나의 단어를 찾아
'세상에 오직 하나뿐인' 타로 카드를 만들어 드릴거예요.
`
  },
  tutorial_2: {
    text: `
두 번째 카드로 당신의 고민과 맞닿아 있는 '세상의 흐름'을 읽어볼 거예요.
이러한 흐름을 미리 알고 있으면 미래를 대비하는 데에도 도움이 되죠...

(HINT: 여기 사람들은 "기사"라는 텍스트를 통해 세상의 흐름을 읽는다죠?)
`
  },
  tutorial_3: {
    text: `
마지막 카드로는 당신의 고민과 세상의 흐름을 엮어
실질적인 조언을 얻을 수 있는 곳이 어디인지 알려드릴게요.
`
  },
  tutorial_fin: {
    text: `
그럼 붉은 말의 해를 미리 엿볼 준비가 되셨나요?
아래 버튼을 눌러 지금 확인해볼 수 있어요!
`
  },
};

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

//수정구슬
let rubProgress = 0;
let isKeywordSelected = false;

//카드 뒤집기
let isCardFlipped = false;

// 타로 결과 관련
let tarotAdvice = "";          // Gemini가 생성한 조언 텍스트

// ===== API 관련 =====
const API_KEY = "###";
let receiving = false;

// 시스템 프롬프트 (타로가게 버전)
const SYSTEM_PROMPT = `
너는 "수상한 타로가게"의 타로 마스터야.
사용자가 고른 고민 카테고리(건강, 금전, 연애, 진로), 구체적인 주제, 그리고 키워드를 바탕으로,
미래를 단정하지 않고, 사용자가 스스로 선택할 여지를 남기는 조언을 해 줘.

- 카테고리와 주제, 키워드를 종합하여 타로카드 형식으로 조언에 맞는 아르카나 이름을 지을 것 "OO하는 XX"으로 
- XX= '기회'는 탐험가, '행운'은 수호자, '불안'은 위로자, '변화'는 항해자
- 출력양식: 'OO하는 XX'을 가장 처음 줄에 출력. 한 줄 띄고 '2026년 당신을 나타내는 카드는 OO하는 XX입니다.'로 조언을 시작할 것.
- 한국어로 250자 정도 분량. 절대 넘어서는 안됨.
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
  //붉은 말 액자
  horseFrame = loadImage("horse_frame.png")

  // 카드 뒷면, 조언 카드, 흐름 카드 
  back_card = loadImage("back_card.png");
  flow_card = loadImage("flow_card.png");
  advice_card = loadImage("advice_card.png");

  // 새로운 말 그림 (horse_re1) 추가
  horse_re1 = loadImage("horse_re1.png");
  horse_re2 = loadImage("horse_re2.png");
  
  // 수정구슬 이미지
  crystalball_transparent = loadImage("crystalball_transparent.png")
  crystalball = loadImage("crystalball.png")

  // 배경 이미지 2종
  tarotBg1 = loadImage("tarotback1.png");
  tarotBg2 = loadImage("tarotback2.png");

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
  createcard = loadImage("button_createcard.png");     
  createcardHover = loadImage("button_createcard_hover.png");

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
  generateCard1 = loadImage("button_generate_card1.png"); // 버튼 이미지 파일 이름은 확인 필요
  generateCard1Hover = loadImage("button_generate_card1_hover.png"); // 버튼 이미지 파일 이름은 확인 필요
  generateCard2 = loadImage("button_generate_card2.png"); // 버튼 이미지 파일 이름은 확인 필요
  generateCard2Hover = loadImage("button_generate_card2_hover.png"); // 버튼 이미지 파일 이름은 확인 필요
  generateCard3 = loadImage("button_generate_card3.png"); // 버튼 이미지 파일 이름은 확인 필요
  generateCard3Hover = loadImage("button_generate_card3_hover.png"); // 버튼 이미지 파일 이름은 확인 필요

  // 결과 한번에 보기
  result = loadImage("button_result.png");
  resultHover = loadImage("button_result_hover.png");

  // bgm
  bgMusic = loadSound("tarot_bgm.mp3");
  clickSound = loadSound("click.mp3");
  magicChargeSound = loadSound("magic_charge.mp3"); 
  magicRevealSound = loadSound("magic_reveal.mp3");

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
  } else if (state === "pre_keywords"){
    drawPre_keywordsScreen();
  } else if (state === "keywords") {
    drawKeywordsScreen();
  } else if (state === "loading") {
    drawLoadingScreen();
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
  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 30);

  // 텍스트
  fill(255);
  textAlign(CENTER, CENTER); // 텍스트를 박스 중앙에 배치
  textSize(24);
  textLeading(35);
  text(txtObj.text, boxX + boxW / 2, boxY + boxH / 2);

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

    fill(30, 25, 60, 230);
    rect(boxX, boxY, boxW, boxH, 30);

    // 7. 텍스트
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    textLeading(35);
    text(txtObj.text, boxX + boxW / 2, boxY + boxH / 2);

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
  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 30);

// 텍스트 (FLOW_TEXTS 사용)
  fill(255);
  textAlign(CENTER, CENTER);

  // 텍스트 표시
  textSize(24);
  text(FLOW_TEXTS.tutorial_fin.text, boxX + boxW / 2, boxY + boxH / 2);
  
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
    const btnY = boxY + boxH - 20; 

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
  const boxW = 1100;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 680;

  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 30);

  // 말 얼굴
  const horseW = 140;
  const aspectRatio = horse_re2.width / horse_re2.height;
  const horseH = horseW / aspectRatio; // 너비를 기준으로 높이 계산
  const horseX = boxX + + 40;  
  const horseY = boxY + boxH / 2 - horseH /2;

  drawFramedHorse(horse_re2, horseX, horseY, horseW, horseH)


  // 텍스트
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  textLeading(35);
  if (selectedCategory) {
    text(`
      음… ${selectedCategory}이(가) 궁금하시군요.
      오른쪽 화살표를 눌러 따라오시죠.`,
      width/2 + 80,
      boxY + boxH / 2 - 20);
  } else {
    text(`먼저, 다가오는 2026년에 가장 궁금한 고민거리를 골라주세요.`, 
        width/2 + 80, 
        boxY + boxH / 2 - 20);
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
  const boxW = 1100;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;

  const boxY = 680;

  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 30);

  // 말 얼굴
  const horseW = 140;
  const aspectRatio = horse_re2.width / horse_re2.height;
  const horseH = horseW / aspectRatio; // 너비를 기준으로 높이 계산
  const horseX = boxX + + 40;  
  const horseY = boxY + boxH / 2 - horseH /2;

  drawFramedHorse(horse_re2, horseX, horseY, horseW, horseH)

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  textLeading(35);

  if (selectedTopic) {
    text(`
      좋아요! 고민을 들어봤으니 이제 당신에게서 느껴지는 기운을 살펴볼게요.
      오른쪽 화살표를 눌러 계속해주세요.`,
      width/2 + 80,
      boxY + boxH / 2 - 20);
  } else {
    text(`
      당신의 고민에 대해 조금 더 자세히 말씀해주세요…
      구체적으로 무엇이 궁금하나요?`, 
      width/2 + 80, 
      boxY + boxH / 2 - 20);
  }

  // ================================
  // 🔶 3) 이전/다음 버튼
  // ================================
  const baseY = boxY + boxH / 2 - before.width / 2;
  drawPrevNextButtons("question", selectedTopic ? "pre_keywords" : null, baseY);
}

// ========== Pre_keywords Screen ==========
function drawPre_keywordsScreen(){
  drawResultBackground();

  fill(0, 0, 0, 160);
  rect(0, 0, width, height);

  // ================================
  // 🔶 말 + 설명 박스
  // ================================
  const boxW = 1100;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;

  const boxY = 680;

  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 30);

  const horseW = 140;
  const aspectRatio = horse_re2.width / horse_re2.height;
  const horseH = horseW / aspectRatio; // 너비를 기준으로 높이 계산
  const horseX = boxX + + 40;  
  const horseY = boxY + boxH / 2 - horseH /2;

  drawFramedHorse(horse_re2, horseX, horseY, horseW, horseH)

  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  textLeading(35);

  text(`
    이 수정구슬을 문지르면 그 속에 단어 하나가 비칠 거예요. 
    수정구슬을 문지르려면 오른쪽 버튼을 누르세요.`,
    width/2 + 80,
    boxY + boxH / 2 - 20);

  //================================
  // 수정 구슬 이미지
  //================================

  if (crystalball_transparent) {
    const crystalballSize = 550;

  // 1. 비율 유지 계산
    const aspectRatio = crystalball_transparent.width / crystalball_transparent.height;
    let drawH = crystalballSize;
    let drawW = crystalballSize * aspectRatio;

    const crystalballX = width / 2 - drawW / 2;
    const crystalballY =  boxY - drawH;
    
    imageMode(CORNER);
    image(crystalball_transparent, crystalballX, crystalballY, drawW, drawH);
  }

  // ================================
  // 🔶 이전/다음 버튼
  // ================================
  const baseY = boxY + boxH / 2 - before.width / 2;
  drawPrevNextButtons("topics", selectedTopic ? "keywords" : null, baseY);
}

// ========== KEYWORDS SCREEN ==========
function drawKeywordsScreen() {
  drawResultBackground();

  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  if (typeof rubProgress === 'undefined' || isNaN(rubProgress)) rubProgress = 0;
  if (typeof isKeywordSelected === 'undefined') isKeywordSelected = false;

  // ================================
  // 🔶 말 + 설명 박스
  // ================================
  const boxW = 1100;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 680;

  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 30);

  // 말 이미지
  const horseW = 140;
  if (horse_re2) {
    let hW = (horse_re2.width > 0) ? horse_re2.width : 1;
    let hH = (horse_re2.height > 0) ? horse_re2.height : 1;
    const aspectRatio = hW / hH;
    const horseH = horseW / aspectRatio; 
    const horseX = boxX + 40;  
    const horseY = boxY + boxH / 2 - horseH / 2;
    drawFramedHorse(horse_re2, horseX, horseY, horseW, horseH);
  }

  // 텍스트 출력
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  textLeading(35);

  if (!isKeywordSelected) {
    text(`
      [ 스페이스 바 ]를 꾹 눌러 타로 마스터를 불러주세요.
      구슬 속에서 당신의 운명을 결정할 단어가 나타납니다.
      (게이지가 가득 차면 자동으로 선택됩니다)`,
      width / 2 + 80,
      boxY + boxH / 2 - 20
    );
  } else {
    text(`
      수정구슬의 안개가 걷히고 운명의 단어가 드러났습니다.
      키워드 "${selectedKeyWord}"(으)로
      당신만의 타로 카드를 생성하시겠습니까?`,
      width / 2 + 80,
      boxY + boxH / 2 - 20
    );
  }

  // ================================
  // 수정 구슬
  const crystalballSize = 550;
  let drawW = crystalballSize; 
  let drawH = crystalballSize;
  let crystalballX = width / 2 - drawW / 2;
  let crystalballY = boxY - drawH;

  if (crystalball_transparent && crystalball_transparent.width > 0) {
    const aspectRatio = crystalball_transparent.width / crystalball_transparent.height;
    drawW = crystalballSize * aspectRatio;
    crystalballX = width / 2 - drawW / 2;
    
    imageMode(CORNER);
    
    let shakeX = 0;
    if (!isKeywordSelected && keyIsDown(32)) shakeX = random(-3, 3); 
    image(crystalball_transparent, crystalballX + shakeX, crystalballY, drawW, drawH);
  } else {
    fill(255, 255, 255, 50);
    ellipse(width/2, crystalballY + drawH/2, drawW, drawH);
  }

  // 게이지

  if (!isKeywordSelected) {
    if (keyIsDown(32)) { 
      rubProgress += 0.6; // 게이지 속도

      if (magicChargeSound && magicChargeSound.isLoaded()) {
          // 이미 재생 중이 아닐 때만 재생 (소리 중첩 방지)
          if (!magicChargeSound.isPlaying()) {
              magicChargeSound.loop(); // 누르고 있는 동안 계속 나게 loo
          }
      }
      
      // 키워드 떠다니는 애니메이션
      if (typeof DUMMY_KEYWORDS_LIST !== 'undefined') {
          textAlign(CENTER, CENTER);
          textStyle(BOLD);
          
          const centerX = width / 2;
          const centerY = height / 2 - 100;

          for (let i = 0; i < DUMMY_KEYWORDS_LIST.length; i++) {
              let radius = 250 + (i * 35); 
            
              let angleOffset = (TWO_PI / DUMMY_KEYWORDS_LIST.length) * i;
              let time = frameCount * 0.003 * (1 + (i % 2) * 0.5); 
              let currentAngle = angleOffset + time;
              let wx = centerX + cos(currentAngle) * radius;
              let wy = centerY + sin(currentAngle) * radius;

              textSize(24 + (i % 3) * 5); 
              fill(255, 255, 200, 180 + sin(frameCount * 0.1 + i) * 50); 
              text(DUMMY_KEYWORDS_LIST[i], wx, wy);
          }
          textStyle(NORMAL);
      }

    } else {
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
      rubProgress = 100;

      if (magicChargeSound && magicChargeSound.isPlaying()) 
        magicChargeSound.stop();
      if (magicRevealSound && magicRevealSound.isLoaded()) 
        magicRevealSound.setVolume(1.0);
        magicRevealSound.play();

      const r = floor(random(DUMMY_KEYWORDS_LIST.length));
      selectedKeyWord = DUMMY_KEYWORDS_LIST[r];
      actualImageKeyWord = KEYWORD_IMAGE_MAP[selectedKeyWord];
      isKeywordSelected = true; 
    }

  } else {
    // 결과 단어
    push();
    stroke(0)
    strokeWeight(3)
    fill(200, 120, 255);
    textSize(80);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    
    if (typeof drawingContext !== 'undefined') {
        drawingContext.shadowBlur = 30;
        drawingContext.shadowColor = 'rgba(105, 0, 110, 0.9)';
    }
    text(selectedKeyWord, width/2, crystalballY + drawH/2 - 60);
    
    if (typeof drawingContext !== 'undefined') 
      drawingContext.shadowBlur = 0;
    pop();
    textStyle(NORMAL);

    // 카드 생성 버튼
    let btnW, btnH, btnX, btnY;
    
    if (createcard && createcard.width > 1) {
       // 이미지 버튼 사용
       btnW = createcard.width;
       btnH = createcard.height;
       btnX = width / 2 - btnW / 2;
       btnY = height - 200; 

       drawImageButton(createcard, createcardHover, btnX, btnY, () => {
           state = "loading"; 
           tarotAdvice = "";
           callGeminiTarot(selectedCategory, selectedTopic, selectedKeyWord);
       });

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

// ========== GEMINI SCREEN ==========
// ========== GEMINI SCREEN (카드 뒤집기 기능 적용) ==========
function drawGeminiScreen() {
  drawResultBackground();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);
  
  drawStageTitle(title1);

  const contentStartY = 400;

  // ===== 왼쪽 카드 영역 =====
  const cardW = 260;
  const cardH = 380;
  const cardX = width / 2 - 580;
  const cardY = contentStartY;

  noStroke();
  fill(0, 0, 0, 80);
  rect(cardX + 10, cardY + 10, cardW, cardH);

  imageMode(CORNER);

  if (!isCardFlipped) {
    if (back_card) {
        image(back_card, cardX, cardY, cardW, cardH);
    } else {
        fill(50, 30, 80);
        rect(cardX, cardY, cardW, cardH);
    }

    textAlign(CENTER, BOTTOM);
    textSize(20);

    let alpha = map(sin(frameCount * 0.1), -1, 1, 100, 255);
    fill(255, 255, 255, alpha);
    text("카드를 눌러 운명을 확인하세요!", cardX + cardW / 2, cardY - 20);

  } else {
    
    // (1) 배경 (Category)
    if (cardImages[selectedCategory]) {
        image(cardImages[selectedCategory], cardX, cardY, cardW, cardH);
    }
    
    // (2) 캐릭터 (Keyword)
    if (cardImages[actualImageKeyWord]) {
        image(cardImages[actualImageKeyWord], cardX, cardY, cardW, cardH);
    }
    
    // (3) 아이템 (Topic)
    if (cardImages[selectedTopic]) {
        image(cardImages[selectedTopic], cardX, cardY, cardW, cardH);
    }

    // 앞면일 때 고정된 안내 문구
    fill(255);
    textAlign(CENTER, BOTTOM);
    textSize(20);
    text("당신만을 위한 2026년의 카드", cardX + cardW / 2, cardY - 20);
  }

  // ===== 오른쪽 텍스트 박스 =====
  const boxW = 900;
  const boxH = 380;
  const boxX = cardX + cardW + 30;
  const boxY = contentStartY;
  
  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 20);

  // 🔹 말 이미지: 텍스트 박스 안 오른쪽
  const horseW = 120;
  if (horse_re2) {
      const aspectRatio = horse_re2.width / horse_re2.height;
      const horseH = horseW / aspectRatio; 
      const horseX = boxX + boxW - horseW - 30;  
      const horseY = boxY + boxH - horseH - 30;
      drawFramedHorse(horse_re2, horseX, horseY, horseW, horseH);
  }

  // 텍스트 내용
  const textX = boxX + 30;
  const textY = boxY + 30;
  const textW = boxW - horseW - 90;
  const textH = boxH - 60;

  fill(255);
  textAlign(LEFT, TOP);
  textSize(20);
  
  if (isCardFlipped) {
      text(tarotAdvice, textX, textY, textW, textH);
  } else {
      textAlign(CENTER, CENTER);
      text("카드를 뒤집으면 조언이 나타납니다.", boxX + boxW/2 - 50, boxY + boxH/2);
  }

  // ===== QR 버튼 =====
  if (isCardFlipped) {
      const qrW = qr.width * 0.9;
      const qrH = qr.height * 0.9;
      const qrBtnX = width / 2 - qrW / 2;
      const qrBtnY = cardY + cardH + 40;

      drawImageButtonScaled(
        qr,
        qrHover,
        qrBtnX,
        qrBtnY,
        qrW,
        qrH,
        () => {
          const QRPage = "https://iamsaeun.github.io/tarot/qr_result.html";
          const url = QRPage +
          "?bg=" + encodeURIComponent(BACKGROUND_MAP[selectedCategory]) +
          "&char=" + encodeURIComponent(CHARACTER_MAP[actualImageKeyWord]) +
          "&item=" + encodeURIComponent(ITEM_MAP[selectedTopic]) +
          "&advice=" + encodeURIComponent(tarotAdvice);

          return `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=300`;
        }
      );
  }

  // 🔹 이전 / 다음 버튼 추가
  drawPrevNextButtons("keywords", "pre_flowCard", 795 - before.width / 2);
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
  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 30);

  // 텍스트 (FLOW_TEXTS 사용)
  fill(255);
  textAlign(CENTER, CENTER);

  // 텍스트 표시
  textSize(24);
  text(
  `첫 번째 카드로 당신만을 위한 타로 카드를 뽑아봤으니,
  이제 두 번째 “흐름의 카드”도 함께 볼까요?`,
  boxX + boxW / 2, boxY + boxH / 2
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
    const btnY = boxY + boxH - 20; 

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
  const contentStartY = 400;

  // ===== 왼쪽 카드 =====
  const cardW = 260;
  const cardH = 380;
  const cardX = width / 2 - 580;
  const cardY = contentStartY;

  image(flow_card, cardX, cardY, cardW, cardH);

  // === 카드 상단 텍스트 ===
  const cardTitleY = cardY - 30; // 카드 상단에서 40px 위
    
  fill(255);
  textAlign(CENTER, BOTTOM); // 중앙 정렬, 하단 맞춤
  textSize(20);
  text(`버튼을 클릭하여
    원문 기사를 확인해 보세요!`, cardX + cardW / 2, cardTitleY);


  // ===== 오른쪽 텍스트 박스 =====
  const boxW = 900;
  const boxH = 380;
  const boxX = cardX + cardW + 30;
  const boxY = contentStartY;
  
  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 20);

  // 🔹 말 이미지: 텍스트 박스 안 오른쪽
  const horseW = 120;
  const aspectRatio = horse_re2.width / horse_re2.height;
  const horseH = horseW / aspectRatio; // 너비를 기준으로 높이 계산
  const horseX = boxX + boxW - horseW - 30;  
  const horseY = boxY + boxH - horseH - 30;

  drawFramedHorse(horse_re2, horseX, horseY, horseW, horseH)

  // 텍스트
  const textX = boxX + 30
  const textY = boxY + 30
  const textW = boxW - horseW - 90
  const textH = boxH - 60

  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);

  if (flowCard) {
    textSize(24);
    textStyle(BOLD);
    textAlign(LEFT, TOP);
    text(`흐름의 카드`, textX, textY);
    fill(255);
    textAlign(LEFT, TOP);
    textSize(20);
    textStyle(NORMAL);
    text(flowCard.summary, textX, textY + 50, textW, textH - 50);
  } else {
    text("이 카테고리에 등록된 흐름 카드가 없습니다.", textX, textY);
  }

  // ===== 기사 링크 버튼 =====
  const linkW = link.width * 0.9;
  const linkH = link.height * 0.9;
  const linkBtnX = width / 2 - linkW / 2;
  const linkBtnY = cardY + cardH + 40;

  drawImageButtonScaled(
    link,
    linkHover,
    linkBtnX,
    linkBtnY,
    linkW,
    linkH,
    () => {
      if (flowCard?.link) window.open(flowCard.link, "_blank");
    }
  );

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
  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 30);

  // 텍스트 (FLOW_TEXTS 사용)
  fill(255);
  textAlign(CENTER, CENTER);

  // 텍스트 표시
  textSize(24);
  text(
  `두 번째 카드는 어떠셨나요? 이러한 흐름과 연결하여
세 번째 카드로 유용한 조언을 찾아드릴 수 있습니다만…`,
  boxX + boxW / 2, boxY + boxH / 2
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
    const btnY = boxY + boxH - 20; 

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
  const contentStartY = 400;

  // ===== 왼쪽 카드 =====
  const cardW = 260;
  const cardH = 380;
  const cardX = width / 2 - 580;
  const cardY = contentStartY;

  image(advice_card, cardX, cardY, cardW, cardH);

  // === 카드 상단 텍스트 ===
  const cardTitleY = cardY - 30; // 카드 상단에서 40px 위
    
  fill(255);
  textAlign(CENTER, BOTTOM); // 중앙 정렬, 하단 맞춤
  textSize(20);
  text(`버튼을 클릭하여
    청년 지원 정보를 확인해 보세요!`, cardX + cardW / 2, cardTitleY);



  // ===== 오른쪽 텍스트 박스 =====
  const boxW = 900;
  const boxH = 380;
  const boxX = cardX + cardW + 30;
  const boxY = contentStartY;
  
  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 20);

  // 🔹 말 이미지: 텍스트 박스 안 오른쪽
  const horseW = 120;
  const aspectRatio = horse_re2.width / horse_re2.height;
  const horseH = horseW / aspectRatio; // 너비를 기준으로 높이 계산
  const horseX = boxX + boxW - horseW - 30;  
  const horseY = boxY + boxH - horseH - 30;

  drawFramedHorse(horse_re2, horseX, horseY, horseW, horseH)

  // 텍스트
  const textX = boxX + 30
  const textY = boxY + 30
  const textW = boxW - horseW - 90
  const textH = boxH - 60

  fill(255);
  textAlign(LEFT, TOP);
  textSize(18);


  if (policyCard) {
    textSize(24);
    textStyle(BOLD);
    textAlign(LEFT, TOP);
    text(`조언의 카드`, textX, textY);
    fill(255);
    textAlign(LEFT, TOP);
    textSize(20);
    textStyle(NORMAL);
    text(policyCard.policy, textX, textY + 50, textW, textH - 50);
  } else {
    text("이 카테고리에 등록된 조언 카드가 없습니다.", textX, textY);
  }

  // ===== 링크 버튼 =====
  const advicelinkW = advicelink.width * 0.9;
  const advicelinkH = advicelink.height * 0.9;
  const advicelinkBtnX = width / 2 - advicelinkW / 2;
  const advicelinkBtnY = cardY + cardH + 40;

  drawImageButtonScaled(
    advicelink,
    advicelinkHover,
    advicelinkBtnX,
    advicelinkBtnY,
    advicelinkW,
    advicelinkH,
    () => {
      if (policyCard?.link) window.open(policyCard.link, "_blank");
    }
  );

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
  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 30);

  // 텍스트 (FLOW_TEXTS 사용)
  fill(255);
  textAlign(CENTER, CENTER);

  // 텍스트 표시
  textSize(24);
  text(
  `이렇게 당신의 세 카드를 모두 살펴봤어요!
  결과를 한눈에 만나볼 수 있게 정리해 드릴게요.`,
  boxX + boxW / 2, boxY + boxH / 2
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
    const btnY = boxY + boxH - 20; 

    drawImageButton(result, resultHover, btnX, btnY, () => {
     state = "summary"; // 다음 단계는 summary로
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
  const boxW = 1100;
  const boxH = 230;
  const boxX = width / 2 - boxW / 2;
  const boxY = 680;

  fill(30, 25, 60, 230);
  rect(boxX, boxY, boxW, boxH, 30);

  // 말 얼굴
  const horseW = 140;
  const aspectRatio = horse_re2.width / horse_re2.height;
  const horseH = horseW / aspectRatio; // 너비를 기준으로 높이 계산
  const horseX = boxX + + 40;  
  const horseY = boxY + boxH / 2 - horseH /2;

  drawFramedHorse(horse_re2, horseX, horseY, horseW, horseH)


  // 텍스트
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  textLeading(35);
  text(`
    부디 고민 많은 청년 여러분께
    수상한 타로 가게의 카드들이 도움이 되었기를 바랍니다. 
    당신의 2026년을 붉은 말이 계속해서 응원할게요!`,
    width/2 + 80,
    boxY + boxH / 2 - 20);


   const boxColor = color(30, 25, 60, 230);

  // =============================
  // 🔶 2) 상단 요약 박스 3개
  // =============================
  push();
  textAlign(LEFT, TOP);
  textSize(18);
  textLeading(22);
  const summaryLeftX = boxX;

  const bigW = 900;
  const bigH = 260;

  const smallW = 430;
  const smallH = 220;
  const gap = 30;

  // 첫 번째 박스 (타로 조언)
  const firstY = 150;

  fill(boxColor);
  rect(summaryLeftX, firstY, bigW, bigH, 25);

  fill(255);
  text("① 타로 마스터의 해석", summaryLeftX + 24, firstY + 20);
  text(
    tarotAdvice || "-",
    summaryLeftX + 24,
    firstY + 60,
    bigW - 48,
    bigH - 80
  );

  // 두 번째 & 세 번째 박스 (좌/우)
  const secondY = firstY + bigH + gap;

  // 흐름 카드
  fill(boxColor);
  rect(summaryLeftX, secondY, smallW, smallH, 20);

  fill(255);
  text("② 흐름의 카드", summaryLeftX + 20, secondY + 20);

  if (flowCard) {
    text(
      flowCard.summary,
      summaryLeftX + 20,
      secondY + 55,
      smallW - 40,
      smallH - 75
    );
  } else {
    text("등록된 흐름 카드가 없습니다.", summaryLeftX + 20, secondY + 55);
  }

  // 조언 카드
  const rightBoxX = summaryLeftX + smallW + 20;

  fill(boxColor);
  rect(rightBoxX, secondY, smallW, smallH, 20);

  fill(255);
  text("③ 조언의 카드", rightBoxX + 20, secondY + 20);

  if (policyCard) {
    text(
      policyCard.policy,
      rightBoxX + 20,
      secondY + 55,
      smallW - 40,
      smallH - 75
    );
  } else {
    text("등록된 조언 카드가 없습니다.", rightBoxX + 20, secondY + 55);
  }
  pop();

  // =============================
  // 🔶 3) QR 버튼
  // =============================
  const qrW = qr.width * 0.55;
  const qrH = qr.height * 0.55;

  const qrX = rightBoxX + smallW + 30;
  const qrY = secondY + smallH / 2 - qrH / 2;

  drawImageButtonScaled(
    qr,
    qrHover,
    qrX,
    qrY,
    qrW,
    qrH,
    () => {
  const QRPage = "https://iamsaeun.github.io/tarot/qr_result.html";

  const url =
    QRPage +
    "?bg=" + encodeURIComponent(BACKGROUND_MAP[selectedCategory]) +
    "&char=" + encodeURIComponent(CHARACTER_MAP[actualImageKeyWord]) +
    "&item=" + encodeURIComponent(ITEM_MAP[selectedTopic]) +
    "&advice=" + encodeURIComponent(tarotAdvice);

  return `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=300`;

    }
  );

  // =============================
  // 🔶 4) 이전 / 다음 버튼
  // =============================
  const btnY = 720;  

  drawPrevNextButtons("pre_summary", "start", btnY);

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

  // 다음 버튼
  drawImageButton(after, afterHover, nextX, y, () => {


    if (state === "summary" && nextState === "start") {
      resetAll();
    }

    if (nextState) state = nextState;
  });
}




// ========== 클릭 처리 ==========

// 마우스를 누를 때: start/question 화면만 처리
function mousePressed() {
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
  const y = 200;                // 화면 상단 여백

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
