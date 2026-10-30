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
| 🎙️ | **Módulo Sensor de Som / Microfone** (KY-038 ou similar com saída digital D0) | 1 | Detecta as ondas sonoras e emite pulsos digitais |
| 🟢 | **LED 5mm Verde** | 1 | Indicador de silêncio |
| 🟡 | **LED 5mm Amarelo** | 1 | Indicador de atenção / ruído moderado |
| 🔴 | **LED 5mm Vermelho** | 1 | Indicador de alarme / ruído alto |
| ⚡ | **Resistores de 220 Ω ou 330 Ω** | 3 | Limitadores de corrente para proteger os LEDs |
| 🪛 | **Protoboard (Matriz de Contatos)** | 1 | Base para conexões sem necessidade de solda |
| 🔌 | **Cabos Jumpers (Macho-Macho e Macho-Fêmea)** | Vários | Fiação do circuito |
| 💻 | **Cabo Micro-USB** | 1 | Alimentação de 5V e envio do código |

---

## 🔌 Esquema de Ligação (Pinagem)

| Componente | Pino do Componente | Conectar no ESP32 | Observação |
| :--- | :--- | :--- | :--- |
| **Sensor de Som** | `VCC` | `3V3` ou `VIN` (5V) | Alimentação do sensor |
| **Sensor de Som** | `GND` | `GND` | Terra comum |
| **Sensor de Som** | `D0` (Digital Out) | **GPIO 34** | Leitura dos pulsos digitais |
| **LED Verde** | Ânodo (+) via resistor 220Ω | **GPIO 25** | Cátodo (-) vai ao `GND` |
| **LED Amarelo** | Ânodo (+) via resistor 220Ω | **GPIO 26** | Cátodo (-) vai ao `GND` |
| **LED Vermelho** | Ânodo (+) via resistor 220Ω | **GPIO 27** | Cátodo (-) vai ao `GND` |

> ⚠️ **Dica de Eletrônica:** Lembre-se que o pino mais longo do LED é o positivo (Ânodo) e deve receber o resistor ligado ao pino do ESP32. O pino menor (Cátodo com corte chanfrado no corpo plástico) vai ligado no `GND` (negativo).

---

## 🎛️ Calibrando o Sensor de Som

Na plaquinha do sensor de som existe um **trimpot azul com parafuso** (potenciômetro miniatura):

1. Ligue o ESP32 na porta USB.
2. Com uma chave de fenda pequena, gire delicadamente o parafuso:
   * **Sentido horário ou anti-horário** até que o LED indicador do sensor (geralmente `L2` ou `OUT`) fique apagado em silêncio.
   * Ao bater palmas ou falar perto do microfone, esse LED deve piscar momentaneamente.
3. Se o LED ficar o tempo todo aceso ou nunca piscar, continue ajustando o trimpot até encontrar o ponto de equilíbrio para a acústica da sala.

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
