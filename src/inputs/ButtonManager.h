#pragma once
#include <functional>
#include "lights/LightManager.h"

using ButtonCallback = std::function<void(const char* light_name, bool long_press)>;

class ButtonManager {
public:
    ButtonManager();
    void begin(int pin, const char* light_name = "light-1", ButtonCallback cb = nullptr);
    void tick();
    void on_press(ButtonCallback cb);

private:
    int pin;
    const char* light_name;
    ButtonCallback callback;
    unsigned long last_debounce_time;
    unsigned long press_start;
    int last_steady_state;
    int last_raw;
    bool pressed;
    bool long_press_fired;
};
