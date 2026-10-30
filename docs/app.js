/**
 * app.js — Controlador Principal da Página de Apresentação
 * Projeto: NoiseLight (Semáforo do Barulho)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar os Simuladores
  const sim3d = new NoiseLight3D('canvas-3d-box');
  const circuit = new CircuitSimulator('canvas-circuit');

  // Estado Atual
  let currentNoise = 0;
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
  const presetBtns = document.querySelectorAll('.btn-preset');

  // Circuit LED buttons
  const ledPickBtns = document.querySelectorAll('.led-pick-btn');

  // Code Explorer buttons & code block
  const codeNavBtns = document.querySelectorAll('.code-nav-btn');
  const codeDisplay = document.getElementById('code-display');
  const codeExplanation = document.getElementById('code-explanation-text');

  // 2. Atualização de Ruído
  function updateNoiseLevel(value, source = 'slider') {
    currentNoise = parseInt(value, 10);
    if (source !== 'slider' && slider) {
      slider.value = currentNoise;
    }
    if (noiseValueDisplay) {
      noiseValueDisplay.innerText = currentNoise;
    }

    // Atualiza simulador 3D
    sim3d.setNoiseCount(currentNoise);

    // Atualiza badges e textos explicativos
    if (currentNoise < 2) {
      statusBadge.innerHTML = '🟢 Silêncio (Ideal)';
      statusBadge.style.borderColor = '#10b981';
      statusBadge.style.color = '#10b981';
      statusDesc.innerText = 'Abaixo de 2 disparos/s: Sala tranquila, ambiente propício para estudo e concentração.';
      circuit.setLed('green');
      highlightCircuitButton('green');
    } else if (currentNoise >= 2 && currentNoise < 15) {
      statusBadge.innerHTML = '🟡 Atenção (Murmúrios)';
      statusBadge.style.borderColor = '#f59e0b';
      statusBadge.style.color = '#f59e0b';
      statusDesc.innerText = 'Entre 2 e 14 disparos/s: Falatório leve ou trabalho em grupo. Fique atento para não aumentar!';
      circuit.setLed('yellow');
      highlightCircuitButton('yellow');
    } else {
      statusBadge.innerHTML = '🔴 Alerta (Barulho Excessivo)';
      statusBadge.style.borderColor = '#ef4444';
      statusBadge.style.color = '#ef4444';
      statusDesc.innerText = '15 ou mais disparos/s: Volume acima do permitido! LED vermelho piscando em sinal de alerta.';
      circuit.setLed('red_blink');
      highlightCircuitButton('red');
    }
  }

  function highlightCircuitButton(color) {
    ledPickBtns.forEach(btn => {
      btn.classList.remove('active-green', 'active-yellow', 'active-red');
      if (btn.dataset.led === color) {
        btn.classList.add(`active-${color}`);
      }
    });
  }

  // 3. Eventos do Slider
  if (slider) {
    slider.addEventListener('input', (e) => {
      // Remove estado ativo dos botões preset se usuário mexer no slider
      presetBtns.forEach(b => b.classList.remove('active'));
      updateNoiseLevel(e.target.value, 'slider');
    });
  }

  // 4. Presets (Silêncio, Conversa, Gritos)
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.dataset.value;
      updateNoiseLevel(val, 'preset');
    });
  });

  // 5. Botões do Painel de Corrente Elétrica
  ledPickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const ledColor = btn.dataset.led;
      highlightCircuitButton(ledColor);
      circuit.setLed(ledColor);
    });
  });

  // 6. Teste de Microfone Real (Web Audio API)
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
    if (audioContext) {
      audioContext.close();
    }
    isListeningMic = false;
    if (btnMic) {
      btnMic.classList.remove('listening');
      btnMic.innerHTML = '🎙️ Testar com Microfone Real';
    }
  }

  function listenAudioLoop() {
    if (!isListeningMic || !analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Calcula a intensidade média do som captado
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;

    // Converte o volume médio (0 a 128) para estimativa de disparos sonoros (0 a 30)
    let simulatedShots = 0;
    if (average > 10) {
      simulatedShots = Math.min(30, Math.floor((average - 10) * 0.7));
    }

    updateNoiseLevel(simulatedShots, 'mic');

    requestAnimationFrame(listenAudioLoop);
  }

  // 7. Navegação Interativa do Código-Fonte
  const codeSnippets = {
    setup: {
      code: `<span class="hl-com">// 1. Função executada uma única vez ao ligar o ESP32</span>
<span class="hl-type">void</span> <span class="hl-func">setup</span>() {
  <span class="hl-func">Serial</span>.<span class="hl-func">begin</span>(<span class="hl-num">115200</span>); <span class="hl-com">// Comunicação com o computador</span>

  <span class="hl-target"><span class="hl-func">pinMode</span>(PINO_SENSOR_SOM, <span class="hl-kw">INPUT</span>);  <span class="hl-com">// Sensor de som envia dados para o ESP32</span></span>
  <span class="hl-target"><span class="hl-func">pinMode</span>(PINO_LED_VERDE, <span class="hl-kw">OUTPUT</span>);   <span class="hl-com">// Pino envia corrente para o LED Verde</span></span>
  <span class="hl-target"><span class="hl-func">pinMode</span>(PINO_LED_AMARELO, <span class="hl-kw">OUTPUT</span>); <span class="hl-com">// Pino envia corrente para o LED Amarelo</span></span>
  <span class="hl-target"><span class="hl-func">pinMode</span>(PINO_LED_VERMELHO, <span class="hl-kw">OUTPUT</span>);<span class="hl-com">// Pino envia corrente para o LED Vermelho</span></span>
}`,
      explanation: 'No <code>setup()</code>, definimos o papel de cada pino. O pino do microfone é configurado como <strong>INPUT</strong> (entrada de dados auditivos) e os pinos dos LEDs são configurados como <strong>OUTPUT</strong> (saídas capazes de fornecer 3.3V para acender os componentes).'
    },
    sampling: {
      code: `<span class="hl-com">// 2. Amostragem temporal de 1 segundo (1000 milissegundos)</span>
<span class="hl-type">int</span> contadorDeRuido = <span class="hl-num">0</span>;
<span class="hl-type">unsigned long</span> tempoInicio = <span class="hl-func">millis</span>();

<span class="hl-target"><span class="hl-kw">while</span> (<span class="hl-func">millis</span>() - tempoInicio &lt; <span class="hl-num">1000</span>) {</span>
  <span class="hl-com">// O microprocessador fica atento a cada pulso do microfone</span>
  <span class="hl-kw">if</span> (<span class="hl-func">digitalRead</span>(PINO_SENSOR_SOM) == <span class="hl-kw">HIGH</span>) {
    contadorDeRuido++;
    <span class="hl-func">delay</span>(<span class="hl-num">5</span>); <span class="hl-com">// Pausa anti-eco de 5 milissegundos</span>
  }
}`,
      explanation: 'Usamos a função <code>millis()</code> como um cronômetro digital interno. Durante exatamente 1000 milissegundos (1 segundo), o ESP32 realiza leituras contínuas do sensor de som e acumula na variável <code>contadorDeRuido</code>.'
    },
    debounce: {
      code: `<span class="hl-com">// 3. Detecção e Filtro Anti-Repique (Debounce)</span>
<span class="hl-target"><span class="hl-kw">if</span> (<span class="hl-func">digitalRead</span>(PINO_SENSOR_SOM) == <span class="hl-kw">HIGH</span>) {</span>
  contadorDeRuido++;  <span class="hl-com">// Registra uma onda de barulho</span>
  <span class="hl-target"><span class="hl-func">delay</span>(<span class="hl-num">5</span>);           <span class="hl-com">// Aguarda o eco acústico se dissipar</span></span>
}`,
      explanation: 'Uma palma ou fala não é um som instantâneo; o som vibra o ar várias vezes em milissegundos. Sem o <code>delay(5)</code>, uma única batida de palma seria contada centenas de vezes. O atraso atua como um "filtro anti-eco" essencial em projetos de sensores.'
    },
    decision: {
      code: `<span class="hl-com">// 4. Tomada de Decisão Pedagógica (Lógica do Semáforo)</span>
<span class="hl-target"><span class="hl-kw">if</span> (disparos &lt; <span class="hl-num">2</span>) {</span>
  <span class="hl-func">acenderSomenteVerde</span>();    <span class="hl-com">// Ambiente calmo e focado</span>
<span class="hl-target">} <span class="hl-kw">else if</span> (disparos &gt;= <span class="hl-num">2</span> &amp;&amp; disparos &lt; <span class="hl-num">15</span>) {</span>
  <span class="hl-func">acenderSomenteAmarelo</span>();  <span class="hl-com">// Conversas moderadas (Atenção)</span>
<span class="hl-target">} <span class="hl-kw">else</span> {</span>
  <span class="hl-func">alertarVermelhoPiscando</span>();<span class="hl-com">// Excesso de barulho (Alerta)</span>
}`,
      explanation: 'Demonstra a aplicação prática do <strong>Pensamento Computacional</strong> com estruturas condicionais <code>if-else</code>. O microcontrolador compara a quantidade de disparos com os limiares pré-calibrados e aciona a função luminosa correspondente.'
    },
    blink: {
      code: `<span class="hl-com">// 5. Efeito Estroboscópico de Alerta do LED Vermelho</span>
<span class="hl-type">void</span> <span class="hl-func">alertarVermelhoPiscando</span>() {
  <span class="hl-func">digitalWrite</span>(PINO_LED_VERDE, <span class="hl-kw">LOW</span>);
  <span class="hl-func">digitalWrite</span>(PINO_LED_AMARELO, <span class="hl-kw">LOW</span>);
  
  <span class="hl-target"><span class="hl-func">digitalWrite</span>(PINO_LED_VERMELHO, <span class="hl-kw">HIGH</span>); <span class="hl-com">// Liga o LED (3.3V)</span></span>
  <span class="hl-func">delay</span>(<span class="hl-num">100</span>);
  <span class="hl-target"><span class="hl-func">digitalWrite</span>(PINO_LED_VERMELHO, <span class="hl-kw">LOW</span>);  <span class="hl-com">// Desliga o LED (0V)</span></span>
  <span class="hl-func">delay</span>(<span class="hl-num">100</span>);
}`,
      explanation: 'Alternar rapidamente a tensão no pino entre 3.3V (HIGH) e 0V (LOW) com intervalos de 100 milissegundos cria o efeito de semáforo piscante, chamando a atenção visual imediata dos estudantes na sala de aula.'
    }
  };

  codeNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      codeNavBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const sectionKey = btn.dataset.section;
      const data = codeSnippets[sectionKey];
      if (data) {
        codeDisplay.innerHTML = data.code;
        codeExplanation.innerHTML = data.explanation;
      }
    });
  });

  // Inicialização padrão: Nível de silêncio (Verde)
  updateNoiseLevel(0, 'init');
});
