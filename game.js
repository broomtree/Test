// 순수 JavaScript로 만든 3D 우주 탐험 게임
// 외부 라이브러리 없이 Canvas 2D API로 3D 효과 구현

class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    subtract(v) {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;
        return this;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    normalize() {
        const len = this.length();
        if (len > 0) {
            this.multiply(1 / len);
        }
        return this;
    }

    clone() {
        return new Vector3(this.x, this.y, this.z);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    cross(v) {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }
}

class Camera {
    constructor() {
        this.position = new Vector3(0, 0, 0);
        this.rotation = new Vector3(0, 0, 0);
        this.velocity = new Vector3(0, 0, 0);
        this.fov = 90;
        this.near = 0.1;
        this.far = 10000;
    }

    getForward() {
        const pitch = this.rotation.x;
        const yaw = this.rotation.y;
        return new Vector3(
            Math.sin(yaw) * Math.cos(pitch),
            Math.sin(pitch),
            -Math.cos(yaw) * Math.cos(pitch)
        );
    }

    getRight() {
        const yaw = this.rotation.y;
        return new Vector3(Math.cos(yaw), 0, Math.sin(yaw));
    }

    getUp() {
        const forward = this.getForward();
        const right = this.getRight();
        return right.cross(forward);
    }
}

class SpaceObject {
    constructor(x, y, z, type = 'star') {
        this.position = new Vector3(x, y, z);
        this.type = type;
        this.rotation = new Vector3(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        this.rotationSpeed = new Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
        );

        if (type === 'star') {
            this.size = Math.random() * 1.5 + 0.5;
            const colorChoice = Math.random();
            if (colorChoice < 0.7) {
                this.color = '#ffffff';
            } else if (colorChoice < 0.85) {
                this.color = '#aabbff';
            } else {
                this.color = '#ffeeaa';
            }
            this.brightness = Math.random() * 0.5 + 0.5;
        } else if (type === 'planet') {
            this.size = Math.random() * 40 + 20;
            const colors = ['#ff6b35', '#4ecdc4', '#f7b731', '#5f27cd', '#ee5a6f', '#00d2d3', '#f368e0', '#ff9ff3'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.hasRing = Math.random() > 0.5;
            this.ringColor = this.adjustColor(this.color, 0.7);
        } else if (type === 'asteroid') {
            this.size = Math.random() * 3 + 1;
            this.color = '#888888';
            this.shape = Math.floor(Math.random() * 3); // 다양한 모양
        } else if (type === 'nebula') {
            this.size = Math.random() * 300 + 200;
            const colors = ['#ff006e', '#8338ec', '#3a86ff', '#fb5607'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }
    }

    adjustColor(color, factor) {
        const hex = color.replace('#', '');
        const r = Math.floor(parseInt(hex.substr(0, 2), 16) * factor);
        const g = Math.floor(parseInt(hex.substr(2, 2), 16) * factor);
        const b = Math.floor(parseInt(hex.substr(4, 2), 16) * factor);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    update() {
        this.rotation.add(this.rotationSpeed);
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.camera = new Camera();
        this.objects = [];
        this.keys = {};
        this.mouse = { x: 0, y: 0, isDragging: false };
        this.config = {
            moveSpeed: 1.5,
            rotateSpeed: 0.002,
            friction: 0.95,
            maxSpeed: 5.0
        };
        this.lastTime = 0;
        this.fps = 60;
        this.frameCount = 0;
        this.lastFpsUpdate = 0;

        this.resize();
        this.init();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    init() {
        // 별 생성 (5000개)
        for (let i = 0; i < 5000; i++) {
            const x = (Math.random() - 0.5) * 8000;
            const y = (Math.random() - 0.5) * 8000;
            const z = (Math.random() - 0.5) * 8000;
            this.objects.push(new SpaceObject(x, y, z, 'star'));
        }

        // 행성 생성 (20개)
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const distance = 500 + Math.random() * 2000;
            const x = Math.cos(angle) * distance + (Math.random() - 0.5) * 500;
            const y = (Math.random() - 0.5) * 1000;
            const z = Math.sin(angle) * distance + (Math.random() - 0.5) * 500;
            this.objects.push(new SpaceObject(x, y, z, 'planet'));
        }

        // 소행성 생성 (300개)
        for (let i = 0; i < 300; i++) {
            const x = (Math.random() - 0.5) * 6000;
            const y = (Math.random() - 0.5) * 6000;
            const z = (Math.random() - 0.5) * 6000;
            this.objects.push(new SpaceObject(x, y, z, 'asteroid'));
        }

        // 성운 생성 (8개)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 1000 + Math.random() * 2000;
            const x = Math.cos(angle) * distance;
            const y = (Math.random() - 0.5) * 1500;
            const z = Math.sin(angle) * distance;
            this.objects.push(new SpaceObject(x, y, z, 'nebula'));
        }

        this.setupEvents();
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('objects').textContent = this.objects.length;

        this.animate(0);
    }

    setupEvents() {
        // 키보드 이벤트
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === ' ') e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        // 마우스 이벤트
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.isDragging = true;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.mouse.isDragging) {
                const deltaX = e.clientX - this.mouse.x;
                const deltaY = e.clientY - this.mouse.y;

                this.camera.rotation.y += deltaX * this.config.rotateSpeed;
                this.camera.rotation.x -= deltaY * this.config.rotateSpeed;

                // Pitch 제한
                this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));

                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.mouse.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.isDragging = false;
            this.canvas.style.cursor = 'default';
        });

        // 터치 이벤트 (모바일)
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.mouse.isDragging = true;
                this.mouse.x = e.touches[0].clientX;
                this.mouse.y = e.touches[0].clientY;
                e.preventDefault();
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.mouse.isDragging && e.touches.length > 0) {
                const deltaX = e.touches[0].clientX - this.mouse.x;
                const deltaY = e.touches[0].clientY - this.mouse.y;

                this.camera.rotation.y += deltaX * this.config.rotateSpeed;
                this.camera.rotation.x -= deltaY * this.config.rotateSpeed;
                this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));

                this.mouse.x = e.touches[0].clientX;
                this.mouse.y = e.touches[0].clientY;
                e.preventDefault();
            }
        });

        this.canvas.addEventListener('touchend', () => {
            this.mouse.isDragging = false;
        });

        // 윈도우 리사이즈
        window.addEventListener('resize', () => this.resize());
    }

    updateCamera() {
        const forward = this.camera.getForward();
        const right = this.camera.getRight();
        const up = new Vector3(0, 1, 0);

        // 키 입력에 따른 가속
        if (this.keys['w']) {
            this.camera.velocity.add(forward.clone().multiply(this.config.moveSpeed));
        }
        if (this.keys['s']) {
            this.camera.velocity.add(forward.clone().multiply(-this.config.moveSpeed));
        }
        if (this.keys['a']) {
            this.camera.velocity.add(right.clone().multiply(-this.config.moveSpeed));
        }
        if (this.keys['d']) {
            this.camera.velocity.add(right.clone().multiply(this.config.moveSpeed));
        }
        if (this.keys[' ']) {
            this.camera.velocity.add(up.clone().multiply(this.config.moveSpeed));
        }
        if (this.keys['shift']) {
            this.camera.velocity.add(up.clone().multiply(-this.config.moveSpeed));
        }

        // 롤 회전
        if (this.keys['q']) {
            this.camera.rotation.z += 0.02;
        }
        if (this.keys['e']) {
            this.camera.rotation.z -= 0.02;
        }

        // 속도 제한
        const speed = this.camera.velocity.length();
        if (speed > this.config.maxSpeed) {
            this.camera.velocity.normalize().multiply(this.config.maxSpeed);
        }

        // 마찰 적용
        this.camera.velocity.multiply(this.config.friction);

        // 위치 업데이트
        this.camera.position.add(this.camera.velocity);

        // UI 업데이트
        this.updateUI();
    }

    updateUI() {
        const speed = this.camera.velocity.length();
        document.getElementById('speed').textContent = speed.toFixed(2);
        document.getElementById('posX').textContent = Math.floor(this.camera.position.x);
        document.getElementById('posY').textContent = Math.floor(this.camera.position.y);
        document.getElementById('posZ').textContent = Math.floor(this.camera.position.z);
    }

    project(point) {
        // 카메라 회전 행렬 적용
        const translated = point.subtract(this.camera.position);

        // 회전 적용 (Yaw, Pitch, Roll)
        const cosYaw = Math.cos(-this.camera.rotation.y);
        const sinYaw = Math.sin(-this.camera.rotation.y);
        const cosPitch = Math.cos(-this.camera.rotation.x);
        const sinPitch = Math.sin(-this.camera.rotation.x);
        const cosRoll = Math.cos(-this.camera.rotation.z);
        const sinRoll = Math.sin(-this.camera.rotation.z);

        // Yaw 회전
        let x = translated.x * cosYaw - translated.z * sinYaw;
        let z = translated.x * sinYaw + translated.z * cosYaw;
        let y = translated.y;

        // Pitch 회전
        let tempY = y * cosPitch - z * sinPitch;
        z = y * sinPitch + z * cosPitch;
        y = tempY;

        // Roll 회전
        let tempX = x * cosRoll - y * sinRoll;
        y = x * sinRoll + y * cosRoll;
        x = tempX;

        // 원근 투영
        if (z <= 0) return null;

        const scale = (this.canvas.width / 2) / Math.tan(this.camera.fov * Math.PI / 360);
        const screenX = (x / z) * scale + this.centerX;
        const screenY = (-y / z) * scale + this.centerY;
        const depth = z;

        return { x: screenX, y: screenY, z: depth };
    }

    render() {
        // 배경 그리기
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 객체들을 거리순으로 정렬 (먼 것부터)
        const projectedObjects = [];

        for (const obj of this.objects) {
            const projected = this.project(obj.position);
            if (projected && projected.z > 0 && projected.z < this.camera.far) {
                projectedObjects.push({ obj, projected });
            }
        }

        // 깊이 순 정렬 (먼 것부터)
        projectedObjects.sort((a, b) => b.projected.z - a.projected.z);

        // 렌더링
        for (const { obj, projected } of projectedObjects) {
            const scale = 1000 / projected.z;

            if (obj.type === 'star') {
                this.renderStar(obj, projected, scale);
            } else if (obj.type === 'planet') {
                this.renderPlanet(obj, projected, scale);
            } else if (obj.type === 'asteroid') {
                this.renderAsteroid(obj, projected, scale);
            } else if (obj.type === 'nebula') {
                this.renderNebula(obj, projected, scale);
            }
        }
    }

    renderStar(obj, projected, scale) {
        const size = obj.size * scale;
        if (size < 0.5) return;

        this.ctx.fillStyle = obj.color;
        this.ctx.globalAlpha = obj.brightness;

        // 별 그리기
        this.ctx.beginPath();
        this.ctx.arc(projected.x, projected.y, Math.max(0.5, size), 0, Math.PI * 2);
        this.ctx.fill();

        // 반짝이는 효과
        if (size > 1 && Math.random() > 0.95) {
            this.ctx.globalAlpha = 0.3;
            this.ctx.beginPath();
            this.ctx.arc(projected.x, projected.y, size * 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1;
    }

    renderPlanet(obj, projected, scale) {
        const size = obj.size * scale;
        if (size < 1) return;

        // 발광 효과
        const gradient = this.ctx.createRadialGradient(
            projected.x, projected.y, 0,
            projected.x, projected.y, size * 1.5
        );
        gradient.addColorStop(0, obj.color);
        gradient.addColorStop(0.7, obj.color + '88');
        gradient.addColorStop(1, obj.color + '00');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(projected.x, projected.y, size * 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // 행성 본체
        this.ctx.fillStyle = obj.color;
        this.ctx.beginPath();
        this.ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
        this.ctx.fill();

        // 음영 효과
        const shadowGradient = this.ctx.createRadialGradient(
            projected.x - size * 0.3, projected.y - size * 0.3, 0,
            projected.x, projected.y, size
        );
        shadowGradient.addColorStop(0, '#ffffff44');
        shadowGradient.addColorStop(1, '#00000088');

        this.ctx.fillStyle = shadowGradient;
        this.ctx.beginPath();
        this.ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
        this.ctx.fill();

        // 링 그리기
        if (obj.hasRing && size > 3) {
            this.ctx.strokeStyle = obj.ringColor;
            this.ctx.lineWidth = size * 0.2;
            this.ctx.globalAlpha = 0.6;

            this.ctx.beginPath();
            this.ctx.ellipse(
                projected.x, projected.y,
                size * 2, size * 0.5,
                Math.sin(obj.rotation.y) * 0.5, 0, Math.PI * 2
            );
            this.ctx.stroke();

            this.ctx.globalAlpha = 1;
        }
    }

    renderAsteroid(obj, projected, scale) {
        const size = obj.size * scale;
        if (size < 0.5) return;

        this.ctx.fillStyle = obj.color;
        this.ctx.globalAlpha = 0.8;

        // 불규칙한 모양 그리기
        this.ctx.beginPath();
        const points = 6 + obj.shape * 2;
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2 + obj.rotation.x;
            const radius = size * (0.7 + Math.sin(angle * 3 + obj.rotation.y) * 0.3);
            const x = projected.x + Math.cos(angle) * radius;
            const y = projected.y + Math.sin(angle) * radius;
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.globalAlpha = 1;
    }

    renderNebula(obj, projected, scale) {
        const size = obj.size * scale;
        if (size < 5) return;

        // 성운 효과 (여러 겹의 그라데이션)
        this.ctx.globalAlpha = 0.05;

        for (let i = 0; i < 3; i++) {
            const offsetX = Math.sin(obj.rotation.x + i) * size * 0.2;
            const offsetY = Math.cos(obj.rotation.y + i) * size * 0.2;

            const gradient = this.ctx.createRadialGradient(
                projected.x + offsetX, projected.y + offsetY, 0,
                projected.x + offsetX, projected.y + offsetY, size * (1 + i * 0.3)
            );
            gradient.addColorStop(0, obj.color);
            gradient.addColorStop(0.5, obj.color + '44');
            gradient.addColorStop(1, obj.color + '00');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(projected.x + offsetX, projected.y + offsetY, size * (1 + i * 0.3), 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.globalAlpha = 1;
    }

    animate(currentTime) {
        requestAnimationFrame((time) => this.animate(time));

        // FPS 계산
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate > 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
            document.getElementById('fpsValue').textContent = this.fps;
        }

        // 객체 업데이트
        for (const obj of this.objects) {
            obj.update();
        }

        // 카메라 업데이트
        this.updateCamera();

        // 렌더링
        this.render();

        this.lastTime = currentTime;
    }
}

// 게임 시작
window.addEventListener('load', () => {
    const game = new Game();
    window.game = game; // 디버깅용
});
