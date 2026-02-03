export function extractKey(data, path) {
  if (!path) return data;

  return path.split(".").reduce((acc, key) => {
    if (!acc) return null;
    return acc[key];
  }, data);
}
