import mysql from "mysql2/promise";

export async function readMysql(uri, database, table, query = {}) {
  const fullUri = database ? `${uri}/${database}` : uri;
  const conn = await mysql.createConnection(fullUri);

  let sql = `SELECT * FROM ${table}`;
  const values = [];

  if (Object.keys(query).length) {
    const conditions = Object.keys(query)
      .map(k => {
        values.push(query[k]);
        return `${k} = ?`;
      })
      .join(" AND ");

    sql += ` WHERE ${conditions}`;
  }

  const [rows] = await conn.execute(sql, values);
  await conn.end();

  return rows;
}
