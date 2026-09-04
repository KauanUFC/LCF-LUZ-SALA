#pragma once
#include <ESPAsyncWebServer.h>
#include "lights/LightManager.h"
#include "config/ConfigStorage.h"
#include "config/DeviceConfig.h"
#include "health/HealthReporter.h"
#include "wifi/WifiManager.h"

class LocalWebServer {
public:
    LocalWebServer();
    void begin(LightManager& lights, ConfigStorage& storage,
               DeviceConfig& config,
               HealthReporter& health, WifiManager& wifi,
               bool ap_mode = false);
    void tick();
    AsyncWebServer* getServer() { return &server; }

private:
    AsyncWebServer server;
    LightManager* lights;
    ConfigStorage* storage;
    DeviceConfig* config;
    HealthReporter* health;
    WifiManager* wifi;
    bool ap_mode;

    void setup_routes();
    void serve_provision_html(AsyncWebServerRequest* request);
    static String get_provision_html();
    static String get_dashboard_html();
    static String get_wifi_mqtt_html();
    static String get_lights_html();
};
