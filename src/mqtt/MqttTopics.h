#pragma once
#include <cstdio>
#include "config/DeviceConfig.h"

inline void mqtt_topic_command(char* buf, size_t len, const char* room, const char* device, const char* light) {
    snprintf(buf, len, "command/%s/%s/%s", room, device, light);
}

inline void mqtt_topic_state(char* buf, size_t len, const char* room, const char* device, const char* light) {
    snprintf(buf, len, "state/%s/%s/%s", room, device, light);
}

inline void mqtt_topic_ack(char* buf, size_t len, const char* room, const char* device, const char* light) {
    snprintf(buf, len, "ack/%s/%s/%s", room, device, light);
}

inline void mqtt_topic_health(char* buf, size_t len, const char* room, const char* device) {
    snprintf(buf, len, "health/%s/%s", room, device);
}

inline void mqtt_topic_availability(char* buf, size_t len, const char* room, const char* device) {
    snprintf(buf, len, "availability/%s/%s", room, device);
}

inline void mqtt_subscribe_command(char* buf, size_t len, const char* room, const char* device) {
    snprintf(buf, len, "command/%s/%s/+", room, device);
}
