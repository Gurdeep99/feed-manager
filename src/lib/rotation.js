export function applyRotation(data, rotation = 1) {
  if (!rotation || rotation <= 1) return data;
  if (data === null || data === undefined) return data;

  // If it's an array, repeat its items N times
  if (Array.isArray(data)) {
    let result = [];
    for (let i = 0; i < rotation; i++) {
      result = result.concat(JSON.parse(JSON.stringify(data)));
    }
    return result;
  }

  // If it's an object, wrap it in an array and repeat N times
  if (typeof data === "object") {
    let result = [];
    for (let i = 0; i < rotation; i++) {
      result.push(JSON.parse(JSON.stringify(data)));
    }
    return result;
  }

  return data;
}
