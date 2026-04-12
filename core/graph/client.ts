import neo4j from "neo4j-driver";

const url = process.env.NEO4J_URL;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

if (!url || !user || !password) {
    throw new Error("NEO4J_URL, NEO4J_USER, NEO4J_PASSWORD are required")
};

export const driver = neo4j.driver(url, neo4j.auth.basic(user, password));

export async function initGraph() {
    const session = driver.session();
    try {
      await session.run(`
        CREATE CONSTRAINT memory_id IF NOT EXISTS
        FOR (m:Memory) REQUIRE m.id IS UNIQUE
      `)
      await session.run(`
        CREATE INDEX memory_user_id IF NOT EXISTS
        FOR (m:Memory) ON (m.userId)
      `)
      await session.run(`
        CREATE CONSTRAINT entity_unique IF NOT EXISTS
        FOR (e:Entity) REQUIRE (e.name, e.type, e.userId, e.appId) IS UNIQUE
      `)
      await session.run(`
        CREATE INDEX entity_user_app IF NOT EXISTS
        FOR (e:Entity) ON (e.userId, e.appId)
      `)
      console.log("✅ Neo4j ready")
    } finally {
      await session.close()
    }
  }