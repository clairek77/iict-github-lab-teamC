class Confetti {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = random(5, 15);
        this.height = random(10, 20);
        this.speedX = random(-5, 5);
        this.speedY = random(-10, -5); // 위로 튀어오름
        this.gravity = 0.3;
        this.rotation = random(TWO_PI);
        this.rotationSpeed = random(-0.2, 0.2);

        // 밝은 색상들
        let colors = [
            color(255, 87, 87),   // 빨강
            color(255, 195, 0),   // 노랑
            color(0, 230, 118),   // 초록
            color(0, 149, 255),   // 파랑
            color(153, 50, 204),  // 보라
            color(255, 105, 180)  // 핑크
        ];
        this.color = random(colors);
        this.alpha = 255;
    }

    update() {
        // 움직임
        this.x += this.speedX;
        this.y += this.speedY;

        // 중력
        this.speedY += this.gravity;

        // 공기 저항
        this.speedX *= 0.99;

        // 회전
        this.rotation += this.rotationSpeed;

        // 서서히 사라짐 (더 천천히)
        this.alpha -= 1;
    }

    display() {
        push();
        translate(this.x, this.y);
        rotate(this.rotation);

        // 색상 설정
        fill(red(this.color), green(this.color), blue(this.color), this.alpha);
        noStroke();

        // 직사각형 컨페티
        rectMode(CENTER);
        rect(0, 0, this.width, this.height);

        // 반짝임 효과
        fill(255, 255, 255, this.alpha * 0.3);
        rect(0, 0, this.width * 0.5, this.height * 0.5);

        pop();
    }

    isOffScreen() {
        return (this.x < -50 || this.x > width + 50 ||
            this.y > height + 50 ||
            this.alpha <= 0);
    }
}