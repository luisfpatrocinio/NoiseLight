/**
 * script.js — Lógica Interativa do Projeto NoiseLight
 * Conceito: "Sensory Calm / Neuro-Inclusivo" + Recursos para Feira de Robótica
 * Desenvolvido pelos alunos do 6º Ano A (Projeto InovaCEV) | Orientação: Prof. Luis Felipe Patrocinio
 */

// =============================================================================
// 1. ONDAS ACÚSTICAS SENOIDAIS SUAVES NO FUNDO (#bg-canvas)
// =============================================================================
(function initAcousticWaves() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;
  let dpr = 1;
  let step = 0;
  let animationId = null;
  let isVisible = true;
  let waveMode = 'calm'; // 'calm' | 'chaos'

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', resize);
  resize();

  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden;
    if (isVisible && !animationId) {
      requestAnimationFrame(render);
    }
  });

  const calmLayers = [
    { amplitude: 45, frequency: 0.0035, speed: 0.015, color: 'rgba(163, 193, 173, 0.14)', yOffset: 0.85 },
    { amplitude: 35, frequency: 0.0050, speed: -0.018, color: 'rgba(186, 215, 201, 0.12)', yOffset: 0.88 },
    { amplitude: 55, frequency: 0.0025, speed: 0.010, color: 'rgba(215, 230, 222, 0.18)', yOffset: 0.92 }
  ];

  const chaosLayers = [
    { amplitude: 85, frequency: 0.014, speed: 0.085, color: 'rgba(239, 68, 68, 0.16)', yOffset: 0.72 },
    { amplitude: 70, frequency: 0.020, speed: -0.095, color: 'rgba(245, 158, 11, 0.16)', yOffset: 0.78 },
    { amplitude: 60, frequency: 0.026, speed: 0.110, color: 'rgba(239, 68, 68, 0.12)', yOffset: 0.84 },
    { amplitude: 95, frequency: 0.010, speed: -0.065, color: 'rgba(245, 158, 11, 0.12)', yOffset: 0.88 }
  ];

  window.setWaveChaosMode = function (mode) {
    waveMode = (mode === 'chaos') ? 'chaos' : 'calm';
  };

  function render() {
    if (!isVisible) {
      animationId = null;
      return;
    }

    ctx.clearRect(0, 0, width, height);
    step += 1;

    const layers = (waveMode === 'chaos') ? chaosLayers : calmLayers;

    layers.forEach((w, idx) => {
      ctx.beginPath();
      ctx.fillStyle = w.color;

      const baseY = height * w.yOffset;
      ctx.moveTo(0, height);
      ctx.lineTo(0, baseY);

      for (let x = 0; x <= width; x += 12) {
        const extra = (waveMode === 'chaos')
          ? Math.sin(x * 0.032 - step * 0.12 + idx) * 24
          : 0;
        const y = baseY + Math.sin(x * w.frequency + step * w.speed) * w.amplitude + extra;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    });

    animationId = requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();

// =============================================================================
// 2. MAQUETE 3D DO SEMÁFORO MAKER (Three.js) — MANTIDA INTACTA
// =============================================================================
class NoiseLight3D {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    this.leds = { green: null, yellow: null, red: null };
    this.lights = { green: null, yellow: null, red: null };
    this.wiresGroup = null;
    this.wiresVisible = true;

    this.currentNoise = 5;
    this.blinkCounter = 0;
    this.isBlinking = false;

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 460;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 22, 34);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
      this.controls.minDistance = 14;
      this.controls.maxDistance = 65;
      this.controls.target.set(0, 3, 0);
    }

    const ambientLight = new THREE.AmbientLight(0xfffcf5, 1.25);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8ee, 0.95);
    sunLight.position.set(20, 35, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    this.scene.add(sunLight);

    const softFillLight = new THREE.DirectionalLight(0xe2e8f0, 0.45);
    softFillLight.position.set(-20, 18, -15);
    this.scene.add(softFillLight);

    this.buildScene();

    window.addEventListener('resize', () => this.onResize());

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildScene() {
    const tableGeo = new THREE.CylinderGeometry(30, 32, 2, 64);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0xEDEBE4,
      roughness: 0.85,
      metalness: 0.05
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = -1;
    table.receiveShadow = true;
    this.scene.add(table);

    const grid = new THREE.GridHelper(44, 44, 0xCBD5E1, 0xE2E8F0);
    grid.position.y = 0.02;
    this.scene.add(grid);

    this.buildTrafficLightTower(4.5, 0, -2.5);

    const protoWidth = 20;
    const protoLength = 15;
    const protoGeo = new THREE.BoxGeometry(protoWidth, 1.2, protoLength);
    const protoMat = new THREE.MeshStandardMaterial({
      color: 0xFDFDFD,
      roughness: 0.3,
      metalness: 0.05
    });
    const protoboard = new THREE.Mesh(protoGeo, protoMat);
    protoboard.position.set(-5.5, 0.6, 2.5);
    protoboard.castShadow = true;
    protoboard.receiveShadow = true;
    this.scene.add(protoboard);

    const railBlueGeo = new THREE.BoxGeometry(protoWidth - 2, 0.04, 0.25);
    const railBlueMat = new THREE.MeshBasicMaterial({ color: 0x3B82F6 });
    const railBlue = new THREE.Mesh(railBlueGeo, railBlueMat);
    railBlue.position.set(-5.5, 1.22, 2.5 + protoLength / 2 - 1.2);
    this.scene.add(railBlue);

    const railRedMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
    const railRed = new THREE.Mesh(railBlueGeo, railRedMat);
    railRed.position.set(-5.5, 1.22, 2.5 + protoLength / 2 - 1.7);
    this.scene.add(railRed);

    this.buildEsp32(-7.5, 1.2, 2.5);
    this.buildMax4466(-1.5, 1.2, 2.5);
    this.buildJumperWires();

    this.setNoiseCount(5);
  }

  buildTrafficLightTower(x, y, z) {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(x, y, z);

    const baseGeo = new THREE.BoxGeometry(7, 0.8, 6);
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xE2C29D,
      roughness: 0.75,
      metalness: 0.05
    });
    const base = new THREE.Mesh(baseGeo, woodMat);
    base.position.y = 0.4;
    base.castShadow = true;
    towerGroup.add(base);

    const poleGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 24);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xD4A373, roughness: 0.8 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 3.2, 0);
    pole.castShadow = true;
    towerGroup.add(pole);

    const boxGeo = new THREE.BoxGeometry(4.2, 10.5, 3.2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xC89D7C,
      roughness: 0.85,
      metalness: 0.05
    });
    const body = new THREE.Mesh(boxGeo, bodyMat);
    body.position.set(0, 10, 0);
    body.castShadow = true;
    towerGroup.add(body);

    const faceGeo = new THREE.BoxGeometry(3.9, 10.1, 0.15);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xB58764, roughness: 0.9 });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(0, 10, 1.62);
    towerGroup.add(face);

    const lightConfigs = [
      { key: 'red', yOffset: 12.8, color: 0xEF4444 },
      { key: 'yellow', yOffset: 10.0, color: 0xF59E0B },
      { key: 'green', yOffset: 7.2, color: 0x10B981 }
    ];

    lightConfigs.forEach((cfg) => {
      const pingPongGeo = new THREE.SphereGeometry(1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);

      const mat = new THREE.MeshStandardMaterial({
        color: 0xF1F5F9,
        roughness: 0.35,
        transparent: true,
        opacity: 0.94,
        emissive: 0x000000,
        emissiveIntensity: 0
      });

      const bulb = new THREE.Mesh(pingPongGeo, mat);
      bulb.rotation.x = Math.PI / 2;
      bulb.position.set(0, cfg.yOffset, 1.6);
      towerGroup.add(bulb);

      const bezelGeo = new THREE.TorusGeometry(1.15, 0.15, 16, 32);
      const bezelMat = new THREE.MeshStandardMaterial({ color: 0x8C5E3C, roughness: 0.8 });
      const bezel = new THREE.Mesh(bezelGeo, bezelMat);
      bezel.position.set(0, cfg.yOffset, 1.62);
      towerGroup.add(bezel);

      const pointLight = new THREE.PointLight(cfg.color, 0, 15);
      pointLight.position.set(x, cfg.yOffset, z + 2.5);
      this.scene.add(pointLight);

      this.leds[cfg.key] = mat;
      this.lights[cfg.key] = pointLight;
    });

    this.scene.add(towerGroup);
  }

  buildEsp32(x, y, z) {
    const espGroup = new THREE.Group();
    espGroup.position.set(x, y, z);

    const pcbGeo = new THREE.BoxGeometry(5.4, 0.35, 10.5);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x1E2923, roughness: 0.4 });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.castShadow = true;
    espGroup.add(pcb);

    const shieldGeo = new THREE.BoxGeometry(4.2, 0.5, 5);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xD1D5DB,
      metalness: 0.85,
      roughness: 0.2
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(0, 0.4, -0.6);
    shield.castShadow = true;
    espGroup.add(shield);

    const antGeo = new THREE.BoxGeometry(4.0, 0.08, 1.6);
    const antMat = new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.9, roughness: 0.2 });
    const antenna = new THREE.Mesh(antGeo, antMat);
    antenna.position.set(0, 0.22, -4.1);
    espGroup.add(antenna);

    const usbGeo = new THREE.BoxGeometry(2.2, 1.1, 1.8);
    const usbMat = new THREE.MeshStandardMaterial({ color: 0x9CA3AF, metalness: 0.85, roughness: 0.2 });
    const usb = new THREE.Mesh(usbGeo, usbMat);
    usb.position.set(0, 0.45, 4.9);
    espGroup.add(usb);

    this.scene.add(espGroup);
  }

  buildMax4466(x, y, z) {
    const sensorGroup = new THREE.Group();
    sensorGroup.position.set(x, y, z);

    const pcbGeo = new THREE.BoxGeometry(3.4, 0.25, 3.6);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x581C87, roughness: 0.4 });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.castShadow = true;
    sensorGroup.add(pcb);

    const micGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.95, 24);
    const micMat = new THREE.MeshStandardMaterial({ color: 0xD1D5DB, metalness: 0.85, roughness: 0.2 });
    const mic = new THREE.Mesh(micGeo, micMat);
    mic.position.set(0, 0.55, 0.6);
    sensorGroup.add(mic);

    const micTopGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.08, 24);
    const micTopMat = new THREE.MeshBasicMaterial({ color: 0x18181B });
    const micTop = new THREE.Mesh(micTopGeo, micTopMat);
    micTop.position.set(0, 1.05, 0.6);
    sensorGroup.add(micTop);

    const trimGeo = new THREE.BoxGeometry(0.9, 0.5, 0.9);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.7 });
    const trimpot = new THREE.Mesh(trimGeo, trimMat);
    trimpot.position.set(0, 0.35, -0.9);
    sensorGroup.add(trimpot);

    this.scene.add(sensorGroup);
  }

  buildJumperWires() {
    this.wiresGroup = new THREE.Group();

    const wiresData = [
      { start: [-5.0, 1.4, 0.5], end: [-1.5, 1.3, 4.0], color: 0xEF4444, height: 3.5 },
      { start: [-5.0, 1.4, 1.2], end: [-1.5, 1.3, 4.0], color: 0x374151, height: 3.0 },
      { start: [-5.0, 1.4, 2.6], end: [-0.7, 1.3, 4.0], color: 0xF97316, height: 4.0 },
      { start: [-5.0, 1.4, 4.7], end: [3.2, 7.2, -1.0], color: 0x10B981, height: 5.5 },
      { start: [-5.0, 1.4, 5.4], end: [3.2, 10.0, -1.0], color: 0xF59E0B, height: 6.5 },
      { start: [-5.0, 1.4, 6.1], end: [3.2, 12.8, -1.0], color: 0x8B5CF6, height: 7.5 }
    ];

    wiresData.forEach(w => {
      const mid = [
        (w.start[0] + w.end[0]) / 2,
        Math.max(w.start[1], w.end[1]) + (w.height || 3.0),
        (w.start[2] + w.end[2]) / 2
      ];

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...w.start),
        new THREE.Vector3(...mid),
        new THREE.Vector3(...w.end)
      );

      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.12, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: w.color,
        roughness: 0.5,
        metalness: 0.1
      });

      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      tubeMesh.castShadow = true;
      this.wiresGroup.add(tubeMesh);
    });

    this.scene.add(this.wiresGroup);
  }

  toggleWires(show) {
    if (typeof show === 'boolean') {
      this.wiresVisible = show;
    } else {
      this.wiresVisible = !this.wiresVisible;
    }

    if (this.wiresGroup) {
      this.wiresGroup.visible = this.wiresVisible;
    }
    return this.wiresVisible;
  }

  setNoiseCount(count) {
    this.currentNoise = count;

    if (count < 15) {
      this.setLedState('green', true);
      this.setLedState('yellow', false);
      this.setLedState('red', false);
      this.isBlinking = false;
    } else if (count >= 15 && count < 46) {
      this.setLedState('green', false);
      this.setLedState('yellow', true);
      this.setLedState('red', false);
      this.isBlinking = false;
    } else {
      this.setLedState('green', false);
      this.setLedState('yellow', false);
      this.isBlinking = true;
    }
  }

  setLedState(color, state) {
    const mat = this.leds[color];
    const light = this.lights[color];
    if (!mat || !light) return;

    if (state) {
      const hexColor = (color === 'green') ? 0x10B981 : (color === 'yellow') ? 0xF59E0B : 0xEF4444;
      mat.color.setHex(hexColor);
      mat.emissive.setHex(hexColor);
      mat.emissiveIntensity = 1.45;
      light.intensity = 3.2;
    } else {
      mat.color.setHex(0xF1F5F9);
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
      light.intensity = 0;
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (this.controls) {
      this.controls.update();
    }

    if (this.isBlinking) {
      this.blinkCounter = (this.blinkCounter + 1) % 20;
      const shouldLight = this.blinkCounter < 10;
      this.setLedState('red', shouldLight);
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || 360;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

// =============================================================================
// 3. CONTROLADOR GERAL (Web Audio API, Calibração da Feira, Modo Estande, TEA)
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  const sim3d = new NoiseLight3D('canvas-3d-box');

  let currentNoise = 5;
  let fairOffset = 0;
  let isListeningMic = false;
  let audioContext = null;
  let analyser = null;
  let micStream = null;

  // Elementos do DOM
  const viewportBox = document.getElementById('canvas-3d-box');
  const slider = document.getElementById('noise-slider');
  const noiseValueDisplay = document.getElementById('noise-val');
  const fairOffsetSlider = document.getElementById('fair-offset-slider');
  const fairOffsetDisplay = document.getElementById('fair-offset-val');
  const statusBadge = document.getElementById('status-badge');
  const statusDesc = document.getElementById('status-desc');
  const btnMic = document.getElementById('btn-mic');
  const btnToggleWires = document.getElementById('btn-toggle-wires');
  const presetBtns = document.querySelectorAll('.btn-preset');

  // Modo Estande (Tela Cheia)
  const btnStandMode = document.getElementById('btn-stand-mode');
  const section3d = document.getElementById('secao-3d');

  // Experiência TEA
  const btnTeaExp = document.getElementById('btn-tea-experience');
  const teaOverlay = document.getElementById('tea-overlay');
  const teaModal = document.getElementById('tea-modal');
  const teaBadge = document.getElementById('tea-modal-badge');
  const teaTitle = document.getElementById('tea-modal-title');
  const teaContent = document.getElementById('tea-dynamic-content');
  const teaProgress = document.getElementById('tea-progress-bar');
  const btnTeaClose = document.getElementById('btn-tea-close');

  // Abas do Código
  const codeTabs = document.querySelectorAll('.code-tab-btn');
  const codeDisplay = document.getElementById('code-display');
  const codeExplanation = document.getElementById('code-explanation-text');
  const btnCopyCode = document.getElementById('btn-copy-code');

  function updateNoiseLevel(value, source = 'slider') {
    let parsed = parseInt(value, 10);
    if (isNaN(parsed)) parsed = 0;

    // Quando vem do Microfone Real, aplica o Offset de Calibração do Ruído da Feira
    if (source === 'mic') {
      currentNoise = Math.max(0, Math.min(70, parsed - fairOffset));
    } else {
      currentNoise = Math.max(0, Math.min(70, parsed));
    }

    if (source !== 'slider' && slider) {
      slider.value = currentNoise;
    }
    if (noiseValueDisplay) {
      const approxDb = 42 + Math.round(currentNoise * 0.65);
      noiseValueDisplay.innerText = `${approxDb} dB (nível ${currentNoise})`;
    }

    if (sim3d) {
      sim3d.setNoiseCount(currentNoise);
    }

    // Atualiza Status Badge e Auréola Visual Dinâmica
    if (viewportBox) {
      viewportBox.classList.remove('halo-green', 'halo-yellow', 'halo-red');
    }

    if (currentNoise < 15) {
      statusBadge.innerHTML = '🟢 Silêncio (Conforto Acústico)';
      statusBadge.className = 'overlay-status status-green';
      statusDesc.innerText = 'Volume calmo e seguro (< 60 dB). Ideal para concentração, leitura e bem-estar sensorial.';
      if (viewportBox) viewportBox.classList.add('halo-green');
    } else if (currentNoise >= 15 && currentNoise < 46) {
      statusBadge.innerHTML = '🟡 Atenção (Conversas)';
      statusBadge.className = 'overlay-status status-yellow';
      statusDesc.innerText = 'Trabalho em grupo (60 a 70 dB). Ponto de equilíbrio para que todos conversem sem elevar a voz.';
      if (viewportBox) viewportBox.classList.add('halo-yellow');
    } else {
      statusBadge.innerHTML = '🔴 Alerta (Sobrecarga Sonora)';
      statusBadge.className = 'overlay-status status-red';
      statusDesc.innerText = 'Barulho excessivo (> 70 dB). Risco de sobrecarga sensorial para colegas atípicos. O LED pisca!';
      if (viewportBox) viewportBox.classList.add('halo-red');
    }
  }

  // Slider Manual de Ruído
  if (slider) {
    slider.addEventListener('input', (e) => {
      presetBtns.forEach(b => b.classList.remove('active'));
      updateNoiseLevel(e.target.value, 'slider');
    });
  }

  // Slider de Calibração de Ruído da Feira (Offset)
  if (fairOffsetSlider) {
    fairOffsetSlider.addEventListener('input', (e) => {
      fairOffset = parseInt(e.target.value, 10) || 0;
      if (fairOffsetDisplay) {
        fairOffsetDisplay.innerText = `+${fairOffset} pts`;
      }
    });
  }

  // Presets de Cenários Escolares
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.dataset.value;
      updateNoiseLevel(val, 'preset');
    });
  });

  // Toggle de Fiação
  if (btnToggleWires) {
    btnToggleWires.addEventListener('click', () => {
      if (!sim3d) return;
      const isVisible = sim3d.toggleWires();
      if (isVisible) {
        btnToggleWires.classList.add('active');
        btnToggleWires.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          <span>Fiações: Visíveis (Clique para Ocultar)</span>
        `;
      } else {
        btnToggleWires.classList.remove('active');
        btnToggleWires.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <span>🔌 Revelar Fiações da Montagem</span>
        `;
      }
    });
  }

  // Microfone Real (Web Audio API)
  if (btnMic) {
    btnMic.addEventListener('click', async () => {
      if (!isListeningMic) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(micStream);
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          isListeningMic = true;
          btnMic.classList.add('listening');
          btnMic.innerHTML = '🛑 Parar Microfone';

          listenAudioLoop();
        } catch (err) {
          alert('Não foi possível acessar o microfone: ' + err.message);
        }
      } else {
        stopMicrophone();
      }
    });
  }

  function stopMicrophone() {
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
    }
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }
    isListeningMic = false;
    if (btnMic) {
      btnMic.classList.remove('listening');
      btnMic.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="22"></line>
        </svg>
        <span>🎙️ Testar com Minha Voz (Microfone Real)</span>
      `;
    }
  }

  function listenAudioLoop() {
    if (!isListeningMic || !analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;

    // Escala ampliada até 115 para comportar a subtração do fairOffset (até 45) em ginásio barulhento
    let rawSimulated = 0;
    if (average > 6) {
      rawSimulated = Math.min(115, Math.floor((average - 6) * 1.65));
    }

    updateNoiseLevel(rawSimulated, 'mic');
    requestAnimationFrame(listenAudioLoop);
  }

  // ===========================================================================
  // 4. MODO ESTANDE (TELA CHEIA) & RETORNO AUTOMÁTICO POR INATIVIDADE (45s)
  // ===========================================================================
  if (btnStandMode) {
    btnStandMode.addEventListener('click', async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          if (section3d) {
            section3d.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          await document.exitFullscreen();
        }
      } catch (err) {
        console.warn('Fullscreen não disponível:', err);
      }
    });

    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        btnStandMode.classList.add('active');
        btnStandMode.innerHTML = '📺 Sair do Modo Estande';
      } else {
        btnStandMode.classList.remove('active');
        btnStandMode.innerHTML = '📺 Modo Estande (Tela Cheia)';
      }
      if (sim3d) {
        setTimeout(() => sim3d.onResize(), 200);
      }
    });
  }

  // Retorno automático ao Simulador 3D após 45s de inatividade (apenas Desktop >= 1024px)
  let inactivityTimer = null;
  function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (window.innerWidth < 1024) return;

    inactivityTimer = setTimeout(() => {
      if (window.innerWidth >= 1024 && section3d) {
        const rect = section3d.getBoundingClientRect();
        const isOutOfView = rect.top < -120 || rect.top > window.innerHeight * 0.6;
        if (isOutOfView) {
          section3d.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 45000);
  }

  ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });
  resetInactivityTimer();

  // ===========================================================================
  // 5. EXPERIÊNCIA "🎧 SENTIR NA PELE (PERSPECTIVA TEA)" (6 SEGUNDOS)
  // ===========================================================================
  let teaTimers = [];

  function clearTeaTimers() {
    teaTimers.forEach(id => clearTimeout(id));
    teaTimers = [];
  }

  function closeTeaExperience() {
    clearTeaTimers();
    if (teaOverlay) teaOverlay.classList.remove('active');
    if (window.setWaveChaosMode) window.setWaveChaosMode('calm');
  }

  if (btnTeaExp && teaOverlay) {
    btnTeaExp.addEventListener('click', () => {
      clearTeaTimers();

      // Fase 1: Sobrecarga Sensorial (0s -> 6s)
      teaModal.classList.remove('phase-calm');
      teaModal.classList.add('phase-overload');
      teaBadge.innerText = '⚠️ Sobrecarga Auditiva (6 segundos)';
      teaTitle.innerText = 'Como múltiplos ruídos fragmentam o foco';
      teaProgress.style.width = '0%';
      teaContent.innerHTML = `
        <div class="noise-fragment-chip">🪑 Cadeira arrastando (74 dB)</div>
      `;

      teaOverlay.classList.add('active');
      if (window.setWaveChaosMode) window.setWaveChaosMode('chaos');

      // Animação progressiva dos estímulos simultâneos durante 6 segundos
      const steps = [
        { delay: 900, pct: '20%', html: '<div class="noise-fragment-chip">🗣️ 5 conversas cruzadas ao mesmo tempo</div>' },
        { delay: 2000, pct: '42%', html: '<div class="noise-fragment-chip">✏️ Estojo caindo no chão (81 dB!)</div>' },
        { delay: 3200, pct: '66%', html: '<div class="noise-fragment-chip">📢 Eco nas paredes da sala de aula</div>' },
        { delay: 4400, pct: '85%', html: '<div class="noise-fragment-chip">🧠 Cérebro sobrecarregado: impossível ler ou focar</div>' }
      ];

      steps.forEach(st => {
        teaTimers.push(setTimeout(() => {
          teaProgress.style.width = st.pct;
          teaContent.insertAdjacentHTML('beforeend', st.html);
        }, st.delay));
      });

      // Fase 2: Atuação do Semáforo do Barulho (aos 6s -> restaura calma visual)
      teaTimers.push(setTimeout(() => {
        teaProgress.style.width = '100%';
        teaModal.classList.remove('phase-overload');
        teaModal.classList.add('phase-calm');
        teaBadge.innerText = '🟢 Semáforo do Barulho em Ação';
        teaTitle.innerText = 'A calma visual retorna sem nenhum grito';
        if (window.setWaveChaosMode) window.setWaveChaosMode('calm');

        // Atualiza a maquete 3D para verde silencioso
        presetBtns.forEach(b => b.classList.remove('active'));
        if (presetBtns[0]) presetBtns[0].classList.add('active');
        updateNoiseLevel(5, 'preset');

        teaContent.innerHTML = `
          <div class="tea-calm-message">
            🚦 O Semáforo acendeu o alerta visual e toda a turma reduziu o volume.<br>
            <span style="font-weight:400; font-size:0.88rem; display:block; margin-top:0.4rem;">
              O conforto acústico voltou, a mente respira aliviada e todos conseguem aprender juntos.
            </span>
          </div>
        `;
      }, 6000));
    });
  }

  if (btnTeaClose) {
    btnTeaClose.addEventListener('click', closeTeaExperience);
  }
  if (teaOverlay) {
    teaOverlay.addEventListener('click', (e) => {
      if (e.target === teaOverlay) closeTeaExperience();
    });
  }

  // ===========================================================================
  // 6. ABAS INTERATIVAS DO CÓDIGO-FONTE
  // ===========================================================================
  const codeDatabase = {
    complete: {
      code: `<span class="hl-com">// --- CÓDIGO COMPLETO DO FIRMWARE (src/main.cpp) ---</span>
<span class="hl-pp">#include</span> <span class="hl-str">&lt;Arduino.h&gt;</span>

<span class="hl-kw">const</span> <span class="hl-type">int</span> PINO_SENSOR_SOM   = <span class="hl-num">4</span>;  <span class="hl-com">// OUT do MAX4466 (Entrada Analógica D4)</span>
<span class="hl-kw">const</span> <span class="hl-type">int</span> PINO_LED_VERDE     = <span class="hl-num">18</span>; <span class="hl-com">// LED 10mm Verde (D18)</span>
<span class="hl-kw">const</span> <span class="hl-type">int</span> PINO_LED_AMARELO   = <span class="hl-num">19</span>; <span class="hl-com">// LED 10mm Amarelo (D19)</span>
<span class="hl-kw">const</span> <span class="hl-type">int</span> PINO_LED_VERMELHO  = <span class="hl-num">21</span>; <span class="hl-com">// LED 10mm Vermelho (D21)</span>

<span class="hl-type">int</span> limiarAmarelo  = <span class="hl-num">900</span>;  <span class="hl-com">// Acima deste valor passa para Amarelo</span>
<span class="hl-type">int</span> limiarVermelho = <span class="hl-num">2200</span>; <span class="hl-com">// Acima deste valor passa para Vermelho</span>

<span class="hl-type">void</span> <span class="hl-func">setup</span>() {
  <span class="hl-func">Serial</span>.<span class="hl-func">begin</span>(<span class="hl-num">115200</span>);
  <span class="hl-func">analogReadResolution</span>(<span class="hl-num">12</span>); <span class="hl-com">// ADC do ESP32: 0 a 4095</span>
  <span class="hl-func">analogSetPinAttenuation</span>(PINO_SENSOR_SOM, <span class="hl-const">ADC_11db</span>);

  <span class="hl-func">pinMode</span>(PINO_LED_VERDE, <span class="hl-const">OUTPUT</span>);
  <span class="hl-func">pinMode</span>(PINO_LED_AMARELO, <span class="hl-const">OUTPUT</span>);
  <span class="hl-func">pinMode</span>(PINO_LED_VERMELHO, <span class="hl-const">OUTPUT</span>);
}

<span class="hl-type">void</span> <span class="hl-func">loop</span>() {
  <span class="hl-com">// Amostragem Pico-a-Pico durante 50ms</span>
  <span class="hl-type">int</span> amplitude = <span class="hl-func">medirAmplitudePicoAPico</span>(<span class="hl-num">50</span>);
  <span class="hl-func">atualizarSemaforo</span>(amplitude);
}`,
      explanation: 'Este é o firmware completo gravado no ESP32. Ele configura o conversor analógico-digital (ADC) para ler o microfone analógico MAX4466 no pino D4 e aciona os LEDs difusores de 10mm nos pinos D18, D19 e D21.'
    },

    sampling: {
      code: `<span class="hl-com">// --- LEITURA DO MAX4466 (PICO-A-PICO) ---</span>
<span class="hl-type">int</span> <span class="hl-func">medirAmplitudePicoAPico</span>(<span class="hl-type">unsigned long</span> duracaoMs) {
  <span class="hl-type">unsigned long</span> tempoInicio = <span class="hl-func">millis</span>();
  <span class="hl-type">int</span> valorMin = <span class="hl-num">4095</span>;
  <span class="hl-type">int</span> valorMax = <span class="hl-num">0</span>;

  <span class="hl-com">// Lê a onda de som continuamente durante 50 milissegundos</span>
  <span class="hl-kw">while</span> (<span class="hl-func">millis</span>() - tempoInicio &lt; duracaoMs) {
    <span class="hl-type">int</span> leitura = <span class="hl-func">analogRead</span>(PINO_SENSOR_SOM);
    <span class="hl-kw">if</span> (leitura &gt; valorMax) valorMax = leitura;
    <span class="hl-kw">if</span> (leitura &lt; valorMin) valorMin = leitura;
  }

  <span class="hl-com">// Amplitude = diferença entre a crista mais alta e o vale mais baixo</span>
  <span class="hl-kw">return</span> (valorMax - valorMin);
}`,
      explanation: 'O módulo MAX4466 entrega uma onda analógica contínua. Durante 50ms, o ESP32 mede repetidamente a onda e calcula a amplitude Pico a Pico (Valor Máximo - Valor Mínimo). Em silêncio, a amplitude é muito baixa (~100). Ao falar ou gritar, a onda oscila com força e a amplitude passa de 2000!'
    },

    decision: {
      code: `<span class="hl-com">// --- LÓGICA DE DECISÃO DO SEMÁFORO ---</span>
<span class="hl-type">void</span> <span class="hl-func">atualizarSemaforo</span>(<span class="hl-type">int</span> amplitude) {
  <span class="hl-type">unsigned long</span> agora = <span class="hl-func">millis</span>();

  <span class="hl-com">// Se atingiu o nível crítico, ativa a retenção temporária (Peak Hold)</span>
  <span class="hl-kw">if</span> (amplitude &gt;= limiarVermelho) {
    ultimoTempoVermelho = agora;
  }

  <span class="hl-com">// Mantém no vermelho por 1,5s para não oscilar a cada pausa de voz</span>
  <span class="hl-kw">if</span> (agora - ultimoTempoVermelho &lt; <span class="hl-num">1500</span>) {
    <span class="hl-func">alertarVermelhoPiscando</span>();
  } 
  <span class="hl-kw">else if</span> (amplitude &gt;= limiarAmarelo) {
    <span class="hl-func">acenderSomenteAmarelo</span>();
  } 
  <span class="hl-kw">else</span> {
    <span class="hl-func">acenderSomenteVerde</span>();
  }
}`,
      explanation: 'Aqui o ESP32 atua como o juiz visual da sala. Usando condicionais (if / else if / else), ele compara a amplitude sonora com os limiares. O "Peak Hold" de 1,5 segundo garante que se alguém grita, o vermelho permanece ativo tempo suficiente para a turma se autorregular.'
    },

    nonblocking: {
      code: `<span class="hl-com">// --- ALERTA PISCANTE NÃO-BLOQUEANTE ---</span>
<span class="hl-type">void</span> <span class="hl-func">alertarVermelhoPiscando</span>() {
  <span class="hl-func">digitalWrite</span>(PINO_LED_VERDE, <span class="hl-const">LOW</span>);
  <span class="hl-func">digitalWrite</span>(PINO_LED_AMARELO, <span class="hl-const">LOW</span>);

  <span class="hl-com">// Pisca o LED Vermelho a cada 120ms sem usar delay()</span>
  <span class="hl-type">unsigned long</span> agora = <span class="hl-func">millis</span>();
  <span class="hl-kw">if</span> (agora - ultimoPiscaVermelho &gt;= <span class="hl-num">120</span>) {
    ultimoPiscaVermelho = agora;
    estadoPiscaVermelho = !estadoPiscaVermelho;
    <span class="hl-func">digitalWrite</span>(PINO_LED_VERMELHO, estadoPiscaVermelho ? <span class="hl-const">HIGH</span> : <span class="hl-const">LOW</span>);
  }
}`,
      explanation: 'Para piscar o LED vermelho de alerta estroboscópico sem travar o processamento do ESP32, usamos a função millis() em vez de delay(). Isso permite que o microcontrolador continue medindo o som do microfone em segundo plano sem qualquer interrupção!'
    }
  };

  codeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      codeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const snippetKey = tab.dataset.snippet;
      const snippet = codeDatabase[snippetKey];
      if (snippet) {
        codeDisplay.innerHTML = snippet.code;
        codeExplanation.innerHTML = snippet.explanation;
      }
    });
  });

  if (btnCopyCode) {
    btnCopyCode.addEventListener('click', () => {
      const tempElement = document.createElement('textarea');
      tempElement.value = codeDisplay.innerText;
      document.body.appendChild(tempElement);
      tempElement.select();
      document.execCommand('copy');
      document.body.removeChild(tempElement);

      const originalText = btnCopyCode.innerHTML;
      btnCopyCode.innerHTML = '✅ Copiado!';
      setTimeout(() => {
        btnCopyCode.innerHTML = originalText;
      }, 2000);
    });
  }

  // ===========================================================================
  // 7. QUIZ RELÂMPAGO DE REVISÃO (GUIA DE ESTUDOS)
  // ===========================================================================
  const quizQuestions = [
    {
      q: '1. O que o módulo microfone MAX4466 envia para o pino D4 (GPIO 4) do ESP32?',
      options: [
        'Um sinal analógico contínuo que varia conforme a onda sonora',
        'Apenas uma mensagem de texto via Wi-Fi com os decibéis',
        'Uma corrente de 220 Volts direto da tomada',
        'Apenas um pulso fixo sem variação de intensidade'
      ],
      correct: 0,
      explain: 'Isso mesmo! O MAX4466 é um microfone analógico pré-amplificado: sua saída OUT oscila entre 0V e 3,3V (centrada em 1,65V) acompanhando as vibrações reais da voz.'
    },
    {
      q: '2. Para que servem os resistores de 220 Ω ligados em série com os LEDs de 10mm?',
      options: [
        'Para amplificar o som que sai dos LEDs',
        'Para limitar a corrente elétrica e evitar que os LEDs e o ESP32 queimem',
        'Para mudar a cor do LED de verde para vermelho',
        'Para conectar o ESP32 à internet da escola'
      ],
      correct: 1,
      explain: 'Perfeito! Pela Lei de Ohm (I = V / R), o resistor absorve a diferença entre os 3,3V do ESP32 e os ~2,0V do LED, mantendo a corrente elétrica segura (~6 a 10 mA).'
    },
    {
      q: '3. Como o código calcula o volume do barulho durante os 50 milissegundos de leitura?',
      options: [
        'Lê apenas uma única vez por minuto',
        'Conta quantas pessoas estão falando pelo Bluetooth',
        'Calcula a amplitude Pico-a-Pico (Maior Pico − Menor Vale da onda)',
        'Mede a temperatura do chip do ESP32'
      ],
      correct: 2,
      explain: 'Exato! Como a onda sonora sobe e desce rapidamente, o ESP32 coleta o máximo e o mínimo durante 50 ms e calcula a amplitude Pico-a-Pico.'
    },
    {
      q: '4. Por que usamos meias bolinhas de ping-pong nos LEDs e millis() para piscar o vermelho?',
      options: [
        'Para deixar a luz suave (difusor) e piscar o alerta sem travar a leitura do som',
        'Porque o código só funciona com bolinhas de plástico',
        'Para gastar mais bateria e travar o microfone durante 1 segundo',
        'Apenas para esconder os fios dentro das bolinhas'
      ],
      correct: 0,
      explain: 'Mandou bem! As bolinhas difundem a luz para não agredir olhos sensíveis, e o millis() permite piscar o vermelho sem congelar o processador como o delay() faria.'
    }
  ];

  const quizProgressLabel = document.getElementById('quiz-progress-label');
  const quizScoreBadge = document.getElementById('quiz-score-badge');
  const quizQuestionText = document.getElementById('quiz-question-text');
  const quizOptionsEl = document.getElementById('quiz-options');
  const quizFeedbackEl = document.getElementById('quiz-feedback');
  const btnQuizNext = document.getElementById('btn-quiz-next');

  let quizIndex = 0;
  let quizScore = 0;

  function renderQuizQuestion() {
    if (!quizQuestionText || !quizOptionsEl) return;
    const item = quizQuestions[quizIndex];

    quizProgressLabel.innerText = `Pergunta ${quizIndex + 1} de ${quizQuestions.length}`;
    quizScoreBadge.innerText = `Acertos: ${quizScore}`;
    quizQuestionText.innerText = item.q;
    quizFeedbackEl.className = 'quiz-feedback';
    quizFeedbackEl.innerText = '';
    btnQuizNext.classList.remove('show');
    quizOptionsEl.innerHTML = '';

    item.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quiz-option-btn';
      btn.innerText = optText;
      btn.addEventListener('click', () => handleQuizAnswer(idx, btn));
      quizOptionsEl.appendChild(btn);
    });
  }

  function handleQuizAnswer(selectedIdx, clickedBtn) {
    const item = quizQuestions[quizIndex];
    const allBtns = quizOptionsEl.querySelectorAll('.quiz-option-btn');
    allBtns.forEach((b, i) => {
      b.disabled = true;
      if (i === item.correct) {
        b.classList.add('is-correct');
      }
    });

    if (selectedIdx === item.correct) {
      quizScore += 1;
      quizScoreBadge.innerText = `Acertos: ${quizScore}`;
      quizFeedbackEl.className = 'quiz-feedback show ok';
      quizFeedbackEl.innerText = '✅ ' + item.explain;
    } else {
      clickedBtn.classList.add('is-wrong');
      quizFeedbackEl.className = 'quiz-feedback show err';
      quizFeedbackEl.innerText = '💡 Quase lá! ' + item.explain;
    }

    if (quizIndex < quizQuestions.length - 1) {
      btnQuizNext.innerHTML = 'Próxima Pergunta &rarr;';
    } else {
      btnQuizNext.innerHTML = '🔄 Ver Resultado &amp; Refazer';
    }
    btnQuizNext.classList.add('show');
  }

  if (btnQuizNext) {
    btnQuizNext.addEventListener('click', () => {
      if (quizIndex < quizQuestions.length - 1) {
        quizIndex += 1;
        renderQuizQuestion();
      } else {
        quizIndex = 0;
        quizScore = 0;
        renderQuizQuestion();
      }
    });
  }

  renderQuizQuestion();

  updateNoiseLevel(5, 'init');
});
