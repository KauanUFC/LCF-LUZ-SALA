#include "MessageParser.h"

static bool is_valid_command_topic(const String& topic) {
    if (!topic.startsWith("command/")) return false;
    int slash_count = 0;
    for (size_t i = 0; (i = topic.indexOf('/', i)) != -1; i++) {
        slash_count++;
        if (slash_count > 3) return false;
    }
    return slash_count == 3;
}

CommandMessage MessageParser::parse(const char* topic, const byte* payload, size_t len) {
    CommandMessage cmd;
    cmd.valid = false;

    String topic_str(topic);
    if (!is_valid_command_topic(topic_str)) {
        Serial.printf("[MQTT] Invalid topic format: %s\n", topic);
        return cmd;
    }
    int last_slash = topic_str.lastIndexOf('/');
    cmd.light_id = topic_str.substring(last_slash + 1);

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
