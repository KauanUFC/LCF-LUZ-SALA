#include "MqttManager.h"
#include "time/NtpSync.h"

static const char* HIVE_MQ_CA = \
"-----BEGIN CERTIFICATE-----\n" \
"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\n" \
"-----END CERTIFICATE-----\n";

MqttManager* MqttManager::instance = nullptr;

MqttManager::MqttManager() : command_callback(nullptr), ntp_sync(nullptr), last_reconnect(0) {}

void MqttManager::begin(const DeviceConfig& cfg, CommandCallback cb, NtpSync* ntp) {
    instance = this;
    config = cfg;
    command_callback = cb;
    ntp_sync = ntp;

    mqtt_subscribe_command(subscribe_topic, sizeof(subscribe_topic),
        config.room_id.c_str(), config.device_id.c_str());

    client.setClient(wifi_client);
    wifi_client.setCACert(HIVE_MQ_CA);
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
    doc["ts"] = ntp_sync->get_timestamp();

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
    doc["ts"] = ntp_sync->get_timestamp();
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
