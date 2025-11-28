class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = random(10, 30);
        this.speedX = random(-3, 3);
        this.speedY = random(-3, 3);
        this.color = color(random(255), random(255), random(255));
        this.alpha = 255;
        this.rotation = random(TWO_PI);
        this.rotationSpeed = random(-0.1, 0.1);
    }

    update() {
        // 움직임
        this.x += this.speedX;
        this.y += this.speedY;

        // 회전
        this.rotation += this.rotationSpeed;

        // 서서히 사라짐
        this.alpha -= 2;

        // 중력 효과
        this.speedY += 0.1;
    }

    display() {
        push();
        translate(this.x, this.y);
        rotate(this.rotation);

        // 색상 설정 (투명도 적용)
        fill(red(this.color), green(this.color), blue(this.color), this.alpha);
        noStroke();

        // 별 모양 그리기
        this.drawStar(0, 0, this.size / 2, this.size / 4, 5);

        // 빛나는 효과
        fill(255, 255, 255, this.alpha / 2);
        ellipse(0, 0, this.size / 3);

        pop();
    }

    drawStar(x, y, radius1, radius2, npoints) {
        let angle = TWO_PI / npoints;
        let halfAngle = angle / 2.0;
        beginShape();
        for (let a = 0; a < TWO_PI; a += angle) {
            let sx = x + cos(a) * radius1;
            let sy = y + sin(a) * radius1;
            vertex(sx, sy);
            sx = x + cos(a + halfAngle) * radius2;
            sy = y + sin(a + halfAngle) * radius2;
            vertex(sx, sy);
        }
        endShape(CLOSE);
    }

    isOffScreen() {
        return (this.x < -50 || this.x > width + 50 ||
            this.y < -50 || this.y > height + 50 ||
            this.alpha <= 0);
    }
}