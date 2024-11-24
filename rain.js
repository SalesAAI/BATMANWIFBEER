function initRain() {
    // Initialize Three.js Scene for rain
    const rainScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('rainCanvas'),
        alpha: true,
        antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create rain particles
    const rainCount = 16000;
    const rainGeometry = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    const rainColors = new Float32Array(rainCount * 3);
    const rainVelocities = new Float32Array(rainCount);
    const rainElongations = new Float32Array(rainCount);

    // Initialize raindrop properties with color distribution
    for (let i = 0; i < rainCount; i++) {
        const i3 = i * 3;
        rainPositions[i3] = (Math.random() - 0.5) * 200;
        rainPositions[i3 + 1] = Math.random() * 200;
        rainPositions[i3 + 2] = (Math.random() - 0.5) * 200;
        
        rainVelocities[i] = 0.6 + Math.random() * 0.4;
        rainElongations[i] = 1 + Math.random() * 0.5;

        // Color distribution: 20% yellow, 20% blue, 60% white
        if (i < rainCount * 0.2) {
            // Yellow drops
            rainColors[i3] = 1.0;     // R
            rainColors[i3 + 1] = 0.84; // G
            rainColors[i3 + 2] = 0.0;  // B
        } else if (i < rainCount * 0.4) {
            // Blue drops
            rainColors[i3] = 0.0;     // R
            rainColors[i3 + 1] = 0.5;  // G
            rainColors[i3 + 2] = 1.0;  // B
        } else {
            // White drops
            rainColors[i3] = 1.0;     // R
            rainColors[i3 + 1] = 1.0;  // G
            rainColors[i3 + 2] = 1.0;  // B
        }
    }

    rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    rainGeometry.setAttribute('color', new THREE.BufferAttribute(rainColors, 3));

    // Create rain material
    const rainMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 }
        },
        vertexShader: `
            uniform float time;
            attribute vec3 color;
            varying vec3 vColor;
            void main() {
                vColor = color;
                vec3 pos = position;
                float yOffset = mod(pos.y - time * 30.0, 200.0) - 100.0;
                vec4 mvPosition = modelViewMatrix * vec4(pos.x, yOffset, pos.z, 1.0);
                gl_PointSize = 2.0 * (100.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            void main() {
                float r = distance(gl_PointCoord, vec2(0.5));
                if (r > 0.5) discard;
                gl_FragColor = vec4(vColor, 0.6);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const rain = new THREE.Points(rainGeometry, rainMaterial);
    rainScene.add(rain);

    // Set camera position
    camera.position.z = 100;

    // Initialize splash canvas
    const splashCanvas = document.getElementById('splashCanvas');
    const ctx = splashCanvas.getContext('2d');
    splashCanvas.width = window.innerWidth;
    splashCanvas.height = window.innerHeight;

    // Splash effect class
    class Splash {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.radius = 0;
            this.maxRadius = 2 + Math.random() * 3;
            this.speed = 0.3;
            this.opacity = 0.5;
            this.droplets = [];
            this.createDroplets();
        }

        createDroplets() {
            const dropletCount = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < dropletCount; i++) {
                const angle = (Math.PI * 2 * i) / dropletCount;
                const speed = 0.5 + Math.random() * 0.5;
                this.droplets.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    opacity: 0.5
                });
            }
        }

        update() {
            this.radius += this.speed;
            this.opacity -= 0.02;

            this.droplets.forEach(droplet => {
                droplet.x += droplet.vx;
                droplet.y += droplet.vy;
                droplet.opacity -= 0.02;
            });

            return this.opacity > 0;
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${this.color.join(',')},${this.opacity})`;
            ctx.stroke();

            this.droplets.forEach(droplet => {
                if (droplet.opacity > 0) {
                    ctx.beginPath();
                    ctx.arc(droplet.x, droplet.y, 1, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${this.color.join(',')},${droplet.opacity})`;
                    ctx.fill();
                }
            });
        }
    }

    let splashes = [];

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        // Update rain material time uniform
        rainMaterial.uniforms.time.value += 0.01;

        // Clear splash canvas
        ctx.clearRect(0, 0, splashCanvas.width, splashCanvas.height);

        // Update and draw splashes
        splashes = splashes.filter(splash => {
            const isActive = splash.update();
            if (isActive) {
                splash.draw(ctx);
            }
            return isActive;
        });

        // Create new splashes
        if (Math.random() < 0.3) {
            const x = Math.random() * window.innerWidth;
            const y = window.innerHeight - 20;
            const colorType = Math.random();
            let color;
            if (colorType < 0.2) {
                color = [255, 215, 0]; // Yellow
            } else if (colorType < 0.4) {
                color = [0, 136, 255]; // Blue
            } else {
                color = [255, 255, 255]; // White
            }
            splashes.push(new Splash(x, y, color));
        }

        renderer.render(rainScene, camera);
    }

    // Handle window resize
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        splashCanvas.width = window.innerWidth;
        splashCanvas.height = window.innerHeight;
    }

    window.addEventListener('resize', onWindowResize);

    // Start animation
    animate();
}

// Make the init function globally available
window.initRain = initRain;
