#include <Arduino.h>
#include <WiFi.h>
#include <ElegantOTA.h>
#include "soc/timer_group_struct.h"
#include "soc/timer_group_reg.h"
#include "config/ConfigStorage.h"
#include "wifi/WifiManager.h"
#include "mqtt/MqttManager.h"
#include "lights/LightManager.h"
#include "health/HealthReporter.h"
#include "inputs/ButtonManager.h"
#include "web/LocalWebServer.h"
#include "time/NtpSync.h"

ConfigStorage storage;
DeviceConfig config;
WifiManager wifi;
MqttManager mqtt;
LightManager lights;
HealthReporter health;
ButtonManager button;
LocalWebServer web;
NtpSync ntp;

static unsigned long last_watchdog_feed = 0;
static bool last_wifi_connected = false;
static bool last_mqtt_connected = false;
static unsigned long last_status_print = 0;

void on_mqtt_command(const CommandMessage& cmd) {
    Serial.printf("[App] Command: %s source=%s state=%d brightness=%d\n",
        cmd.light_id.c_str(), cmd.source.c_str(), cmd.state, cmd.brightness);
    lights.process_command(cmd);
}

void on_button_press(const char* light_name, bool long_press) {
    Serial.printf("[Button] %s press on %s\n", long_press ? "long" : "short", light_name);

    Light* light = lights.get_light(light_name);
    if (!light) return;

    bool new_state;
    uint8_t brightness;

    if (long_press) {
        new_state = true;
        brightness = 100;
    } else {
        new_state = !light->is_on();
        brightness = new_state ? 100 : 0;
    }

    CommandMessage cmd;
    cmd.light_id = light_name;
    cmd.source = "button";
    cmd.msg_id = "";
    cmd.seq = 0;
    cmd.ts = ntp.get_timestamp();
    cmd.state = new_state;
    cmd.brightness = brightness;
    cmd.valid = true;

    lights.process_command(cmd);
}

void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.printf("\n=== TEST_ESP32_FIRMWARE_LCF v1.0.0 ===\n");

    storage.begin();
    storage.load(config);

    // Start provisioning AP if no saved config
    wifi.begin(storage, config);

    if (wifi.connected()) {
        ntp.begin();
        mqtt.begin(config, on_mqtt_command);
        health.begin(config, mqtt, wifi);
    }

    lights.begin(config, &mqtt);

    const char* button_light = config.lights.empty() ? "light-1" : config.lights[0].name.c_str();
    button.begin(0, button_light, on_button_press);

    web.begin(lights, storage, config, health, wifi, wifi.is_ap_mode());

    if (wifi.connected()) {
        ElegantOTA.begin(web.getServer());
        ElegantOTA.onStart([]() { Serial.println("[OTA] Update started"); });
        ElegantOTA.onEnd([](bool success) { Serial.printf("[OTA] Update %s\n", success ? "succeeded" : "failed"); });
        Serial.println("[OTA] ElegantOTA ready at /update");
    }

    // ── Periodic compact status (every 30s, also printed once at end of setup) ──
    static auto print_status = [] {
        unsigned long uptime_s = millis() / 1000;
        String ip_str = wifi.connected() ? WiFi.localIP().toString() : String();
        Serial.printf("[App] \u2192 %s @ %s | up=%lus | WiFi: %s %s | MQTT: %s | lights=%zu | heap=%uKB\n",
            config.device_id.c_str(),
            config.room_id.c_str(),
            uptime_s,
            wifi.connected() ? "✓" : "✗",
            wifi.connected() ? ip_str.c_str() : wifi.get_ap_ssid(),
            mqtt.connected() ? "✓" : (config.mqtt_broker.length() > 0 ? "connecting" : "not configured"),
            lights.count(),
            ESP.getFreeHeap() / 1024
        );
    };
    print_status();

    last_wifi_connected = wifi.connected();
    last_mqtt_connected = mqtt.connected();
    last_status_print = millis();
}

void loop() {
    wifi.tick();
    ntp.tick();
    button.tick();

    if (wifi.connected()) {
        mqtt.tick();
        health.tick();
        ElegantOTA.loop();
    }

    web.tick();

    // ── Event detection ──
    bool now_wifi = wifi.connected();
    bool now_mqtt = mqtt.connected();

    if (now_wifi && !last_wifi_connected) {
        String ip_str = WiFi.localIP().toString();
    Serial.printf("[App] WiFi connected: %s (%s, RSSI=%d dBm)\n",
            config.wifi_ssid.c_str(), ip_str.c_str(), wifi.get_rssi());
    }
    if (!now_wifi && last_wifi_connected) {
        Serial.printf("[App] WiFi lost, reconnecting...\n");
    }
    if (now_mqtt && !last_mqtt_connected) {
        Serial.printf("[App] MQTT connected to %s:%d\n",
            config.mqtt_broker.c_str(), config.mqtt_port);
    }
    if (!now_mqtt && last_mqtt_connected) {
        Serial.printf("[App] MQTT disconnected\n");
    }
    last_wifi_connected = now_wifi;
    last_mqtt_connected = now_mqtt;

    // ── Compact status line every 30s ──
    unsigned long now = millis();
    if (now - last_status_print >= 30000) {
        last_status_print = now;
        unsigned long uptime_s = now / 1000;
        Serial.printf("[App] \u2192 up=%lus | WiFi: %s rssi=%d | MQTT: %s | lights=%zu | heap=%uKB\n",
            uptime_s,
            wifi.connected() ? "✓" : "✗",
            wifi.get_rssi(),
            mqtt.connected() ? "✓" : (config.mqtt_broker.length() > 0 ? "connecting" : "not configured"),
            lights.count(),
            ESP.getFreeHeap() / 1024
        );
    }

    // Feed built-in watchdog
    if (now - last_watchdog_feed >= 1000) {
        last_watchdog_feed = now;
        TIMERG0.wdt_wprotect = TIMG_WDT_WKEY_VALUE;
        TIMERG0.wdt_feed = 1;
        TIMERG0.wdt_wprotect = 0;
    }
}
