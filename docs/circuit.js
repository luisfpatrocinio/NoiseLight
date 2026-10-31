/**
 * circuit.js — Simulador Eletroeletrônico Interativo do NoiseLight
 * Bancada completa e responsiva: ESP32 DevKit, Sensor de Som KY-038
 * e os 3 canais de sinalização com resistores de 220 Ω e LEDs reais.
 */

class CircuitSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.activeLed = 'green'; // 'green', 'yellow', 'red', 'red_blink', 'none'
    this.blinkTimer = 0;
    this.blinkState = true;
    this.particles = {
      green: [],
      yellow: [],
      red: [],
      sensor: []
    };
    this.photons = [];
    this.time = 0;

    this.initParticles();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.displayWidth = Math.max(rect.width || 800, 320);
    this.displayHeight = Math.max(rect.height || 500, 480);

    this.canvas.width = Math.floor(this.displayWidth * dpr);
    this.canvas.height = Math.floor(this.displayHeight * dpr);

    // Renderização vetorial nítida em telas Retina / High-DPI
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  initParticles() {
    ['green', 'yellow', 'red'].forEach((channel) => {
      this.particles[channel] = [];
      const count = 16;
      for (let i = 0; i < count; i++) {
        this.particles[channel].push({
          progress: i / count,
          speed: 0.0075 + Math.random() * 0.001
        });
      }
    });

    this.particles.sensor = [];
    for (let i = 0; i < 6; i++) {
      this.particles.sensor.push({
        progress: i / 6,
        speed: 0.012
      });
    }
  }

  setLed(color) {
    this.activeLed = color;
    this.updateInfoPanel();
  }

  updateInfoPanel() {
    const elVoltage = document.getElementById('calc-voltage');
    const elVled = document.getElementById('calc-vled');
    const elCurrent = document.getElementById('calc-current');
    const elState = document.getElementById('circuit-state-badge');

    if (!elVoltage) return;

    if (this.activeLed === 'none') {
      elVoltage.innerText = '0.0 V (LOW)';
      if (elVled) elVled.innerText = '0.0 V';
      if (elCurrent) elCurrent.innerText = '0.0 mA (Sem corrente)';
      if (elState) {
        elState.innerText = 'CIRCUITO EM ESPERA (STANDBY)';
        elState.style.color = '#71717a';
      }
      return;
    }

    let vDrop = 2.0;
    let pinNumber = 25;
    let stateLabel = 'CANAL ATIVO: GPIO 25 (LED VERDE)';
    let ledColorHex = '#10b981';

    if (this.activeLed === 'yellow') {
      vDrop = 2.1;
      pinNumber = 26;
      stateLabel = 'CANAL ATIVO: GPIO 26 (LED AMARELO)';
      ledColorHex = '#f59e0b';
    } else if (this.activeLed === 'red' || this.activeLed === 'red_blink') {
      vDrop = 1.9;
      pinNumber = 27;
      stateLabel = 'CANAL ATIVO: GPIO 27 (LED VERMELHO PISCANTE)';
      ledColorHex = '#ef4444';
    }

    const vEsp = 3.3;
    const vResistor = vEsp - vDrop;
    const currentMa = (vResistor / 220) * 1000;

    elVoltage.innerText = `${vEsp.toFixed(1)} V (HIGH - GPIO ${pinNumber})`;
    if (elVled) elVled.innerText = `${vDrop.toFixed(1)} V (Queda Vf)`;
    if (elCurrent) elCurrent.innerText = `${currentMa.toFixed(1)} mA (Seguro pelo Resistor)`;

    if (elState) {
      elState.innerText = stateLabel;
      elState.style.color = ledColorHex;
    }
  }

  animate() {
    this.time += 1;

    // Gerencia o efeito de alerta estroboscópico do LED Vermelho
    if (this.activeLed === 'red_blink') {
      this.blinkTimer = (this.blinkTimer + 1) % 32;
      this.blinkState = this.blinkTimer < 16;
    } else {
      this.blinkState = true;
    }

    this.render();
    requestAnimationFrame(this.animate);
  }

  render() {
    const w = this.displayWidth;
    const h = this.displayHeight;
    const ctx = this.ctx;

    // 1. Limpeza da bancada com fundo escuro profundo
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#08080a';
    ctx.fillRect(0, 0, w, h);

    // 2. Grid de blueprint milimétrico sutil
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const step = 20;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 3. Moldura de bancada
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Rótulo da bancada
    ctx.fillStyle = '#71717a';
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('BANCADA ELETRÔNICA // CIRCUITO COMPLETO DO SEMÁFORO NOISELIGHT', 22, 26);

    // 4. Layout Proporcional e Responsivo à prova de sobreposição
    const isMobile = w < 680;
    const espX = isMobile ? 18 : 26;
    const espW = isMobile ? 96 : 124;
    const sensorY = 38;
    const sensorH = 40;
    const espY = 94;
    const espH = h - espY - 26;

    // Protoboard à direita
    const protoGap = isMobile ? 18 : 28;
    const protoX = espX + espW + protoGap;
    const protoW = Math.max(160, w - protoX - (isMobile ? 18 : 24));
    const protoY = 46;
    const protoH = h - protoY - 26;

    // Desenha protoboard
    this.drawBreadboard(ctx, protoX, protoY, protoW, protoH, isMobile);

    // Sensor Acústico KY-038
    this.drawSoundSensor(ctx, espX, sensorY, espW, sensorH, espX + espW, espY);

    // Posições verticais dos 3 canais de LED
    const channels = [
      {
        id: 'green',
        pinName: isMobile ? 'G25' : 'GPIO 25',
        color: '#10b981',
        label: isMobile ? 'Verde' : 'LED Verde (Silêncio)',
        y: protoY + protoH * 0.22,
        active: this.activeLed === 'green'
      },
      {
        id: 'yellow',
        pinName: isMobile ? 'G26' : 'GPIO 26',
        color: '#f59e0b',
        label: isMobile ? 'Amarelo' : 'LED Amarelo (Atenção)',
        y: protoY + protoH * 0.48,
        active: this.activeLed === 'yellow'
      },
      {
        id: 'red',
        pinName: isMobile ? 'G27' : 'GPIO 27',
        color: '#ef4444',
        label: isMobile ? 'Vermelho' : 'LED Vermelho (Alerta)',
        y: protoY + protoH * 0.74,
        active: (this.activeLed === 'red') || (this.activeLed === 'red_blink' && this.blinkState)
      }
    ];

    // Barramento de Terra (GND) no fundo da protoboard
    const gndBusY = protoY + protoH - 22;
    this.drawGndBus(ctx, protoX + 16, protoX + protoW - 16, gndBusY, espX + espW, espY + espH - 22);

    // Desenha o microcontrolador ESP32 DevKit
    this.drawEsp32(ctx, espX, espY, espW, espH, channels, isMobile);

    // Desenha os 3 canais paralelos independentes
    channels.forEach((ch, idx) => {
      this.drawChannel(ctx, espX + espW, ch, protoX, protoW, gndBusY, idx, isMobile);
    });

    // Emissão de fótons luminosos dos LEDs
    this.drawPhotons(ctx);
  }

  drawBreadboard(ctx, x, y, w, h, isMobile) {
    // Corpo da protoboard
    ctx.fillStyle = 'rgba(16, 16, 22, 0.85)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // Rótulo da protoboard
    ctx.fillStyle = '#52525b';
    ctx.font = '600 8.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(isMobile ? 'PROTOBOARD' : 'PROTOBOARD 830 PONTOS // MATRIZ DE CONTATOS', x + w - 12, y + 14);

    // Furos de contato da protoboard
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    const spacing = 16;
    for (let px = x + 18; px < x + w - 18; px += spacing) {
      for (let py = y + 24; py < y + h - 34; py += spacing) {
        ctx.fillRect(px - 1, py - 1, 2, 2);
      }
    }
  }

  drawSoundSensor(ctx, x, y, w, h, targetX, targetY) {
    // Módulo KY-038
    ctx.fillStyle = '#141418';
    ctx.strokeStyle = 'rgba(255, 85, 0, 0.35)';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    // Identificação
    ctx.fillStyle = '#ff5500';
    ctx.font = '700 8.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('KY-038', x + 6, y + 13);
    ctx.fillStyle = '#71717a';
    ctx.font = '500 7.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Sensor Som', x + 6, y + 23);
    ctx.fillText('D0 -> G34', x + 6, y + 33);

    // Cápsula de microfone
    const micX = x + w - 16;
    const micY = y + h / 2;
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#52525b';
    ctx.beginPath();
    ctx.arc(micX, micY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ondas sonoras acústicas animadas
    const wavePhase = (this.time * 0.06) % 3;
    for (let r = 0; r < 3; r++) {
      const radius = 10 + ((r + wavePhase) % 3) * 5;
      const alpha = Math.max(0, 0.5 - (radius / 25));
      ctx.strokeStyle = `rgba(255, 85, 0, ${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(micX, micY, radius, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();
    }

    // Fio condutor ligando o sensor D0 ao pino GPIO 34 do ESP32
    const startY = y + h - 8;
    const destX = targetX;
    const destY = targetY + 18;

    ctx.strokeStyle = 'rgba(255, 85, 0, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x + w, startY);
    ctx.lineTo(destX + 14, startY);
    ctx.lineTo(destX + 14, destY);
    ctx.lineTo(destX, destY);
    ctx.stroke();

    // Partículas de pulso acústico no fio
    this.particles.sensor.forEach((p) => {
      p.progress = (p.progress + p.speed) % 1.0;
      const totalLen = (destX + 14 - (x + w)) + (destY - startY) + 14;
      const curDist = p.progress * totalLen;

      let px = x + w;
      let py = startY;

      const seg1 = destX + 14 - (x + w);
      const seg2 = destY - startY;

      if (curDist < seg1) {
        px = x + w + curDist;
        py = startY;
      } else if (curDist < seg1 + seg2) {
        px = destX + 14;
        py = startY + (curDist - seg1);
      } else {
        px = destX + 14 - (curDist - seg1 - seg2);
        py = destY;
      }

      ctx.fillStyle = '#ff5500';
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawEsp32(ctx, x, y, w, h, channels, isMobile) {
    // Placa ESP32
    ctx.fillStyle = '#141419';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);

    // Módulo de blindagem metálica do microcontrolador
    const socH = Math.min(85, h * 0.28);
    ctx.fillStyle = '#1e1e26';
    ctx.fillRect(x + 8, y + 8, w - 16, socH);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeRect(x + 8, y + 8, w - 16, socH);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESP32', x + w / 2, y + 24);
    ctx.font = '600 7.5px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('DEVKIT V1', x + w / 2, y + 36);
    ctx.fillStyle = '#71717a';
    ctx.fillText('3.3V DUAL-CORE', x + w / 2, y + 47);

    // Conector Micro-USB
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(x + w / 2 - 12, y - 5, 24, 5);

    // Pino GPIO 34 (Entrada do sensor de som)
    const pinSensY = y + 18;
    this.drawPin(ctx, x + w, pinSensY, isMobile ? 'G34' : 'GPIO 34', true, '#ff5500');

    // Pinos de saída dos 3 LEDs
    channels.forEach((ch) => {
      this.drawPin(ctx, x + w, ch.y, ch.pinName, ch.active, ch.color);
    });

    // Pino GND
    const gndPinY = y + h - 22;
    this.drawPin(ctx, x + w, gndPinY, 'GND', true, '#71717a');
  }

  drawPin(ctx, x, y, name, isActive, activeColor) {
    // Pino metálico
    ctx.fillStyle = isActive ? activeColor : '#3f3f46';
    ctx.fillRect(x - 2, y - 3, 6, 6);

    // Rótulo
    ctx.fillStyle = isActive ? activeColor : '#71717a';
    ctx.font = '600 8.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(name, x - 5, y + 3);
  }

  drawChannel(ctx, startX, ch, protoX, protoW, gndBusY, idx, isMobile) {
    const isLit = ch.active;
    const wireY = ch.y;

    // Componentes posicionados com folga protegida
    const resistorX = protoX + protoW * (isMobile ? 0.35 : 0.38);
    const ledX = protoX + protoW * (isMobile ? 0.76 : 0.75);

    // 1. Trilha do ESP32 até o Resistor 220 Ω
    ctx.strokeStyle = isLit ? ch.color : '#27272a';
    ctx.lineWidth = isLit ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, wireY);
    ctx.lineTo(resistorX - 22, wireY);
    ctx.stroke();

    // 2. Transistor MOSFET / Chave lógica virtual
    const switchX = startX + (resistorX - 22 - startX) * 0.32;
    this.drawSwitch(ctx, switchX, wireY, isLit, ch.color);

    // 3. Resistor de Precisão de 220 Ω
    this.drawResistor(ctx, resistorX, wireY, isLit);

    // 4. Trilha do Resistor ao Ânodo do LED
    ctx.strokeStyle = isLit ? ch.color : '#27272a';
    ctx.lineWidth = isLit ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(resistorX + 22, wireY);
    ctx.lineTo(ledX - 16, wireY);
    ctx.stroke();

    // 5. LED do Semáforo (Verde, Amarelo ou Vermelho)
    this.drawLed(ctx, ledX, wireY, ch, isLit, isMobile);

    // 6. Trilha de retorno do Cátodo do LED ao Barramento GND
    const returnStartX = ledX + 16;
    const dropX = Math.min(protoX + protoW - 10, returnStartX + 14 + idx * 8);

    ctx.strokeStyle = isLit ? 'rgba(255, 255, 255, 0.35)' : '#27272a';
    ctx.lineWidth = isLit ? 2 : 1.2;
    ctx.beginPath();
    ctx.moveTo(returnStartX, wireY);
    ctx.lineTo(dropX, wireY);
    ctx.lineTo(dropX, gndBusY);
    ctx.stroke();

    // 7. Animação de fluxo contínuo de elétrons no ramo energizado
    if (isLit) {
      this.animateElectrons(ctx, startX, resistorX, ledX, returnStartX, dropX, wireY, gndBusY, ch);
      this.emitPhotons(ledX, wireY, ch.color);
    }
  }

  drawSwitch(ctx, x, y, isClosed, activeColor) {
    const sw = 16;
    ctx.fillStyle = '#16161a';
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.fillRect(x - sw / 2, y - 8, sw, 16);
    ctx.strokeRect(x - sw / 2, y - 8, sw, 16);

    ctx.fillStyle = isClosed ? activeColor : '#52525b';
    ctx.fillRect(x - sw / 2 - 2, y - 2, 4, 4);
    ctx.fillRect(x + sw / 2 - 2, y - 2, 4, 4);

    ctx.strokeStyle = isClosed ? activeColor : '#71717a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x - sw / 2 + 2, y);
    if (isClosed) {
      ctx.lineTo(x + sw / 2 - 2, y);
    } else {
      ctx.lineTo(x + sw / 2 - 4, y - 6);
    }
    ctx.stroke();
  }

  drawResistor(ctx, x, y, isActive) {
    const rw = 44;
    const rh = 14;

    ctx.fillStyle = '#222228';
    ctx.strokeStyle = isActive ? 'rgba(255, 255, 255, 0.25)' : '#33333a';
    ctx.lineWidth = 1;
    ctx.fillRect(x - rw / 2, y - rh / 2, rw, rh);
    ctx.strokeRect(x - rw / 2, y - rh / 2, rw, rh);

    // Faixas de 220 Ω (Vermelho, Vermelho, Marrom, Ouro)
    const bands = ['#ef4444', '#ef4444', '#78350f', '#facc15'];
    bands.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(x - rw / 2 + 9 + i * 7.5, y - rh / 2, 3, rh);
    });

    ctx.fillStyle = isActive ? '#ffffff' : '#71717a';
    ctx.font = '600 9px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('220 Ω', x, y - 10);
  }

  drawLed(ctx, x, y, ch, isLit, isMobile) {
    const ledColor = ch.color;

    // Glow suave quando aceso
    if (isLit) {
      const grad = ctx.createRadialGradient(x, y, 3, x, y, 32);
      grad.addColorStop(0, ledColor + 'cc');
      grad.addColorStop(0.5, ledColor + '28');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 32, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cúpula do LED
    ctx.fillStyle = isLit ? ledColor : '#1f1f26';
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isLit ? '#ffffff' : '#3f3f46';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Rótulos do LED
    ctx.fillStyle = isLit ? '#ffffff' : '#71717a';
    ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ch.label, x, y - 16);

    if (!isMobile) {
      ctx.font = '500 7.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = isLit ? ch.color : '#52525b';
      ctx.fillText('ÂNODO (+)', x - 15, y + 18);
      ctx.fillStyle = '#71717a';
      ctx.fillText('CÁTODO (-)', x + 16, y + 18);
    }
  }

  drawGndBus(ctx, x1, x2, busY, espGndX, espGndY) {
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, busY);
    ctx.lineTo(x2, busY);
    ctx.stroke();

    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x1, busY);
    ctx.lineTo(espGndX + 16, busY);
    ctx.lineTo(espGndX + 16, espGndY);
    ctx.lineTo(espGndX, espGndY);
    ctx.stroke();

    ctx.fillStyle = '#71717a';
    ctx.font = '600 8.5px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('BARRAMENTO GND COMUM (0V - RETORNO DE CORRENTE)', x1 + 8, busY - 5);
  }

  animateElectrons(ctx, startX, resistorX, ledX, returnStartX, dropX, wireY, gndBusY, ch) {
    const particles = this.particles[ch.id];
    if (!particles) return;

    const seg1 = (ledX - startX);
    const seg2 = Math.abs(dropX - returnStartX);
    const seg3 = Math.abs(gndBusY - wireY);
    const seg4 = Math.abs(dropX - startX);
    const totalDist = seg1 + seg2 + seg3 + seg4;

    particles.forEach((p) => {
      p.progress = (p.progress + p.speed) % 1.0;
      const d = p.progress * totalDist;

      let px = startX;
      let py = wireY;

      if (d < seg1) {
        px = startX + d;
        py = wireY;
      } else if (d < seg1 + seg2) {
        px = returnStartX + (d - seg1);
        py = wireY;
      } else if (d < seg1 + seg2 + seg3) {
        px = dropX;
        py = wireY + (d - seg1 - seg2);
      } else {
        px = dropX - (d - seg1 - seg2 - seg3);
        py = gndBusY;
      }

      ctx.fillStyle = ch.color;
      ctx.shadowColor = ch.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  emitPhotons(x, y, color) {
    if (Math.random() > 0.45) {
      this.photons.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 2,
        vy: -1.2 - Math.random() * 2,
        color: color,
        life: 1.0
      });
    }
  }

  drawPhotons(ctx) {
    for (let i = this.photons.length - 1; i >= 0; i--) {
      const pt = this.photons[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= 0.04;

      if (pt.life <= 0) {
        this.photons.splice(i, 1);
        continue;
      }

      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.life;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  }
}

window.CircuitSimulator = CircuitSimulator;
