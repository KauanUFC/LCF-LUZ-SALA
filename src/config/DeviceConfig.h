#pragma once
#include <Arduino.h>
#include <ArduinoJson.h>
#include <vector>

struct LightConfig {
    int pin;
    uint8_t ledc_channel;
    String name;
    String type;  // "relay" or "pwm"
    bool enabled;
};

struct DeviceConfig {
    String wifi_ssid;
    String wifi_pass;
    String mqtt_broker;
    uint16_t mqtt_port;
    String mqtt_user;
    String mqtt_pass;
    String device_id;
    String room_id;
    String mdns_host;
    std::vector<LightConfig> lights;

    static DeviceConfig default_config() {
        DeviceConfig cfg;
        cfg.wifi_ssid = "";
        cfg.wifi_pass = "";
        cfg.mqtt_broker = "";
        cfg.mqtt_port = 1883;
        cfg.mqtt_user = "";
        cfg.mqtt_pass = "";
        cfg.device_id = "esp32-default";
        cfg.room_id = "room-1";
        cfg.mdns_host = "esptest";
        return cfg;
    }
};
