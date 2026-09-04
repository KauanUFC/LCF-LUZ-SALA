#include "MqttManager.h"
#include "time/NtpSync.h"

MqttManager* MqttManager::instance = nullptr;

extern NtpSync ntp;

MqttManager::MqttManager() : command_callback(nullptr), last_reconnect(0) {}

void MqttManager::begin(const DeviceConfig& cfg, CommandCallback cb) {
    instance = this;
    config = cfg;
    command_callback = cb;

    mqtt_subscribe_command(subscribe_topic, sizeof(subscribe_topic),
        config.room_id.c_str(), config.device_id.c_str());

    client.setClient(wifi_client);
    client.setServer(config.mqtt_broker.c_str(), config.mqtt_port);
    client.setCallback(on_message_static);

    connect();
}

void MqttManager::connect() {
    if (!instance) return;

    char avail_topic[128];
    mqtt_topic_availability(avail_topic, sizeof(avail_topic),
        config.room_id.c_str(), config.device_id.c_str());

    const char* mqtt_user = config.mqtt_user.length() > 0 ? config.mqtt_user.c_str() : NULL;
    const char* mqtt_pass = config.mqtt_pass.length() > 0 ? config.mqtt_pass.c_str() : NULL;

    bool ok = client.connect(
        config.device_id.c_str(),
        mqtt_user, mqtt_pass,
        avail_topic, 1, true,
        "{\"status\":\"offline\"}"
    );

    if (ok) {
        Serial.printf("[MQTT] Connected to %s:%d\n",
            config.mqtt_broker.c_str(), config.mqtt_port);
        client.subscribe(subscribe_topic, 1);
        publish(avail_topic, "{\"status\":\"online\"}", true);
    } else {
        Serial.printf("[MQTT] Connection failed, rc=%d\n", client.state());
    }
}

void MqttManager::tick() {
    if (!client.connected()) {
        unsigned long now = millis();
        if (now - last_reconnect >= 5000) {
            last_reconnect = now;
            connect();
        }
        return;
    }
    client.loop();
}

bool MqttManager::publish(const char* topic, const char* payload, bool retained) {
    if (!client.connected()) return false;
    return client.publish(topic, payload, retained);
}

bool MqttManager::publish_state(const char* light_id, bool state, uint8_t brightness) {
    char topic[128];
    mqtt_topic_state(topic, sizeof(topic),
        config.room_id.c_str(), config.device_id.c_str(), light_id);

    JsonDocument doc;
    doc["state"] = state ? "ON" : "OFF";
    doc["brightness"] = brightness;
    doc["ts"] = ntp.get_timestamp();

    String out;
    serializeJson(doc, out);
    return publish(topic, out.c_str());
}

bool MqttManager::publish_ack(const CommandMessage& original, bool state, uint8_t brightness) {
    char topic[128];
    mqtt_topic_ack(topic, sizeof(topic),
        config.room_id.c_str(), config.device_id.c_str(), original.light_id.c_str());

    JsonDocument doc;
    doc["source"] = config.device_id;
    if (original.msg_id.length() > 0) doc["msg_id"] = original.msg_id;
    doc["seq"] = original.seq;
    doc["ts"] = ntp.get_timestamp();
    doc["state"] = state ? "ON" : "OFF";
    doc["brightness"] = brightness;
    doc["status"] = "ok";

    String out;
    serializeJson(doc, out);
    return publish(topic, out.c_str());
}

bool MqttManager::connected() {
    return client.connected();
}

void MqttManager::on_message_static(char* topic, byte* payload, unsigned int len) {
    if (instance) {
        instance->handle_message(topic, payload, len);
    }
}

void MqttManager::handle_message(char* topic, byte* payload, unsigned int len) {
    CommandMessage cmd = parser.parse(topic, payload, len);
    if (cmd.valid && command_callback) {
        command_callback(cmd);
    }
}
