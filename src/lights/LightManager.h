#pragma once
#include <vector>
#include <ArduinoJson.h>
#include "config/DeviceConfig.h"
#include "mqtt/MqttManager.h"
#include "Light.h"

struct SeenCommand {
    String light_id;
    uint32_t seq;
};

class LightManager {
public:
    LightManager();
    void begin(const DeviceConfig& cfg, MqttManager* mqtt = nullptr);
    void reload(const DeviceConfig& cfg);
    void process_command(const CommandMessage& cmd);
    void fill_states_json(JsonArray& arr) const;
    void fill_config_json(JsonArray& arr) const;
    Light* get_light(const char* name);
    size_t count() const;

private:
    std::vector<Light*> lights;
    MqttManager* mqtt;
    static constexpr size_t SEEN_RING_SIZE = 8;
    SeenCommand seen_ring[SEEN_RING_SIZE];
    size_t seen_idx;
    bool was_seen(const String& light_id, uint32_t seq);
    void record_seen(const String& light_id, uint32_t seq);
};
