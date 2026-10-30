#include <Arduino.h>

// --- PROJETO: SEMÁFORO DO BARULHO (V4 - Contador Digital) ---
// Placa: ESP32 DevKit V1

int pinoSensorSom = 34; // AGORA LIGADO NO D0 DO SENSOR!
int ledVerde = 25;      
int ledAmarelo = 26;    
int ledVermelho = 27;   

void setup() {
  Serial.begin(115200); 
  pinMode(pinoSensorSom, INPUT); // Agora é uma entrada digital simples
  
  pinMode(ledVerde, OUTPUT);
  pinMode(ledAmarelo, OUTPUT);
  pinMode(ledVermelho, OUTPUT);
}

void loop() {
  int contadorDeRuido = 0;
  unsigned long tempoInicio = millis();

  // O ESP32 vai prestar atenção durante 1 segundo (1000 milissegundos)
  while (millis() - tempoInicio < 1000) {
    
    // Se o sensor detectar um barulho que pisca a luzinha dele...
    if (digitalRead(pinoSensorSom) == HIGH) { // Algumas placas usam LOW, mude se precisar
      contadorDeRuido++;  // Adiciona 1 na conta
      delay(5);           // Pequena pausa para não contar o mesmo eco duas vezes
    }
  }

  // Mostra no computador quantas "pancadas de som" ocorreram em 1 segundo
  Serial.print("Disparos de barulho neste segundo: ");
  Serial.println(contadorDeRuido);

  // --- LÓGICA DO SEMÁFORO ---
  // Ajuste esses números conforme achar melhor!
  
  if (contadorDeRuido < 2) { 
    // Menos de 2 disparos: Silêncio (Verde)
    digitalWrite(ledVerde, HIGH);
    digitalWrite(ledAmarelo, LOW);
    digitalWrite(ledVermelho, LOW);
  } 
  else if (contadorDeRuido >= 2 && contadorDeRuido < 15) { 
    // Entre 2 e 15 disparos: Murmúrios e falatório leve (Amarelo)
    digitalWrite(ledVerde, LOW);
    digitalWrite(ledAmarelo, HIGH);
    digitalWrite(ledVermelho, LOW);
  } 
  else { 
    // Mais de 15 disparos: Muita gente falando alto, música, gritos (Vermelho)
    digitalWrite(ledVerde, LOW);
    digitalWrite(ledAmarelo, LOW);
    
    // Vermelho piscando
    digitalWrite(ledVermelho, HIGH);
    delay(100);
    digitalWrite(ledVermelho, LOW);
    delay(100);
  }
}