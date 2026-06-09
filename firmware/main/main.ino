#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ─── Configurações ────────────────────────────────────────
const char *WIFI_SSID = "Akira";
const char *WIFI_PASSWORD = "tutu@2025";
const char *API_URL = "https://plant-monitor-zeta.vercel.app/api/readings";
const char *API_KEY = "sk_live_JuCd0PpeecCF5zX2cp8d36m5LZVryA3Q";
const int INTERVALO_MS = 30000;

// ─── Pinos ───────────────────────────────────────────────
#define DHT_PIN 2
#define DHT_TYPE DHT22

DHT dht(DHT_PIN, DHT_TYPE);

void setup()
{
  Serial.begin(115200);
  dht.begin();

  Serial.print("Conectando ao WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado: " + WiFi.localIP().toString());
}

void loop()
{
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity))
  {
    Serial.println("Erro: DHT22 falhou na leitura");
    delay(INTERVALO_MS);
    return;
  }

  Serial.printf("Temp: %.1f C | Umidade: %.1f%%\n", temperature, humidity);

  if (WiFi.status() != WL_CONNECTED)
  {
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
  doc["humidity"] = humidity;
  doc["soil"] = 0;

  String body;
  serializeJson(doc, body);

  int httpCode = http.POST(body);
  if (httpCode == 200)
  {
    Serial.println("Enviado: " + http.getString());
  }
  else
  {
    Serial.printf("Erro HTTP: %d\n", httpCode);
  }

  http.end();
  delay(INTERVALO_MS);
}