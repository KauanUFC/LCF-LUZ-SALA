#include "RelayLight.h"
#include <Arduino.h>

RelayLight::RelayLight(int p, const char* n) : pin(p), name(n), on(false) {}

void RelayLight::begin() {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    on = false;
}

void RelayLight::set_state(bool state, uint8_t brightness) {
    (void)brightness;
    on = state;
    digitalWrite(pin, state ? HIGH : LOW);
}

bool RelayLight::is_on() const { return on; }
uint8_t RelayLight::get_brightness() const { return on ? 100 : 0; }
const char* RelayLight::get_name() const { return name; }

void RelayLight::fill_json(JsonObject& obj) const {
    obj["name"] = name;
    obj["state"] = on ? "ON" : "OFF";
    obj["brightness"] = (on ? 100 : 0);
    obj["type"] = "relay";
}
