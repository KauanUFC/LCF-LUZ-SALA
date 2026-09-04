#include <Arduino.h>
#include <unity.h>
#include <ArduinoJson.h>
#include "config/DeviceConfig.h"
#include "config/ConfigStorage.h"
#include "mqtt/MessageParser.h"
#include "mqtt/MqttTopics.h"

// ============================================================
// End-to-end test: pure logic subsystems (no GPIO / WiFi).
// Tests: DeviceConfig, MessageParser, MqttTopics, JSON
// ============================================================

// ── DeviceConfig ──

void test_default_has_4_lights() {
    DeviceConfig d = DeviceConfig::default_config();
    TEST_ASSERT_EQUAL(4, d.lights.size());
    TEST_ASSERT_EQUAL_STRING("light-1", d.lights[0].name.c_str());
    TEST_ASSERT_EQUAL(25, d.lights[0].pin);
    TEST_ASSERT_EQUAL_STRING("pwm", d.lights[0].type.c_str());
}

void test_default_cfg_fields() {
    DeviceConfig d = DeviceConfig::default_config();
    TEST_ASSERT_EQUAL_STRING("MyWiFi", d.wifi_ssid.c_str());
    TEST_ASSERT_EQUAL_STRING("MyPassword", d.wifi_pass.c_str());
    TEST_ASSERT_EQUAL_STRING("192.168.1.10", d.mqtt_broker.c_str());
    TEST_ASSERT_EQUAL(1883, d.mqtt_port);
    TEST_ASSERT_EQUAL_STRING("", d.mqtt_user.c_str());
    TEST_ASSERT_EQUAL_STRING("", d.mqtt_pass.c_str());
    TEST_ASSERT_EQUAL_STRING("esp32-default", d.device_id.c_str());
    TEST_ASSERT_EQUAL_STRING("room-1", d.room_id.c_str());
    TEST_ASSERT_EQUAL_STRING("esptest", d.mdns_host.c_str());
}

void test_light_config_struct() {
    LightConfig lc;
    lc.pin = 32;
    lc.ledc_channel = 3;
    lc.name = "desk";
    lc.type = "pwm";
    lc.enabled = true;

    TEST_ASSERT_EQUAL(32, lc.pin);
    TEST_ASSERT_EQUAL(3, lc.ledc_channel);
    TEST_ASSERT_EQUAL_STRING("desk", lc.name.c_str());
    TEST_ASSERT_EQUAL_STRING("pwm", lc.type.c_str());
    TEST_ASSERT_TRUE(lc.enabled);
}

void test_config_mqtt_auth_fields_present() {
    DeviceConfig d;
    d.mqtt_user = "admin";
    d.mqtt_pass = "secret";

    JsonDocument doc;
    doc["mqtt_user"] = d.mqtt_user;
    doc["mqtt_pass"] = d.mqtt_pass;

    DeviceConfig out;
    out.mqtt_user = doc["mqtt_user"] | "";
    out.mqtt_pass = doc["mqtt_pass"] | "";

    TEST_ASSERT_EQUAL_STRING("admin", out.mqtt_user.c_str());
    TEST_ASSERT_EQUAL_STRING("secret", out.mqtt_pass.c_str());
}

void test_config_empty_auth_fields() {
    DeviceConfig d;
    d.mqtt_user = "";
    d.mqtt_pass = "";

    JsonDocument doc;
    doc["mqtt_user"] = d.mqtt_user;
    doc["mqtt_pass"] = d.mqtt_pass;

    DeviceConfig out;
    out.mqtt_user = doc["mqtt_user"] | "";
    out.mqtt_pass = doc["mqtt_pass"] | "";

    TEST_ASSERT_EQUAL_STRING("", out.mqtt_user.c_str());
    TEST_ASSERT_EQUAL_STRING("", out.mqtt_pass.c_str());
}

void test_config_light_channel_auto_assign() {
    DeviceConfig cfg;
    cfg.lights.clear();

    for (int i = 0; i < 6; i++) {
        LightConfig lc;
        lc.pin = 25 + i;
        lc.ledc_channel = i;
        lc.name = "lamp-" + String(i + 1);
        lc.type = "pwm";
        lc.enabled = true;
        cfg.lights.push_back(lc);
    }

    TEST_ASSERT_EQUAL(6, cfg.lights.size());
    TEST_ASSERT_EQUAL(0, cfg.lights[0].ledc_channel);
    TEST_ASSERT_EQUAL(3, cfg.lights[3].ledc_channel);
    TEST_ASSERT_EQUAL(5, cfg.lights[5].ledc_channel);
}

// ── MessageParser ──

void test_parser_extracts_light_id() {
    MessageParser p;
    const byte* payload = (const byte*)"{\"state\":\"ON\"}";
    CommandMessage cmd = p.parse("command/room1/dev1/kitchen", payload, 15);
    TEST_ASSERT_TRUE(cmd.valid);
    TEST_ASSERT_EQUAL_STRING("kitchen", cmd.light_id.c_str());
}

void test_parser_extracts_light_id_multi_segment() {
    MessageParser p;
    const byte* payload = (const byte*)"{\"state\":\"ON\"}";
    CommandMessage cmd = p.parse("command/r1/d1/a-b_c", payload, 15);
    TEST_ASSERT_TRUE(cmd.valid);
    TEST_ASSERT_EQUAL_STRING("a-b_c", cmd.light_id.c_str());
}

void test_parser_rejects_bad_json() {
    MessageParser p;
    CommandMessage cmd = p.parse("command/r1/d1/l1", (const byte*)"x", 1);
    TEST_ASSERT_FALSE(cmd.valid);
}

void test_parser_rejects_missing_state() {
    MessageParser p;
    CommandMessage cmd = p.parse("command/r1/d1/l1", (const byte*)"{\"source\":\"test\"}", 18);
    TEST_ASSERT_FALSE(cmd.valid);
}

void test_parser_reads_all_fields() {
    const char* pl = R"({"source":"remote","state":"OFF","brightness":0,"seq":7,"ts":1234})";
    MessageParser p;
    CommandMessage cmd = p.parse("command/r1/d1/l1", (const byte*)pl, strlen(pl));
    TEST_ASSERT_TRUE(cmd.valid);
    TEST_ASSERT_EQUAL_STRING("l1", cmd.light_id.c_str());
    TEST_ASSERT_EQUAL_STRING("remote", cmd.source.c_str());
    TEST_ASSERT_EQUAL_STRING("", cmd.msg_id.c_str());
    TEST_ASSERT_FALSE(cmd.state);
    TEST_ASSERT_EQUAL(0, cmd.brightness);
    TEST_ASSERT_EQUAL(7, cmd.seq);
    TEST_ASSERT_EQUAL(1234, cmd.ts);
}

void test_parser_brightness_clamped() {
    MessageParser p;
    CommandMessage cmd = p.parse("command/r1/d1/l1", (const byte*)"{\"state\":\"ON\",\"brightness\":255}", 32);
    TEST_ASSERT_EQUAL(100, cmd.brightness);
}

void test_parser_brightness_defaults_100_when_on() {
    MessageParser p;
    CommandMessage cmd = p.parse("command/r1/d1/l1", (const byte*)"{\"state\":\"ON\"}", 14);
    TEST_ASSERT_EQUAL(100, cmd.brightness);
}

void test_parser_brightness_defaults_0_when_off() {
    MessageParser p;
    CommandMessage cmd = p.parse("command/r1/d1/l1", (const byte*)"{\"state\":\"OFF\"}", 15);
    TEST_ASSERT_EQUAL(0, cmd.brightness);
}

void test_parser_source_defaults_mqtt() {
    MessageParser p;
    CommandMessage cmd = p.parse("command/r1/d1/l1", (const byte*)"{\"state\":\"ON\"}", 14);
    TEST_ASSERT_EQUAL_STRING("mqtt", cmd.source.c_str());
}

void test_parser_seq_defaults_0() {
    MessageParser p;
    CommandMessage cmd = p.parse("command/r1/d1/l1", (const byte*)"{\"state\":\"ON\"}", 14);
    TEST_ASSERT_EQUAL(0, cmd.seq);
}

void test_parser_msg_id_defaults_empty() {
    MessageParser p;
    CommandMessage cmd = p.parse("command/r1/d1/l1", (const byte*)"{\"state\":\"ON\"}", 14);
    TEST_ASSERT_EQUAL_STRING("", cmd.msg_id.c_str());
}

void test_parser_ts_defaults_0() {
    MessageParser p;
    CommandMessage cmd = p.parse("command/r1/d1/l1", (const byte*)"{\"state\":\"ON\"}", 14);
    TEST_ASSERT_EQUAL(0, cmd.ts);
}

void test_parser_with_all_optional_fields() {
    const char* pl = R"({"source":"web","msg_id":"abc-123","seq":42,"ts":999999,"state":"ON","brightness":80})";
    MessageParser p;
    CommandMessage cmd = p.parse("command/r1/d1/floor-lamp", (const byte*)pl, strlen(pl));
    TEST_ASSERT_TRUE(cmd.valid);
    TEST_ASSERT_EQUAL_STRING("floor-lamp", cmd.light_id.c_str());
    TEST_ASSERT_EQUAL_STRING("web", cmd.source.c_str());
    TEST_ASSERT_EQUAL_STRING("abc-123", cmd.msg_id.c_str());
    TEST_ASSERT_EQUAL(42, cmd.seq);
    TEST_ASSERT_EQUAL(999999, cmd.ts);
    TEST_ASSERT_TRUE(cmd.state);
    TEST_ASSERT_EQUAL(80, cmd.brightness);
}

// ── MqttTopics ──

void test_topic_command() {
    char buf[64];
    mqtt_topic_command(buf, sizeof(buf), "room1", "dev1", "lamp1");
    TEST_ASSERT_EQUAL_STRING("command/room1/dev1/lamp1", buf);
}

void test_topic_state() {
    char buf[64];
    mqtt_topic_state(buf, sizeof(buf), "r1", "d1", "l1");
    TEST_ASSERT_EQUAL_STRING("state/r1/d1/l1", buf);
}

void test_topic_ack() {
    char buf[64];
    mqtt_topic_ack(buf, sizeof(buf), "r1", "d1", "l1");
    TEST_ASSERT_EQUAL_STRING("ack/r1/d1/l1", buf);
}

void test_topic_health() {
    char buf[64];
    mqtt_topic_health(buf, sizeof(buf), "r1", "d1");
    TEST_ASSERT_EQUAL_STRING("health/r1/d1", buf);
}

void test_topic_availability() {
    char buf[64];
    mqtt_topic_availability(buf, sizeof(buf), "r1", "d1");
    TEST_ASSERT_EQUAL_STRING("availability/r1/d1", buf);
}

void test_topic_subscribe() {
    char buf[64];
    mqtt_subscribe_command(buf, sizeof(buf), "r1", "d1");
    TEST_ASSERT_EQUAL_STRING("command/r1/d1/+", buf);
}

void test_topic_buf_truncation() {
    char buf[4];
    mqtt_topic_command(buf, sizeof(buf), "room1", "dev1", "lamp1");
    TEST_ASSERT_EQUAL(0, buf[3]); // null-terminated at buffer limit
}

// ── setup / loop ──

void setup() {
    delay(2000);
    Serial.begin(115200);

    UNITY_BEGIN();

    RUN_TEST(test_default_has_4_lights);
    RUN_TEST(test_default_cfg_fields);
    RUN_TEST(test_light_config_struct);
    RUN_TEST(test_config_mqtt_auth_fields_present);
    RUN_TEST(test_config_empty_auth_fields);
    RUN_TEST(test_config_light_channel_auto_assign);

    RUN_TEST(test_parser_extracts_light_id);
    RUN_TEST(test_parser_extracts_light_id_multi_segment);
    RUN_TEST(test_parser_rejects_bad_json);
    RUN_TEST(test_parser_rejects_missing_state);
    RUN_TEST(test_parser_reads_all_fields);
    RUN_TEST(test_parser_brightness_clamped);
    RUN_TEST(test_parser_brightness_defaults_100_when_on);
    RUN_TEST(test_parser_brightness_defaults_0_when_off);
    RUN_TEST(test_parser_source_defaults_mqtt);
    RUN_TEST(test_parser_seq_defaults_0);
    RUN_TEST(test_parser_msg_id_defaults_empty);
    RUN_TEST(test_parser_ts_defaults_0);
    RUN_TEST(test_parser_with_all_optional_fields);

    RUN_TEST(test_topic_command);
    RUN_TEST(test_topic_state);
    RUN_TEST(test_topic_ack);
    RUN_TEST(test_topic_health);
    RUN_TEST(test_topic_availability);
    RUN_TEST(test_topic_subscribe);
    RUN_TEST(test_topic_buf_truncation);

    UNITY_END();
}

void loop() { delay(100); }
