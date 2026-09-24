/**
 * Flourish 3D Viewer v4.0.1 Replica
 * Three.js WebGL Interactive 3D Ridgeline Surface Visualization
 * 
 * Optimized:
 * - Compact base plate (pedestal radius 2.65 instead of 4.8)
 * - Beautiful white gallery pedestal with silver bevel and soft ambient drop shadow
 * - Centered composition so left series labels have generous space and ZERO cut-off
 * - Large, bold, high-contrast, razor-sharp text labels (Months on front, Categories on left)
 * - Closer camera framing for maximum visual impact & legibility
 */

class Flourish3DViewer {
  constructor(canvasSelector, data, options = {}) {
    this.canvas = document.querySelector(canvasSelector);
    this.data = data;
    this.options = Object.assign({
      autoRotate: false,
      autoRotateSpeed: 0.005,
      // Snug framing: closer camera for large, visible text & prominent ridges
      isometricPos: { x: 0.05, y: 4.3, z: 5.9 },
      targetCenter: { x: 0.12, y: 0.35, z: 0 }
    }, options);

    this.ridgeMeshes = [];
    this.hoveredMesh = null;
    this.isAutoRotating = false;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.tooltip = document.getElementById('tooltip-3d');

    this.init();
  }

  init() {
    // 1. Renderer Setup with antialiasing and high pixel ratio
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // 2. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(
      this.options.isometricPos.x,
      this.options.isometricPos.y,
      this.options.isometricPos.z
    );

    // 3. OrbitControls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Stay above ground plane
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 15;
    this.controls.target.set(
      this.options.targetCenter.x,
      this.options.targetCenter.y,
      this.options.targetCenter.z
    );

    // 4. Studio Lighting
    this.setupLighting();

    // 5. Platter & 3D Model Group
    this.turntableGroup = new THREE.Group();
    this.scene.add(this.turntableGroup);

    this.createPedestal();
    this.createPlatterLabels();
    this.createRidgelines();

    // 6. Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseleave', () => this.onMouseLeave());

    // 7. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Ambient Light for clean white illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    // Main Studio Key Light (warm-white from upper right)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0003;
    this.scene.add(keyLight);

    // Cool Fill Light (from upper left)
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.45);
    fillLight.position.set(-6, 8, -4);
    this.scene.add(fillLight);

    // Subtle Rim Light for crisp peak silhouettes
    const rimLight = new THREE.DirectionalLight(0xfce7f3, 0.35);
    rimLight.position.set(0, 7, -8);
    this.scene.add(rimLight);
  }

  createPedestal() {
    // Compact, sleek circular platter (radius 2.60 instead of 4.8)
    const platterRadius = 2.60;
    const platterHeight = 0.16;

    const platterGeo = new THREE.CylinderGeometry(platterRadius, platterRadius + 0.08, platterHeight, 96);
    // Premium light pearl / white gallery finish
    const platterMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.22,
      metalness: 0.06
    });

    const platterMesh = new THREE.Mesh(platterGeo, platterMat);
    platterMesh.position.y = -platterHeight / 2;
    platterMesh.receiveShadow = true;
    this.turntableGroup.add(platterMesh);

    // Beveled silver-slate outer trim
    const rimGeo = new THREE.TorusGeometry(platterRadius, 0.025, 16, 96);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.2,
      metalness: 0.3
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.003;
    this.turntableGroup.add(rimMesh);

    // Soft Ambient Contact Shadow Underneath Platter
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const ctx = shadowCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(256, 256, 80, 256, 256, 256);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.25)');
    grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.10)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(platterRadius * 2.8, platterRadius * 2.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -platterHeight - 0.015;
    this.scene.add(shadowMesh);
  }

  createPlatterLabels() {
    // High-resolution Canvas Texture for large, bold, crystal-clear labels
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // Fill transparent background
    ctx.clearRect(0, 0, 2048, 2048);

    // Coordinate mapping: Platter plane diameter is 5.3 units.
    // 2048 / 5.3 = ~386 px/unit. Origin (0,0) is at (1024, 1024).
    const centerX = 1024;
    const centerY = 1024;
    const scale = 386.4;

    // Ridgeline dimensions (matching createRidgelines)
    const chartWidth = 2.8;
    const depthSpan = 2.0;
    const xOffset = 0.52;
    const xStart = -chartWidth / 2 + xOffset; // -0.88
    const zStart = -depthSpan / 2;           // -1.0
    const zStep = depthSpan / (this.data.series.length - 1);

    // Helper to draw rounded rectangle pills on canvas
    function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle, lineWidth) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth || 1;
        ctx.stroke();
      }
    }

    // 1. Front X-Axis Month Labels: Jan, Feb, Mar ... Dec
    const xLabels = this.data.xLabels;
    const xStep = chartWidth / (xLabels.length - 1);
    const frontZ = depthSpan / 2 + 0.28; // Sitting neatly in front of the front slice

    ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#0f172a'; // Bold dark slate for high contrast
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    xLabels.forEach((label, idx) => {
      const x3d = xStart + idx * xStep;
      const px = centerX + x3d * scale;
      const py = centerY + frontZ * scale;

      // Clean tick mark
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(px, py - 18);
      ctx.lineTo(px, py - 4);
      ctx.stroke();

      // Horizontal bold month label
      ctx.fillText(label, px, py + 2);
    });

    // 2. Left Z-Axis Category Labels
    const series = this.data.series;
    const labelAnchorX = xStart - 0.26; // Positioned cleanly left of ridge start with full peak clearance

    ctx.font = '800 30px "Plus Jakarta Sans", sans-serif';
    ctx.textBaseline = 'middle';

    series.forEach((s, idx) => {
      const z3d = zStart + idx * zStep;
      const px = centerX + labelAnchorX * scale;
      const py = centerY + z3d * scale;

      // Measure text for snug pill background
      const textMetrics = ctx.measureText(s.name);
      const textW = textMetrics.width;
      const pillPadX = 14;
      const dotRadius = 9;
      const pillW = textW + dotRadius * 2 + pillPadX * 2 + 12;
      const pillH = 42;
      const pillX = px - pillW;
      const pillY = py - pillH / 2;

      // Sleek pill badge background (translucent white + soft border + subtle drop shadow)
      ctx.save();
      ctx.shadowColor = 'rgba(15, 23, 42, 0.10)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
      drawRoundedRect(
        ctx,
        pillX,
        pillY,
        pillW,
        pillH,
        14,
        'rgba(255, 255, 255, 0.96)',
        'rgba(203, 213, 225, 0.95)',
        1.5
      );
      ctx.restore();

      // Color indicator dot
      const dotX = pillX + pillPadX + dotRadius;
      const dotY = py;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
      ctx.fill();

      // Clean crisp white ring around dot
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // High-contrast bold dark slate category text (100% visible)
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'left';
      ctx.fillText(s.name, dotX + dotRadius + 9, py);
    });

    // Apply Canvas as Texture onto the Platter's top face
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    const platterDiameter = 2.60 * 2;
    const labelPlaneGeo = new THREE.PlaneGeometry(platterDiameter, platterDiameter);
    const labelPlaneMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    });
    const labelPlane = new THREE.Mesh(labelPlaneGeo, labelPlaneMat);
    labelPlane.rotation.x = -Math.PI / 2;
    labelPlane.position.y = 0.003; // Just above the platter surface
    this.turntableGroup.add(labelPlane);
  }

  createRidgelines() {
    const seriesList = this.data.series;
    const numSeries = seriesList.length;

    // Dimensions in 3D scene space
    const chartWidth = 2.8;   // X-axis width
    const depthSpan = 2.0;    // Z-axis depth span
    const sliceThickness = 0.088; // Thickness of each 3D ridge slice
    const zStart = -depthSpan / 2;
    const zStep = depthSpan / (numSeries - 1);

    // Match horizontal offset (+0.52) so entire model is centered on the platter
    const xOffset = 0.52;
    const xStart = -chartWidth / 2 + xOffset;
    const numPoints = this.data.xLabels.length;

    seriesList.forEach((series, sIdx) => {
      const zPos = zStart + sIdx * zStep;

      // 1. Build smooth curve through data values using CatmullRomSpline
      const curvePoints = [];
      const xStep = chartWidth / (numPoints - 1);

      series.values.forEach((val, pIdx) => {
        const x = xStart + pIdx * xStep;
        const y = Math.max(0.04, val);
        curvePoints.push(new THREE.Vector2(x, y));
      });

      // Subdivide curve into 64 fine segments for smooth mountain contours
      const spline = new THREE.SplineCurve(curvePoints);
      const finePoints = spline.getPoints(64);

      // 2. Build 2D Extruded Shape (from base y=0 up to the mountain ridge curve)
      const shape = new THREE.Shape();
      shape.moveTo(finePoints[0].x, 0);

      // Follow the top mountain contour
      finePoints.forEach(pt => {
        shape.lineTo(pt.x, pt.y);
      });

      // Close back down along bottom edge
      shape.lineTo(finePoints[finePoints.length - 1].x, 0);
      shape.closePath();

      // 3. Extrude Shape in 3D
      const extrudeSettings = {
        depth: sliceThickness,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.012,
        bevelThickness: 0.012
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.center();

      // Double-sided standard material with vibrant sheen
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(series.color),
        roughness: 0.28,
        metalness: 0.14,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Compute bounding box to align bottom precisely at y = 0
      geometry.computeBoundingBox();
      const bbox = geometry.boundingBox;
      const heightOffset = -bbox.min.y;

      mesh.position.set(xOffset, heightOffset, zPos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Store metadata for raycasting & hover interaction
      mesh.userData = {
        series: series,
        index: sIdx,
        baseY: heightOffset,
        baseColor: new THREE.Color(series.color),
        maxVal: Math.max(...series.values),
        avgVal: (series.values.reduce((a, b) => a + b, 0) / series.values.length).toFixed(2)
      };

      // 4. Add luminous crest line along the top ridge
      const lineGeo = new THREE.BufferGeometry();
      const linePositions = [];
      finePoints.forEach(pt => {
        linePositions.push(pt.x, pt.y + 0.005, zPos + sliceThickness / 2 + 0.015);
      });
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

      const lineMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.75,
        linewidth: 2
      });
      const crestLine = new THREE.Line(lineGeo, lineMat);
      this.turntableGroup.add(crestLine);

      this.turntableGroup.add(mesh);
      this.ridgeMeshes.push(mesh);
    });
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.ridgeMeshes, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;

      if (this.hoveredMesh !== hitMesh) {
        this.resetHover();
        this.setHover(hitMesh);
      }

      this.updateTooltip(event, hitMesh.userData);
    } else {
      if (this.hoveredMesh) {
        this.resetHover();
      }
      this.hideTooltip();
    }
  }

  onMouseLeave() {
    this.resetHover();
    this.hideTooltip();
  }

  setHover(mesh) {
    this.hoveredMesh = mesh;
    mesh.position.y = mesh.userData.baseY + 0.12;
    mesh.material.emissive = new THREE.Color(mesh.userData.baseColor).multiplyScalar(0.35);
    this.canvas.style.cursor = 'pointer';
  }

  resetHover() {
    if (this.hoveredMesh) {
      this.hoveredMesh.position.y = this.hoveredMesh.userData.baseY;
      this.hoveredMesh.material.emissive.setHex(0x000000);
      this.hoveredMesh = null;
      this.canvas.style.cursor = 'default';
    }
  }

  updateTooltip(event, data) {
    if (!this.tooltip) return;

    this.tooltip.innerHTML = `
      <div class="tooltip-title-row">
        <div class="tooltip-color-dot" style="background-color: ${data.series.color}; box-shadow: 0 0 10px ${data.series.color};"></div>
        <span class="tooltip-title">${data.series.name}</span>
      </div>
      <div class="tooltip-stat-row">
        <span>Peak Value:</span>
        <b class="tooltip-stat-val">${data.maxVal} ${data.series.unit}</b>
      </div>
      <div class="tooltip-stat-row">
        <span>Monthly Average:</span>
        <b class="tooltip-stat-val">${data.avgVal} ${data.series.unit}</b>
      </div>
    `;

    this.tooltip.style.left = `${event.clientX}px`;
    this.tooltip.style.top = `${event.clientY}px`;
    this.tooltip.classList.add('visible');
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('visible');
    }
  }

  // Camera Presets adapted for compact base plate
  setCameraPreset(name) {
    const presets = {
      isometric: { pos: { x: 0.05, y: 4.3, z: 5.9 }, target: { x: 0.12, y: 0.35, z: 0 } },
      front: { pos: { x: 0.12, y: 1.5, z: 5.9 }, target: { x: 0.12, y: 0.5, z: 0 } },
      side: { pos: { x: -6.0, y: 2.2, z: 0 }, target: { x: 0.12, y: 0.5, z: 0 } },
      top: { pos: { x: 0.12, y: 7.0, z: 0.01 }, target: { x: 0.12, y: 0, z: 0 } }
    };

    const target = presets[name];
    if (!target) return;

    this.animateCameraTo(target.pos, target.target);
  }

  animateCameraTo(targetPos, targetLookAt, duration = 800) {
    const startPos = { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z };
    const startTarget = { x: this.controls.target.x, y: this.controls.target.y, z: this.controls.target.z };
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.x = startPos.x + (targetPos.x - startPos.x) * ease;
      this.camera.position.y = startPos.y + (targetPos.y - startPos.y) * ease;
      this.camera.position.z = startPos.z + (targetPos.z - startPos.z) * ease;

      this.controls.target.x = startTarget.x + (targetLookAt.x - startTarget.x) * ease;
      this.controls.target.y = startTarget.y + (targetLookAt.y - startTarget.y) * ease;
      this.controls.target.z = startTarget.z + (targetLookAt.z - startTarget.z) * ease;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  toggleAutoRotate() {
    this.isAutoRotating = !this.isAutoRotating;
    return this.isAutoRotating;
  }

  resetCamera() {
    this.turntableGroup.rotation.y = 0;
    this.setCameraPreset('isometric');
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (this.isAutoRotating) {
      this.turntableGroup.rotation.y += this.options.autoRotateSpeed;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.Flourish3DViewer = Flourish3DViewer;
