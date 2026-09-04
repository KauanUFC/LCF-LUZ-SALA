#pragma once
#include "DeviceConfig.h"

class ConfigStorage {
public:
    bool begin();
    bool load(DeviceConfig& cfg);
    bool save(const DeviceConfig& cfg);
    bool exists();
};
