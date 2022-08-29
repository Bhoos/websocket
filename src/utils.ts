export function partitionObject(
  object: { [key: string]: any },
  predicate: (key: string) => boolean,
): [{ [key: string]: any }, { [key: string]: any }] {
  // partitions the object into 2 object. First whose keys satisfies the predicate
  // and second which doesn't
  let trueObj: { [key: string]: any } = {};
  let falseObj: { [key: string]: any } = {};
  for (const key in object) {
    if (predicate(key) == true) {
      trueObj[key] = object[key];
    } else {
      falseObj[key] = object[key];
    }
  }
  return [trueObj, falseObj];
}
