/**
 * circuit.js — Demonstração Interativa do Fluxo de Corrente Elétrica
 * Projeto: NoiseLight (Semáforo do Barulho com ESP32)
 */

class CircuitSimulator {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.activeLed = 'green'; // 'green', 'yellow', 'red', 'none'
    this.electrons = [];
    this.photons = [];
    this.switchClosed = true;
    this.blinkTimer = 0;
    this.isBlinking = false;
    
    this.initParticles();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = Math.max(rect.height, 420);
  }

  initParticles() {
    this.electrons = [];
    for (let i = 0; i < 30; i++) {
      this.electrons.push({
        progress: (i / 30),
        speed: 0.0035 + Math.random() * 0.001
      });
    }
  }

  setLed(color) {
    this.activeLed = color;
    this.switchClosed = (color !== 'none');
    this.isBlinking = (color === 'red_blink');
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
      elVled.innerText = '0.0 V';
      elCurrent.innerText = '0.0 mA (Sem fluxo)';
      if (elState) {
        elState.innerText = 'CIRCUITO ABERTO (LOW)';
        elState.style.color = '#94a3b8';
      }
      return;
    }

    let vDrop = 2.0;
    let pinNumber = 25;
    if (this.activeLed === 'yellow') { vDrop = 2.1; pinNumber = 26; }
    if (this.activeLed === 'red' || this.activeLed === 'red_blink') { vDrop = 1.9; pinNumber = 27; }

    const vEsp = 3.3;
    const vResistor = vEsp - vDrop;
    const currentMa = (vResistor / 220) * 1000;

    elVoltage.innerText = `${vEsp.toFixed(1)} V (HIGH - GPIO ${pinNumber})`;
    elVled.innerText = `${vDrop.toFixed(1)} V`;
    elCurrent.innerText = `${currentMa.toFixed(1)} mA (Seguro!)`;
    
    if (elState) {
      elState.innerText = `CORRENTE ATIVA NO GPIO ${pinNumber}`;
      elState.style.color = '#38bdf8';
    }
  }

  animate(timestamp) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Gerencia o piscar se for alerta vermelho
    let isCurrentFlowing = this.switchClosed && this.activeLed !== 'none';
    if (this.isBlinking) {
      this.blinkTimer = (this.blinkTimer + 1) % 40;
      isCurrentFlowing = (this.blinkTimer < 20);
    }

    this.drawCircuitDiagram(isCurrentFlowing);

    requestAnimationFrame(this.animate);
  }

  drawCircuitDiagram(isFlowing) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // Pontos-chave do circuito em laço retangular
    const left = w * 0.12;
    const right = w * 0.88;
    const top = h * 0.28;
    const bottom = h * 0.78;

    // Fundo da Protoboard / Placa
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(left - 20, top - 45, (right - left) + 40, (bottom - top) + 85, 12);
    ctx.fill();
    ctx.stroke();

    // 1. Trilha do fio condutor
    ctx.strokeStyle = isFlowing ? 'rgba(56, 189, 248, 0.4)' : '#334155';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(left, bottom); // GND
    ctx.lineTo(left, top);    // PINO GPIO ESP32
    ctx.lineTo(right, top);   // RESISTOR -> LED
    ctx.lineTo(right, bottom);// Fio de retorno
    ctx.lineTo(left, bottom); // Fecha o laço no GND
    ctx.stroke();

    // 2. Chave Eletrônica Interna do ESP32 (Transistor MOSFET)
    const switchX = left;
    const switchY = top + (bottom - top) * 0.4;
    this.drawSwitch(ctx, switchX, switchY, isFlowing);

    // 3. Bloco do ESP32 (Fonte 3.3V)
    this.drawEspPin(ctx, left, top, isFlowing);

    // 4. Resistor de 220 Ohms
    const resistorX = left + (right - left) * 0.38;
    const resistorY = top;
    this.drawResistor(ctx, resistorX, resistorY);

    // 5. LED (Verde / Amarelo / Vermelho)
    const ledX = left + (right - left) * 0.75;
    const ledY = top;
    this.drawLed(ctx, ledX, ledY, isFlowing);

    // 6. Bloco GND (Terra / 0V)
    this.drawGnd(ctx, left + 40, bottom);

    // 7. Partículas de elétrons fluindo no sentido da corrente
    if (isFlowing) {
      this.drawElectrons(ctx, left, right, top, bottom);
      this.drawPhotons(ctx, ledX, ledY);
    }
  }

  drawSwitch(ctx, x, y, isClosed) {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(x, y - 25, 4, 0, Math.PI * 2);
    ctx.arc(x, y + 25, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Braço da chave lógica
    ctx.strokeStyle = isClosed ? '#38bdf8' : '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y + 25);
    if (isClosed) {
      ctx.lineTo(x, y - 25);
    } else {
      ctx.lineTo(x + 22, y - 15); // Aberta
    }
    ctx.stroke();

    // Label
    ctx.fillStyle = isClosed ? '#38bdf8' : '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(isClosed ? 'Chave HIGH (Ligada)' : 'Chave LOW (Aberta)', x - 12, y + 4);
  }

  drawEspPin(ctx, x, y, isHigh) {
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 30, y - 35, 60, 30, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESP32', x, y - 20);
    ctx.font = '9px monospace';
    ctx.fillText(isHigh ? '3.3V OUT' : '0.0V (OFF)', x, y - 9);
  }

  drawResistor(ctx, x, y) {
    const rw = 56;
    const rh = 18;

    ctx.fillStyle = '#d97706'; // Corpo de cerâmica bege/marrom
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - rw / 2, y - rh / 2, rw, rh, 4);
    ctx.fill();
    ctx.stroke();

    // Faixas de cores do resistor de 220 Ohms (Vermelho, Vermelho, Marrom, Ouro)
    const bands = ['#ef4444', '#ef4444', '#78350f', '#facc15'];
    bands.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(x - rw / 2 + 10 + i * 10, y - rh / 2, 4, rh);
    });

    // Rótulo
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Resistor 220 Ω', x, y - 18);
    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('(Limita a Corrente)', x, y + 24);
  }

  drawLed(ctx, x, y, isLit) {
    let ledColor = '#10b981';
    let glowColor = 'rgba(16, 185, 129, 0.7)';
    let ledName = 'LED Verde';

    if (this.activeLed === 'yellow') {
      ledColor = '#f59e0b';
      glowColor = 'rgba(245, 158, 11, 0.7)';
      ledName = 'LED Amarelo';
    } else if (this.activeLed === 'red' || this.activeLed === 'red_blink') {
      ledColor = '#ef4444';
      glowColor = 'rgba(239, 68, 68, 0.7)';
      ledName = 'LED Vermelho';
    }

    if (!isLit) {
      ledColor = '#475569';
      glowColor = 'transparent';
    }

    // Brilho (Glow)
    if (isLit) {
      const grad = ctx.createRadialGradient(x, y, 5, x, y, 40);
      grad.addColorStop(0, glowColor);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cúpula do LED (Ânodo (+) na esquerda, Cátodo (-) na direita)
    ctx.fillStyle = ledColor;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rótulo do LED e polaridade
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ledName, x, y - 22);

    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Ânodo (+)', x - 18, y + 26);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Cátodo (-)', x + 20, y + 26);
  }

  drawGnd(ctx, x, y) {
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 16, y);
    ctx.lineTo(x + 16, y);
    ctx.moveTo(x - 10, y + 5);
    ctx.lineTo(x + 10, y + 5);
    ctx.moveTo(x - 4, y + 10);
    ctx.lineTo(x + 4, y + 10);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GND (0V)', x, y + 24);
  }

  drawElectrons(ctx, left, right, top, bottom) {
    const perimeter = 2 * (right - left) + 2 * (bottom - top);

    this.electrons.forEach((p) => {
      p.progress = (p.progress + p.speed) % 1.0;
      const dist = p.progress * perimeter;
      let px = left;
      let py = top;

      // Trajetória: Top-Left -> Top-Right -> Bottom-Right -> Bottom-Left -> Top-Left
      const seg1 = right - left;
      const seg2 = bottom - top;
      const seg3 = right - left;

      if (dist < seg1) {
        px = left + dist;
        py = top;
      } else if (dist < seg1 + seg2) {
        px = right;
        py = top + (dist - seg1);
      } else if (dist < seg1 + 2 * seg2) {
        px = right - (dist - seg1 - seg2);
        py = bottom;
      } else {
        px = left;
        py = bottom - (dist - seg1 - 2 * seg2);
      }

      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  drawPhotons(ctx, x, y) {
    // Emissão de ondas / raios de luz a partir do LED
    if (Math.random() > 0.4) {
      this.photons.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 3,
        vy: -1.5 - Math.random() * 2.5,
        life: 1.0
      });
    }

    ctx.fillStyle = '#fef08a';
    this.photons.forEach((pt, i) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life -= 0.04;
      if (pt.life <= 0) {
        this.photons.splice(i, 1);
        return;
      }
      ctx.globalAlpha = pt.life;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }
}

window.CircuitSimulator = CircuitSimulator;
