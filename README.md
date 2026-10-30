# 🚦 NoiseLight — O Semáforo do Barulho 🔊

> **Projeto para a Feira de Ciências e Robótica — Alunos do 6º Ano do Ensino Fundamental**  
> Desenvolvido com microcontrolador **ESP32**, sensor de som digital e sinalização luminosa por LEDs.

---

## 📖 Sobre o Projeto

Em uma sala de aula ou no ambiente escolar, o excesso de ruído pode atrapalhar a concentração de alunos e professores. Mas como saber quando o barulho passou do ponto?

O **NoiseLight (Semáforo do Barulho)** é uma solução de robótica educacional e IoT criada para monitorar o volume sonoro do ambiente em tempo real e fornecer um feedback visual imediato, igual a um semáforo de trânsito:

* 🟢 **Verde (Silêncio / Calmo):** Volume adequado para estudo e atividades concentradas.
* 🟡 **Amarelo (Atenção / Murmúrios):** Conversas moderadas; ponto de atenção antes de virar bagunça.
* 🔴 **Vermelho Piscando (Alerta / Barulho Alto):** Conversa alta, gritos ou agitação excessiva!

Além de ser um dispositivo útil para a escola, o projeto ensina conceitos práticos de **programação**, **sensores**, **eletrônica** e **conscientização auditiva**.

---

## 🎯 Como Funciona?

O microcontrolador **ESP32** funciona como o "cérebro" do sistema:

1. **Janela de Observação (1 segundo):** A cada segundo, o ESP32 analisa continuamente o sinal recebido pelo sensor de som.
2. **Contagem de Disparos de Som:** Cada vez que uma onda sonora ultrapassa a sensibilidade ajustada no sensor, o pino digital envia um pulso elétrico (`HIGH`). O código incrementa um contador com uma pausa rápida anti-eco (`delay(5ms)`).
3. **Decisão Automática:**
   * **Menos de 2 disparos por segundo:** Acende apenas o **LED Verde**.
   * **De 2 a 14 disparos por segundo:** Acende apenas o **LED Amarelo**.
   * **15 ou mais disparos por segundo:** Apaga os demais e faz o **LED Vermelho piscar** rapidamente em sinal de alerta!
4. **Monitoramento Serial:** A contagem de disparos é enviada para o computador via porta serial (115200 bps), permitindo aos alunos visualizarem os dados numéricos na tela.

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

// Pinos configurados no ESP32
int pinoSensorSom = 34; // Entrada digital ligada no D0 do sensor
int ledVerde = 25;      
int ledAmarelo = 26;    
int ledVermelho = 27;   

void setup() {
  Serial.begin(115200); 
  pinMode(pinoSensorSom, INPUT);
  
  pinMode(ledVerde, OUTPUT);
  pinMode(ledAmarelo, OUTPUT);
  pinMode(ledVermelho, OUTPUT);
}

void loop() {
  int contadorDeRuido = 0;
  unsigned long tempoInicio = millis();

  // Janela de amostragem de 1 segundo (1000 milissegundos)
  while (millis() - tempoInicio < 1000) {
    if (digitalRead(pinoSensorSom) == HIGH) {
      contadorDeRuido++;
      delay(5); // Pausa anti-repique / eco
    }
  }

  Serial.print("Disparos de barulho neste segundo: ");
  Serial.println(contadorDeRuido);

  // Lógica do Semáforo
  if (contadorDeRuido < 2) { 
    // Silêncio
    digitalWrite(ledVerde, HIGH);
    digitalWrite(ledAmarelo, LOW);
    digitalWrite(ledVermelho, LOW);
  } 
  else if (contadorDeRuido >= 2 && contadorDeRuido < 15) { 
    // Murmúrio / Barulho moderado
    digitalWrite(ledVerde, LOW);
    digitalWrite(ledAmarelo, HIGH);
    digitalWrite(ledVermelho, LOW);
  } 
  else { 
    // Barulho alto!
    digitalWrite(ledVerde, LOW);
    digitalWrite(ledAmarelo, LOW);
    
    // Pisca o LED Vermelho em alerta
    digitalWrite(ledVermelho, HIGH);
    delay(100);
    digitalWrite(ledVermelho, LOW);
    delay(100);
  }
}
```

---

## 🚀 Como Compilar e Enviar para o ESP32

O projeto está organizado no formato padrão do **PlatformIO** (para VS Code):

### Pré-requisitos
* [Visual Studio Code](https://code.visualstudio.com/) instalado.
* Extensão **PlatformIO IDE** instalada no VS Code.
* Driver da placa ESP32 (CP2102 ou CH340, dependendo do modelo da sua placa).

### Passo a Passo
1. Clone este repositório ou baixe a pasta do projeto:
   ```bash
   git clone https://github.com/luisfpatrocinio/NoiseLight.git
   ```
2. Abra a pasta do projeto no **VS Code**.
3. O PlatformIO detectará automaticamente o arquivo `platformio.ini`.
4. Conecte o ESP32 ao computador pelo cabo USB.
5. Na barra inferior azul do VS Code:
   * Clique no ícone de **Build** (✓) para compilar.
   * Clique no ícone de **Upload** (➡️) para gravar no ESP32.
   * Clique no ícone de **Serial Monitor** (tomada ou plugue) para acompanhar a contagem de disparos em tempo real a 115200 baud.

---

## 🎓 Aprendizados Pedagógicos (BNCC & Robótica)

Este projeto estimula diversas competências do Ensino Fundamental II:

* **Pensamento Computacional:** Entendimento de condicionais (`if`, `else if`, `else`), laços de repetição (`while`), amostragem temporal (`millis()`) e debounce.
* **Eletrônica e Física:** Circuito elétrico fechado, fluxo de corrente, polaridade de diodos emissores de luz (LEDs), resistência elétrica (Lei de Ohm) e ondas acústicas.
* **Cidadania e Convivência Escolar:** Conscientização sobre poluição sonora e criação de um ambiente agradável de colaboração e estudo coletivo.
* **Prototipagem e Investigação Científica:** Calibração empírica de sensores e validação de hipóteses por meio de testes práticos.

---

## 💡 Ideias de Melhorias Futuras

Para as próximas fases da feira ou edições do projeto:
- [ ] Adicionar um **Buzzer piezoelétrico** para soar um "bip" curto quando entrar no estado vermelho.
- [ ] Integrar um **Display LCD I2C 16x2** ou **OLED SSD1306** exibindo mensagens como *"Shhh! Silêncio por favor"*.
- [ ] Criar uma maquete física de papelão, MDF ou impressão 3D em formato de semáforo de trânsito real.
- [ ] Conectar ao Wi-Fi do ESP32 para salvar o histórico de ruídos da sala em uma planilha ou dashboard online (IoT).

---

## 👨‍🏫 Autoria e Créditos

Projeto desenvolvido para demonstração prática e pedagógica na Feira de Robótica Escolar.  
Sinta-se à vontade para clonar, estudar, adaptar e usar em sala de aula! ⭐
