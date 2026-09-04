#pragma once

class NtpSync {
public:
    void begin();
    void tick();
    unsigned long get_timestamp();
    bool synced();
};
