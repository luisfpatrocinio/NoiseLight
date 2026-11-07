/**
 * ==============================================================================
 * PROJETO: NoiseLight - Semáforo do Barulho
 * Microcontrolador: ESP32 DevKit V1 (Montagem em fileira única de protoboard)
 * Sensor: Módulo Microfone Analógico MAX4466 com ganho ajustável
 * Atuadores: 3 LEDs de 10mm (Verde, Amarelo, Vermelho)
 * ==============================================================================
 * 
 * ⚠️ PINAGEM CONCENTRADA NO LADO DO 3V3 (Fileira do ESP32 na protoboard):
 * 
 *   Alimentação:
 *     - MAX4466 VCC -> Pino 3V3 do ESP32
 *     - MAX4466 GND -> Pino GND do ESP32 (ao lado do 3V3)
 *     - Cátodos dos 3 LEDs (-) -> Barramento GND da protoboard
 * 
 *   Entrada Analógica de Áudio:
 *     - MAX4466 OUT -> GPIO 4 (pino D4 na placa)
 * 
 *   Saídas Digitais dos LEDs (com resistores de 220Ω ou 330Ω):
 *     - LED 10mm Verde    -> GPIO 18 (pino D18 na placa)
 *     - LED 10mm Amarelo  -> GPIO 19 (pino D19 na placa)
 *     - LED 10mm Vermelho -> GPIO 21 (pino D21 na placa)
 * ==============================================================================
 */

#include <Arduino.h>

// --- PINAGEM (TODOS OS PINOS NO LADO DO 3V3) ---
const int PINO_SENSOR_SOM   = 4;  // Entrada analógica conectada ao pino OUT do MAX4466 (D4)
const int PINO_LED_VERDE     = 18; // Controle do LED 10mm Verde (D18)
const int PINO_LED_AMARELO   = 19; // Controle do LED 10mm Amarelo (D19)
const int PINO_LED_VERMELHO  = 21; // Controle do LED 10mm Vermelho (D21)

// --- PARÂMETROS DE MEDIÇÃO ANALÓGICA ---
const unsigned long JANELA_AMOSTRAGEM_MS = 50; // Janela para captura da amplitude pico a pico (50ms)

// --- LIMIARES DE DECISÃO (0 a 4095 - escala do ADC do ESP32) ---
// Valores calibrados para evitar falsos alertas no vermelho:
int limiarAmarelo  = 900;  // Acima deste valor passa para Amarelo (Atenção)
int limiarVermelho = 2200; // Acima deste valor passa para Vermelho (Alerta)

// --- FILTRO DE SUAVIZAÇÃO (Média Móvel Exponencial) ---
// Evita que estalos muito curtos (clique de caneta, eco pontual) disparem o semáforo
float amplitudeSuave = 0.0;
const float FATOR_SUAVIZACAO = 0.4; // 0.1 a 1.0 (menor = mais suave e imune a estalos rápidos)

// --- CONTROLE DE ESTABILIDADE (HISTERESE E PEAK HOLD) ---
const unsigned long TEMPO_RETENCAO_ALERTA_MS = 1500; // Tempo mínimo no vermelho após pico de som
unsigned long ultimoTempoVermelho = 0;

// Variáveis para piscar o LED vermelho de forma NÃO-BLOQUEANTE
unsigned long ultimoPiscaVermelho = 0;
bool estadoPiscaVermelho = false;
const unsigned long INTERVALO_PISCA_MS = 120;

// Telemetria serial periódica
unsigned long ultimoEnvioSerial = 0;

// --- PROTÓTIPOS ---
int medirAmplitudePicoAPico(unsigned long duracaoMs);
void processarComandosSeriais();
void atualizarSemaforo(int amplitude);
void acenderSomenteVerde();
void acenderSomenteAmarelo();
void alertarVermelhoPiscando();
void desligarTodosLeds();

void setup() {
  Serial.begin(115200);
  
  // Configuração do ADC do ESP32 para o microfone analógico
  analogReadResolution(12); // Resolução de 12 bits (0 a 4095)
  analogSetPinAttenuation(PINO_SENSOR_SOM, ADC_11db); // Leitura de 0V até ~3.3V

  // Configuração dos pinos dos LEDs de 10mm como saída
  pinMode(PINO_LED_VERDE, OUTPUT);
  pinMode(PINO_LED_AMARELO, OUTPUT);
  pinMode(PINO_LED_VERMELHO, OUTPUT);

  // Teste de inicialização (acende os 3 LEDs por 600ms para teste de bancada)
  digitalWrite(PINO_LED_VERDE, HIGH);
  digitalWrite(PINO_LED_AMARELO, HIGH);
  digitalWrite(PINO_LED_VERMELHO, HIGH);
  delay(600);
  desligarTodosLeds();

  Serial.println("\n=======================================================");
  Serial.println("  NoiseLight - Semáforo do Barulho [MODO MAX4466]");
  Serial.println("=======================================================");
  Serial.println("  COMANDOS PARA CALIBRAR PELO MONITOR SERIAL:");
  Serial.println("    Digite '+' e Enter para DIMINUIR a sensibilidade (subir limiares)");
  Serial.println("    Digite '-' e Enter para AUMENTAR a sensibilidade (baixar limiares)");
  Serial.println("=======================================================\n");
}

void loop() {
  // 1. Processa comandos de calibração via teclado no Monitor Serial (+ ou -)
  processarComandosSeriais();

  // 2. Mede a amplitude pico a pico (Vpp) do sinal de áudio durante 50ms
  int amplitudeInstantanea = medirAmplitudePicoAPico(JANELA_AMOSTRAGEM_MS);

  // 3. Aplica filtro de suavização para descartar micro-estalos transitórios
  amplitudeSuave = (FATOR_SUAVIZACAO * amplitudeInstantanea) + ((1.0 - FATOR_SUAVIZACAO) * amplitudeSuave);
  int amplitudeFiltrada = (int)amplitudeSuave;

  // 4. Atualiza os LEDs com base na amplitude filtrada
  atualizarSemaforo(amplitudeFiltrada);

  // 5. Envia telemetria para o Serial Monitor e Serial Plotter
  if (millis() - ultimoEnvioSerial >= 50) {
    ultimoEnvioSerial = millis();
    
    // Formato compatível com o Serial Plotter e legível no Monitor Serial
    Serial.print("Som:");
    Serial.print(amplitudeFiltrada);
    Serial.print(" Amarelo:");
    Serial.print(limiarAmarelo);
    Serial.print(" Vermelho:");
    Serial.println(limiarVermelho);
  }
}

/**
 * Permite ajustar a sensibilidade em tempo real pelo Monitor Serial sem precisar recompilar.
 */
void processarComandosSeriais() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '+') {
      // Menos sensível (precisa de mais barulho para ativar)
      limiarAmarelo  += 150;
      limiarVermelho += 250;
      if (limiarVermelho > 3800) limiarVermelho = 3800;
      Serial.printf("\n[CALIBRAÇÃO] Sensibilidade DIMINUÍDA -> Amarelo: %d | Vermelho: %d\n", limiarAmarelo, limiarVermelho);
    } 
    else if (c == '-') {
      // Mais sensível (ativa com menos barulho)
      limiarAmarelo  -= 150;
      limiarVermelho -= 250;
      if (limiarAmarelo < 200) limiarAmarelo = 200;
      if (limiarVermelho < 600) limiarVermelho = 600;
      Serial.printf("\n[CALIBRAÇÃO] Sensibilidade AUMENTADA -> Amarelo: %d | Vermelho: %d\n", limiarAmarelo, limiarVermelho);
    }
  }
}

/**
 * Lê continuamente a entrada analógica durante a janela especificada e calcula
 * a diferença entre o maior pico e o menor vale da onda de áudio (Peak-to-Peak).
 */
int medirAmplitudePicoAPico(unsigned long duracaoMs) {
  unsigned long tempoInicio = millis();
  int valorMin = 4095;
  int valorMax = 0;

  while (millis() - tempoInicio < duracaoMs) {
    int leitura = analogRead(PINO_SENSOR_SOM);
    
    if (leitura < 4096) {
      if (leitura > valorMax) valorMax = leitura;
      if (leitura < valorMin) valorMin = leitura;
    }
  }

  return (valorMax - valorMin);
}

/**
 * Aplica a lógica do semáforo com histerese para estabilidade visual
 */
void atualizarSemaforo(int amplitude) {
  unsigned long agora = millis();

  // Se o som atingiu o nível vermelho, ativa a retenção temporária
  if (amplitude >= limiarVermelho) {
    ultimoTempoVermelho = agora;
  }

  // Verifica se ainda está no período de alerta vermelho (peak hold)
  if (agora - ultimoTempoVermelho < TEMPO_RETENCAO_ALERTA_MS) {
    alertarVermelhoPiscando();
  } 
  else if (amplitude >= limiarAmarelo) {
    acenderSomenteAmarelo();
  } 
  else {
    acenderSomenteVerde();
  }
}

/**
 * Acende somente o LED Verde
 */
void acenderSomenteVerde() {
  digitalWrite(PINO_LED_VERDE, HIGH);
  digitalWrite(PINO_LED_AMARELO, LOW);
  digitalWrite(PINO_LED_VERMELHO, LOW);
}

/**
 * Acende somente o LED Amarelo
 */
void acenderSomenteAmarelo() {
  digitalWrite(PINO_LED_VERDE, LOW);
  digitalWrite(PINO_LED_AMARELO, HIGH);
  digitalWrite(PINO_LED_VERMELHO, LOW);
}

/**
 * Faz o LED Vermelho piscar em alerta rápido sem delay()
 */
void alertarVermelhoPiscando() {
  digitalWrite(PINO_LED_VERDE, LOW);
  digitalWrite(PINO_LED_AMARELO, LOW);

  unsigned long agora = millis();
  if (agora - ultimoPiscaVermelho >= INTERVALO_PISCA_MS) {
    ultimoPiscaVermelho = agora;
    estadoPiscaVermelho = !estadoPiscaVermelho;
    digitalWrite(PINO_LED_VERMELHO, estadoPiscaVermelho ? HIGH : LOW);
  }
}

/**
 * Desliga todos os LEDs
 */
void desligarTodosLeds() {
  digitalWrite(PINO_LED_VERDE, LOW);
  digitalWrite(PINO_LED_AMARELO, LOW);
  digitalWrite(PINO_LED_VERMELHO, LOW);
}
