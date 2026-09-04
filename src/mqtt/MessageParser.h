#pragma once
#include <ArduinoJson.h>
#include "MqttTopics.h"

struct CommandMessage {
    String light_id;
    String source;
    String msg_id;
    uint32_t seq;
    unsigned long ts;
    bool state;
    uint8_t brightness;
    bool valid;
};

class MessageParser {
public:
    CommandMessage parse(const char* topic, const byte* payload, size_t len);
};
