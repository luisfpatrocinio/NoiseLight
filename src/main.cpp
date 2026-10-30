/**
 * ==============================================================================
 * PROJETO: NoiseLight - Semáforo do Barulho
 * FEIRA DE ROBÓTICA E CIÊNCIAS - 6º ANO DO ENSINO FUNDAMENTAL
 * ==============================================================================
 * 
 * Descrição:
 * Este firmware roda em uma placa ESP32 DevKit V1 e atua como um monitor de ruído
 * inteligente para salas de aula. Através de um sensor de som (microfone com saída
 * digital D0), ele conta a quantidade de pulsos acústicos durante 1 segundo e 
 * classifica o volume da sala nas cores padrão de um semáforo:
 * 
 *   - VERDE:    Ambiente Silencioso (< 2 pulsos/s) -> Ideal para concentração
 *   - AMARELO:  Barulho Moderado (2 a 14 pulsos/s)  -> Ponto de atenção
 *   - VERMELHO: Barulho Alto (>= 15 pulsos/s)      -> Alerta piscante!
 * 
 * Conexões dos Pinos:
 *   - GPIO 34: Entrada digital (D0 do Módulo Sensor de Som)
 *   - GPIO 25: Saída digital para o LED Verde (com resistor de 220 Ohms)
 *   - GPIO 26: Saída digital para o LED Amarelo (com resistor de 220 Ohms)
 *   - GPIO 27: Saída digital para o LED Vermelho (com resistor de 220 Ohms)
 * ==============================================================================
 */

#include <Arduino.h>

// --- MAPEAMENTO DOS PINOS DE ENTRADA E SAÍDA (PINOUT) ---
const int PINO_SENSOR_SOM = 34; // Entrada digital ligada no D0 do sensor de som
const int PINO_LED_VERDE   = 25; // Controle do LED Verde (Silêncio)
const int PINO_LED_AMARELO = 26; // Controle do LED Amarelo (Atenção)
const int PINO_LED_VERMELHO= 27; // Controle do LED Vermelho (Alerta)

// --- PARÂMETROS E LIMITES DE CALIBRAÇÃO DO SEMÁFORO ---
const int LIMIAR_SILENCIO = 2;   // Abaixo deste valor, permanece Verde
const int LIMIAR_MODERADO = 15;  // De 2 a 14 é Amarelo; a partir de 15 é Vermelho
const unsigned long JANELA_AMOSTRAGEM_MS = 1000; // Tempo de observação (1 segundo)

// --- PROTÓTIPOS DAS FUNÇÕES AUXILIARES ---
void atualizarSemaforo(int disparosDeRuido);
void acenderSomenteVerde();
void acenderSomenteAmarelo();
void alertarVermelhoPiscando();
void desligarTodosLeds();

/**
 * Função de Inicialização (executada 1 vez na inicialização da placa)
 */
void setup() {
  // Inicia a comunicação serial para vermos os dados no computador
  Serial.begin(115200);
  
  // Configura o pino do sensor como ENTRADA de sinal
  pinMode(PINO_SENSOR_SOM, INPUT);
  
  // Configura os pinos dos LEDs como SAÍDA de corrente elétrica
  pinMode(PINO_LED_VERDE, OUTPUT);
  pinMode(PINO_LED_AMARELO, OUTPUT);
  pinMode(PINO_LED_VERMELHO, OUTPUT);

  // Teste inicial rápido dos LEDs na inicialização
  digitalWrite(PINO_LED_VERDE, HIGH);
  digitalWrite(PINO_LED_AMARELO, HIGH);
  digitalWrite(PINO_LED_VERMELHO, HIGH);
  delay(500);
  desligarTodosLeds();

  Serial.println("================================================");
  Serial.println("  NoiseLight - Semáforo do Barulho Inicializado  ");
  Serial.println("================================================");
}

/**
 * Função Principal de Execução Contínua (Loop Infinito)
 */
void loop() {
  int contadorDeRuido = 0;
  unsigned long tempoInicio = millis();

  // O ESP32 monitora o microfone durante exatamente 1 segundo
  while (millis() - tempoInicio < JANELA_AMOSTRAGEM_MS) {
    // Quando o sensor detecta som acima da sensibilidade regulada, seu pino D0 vai a HIGH
    if (digitalRead(PINO_SENSOR_SOM) == HIGH) {
      contadorDeRuido++;
      // Pequena pausa (5ms) para filtrar repiques e ecos do mesmo ruído (Debounce)
      delay(5);
    }
  }

  // Envia a telemetria serial para exibição no computador
  Serial.print("Disparos acústicos detectados no último segundo: ");
  Serial.println(contadorDeRuido);

  // Aplica a lógica pedagógica de decisão do semáforo
  atualizarSemaforo(contadorDeRuido);
}

/**
 * Controla os LEDs conforme o número de disparos detectados
 * @param disparos Quantidade de pulsos sonoros no intervalo de 1s
 */
void atualizarSemaforo(int disparos) {
  if (disparos < LIMIAR_SILENCIO) {
    // Nível Baixo: Sala tranquila e silenciosa
    acenderSomenteVerde();
  } 
  else if (disparos >= LIMIAR_SILENCIO && disparos < LIMIAR_MODERADO) {
    // Nível Moderado: Conversa normal ou trabalho em grupo
    acenderSomenteAmarelo();
  } 
  else {
    // Nível Elevado: Barulho excessivo ou gritaria
    alertarVermelhoPiscando();
  }
}

/**
 * Acende apenas o LED Verde e apaga os demais
 */
void acenderSomenteVerde() {
  digitalWrite(PINO_LED_VERDE, HIGH);
  digitalWrite(PINO_LED_AMARELO, LOW);
  digitalWrite(PINO_LED_VERMELHO, LOW);
}

/**
 * Acende apenas o LED Amarelo e apaga os demais
 */
void acenderSomenteAmarelo() {
  digitalWrite(PINO_LED_VERDE, LOW);
  digitalWrite(PINO_LED_AMARELO, HIGH);
  digitalWrite(PINO_LED_VERMELHO, LOW);
}

/**
 * Pisca o LED Vermelho em sinal de alerta sonoro
 */
void alertarVermelhoPiscando() {
  digitalWrite(PINO_LED_VERDE, LOW);
  digitalWrite(PINO_LED_AMARELO, LOW);
  
  // Efeito estroboscópico de atenção
  digitalWrite(PINO_LED_VERMELHO, HIGH);
  delay(100);
  digitalWrite(PINO_LED_VERMELHO, LOW);
  delay(100);
}

/**
 * Desliga todos os LEDs
 */
void desligarTodosLeds() {
  digitalWrite(PINO_LED_VERDE, LOW);
  digitalWrite(PINO_LED_AMARELO, LOW);
  digitalWrite(PINO_LED_VERMELHO, LOW);
}
