#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ─── Configurações ────────────────────────────────────────
const char* WIFI_SSID     = "sua_rede";
const char* WIFI_PASSWORD = "sua_senha";
const char* API_URL       = "https://seu-dominio.vercel.app/api/readings";
const char* API_KEY       = "sua_api_key";
const int   INTERVALO_MS  = 30000;

// ─── Pinos ───────────────────────────────────────────────
#define DHT_PIN   4
#define DHT_TYPE  DHT11
#define SOIL_PIN  34   // GPIO34 (ADC1_CH6)

DHT dht(DHT_PIN, DHT_TYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();

  Serial.print("Conectando ao WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado: " + WiFi.localIP().toString());
}

void loop() {
  float temperature = dht.readTemperature();
  float humidity    = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Erro: DHT11 falhou na leitura");
    delay(INTERVALO_MS);
    return;
  }

  // YL-38: 0 = muito umido, 4095 = muito seco -> invertemos para 0-100%
  int rawSoil = analogRead(SOIL_PIN);
  int soil    = map(rawSoil, 4095, 0, 0, 100);
  soil        = constrain(soil, 0, 100);

  Serial.printf("Temp: %.1f C | Umidade: %.1f%% | Solo: %d%%\n",
                temperature, humidity, soil);

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado, reconectando...");
    WiFi.reconnect();
    delay(5000);
    return;
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);

  JsonDocument doc;
  doc["temperature"] = temperature;
  doc["humidity"]    = humidity;
  doc["soil"]        = soil;

  String body;
  serializeJson(doc, body);

  int httpCode = http.POST(body);
  if (httpCode == 200) {
    Serial.println("Enviado: " + http.getString());
  } else {
    Serial.printf("Erro HTTP: %d\n", httpCode);
  }

  http.end();
  delay(INTERVALO_MS);
}
