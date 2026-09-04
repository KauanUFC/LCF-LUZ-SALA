#include "PwmLight.h"
#include <Arduino.h>

static constexpr unsigned int LEDC_FREQ = 5000;
static constexpr uint8_t LEDC_RESOLUTION = 8;

PwmLight::PwmLight(int p, uint8_t ch, const char* n)
    : pin(p), channel(ch), name(n), on(false), brightness(0) {}

void PwmLight::begin() {
    ledcSetup(channel, LEDC_FREQ, LEDC_RESOLUTION);
    ledcAttachPin(pin, channel);
    ledcWrite(channel, 0);
    on = false;
    brightness = 0;
}

void PwmLight::set_state(bool state, uint8_t b) {
    on = state;
    brightness = state ? b : 0;
    uint8_t duty = state ? map(b, 0, 100, 0, (1 << LEDC_RESOLUTION) - 1) : 0;
    ledcWrite(channel, duty);
}

bool PwmLight::is_on() const { return on; }
uint8_t PwmLight::get_brightness() const { return brightness; }
const char* PwmLight::get_name() const { return name; }

void PwmLight::fill_json(JsonObject& obj) const {
    obj["name"] = name;
    obj["state"] = on ? "ON" : "OFF";
    obj["brightness"] = brightness;
    obj["type"] = "pwm";
}
