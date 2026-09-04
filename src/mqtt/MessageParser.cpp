#include "MessageParser.h"

CommandMessage MessageParser::parse(const char* topic, const byte* payload, size_t len) {
    CommandMessage cmd;
    cmd.valid = false;

    String topic_str(topic);
    int last_slash = topic_str.lastIndexOf('/');
    int third_slash = topic_str.lastIndexOf('/', last_slash - 1);
    cmd.light_id = topic_str.substring(third_slash + 1, last_slash);

    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, payload, len);
    if (err) {
        Serial.printf("[MQTT] Parse error: %s\n", err.c_str());
        return cmd;
    }

    cmd.source = doc["source"] | "mqtt";
    cmd.msg_id = doc["msg_id"] | "";
    cmd.seq = doc["seq"] | 0;
    cmd.ts = doc["ts"] | 0;

    const char* state_str = doc["state"];
    if (!state_str) return cmd;

    cmd.state = (strcmp(state_str, "ON") == 0);
    cmd.brightness = doc["brightness"] | (cmd.state ? 100 : 0);
    if (cmd.brightness > 100) cmd.brightness = 100;

    cmd.valid = true;
    return cmd;
}
