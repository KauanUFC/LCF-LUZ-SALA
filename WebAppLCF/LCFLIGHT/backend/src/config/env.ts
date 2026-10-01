export const env = {
  PORT: parseInt(process.env.PORT || '3000'),
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/lcf_management',
  MQTT_BROKER_URL: process.env.MQTT_BROKER_URL || 'mqtt://1552c9dab5264d1fbfe0e5a7fad6ed8c.s1.eu.hivemq.cloud',
  JWT_SECRET: process.env.JWT_SECRET || 'lcflight-dev-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_DIR: process.env.FRONTEND_DIR || '../../frontend/dist',
}