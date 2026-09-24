/**
 * Three.js WebGL 3D Car Model Studio
 * High-performance procedural sports car with PBR automotive materials,
 * interactive orbit controls, lighting, hotspots, and live PostgreSQL telemetry.
 */

class Car3DStudio {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.carGroup = new THREE.Group();
        this.wheels = [];
        this.paintMaterials = [];
        this.underglowLight = null;
        this.underglowMesh = null;
        this.hotspots = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.state = {
            paintColor: 0xd90429, // Default Crimson Red
            finish: 'metallic',   // metallic, matte, chrome, wireframe
            autoRotate: true,
            rotateSpeed: 1.0,
            underglowEnabled: true,
            underglowColor: 0x00f5d4,
            headlightsEnabled: true,
            activeHotspot: null,
            wheelSpinSpeed: 0.05
        };

        this.init();
    }

    init() {
        const width = this.container.clientWidth || 800;
        const height = this.container.clientHeight || 500;

        // 1. Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x07090e);
        this.scene.fog = new THREE.FogExp2(0x07090e, 0.035);

        // 2. Camera
        this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
        this.camera.position.set(4.5, 2.2, 5.0);

        // 3. Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.container.appendChild(this.renderer.domElement);

        // 4. Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going underground
            this.controls.minDistance = 2.5;
            this.controls.maxDistance = 15;
            this.controls.target.set(0, 0.65, 0);
        }

        // 5. Lighting & Environment
        this.setupLighting();
        this.setupShowroomFloor();

        // 6. Build 3D Car Model
        this.buildProceduralSportsCar();
        this.scene.add(this.carGroup);

        // 7. Setup Interactive Hotspots
        this.setupHotspots();

        // 8. Event Listeners
        window.addEventListener('resize', () => this.onWindowResize());
        this.renderer.domElement.addEventListener('click', (e) => this.onPointerClick(e));

        // 9. Animation Loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    setupLighting() {
        // Soft Ambient Light
        const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
        this.scene.add(ambientLight);

        // Main Key Light with Shadow
        const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
        keyLight.position.set(6, 8, 5);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        keyLight.shadow.camera.near = 0.5;
        keyLight.shadow.camera.far = 25;
        keyLight.shadow.bias = -0.0005;
        this.scene.add(keyLight);

        // Cyan Rim / Contour Light (Cyber Accent)
        const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.8);
        rimLight.position.set(-6, 4, -5);
        this.scene.add(rimLight);

        // Warm Fill Light
        const fillLight = new THREE.DirectionalLight(0xf59e0b, 0.8);
        fillLight.position.set(5, 2, -4);
        this.scene.add(fillLight);

        // Overhead Soft Dome Light
        const topLight = new THREE.PointLight(0xffffff, 1.0, 15);
        topLight.position.set(0, 4, 0);
        this.scene.add(topLight);

        // Underglow Point Light
        this.underglowLight = new THREE.PointLight(this.state.underglowColor, 2.5, 4.5);
        this.underglowLight.position.set(0, 0.15, 0);
        this.scene.add(this.underglowLight);
    }

    setupShowroomFloor() {
        // Dark reflective floor plane
        const floorGeo = new THREE.PlaneGeometry(30, 30);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x090d16,
            roughness: 0.3,
            metalness: 0.8
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Cyber Grid overlay
        const grid = new THREE.GridHelper(24, 24, 0x38bdf8, 0x1e293b);
        grid.position.y = 0.005;
        this.scene.add(grid);

        // Showroom pedestal ring
        const ringGeo = new THREE.RingGeometry(2.4, 2.45, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.01;
        this.scene.add(ring);
    }

    buildProceduralSportsCar() {
        // Base Automotive Paint Material
        this.carPaintMaterial = new THREE.MeshPhysicalMaterial({
            color: this.state.paintColor,
            metalness: 0.85,
            roughness: 0.18,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            reflectivity: 0.95
        });
        this.paintMaterials.push(this.carPaintMaterial);

        // Secondary Dark Trim Material
        const trimMat = new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.5,
            metalness: 0.8
        });

        // Glass Material
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x0a1128,
            metalness: 0.1,
            roughness: 0.05,
            transmission: 0.7,
            ior: 1.52,
            transparent: true,
            opacity: 0.85
        });

        // 1. Lower Chassis & Aerodynamic Floor
        const chassisGeo = new THREE.BoxGeometry(1.85, 0.3, 4.2);
        const chassis = new THREE.Mesh(chassisGeo, trimMat);
        chassis.position.y = 0.35;
        chassis.castShadow = true;
        this.carGroup.add(chassis);

        // 2. Sculpted Main Body Shell
        const bodyGeo = new THREE.BoxGeometry(1.8, 0.42, 3.9);
        const body = new THREE.Mesh(bodyGeo, this.carPaintMaterial);
        body.position.y = 0.65;
        body.castShadow = true;
        body.receiveShadow = true;
        this.carGroup.add(body);

        // 3. Aerodynamic Hood Scoop / Engine Bay
        const hoodGeo = new THREE.BoxGeometry(1.65, 0.18, 1.6);
        const hood = new THREE.Mesh(hoodGeo, this.carPaintMaterial);
        hood.position.set(0, 0.85, 1.0);
        hood.rotation.x = 0.05;
        hood.castShadow = true;
        hood.name = "Engine";
        this.carGroup.add(hood);

        // Hood Vent Intake
        const ventGeo = new THREE.BoxGeometry(0.8, 0.05, 0.6);
        const vent = new THREE.Mesh(ventGeo, trimMat);
        vent.position.set(0, 0.95, 1.0);
        this.carGroup.add(vent);

        // 4. Cabin / Roof (Curved Fastback Profile)
        const cabinGeo = new THREE.BoxGeometry(1.5, 0.52, 1.8);
        const cabin = new THREE.Mesh(cabinGeo, this.carPaintMaterial);
        cabin.position.set(0, 1.1, -0.2);
        cabin.castShadow = true;
        cabin.name = "Cabin";
        this.carGroup.add(cabin);

        // Front Windshield
        const windshieldGeo = new THREE.PlaneGeometry(1.42, 0.65);
        const windshield = new THREE.Mesh(windshieldGeo, glassMat);
        windshield.position.set(0, 1.08, 0.72);
        windshield.rotation.x = -Math.PI / 4.2;
        this.carGroup.add(windshield);

        // Rear Windshield
        const rearGlassGeo = new THREE.PlaneGeometry(1.42, 0.72);
        const rearGlass = new THREE.Mesh(rearGlassGeo, glassMat);
        rearGlass.position.set(0, 1.08, -1.12);
        rearGlass.rotation.x = Math.PI / 3.8;
        this.carGroup.add(rearGlass);

        // Side Windows (Left & Right)
        const sideWinGeo = new THREE.PlaneGeometry(1.7, 0.42);
        const sideWinL = new THREE.Mesh(sideWinGeo, glassMat);
        sideWinL.position.set(0.76, 1.1, -0.2);
        sideWinL.rotation.y = Math.PI / 2;
        this.carGroup.add(sideWinL);

        const sideWinR = new THREE.Mesh(sideWinGeo, glassMat);
        sideWinR.position.set(-0.76, 1.1, -0.2);
        sideWinR.rotation.y = -Math.PI / 2;
        this.carGroup.add(sideWinR);

        // 5. LED Headlights (Glowing Cyan/White)
        const headLightMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x38bdf8,
            emissiveIntensity: 3.0,
            roughness: 0.1
        });
        const hlGeo = new THREE.BoxGeometry(0.35, 0.1, 0.08);
        
        const hlL = new THREE.Mesh(hlGeo, headLightMat);
        hlL.position.set(0.65, 0.66, 1.95);
        this.carGroup.add(hlL);

        const hlR = new THREE.Mesh(hlGeo, headLightMat);
        hlR.position.set(-0.65, 0.66, 1.95);
        this.carGroup.add(hlR);

        // 6. LED Taillights (Full-width neon light bar)
        const tailLightMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0xef4444,
            emissiveIntensity: 3.5,
            roughness: 0.1
        });
        const tlGeo = new THREE.BoxGeometry(1.6, 0.09, 0.08);
        const tl = new THREE.Mesh(tlGeo, tailLightMat);
        tl.position.set(0, 0.72, -1.95);
        this.carGroup.add(tl);

        // 7. Aerodynamic Rear Wing / Spoiler
        const spoilerWingGeo = new THREE.BoxGeometry(1.7, 0.06, 0.35);
        const spoilerWing = new THREE.Mesh(spoilerWingGeo, trimMat);
        spoilerWing.position.set(0, 1.18, -1.9);
        spoilerWing.castShadow = true;
        this.carGroup.add(spoilerWing);

        const pillarGeo = new THREE.BoxGeometry(0.08, 0.32, 0.12);
        const pillarL = new THREE.Mesh(pillarGeo, trimMat);
        pillarL.position.set(0.55, 1.02, -1.9);
        this.carGroup.add(pillarL);

        const pillarR = new THREE.Mesh(pillarGeo, trimMat);
        pillarR.position.set(-0.55, 1.02, -1.9);
        this.carGroup.add(pillarR);

        // 8. Dual Chrome Exhaust Tips
        const exhaustMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
        const exhaustGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.25, 16);
        
        const exL = new THREE.Mesh(exhaustGeo, exhaustMat);
        exL.rotation.x = Math.PI / 2;
        exL.position.set(0.38, 0.32, -2.05);
        exL.name = "Exhaust";
        this.carGroup.add(exL);

        const exR = new THREE.Mesh(exhaustGeo, exhaustMat);
        exR.rotation.x = Math.PI / 2;
        exR.position.set(-0.38, 0.32, -2.05);
        exR.name = "Exhaust";
        this.carGroup.add(exR);

        // 9. Wheels & Tires
        this.buildWheels();

        // 10. Neon Underglow Mesh
        const underglowGeo = new THREE.PlaneGeometry(1.4, 2.8);
        const underglowMat = new THREE.MeshBasicMaterial({
            color: this.state.underglowColor,
            transparent: true,
            opacity: 0.65,
            side: THREE.DoubleSide
        });
        this.underglowMesh = new THREE.Mesh(underglowGeo, underglowMat);
        this.underglowMesh.rotation.x = -Math.PI / 2;
        this.underglowMesh.position.y = 0.08;
        this.carGroup.add(this.underglowMesh);
    }

    buildWheels() {
        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x18181b,
            roughness: 0.85,
            metalness: 0.1
        });
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0xd4d4d8,
            metalness: 0.9,
            roughness: 0.15
        });
        const caliperMat = new THREE.MeshStandardMaterial({
            color: 0xd90429,
            roughness: 0.3
        });

        // Wheel positions: Front-Left, Front-Right, Rear-Left, Rear-Right
        const wheelPositions = [
            { x: 0.95, y: 0.38, z: 1.25, isLeft: true },
            { x: -0.95, y: 0.38, z: 1.25, isLeft: false },
            { x: 0.95, y: 0.38, z: -1.25, isLeft: true },
            { x: -0.95, y: 0.38, z: -1.25, isLeft: false }
        ];

        wheelPositions.forEach((pos, idx) => {
            const wheelAssembly = new THREE.Group();
            wheelAssembly.position.set(pos.x, pos.y, pos.z);
            wheelAssembly.name = "Wheels";

            // Tire
            const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 28);
            tireGeo.rotateZ(Math.PI / 2);
            const tire = new THREE.Mesh(tireGeo, tireMat);
            tire.castShadow = true;
            wheelAssembly.add(tire);

            // Rim
            const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.29, 20);
            rimGeo.rotateZ(Math.PI / 2);
            const rim = new THREE.Mesh(rimGeo, rimMat);
            wheelAssembly.add(rim);

            // Rim Spokes
            for (let i = 0; i < 5; i++) {
                const spokeGeo = new THREE.BoxGeometry(0.04, 0.44, 0.04);
                const spoke = new THREE.Mesh(spokeGeo, rimMat);
                spoke.rotation.x = (i * Math.PI) / 5;
                spoke.position.x = pos.isLeft ? 0.06 : -0.06;
                wheelAssembly.add(spoke);
            }

            // Brake Caliper
            const caliperGeo = new THREE.BoxGeometry(0.08, 0.14, 0.1);
            const caliper = new THREE.Mesh(caliperGeo, caliperMat);
            caliper.position.set(pos.isLeft ? -0.05 : 0.05, 0.12, 0.12);
            wheelAssembly.add(caliper);

            this.wheels.push(wheelAssembly);
            this.carGroup.add(wheelAssembly);
        });
    }

    setupHotspots() {
        // Create interactive glowing clickable markers for parts
        const markerConfigs = [
            { id: "engine", label: "Engine & Powertrain", pos: [0, 1.05, 1.0] },
            { id: "wheels", label: "Wheels & Suspension", pos: [1.1, 0.65, 1.25] },
            { id: "cabin", label: "Cockpit & Chassis", pos: [0, 1.45, -0.2] },
            { id: "exhaust", label: "Exhaust & Emissions", pos: [0, 0.55, -2.1] }
        ];

        markerConfigs.forEach(cfg => {
            const sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
            const sphereMat = new THREE.MeshBasicMaterial({
                color: 0x38bdf8,
                wireframe: true
            });
            const marker = new THREE.Mesh(sphereGeo, sphereMat);
            marker.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
            marker.userData = { id: cfg.id, label: cfg.label };
            this.scene.add(marker);
            this.hotspots.push(marker);
        });
    }

    // Public State Changers
    setPaintColor(hexColor) {
        this.state.paintColor = hexColor;
        this.carPaintMaterial.color.setHex(hexColor);
    }

    setFinish(finishType) {
        this.state.finish = finishType;
        if (finishType === 'metallic') {
            this.carPaintMaterial.wireframe = false;
            this.carPaintMaterial.metalness = 0.85;
            this.carPaintMaterial.roughness = 0.18;
            this.carPaintMaterial.clearcoat = 1.0;
        } else if (finishType === 'matte') {
            this.carPaintMaterial.wireframe = false;
            this.carPaintMaterial.metalness = 0.2;
            this.carPaintMaterial.roughness = 0.6;
            this.carPaintMaterial.clearcoat = 0.0;
        } else if (finishType === 'chrome') {
            this.carPaintMaterial.wireframe = false;
            this.carPaintMaterial.metalness = 0.98;
            this.carPaintMaterial.roughness = 0.05;
            this.carPaintMaterial.clearcoat = 1.0;
        } else if (finishType === 'wireframe') {
            this.carPaintMaterial.wireframe = true;
            this.carPaintMaterial.color.setHex(0x38bdf8);
        }
    }

    setCameraPreset(presetName) {
        if (!this.controls) return;
        const presets = {
            cinematic: { pos: [4.5, 2.2, 5.0], target: [0, 0.65, 0] },
            front: { pos: [0, 1.2, 5.5], target: [0, 0.65, 0] },
            side: { pos: [6.0, 1.2, 0.0], target: [0, 0.65, 0] },
            rear: { pos: [-3.5, 1.8, -5.0], target: [0, 0.65, 0] },
            top: { pos: [0.1, 7.5, 0.1], target: [0, 0.65, 0] }
        };
        const p = presets[presetName] || presets.cinematic;
        this.camera.position.set(...p.pos);
        this.controls.target.set(...p.target);
        this.controls.update();
    }

    toggleAutoRotate(enable) {
        this.state.autoRotate = enable;
    }

    toggleUnderglow(enable) {
        this.state.underglowEnabled = enable;
        if (this.underglowLight) this.underglowLight.visible = enable;
        if (this.underglowMesh) this.underglowMesh.visible = enable;
    }

    setUnderglowColor(hexColor) {
        this.state.underglowColor = hexColor;
        if (this.underglowLight) this.underglowLight.color.setHex(hexColor);
        if (this.underglowMesh) this.underglowMesh.material.color.setHex(hexColor);
    }

    onPointerClick(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.hotspots, false);

        if (intersects.length > 0) {
            const hit = intersects[0].object;
            const hotspotId = hit.userData.id;
            this.highlightHotspot(hotspotId);
        }
    }

    highlightHotspot(hotspotId) {
        this.state.activeHotspot = hotspotId;
        const hudEvent = new CustomEvent('carHotspotSelected', { detail: { hotspotId } });
        window.dispatchEvent(hudEvent);
    }

    onWindowResize() {
        if (!this.container || !this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        if (width === 0 || height === 0) return;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate(time) {
        requestAnimationFrame(this.animate);

        // Auto Rotation
        if (this.state.autoRotate) {
            this.carGroup.rotation.y += 0.005 * this.state.rotateSpeed;

            // Spin wheels when rotating
            this.wheels.forEach(w => {
                w.rotation.x += this.state.wheelSpinSpeed;
            });
        }

        // Pulse Hotspots
        const pulse = 1.0 + Math.sin(time * 0.004) * 0.15;
        this.hotspots.forEach(h => {
            h.scale.set(pulse, pulse, pulse);
        });

        // Underglow breath effect
        if (this.state.underglowEnabled && this.underglowLight) {
            this.underglowLight.intensity = 2.2 + Math.sin(time * 0.003) * 0.4;
        }

        if (this.controls) this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Global instance variable
window.car3DApp = null;

function initCar3D(containerId = 'car-3d-viewport') {
    if (!window.car3DApp) {
        window.car3DApp = new Car3DStudio(containerId);
    } else {
        window.car3DApp.onWindowResize();
    }
}
