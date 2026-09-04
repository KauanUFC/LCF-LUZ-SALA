#pragma once
#include "Light.h"

class PwmLight : public Light {
public:
    PwmLight(int pin, uint8_t ledc_channel, const char* name);
    void begin() override;
    void set_state(bool on, uint8_t brightness) override;
    bool is_on() const override;
    uint8_t get_brightness() const override;
    const char* get_name() const override;
    void fill_json(JsonObject& obj) const override;

private:
    int pin;
    uint8_t channel;
    const char* name;
    bool on;
    uint8_t brightness;
};
