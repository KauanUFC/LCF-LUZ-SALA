#include "LightManager.h"
#include "RelayLight.h"
#include "PwmLight.h"

LightManager::LightManager() : mqtt(nullptr), seen_idx(0) {
    for (auto& s : seen_ring) {
        s.seq = 0;
    }
}

void LightManager::begin(const DeviceConfig& cfg, MqttManager* m) {
    mqtt = m;

    for (const auto& lc : cfg.lights) {
        if (!lc.enabled) continue;

        Light* light = nullptr;
        if (lc.type == "relay") {
            light = new RelayLight(lc.pin, lc.name.c_str());
        } else {
            light = new PwmLight(lc.pin, lc.ledc_channel, lc.name.c_str());
        }
        light->begin();
        lights.push_back(light);
        Serial.printf("[Lights] Added %s (%s) on pin %d\n",
            lc.name.c_str(), lc.type.c_str(), lc.pin);
    }
    Serial.printf("[Lights] Initialized %zu lights\n", lights.size());
}

void LightManager::reload(const DeviceConfig& cfg) {
    for (auto* light : lights) delete light;
    lights.clear();

    for (const auto& lc : cfg.lights) {
        if (!lc.enabled) continue;

        Light* light = nullptr;
        if (lc.type == "relay") {
            light = new RelayLight(lc.pin, lc.name.c_str());
        } else {
            light = new PwmLight(lc.pin, lc.ledc_channel, lc.name.c_str());
        }
        light->begin();
        lights.push_back(light);
        Serial.printf("[Lights] Reloaded %s (%s) on pin %d\n",
            lc.name.c_str(), lc.type.c_str(), lc.pin);
    }
    Serial.printf("[Lights] Reloaded %zu lights\n", lights.size());
}

void LightManager::process_command(const CommandMessage& cmd) {
    if (cmd.seq != 0 && was_seen(cmd.light_id, cmd.seq)) {
        Serial.printf("[Lights] Duplicate command %s seq=%u, skipping\n",
            cmd.light_id.c_str(), cmd.seq);
        return;
    }

    Light* light = get_light(cmd.light_id.c_str());
    if (!light) {
        Serial.printf("[Lights] Unknown light: %s\n", cmd.light_id.c_str());
        return;
    }

    if (cmd.seq != 0) {
        record_seen(cmd.light_id, cmd.seq);
    }

    light->set_state(cmd.state, cmd.brightness);

    if (mqtt) {
        mqtt->publish_state(cmd.light_id.c_str(), light->is_on(), light->get_brightness());
        mqtt->publish_ack(cmd, light->is_on(), light->get_brightness());
    }
}

void LightManager::fill_states_json(JsonArray& arr) const {
    for (const auto* light : lights) {
        JsonObject obj = arr.add<JsonObject>();
        light->fill_json(obj);
    }
}

void LightManager::fill_config_json(JsonArray& arr) const {
    for (const auto* light : lights) {
        JsonObject obj = arr.add<JsonObject>();
        obj["name"] = light->get_name();
        obj["state"] = light->is_on() ? "ON" : "OFF";
        obj["brightness"] = light->get_brightness();
    }
}

Light* LightManager::get_light(const char* name) {
    for (auto* light : lights) {
        if (strcmp(light->get_name(), name) == 0) {
            return light;
        }
    }
    return nullptr;
}

size_t LightManager::count() const { return lights.size(); }

bool LightManager::was_seen(const String& light_id, uint32_t seq) {
    for (size_t i = 0; i < SEEN_RING_SIZE; i++) {
        if (seen_ring[i].seq == seq && seen_ring[i].light_id == light_id) {
            return true;
        }
    }
    return false;
}

void LightManager::record_seen(const String& light_id, uint32_t seq) {
    seen_ring[seen_idx].light_id = light_id;
    seen_ring[seen_idx].seq = seq;
    seen_idx = (seen_idx + 1) % SEEN_RING_SIZE;
}
