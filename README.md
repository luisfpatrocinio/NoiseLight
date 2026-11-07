# 🚦 NoiseLight — O Semáforo do Barulho 🔊

> **Projeto para a Feira de Ciências e Robótica — Alunos do 6º Ano do Ensino Fundamental**  
> Desenvolvido com microcontrolador **ESP32**, sensor de som digital e sinalização luminosa por LEDs.

[![GitHub Pages](https://img.shields.io/badge/Demo%20Interativa-GitHub%20Pages-38bdf8?style=for-the-badge&logo=googlechrome&logoColor=white)](https://luisfpatrocinio.github.io/NoiseLight/)
[![PlatformIO](https://img.shields.io/badge/PlatformIO-ESP32-f97316?style=for-the-badge&logo=platformio&logoColor=white)](https://platformio.org/)
[![Licença](https://img.shields.io/badge/Licen%C3%A7a-MIT-10b981?style=for-the-badge)](LICENSE)

---

## 🌐 Demonstração Interativa Online

Acesse a página interativa de apresentação do projeto:  
👉 **[https://luisfpatrocinio.github.io/NoiseLight/](https://luisfpatrocinio.github.io/NoiseLight/)**

A página conta com **3 seções interativas especiais**:
1. **🕹️ Maquete 3D em Tempo Real:** Modelo tridimensional com ESP32, protoboard e LEDs luminosos, com controle de ruído por slider, cenários escolares e suporte a **microfone real via Web Audio API**.
2. **⚡ Circuito Elétrico & Corrente:** Demonstração animada dos elétrons fluindo pelos pinos GPIO, o papel protetor do resistor de 220Ω (Lei de Ohm) e a emissão de fótons pelos LEDs.
3. **💻 Explorador de Código Passo a Passo:** Explicação didática de cada função em C++ (`setup`, `millis`, debounce e tomadas de decisão).

---

## 📖 Sobre o Projeto

Em uma sala de aula ou no ambiente escolar, o excesso de ruído pode atrapalhar a concentração de alunos e professores. Mas como saber quando o barulho passou do ponto?

O **NoiseLight (Semáforo do Barulho)** é uma solução de robótica educacional e IoT criada para monitorar o volume sonoro do ambiente em tempo real e fornecer um feedback visual imediato, igual a um semáforo de trânsito:

* 🟢 **Verde (Silêncio / Calmo):** Volume adequado para estudo e atividades concentradas (< 2 disparos/s).
* 🟡 **Amarelo (Atenção / Murmúrios):** Conversas moderadas; ponto de atenção antes de virar bagunça (2 a 14 disparos/s).
* 🔴 **Vermelho Piscando (Alerta / Barulho Alto):** Conversa alta, gritos ou agitação excessiva (≥ 15 disparos/s)!

---

## 🎯 Como Funciona?

O microcontrolador **ESP32** funciona como o "cérebro" do sistema:

1. **Janela de Observação (1 segundo):** A cada segundo, o ESP32 analisa continuamente o sinal recebido pelo sensor de som usando a função `millis()`.
2. **Contagem de Disparos de Som:** Cada vez que uma onda sonora ultrapassa a sensibilidade ajustada no sensor, o pino digital envia um pulso elétrico (`HIGH`). O código incrementa um contador com uma pausa rápida anti-eco (`delay(5ms)`).
3. **Decisão Automática:**
   * **Menos de 2 disparos por segundo:** Acende apenas o **LED Verde**.
   * **De 2 a 14 disparos por segundo:** Acende apenas o **LED Amarelo**.
   * **15 ou mais disparos por segundo:** Apaga os demais e faz o **LED Vermelho piscar** rapidamente em sinal de alerta!
4. **Monitoramento Serial:** A contagem de disparos é enviada para o computador via porta serial (115200 bps), permitindo aos alunos visualizarem os dados numéricos na tela.

---

## 📁 Estrutura de Pastas do Projeto

```text
NoiseLight/
├── docs/                      # 🌐 Página Web Interativa de Apresentação (GitHub Pages)
│   ├── index.html             # Estrutura HTML da apresentação (3 seções)
│   ├── style.css              # Estilos visuais, Dark Mode e responsividade
│   ├── app.js                 # Controlador principal, microfone real e eventos
│   ├── simulator3d.js         # Maquete 3D interativa em Three.js
│   └── circuit.js             # Animação do fluxo de corrente elétrica e Lei de Ohm
├── src/                       # 🧠 Código-Fonte do Microcontrolador ESP32
│   └── main.cpp               # Firmware completo e documentado em C++ / Arduino
├── include/                   # Cabeçalhos do PlatformIO
├── lib/                       # Bibliotecas adicionais (se necessário)
├── test/                      # Testes unitários do firmware
├── platformio.ini             # Arquivo de configuração do PlatformIO
└── README.md                  # Documentação completa do projeto
```

---

## 🛠️ Materiais e Componentes

| Item | Componente | Quantidade | Função no Projeto |
| :---: | :--- | :---: | :--- |
| 🧠 | **ESP32 DevKit V1** (30 ou 38 pinos) | 1 | Microcontrolador (cérebro do sistema) |
| 🎙️ | **Módulo Microfone Analógico MAX4466** (com ganho ajustável) | 1 | Captura as ondas sonoras e fornece sinal analógico de áudio |
| 🟢 | **LED 10mm Verde** | 1 | Indicador de silêncio |
| 🟡 | **LED 10mm Amarelo** | 1 | Indicador de atenção / ruído moderado |
| 🔴 | **LED 10mm Vermelho** | 1 | Indicador de alarme / ruído alto |
| ⚡ | **Resistores de 220 Ω ou 330 Ω** | 3 | Limitadores de corrente para proteger os LEDs |
| 🪛 | **Protoboard (Matriz de Contatos)** | 1 | Base para conexões sem necessidade de solda |
| 🔌 | **Cabos Jumpers (Macho-Macho e Macho-Fêmea)** | Vários | Fiação do circuito |
| 💻 | **Cabo Micro-USB** | 1 | Alimentação de 5V e envio do código |

---

## 🔌 Esquema de Ligação (Pinagem Otimizada - Lado Único da Protoboard)

> 💡 **Dica de Bancada:** O ESP32 DevKit é largo para protoboards comuns. A pinagem abaixo está **100% concentrada na fileira do lado 3V3**, permitindo encaixar apenas um lado do ESP32 na protoboard e deixar a montagem limpa e funcional!

| Componente | Pino do Componente | Conectar no ESP32 | Observação |
| :--- | :--- | :--- | :--- |
| **Microfone MAX4466** | `VCC` | **`3V3`** | Alimentação limpa de 3.3V |
| **Microfone MAX4466** | `GND` | **`GND`** | Pino GND logo ao lado do 3V3 |
| **Microfone MAX4466** | `OUT` (Áudio) | **`D4` (GPIO 4)** | Entrada analógica ADC2 do ESP32 |
| **LED 10mm Verde** | Ânodo (+) via resistor 220Ω | **`D18` (GPIO 18)** | Cátodo (-) vai ao barramento `GND` |
| **LED 10mm Amarelo** | Ânodo (+) via resistor 220Ω | **`D19` (GPIO 19)** | Cátodo (-) vai ao barramento `GND` |
| **LED 10mm Vermelho** | Ânodo (+) via resistor 220Ω | **`D21` (GPIO 21)** | Cátodo (-) vai ao barramento `GND` |

> ⚠️ **Dica de Eletrônica (LEDs de 10mm):** O pino mais longo do LED é o positivo (Ânodo) e deve receber o resistor (220Ω ou 330Ω) ligado ao pino do ESP32. O pino menor (Cátodo) vai ligado no barramento `GND` (negativo). Os resistores protegem tanto os LEDs quanto as saídas GPIO do ESP32.

---

## 🎛️ Calibrando o Módulo MAX4466

O módulo MAX4466 possui um pequeno **trimpot traseiro** que ajusta o ganho do amplificador (de 25x a 125x):

1. **Ajuste Inicial do Trimpot:** Deixe o trimpot na posição central (cerca de metade do curso).
2. **Abra o Serial Plotter / Monitor:** No PlatformIO / VS Code, abra o monitor serial em **115200 baud** (ou o Serial Plotter).
3. **Observação do Sinal:**
   - Em silêncio, a amplitude deve oscilar entre **40 e 180**.
   - Ao falar normalmente a 1 metro, a amplitude sobe para **400 ~ 1000**.
   - Ao bater palmas ou falar alto, a amplitude ultrapassa **1200 ~ 2500+**.
4. Se o microfone estiver muito sensível ou pouco sensível, ajuste o parafuso do trimpot traseiro com uma chave pequena e/ou ajuste as constantes `limiarAmarelo` e `limiarVermelho` no código.

---

## 💻 Estrutura do Código (`src/main.cpp`)

```cpp
#include <Arduino.h>

const int PINO_SENSOR_SOM  = 34; // Entrada digital ligada no D0 do sensor de som
const int PINO_LED_VERDE   = 25; // Controle do LED Verde (Silêncio)
const int PINO_LED_AMARELO = 26; // Controle do LED Amarelo (Atenção)
const int PINO_LED_VERMELHO= 27; // Controle do LED Vermelho (Alerta)

const int LIMIAR_SILENCIO = 2;   // < 2 = Verde
const int LIMIAR_MODERADO = 15;  // 2 a 14 = Amarelo; >= 15 = Vermelho

void setup() {
  Serial.begin(115200); 
  pinMode(PINO_SENSOR_SOM, INPUT);
  pinMode(PINO_LED_VERDE, OUTPUT);
  pinMode(PINO_LED_AMARELO, OUTPUT);
  pinMode(PINO_LED_VERMELHO, OUTPUT);
}

void loop() {
  int contadorDeRuido = 0;
  unsigned long tempoInicio = millis();

  // Janela de amostragem de 1 segundo (1000 milissegundos)
  while (millis() - tempoInicio < 1000) {
    if (digitalRead(PINO_SENSOR_SOM) == HIGH) {
      contadorDeRuido++;
      delay(5); // Pausa anti-repique / eco (Debounce)
    }
  }

  // Lógica de Decisão do Semáforo
  if (contadorDeRuido < LIMIAR_SILENCIO) { 
    digitalWrite(PINO_LED_VERDE, HIGH);
    digitalWrite(PINO_LED_AMARELO, LOW);
    digitalWrite(PINO_LED_VERMELHO, LOW);
  } 
  else if (contadorDeRuido < LIMIAR_MODERADO) { 
    digitalWrite(PINO_LED_VERDE, LOW);
    digitalWrite(PINO_LED_AMARELO, HIGH);
    digitalWrite(PINO_LED_VERMELHO, LOW);
  } 
  else { 
    digitalWrite(PINO_LED_VERDE, LOW);
    digitalWrite(PINO_LED_AMARELO, LOW);
    
    // Vermelho piscando em sinal de alerta
    digitalWrite(PINO_LED_VERMELHO, HIGH);
    delay(100);
    digitalWrite(PINO_LED_VERMELHO, LOW);
    delay(100);
  }
}
```

---

## 🚀 Como Compilar e Enviar para o ESP32

O projeto está organizado no formato padrão do **PlatformIO** (para VS Code):

1. Clone este repositório:
   ```bash
   git clone https://github.com/luisfpatrocinio/NoiseLight.git
   ```
2. Abra a pasta do projeto no **VS Code** com a extensão **PlatformIO IDE** instalada.
3. Conecte o ESP32 ao computador via cabo USB.
4. Clique no ícone de **Build** (✓) e depois em **Upload** (➡️).
5. Abra o **Serial Monitor** em 115200 baud para acompanhar a contagem em tempo real!

---

## 🎓 Aprendizados Pedagógicos (BNCC & Robótica)

* **Pensamento Computacional:** Condicionais (`if/else`), repetições (`while`), temporização (`millis`) e filtros de sinal (`debounce`).
* **Eletrônica e Física:** Circuitos fechados, polaridade de semicondutores (LEDs), cálculo de resistores (Lei de Ohm: $V = R \cdot I$) e propagação de ondas acústicas.
* **Cidadania e Convivência Escolar:** Conscientização sobre poluição sonora e colaboração para um ambiente de estudos agradável.

---

## 👨‍🏫 Autoria e Créditos

Projeto desenvolvido para demonstração prática e pedagógica na Feira de Ciências e Robótica do 6º Ano do Ensino Fundamental.  
Sinta-se à vontade para clonar, estudar, adaptar e usar em sala de aula! ⭐
