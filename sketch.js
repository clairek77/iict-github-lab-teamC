function setup() {
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  text("오늘의 꽃다발을 만나보세요💐", 200, 190);
  text("(꽃다발 끈은 행운의 컬러!)", 200, 210);
}

function draw() {
}

function mousePressed() {
  background(252, 253, 245);
  noStroke();
  fill(0);
  textAlign(CENTER, TOP);
  text("나만을 위한 오늘의 꽃다발💐", 200, 50);
  noStroke();
  fill(221, 235, 237);
  triangle(120, 220, 200, 370, 280, 220); 
  triangle(180, 370, 200, 300, 220, 370); 
  fill(random(255), random(255), random(255));
  rect(185, 345, 30, 5);
  
  let circleSize = random(10, 20);
  let r = 20;
  let petalSize = random(15, 25);
//첫번째꽃시작
  push();
  translate(200, 110);
  noStroke();
  fill(random(255), random(255), random(255));
  circle(0, 0, circleSize);
  fill(random(255), random(255), random(255));
  ellipse(r*cos(radians(0)), r*sin(radians(0)), petalSize);
  ellipse(r*cos(radians(60)), r*sin(radians(60)), petalSize);
  ellipse(r*cos(radians(120)), r*sin(radians(120)), petalSize);
  ellipse(r*cos(radians(180)), r*sin(radians(180)), petalSize);
  ellipse(r*cos(radians(240)), r*sin(radians(240)), petalSize);
  ellipse(r*cos(radians(300)), r*sin(radians(300)), petalSize);
  pop();
//두번째꽃시작
  push();
  translate(160, 150);
  noStroke();
  fill(random(255), random(255), random(255));
  circle(0, 0, circleSize);
  fill(random(255), random(255), random(255));
  ellipse(r*cos(radians(0)), r*sin(radians(0)), petalSize);
  ellipse(r*cos(radians(60)), r*sin(radians(60)), petalSize);
  ellipse(r*cos(radians(120)), r*sin(radians(120)), petalSize);
  ellipse(r*cos(radians(180)), r*sin(radians(180)), petalSize);
  ellipse(r*cos(radians(240)), r*sin(radians(240)), petalSize);
  ellipse(r*cos(radians(300)), r*sin(radians(300)), petalSize);
  pop();
//세번째꽃시작
  push();
  translate(240, 140);
  noStroke();
  fill(random(255), random(255), random(255));
  circle(0, 0, circleSize);
  fill(random(255), random(255), random(255));
  ellipse(r*cos(radians(0)), r*sin(radians(0)), petalSize);
  ellipse(r*cos(radians(60)), r*sin(radians(60)), petalSize);
  ellipse(r*cos(radians(120)), r*sin(radians(120)), petalSize);
  ellipse(r*cos(radians(180)), r*sin(radians(180)), petalSize);
  ellipse(r*cos(radians(240)), r*sin(radians(240)), petalSize);
  ellipse(r*cos(radians(300)), r*sin(radians(300)), petalSize);
  pop();
//네번째꽃시작
  push();
  translate(130, 210);
  noStroke();
  fill(random(255), random(255), random(255));
  circle(0, 0, circleSize);
  fill(random(255), random(255), random(255));
  ellipse(r*cos(radians(0)), r*sin(radians(0)), petalSize);
  ellipse(r*cos(radians(60)), r*sin(radians(60)), petalSize);
  ellipse(r*cos(radians(120)), r*sin(radians(120)), petalSize);
  ellipse(r*cos(radians(180)), r*sin(radians(180)), petalSize);
  ellipse(r*cos(radians(240)), r*sin(radians(240)), petalSize);
  ellipse(r*cos(radians(300)), r*sin(radians(300)), petalSize);
  pop();
//다섯번째꽃시작
  push();
  translate(185, 190);
  noStroke();
  fill(random(255), random(255), random(255));
  circle(0, 0, circleSize);
  fill(random(255), random(255), random(255));
  ellipse(r*cos(radians(0)), r*sin(radians(0)), petalSize);
  ellipse(r*cos(radians(60)), r*sin(radians(60)), petalSize);
  ellipse(r*cos(radians(120)), r*sin(radians(120)), petalSize);
  ellipse(r*cos(radians(180)), r*sin(radians(180)), petalSize);
  ellipse(r*cos(radians(240)), r*sin(radians(240)), petalSize);
  ellipse(r*cos(radians(300)), r*sin(radians(300)), petalSize);
  pop();
//여섯번째꽃시작
  push();
  translate(240, 195);
  noStroke();
  fill(random(255), random(255), random(255));
  circle(0, 0, circleSize);
  fill(random(255), random(255), random(255));
  ellipse(r*cos(radians(0)), r*sin(radians(0)), petalSize);
  ellipse(r*cos(radians(60)), r*sin(radians(60)), petalSize);
  ellipse(r*cos(radians(120)), r*sin(radians(120)), petalSize);
  ellipse(r*cos(radians(180)), r*sin(radians(180)), petalSize);
  ellipse(r*cos(radians(240)), r*sin(radians(240)), petalSize);
  ellipse(r*cos(radians(300)), r*sin(radians(300)), petalSize);
  pop();
//일곱번째꽃시작
  push();
  translate(290, 205);
  noStroke();
  fill(random(255), random(255), random(255));
  circle(0, 0, circleSize);
  fill(random(255), random(255), random(255));
  ellipse(r*cos(radians(0)), r*sin(radians(0)), petalSize);
  ellipse(r*cos(radians(60)), r*sin(radians(60)), petalSize);
  ellipse(r*cos(radians(120)), r*sin(radians(120)), petalSize);
  ellipse(r*cos(radians(180)), r*sin(radians(180)), petalSize);
  ellipse(r*cos(radians(240)), r*sin(radians(240)), petalSize);
  ellipse(r*cos(radians(300)), r*sin(radians(300)), petalSize);
  pop();
}
