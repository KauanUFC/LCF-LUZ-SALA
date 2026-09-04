#pragma once
#include "mqtt/MqttManager.h"
#include "wifi/WifiManager.h"
#include "config/DeviceConfig.h"

class HealthReporter {
public:
    HealthReporter();
    void begin(const DeviceConfig& cfg, MqttManager& mqtt, WifiManager& wifi);
    void tick();
    void publish_health();

private:
    MqttManager* mqtt;
    WifiManager* wifi;
    DeviceConfig config;
    unsigned long last_health;
    unsigned long started_at;
    uint32_t seq;
};
