CREATE CONSTRAINT memory_id IF NOT EXISTS
FOR (m:Memory) REQUIRE m.id IS UNIQUE;

CREATE INDEX memory_user_id IF NOT EXISTS
FOR (m:Memory) ON (m.userId);

CREATE INDEX memory_app_id IF NOT EXISTS
FOR (m:Memory) ON (m.appId);