/**
 * simulator3d.js — Maquete 3D Interativa do Semáforo NoiseLight com Three.js
 * Hardware: ESP32 DevKit V1, Módulo Microfone MAX4466, 3 LEDs de 10mm
 * Projeto: Feira de Ciências e Robótica - 6º Ano
 */

class NoiseLight3D {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Componentes e Grupos 3D
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
    this.wiresGroup = null;
    this.wiresVisible = true;

    this.currentNoise = 0;
    this.blinkCounter = 0;
    this.isBlinking = false;

    this.init();
  }

  init() {
    // 1. Cena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);
    this.scene.fog = new THREE.FogExp2(0x0a0a0f, 0.018);

    // 2. Câmera
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 480;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 24, 34);

    // 3. Renderer
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
      this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
      this.controls.minDistance = 14;
      this.controls.maxDistance = 65;
      this.controls.target.set(0, 2, 0);
    }

    // 5. Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf8fafc, 1.1);
    dirLight.position.set(18, 35, 18);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.45);
    rimLight.position.set(-20, 16, -18);
    this.scene.add(rimLight);

    // 6. Construir a Maquete
    this.buildScene();

    // 7. Eventos de Redimensionamento
    window.addEventListener('resize', () => this.onResize());

    // 8. Loop de Animação
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildScene() {
    // A. Bancada da Feira de Ciências
    const benchGeo = new THREE.CylinderGeometry(30, 32, 2, 64);
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.15
    });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.y = -1;
    bench.receiveShadow = true;
    this.scene.add(bench);

    // Grid técnico sutil
    const grid = new THREE.GridHelper(44, 44, 0x334155, 0x1e293b);
    grid.position.y = 0.02;
    this.scene.add(grid);

    // B. Protoboard (Matriz de Contatos)
    const protoWidth = 24;
    const protoLength = 17;
    const protoGeo = new THREE.BoxGeometry(protoWidth, 1.2, protoLength);
    const protoMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.05
    });
    const protoboard = new THREE.Mesh(protoGeo, protoMat);
    protoboard.position.set(0, 0.6, 0);
    protoboard.castShadow = true;
    protoboard.receiveShadow = true;
    this.scene.add(protoboard);

    // Linha azul (GND / Barramento Negativo)
    const gndRailGeo = new THREE.BoxGeometry(protoWidth - 2, 0.05, 0.25);
    const gndRailMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });
    const gndRail = new THREE.Mesh(gndRailGeo, gndRailMat);
    gndRail.position.set(0, 1.22, protoLength / 2 - 1.2);
    this.scene.add(gndRail);

    // Linha vermelha (+ / Barramento Positivo)
    const vccRailMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const vccRail = new THREE.Mesh(gndRailGeo, vccRailMat);
    vccRail.position.set(0, 1.22, protoLength / 2 - 1.7);
    this.scene.add(vccRail);

    // Vão central divisor da protoboard
    const grooveGeo = new THREE.BoxGeometry(protoWidth - 2, 0.1, 0.5);
    const grooveMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const groove = new THREE.Mesh(grooveGeo, grooveMat);
    groove.position.set(0, 1.2, 0);
    this.scene.add(groove);

    // C. ESP32 DevKit V1 (Encaixado na fileira de baixo da protoboard - lado 3V3 ativo)
    this.buildEsp32(-5.5, 1.2, 3.2);

    // D. Módulo Microfone MAX4466 (com eletreto e trimpot)
    this.buildMax4466(6.8, 1.2, 3.2);

    // E. 3 LEDs Grandes de 10mm (Verde, Amarelo, Vermelho)
    this.buildLeds10mm(3.5, 1.2, -4.2);

    // F. Fiações / Cabos Jumpers (Agrupados para permitir mostrar/ocultar)
    this.buildJumperWires();

    // Inicia com o estado silencioso (Verde)
    this.setNoiseCount(0);
  }

  buildEsp32(x, y, z) {
    const espGroup = new THREE.Group();
    espGroup.position.set(x, y, z);

    // Placa PCB preta
    const pcbGeo = new THREE.BoxGeometry(5.8, 0.35, 11);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.castShadow = true;
    espGroup.add(pcb);

    // Blindagem metálica do chip ESP32 (WROOM)
    const shieldGeo = new THREE.BoxGeometry(4.4, 0.5, 5.2);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.85,
      roughness: 0.25
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(0, 0.4, -0.6);
    shield.castShadow = true;
    espGroup.add(shield);

    // Antena PCB Dourada
    const antGeo = new THREE.BoxGeometry(4.2, 0.08, 1.8);
    const antMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      metalness: 0.9,
      roughness: 0.2
    });
    const antenna = new THREE.Mesh(antGeo, antMat);
    antenna.position.set(0, 0.22, -4.3);
    espGroup.add(antenna);

    // Conector Micro-USB metálico
    const usbGeo = new THREE.BoxGeometry(2.4, 1.1, 2);
    const usbMat = new THREE.MeshStandardMaterial({ color: 0xa1a1aa, metalness: 0.85, roughness: 0.2 });
    const usb = new THREE.Mesh(usbGeo, usbMat);
    usb.position.set(0, 0.45, 5.2);
    espGroup.add(usb);

    // LED de Power (Vermelho onboard pequeno)
    const pwrLedGeo = new THREE.BoxGeometry(0.3, 0.15, 0.3);
    const pwrLedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const pwrLed = new THREE.Mesh(pwrLedGeo, pwrLedMat);
    pwrLed.position.set(1.5, 0.26, 4.2);
    espGroup.add(pwrLed);

    // Pinos laterais na protoboard
    const pinGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.7, 8);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 });
    for (let i = -4.5; i <= 4.5; i += 0.7) {
      // Pinos da fileira conectada
      const pinL = new THREE.Mesh(pinGeo, pinMat);
      pinL.position.set(2.6, -0.35, i);
      espGroup.add(pinL);

      const pinR = new THREE.Mesh(pinGeo, pinMat);
      pinR.position.set(-2.6, -0.35, i);
      espGroup.add(pinR);
    }

    this.scene.add(espGroup);
  }

  buildMax4466(x, y, z) {
    const sensorGroup = new THREE.Group();
    sensorGroup.position.set(x, y, z);

    // PCB roxa/azul escura típica do módulo MAX4466
    const pcbGeo = new THREE.BoxGeometry(3.6, 0.25, 3.8);
    const pcbMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.4 });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.castShadow = true;
    sensorGroup.add(pcb);

    // Cápsula de microfone de eletreto prateada
    const micGeo = new THREE.CylinderGeometry(0.95, 0.95, 1.0, 24);
    const micMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.85, roughness: 0.2 });
    const mic = new THREE.Mesh(micGeo, micMat);
    mic.position.set(0, 0.6, 0.6);
    sensorGroup.add(mic);

    // Filtro acústico / topo preto do microfone
    const micTopGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.1, 24);
    const micTopMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
    const micTop = new THREE.Mesh(micTopGeo, micTopMat);
    micTop.position.set(0, 1.12, 0.6);
    sensorGroup.add(micTop);

    // Trimpot de ganho ajustável (traseiro)
    const trimGeo = new THREE.BoxGeometry(1.0, 0.6, 1.0);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.7 });
    const trimpot = new THREE.Mesh(trimGeo, trimMat);
    trimpot.position.set(0, 0.4, -1.0);
    sensorGroup.add(trimpot);

    // Parafuso de ajuste do trimpot
    const screwGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 12);
    const screwMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.9 });
    const screw = new THREE.Mesh(screwGeo, screwMat);
    screw.position.set(0, 0.72, -1.0);
    sensorGroup.add(screw);

    // 3 Pinos do MAX4466 (VCC, GND, OUT)
    const pinGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9 });
    [-0.8, 0, 0.8].forEach(px => {
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(px, -0.3, 1.6);
      sensorGroup.add(pin);
    });

    this.scene.add(sensorGroup);
  }

  buildLeds10mm(x, y, z) {
    const spacing = 3.6; // Espaçamento amplo para os LEDs grandes de 10mm
    const configs = [
      { key: 'green', color: 0x10b981, emissive: 0x059669, offsetX: -spacing, label: 'D18 (Verde)' },
      { key: 'yellow', color: 0xf59e0b, emissive: 0xd97706, offsetX: 0, label: 'D19 (Amarelo)' },
      { key: 'red', color: 0xef4444, emissive: 0xdc2626, offsetX: spacing, label: 'D21 (Vermelho)' }
    ];

    configs.forEach((cfg) => {
      const ledGroup = new THREE.Group();
      ledGroup.position.set(x + cfg.offsetX, y, z);

      // Cúpula do LED 10mm (raio 0.9 maior e translúcido)
      const radius = 0.9;
      const cylinderHeight = 1.4;
      const cylinderGeo = new THREE.CylinderGeometry(radius, radius, cylinderHeight, 32);
      const domeGeo = new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);

      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.15,
        transparent: true,
        opacity: 0.88,
        emissive: 0x000000,
        emissiveIntensity: 0
      });

      const cylinder = new THREE.Mesh(cylinderGeo, mat);
      cylinder.position.y = cylinderHeight / 2;
      cylinder.castShadow = true;
      ledGroup.add(cylinder);

      const dome = new THREE.Mesh(domeGeo, mat);
      dome.position.y = cylinderHeight;
      ledGroup.add(dome);

      // Anel base da cúpula de 10mm
      const ringGeo = new THREE.CylinderGeometry(radius + 0.12, radius + 0.12, 0.25, 32);
      const ring = new THREE.Mesh(ringGeo, mat);
      ring.position.y = 0.12;
      ledGroup.add(ring);

      // Pernas do LED (terminais metálicos)
      const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8);
      const legMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9 });
      const legA = new THREE.Mesh(legGeo, legMat);
      legA.position.set(-0.35, -0.35, 0);
      ledGroup.add(legA);
      const legK = new THREE.Mesh(legGeo, legMat);
      legK.position.set(0.35, -0.35, 0);
      ledGroup.add(legK);

      // Resistor limitador de 220Ω montado na protoboard
      const resGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.2, 16);
      const resMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.5 });
      const resistor = new THREE.Mesh(resGeo, resMat);
      resistor.rotation.x = Math.PI / 2;
      resistor.position.set(-0.35, 0.2, 1.4);
      ledGroup.add(resistor);

      // Luz pontual para iluminar a bancada e a protoboard ao acender
      const pLight = new THREE.PointLight(cfg.color, 0, 14);
      pLight.position.set(x + cfg.offsetX, y + 2.2, z);
      this.scene.add(pLight);

      this.leds[cfg.key] = mat;
      this.lights[cfg.key] = pLight;

      this.scene.add(ledGroup);
    });
  }

  buildJumperWires() {
    this.wiresGroup = new THREE.Group();

    // Definição precisa dos fios conforme a montagem do lado 3V3
    const wiresData = [
      // 1. Alimentação VCC (Pino 3V3 do ESP32 -> VCC do MAX4466) [Fio Vermelho]
      { start: [-2.9, 1.5, -0.6], end: [6.0, 1.4, 4.8], color: 0xef4444, height: 4.0 },
      
      // 2. Terra GND (Pino GND do ESP32 -> Barramento GND e MAX4466) [Fio Preto]
      { start: [-2.9, 1.5, 0.1], end: [6.8, 1.4, 4.8], color: 0x1f2937, height: 3.2 },

      // 3. Sinal de Áudio (Pino D4 / GPIO 4 -> OUT do MAX4466) [Fio Laranja]
      { start: [-2.9, 1.5, 1.5], end: [7.6, 1.4, 4.8], color: 0xf97316, height: 4.5 },

      // 4. Sinal LED Verde (Pino D18 / GPIO 18 -> Resistor LED Verde) [Fio Verde]
      { start: [-2.9, 1.5, 3.6], end: [-0.4, 1.4, -4.2], color: 0x10b981, height: 3.8 },

      // 5. Sinal LED Amarelo (Pino D19 / GPIO 19 -> Resistor LED Amarelo) [Fio Amarelo]
      { start: [-2.9, 1.5, 4.3], end: [3.2, 1.4, -4.2], color: 0xfacc15, height: 3.5 },

      // 6. Sinal LED Vermelho (Pino D21 / GPIO 21 -> Resistor LED Vermelho) [Fio Roxo/Azul]
      { start: [-2.9, 1.5, 5.0], end: [6.8, 1.4, -4.2], color: 0x8b5cf6, height: 3.6 },

      // 7. Retorno GND dos Cátodos dos 3 LEDs para o barramento azul
      { start: [0.35, 1.3, -4.2], end: [0.35, 1.25, 7.0], color: 0x3b82f6, height: 2.2 },
      { start: [3.95, 1.3, -4.2], end: [3.95, 1.25, 7.0], color: 0x3b82f6, height: 2.2 },
      { start: [7.55, 1.3, -4.2], end: [7.55, 1.25, 7.0], color: 0x3b82f6, height: 2.2 }
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

      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.13, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: w.color,
        roughness: 0.45,
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

    // Lógica alinhada aos limiares do semáforo:
    // 0 a 14: Silêncio (Verde)
    // 15 a 45: Atenção (Amarelo)
    // 46+: Alerta Crítico (Vermelho Piscando)
    if (count < 15) {
      this.setLedState('green', true);
      this.setLedState('yellow', false);
      this.setLedState('red', false);
      this.isBlinking = false;
    } else if (count >= 15 && count < 48) {
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
      mat.emissive.setHex(mat.color.getHex());
      mat.emissiveIntensity = 1.6;
      light.intensity = 3.2;
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
    const height = this.container.clientHeight || 480;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.NoiseLight3D = NoiseLight3D;
