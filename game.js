// Three.js 3D 우주 탐험 게임

let scene, camera, renderer;
let stars = [];
let planets = [];
let asteroids = [];
let nebulas = [];
let velocity = new THREE.Vector3();
let rotation = new THREE.Euler();

// 조작 키
const keys = {
    w: false, s: false, a: false, d: false,
    space: false, shift: false, q: false, e: false
};

// 마우스 컨트롤
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// 게임 설정
const config = {
    moveSpeed: 0.5,
    rotateSpeed: 0.02,
    maxSpeed: 2.0,
    friction: 0.98
};

// 초기화
function init() {
    // Scene 생성
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0001);

    // Camera 생성
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    );
    camera.position.set(0, 0, 0);

    // Renderer 생성
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    document.body.appendChild(renderer.domElement);

    // 조명 추가
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    // 별 생성
    createStarfield();

    // 행성 생성
    createPlanets();

    // 소행성 생성
    createAsteroids();

    // 성운 생성
    createNebulas();

    // 이벤트 리스너
    setupEventListeners();

    // 로딩 완료
    document.getElementById('loading').classList.add('hidden');

    // 애니메이션 시작
    animate();
}

// 별 생성
function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 10000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;

        // 랜덤 위치 (-5000 ~ 5000 범위)
        positions[i3] = (Math.random() - 0.5) * 10000;
        positions[i3 + 1] = (Math.random() - 0.5) * 10000;
        positions[i3 + 2] = (Math.random() - 0.5) * 10000;

        // 랜덤 색상 (흰색에서 파란색, 노란색 계열)
        const colorType = Math.random();
        if (colorType < 0.7) {
            colors[i3] = 1;
            colors[i3 + 1] = 1;
            colors[i3 + 2] = 1;
        } else if (colorType < 0.85) {
            colors[i3] = 0.8 + Math.random() * 0.2;
            colors[i3 + 1] = 0.8 + Math.random() * 0.2;
            colors[i3 + 2] = 1;
        } else {
            colors[i3] = 1;
            colors[i3 + 1] = 0.9 + Math.random() * 0.1;
            colors[i3 + 2] = 0.6 + Math.random() * 0.2;
        }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
    stars.push(starField);
}

// 행성 생성
function createPlanets() {
    const planetConfigs = [
        { radius: 50, color: 0xff6b35, position: [300, 100, -500], hasRing: false },
        { radius: 80, color: 0x4ecdc4, position: [-600, -200, -800], hasRing: true },
        { radius: 40, color: 0xf7b731, position: [800, 300, -1200], hasRing: false },
        { radius: 100, color: 0x5f27cd, position: [-400, 500, -1500], hasRing: true },
        { radius: 60, color: 0xee5a6f, position: [1000, -400, -2000], hasRing: false },
        { radius: 35, color: 0x00d2d3, position: [-1200, 200, -1800], hasRing: false },
        { radius: 90, color: 0xf368e0, position: [500, -600, -2500], hasRing: true },
        { radius: 45, color: 0xff9ff3, position: [-800, 800, -3000], hasRing: false }
    ];

    planetConfigs.forEach((config, index) => {
        // 행성 생성
        const geometry = new THREE.SphereGeometry(config.radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            emissive: config.color,
            emissiveIntensity: 0.2,
            shininess: 30
        });
        const planet = new THREE.Mesh(geometry, material);
        planet.position.set(...config.position);

        // 회전 속도 랜덤 설정
        planet.userData.rotationSpeed = {
            x: Math.random() * 0.001,
            y: Math.random() * 0.002,
            z: Math.random() * 0.001
        };

        scene.add(planet);
        planets.push(planet);

        // 링 추가
        if (config.hasRing) {
            const ringGeometry = new THREE.RingGeometry(
                config.radius * 1.5,
                config.radius * 2.5,
                64
            );
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: config.color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.6
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            planet.add(ring);
        }

        // 발광 효과 추가
        const glowGeometry = new THREE.SphereGeometry(config.radius * 1.1, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.1
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        planet.add(glow);

        // 포인트 라이트 추가
        const light = new THREE.PointLight(config.color, 1, 500);
        planet.add(light);
    });
}

// 소행성 생성
function createAsteroids() {
    const asteroidCount = 200;

    for (let i = 0; i < asteroidCount; i++) {
        const size = Math.random() * 5 + 2;
        const geometry = new THREE.DodecahedronGeometry(size);
        const material = new THREE.MeshPhongMaterial({
            color: 0x808080,
            flatShading: true
        });
        const asteroid = new THREE.Mesh(geometry, material);

        // 랜덤 위치
        asteroid.position.set(
            (Math.random() - 0.5) * 5000,
            (Math.random() - 0.5) * 5000,
            (Math.random() - 0.5) * 5000
        );

        // 랜덤 회전
        asteroid.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        // 회전 속도
        asteroid.userData.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02
        };

        scene.add(asteroid);
        asteroids.push(asteroid);
    }
}

// 성운 생성
function createNebulas() {
    const nebulaConfigs = [
        { color: 0xff006e, position: [1500, 500, -3000], size: 400 },
        { color: 0x8338ec, position: [-2000, -800, -4000], size: 500 },
        { color: 0x3a86ff, position: [2500, 1000, -5000], size: 600 },
        { color: 0xfb5607, position: [-1800, 600, -3500], size: 450 }
    ];

    nebulaConfigs.forEach(config => {
        const geometry = new THREE.SphereGeometry(config.size, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide
        });
        const nebula = new THREE.Mesh(geometry, material);
        nebula.position.set(...config.position);

        scene.add(nebula);
        nebulas.push(nebula);
    });
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 키보드 이벤트
    document.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            case 'w': keys.w = true; break;
            case 's': keys.s = true; break;
            case 'a': keys.a = true; break;
            case 'd': keys.d = true; break;
            case ' ': keys.space = true; e.preventDefault(); break;
            case 'shift': keys.shift = true; break;
            case 'q': keys.q = true; break;
            case 'e': keys.e = true; break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch(e.key.toLowerCase()) {
            case 'w': keys.w = false; break;
            case 's': keys.s = false; break;
            case 'a': keys.a = false; break;
            case 'd': keys.d = false; break;
            case ' ': keys.space = false; break;
            case 'shift': keys.shift = false; break;
            case 'q': keys.q = false; break;
            case 'e': keys.e = false; break;
        }
    });

    // 마우스 이벤트
    renderer.domElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            rotation.y -= deltaX * 0.005;
            rotation.x -= deltaY * 0.005;

            // X축 회전 제한
            rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.x));

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
    });

    renderer.domElement.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    // 윈도우 리사이즈
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// 움직임 업데이트
function updateMovement() {
    // 회전 적용
    camera.rotation.x = rotation.x;
    camera.rotation.y = rotation.y;
    camera.rotation.z = rotation.z;

    // Q/E 키로 Z축 회전
    if (keys.q) rotation.z += config.rotateSpeed;
    if (keys.e) rotation.z -= config.rotateSpeed;

    // 이동 방향 계산
    const direction = new THREE.Vector3();

    if (keys.w) direction.z -= 1;
    if (keys.s) direction.z += 1;
    if (keys.a) direction.x -= 1;
    if (keys.d) direction.x += 1;
    if (keys.space) direction.y += 1;
    if (keys.shift) direction.y -= 1;

    // 카메라 방향에 맞춰 이동
    if (direction.length() > 0) {
        direction.normalize();
        direction.applyQuaternion(camera.quaternion);
        velocity.add(direction.multiplyScalar(config.moveSpeed));
    }

    // 속도 제한
    const speed = velocity.length();
    if (speed > config.maxSpeed) {
        velocity.normalize().multiplyScalar(config.maxSpeed);
    }

    // 마찰 적용
    velocity.multiplyScalar(config.friction);

    // 위치 업데이트
    camera.position.add(velocity);

    // UI 업데이트
    updateUI();
}

// UI 업데이트
function updateUI() {
    const speed = velocity.length().toFixed(2);
    const pos = camera.position;

    document.getElementById('speed').textContent = speed;
    document.getElementById('position').textContent =
        `${pos.x.toFixed(0)}, ${pos.y.toFixed(0)}, ${pos.z.toFixed(0)}`;
}

// 애니메이션
function animate() {
    requestAnimationFrame(animate);

    // 움직임 업데이트
    updateMovement();

    // 행성 회전
    planets.forEach(planet => {
        planet.rotation.x += planet.userData.rotationSpeed.x;
        planet.rotation.y += planet.userData.rotationSpeed.y;
        planet.rotation.z += planet.userData.rotationSpeed.z;
    });

    // 소행성 회전
    asteroids.forEach(asteroid => {
        asteroid.rotation.x += asteroid.userData.rotationSpeed.x;
        asteroid.rotation.y += asteroid.userData.rotationSpeed.y;
        asteroid.rotation.z += asteroid.userData.rotationSpeed.z;
    });

    // 렌더링
    renderer.render(scene, camera);
}

// 게임 시작
window.addEventListener('load', init);
