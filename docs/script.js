/**
 * script.js — Lógica Interativa do Projeto NoiseLight
 * Conceito: "Sensory Calm / Neuro-Inclusivo" para Feira de Ciências do 6º Ano A
 * Desenvolvido por alunos do 6º Ano A (InovaCEV) | Orientação: Prof. Luis Felipe Patrocinio
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

  // Configuração das camadas de ondas senoidais sálvia/azul sereno
  const waveLayers = [
    { amplitude: 45, frequency: 0.0035, speed: 0.015, color: 'rgba(163, 193, 173, 0.14)', yOffset: 0.85 },
    { amplitude: 35, frequency: 0.0050, speed: -0.018, color: 'rgba(186, 215, 201, 0.12)', yOffset: 0.88 },
    { amplitude: 55, frequency: 0.0025, speed: 0.010, color: 'rgba(215, 230, 222, 0.18)', yOffset: 0.92 }
  ];

  function render() {
    if (!isVisible) {
      animationId = null;
      return;
    }

    ctx.clearRect(0, 0, width, height);
    step += 1;

    waveLayers.forEach((w) => {
      ctx.beginPath();
      ctx.fillStyle = w.color;

      const baseY = height * w.yOffset;
      ctx.moveTo(0, height);
      ctx.lineTo(0, baseY);

      for (let x = 0; x <= width; x += 12) {
        const y = baseY + Math.sin(x * w.frequency + step * w.speed) * w.amplitude;
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
// 2. MAQUETE 3D DO SEMÁFORO MAKER (Three.js)
// =============================================================================
class NoiseLight3D {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Componentes e Iluminações
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
    // 1. Cena
    this.scene = new THREE.Scene();

    // 2. Câmera
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 460;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 22, 34);

    // 3. Renderer com fundo transparente integrado ao tema claro
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
      this.controls.minDistance = 14;
      this.controls.maxDistance = 65;
      this.controls.target.set(0, 3, 0);
    }

    // 5. Iluminação Acolhedora de Sala de Aula (Luz do dia quente)
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

    // 6. Construir a Maquete Maker da Feira de Ciências
    this.buildScene();

    // 7. Eventos
    window.addEventListener('resize', () => this.onResize());

    // 8. Loop de Animação
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildScene() {
    // A. Mesa da Feira de Ciências (Madeira Clara Suave / MDF)
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

    // Linhas sutis de grid técnico na bancada
    const grid = new THREE.GridHelper(44, 44, 0xCBD5E1, 0xE2E8F0);
    grid.position.y = 0.02;
    this.scene.add(grid);

    // B. Semáforo Maker (Papelão Kraft / MDF cortado a laser + Difusores de Ping-Pong)
    this.buildTrafficLightTower(4.5, 0, -2.5);

    // C. Protoboard Educacional
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

    // Barramento Negativo / GND (Azul)
    const railBlueGeo = new THREE.BoxGeometry(protoWidth - 2, 0.04, 0.25);
    const railBlueMat = new THREE.MeshBasicMaterial({ color: 0x3B82F6 });
    const railBlue = new THREE.Mesh(railBlueGeo, railBlueMat);
    railBlue.position.set(-5.5, 1.22, 2.5 + protoLength / 2 - 1.2);
    this.scene.add(railBlue);

    // Barramento Positivo / 3V3 (Vermelho)
    const railRedMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 });
    const railRed = new THREE.Mesh(railBlueGeo, railRedMat);
    railRed.position.set(-5.5, 1.22, 2.5 + protoLength / 2 - 1.7);
    this.scene.add(railRed);

    // D. ESP32 DevKit V1 (Lado do 3V3 encaixado na protoboard)
    this.buildEsp32(-7.5, 1.2, 2.5);

    // E. Módulo Microfone MAX4466 (com pré-amplificador e trimpot)
    this.buildMax4466(-1.5, 1.2, 2.5);

    // F. Fiações / Cabos Jumpers
    this.buildJumperWires();

    // Estado inicial
    this.setNoiseCount(5);
  }

  buildTrafficLightTower(x, y, z) {
    const towerGroup = new THREE.Group();
    towerGroup.position.set(x, y, z);

    // 1. Base do Semáforo (Madeira Clara / MDF)
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

    // 2. Haste / Poste do Semáforo
    const poleGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 24);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xD4A373, roughness: 0.8 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 3.2, 0);
    pole.castShadow = true;
    towerGroup.add(pole);

    // 3. Gabinete do Semáforo (Papelão Kraft / MDF cortado a laser)
    const boxGeo = new THREE.BoxGeometry(4.2, 10.5, 3.2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xC89D7C, // Papelão Kraft / Madeira Cortada a Laser
      roughness: 0.85,
      metalness: 0.05
    });
    const body = new THREE.Mesh(boxGeo, bodyMat);
    body.position.set(0, 10, 0);
    body.castShadow = true;
    towerGroup.add(body);

    // Placa de acabamento frontal da caixa
    const faceGeo = new THREE.BoxGeometry(3.9, 10.1, 0.15);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xB58764, roughness: 0.9 });
    const face = new THREE.Mesh(faceGeo, faceMat);
    face.position.set(0, 10, 1.62);
    towerGroup.add(face);

    // 4. As 3 Luzes com Difusor de Bolinha de Ping-Pong Translúcida
    const lightConfigs = [
      { key: 'red', yOffset: 12.8, color: 0xEF4444 },
      { key: 'yellow', yOffset: 10.0, color: 0xF59E0B },
      { key: 'green', yOffset: 7.2, color: 0x10B981 }
    ];

    lightConfigs.forEach((cfg) => {
      // Meia bolinha de ping-pong branca difusa
      const pingPongGeo = new THREE.SphereGeometry(1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);

      // Material base: quando desligado parece bolinha de ping-pong de plástico branco fosco
      const mat = new THREE.MeshStandardMaterial({
        color: 0xF1F5F9,
        roughness: 0.35,
        transparent: true,
        opacity: 0.94,
        emissive: 0x000000,
        emissiveIntensity: 0
      });

      const bulb = new THREE.Mesh(pingPongGeo, mat);
      bulb.rotation.x = Math.PI / 2; // Apontando para a frente da caixa
      bulb.position.set(0, cfg.yOffset, 1.6);
      towerGroup.add(bulb);

      // Aro de fixação em MDF / Papelão
      const bezelGeo = new THREE.TorusGeometry(1.15, 0.15, 16, 32);
      const bezelMat = new THREE.MeshStandardMaterial({ color: 0x8C5E3C, roughness: 0.8 });
      const bezel = new THREE.Mesh(bezelGeo, bezelMat);
      bezel.position.set(0, cfg.yOffset, 1.62);
      towerGroup.add(bezel);

      // Luz pontual real que ilumina a sala
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

    // Placa PCB
    const pcbGeo = new THREE.BoxGeometry(5.4, 0.35, 10.5);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x1E2923, roughness: 0.4 });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.castShadow = true;
    espGroup.add(pcb);

    // Blindagem de metal do ESP-WROOM-32
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

    // Antena dourada
    const antGeo = new THREE.BoxGeometry(4.0, 0.08, 1.6);
    const antMat = new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.9, roughness: 0.2 });
    const antenna = new THREE.Mesh(antGeo, antMat);
    antenna.position.set(0, 0.22, -4.1);
    espGroup.add(antenna);

    // Conector Micro-USB
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

    // PCB roxa/azul do MAX4466
    const pcbGeo = new THREE.BoxGeometry(3.4, 0.25, 3.6);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x581C87, roughness: 0.4 });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.castShadow = true;
    sensorGroup.add(pcb);

    // Cápsula de microfone de eletreto cilíndrica prateada
    const micGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.95, 24);
    const micMat = new THREE.MeshStandardMaterial({ color: 0xD1D5DB, metalness: 0.85, roughness: 0.2 });
    const mic = new THREE.Mesh(micGeo, micMat);
    mic.position.set(0, 0.55, 0.6);
    sensorGroup.add(mic);

    // Feltro preto acústico no microfone
    const micTopGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.08, 24);
    const micTopMat = new THREE.MeshBasicMaterial({ color: 0x18181B });
    const micTop = new THREE.Mesh(micTopGeo, micTopMat);
    micTop.position.set(0, 1.05, 0.6);
    sensorGroup.add(micTop);

    // Trimpot dourado de ganho atrás da plaquinha
    const trimGeo = new THREE.BoxGeometry(0.9, 0.5, 0.9);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.7 });
    const trimpot = new THREE.Mesh(trimGeo, trimMat);
    trimpot.position.set(0, 0.35, -0.9);
    sensorGroup.add(trimpot);

    this.scene.add(sensorGroup);
  }

  buildJumperWires() {
    this.wiresGroup = new THREE.Group();

    // Conexões de cabos jumpers com curvas Bezier
    const wiresData = [
      // 1. Vermelho: 3V3 ESP32 -> VCC MAX4466
      { start: [-5.0, 1.4, 0.5], end: [-1.5, 1.3, 4.0], color: 0xEF4444, height: 3.5 },
      // 2. Preto: GND ESP32 -> GND MAX4466
      { start: [-5.0, 1.4, 1.2], end: [-1.5, 1.3, 4.0], color: 0x374151, height: 3.0 },
      // 3. Laranja: D4 ESP32 -> OUT MAX4466
      { start: [-5.0, 1.4, 2.6], end: [-0.7, 1.3, 4.0], color: 0xF97316, height: 4.0 },
      // 4. Verde: D18 ESP32 -> Semáforo LED Verde
      { start: [-5.0, 1.4, 4.7], end: [3.2, 7.2, -1.0], color: 0x10B981, height: 5.5 },
      // 5. Amarelo: D19 ESP32 -> Semáforo LED Amarelo
      { start: [-5.0, 1.4, 5.4], end: [3.2, 10.0, -1.0], color: 0xF59E0B, height: 6.5 },
      // 6. Roxo: D21 ESP32 -> Semáforo LED Vermelho
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

    // Regras de Transição de Cores do Semáforo:
    // < 15: Verde Sereno (Silêncio)
    // 15 a 45: Amarelo Âmbar (Atenção / Grupo)
    // 46+: Vermelho Coral (Alerta Crítico / Pisca)
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
      // Quando aceso, a bolinha de ping-pong ganha cor emissiva pura e forte
      const hexColor = (color === 'green') ? 0x10B981 : (color === 'yellow') ? 0xF59E0B : 0xEF4444;
      mat.color.setHex(hexColor);
      mat.emissive.setHex(hexColor);
      mat.emissiveIntensity = 1.45;
      light.intensity = 3.2;
    } else {
      // Quando apagado, volta a ser o difusor de plástico branco translúcido
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

    // Efeito estroboscópico de alerta no LED Vermelho
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
    const height = this.container.clientHeight || 460;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

// =============================================================================
// 3. CONTROLADOR GERAL (Web Audio API, Presets, Abas de Código)
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  const sim3d = new NoiseLight3D('canvas-3d-box');

  let currentNoise = 5;
  let isListeningMic = false;
  let audioContext = null;
  let analyser = null;
  let micStream = null;

  // Elementos do DOM
  const slider = document.getElementById('noise-slider');
  const noiseValueDisplay = document.getElementById('noise-val');
  const statusBadge = document.getElementById('status-badge');
  const statusDesc = document.getElementById('status-desc');
  const btnMic = document.getElementById('btn-mic');
  const btnToggleWires = document.getElementById('btn-toggle-wires');
  const presetBtns = document.querySelectorAll('.btn-preset');

  // Abas do Código
  const codeTabs = document.querySelectorAll('.code-tab-btn');
  const codeDisplay = document.getElementById('code-display');
  const codeExplanation = document.getElementById('code-explanation-text');
  const btnCopyCode = document.getElementById('btn-copy-code');

  function updateNoiseLevel(value, source = 'slider') {
    currentNoise = parseInt(value, 10);
    if (isNaN(currentNoise)) currentNoise = 0;

    if (source !== 'slider' && slider) {
      slider.value = currentNoise;
    }
    if (noiseValueDisplay) {
      noiseValueDisplay.innerText = currentNoise;
    }

    if (sim3d) {
      sim3d.setNoiseCount(currentNoise);
    }

    // Atualiza status e textos informativos
    if (currentNoise < 15) {
      statusBadge.innerHTML = '🟢 Silêncio (Conforto Acústico)';
      statusBadge.className = 'overlay-status status-green';
      statusDesc.innerText = 'Volume calmo e seguro (< 60 dB). Ideal para concentração, leitura e bem-estar sensorial.';
    } else if (currentNoise >= 15 && currentNoise < 46) {
      statusBadge.innerHTML = '🟡 Atenção (Conversas)';
      statusBadge.className = 'overlay-status status-yellow';
      statusDesc.innerText = 'Trabalho em grupo (60 a 70 dB). Ponto de equilíbrio para que todos conversem sem elevar a voz.';
    } else {
      statusBadge.innerHTML = '🔴 Alerta (Sobrecarga Sonora)';
      statusBadge.className = 'overlay-status status-red';
      statusDesc.innerText = 'Barulho excessivo (> 70 dB). Risco de sobrecarga sensorial para colegas atípicos. O LED pisca!';
    }
  }

  // Slider
  if (slider) {
    slider.addEventListener('input', (e) => {
      presetBtns.forEach(b => b.classList.remove('active'));
      updateNoiseLevel(e.target.value, 'slider');
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

    let simulatedNoise = 0;
    if (average > 8) {
      simulatedNoise = Math.min(70, Math.floor((average - 8) * 1.35));
    }

    updateNoiseLevel(simulatedNoise, 'mic');
    requestAnimationFrame(listenAudioLoop);
  }

  // Base de Código do ESP32
  const codeDatabase = {
    complete: {
      code: `// --- CÓDIGO COMPLETO DO FIRMWARE (src/main.cpp) ---
#include &lt;Arduino.h&gt;

const int PINO_SENSOR_SOM   = 4;  // OUT do MAX4466 (Entrada Analógica D4)
const int PINO_LED_VERDE     = 18; // LED 10mm Verde (D18)
const int PINO_LED_AMARELO   = 19; // LED 10mm Amarelo (D19)
const int PINO_LED_VERMELHO  = 21; // LED 10mm Vermelho (D21)

int limiarAmarelo  = 900;  // Acima deste valor passa para Amarelo
int limiarVermelho = 2200; // Acima deste valor passa para Vermelho

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); // ADC do ESP32: 0 a 4095
  analogSetPinAttenuation(PINO_SENSOR_SOM, ADC_11db);

  pinMode(PINO_LED_VERDE, OUTPUT);
  pinMode(PINO_LED_AMARELO, OUTPUT);
  pinMode(PINO_LED_VERMELHO, OUTPUT);
}

void loop() {
  // Amostragem Pico-a-Pico durante 50ms
  int amplitude = medirAmplitudePicoAPico(50);
  atualizarSemaforo(amplitude);
}`,
      explanation: 'Este é o firmware completo gravado no ESP32. Ele configura o conversor analógico-digital (ADC) para ler o microfone analógico MAX4466 no pino D4 e aciona os LEDs difusores de 10mm nos pinos D18, D19 e D21.'
    },

    sampling: {
      code: `// --- LEITURA DO MAX4466 (PICO-A-PICO) ---
int medirAmplitudePicoAPico(unsigned long duracaoMs) {
  unsigned long tempoInicio = millis();
  int valorMin = 4095;
  int valorMax = 0;

  // Lê a onda de som continuamente durante 50 milissegundos
  while (millis() - tempoInicio &lt; duracaoMs) {
    int leitura = analogRead(PINO_SENSOR_SOM);
    if (leitura &gt; valorMax) valorMax = leitura;
    if (leitura &lt; valorMin) valorMin = leitura;
  }

  // Amplitude = diferença entre a crista mais alta e o vale mais baixo
  return (valorMax - valorMin);
}`,
      explanation: 'O módulo MAX4466 entrega uma onda analógica contínua. Durante 50ms, o ESP32 mede repetidamente a onda e calcula a amplitude Pico a Pico (Valor Máximo - Valor Mínimo). Em silêncio, a amplitude é muito baixa (~100). Ao falar ou gritar, a onda oscila com força e a amplitude passa de 2000!'
    },

    decision: {
      code: `// --- LÓGICA DE DECISÃO DO SEMÁFORO ---
void atualizarSemaforo(int amplitude) {
  unsigned long agora = millis();

  // Se atingiu o nível crítico, ativa a retenção temporária (Peak Hold)
  if (amplitude &gt;= limiarVermelho) {
    ultimoTempoVermelho = agora;
  }

  // Mantém no vermelho por 1,5s para não oscilar a cada pausa de voz
  if (agora - ultimoTempoVermelho &lt; 1500) {
    alertarVermelhoPiscando();
  } 
  else if (amplitude &gt;= limiarAmarelo) {
    acenderSomenteAmarelo();
  } 
  else {
    acenderSomenteVerde();
  }
}`,
      explanation: 'Aqui o ESP32 atua como o juiz visual da sala. Usando condicionais (if / else if / else), ele compara a amplitude sonora com os limiares. O "Peak Hold" de 1,5 segundo garante que se alguém grita, o vermelho permanece ativo tempo suficiente para a turma se autorregular.'
    },

    nonblocking: {
      code: `// --- ALERTA PISCANTE NÃO-BLOQUEANTE ---
void alertarVermelhoPiscando() {
  digitalWrite(PINO_LED_VERDE, LOW);
  digitalWrite(PINO_LED_AMARELO, LOW);

  // Pisca o LED Vermelho a cada 120ms sem usar delay()
  unsigned long agora = millis();
  if (agora - ultimoPiscaVermelho &gt;= 120) {
    ultimoPiscaVermelho = agora;
    estadoPiscaVermelho = !estadoPiscaVermelho;
    digitalWrite(PINO_LED_VERMELHO, estadoPiscaVermelho ? HIGH : LOW);
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

  // Copiar Código
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

  // Inicializa o som padrão
  updateNoiseLevel(5, 'init');
});
