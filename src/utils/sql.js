/** Construit "col = ?, col2 = ?" à partir des champs autorisés présents dans data. */
function buildUpdate(data, allowed) {
  const cols = [];
  const params = [];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      cols.push(`${key} = ?`);
      params.push(data[key]);
    }
  }
  return { set: cols.join(', '), params };
}
module.exports = { buildUpdate };
