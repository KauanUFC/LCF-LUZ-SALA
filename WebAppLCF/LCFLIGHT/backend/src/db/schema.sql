CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rooms (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS devices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  fw_version     TEXT,
  online         BOOLEAN NOT NULL DEFAULT false,
  last_seen      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, name)
);

CREATE TABLE IF NOT EXISTS lights (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'pwm',
  enabled    BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(device_id, name)
);

CREATE TABLE IF NOT EXISTS current_states (
  light_id   UUID PRIMARY KEY REFERENCES lights(id),
  state      BOOLEAN NOT NULL,
  brightness INTEGER NOT NULL DEFAULT 0,
  seq        INTEGER,
  source     TEXT DEFAULT 'mqtt',
  ts         TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS state_history (
  id          BIGSERIAL PRIMARY KEY,
  light_id    UUID NOT NULL REFERENCES lights(id),
  state       BOOLEAN NOT NULL,
  brightness  INTEGER NOT NULL,
  seq         INTEGER,
  source      TEXT,
  ts          TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_state_history_lookup ON state_history(light_id, ts DESC);

CREATE TABLE IF NOT EXISTS health_log (
  id          BIGSERIAL PRIMARY KEY,
  device_id   UUID NOT NULL REFERENCES devices(id),
  uptime_s    BIGINT NOT NULL,
  wifi_rssi   INTEGER,
  free_heap   INTEGER,
  seq         INTEGER,
  ts          TIMESTAMPTZ,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_health_log_lookup ON health_log(device_id, ts DESC);