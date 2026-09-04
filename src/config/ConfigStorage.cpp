#include "ConfigStorage.h"
#include <FFat.h>

static const char* CONFIG_PATH = "/config.json";

bool ConfigStorage::begin() {
    if (!FFat.begin(true)) {
        Serial.println("[Config] FFat mount failed");
        return false;
    }
    Serial.println("[Config] FFat mounted");
    return true;
}

bool ConfigStorage::exists() {
    return FFat.exists(CONFIG_PATH);
}

bool ConfigStorage::load(DeviceConfig& cfg) {
    if (!FFat.exists(CONFIG_PATH)) {
        Serial.println("[Config] No config file, using defaults");
        cfg = DeviceConfig::default_config();
        return false;
    }

    File file = FFat.open(CONFIG_PATH, "r");
    if (!file) {
        Serial.println("[Config] Failed to open config file");
        cfg = DeviceConfig::default_config();
        return false;
    }

    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, file);
    file.close();

    if (err) {
        Serial.printf("[Config] JSON parse error: %s\n", err.c_str());
        cfg = DeviceConfig::default_config();
        return false;
    }

    cfg.wifi_ssid = doc["wifi_ssid"] | "";
    cfg.wifi_pass = doc["wifi_pass"] | "";
    cfg.mqtt_broker = doc["mqtt_broker"] | "";
    cfg.mqtt_port = doc["mqtt_port"] | 1883;
    cfg.mqtt_user = doc["mqtt_user"] | "";
    cfg.mqtt_pass = doc["mqtt_pass"] | "";
    cfg.device_id = doc["device_id"] | "esp32-default";
    cfg.room_id = doc["room_id"] | "room-1";
    cfg.mdns_host = doc["mdns_host"] | "esptest";

    cfg.lights.clear();
    JsonArray lights_arr = doc["lights"].as<JsonArray>();
    for (JsonObject obj : lights_arr) {
        LightConfig lc;
        lc.pin = obj["pin"] | 25;
        lc.ledc_channel = obj["channel"] | 0;
        lc.name = obj["name"] | "unknown";
        lc.type = obj["type"] | "pwm";
        lc.enabled = obj["enabled"] | true;
        cfg.lights.push_back(lc);
    }

    if (cfg.lights.empty()) {
        LightConfig d1; d1.pin = 25; d1.ledc_channel = 0; d1.name = "light-1"; d1.type = "pwm"; d1.enabled = true;
        LightConfig d2; d2.pin = 26; d2.ledc_channel = 1; d2.name = "light-2"; d2.type = "pwm"; d2.enabled = true;
        LightConfig d3; d3.pin = 27; d3.ledc_channel = 2; d3.name = "light-3"; d3.type = "pwm"; d3.enabled = true;
        LightConfig d4; d4.pin = 32; d4.ledc_channel = 3; d4.name = "light-4"; d4.type = "pwm"; d4.enabled = true;
        cfg.lights.push_back(d1);
        cfg.lights.push_back(d2);
        cfg.lights.push_back(d3);
        cfg.lights.push_back(d4);
    }

    Serial.printf("[Config] Loaded config for %s/%s (%zu lights)\n",
        cfg.room_id.c_str(), cfg.device_id.c_str(), cfg.lights.size());
    return true;
}

bool ConfigStorage::save(const DeviceConfig& cfg) {
    File file = FFat.open(CONFIG_PATH, "w");
    if (!file) {
        Serial.println("[Config] Failed to open config for writing");
        return false;
    }

    JsonDocument doc;
    doc["wifi_ssid"] = cfg.wifi_ssid;
    doc["wifi_pass"] = cfg.wifi_pass;
    doc["mqtt_broker"] = cfg.mqtt_broker;
    doc["mqtt_port"] = cfg.mqtt_port;
    doc["mqtt_user"] = cfg.mqtt_user;
    doc["mqtt_pass"] = cfg.mqtt_pass;
    doc["device_id"] = cfg.device_id;
    doc["room_id"] = cfg.room_id;
    doc["mdns_host"] = cfg.mdns_host;

    JsonArray lights_arr = doc["lights"].to<JsonArray>();
    for (const auto& lc : cfg.lights) {
        JsonObject obj = lights_arr.add<JsonObject>();
        obj["pin"] = lc.pin;
        obj["channel"] = lc.ledc_channel;
        obj["name"] = lc.name;
        obj["type"] = lc.type;
        obj["enabled"] = lc.enabled;
    }

    serializeJson(doc, file);
    file.close();
    Serial.println("[Config] Config saved");
    return true;
}
