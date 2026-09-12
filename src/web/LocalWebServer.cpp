#include "LocalWebServer.h"
#include <ArduinoJson.h>
#include <FFat.h>

LocalWebServer::LocalWebServer() : server(80),
    lights(nullptr), storage(nullptr), config(nullptr),
    health(nullptr), wifi(nullptr), ap_mode(false) {}

void LocalWebServer::begin(LightManager& lm, ConfigStorage& st,
                            DeviceConfig& cfg,
                            HealthReporter& hr, WifiManager& wf,
                            bool ap) {
    lights = &lm;
    storage = &st;
    config = &cfg;
    health = &hr;
    wifi = &wf;
    ap_mode = ap;

    setup_routes();

    server.begin();
    Serial.printf("[Web] Server started on port 80 (ap_mode=%d)\n", ap_mode);
}

void LocalWebServer::setup_routes() {
    server.on("/", HTTP_GET, [this](AsyncWebServerRequest* request) {
        if (ap_mode) {
            serve_provision_html(request);
        } else {
            request->send(200, "text/html", get_dashboard_html());
        }
    });

    server.on("/config", HTTP_GET, [this](AsyncWebServerRequest* request) {
        request->send(200, "text/html", get_wifi_mqtt_html());
    });

    server.on("/lights", HTTP_GET, [this](AsyncWebServerRequest* request) {
        request->send(200, "text/html", get_lights_html());
    });

    // REST: GET /api/health
    server.on("/api/health", HTTP_GET, [this](AsyncWebServerRequest* request) {
        if (health) health->publish_health();

        JsonDocument doc;
        doc["device"] = config->device_id;
        doc["room"] = config->room_id;
        doc["wifi_connected"] = wifi->connected();
        doc["wifi_rssi"] = wifi->get_rssi();
        doc["free_heap"] = ESP.getFreeHeap();
        doc["fw_version"] = "1.0.0";

        String out;
        serializeJson(doc, out);
        request->send(200, "application/json", out);
    });

    // REST: GET /api/lights
    server.on("/api/lights", HTTP_GET, [this](AsyncWebServerRequest* request) {
        JsonDocument doc;
        JsonArray arr = doc.to<JsonArray>();
        lights->fill_states_json(arr);

        String out;
        serializeJson(doc, out);
        request->send(200, "application/json", out);
    });

    // REST: PUT /api/lights (control)
    server.on("/api/lights", HTTP_PUT, [this](AsyncWebServerRequest* request) {
        String light_id = request->arg("light_id");
        String state_str = request->arg("state");
        String brightness_str = request->arg("brightness");

        if (light_id.length() == 0 || state_str.length() == 0) {
            request->send(400, "application/json", "{\"error\":\"missing light_id or state\"}");
            return;
        }

        uint8_t brightness = brightness_str.length() > 0 ? brightness_str.toInt() : 100;

        CommandMessage cmd;
        cmd.light_id = light_id;
        cmd.source = "http";
        cmd.msg_id = "";
        cmd.seq = 0;
        cmd.ts = millis() / 1000;
        cmd.state = (state_str == "ON");
        cmd.brightness = brightness;
        cmd.valid = true;

        lights->process_command(cmd);
        request->send(200, "application/json", "{\"status\":\"ok\"}");
    });

    // REST: PUT /api/lights-config (save light config without restart)
    server.on("/api/lights-config", HTTP_PUT, [this](AsyncWebServerRequest* request) {
        String lightsJson = request->arg("lights");
        if (lightsJson.length() == 0) {
            request->send(400, "application/json", "{\"error\":\"missing lights\"}");
            return;
        }

        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, lightsJson);
        if (err) {
            request->send(400, "application/json", "{\"error\":\"invalid json\"}");
            return;
        }

        JsonArray arr = doc.as<JsonArray>();
        if (arr) {
            size_t received = arr.size();
            Serial.printf("[Lights-config] Received %zu lights from client\n", received);

            config->lights.clear();
            uint8_t ch = 0;
            for (JsonObject obj : arr) {
                LightConfig lc;
                lc.pin = obj["pin"] | 25;
                lc.ledc_channel = ch++;
                lc.name = obj["name"] | "light";
                lc.type = obj["type"] | "pwm";
                lc.enabled = obj["enabled"] | true;
                config->lights.push_back(lc);
            }
        }

        bool saved = storage->save(*config);
        Serial.printf("[Lights-config] save()=%d, lights in config=%zu\n", saved, config->lights.size());

        lights->reload(*config);
        Serial.printf("[Lights-config] LightManager count=%zu\n", lights->count());

        if (saved) {
            request->send(200, "application/json", "{\"status\":\"saved\"}");
        } else {
            request->send(500, "application/json", "{\"error\":\"failed to save config\"}");
        }
    });

    // REST: GET /api/config
    server.on("/api/config", HTTP_GET, [this](AsyncWebServerRequest* request) {
        JsonDocument doc;
        doc["wifi_ssid"] = config->wifi_ssid;
        doc["wifi_pass"] = "***";
        doc["mqtt_broker"] = config->mqtt_broker;
        doc["mqtt_port"] = config->mqtt_port;
        doc["mqtt_user"] = config->mqtt_user;
        doc["mqtt_pass"] = "***";
        doc["device_id"] = config->device_id;
        doc["room_id"] = config->room_id;
        doc["mdns_host"] = config->mdns_host;

        JsonArray arr = doc["lights"].to<JsonArray>();
        for (const auto& lc : config->lights) {
            JsonObject obj = arr.add<JsonObject>();
            obj["pin"] = lc.pin;
            obj["channel"] = lc.ledc_channel;
            obj["name"] = lc.name;
            obj["type"] = lc.type;
            obj["enabled"] = lc.enabled;
        }

        String out;
        serializeJson(doc, out);
        request->send(200, "application/json", out);
    });

    // REST: PUT /api/config
    server.on("/api/config", HTTP_PUT, [this](AsyncWebServerRequest* request) {
        if (request->hasArg("wifi_ssid")) config->wifi_ssid = request->arg("wifi_ssid");
        if (request->hasArg("wifi_pass") && request->arg("wifi_pass") != "***") config->wifi_pass = request->arg("wifi_pass");
        if (request->hasArg("mqtt_broker")) config->mqtt_broker = request->arg("mqtt_broker");
        if (request->hasArg("mqtt_port")) config->mqtt_port = request->arg("mqtt_port").toInt();
        if (request->hasArg("mqtt_user")) config->mqtt_user = request->arg("mqtt_user");
        if (request->hasArg("mqtt_pass") && request->arg("mqtt_pass") != "***") config->mqtt_pass = request->arg("mqtt_pass");
        if (request->hasArg("device_id")) config->device_id = request->arg("device_id");
        if (request->hasArg("room_id")) config->room_id = request->arg("room_id");
        if (request->hasArg("mdns_host")) config->mdns_host = request->arg("mdns_host");

        storage->save(*config);
        request->send(200, "application/json", "{\"status\":\"saved\",\"restart\":true}");
        delay(2000);
        ESP.restart();
    });

    // REST: POST /api/restart
    server.on("/api/restart", HTTP_POST, [](AsyncWebServerRequest* request) {
        request->send(200, "application/json", "{\"status\":\"restarting\"}");
        delay(300);
        ESP.restart();
    });

    // REST: POST /api/reset (factory reset — erases config, enters AP mode)
    server.on("/api/reset", HTTP_POST, [this](AsyncWebServerRequest* request) {
        FFat.remove("/config.json");
        request->send(200, "application/json", "{\"status\":\"reset\"}");
        delay(500);
        ESP.restart();
    });

    // Catch-all: serve provision page in AP mode
    server.onNotFound([this](AsyncWebServerRequest* request) {
        if (ap_mode) {
            serve_provision_html(request);
        } else {
            request->send(404, "text/plain", "Not found");
        }
    });
}

void LocalWebServer::serve_provision_html(AsyncWebServerRequest* request) {
    // Handle form submission
    if (request->method() == HTTP_POST && request->hasArg("wifi_ssid")) {
        config->wifi_ssid = request->arg("wifi_ssid");
        config->wifi_pass = request->arg("wifi_pass");
        if (request->hasArg("mqtt_broker")) {
            config->mqtt_broker = request->arg("mqtt_broker");
        }
        if (request->hasArg("device_id")) {
            config->device_id = request->arg("device_id");
        }
        storage->save(*config);
        request->send(200, "text/html",
            "<html><body><h2>Config saved!</h2><p>Device will restart...</p></body></html>");
        delay(1000);
        ESP.restart();
        return;
    }

    request->send(200, "text/html", get_provision_html());
}

void LocalWebServer::tick() {
    // AsyncWebServer handles requests in background; nothing needed here.
}

// === PROGMEM HTML strings ===

String LocalWebServer::get_provision_html() {
    return R"rawliteral(
<!DOCTYPE html><html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Light Setup</title>
<style>
body{font-family:sans-serif;background:#1a1a2e;color:#eee;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
.card{background:#16213e;padding:2rem;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.3);width:90%;max-width:400px}
h2{color:#e94560;margin-top:0;text-align:center}
label{display:block;margin-top:1rem;color:#bbb;font-size:0.9rem}
input{width:100%;padding:10px;margin-top:4px;background:#0f3460;border:1px solid #1a1a2e;border-radius:6px;color:#eee;font-size:1rem;box-sizing:border-box}
button{width:100%;padding:12px;margin-top:1.5rem;background:#e94560;border:none;border-radius:6px;color:#fff;font-size:1rem;cursor:pointer}
button:hover{background:#c73650}
small{display:block;text-align:center;margin-top:1rem;color:#666}
</style></head><body>
<div class="card">
<h2>Wi-Fi Setup</h2>
<form method="POST">
<label>Wi-Fi SSID</label><input name="wifi_ssid" required>
<label>Wi-Fi Password</label><input name="wifi_pass" type="password">
<label>MQTT Broker (optional)</label><input name="mqtt_broker" value="192.168.1.10">
<label>Device ID (optional)</label><input name="device_id" value="esp32-default">
<button type="submit">Save & Connect</button>
</form>
<small>Device will restart after saving.</small>
</div></body></html>
)rawliteral";
}

String LocalWebServer::get_dashboard_html() {
    return R"rawliteral(
<!DOCTYPE html><html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Light Control</title>
<style>
*{box-sizing:border-box}
body{font-family:sans-serif;background:#1a1a2e;color:#eee;margin:0;padding:16px}
h1{color:#e94560;font-size:1.4rem;margin:0 0 4px 0}
.sub{color:#888;font-size:0.85rem;margin-bottom:1rem}
.card{background:#16213e;border-radius:10px;padding:16px;margin-bottom:12px}
.card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
.light-name{font-size:1.1rem;font-weight:bold}
.badge{padding:4px 10px;border-radius:12px;font-size:0.75rem}
.badge-on{background:#27ae60;color:#fff}
.badge-off{background:#444;color:#aaa}
.controls{display:flex;align-items:center;gap:12px;margin-top:8px}
.toggle-btn{padding:8px 20px;border:none;border-radius:6px;font-size:0.9rem;cursor:pointer;color:#fff}
.toggle-on{background:#27ae60}
.toggle-off{background:#555}
.slider{flex:1}
input[type=range]{width:100%;height:6px;border-radius:3px;background:#0f3460;outline:none;-webkit-appearance:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#e94560;cursor:pointer}
.brightness-val{min-width:32px;text-align:right;font-size:0.9rem}
.status-bar{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;font-size:0.8rem}
.status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px}
.dot-green{background:#27ae60}
.dot-red{background:#e94560}
.actions{display:flex;gap:8px;margin-top:12px}
.actions a,.actions button{padding:8px 16px;border-radius:6px;text-decoration:none;font-size:0.85rem;border:none;cursor:pointer;color:#fff}
.btn-config{background:#0f3460}
.btn-lights{background:#1a5276}
.btn-ota{background:#e94560}
.btn-restart{background:#555}
.btn-reset{background:#7f1d1d}
</style></head><body>
<h1>Light Control</h1>
<div class="sub" id="deviceInfo">Loading...</div>
<div class="status-bar" id="statusBar"></div>
<div id="lightsContainer"></div>
<div class="actions">
<a class="btn-config" href="/config">WiFi/MQTT</a>
<a class="btn-lights" href="/lights">Lights</a>
<a class="btn-ota" href="/update">OTA Update</a>
<button class="btn-restart" onclick="restartDevice()">Restart</button>
<button class="btn-reset" onclick="factoryReset()">Factory Reset</button>
</div>
<script>
const API = '';
async function fetchJSON(url){const r=await fetch(url);return r.json();}
async function updateStatus(){
  const health = await fetchJSON(API+'/api/health');
  document.getElementById('deviceInfo').textContent = health.device + ' @ ' + health.room + ' | FW: ' + health.fw_version;
  const sb = document.getElementById('statusBar');
  sb.innerHTML = '<span><span class="status-dot '+(health.wifi_connected?'dot-green':'dot-red')+'"></span>WiFi '+(health.wifi_connected ? health.wifi_rssi+'dBm' : 'DOWN')+'</span>' +
    ' | Heap: '+(health.free_heap/1024).toFixed(0)+'KB';
  const lights = await fetchJSON(API+'/api/lights');
  const container = document.getElementById('lightsContainer');
  container.innerHTML = '';
  lights.forEach(l => {
    const on = l.state === 'ON';
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = '<div class="card-header"><span class="light-name">'+l.name+'</span><span class="badge '+(on?'badge-on':'badge-off')+'">'+l.state+'</span></div>' +
      '<div class="controls"><button class="toggle-btn '+(on?'toggle-on':'toggle-off')+'" onclick="toggleLight(\''+l.name+'\','+(on?'false':'true')+',this)">'+(on?'OFF':'ON')+'</button>' +
      (l.type==='pwm'?'<input type="range" min="0" max="100" value="'+l.brightness+'" class="slider" oninput="setBrightness(\''+l.name+'\',this.value,this)"><span class="brightness-val">'+l.brightness+'</span>':'');
    container.appendChild(card);
  });
}
async function toggleLight(name,state,btn){
  btn.disabled=true;
  await fetch(API+'/api/lights',{method:'PUT',body:'light_id='+name+'&state='+(state?'ON':'OFF')});
  updateStatus();
}
async function setBrightness(name,val,slider){
  const state = parseInt(val)>0?'ON':'OFF';
  await fetch(API+'/api/lights',{method:'PUT',body:'light_id='+name+'&state='+state+'&brightness='+parseInt(val)});
  slider.parentElement.querySelector('.brightness-val').textContent=val;
}
async function restartDevice(){
  if(confirm('Restart device?')){
    fetch(API+'/api/restart',{method:'POST'}).catch(()=>{});
    alert('Device is restarting...\nYou will be redirected to the dashboard.');
    setTimeout(()=>{window.location.href='/';},4000);
  }
}
async function factoryReset(){
  if(confirm('This will erase all configuration! Continue?')){
    await fetch('/api/reset',{method:'POST'});
    alert('Configuration erased.\nDevice will restart in AP mode.\nConnect to the Light-Setup-XXXX network to reconfigure.');
  }
}
updateStatus();
setInterval(updateStatus,5000);
</script></body></html>
)rawliteral";
}

String LocalWebServer::get_wifi_mqtt_html() {
    return R"rawliteral(
<!DOCTYPE html><html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>WiFi / MQTT Config</title>
<style>
body{font-family:sans-serif;background:#1a1a2e;color:#eee;margin:0;padding:16px}
h1{color:#e94560;font-size:1.4rem}
label{display:block;margin-top:12px;color:#bbb;font-size:0.9rem}
input{width:100%;padding:10px;margin-top:4px;background:#0f3460;border:1px solid #1a1a2e;border-radius:6px;color:#eee;font-size:1rem;box-sizing:border-box}
button{padding:12px 24px;margin-top:16px;background:#e94560;border:none;border-radius:6px;color:#fff;font-size:1rem;cursor:pointer}
button:hover{background:#c73650}
.back{display:inline-block;margin-bottom:1rem;color:#e94560;text-decoration:none}
</style></head><body>
<a href="/" class="back">&larr; Dashboard</a>
<h1>WiFi / MQTT Configuration</h1>
<div id="form"></div>
<button onclick="saveConfig()">Save & Restart</button>
<script>
async function loadConfig(){
  const cfg = await (await fetch('/api/config')).json();
  document.getElementById('form').innerHTML = `
    <label>Wi-Fi SSID</label><input id="wifi_ssid" value="${cfg.wifi_ssid}">
    <label>Wi-Fi Password</label><input id="wifi_pass" type="password" value="${cfg.wifi_pass}">
    <label>MQTT Broker</label><input id="mqtt_broker" value="${cfg.mqtt_broker}">
    <label>MQTT Port</label><input id="mqtt_port" value="${cfg.mqtt_port}">
    <label>MQTT User</label><input id="mqtt_user" value="${cfg.mqtt_user}">
    <label>MQTT Password</label><input id="mqtt_pass" type="password" value="${cfg.mqtt_pass}">
    <label>Device ID</label><input id="device_id" value="${cfg.device_id}">
    <label>Room ID</label><input id="room_id" value="${cfg.room_id}">
    <label>mDNS Host</label><input id="mdns_host" value="${cfg.mdns_host}">`;
}
async function saveConfig(){
  const params = new URLSearchParams();
  params.set('wifi_ssid', document.getElementById('wifi_ssid').value);
  params.set('wifi_pass', document.getElementById('wifi_pass').value);
  params.set('mqtt_broker', document.getElementById('mqtt_broker').value);
  params.set('mqtt_port', document.getElementById('mqtt_port').value || 1883);
  params.set('mqtt_user', document.getElementById('mqtt_user').value);
  params.set('mqtt_pass', document.getElementById('mqtt_pass').value);
  params.set('device_id', document.getElementById('device_id').value);
  params.set('room_id', document.getElementById('room_id').value);
  params.set('mdns_host', document.getElementById('mdns_host').value);
  fetch('/api/config',{method:'PUT',body:params.toString()}).catch(()=>{});
  alert('Configuration saved! Device is restarting...\nYou will be redirected to the dashboard.');
  setTimeout(()=>{window.location.href='/';},4000);
}
loadConfig();
</script></body></html>
)rawliteral";
}

String LocalWebServer::get_lights_html() {
    return R"rawliteral(
<!DOCTYPE html><html><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Light Config</title>
<style>
body{font-family:sans-serif;background:#1a1a2e;color:#eee;margin:0;padding:16px}
h1{color:#e94560;font-size:1.4rem}
label{display:block;margin-top:12px;color:#bbb;font-size:0.9rem}
input{width:100%;padding:10px;margin-top:4px;background:#0f3460;border:1px solid #1a1a2e;border-radius:6px;color:#eee;font-size:1rem;box-sizing:border-box}
button{padding:12px 24px;margin-top:16px;background:#e94560;border:none;border-radius:6px;color:#fff;font-size:1rem;cursor:pointer}
button:hover{background:#c73650}
.back{display:inline-block;margin-bottom:1rem;color:#e94560;text-decoration:none}
.light-row{display:flex;gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap}
.light-row input{width:auto;flex:1;min-width:60px}
.light-row select{background:#0f3460;color:#eee;border:1px solid #1a1a2e;border-radius:6px;padding:8px}
</style></head><body>
<a href="/" class="back">&larr; Dashboard</a>
<h1>Light Configuration</h1>
<div id="lights-form"></div>
<button onclick="saveLightsConfig()">Save</button>
<script>
async function loadLightsConfig(){
  const cfg = await (await fetch('/api/config')).json();
  const lc = document.getElementById('lights-form');
  let html = '<h3 style="margin-top:20px;color:#e94560">Lights</h3><div id="lights-config">';
  cfg.lights.forEach((l,i)=>{
    html += '<div class="light-row" id="lr'+i+'">'+
      '<input id="l_name'+i+'" value="'+l.name+'" placeholder="Name">'+
      '<input id="l_pin'+i+'" value="'+l.pin+'" placeholder="Pin" style="max-width:70px">'+
      '<select id="l_type'+i+'"><option value="pwm"'+(l.type==='pwm'?' selected':'')+'>PWM</option><option value="relay"'+(l.type==='relay'?' selected':'')+'>Relay</option></select>'+
      '<label style="margin:0;display:flex;align-items:center;gap:4px"><input type="checkbox" id="l_enabled'+i+'"'+(l.enabled?' checked':'')+'>Active</label>'+
      '<button onclick="this.parentElement.remove()" style="padding:6px 12px;margin:0;background:#555">X</button></div>';
  });
  html += '</div><button onclick="addLight()" style="background:#0f3460;margin-top:8px">+ Add Light</button>';
  lc.innerHTML = html;
}
function addLight(){
  const lc = document.getElementById('lights-config');
  const i = Date.now();
  lc.innerHTML += '<div class="light-row" id="lr'+i+'">'+
    '<input id="l_name'+i+'" value="light" placeholder="Name">'+
    '<input id="l_pin'+i+'" value="25" placeholder="Pin" style="max-width:70px">'+
    '<select id="l_type'+i+'"><option value="pwm">PWM</option><option value="relay">Relay</option></select>'+
    '<label style="margin:0;display:flex;align-items:center;gap:4px"><input type="checkbox" id="l_enabled'+i+'" checked>Active</label>'+
    '<button onclick="this.parentElement.remove()" style="padding:6px 12px;margin:0;background:#555">X</button></div>';
}
async function saveLightsConfig(){
  const lights=[];
  document.querySelectorAll('.light-row').forEach(div=>{
    const id = div.id.replace('lr','');
    if(id==='')return;
    lights.push({
      name: document.getElementById('l_name'+id)?.value || 'light',
      pin: parseInt(document.getElementById('l_pin'+id)?.value) || 25,
      type: document.getElementById('l_type'+id)?.value || 'pwm',
      enabled: document.getElementById('l_enabled'+id)?.checked || false,
      channel: 0
    });
  });
  try {
    const r = await fetch('/api/lights-config',{method:'PUT',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'lights=' + encodeURIComponent(JSON.stringify(lights))});
    const j = await r.json();
    if(j.status === 'saved'){
      alert('Lights saved! Redirecting to dashboard...');
      setTimeout(()=>{window.location.href='/';},2000);
    } else {
      alert('Save failed: ' + (j.error || 'unknown error'));
    }
  } catch(e) {
    alert('Network error: ' + e.message);
  }
}
loadLightsConfig();
</script></body></html>
)rawliteral";
}