/**
 * Three.js 3D Visual Engine - Dynamic Spatial Edition
 * Features:
 * - Real-time continuous scroll-driven camera flight path
 * - Theme Switcher Engine: Light Studio ⟷ Dark Obsidian ⟷ Cyber AI
 * - 360° Interactive OrbitControls & Geometry Switcher
 * - Reactive mouse physics and particle field dynamics
 */

export class PortfolioScene {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    this.nodes = [];
    this.currentShapeType = 'knot';
    this.isOrbitEnabled = true;
    this.currentTheme = 'light';

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0, rayX: 0, rayY: 0 };
    this.scrollProgress = 0;
    this.targetScrollProgress = 0;

    this.initScene();
    this.createContactShadow();
    this.createAtmosphere();
    this.createAgentConstellation();
    this.setupOrbitControls();
    this.setupEvents();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.fogColor = new THREE.Color(0xf1f5f9);
    this.scene.fog = new THREE.FogExp2(this.fogColor, 0.012);

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 38);
    this.targetCameraLookAt = new THREE.Vector3(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();

    // Studio 4-Point Lighting Rig
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(this.ambientLight);

    // Key Light
    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.keyLight.position.set(22, 28, 25);
    this.keyLight.castShadow = true;
    this.scene.add(this.keyLight);

    // Fill Light
    this.fillLight = new THREE.PointLight(0x60a5fa, 2.5, 90);
    this.fillLight.position.set(-25, -15, 20);
    this.scene.add(this.fillLight);

    // Rim Light
    this.rimLight = new THREE.PointLight(0xa855f7, 2.4, 80);
    this.rimLight.position.set(16, -20, -10);
    this.scene.add(this.rimLight);

    // Top Light
    this.topLight = new THREE.PointLight(0x34d399, 1.8, 70);
    this.topLight.position.set(0, 24, 6);
    this.scene.add(this.topLight);
  }

  createContactShadow() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
    gradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.1)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTexture = new THREE.CanvasTexture(canvas);
    const shadowGeo = new THREE.PlaneGeometry(26, 26);
    this.shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.8
    });

    this.shadowPlane = new THREE.Mesh(shadowGeo, this.shadowMat);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = -10;
    this.scene.add(this.shadowPlane);
  }

  createAtmosphere() {
    const particleCount = 420;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0x2563eb); // Royal Blue
    const c2 = new THREE.Color(0x7c3aed); // Purple
    const c3 = new THREE.Color(0x059669); // Emerald
    const c4 = new THREE.Color(0xd97706); // Amber

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 140;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 120;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 100 - 10;

      const r = Math.random();
      const col = r < 0.35 ? c1 : (r < 0.65 ? c2 : (r < 0.85 ? c3 : c4));
      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    this.particleMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.NormalBlending
    });

    this.particles = new THREE.Points(particleGeo, this.particleMat);
    this.scene.add(this.particles);
  }

  createAgentConstellation(customProjects = [], customSkills = {}) {
    if (this.constellationGroup) {
      this.scene.remove(this.constellationGroup);
    }

    this.constellationGroup = new THREE.Group();
    this.nodes = [];

    // Central Art Piece: PBR Physical Glass Material
    this.coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.2,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transmission: 0.45,
      reflectivity: 0.95
    });

    this.coreGeo = this.getGeometryByType(this.currentShapeType);
    this.coreMesh = new THREE.Mesh(this.coreGeo, this.coreMat);
    this.coreMesh.castShadow = true;
    this.coreMesh.receiveShadow = true;
    this.coreMesh.position.set(0, 0, 0);
    this.constellationGroup.add(this.coreMesh);

    // Orbiting Concentric Glass Rings
    const ringGeo = new THREE.TorusGeometry(6.6, 0.08, 16, 120);
    this.ringMat1 = new THREE.MeshPhysicalMaterial({
      color: 0x2563eb,
      roughness: 0.18,
      metalness: 0.8,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.65
    });
    this.ring1 = new THREE.Mesh(ringGeo, this.ringMat1);
    this.ring1.rotation.x = Math.PI / 3;
    this.constellationGroup.add(this.ring1);

    this.ringMat2 = new THREE.MeshPhysicalMaterial({
      color: 0x7c3aed,
      roughness: 0.18,
      metalness: 0.8,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.55
    });
    this.ring2 = new THREE.Mesh(ringGeo, this.ringMat2);
    this.ring2.rotation.y = Math.PI / 4;
    this.constellationGroup.add(this.ring2);

    // High-End Polished Gemstone Satellites
    const agentSpecs = [
      { name: "Google ADK Orchestrator", category: "Agentic Systems", color: 0x2563eb, pos: [-13, 6, 4], size: 1.4, link: "#projects" },
      { name: "Gemini Enterprise AI", category: "LLM Intelligence", color: 0x7c3aed, pos: [13, 5, 3], size: 1.35, link: "#projects" },
      { name: "Llama 3.2 & Nomic Embed", category: "RAG & Document QA", color: 0x059669, pos: [-11, -7, 5], size: 1.3, link: "#projects" },
      { name: "FAISS + BM25 Hybrid Retrieval", category: "Vector Store", color: 0xd97706, pos: [11, -6, 4], size: 1.3, link: "#projects" },
      { name: "SAP Joule AI & OData Engine", category: "Enterprise Backend", color: 0xdb2777, pos: [0, 11, -3], size: 1.45, link: "#experience" },
      { name: "AWS Solutions Architecture", category: "Cloud Platform", color: 0x0284c7, pos: [0, -11, -2], size: 1.4, link: "#certifications" },
      { name: "PyTorch & Deep Learning", category: "Vision & Models", color: 0xe11d48, pos: [-15, 0, -4], size: 1.25, link: "#projects" },
      { name: "FastAPI Guardrails & Pydantic", category: "API Security", color: 0x0891b2, pos: [15, 0, -4], size: 1.25, link: "#skills" }
    ];

    if (customProjects && customProjects.length > 0) {
      customProjects.forEach((proj, idx) => {
        const angle = (idx / customProjects.length) * Math.PI * 2;
        const radius = 16 + (idx % 2) * 3;
        agentSpecs.push({
          name: proj.title,
          category: proj.badge || "Project Node",
          color: idx % 2 === 0 ? 0x2563eb : 0x7c3aed,
          pos: [Math.cos(angle) * radius, Math.sin(angle) * (radius * 0.7), (Math.random() - 0.5) * 6],
          size: 1.2,
          link: `#proj-${proj.id || idx}`
        });
      });
    }

    agentSpecs.forEach((spec, i) => {
      const nodeObj = this.createGlossyNode(spec, i);
      this.nodes.push(nodeObj);
      this.constellationGroup.add(nodeObj.mesh);
    });

    this.createSmoothRibbons();
    this.scene.add(this.constellationGroup);
  }

  getGeometryByType(type) {
    if (type === 'crystal') {
      return new THREE.IcosahedronGeometry(3.6, 1);
    } else if (type === 'torus') {
      return new THREE.TorusGeometry(3.6, 1.2, 32, 100);
    }
    return new THREE.TorusKnotGeometry(3.2, 0.95, 140, 24, 2, 3);
  }

  switchGeometry(type) {
    this.currentShapeType = type;
    if (this.coreMesh) {
      const newGeo = this.getGeometryByType(type);
      this.coreMesh.geometry.dispose();
      this.coreMesh.geometry = newGeo;
      this.triggerShockwave();
    }
  }

  createGlossyNode(spec, index) {
    const geo = new THREE.SphereGeometry(spec.size, 32, 32);
    const mat = new THREE.MeshPhysicalMaterial({
      color: spec.color,
      roughness: 0.12,
      metalness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.85
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...spec.pos);
    mesh.userData = {
      ...spec,
      initialPos: new THREE.Vector3(...spec.pos),
      orbitSpeed: 0.002 + (index % 4) * 0.001,
      orbitRadius: Math.sqrt(spec.pos[0] * spec.pos[0] + spec.pos[1] * spec.pos[1]),
      angle: Math.atan2(spec.pos[1], spec.pos[0]),
      floatOffset: Math.random() * Math.PI * 2
    };

    const haloGeo = new THREE.TorusGeometry(spec.size * 1.5, 0.04, 12, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: spec.color,
      transparent: true,
      opacity: 0.6
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = Math.PI / 2.5;
    mesh.add(haloMesh);

    return { mesh, spec, haloMesh };
  }

  createSmoothRibbons() {
    const corePos = new THREE.Vector3(0, 0, 0);

    this.nodes.forEach((node, idx) => {
      const midPoint = new THREE.Vector3()
        .addVectors(corePos, node.mesh.position)
        .multiplyScalar(0.5);
      midPoint.z += (idx % 2 === 0 ? 3 : -3);

      const curve = new THREE.QuadraticBezierCurve3(corePos, midPoint, node.mesh.position);
      const points = curve.getPoints(24);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

      const curveMat = new THREE.LineBasicMaterial({
        color: node.spec.color,
        transparent: true,
        opacity: 0.35
      });

      const line = new THREE.Line(curveGeo, curveMat);
      node.ribbonLine = line;
      node.curve = curve;
      this.constellationGroup.add(line);
    });
  }

  setupOrbitControls() {
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.enableZoom = true;
      this.controls.minDistance = 18;
      this.controls.maxDistance = 65;
      this.controls.maxPolarAngle = Math.PI / 1.7;
      this.controls.autoRotate = false;
      this.controls.enabled = this.isOrbitEnabled;

      this.renderer.domElement.style.pointerEvents = 'auto';
    }
  }

  toggleOrbit(enabled) {
    this.isOrbitEnabled = enabled;
    if (this.controls) {
      this.controls.enabled = enabled;
    }
  }

  setTheme(themeName) {
    this.currentTheme = themeName;

    if (themeName === 'dark') {
      this.scene.fog.color.setHex(0x0a0f1d);
      this.ambientLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 1.0;
      this.keyLight.color.setHex(0xffffff);
      this.keyLight.intensity = 2.2;
      this.fillLight.color.setHex(0x38bdf8);
      this.fillLight.intensity = 3.0;
      this.rimLight.color.setHex(0xa855f7);
      this.rimLight.intensity = 3.0;

      if (this.coreMat) {
        this.coreMat.color.setHex(0x0f172a);
        this.coreMat.metalness = 0.85;
        this.coreMat.roughness = 0.15;
        this.coreMat.transmission = 0.3;
      }
      if (this.shadowMat) this.shadowMat.opacity = 0.9;
      if (this.particleMat) this.particleMat.opacity = 0.7;

    } else if (themeName === 'cyber') {
      this.scene.fog.color.setHex(0x04060f);
      this.ambientLight.color.setHex(0x081226);
      this.ambientLight.intensity = 0.8;
      this.keyLight.color.setHex(0x00f0ff);
      this.keyLight.intensity = 2.8;
      this.fillLight.color.setHex(0x00f0ff);
      this.fillLight.intensity = 4.0;
      this.rimLight.color.setHex(0xec4899);
      this.rimLight.intensity = 3.5;

      if (this.coreMat) {
        this.coreMat.color.setHex(0x00f0ff);
        this.coreMat.metalness = 0.9;
        this.coreMat.roughness = 0.1;
        this.coreMat.transmission = 0.2;
      }
      if (this.shadowMat) this.shadowMat.opacity = 0.95;
      if (this.particleMat) this.particleMat.opacity = 0.85;

    } else {
      // Default: Light Studio
      this.scene.fog.color.setHex(0xf1f5f9);
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 1.4;
      this.keyLight.color.setHex(0xffffff);
      this.keyLight.intensity = 2.0;
      this.fillLight.color.setHex(0x60a5fa);
      this.fillLight.intensity = 2.5;
      this.rimLight.color.setHex(0xa855f7);
      this.rimLight.intensity = 2.4;

      if (this.coreMat) {
        this.coreMat.color.setHex(0xffffff);
        this.coreMat.metalness = 0.2;
        this.coreMat.roughness = 0.1;
        this.coreMat.transmission = 0.45;
      }
      if (this.shadowMat) this.shadowMat.opacity = 0.75;
      if (this.particleMat) this.particleMat.opacity = 0.55;
    }

    this.triggerShockwave();
  }

  setupEvents() {
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
  }

  onScroll() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      this.targetScrollProgress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    }
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  onMouseMove(e) {
    this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    this.mouse.rayX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.rayY = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  setSectionWaypoint(sectionId) {
    // When clicking nav buttons, smoothly scroll window which drives the continuous camera flight
    const targetElem = document.getElementById(sectionId);
    if (targetElem) {
      targetElem.scrollIntoView({ behavior: 'smooth' });
    }
  }

  triggerShockwave() {
    if (!this.constellationGroup) return;

    if (window.gsap) {
      window.gsap.fromTo(this.ring1.scale, 
        { x: 1, y: 1, z: 1 }, 
        { x: 2.2, y: 2.2, z: 2.2, duration: 1.0, ease: 'expo.out' }
      );
      window.gsap.fromTo(this.ring2.scale, 
        { x: 1, y: 1, z: 1 }, 
        { x: 2.0, y: 2.0, z: 2.0, duration: 1.2, ease: 'expo.out' }
      );
    }
  }

  updateSceneData(resumeData) {
    this.createAgentConstellation(resumeData.projects, resumeData.skills);
    this.triggerShockwave();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = performance.now() * 0.001;

    // Smoothly interpolate scroll progress for continuous 3D camera travel
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.08;
    const sp = this.scrollProgress;

    // Dynamic 3D Camera Flight Path along scroll:
    // Interpolates through 3D waypoints as user scrolls from top to bottom
    const flightAngle = sp * Math.PI * 2.2;
    const flightRadius = 36 - Math.sin(sp * Math.PI) * 10;
    const flightHeight = Math.sin(sp * Math.PI * 3) * 8 - (sp * 6);

    const targetCamX = Math.sin(flightAngle) * flightRadius;
    const targetCamY = flightHeight;
    const targetCamZ = Math.cos(flightAngle) * flightRadius;

    // Smooth mouse parallax easing
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    if (this.controls && this.controls.enabled && this.controls.state !== -1) {
      this.controls.update();
    } else {
      // Fluid Camera Interpolation
      this.camera.position.x += (targetCamX + this.mouse.x * 3.5 - this.camera.position.x) * 0.06;
      this.camera.position.y += (targetCamY + this.mouse.y * 3.0 - this.camera.position.y) * 0.06;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.06;

      this.camera.lookAt(this.targetCameraLookAt);
    }

    // Kinetic 3D Rotation on Central Sculpture
    if (this.coreMesh) {
      this.coreMesh.rotation.x = time * 0.22 + sp * 4;
      this.coreMesh.rotation.y = time * 0.32 + sp * 5;
    }
    if (this.ring1) {
      this.ring1.rotation.z = time * 0.3 + sp * 3;
      this.ring2.rotation.x = time * -0.25 - sp * 3;
    }

    // Atmospheric Particle Drift
    if (this.particles) {
      this.particles.rotation.y = time * 0.02 + sp * 0.5;
    }

    // Orbit nodes and update ribbons
    const corePos = new THREE.Vector3(0, 0, 0);

    this.nodes.forEach(node => {
      const data = node.mesh.userData;
      data.angle += data.orbitSpeed + (sp * 0.005);
      const floatY = Math.sin(time * 1.4 + data.floatOffset) * 0.7;

      node.mesh.position.x = Math.cos(data.angle) * data.orbitRadius;
      node.mesh.position.y = data.initialPos.y + floatY;
      node.mesh.position.z = Math.sin(data.angle) * (data.orbitRadius * 0.35);

      if (node.haloMesh) {
        node.haloMesh.rotation.z = time * 0.9;
      }

      if (node.ribbonLine) {
        const midPoint = new THREE.Vector3()
          .addVectors(corePos, node.mesh.position)
          .multiplyScalar(0.5);
        midPoint.z += 2.5;

        const curve = new THREE.QuadraticBezierCurve3(corePos, midPoint, node.mesh.position);
        node.ribbonLine.geometry.setFromPoints(curve.getPoints(24));
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}
