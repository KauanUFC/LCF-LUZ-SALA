#pragma once
#include <Arduino.h>
#include <DNSServer.h>
#include "config/DeviceConfig.h"
#include "config/ConfigStorage.h"

#define STATUS_LED_PIN GPIO_NUM_2

class WifiManager {
public:
    WifiManager();
    void begin(ConfigStorage& storage, DeviceConfig& cfg);
    void tick();
    bool connected();
    int get_rssi();
    bool is_ap_mode();
    IPAddress get_ap_ip();
    const char* get_ap_ssid();

private:
    enum class State { STATION, RECONNECT, PROVISION_AP };
    State state;
    ConfigStorage* storage;
    DeviceConfig* config;
    unsigned long connect_start;
    unsigned long backoff_ms;
    unsigned long last_attempt;
    int attempt_count;
    bool led_state;
    bool led_solid;
    unsigned long last_blink;
    DNSServer dns_server;
    String ap_ssid;

    bool try_sta_connect(int timeout_ms);
    void enter_ap_mode();
    void run_provisioning();
};
