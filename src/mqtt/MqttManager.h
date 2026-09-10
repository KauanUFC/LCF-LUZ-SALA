#pragma once
#include <functional>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include "config/DeviceConfig.h"
#include "time/NtpSync.h"
#include "MqttTopics.h"
#include "MessageParser.h"

using CommandCallback = std::function<void(const CommandMessage&)>;

class MqttManager {
public:
    MqttManager();
    void begin(const DeviceConfig& cfg, CommandCallback cb, NtpSync* ntp);
    void tick();
    bool publish(const char* topic, const char* payload, bool retained = false);
    bool publish_state(const char* light_id, bool state, uint8_t brightness);
    bool publish_ack(const CommandMessage& original, bool state, uint8_t brightness);
    bool connected();

private:
    WiFiClientSecure wifi_client;
    PubSubClient client;
    DeviceConfig config;
    CommandCallback command_callback;
    NtpSync* ntp_sync;
    char subscribe_topic[128];
    unsigned long last_reconnect;
    MessageParser parser;
    static MqttManager* instance;
    static void on_message_static(char* topic, byte* payload, unsigned int len);
    void connect();
    void handle_message(char* topic, byte* payload, unsigned int len);
};
