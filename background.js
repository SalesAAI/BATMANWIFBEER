function initBackground() {
    // Previous scene and particle setup remains the same...
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('backgroundEffect'),
        alpha: true,
        antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particle setup (unchanged)...
    const particleCount = 2000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 200;
        positions[i3 + 1] = (Math.random() - 0.5) * 200;
        positions[i3 + 2] = (Math.random() - 0.5) * 100;

        if (i < particleCount * 0.2) {
            colors[i3] = 1.0;
            colors[i3 + 1] = 0.84;
            colors[i3 + 2] = 0.0;
        } else if (i < particleCount * 0.4) {
            colors[i3] = 0.0;
            colors[i3 + 1] = 0.5;
            colors[i3 + 2] = 1.0;
        } else {
            colors[i3] = 1.0;
            colors[i3 + 1] = 1.0;
            colors[i3 + 2] = 1.0;
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Enhanced Lightning class with angular breaks
    class Lightning {
        constructor(scene) {
            this.scene = scene;
            this.branches = [];
            this.lights = [];
            this.material = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0
            });
        }

        createAngularPath(start, end, segmentLength) {
            const points = [start.clone()];
            let currentPoint = start.clone();
            const targetPoint = end.clone();
            const direction = new THREE.Vector3().subVectors(end, start).normalize();
            
            while (currentPoint.distanceTo(targetPoint) > segmentLength) {
                // Create a sharp turn
                const angle = (Math.random() - 0.5) * Math.PI * 0.5; // ±45 degrees
                direction.applyAxisAngle(new THREE.Vector3(0, 0, 1), angle);
                
                // Move in new direction
                const nextPoint = currentPoint.clone().add(
                    direction.clone().multiplyScalar(segmentLength)
                );
                
                // Adjust towards target
                const toTarget = new THREE.Vector3().subVectors(targetPoint, nextPoint);
                direction.lerp(toTarget.normalize(), 0.3);
                
                points.push(nextPoint.clone());
                currentPoint = nextPoint;
            }
            
            points.push(targetPoint);
            return points;
        }

        createBranch(startPoint, endPoint, branchLevel = 0, maxLength = 100) {
            if (branchLevel > 3) return;

            // Reduce length for each branch level
            const length = maxLength * (1 - branchLevel * 0.3);
            const segmentLength = 15 - branchLevel * 3; // Shorter segments for branches
            
            const points = this.createAngularPath(startPoint, endPoint, segmentLength);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = this.material.clone();
            material.opacity = 0;
            
            const line = new THREE.Line(geometry, material);
            this.branches.push(line);
            this.scene.add(line);

            // Fade animation
            gsap.to(material, {
                opacity: 0.8 - (branchLevel * 0.2),
                duration: 0.1,
                ease: "power1.in",
                onComplete: () => {
                    gsap.to(material, {
                        opacity: 0,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
            });

            // Create branches with random angles
            if (points.length > 2) {
                const numBranches = Math.max(0, 2 - branchLevel);
                for (let i = 0; i < numBranches; i++) {
                    const branchStartIndex = Math.floor(Math.random() * (points.length - 1));
                    const branchStart = points[branchStartIndex];
                    
                    // Create branch at sharp angle
                    const angle = (Math.random() - 0.5) * Math.PI; // ±90 degrees
                    const direction = new THREE.Vector3()
                        .subVectors(points[branchStartIndex + 1], branchStart)
                        .normalize()
                        .applyAxisAngle(new THREE.Vector3(0, 0, 1), angle);
                    
                    const branchLength = length * 0.5;
                    const branchEnd = branchStart.clone().add(
                        direction.multiplyScalar(branchLength)
                    );

                    setTimeout(() => {
                        this.createBranch(branchStart, branchEnd, branchLevel + 1, branchLength);
                    }, i * 50);
                }
            }
        }

        createFlashEffect(position) {
            const flash = new THREE.PointLight(0x7df9ff, 50, 200);
            flash.position.copy(position);
            this.scene.add(flash);
            this.lights.push(flash);

            const ambient = new THREE.AmbientLight(0x7df9ff, 1);
            this.scene.add(ambient);
            this.lights.push(ambient);

            gsap.to(flash, {
                intensity: 0,
                duration: 0.4,
                ease: "power2.out"
            });

            gsap.to(ambient, {
                intensity: 0,
                duration: 0.5,
                ease: "power2.out",
                onComplete: () => {
                    this.lights.forEach(light => this.scene.remove(light));
                    this.lights = [];
                }
            });
        }

        strike() {
            this.branches.forEach(branch => {
                this.scene.remove(branch);
                branch.geometry.dispose();
                branch.material.dispose();
            });
            this.branches = [];

            const side = Math.random() < 0.5 ? -1 : 1;
            const startPoint = new THREE.Vector3(
                side * (100 + Math.random() * 20),
                80 + Math.random() * 20,
                0
            );

            const endPoint = new THREE.Vector3(
                startPoint.x * 0.1,
                -70,
                0
            );

            this.createBranch(startPoint, endPoint, 0, 150);
            this.createFlashEffect(startPoint);
        }
    }

    const lightning = new Lightning(scene);
    setInterval(() => lightning.strike(), 4000);

    // Rest of the code remains the same...
    camera.position.z = 100;

    const mouse = {
        x: 0,
        y: 0,
        target: { x: 0, y: 0 }
    };

    document.addEventListener('mousemove', (event) => {
        mouse.target.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.target.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    function animate() {
        requestAnimationFrame(animate);

        const positions = geometry.attributes.position.array;
        const time = Date.now() * 0.0001;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += Math.sin(time + i) * 0.01;
            positions[i + 1] += Math.cos(time + i) * 0.01;
        }
        geometry.attributes.position.needsUpdate = true;

        mouse.x += (mouse.target.x - mouse.x) * 0.05;
        mouse.y += (mouse.target.y - mouse.y) * 0.05;

        particles.rotation.x = mouse.y * 0.3;
        particles.rotation.y = mouse.x * 0.3;

        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    animate();
}

window.initBackground = initBackground;
