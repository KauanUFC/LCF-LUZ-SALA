#include "HealthReporter.h"

static constexpr unsigned long HEALTH_INTERVAL_MS = 30000;

HealthReporter::HealthReporter() : mqtt(nullptr), wifi(nullptr), last_health(0), started_at(0), seq(0) {}

void HealthReporter::begin(const DeviceConfig& cfg, MqttManager& m, WifiManager& w) {
    config = cfg;
    mqtt = &m;
    wifi = &w;
    started_at = millis();
}

void HealthReporter::tick() {
    unsigned long now = millis();
    if (now - last_health < HEALTH_INTERVAL_MS) return;
    last_health = now;
    publish_health();
}

void HealthReporter::publish_health() {
    if (!mqtt || !mqtt->connected()) return;

    char topic[128];
    mqtt_topic_health(topic, sizeof(topic),
        config.room_id.c_str(), config.device_id.c_str());

    JsonDocument doc;
    unsigned long uptime_s = (millis() - started_at) / 1000;

    doc["device"] = config.device_id;
    doc["room"] = config.room_id;
    doc["status"] = "online";
    doc["uptime_s"] = uptime_s;
    doc["fw_version"] = "1.0.0";
    doc["wifi_rssi"] = wifi->get_rssi();
    doc["free_heap"] = ESP.getFreeHeap();
    doc["seq"] = ++seq;

    char avail_topic[128];
    mqtt_topic_availability(avail_topic, sizeof(avail_topic),
        config.room_id.c_str(), config.device_id.c_str());

    JsonDocument avail;
    avail["status"] = "online";
    avail["device"] = config.device_id;
    avail["room"] = config.room_id;
    avail["uptime_s"] = uptime_s;

    String health_str, avail_str;
    serializeJson(doc, health_str);
    serializeJson(avail, avail_str);

    mqtt->publish(topic, health_str.c_str());
    mqtt->publish(avail_topic, avail_str.c_str(), true);
}
