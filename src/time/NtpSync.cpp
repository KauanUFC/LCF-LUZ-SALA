#include "NtpSync.h"
#include <Arduino.h>
#include <time.h>

static const char* NTP_SERVER = "pool.ntp.org";
static const long GMT_OFFSET_SEC = 0;
static const int DAYLIGHT_OFFSET_SEC = 0;
static const unsigned long RE_SYNC_INTERVAL_MS = 21600000; // 6 hours
static const unsigned long NTP_TIMEOUT_MS = 10000;

void NtpSync::begin() {
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
    Serial.print("[NTP] Syncing");
    unsigned long start = millis();
    while (!time(nullptr) && millis() - start < NTP_TIMEOUT_MS) {
        delay(100);
        Serial.print(".");
    }
    if (time(nullptr)) {
        Serial.printf("\n[NTP] Synced: %lu\n", (unsigned long)time(nullptr));
    } else {
        Serial.println("\n[NTP] Sync timeout (will retry)");
    }
}

void NtpSync::tick() {
    static unsigned long last_sync = millis();
    if (!time(nullptr) || (millis() - last_sync >= RE_SYNC_INTERVAL_MS)) {
        last_sync = millis();
        configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
    }
}

unsigned long NtpSync::get_timestamp() {
    time_t now = time(nullptr);
    return (now > 0) ? (unsigned long)now : 0;
}

bool NtpSync::synced() {
    return time(nullptr) > 0;
}
