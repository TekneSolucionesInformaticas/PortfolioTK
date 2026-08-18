/**
 * Interactive 3D head — "Nosotros" section.
 * Tap/click the head to open the cranium and reveal skills as labeled
 * arrows radiating from a glowing core. Uses a real (mesh-simplified,
 * ~2.9MB) 3D head scan via three.js.
 *
 * Lazy-initialized only once the section scrolls near the viewport —
 * three.js + OrbitControls + GLTFLoader + the model are real weight,
 * not worth paying for on every page load.
 */
(function () {
    const mount = document.getElementById('interactive-head-mount');
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let started = false;

    const start = () => {
        if (started) return;
        started = true;
        initHead().catch((err) => {
            const loading = mount.querySelector('.head-loading');
            if (loading) loading.textContent = 'No se pudo cargar la vista 3D.';
            console.error('interactive-head:', err);
        });
    };

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) { start(); io.disconnect(); }
            });
        }, { rootMargin: '250px' });
        io.observe(mount);
    } else {
        start();
    }

    async function initHead() {
        const stage = document.createElement('three-d-stage');
        stage.id = 'interactive-head-stage';
        stage.setAttribute('background', '#05070D');
        if (!prefersReducedMotion) stage.setAttribute('autorotate', '');
        mount.prepend(stage);

        const hint = mount.querySelector('.head-hint');
        const loading = mount.querySelector('.head-loading');

        const [{ GLTFLoader }, readyState] = await Promise.all([
            import('https://unpkg.com/three@0.184.0/examples/jsm/loaders/GLTFLoader.js'),
            stage.ready,
        ]);
        const THREE = readyState.THREE;
        stage._renderer.localClippingEnabled = true;

        const ACCENT = 0xE53935;       // TEKNÉ red — brighter, for emissive glow
        const ACCENT_SOFT = 0x7F1D1D;  // TEKNÉ primary red

        const skills = [
            'Emprendimiento', 'Estrategia de negocios', 'Inteligencia artificial',
            'Automatización', 'Diseño de sistemas', 'Product Management',
            'Resolución de problemas', 'Dirección creativa', 'Diseño de marca',
            'Marketing', 'Gestión comercial', 'Innovación',
        ];

        const brainCoreMat = new THREE.MeshStandardMaterial({
            name: 'brain_core', color: 0x1a0a0a, roughness: 0.35, metalness: 0.25,
            emissive: ACCENT_SOFT, emissiveIntensity: 0.4, transparent: true, opacity: 0.92,
        });
        const circuitLineMat = new THREE.LineBasicMaterial({ name: 'circuit_lines', color: ACCENT, transparent: true, opacity: 0.9 });
        const nodeMat = new THREE.MeshStandardMaterial({ name: 'circuit_node', color: ACCENT, emissive: ACCENT, emissiveIntensity: 1.4, roughness: 0.3 });
        const arrowMat = new THREE.MeshStandardMaterial({ name: 'arrow_metal', color: 0xf5dede, roughness: 0.3, metalness: 0.35, emissive: ACCENT_SOFT, emissiveIntensity: 0.15 });
        const cavityMat = new THREE.MeshStandardMaterial({ name: 'cranium_cavity', color: 0x1a0f0d, roughness: 0.9, metalness: 0.0, side: THREE.BackSide });

        const root = new THREE.Group();
        root.name = 'interactive_head_realistic';

        const R = 0.19;
        const CUT_Y = 0.78;
        const HINGE_Z = -0.33;

        const loader = new GLTFLoader();
        loader.load(
            'img/head/interactive-head.glb',
            (gltf) => {
                if (loading) loading.remove();
                let headMesh;
                gltf.scene.traverse((o) => { if (o.isMesh) headMesh = o; });
                headMesh.name = 'head_scan';

                const basePlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), CUT_Y);
                const lidPlaneLocal = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
                const lidPlaneWorld = lidPlaneLocal.clone();

                const baseMat = headMesh.material;
                baseMat.name = 'skin_scan';
                baseMat.side = THREE.DoubleSide;
                baseMat.clippingPlanes = [basePlane];
                headMesh.castShadow = true;
                headMesh.receiveShadow = true;
                root.add(headMesh);

                const hingePivot = new THREE.Group();
                hingePivot.name = 'cranium_hatch_hinge';
                hingePivot.position.set(0, CUT_Y, HINGE_Z);
                root.add(hingePivot);

                const lidMat = baseMat.clone();
                lidMat.name = 'skin_scan_lid';
                lidMat.clippingPlanes = [lidPlaneWorld];
                const lidMesh = new THREE.Mesh(headMesh.geometry, lidMat);
                lidMesh.name = 'cranium_hatch';
                lidMesh.position.set(0, -CUT_Y, -HINGE_Z);
                lidMesh.castShadow = true;
                lidMesh.receiveShadow = true;
                lidMesh.userData.planeLocal = lidPlaneLocal;
                lidMesh.userData.planeWorld = lidPlaneWorld;
                hingePivot.add(lidMesh);

                const cavity = new THREE.Mesh(new THREE.SphereGeometry(R * 1.15, 28, 20), cavityMat);
                cavity.name = 'cranium_cavity_fill';
                cavity.position.set(0, CUT_Y - R * 0.9, HINGE_Z * 0.35);
                root.add(cavity);

                buildBrain(root, hingePivot, lidMesh, headMesh);
                stage.setObject(root);
                setupInteraction(headMesh, lidMesh);
            },
            undefined,
            (err) => {
                if (loading) loading.textContent = 'No se pudo cargar el modelo.';
                console.error('interactive-head glb load error:', err);
            }
        );

        function buildBrain(root, hingePivot, lidMesh, headMesh) {
            const brainGroup = new THREE.Group();
            brainGroup.name = 'brain';
            const restY = CUT_Y - R * 1.15;
            brainGroup.position.set(0, restY, HINGE_Z * 0.25);
            root.add(brainGroup);

            const brainGeo = new THREE.IcosahedronGeometry(R * 0.56, 2);
            brainGeo.scale(1.05, 0.86, 0.98);
            const brainCore = new THREE.Mesh(brainGeo, brainCoreMat);
            brainCore.name = 'brain_core';
            brainGroup.add(brainCore);

            const edges = new THREE.EdgesGeometry(brainGeo);
            const circuitLines = new THREE.LineSegments(edges, circuitLineMat);
            circuitLines.name = 'brain_circuit_lines';
            brainGroup.add(circuitLines);

            const nodePositions = brainGeo.attributes.position;
            const nodeGeo = new THREE.SphereGeometry(R * 0.028, 8, 8);
            const seenKeys = new Set();
            for (let i = 0; i < nodePositions.count; i += 3) {
                const x = nodePositions.getX(i), y = nodePositions.getY(i), z = nodePositions.getZ(i);
                const key = x.toFixed(3) + ',' + y.toFixed(3) + ',' + z.toFixed(3);
                if (seenKeys.has(key)) continue;
                seenKeys.add(key);
                const node = new THREE.Mesh(nodeGeo, nodeMat);
                node.name = 'circuit_node_' + seenKeys.size;
                node.position.set(x, y, z);
                brainGroup.add(node);
            }

            function makeLabelSprite(text) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const scale = 3;
                ctx.font = `600 ${34 * scale}px 'Inter', -apple-system, sans-serif`;
                const padX = 26 * scale, padY = 16 * scale;
                const textW = ctx.measureText(text).width;
                canvas.width = textW + padX * 2;
                canvas.height = 34 * scale + padY * 2;
                ctx.font = `600 ${34 * scale}px 'Inter', -apple-system, sans-serif`;
                const r = canvas.height / 2;
                ctx.fillStyle = 'rgba(11, 15, 26, 0.9)';
                ctx.strokeStyle = 'rgba(229, 57, 53, 0.65)';
                ctx.lineWidth = 3 * scale;
                ctx.beginPath();
                ctx.moveTo(r, 0);
                ctx.lineTo(canvas.width - r, 0);
                ctx.arcTo(canvas.width, 0, canvas.width, r, r);
                ctx.lineTo(canvas.width, canvas.height - r);
                ctx.arcTo(canvas.width, canvas.height, canvas.width - r, canvas.height, r);
                ctx.lineTo(r, canvas.height);
                ctx.arcTo(0, canvas.height, 0, canvas.height - r, r);
                ctx.lineTo(0, r);
                ctx.arcTo(0, 0, r, 0, r);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#fff5f5';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, padX, canvas.height / 2 + 2);
                const tex = new THREE.CanvasTexture(canvas);
                tex.colorSpace = THREE.SRGBColorSpace;
                const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
                const sprite = new THREE.Sprite(mat);
                const aspect = canvas.width / canvas.height;
                const h = R * 0.34;
                sprite.scale.set(h * aspect, h, 1);
                return sprite;
            }

            const arrows = [];
            const n = skills.length;
            for (let i = 0; i < n; i++) {
                const azimuth = (i / n) * Math.PI * 2 + (i % 2) * 0.12;
                const elevation = 0.4 + 0.42 * (i % 3) / 2;
                const dir = new THREE.Vector3(
                    Math.cos(azimuth) * Math.cos(elevation),
                    Math.sin(elevation) + 0.15,
                    Math.sin(azimuth) * Math.cos(elevation)
                ).normalize();

                const arrowPivot = new THREE.Group();
                arrowPivot.name = 'skill_arrow_' + i;
                arrowPivot.position.copy(dir).multiplyScalar(R * 0.5);
                arrowPivot.lookAt(dir.clone().multiplyScalar(R * 2));
                arrowPivot.rotateX(Math.PI / 2);
                brainGroup.add(arrowPivot);

                const maxLen = R * (1.3 + (i % 4) * 0.22);
                const arrowMesh = new THREE.Group();
                arrowMesh.name = 'skill_arrow_mesh_' + i;
                arrowPivot.add(arrowMesh);

                const shaftGeo = new THREE.CylinderGeometry(R * 0.02, R * 0.02, maxLen, 10);
                shaftGeo.translate(0, maxLen / 2, 0);
                const shaft = new THREE.Mesh(shaftGeo, arrowMat);
                shaft.name = 'arrow_shaft_' + i;
                arrowMesh.add(shaft);

                const headGeo = new THREE.ConeGeometry(R * 0.048, R * 0.14, 12);
                headGeo.translate(0, maxLen + R * 0.07, 0);
                const head = new THREE.Mesh(headGeo, arrowMat);
                head.name = 'arrow_head_' + i;
                arrowMesh.add(head);

                const sprite = makeLabelSprite(skills[i]);
                sprite.position.set(0, maxLen + R * 0.28, 0);
                arrowPivot.add(sprite);

                arrows.push({ pivot: arrowPivot, mesh: arrowMesh, sprite, maxLen, delay: i * 0.045 });
            }

            let openness = 0, target = 0;
            function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
            function applyOpenness(v) {
                const eo = easeOutCubic(Math.min(1, Math.max(0, v)));
                hingePivot.rotation.x = -eo * 1.7;
                hingePivot.updateMatrixWorld(true);
                lidMesh.userData.planeWorld.copy(lidMesh.userData.planeLocal).applyMatrix4(hingePivot.matrixWorld);
                brainGroup.position.y = restY + eo * R * 1.1;
                brainGroup.rotation.y = eo * 0.9;
                for (const a of arrows) {
                    const local = Math.min(1, Math.max(0, (v - a.delay) / (1 - a.delay)));
                    const eoLocal = easeOutCubic(local);
                    a.mesh.scale.y = Math.max(0.001, eoLocal);
                    const tipY = a.maxLen * eoLocal;
                    a.sprite.position.y = tipY + R * 0.28;
                    a.sprite.material.opacity = Math.max(0, (local - 0.35) / 0.65);
                }
            }
            applyOpenness(0);
            function tick() {
                openness += (target - openness) * 0.075;
                applyOpenness(openness);
                requestAnimationFrame(tick);
            }
            tick();

            if (hint) requestAnimationFrame(() => { hint.style.opacity = '1'; });
            window.__toggleInteractiveHead = function () {
                target = target > 0.5 ? 0 : 1;
                if (hint) { hint.style.opacity = '0'; setTimeout(() => hint.remove(), 600); }
            };
        }

        function setupInteraction(headMesh, lidMesh) {
            const raycaster = new THREE.Raycaster();
            const pointer = new THREE.Vector2();
            const hitTargets = [headMesh, lidMesh];
            let lastPointer = null;

            function pointerToNdc(ev) {
                const rect = stage.getBoundingClientRect();
                pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
                pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
            }

            stage.addEventListener('pointerdown', (ev) => { lastPointer = { x: ev.clientX, y: ev.clientY, t: performance.now() }; });
            stage.addEventListener('pointerup', (ev) => {
                if (!lastPointer) return;
                const dx = ev.clientX - lastPointer.x, dy = ev.clientY - lastPointer.y;
                const moved = Math.hypot(dx, dy);
                const dt = performance.now() - lastPointer.t;
                lastPointer = null;
                if (moved > 6 || dt > 600) return;
                pointerToNdc(ev);
                raycaster.setFromCamera(pointer, stage._camera);
                const hits = raycaster.intersectObjects(hitTargets, false);
                if (hits.length) window.__toggleInteractiveHead();
            });
            stage.style.cursor = 'pointer';
        }
    }
})();
