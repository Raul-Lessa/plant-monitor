// ESP32-CAM — Captura JPEG a cada 1h e envia para a API
// Modelo: AI Thinker (padrão do mercado)
// Board: "AI Thinker ESP32-CAM" no Arduino IDE

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ── Configurações ──────────────────────────────────────
const char *WIFI_SSID = "Akira";
const char *WIFI_PASSWORD = "tutu@2025";
const char *API_URL = "https://plant-monitor-zeta.vercel.app/api/snapshot";
const char *API_KEY = "sk_live_JuCd0PpeecCF5zX2cp8d36m5LZVryA3Q";
const unsigned long INTERVALO_MS = 3600000UL; // 1 hora

// ── Pinos AI Thinker ESP32-CAM ─────────────────────────
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

void initCamera()
{
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound())
  {
    config.frame_size = FRAMESIZE_VGA; // 640x480
    config.jpeg_quality = 12;
    config.fb_count = 2;
  }
  else
  {
    config.frame_size = FRAMESIZE_QVGA; // 320x240
    config.jpeg_quality = 15;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK)
  {
    Serial.printf("Erro ao iniciar câmera: 0x%x\n", err);
    delay(1000);
    ESP.restart();
  }
}

void captureAndSend()
{
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb)
  {
    Serial.println("Falha ao capturar imagem");
    return;
  }

  Serial.printf("Foto capturada: %u bytes\n", fb->len);

  WiFiClientSecure client;
  client.setInsecure(); // sem validação de cert (adequado para IoT local)

  HTTPClient http;
  http.begin(client, API_URL);
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(15000);

  int code = http.POST(fb->buf, fb->len);
  Serial.printf("HTTP %d\n", code);
  if (code > 0)
    Serial.println(http.getString());

  http.end();
  esp_camera_fb_return(fb);
}

void setup()
{
  Serial.begin(115200);
  initCamera();

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\nConectado: %s\n", WiFi.localIP().toString().c_str());

  // Captura imediata ao ligar
  captureAndSend();
}

unsigned long lastCapture = 0;

void loop()
{
  if (millis() - lastCapture >= INTERVALO_MS)
  {
    lastCapture = millis();
    captureAndSend();
  }
  delay(1000);
}
