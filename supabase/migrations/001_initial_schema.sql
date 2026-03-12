-- Silva initial schema — migration 001
-- Tables: tenants, users, sessions, credits, llm_logs

-- tenants: one row per customer/workspace
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  language    TEXT NOT NULL DEFAULT 'en',
  plan        TEXT NOT NULL DEFAULT 'free',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- users: maps to Clerk user_id
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  clerk_id    TEXT UNIQUE NOT NULL,
  email       TEXT NOT NULL,
  name        TEXT,
  role        TEXT NOT NULL DEFAULT 'member', -- owner | admin | member
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sessions: agent conversation sessions
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  channel     TEXT NOT NULL DEFAULT 'slack',  -- slack | web | discord
  channel_id  TEXT,                           -- Slack channel_id, thread_ts, etc.
  status      TEXT NOT NULL DEFAULT 'active', -- active | ended | error
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at    TIMESTAMPTZ
);

-- credits: metered billing balance per tenant
CREATE TABLE IF NOT EXISTS credits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  balance       BIGINT NOT NULL DEFAULT 0,  -- credits remaining
  lifetime_used BIGINT NOT NULL DEFAULT 0,  -- total credits ever consumed
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- llm_logs: per-request LLM usage and cost tracking
CREATE TABLE IF NOT EXISTS llm_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id    UUID REFERENCES sessions(id) ON DELETE SET NULL,
  model_used    TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'main', -- main | subagent
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd      NUMERIC(10, 6) NOT NULL DEFAULT 0,
  latency_ms    INTEGER,
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS users_tenant_id_idx       ON users (tenant_id);
CREATE INDEX IF NOT EXISTS sessions_tenant_id_idx    ON sessions (tenant_id);
CREATE INDEX IF NOT EXISTS llm_logs_tenant_id_idx    ON llm_logs (tenant_id);
CREATE INDEX IF NOT EXISTS llm_logs_session_id_idx   ON llm_logs (session_id);
CREATE INDEX IF NOT EXISTS llm_logs_created_at_idx   ON llm_logs (created_at);

-- Row Level Security (permissive for now — tighten in F5 SaaS layer)
ALTER TABLE tenants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_logs  ENABLE ROW LEVEL SECURITY;

-- Service role full access (server-side operations bypass RLS)
CREATE POLICY "service_role_all" ON tenants  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON users    TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON sessions TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON credits  TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON llm_logs TO service_role USING (true) WITH CHECK (true);
