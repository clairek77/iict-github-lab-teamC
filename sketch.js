let particles = [];
let confettiList = [];
let bubbles = [];
let bgImage;
let mode = 'particle'; // 'particle', 'confetti', 'bubble'

function preload() {
  // TODO: 이미지 로드
  bgImage = loadImage('images/background.png');
}

function setup() {
  createCanvas(600, 600);

  // 초기 파티클 생성
  for (let i = 0; i < 5; i++) {
    particles.push(new Particle(random(width), random(height)));
  }

  textAlign(CENTER, CENTER);
}

function draw() {
  // 배경
  if (bgImage) {
    image(bgImage, 0, 0, width, height);
    // 반투명 오버레이
    fill(0, 0, 0, 100);
    rect(0, 0, width, height);
  } else {
    background(20, 20, 40);
  }

  // 모든 파티클 업데이트 및 표시
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();

    // 화면 밖으로 나간 파티클 제거
    if (particles[i].isOffScreen()) {
      particles.splice(i, 1);
    }
  }

  // 모든 컨페티 업데이트 및 표시
  for (let i = confettiList.length - 1; i >= 0; i--) {
    confettiList[i].update();
    confettiList[i].display();

    if (confettiList[i].isOffScreen()) {
      confettiList.splice(i, 1);
    }
  }

  // 모든 버블 업데이트 및 표시
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].display();

    if (bubbles[i].isOffScreen()) {
      bubbles.splice(i, 1);
    }
  }

  // 안내 텍스트
  displayInstructions();
}

function displayInstructions() {
  fill(255);
  stroke(0);
  strokeWeight(2);
  textSize(18);
  text('클릭: 파티클 생성 | 키보드 1: 기본 | 2: 컨페티 | 3: 버블', width / 2, 30);

  textSize(14);
  text(`현재 모드: ${getModeText()}`, width / 2, 55);
  text(`파티클 수: ${particles.length + confettiList.length + bubbles.length}`, width / 2, 75);
}

function getModeText() {
  if (mode === 'particle') return '✨ 기본 파티클';
  if (mode === 'confetti') return '🎉 컨페티';
  if (mode === 'bubble') return '🫧 버블';
}

function mousePressed() {
  // 마우스 위치에 파티클 생성
  if (mode === 'particle') {
    particles.push(new Particle(mouseX, mouseY));
  } else if (mode === 'confetti') {
    // 컨페티는 여러 개 한번에
    for (let i = 0; i < 10; i++) {
      confettiList.push(new Confetti(mouseX, mouseY));
    }
  } else if (mode === 'bubble') {
    bubbles.push(new Bubble(mouseX, mouseY));
  }
}

function keyPressed() {
  // 모드 변경
  if (key === '1') {
    mode = 'particle';
  } else if (key === '2') {
    mode = 'confetti';
  } else if (key === '3') {
    mode = 'bubble';
  }
}