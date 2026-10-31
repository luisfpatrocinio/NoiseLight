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
      elState.style.color = '#ff5500';
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

    // Fundo da Protoboard / Placa com geometria limpa retangular (Zero Border-Radius)
    ctx.fillStyle = 'rgba(18, 18, 24, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(left - 20, top - 45, (right - left) + 40, (bottom - top) + 85);
    ctx.fill();
    ctx.stroke();

    // Rótulo discreto
    ctx.fillStyle = '#71717a';
    ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DIAGRAMA DE CARGA // GPIO 3.3V', left - 8, top - 25);

    // 1. Trilha do fio condutor
    ctx.strokeStyle = isFlowing ? 'rgba(255, 85, 0, 0.55)' : '#27272a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';

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
    ctx.fillStyle = '#18181c';
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.rect(x - 3, y - 24, 6, 6);
    ctx.rect(x - 3, y + 18, 6, 6);
    ctx.fill();
    ctx.stroke();

    // Braço da chave lógica
    ctx.strokeStyle = isClosed ? '#ff5500' : '#52525b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + 18);
    if (isClosed) {
      ctx.lineTo(x, y - 18);
    } else {
      ctx.lineTo(x + 18, y - 10);
    }
    ctx.stroke();

    // Label
    ctx.fillStyle = isClosed ? '#ff5500' : '#a1a1aa';
    ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(isClosed ? 'MOSFET: HIGH (3.3V)' : 'MOSFET: LOW (0.0V)', x - 12, y + 4);
  }

  drawEspPin(ctx, x, y, isHigh) {
    ctx.fillStyle = '#18181c';
    ctx.strokeStyle = isHigh ? '#ff5500' : '#27272a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(x - 32, y - 32, 64, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f4f4f5';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESP32', x, y - 18);
    ctx.font = '500 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = isHigh ? '#ff5500' : '#71717a';
    ctx.fillText(isHigh ? '3.3V OUT' : '0.0V OFF', x, y - 8);
  }

  drawResistor(ctx, x, y) {
    const rw = 52;
    const rh = 16;

    ctx.fillStyle = '#222228';
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(x - rw / 2, y - rh / 2, rw, rh);
    ctx.fill();
    ctx.stroke();

    // Faixas de cores do resistor de 220 Ohms (Vermelho, Vermelho, Marrom, Ouro)
    const bands = ['#ef4444', '#ef4444', '#78350f', '#facc15'];
    bands.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(x - rw / 2 + 10 + i * 9, y - rh / 2, 3, rh);
    });

    // Rótulo
    ctx.fillStyle = '#f4f4f5';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('220 Ω', x, y - 16);
    ctx.font = '500 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('Limitador de Corrente', x, y + 22);
  }

  drawLed(ctx, x, y, isLit) {
    let ledColor = '#10b981';
    let ledName = 'LED Verde';

    if (this.activeLed === 'yellow') {
      ledColor = '#f59e0b';
      ledName = 'LED Amarelo';
    } else if (this.activeLed === 'red' || this.activeLed === 'red_blink') {
      ledColor = '#ef4444';
      ledName = 'LED Vermelho';
    }

    if (!isLit) {
      ledColor = '#27272a';
    }

    // Brilho suave
    if (isLit) {
      const grad = ctx.createRadialGradient(x, y, 4, x, y, 32);
      grad.addColorStop(0, ledColor + '88');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, 32, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cúpula do LED
    ctx.fillStyle = ledColor;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Rótulos
    ctx.fillStyle = '#f4f4f5';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ledName, x, y - 20);

    ctx.font = '500 9px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ff5500';
    ctx.fillText('Ânodo (+)', x - 18, y + 24);
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('Cátodo (-)', x + 20, y + 24);
  }

  drawGnd(ctx, x, y) {
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 14, y);
    ctx.lineTo(x + 14, y);
    ctx.moveTo(x - 9, y + 4);
    ctx.lineTo(x + 9, y + 4);
    ctx.moveTo(x - 4, y + 8);
    ctx.lineTo(x + 4, y + 8);
    ctx.stroke();

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GND (0V)', x, y + 22);
  }

  drawElectrons(ctx, left, right, top, bottom) {
    const perimeter = 2 * (right - left) + 2 * (bottom - top);

    this.electrons.forEach((p) => {
      p.progress = (p.progress + p.speed) % 1.0;
      const dist = p.progress * perimeter;
      let px = left;
      let py = top;

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

      ctx.fillStyle = '#ff5500';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
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
