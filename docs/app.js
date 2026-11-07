/**
 * app.js — Controlador Principal da Apresentação NoiseLight
 * Projeto para a Feira de Ciências e Robótica do 6º Ano
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializa o visualizador 3D
  const sim3d = new NoiseLight3D('canvas-3d-box');

  // Estado da aplicação
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

  // Abas do visualizador de código
  const codeTabs = document.querySelectorAll('.code-tab-btn');
  const codeDisplay = document.getElementById('code-display');
  const codeExplanation = document.getElementById('code-explanation-text');
  const btnCopyCode = document.getElementById('btn-copy-code');

  // 2. Função de Atualização do Nível de Ruído
  function updateNoiseLevel(value, source = 'slider') {
    currentNoise = parseInt(value, 10);
    if (isNaN(currentNoise)) currentNoise = 0;

    if (source !== 'slider' && slider) {
      slider.value = currentNoise;
    }
    if (noiseValueDisplay) {
      noiseValueDisplay.innerText = currentNoise;
    }

    // Atualiza o simulador 3D (LEDs e luzes)
    if (sim3d) {
      sim3d.setNoiseCount(currentNoise);
    }

    // Atualiza badges visuais de status
    if (currentNoise < 15) {
      statusBadge.innerHTML = '🟢 Silêncio (Ambiente Calmo)';
      statusBadge.className = 'overlay-status status-green';
      statusDesc.innerText = 'Volume ideal para estudo e concentração (< 900 de amplitude). Apenas o LED verde aceso.';
    } else if (currentNoise >= 15 && currentNoise < 48) {
      statusBadge.innerHTML = '🟡 Atenção (Conversas)';
      statusBadge.className = 'overlay-status status-yellow';
      statusDesc.innerText = 'Trabalho em grupo ou murmúrios (900 a 2200). Ponto de atenção para não subir mais!';
    } else {
      statusBadge.innerHTML = '🔴 Alerta (Barulho Excessivo!)';
      statusBadge.className = 'overlay-status status-red';
      statusDesc.innerText = 'Volume alto ou gritaria (> 2200). O LED vermelho pisca em alerta estroboscópico!';
    }
  }

  // 3. Evento do Slider de Ruído
  if (slider) {
    slider.addEventListener('input', (e) => {
      presetBtns.forEach(b => b.classList.remove('active'));
      updateNoiseLevel(e.target.value, 'slider');
    });
  }

  // 4. Botões de Cenários Escolares (Presets)
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.dataset.value;
      updateNoiseLevel(val, 'preset');
    });
  });

  // 5. Botão de Revelar / Ocultar Fiações 3D
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

  // 6. Teste com Microfone Real (Web Audio API)
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

    // Converte o volume médio para a escala da maquete (0 a 70)
    let simulatedNoise = 0;
    if (average > 8) {
      simulatedNoise = Math.min(70, Math.floor((average - 8) * 1.4));
    }

    updateNoiseLevel(simulatedNoise, 'mic');
    requestAnimationFrame(listenAudioLoop);
  }

  // 7. Navegação e Conteúdo das Abas de Código
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
      explanation: 'Este é o firmware completo gravado no ESP32. Ele configura o conversor analógico-digital (ADC) para ler o microfone analógico MAX4466 no pino D4 e controla as saídas digitais D18, D19 e D21 para acionar os LEDs de 10mm.'
    },

    sampling: {
      code: `// --- LEITURA DO MAX4466 (PICO-A-PICO) ---
int medirAmplitudePicoAPico(unsigned long duracaoMs) {
  unsigned long tempoInicio = millis();
  int valorMin = 4095;
  int valorMax = 0;

  // Lê a onda de som continuamente por 50 milissegundos
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

  // Se atingiu o nível crítico, ativa a retenção temporária
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
      explanation: 'Aqui o ESP32 atua como o "cérebro" do semáforo. Usando condicionais (if / else if / else), ele compara a amplitude com os limiares. Um recurso essencial é o "Peak Hold" de 1,5 segundo: se alguém grita, o vermelho permanece ativo por um momento para garantir que todos na sala vejam o alerta.'
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
      explanation: 'Para piscar o LED vermelho de forma rápida e estroboscópica sem travar o ESP32, usamos a função millis() em vez de delay(). Isso permite que o microcontrolador continue medindo o som do microfone em segundo plano sem qualquer interrupção!'
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

  // 8. Botão Copiar Código
  if (btnCopyCode) {
    btnCopyCode.addEventListener('click', () => {
      const tempElement = document.createElement('textarea');
      tempElement.value = codeDisplay.innerText;
      document.body.appendChild(tempElement);
      tempElement.select();
      document.execCommand('copy');
      document.body.removeChild(tempElement);

      const originalText = btnCopyCode.innerHTML;
      btnCopyCode.innerHTML = '✅ Código Copiado!';
      setTimeout(() => {
        btnCopyCode.innerHTML = originalText;
      }, 2000);
    });
  }

  // Inicializa o som padrão (calmo)
  updateNoiseLevel(5, 'init');
});
