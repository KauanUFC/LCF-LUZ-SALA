#include "WifiManager.h"
#include <WiFi.h>
#include <ESPmDNS.h>

static constexpr int STA_TIMEOUT_MS = 60000;
static constexpr int AP_MODE_FALLBACK_AFTER_RETRIES = 8;
static constexpr unsigned long BACKOFF_CAP_MS = 30000;

WifiManager::WifiManager() : state(State::STATION), storage(nullptr), config(nullptr),
    connect_start(0), backoff_ms(1000), last_attempt(0), attempt_count(0),
    led_state(false), led_solid(false), last_blink(0) {}

void WifiManager::begin(ConfigStorage& st, DeviceConfig& cfg) {
    storage = &st;
    config = &cfg;

    pinMode(STATUS_LED_PIN, OUTPUT);
    digitalWrite(STATUS_LED_PIN, LOW);

    WiFi.mode(WIFI_STA);
    WiFi.setHostname(config->mdns_host.c_str());

    if (storage->exists()) {
        Serial.println("[WiFi] Using saved config");
        attempt_count = 0;
        connect_start = millis();
        try_sta_connect(STA_TIMEOUT_MS);
    } else {
        Serial.println("[WiFi] No saved config, entering AP provision mode");
        enter_ap_mode();
    }
}

bool WifiManager::try_sta_connect(int timeout_ms) {
    WiFi.begin(config->wifi_ssid.c_str(), config->wifi_pass.c_str());
    Serial.printf("[WiFi] Connecting to %s\n", config->wifi_ssid.c_str());

    unsigned long start = millis();
    while (millis() - start < (unsigned long)timeout_ms) {
        if (WiFi.status() == WL_CONNECTED) {
            digitalWrite(STATUS_LED_PIN, HIGH);
            led_solid = true;
            state = State::STATION;
            String ip_str = WiFi.localIP().toString();
            Serial.printf("\n[WiFi] Connected, IP: %s\n", ip_str.c_str());
            if (MDNS.begin(config->mdns_host.c_str())) {
                MDNS.addService("http", "tcp", 80);
                Serial.printf("[MDNS] %s.local\n", config->mdns_host.c_str());
            }
            return true;
        }
        digitalWrite(STATUS_LED_PIN, led_state);
        led_state = !led_state;
        delay(250);
        Serial.print(".");
    }
    Serial.println("\n[WiFi] Connection timeout");
    digitalWrite(STATUS_LED_PIN, LOW);
    return false;
}

void WifiManager::tick() {
    if (state == State::PROVISION_AP) {
        dns_server.processNextRequest();
        return;
    }

    if (WiFi.status() == WL_CONNECTED) {
        if (!led_solid) {
            digitalWrite(STATUS_LED_PIN, HIGH);
            led_solid = true;
        }
        state = State::STATION;
        attempt_count = 0;
        backoff_ms = 1000;
        return;
    }

    led_solid = false;
    unsigned long now = millis();

    if (now - last_attempt < backoff_ms) {
        unsigned long blink_now = millis();
        if (blink_now - last_blink >= 500) {
            last_blink = blink_now;
            led_state = !led_state;
            digitalWrite(STATUS_LED_PIN, led_state);
        }
        return;
    }

    last_attempt = now;
    attempt_count++;

    if (attempt_count >= AP_MODE_FALLBACK_AFTER_RETRIES) {
        Serial.println("[WiFi] Max retries reached, entering AP provision mode");
        enter_ap_mode();
        return;
    }

    Serial.printf("[WiFi] Reconnect attempt %d (backoff %lums)\n", attempt_count, backoff_ms);
    WiFi.reconnect();
    backoff_ms = min(backoff_ms * 2, BACKOFF_CAP_MS);
}

void WifiManager::enter_ap_mode() {
    state = State::PROVISION_AP;

    uint32_t chip_id = (uint32_t)ESP.getEfuseMac();
    ap_ssid = "Light-Setup-" + String(chip_id, HEX);
    ap_ssid.toUpperCase();

    WiFi.mode(WIFI_AP);

    IPAddress ap_ip(192, 168, 4, 1);
    WiFi.softAPConfig(ap_ip, ap_ip, IPAddress(255, 255, 255, 0));
    WiFi.softAP(ap_ssid.c_str());

    dns_server.start(53, "*", ap_ip);

    digitalWrite(STATUS_LED_PIN, HIGH);
    led_solid = true;

    String ap_ip_str = ap_ip.toString();
    Serial.printf("[WiFi] AP mode: SSID=%s, IP=%s\n", ap_ssid.c_str(), ap_ip_str.c_str());
    Serial.println("[WiFi] Connect and open http://192.168.4.1 to configure");
}

void WifiManager::run_provisioning() {
    dns_server.processNextRequest();
}

bool WifiManager::connected() {
    return WiFi.status() == WL_CONNECTED;
}

int WifiManager::get_rssi() {
    if (!connected()) return 0;
    return WiFi.RSSI();
}

bool WifiManager::is_ap_mode() {
    return state == State::PROVISION_AP;
}

IPAddress WifiManager::get_ap_ip() {
    return WiFi.softAPIP();
}

const char* WifiManager::get_ap_ssid() {
    return ap_ssid.c_str();
}
