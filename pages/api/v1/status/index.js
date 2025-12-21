import database from "infra/database.js";

async function status(request, response) {
  const updateAt = new Date().toISOString();

  const dbVersionResult = await database.query("SHOW server_version;");
  const dbVersionValue = dbVersionResult.rows[0].server_version;

  const psqlMaxConnections = (await database.query("SHOW max_connections;"))
    .rows[0].max_connections;

  const psqlActiveConnections = (
    await database.query("SELECT * FROM pg_stat_activity WHERE state='active';")
  ).rowCount;

  response.status(200).json({
    update_at: updateAt,
    dependencies: {
      database: {
        version: dbVersionValue,
      },
    },
    postgres_max_connections: psqlMaxConnections,
    postgres_active_connections: psqlActiveConnections,
  });
}

export default status;
