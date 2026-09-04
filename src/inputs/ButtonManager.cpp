#include "ButtonManager.h"
#include <Arduino.h>

static constexpr unsigned long DEBOUNCE_DELAY = 50;
static constexpr unsigned long LONG_PRESS_MS = 1000;

ButtonManager::ButtonManager()
    : pin(-1), light_name(nullptr), last_debounce_time(0), press_start(0),
      last_steady_state(HIGH), last_raw(HIGH), pressed(false), long_press_fired(false) {}

void ButtonManager::begin(int p, const char* name, ButtonCallback cb) {
    pin = p;
    light_name = name;
    callback = cb;
    pinMode(pin, INPUT_PULLUP);
    last_raw = digitalRead(pin);
    last_steady_state = last_raw;
}

void ButtonManager::on_press(ButtonCallback cb) {
    callback = cb;
}

void ButtonManager::tick() {
    if (pin < 0) return;

    int reading = digitalRead(pin);
    unsigned long now = millis();

    if (reading != last_raw) {
        last_debounce_time = now;
    }

    if ((now - last_debounce_time) > DEBOUNCE_DELAY) {
        if (reading != last_steady_state) {
            last_steady_state = reading;

            if (reading == LOW) {
                press_start = now;
                long_press_fired = false;
                pressed = true;
            } else {
                if (pressed && !long_press_fired && callback) {
                    callback(light_name, false);
                }
                pressed = false;
            }
        }
    }

    if (pressed && !long_press_fired && (now - press_start >= LONG_PRESS_MS)) {
        long_press_fired = true;
        if (callback) {
            callback(light_name, true);
        }
    }

    last_raw = reading;
}
