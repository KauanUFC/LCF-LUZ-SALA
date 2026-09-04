#pragma once
#include <ArduinoJson.h>

class Light {
public:
    virtual ~Light() = default;
    virtual void begin() = 0;
    virtual void set_state(bool on, uint8_t brightness) = 0;
    virtual bool is_on() const = 0;
    virtual uint8_t get_brightness() const = 0;
    virtual const char* get_name() const = 0;
    virtual void fill_json(JsonObject& obj) const = 0;
};
