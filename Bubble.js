class Bubble {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = random(20, 60);
        this.speedX = random(-1, 1);
        this.speedY = random(-2, -0.5); // 위로 상승
        this.wobble = random(TWO_PI);
        this.wobbleSpeed = random(0.05, 0.15);
        this.alpha = 200;

        // 버블 색상 (파스텔 톤)
        this.hue = random(180, 220); // 파랑-청록 계열
    }

    update() {
        // 움직임
        this.x += this.speedX;
        this.y += this.speedY;

        // 물결치는 움직임
        this.wobble += this.wobbleSpeed;
        this.x += sin(this.wobble) * 0.5;

        // 점점 느려지고 위로 상승
        this.speedY -= 0.01;

        // 서서히 사라짐
        this.alpha -= 1.5;

        // 크기 변화 (커졌다 작아졌다)
        this.size += sin(this.wobble * 2) * 0.1;
    }

    display() {
        push();
        translate(this.x, this.y);

        // 버블 외곽 (진한 테두리)
        noFill();
        stroke(this.hue, 60, 100, this.alpha);
        strokeWeight(2);
        ellipse(0, 0, this.size);

        // 버블 본체 (반투명)
        fill(this.hue, 40, 100, this.alpha * 0.3);
        noStroke();
        ellipse(0, 0, this.size);

        // 하이라이트 (빛 반사)
        fill(255, 255, 255, this.alpha * 0.6);
        ellipse(-this.size * 0.2, -this.size * 0.2, this.size * 0.3);

        // 작은 하이라이트
        fill(255, 255, 255, this.alpha * 0.4);
        ellipse(this.size * 0.15, this.size * 0.15, this.size * 0.15);

        pop();
    }

    isOffScreen() {
        return (this.x < -100 || this.x > width + 100 ||
            this.y < -100 ||
            this.alpha <= 0);
    }
}