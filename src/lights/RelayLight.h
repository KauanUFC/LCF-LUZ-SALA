#pragma once
#include "Light.h"

class RelayLight : public Light {
public:
    RelayLight(int pin, const char* name);
    void begin() override;
    void set_state(bool on, uint8_t brightness) override;
    bool is_on() const override;
    uint8_t get_brightness() const override;
    const char* get_name() const override;
    void fill_json(JsonObject& obj) const override;

private:
    int pin;
    const char* name;
    bool on;
};
