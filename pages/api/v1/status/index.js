import database from "infra/database.js";

async function status(request, response) {
  const updateAt = new Date().toISOString();

  const dbVersionResult = await database.query("SHOW server_version;");
  const dbVersionValue = dbVersionResult.rows[0].server_version;

  const dbMaxConnections = (await database.query("SHOW max_connections;"))
    .rows[0].max_connections;

  const dbName = process.env.POSTGRES_DB;
  const dbActiveConnections = (
    await database.query({
      text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname= $1;",
      values: [dbName],
    })
  ).rows[0].count;

  response.status(200).json({
    update_at: updateAt,
    dependencies: {
      database: {
        version: dbVersionValue,
        max_connections: parseInt(dbMaxConnections),
        active_connections: dbActiveConnections,
      },
    },
  });
}

export default status;
