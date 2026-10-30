/**
 * simulator3d.js — Simulação 3D Interativa do Semáforo com Three.js
 * Projeto: NoiseLight (Feira de Robótica do 6º Ano)
 */

class NoiseLight3D {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Componentes 3D
    this.leds = {
      green: null,
      yellow: null,
      red: null
    };
    this.lights = {
      green: null,
      yellow: null,
      red: null
    };
    this.sensorLed = null;

    this.currentNoise = 0;
    this.blinkCounter = 0;
    this.isBlinking = false;

    this.init();
  }

  init() {
    // 1. Cena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060911);
    this.scene.fog = new THREE.FogExp2(0x060911, 0.02);

    // 2. Câmera
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 480;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 22, 32);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Orbit Controls (Arrastar para girar, scroll para zoom)
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Não passar por baixo do chão
      this.controls.minDistance = 12;
      this.controls.maxDistance = 60;
      this.controls.target.set(0, 2, 0);
    }

    // 5. Iluminação do Ambiente
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.2);
    dirLight.position.set(20, 35, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    blueRimLight.position.set(-20, 15, -20);
    this.scene.add(blueRimLight);

    // 6. Construir os Modelos 3D
    this.buildScene();

    // 7. Eventos de Redimensionamento
    window.addEventListener('resize', () => this.onResize());

    // 8. Loop de Animação
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildScene() {
    // A. Mesa / Plataforma
    const tableGeo = new THREE.CylinderGeometry(28, 30, 2, 64);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
      metalness: 0.2
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = -1;
    table.receiveShadow = true;
    this.scene.add(table);

    // Grid discreto sobre a bancada
    const grid = new THREE.GridHelper(40, 40, 0x1e293b, 0x111827);
    grid.position.y = 0.02;
    this.scene.add(grid);

    // B. Protoboard (Matriz de Contatos)
    const protoWidth = 22;
    const protoLength = 16;
    const protoGeo = new THREE.BoxGeometry(protoWidth, 1.2, protoLength);
    const protoMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.4,
      metalness: 0.1
    });
    const protoboard = new THREE.Mesh(protoGeo, protoMat);
    protoboard.position.set(0, 0.6, 0);
    protoboard.castShadow = true;
    protoboard.receiveShadow = true;
    this.scene.add(protoboard);

    // Linhas coloridas da protoboard (alimentação positiva e negativa)
    const railMatRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const railMatBlue = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const railGeo = new THREE.BoxGeometry(protoWidth - 2, 0.05, 0.2);

    const rail1 = new THREE.Mesh(railGeo, railMatRed);
    rail1.position.set(0, 1.23, -protoLength / 2 + 0.8);
    this.scene.add(rail1);

    const rail2 = new THREE.Mesh(railGeo, railMatBlue);
    rail2.position.set(0, 1.23, -protoLength / 2 + 1.4);
    this.scene.add(rail2);

    // C. Módulo ESP32 DevKit V1
    this.buildEsp32(-4.5, 1.2, 0);

    // D. Módulo Sensor de Som (com microfone)
    this.buildSoundSensor(6.5, 1.2, 3);

    // E. Os 3 LEDs do Semáforo (Verde, Amarelo, Vermelho)
    this.buildTrafficLeds(4.5, 1.2, -3);

    // F. Fios Jumpers Coloridos
    this.buildJumperWires();
  }

  buildEsp32(x, y, z) {
    const espGroup = new THREE.Group();
    espGroup.position.set(x, y, z);

    // Placa PCB preta
    const pcbGeo = new THREE.BoxGeometry(6, 0.4, 11);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.castShadow = true;
    espGroup.add(pcb);

    // Blindagem metálica do chip ESP-WROOM-32
    const shieldGeo = new THREE.BoxGeometry(4.5, 0.5, 5);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.85,
      roughness: 0.2
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(0, 0.4, -0.5);
    shield.castShadow = true;
    espGroup.add(shield);

    // Antena dourada de PCB
    const antGeo = new THREE.BoxGeometry(4.2, 0.1, 2);
    const antMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.9,
      roughness: 0.1
    });
    const antenna = new THREE.Mesh(antGeo, antMat);
    antenna.position.set(0, 0.25, -4.2);
    espGroup.add(antenna);

    // Conector Micro-USB metálico
    const usbGeo = new THREE.BoxGeometry(2.5, 1.2, 2);
    const usbMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.9, roughness: 0.2 });
    const usb = new THREE.Mesh(usbGeo, usbMat);
    usb.position.set(0, 0.5, 5.2);
    espGroup.add(usb);

    // Pinos laterais dourados
    const pinGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9 });
    for (let i = -4.5; i <= 4.5; i += 0.8) {
      const pinL = new THREE.Mesh(pinGeo, pinMat);
      pinL.position.set(-2.7, -0.4, i);
      espGroup.add(pinL);

      const pinR = new THREE.Mesh(pinGeo, pinMat);
      pinR.position.set(2.7, -0.4, i);
      espGroup.add(pinR);
    }

    this.scene.add(espGroup);
  }

  buildSoundSensor(x, y, z) {
    const sensorGroup = new THREE.Group();
    sensorGroup.position.set(x, y, z);

    // PCB azul do sensor
    const pcbGeo = new THREE.BoxGeometry(4, 0.3, 5);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    sensorGroup.add(pcb);

    // Cápsula do microfone cilíndrica prateada
    const micGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.2, 24);
    const micMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.8, roughness: 0.2 });
    const mic = new THREE.Mesh(micGeo, micMat);
    mic.position.set(0, 0.7, 1.6);
    sensorGroup.add(mic);

    // Espuma / topo preto do microfone
    const micTopGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 24);
    const micTopMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
    const micTop = new THREE.Mesh(micTopGeo, micTopMat);
    micTop.position.set(0, 1.35, 1.6);
    sensorGroup.add(micTop);

    // Trimpot azul de calibração
    const trimGeo = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x2563eb });
    const trimpot = new THREE.Mesh(trimGeo, trimMat);
    trimpot.position.set(0, 0.5, -0.8);
    sensorGroup.add(trimpot);

    // Parafuso de bronze no topo do trimpot
    const screwGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
    const screwMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8 });
    const screw = new THREE.Mesh(screwGeo, screwMat);
    screw.position.set(0, 0.95, -0.8);
    sensorGroup.add(screw);

    // LED miniatura indicador do microfone
    const smdGeo = new THREE.BoxGeometry(0.4, 0.2, 0.4);
    this.sensorLedMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    this.sensorLed = new THREE.Mesh(smdGeo, this.sensorLedMat);
    this.sensorLed.position.set(1.2, 0.25, 0.5);
    sensorGroup.add(this.sensorLed);

    this.scene.add(sensorGroup);
  }

  buildTrafficLeds(x, y, z) {
    const ledSpacing = 2.4;
    const colors = [
      { key: 'green', color: 0x10b981, emissive: 0x059669, offsetZ: -ledSpacing },
      { key: 'yellow', color: 0xf59e0b, emissive: 0xd97706, offsetZ: 0 },
      { key: 'red', color: 0xef4444, emissive: 0xdc2626, offsetZ: ledSpacing }
    ];

    colors.forEach((cfg) => {
      const ledGroup = new THREE.Group();
      ledGroup.position.set(x, y, z + cfg.offsetZ);

      // Cúpula do LED (Cilindro + Hemisfério no topo)
      const cylinderGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 24);
      const domeGeo = new THREE.SphereGeometry(0.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);

      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
        emissive: 0x000000,
        emissiveIntensity: 0
      });

      const cylinder = new THREE.Mesh(cylinderGeo, mat);
      cylinder.position.y = 0.6;
      cylinder.castShadow = true;
      ledGroup.add(cylinder);

      const dome = new THREE.Mesh(domeGeo, mat);
      dome.position.y = 1.2;
      ledGroup.add(dome);

      // Base anelar plástica do LED
      const baseGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 24);
      const base = new THREE.Mesh(baseGeo, mat);
      base.position.y = 0.1;
      ledGroup.add(base);

      // Terminais metálicos (pernas do LED inseridas na protoboard)
      const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8);
      const legMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9 });
      const leg1 = new THREE.Mesh(legGeo, legMat);
      leg1.position.set(-0.25, -0.3, 0);
      ledGroup.add(leg1);
      const leg2 = new THREE.Mesh(legGeo, legMat);
      leg2.position.set(0.25, -0.3, 0);
      ledGroup.add(leg2);

      // Luz Pontual associada ao LED
      const pLight = new THREE.PointLight(cfg.color, 0, 10);
      pLight.position.set(x, y + 1.5, z + cfg.offsetZ);
      this.scene.add(pLight);

      this.leds[cfg.key] = mat;
      this.lights[cfg.key] = pLight;

      this.scene.add(ledGroup);
    });
  }

  buildJumperWires() {
    // Cria fios curvados estéticos (splines) entre os pinos
    const wires = [
      { start: [-1.8, 1.5, 2.5], end: [4.5, 1.2, -5.4], color: 0x10b981 }, // Fio Verde (GPIO 25)
      { start: [-1.8, 1.5, 3.2], end: [4.5, 1.2, -3.0], color: 0xf59e0b }, // Fio Amarelo (GPIO 26)
      { start: [-1.8, 1.5, 3.9], end: [4.5, 1.2, -0.6], color: 0xef4444 }, // Fio Vermelho (GPIO 27)
      { start: [-1.8, 1.5, -2.5], end: [6.5, 1.2, 1.0], color: 0x38bdf8 }  // Fio Sinal Sensor (GPIO 34)
    ];

    wires.forEach((w) => {
      const mid = [
        (w.start[0] + w.end[0]) / 2,
        Math.max(w.start[1], w.end[1]) + 2.5 + Math.random() * 0.8,
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
        roughness: 0.5
      });
      const wireMesh = new THREE.Mesh(tubeGeo, tubeMat);
      this.scene.add(wireMesh);
    });
  }

  setNoiseCount(count) {
    this.currentNoise = count;

    // Atualiza o microfone 3D (pisca o LED do sensor quando há disparos)
    if (count > 0 && this.sensorLedMat) {
      this.sensorLedMat.color.setHex(0x38bdf8);
    } else if (this.sensorLedMat) {
      this.sensorLedMat.color.setHex(0x334155);
    }

    // Lógica das cores conforme o código do ESP32
    if (count < 2) {
      // VERDE
      this.setLedState('green', true);
      this.setLedState('yellow', false);
      this.setLedState('red', false);
      this.isBlinking = false;
    } else if (count >= 2 && count < 15) {
      // AMARELO
      this.setLedState('green', false);
      this.setLedState('yellow', true);
      this.setLedState('red', false);
      this.isBlinking = false;
    } else {
      // VERMELHO PISCANTE
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
      mat.emissive.setHex(mat.color.getHex());
      mat.emissiveIntensity = 1.2;
      light.intensity = 2.5;
    } else {
      mat.emissiveIntensity = 0;
      light.intensity = 0;
    }
  }

  animate() {
    requestAnimationFrame(this.animate);

    if (this.controls) {
      this.controls.update();
    }

    // Gerenciador do efeito piscante do LED Vermelho (Alerta)
    if (this.isBlinking) {
      this.blinkCounter = (this.blinkCounter + 1) % 24;
      const shouldLight = this.blinkCounter < 12;
      this.setLedState('red', shouldLight);
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight || 480;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.NoiseLight3D = NoiseLight3D;
