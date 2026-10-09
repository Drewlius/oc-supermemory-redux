// node_modules/@opencode/plugin/dist/promise/plugin.js
function define(plugin) {
  return plugin;
}
// node_modules/effect/dist/Pipeable.js
var pipeArguments = (self2, args) => {
  switch (args.length) {
    case 0:
      return self2;
    case 1:
      return args[0](self2);
    case 2:
      return args[1](args[0](self2));
    case 3:
      return args[2](args[1](args[0](self2)));
    case 4:
      return args[3](args[2](args[1](args[0](self2))));
    case 5:
      return args[4](args[3](args[2](args[1](args[0](self2)))));
    case 6:
      return args[5](args[4](args[3](args[2](args[1](args[0](self2))))));
    case 7:
      return args[6](args[5](args[4](args[3](args[2](args[1](args[0](self2)))))));
    case 8:
      return args[7](args[6](args[5](args[4](args[3](args[2](args[1](args[0](self2))))))));
    case 9:
      return args[8](args[7](args[6](args[5](args[4](args[3](args[2](args[1](args[0](self2)))))))));
    default: {
      let ret = self2;
      for (let i = 0, len = args.length;i < len; i++) {
        ret = args[i](ret);
      }
      return ret;
    }
  }
};
var Prototype = {
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var Class = /* @__PURE__ */ function() {
  function PipeableBase() {}
  PipeableBase.prototype = Prototype;
  return PipeableBase;
}();

// node_modules/effect/dist/Function.js
var dual = function(arity, body) {
  if (typeof arity === "function") {
    return function() {
      return arity(arguments) ? body.apply(this, arguments) : (self2) => body(self2, ...arguments);
    };
  }
  switch (arity) {
    case 0:
    case 1:
      throw new RangeError(`Invalid arity ${arity}`);
    case 2:
      return function(a, b) {
        if (arguments.length >= 2) {
          return body(a, b);
        }
        return function(self2) {
          return body(self2, a);
        };
      };
    case 3:
      return function(a, b, c) {
        if (arguments.length >= 3) {
          return body(a, b, c);
        }
        return function(self2) {
          return body(self2, a, b);
        };
      };
    default:
      return function() {
        if (arguments.length >= arity) {
          return body.apply(this, arguments);
        }
        const args = arguments;
        return function(self2) {
          return body(self2, ...args);
        };
      };
  }
};
var identity = (a) => a;
var constant = (value) => () => value;
var constUndefined = /* @__PURE__ */ constant(undefined);
var constVoid = constUndefined;
function memoize(f) {
  const cache = new WeakMap;
  return (a) => {
    const cached = cache.get(a);
    if (cached !== undefined)
      return cached;
    const result = f(a);
    cache.set(a, result);
    return result;
  };
}
function memoizeIdempotent(f) {
  const cache = new WeakMap;
  return (a) => {
    const cached = cache.get(a);
    if (cached !== undefined)
      return cached;
    const result = f(a);
    cache.set(a, result);
    cache.set(result, result);
    return result;
  };
}

// node_modules/effect/dist/internal/equal.js
var getAllObjectKeys = (obj) => {
  const keys = new Set(Reflect.ownKeys(obj));
  if (obj.constructor === Object)
    return keys;
  if (obj instanceof Error) {
    keys.delete("stack");
  }
  const proto = Object.getPrototypeOf(obj);
  let current = proto;
  while (current !== null && current !== Object.prototype) {
    const ownKeys = Reflect.ownKeys(current);
    for (let i = 0;i < ownKeys.length; i++) {
      keys.add(ownKeys[i]);
    }
    current = Object.getPrototypeOf(current);
  }
  if (keys.has("constructor") && typeof obj.constructor === "function" && proto === obj.constructor.prototype) {
    keys.delete("constructor");
  }
  return keys;
};
var byReferenceInstances = /* @__PURE__ */ new WeakSet;

// node_modules/effect/dist/Predicate.js
function isString(input) {
  return typeof input === "string";
}
function isNumber(input) {
  return typeof input === "number";
}
function isBoolean(input) {
  return typeof input === "boolean";
}
function isSymbol(input) {
  return typeof input === "symbol";
}
function isPropertyKey(u) {
  return isString(u) || isNumber(u) || isSymbol(u);
}
function isFunction(input) {
  return typeof input === "function";
}
function isNotUndefined(input) {
  return input !== undefined;
}
function isNotNullish(input) {
  return input != null;
}
function isUnknown(_) {
  return true;
}
function isObject(input) {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
function isObjectKeyword(input) {
  return typeof input === "object" && input !== null || isFunction(input);
}
var hasProperty = /* @__PURE__ */ dual(2, (self2, property) => isObjectKeyword(self2) && (property in self2));
function isError(input) {
  return input instanceof Error;
}

// node_modules/effect/dist/Hash.js
var symbol = "~effect/interfaces/Hash";
var hash = (self2) => {
  switch (typeof self2) {
    case "number":
      return number(self2);
    case "bigint":
      return string(self2.toString(10));
    case "boolean":
      return string(String(self2));
    case "symbol":
      return string(String(self2));
    case "string":
      return string(self2);
    case "undefined":
      return string("undefined");
    case "function":
    case "object": {
      if (self2 === null) {
        return string("null");
      } else if (self2 instanceof Date) {
        if (Number.isNaN(self2.getTime())) {
          return string("Invalid Date");
        }
        return string(self2.toISOString());
      } else if (self2 instanceof RegExp) {
        return string(self2.toString());
      } else {
        if (byReferenceInstances.has(self2)) {
          return random(self2);
        }
        if (hashCache.has(self2)) {
          return hashCache.get(self2);
        }
        const h = withVisitedTracking(self2, () => {
          if (isHash(self2)) {
            return self2[symbol]();
          } else if (typeof self2 === "function") {
            return random(self2);
          } else if (self2 instanceof DataView) {
            return array(new Uint8Array(self2.buffer, self2.byteOffset, self2.byteLength));
          } else if (Array.isArray(self2) || ArrayBuffer.isView(self2)) {
            return array(self2);
          } else if (self2 instanceof Map) {
            return hashMap(self2);
          } else if (self2 instanceof Set) {
            return hashSet(self2);
          }
          return structure(self2);
        });
        hashCache.set(self2, h);
        return h;
      }
    }
    default:
      throw new Error(`BUG: unhandled typeof ${typeof self2} - please report an issue at https://github.com/Effect-TS/effect/issues`);
  }
};
var random = (self2) => {
  if (!randomHashCache.has(self2)) {
    randomHashCache.set(self2, number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)));
  }
  return randomHashCache.get(self2);
};
var combine = /* @__PURE__ */ dual(2, (self2, b) => self2 * 53 ^ b);
var optimize = (n) => n & 3221225471 | n >>> 1 & 1073741824;
var isHash = (u) => hasProperty(u, symbol);
var number = (n) => {
  if (n !== n) {
    return string("NaN");
  }
  if (n === Infinity) {
    return string("Infinity");
  }
  if (n === -Infinity) {
    return string("-Infinity");
  }
  let h = n | 0;
  if (h !== n) {
    h ^= n * 4294967295;
  }
  while (n > 4294967295) {
    h ^= n /= 4294967295;
  }
  return optimize(h);
};
var string = (str) => {
  let h = 5381, i = str.length;
  while (i) {
    h = h * 33 ^ str.charCodeAt(--i);
  }
  return optimize(h);
};
var structureKeys = (o, keys) => {
  let h = 12289;
  for (const key of keys) {
    h ^= combine(hash(key), hash(o[key]));
  }
  return optimize(h);
};
var structure = (o) => structureKeys(o, getAllObjectKeys(o));
var iterableWith = (seed, f) => (iter) => {
  let h = seed;
  for (const element of iter) {
    h ^= f(element);
  }
  return optimize(h);
};
var array = /* @__PURE__ */ iterableWith(6151, hash);
var hashMap = /* @__PURE__ */ iterableWith(/* @__PURE__ */ string("Map"), ([k, v]) => combine(hash(k), hash(v)));
var hashSet = /* @__PURE__ */ iterableWith(/* @__PURE__ */ string("Set"), hash);
var randomHashCache = /* @__PURE__ */ new WeakMap;
var hashCache = /* @__PURE__ */ new WeakMap;
var visitedObjects = /* @__PURE__ */ new WeakSet;
function withVisitedTracking(obj, fn) {
  if (visitedObjects.has(obj)) {
    return string("[Circular]");
  }
  visitedObjects.add(obj);
  const result = fn();
  visitedObjects.delete(obj);
  return result;
}

// node_modules/effect/dist/Equal.js
var symbol2 = "~effect/interfaces/Equal";
function equals() {
  if (arguments.length === 1) {
    return (self2) => compareBoth(self2, arguments[0]);
  }
  return compareBoth(arguments[0], arguments[1]);
}
function compareBoth(self2, that) {
  if (self2 === that)
    return true;
  if (self2 == null || that == null)
    return false;
  const selfType = typeof self2;
  if (selfType !== typeof that) {
    return false;
  }
  if (selfType === "number" && self2 !== self2 && that !== that) {
    return true;
  }
  if (selfType !== "object" && selfType !== "function") {
    return false;
  }
  if (byReferenceInstances.has(self2) || byReferenceInstances.has(that)) {
    return false;
  }
  return withCache(self2, that, compareObjects);
}
function withVisitedTracking2(self2, that, fn) {
  const hasLeft = visitedLeft.has(self2);
  const hasRight = visitedRight.has(that);
  if (hasLeft && hasRight) {
    return true;
  }
  if (hasLeft || hasRight) {
    return false;
  }
  visitedLeft.add(self2);
  visitedRight.add(that);
  const result = fn();
  visitedLeft.delete(self2);
  visitedRight.delete(that);
  return result;
}
var visitedLeft = /* @__PURE__ */ new WeakSet;
var visitedRight = /* @__PURE__ */ new WeakSet;
function compareObjects(self2, that) {
  if (hash(self2) !== hash(that)) {
    return false;
  } else if (self2 instanceof Date) {
    if (!(that instanceof Date))
      return false;
    const selfTime = self2.getTime();
    const thatTime = that.getTime();
    return selfTime === thatTime || Number.isNaN(selfTime) && Number.isNaN(thatTime);
  } else if (self2 instanceof RegExp) {
    if (!(that instanceof RegExp))
      return false;
    return self2.toString() === that.toString();
  }
  const selfIsEqual = isEqual(self2);
  const thatIsEqual = isEqual(that);
  if (selfIsEqual !== thatIsEqual)
    return false;
  const bothEquals = selfIsEqual && thatIsEqual;
  if (typeof self2 === "function" && !bothEquals) {
    return false;
  }
  return withVisitedTracking2(self2, that, () => {
    if (bothEquals) {
      return self2[symbol2](that);
    } else if (Array.isArray(self2)) {
      if (!Array.isArray(that) || self2.length !== that.length) {
        return false;
      }
      return compareArrays(self2, that);
    } else if (ArrayBuffer.isView(self2)) {
      const selfIsDataView = self2 instanceof DataView;
      if (!ArrayBuffer.isView(that) || self2.byteLength !== that.byteLength || selfIsDataView !== that instanceof DataView) {
        return false;
      }
      if (selfIsDataView) {
        const thatDataView = that;
        return compareTypedArrays(new Uint8Array(self2.buffer, self2.byteOffset, self2.byteLength), new Uint8Array(thatDataView.buffer, thatDataView.byteOffset, thatDataView.byteLength));
      }
      return compareTypedArrays(self2, that);
    } else if (self2 instanceof Map) {
      if (!(that instanceof Map) || self2.size !== that.size) {
        return false;
      }
      return compareMaps(self2, that);
    } else if (self2 instanceof Set) {
      if (!(that instanceof Set) || self2.size !== that.size) {
        return false;
      }
      return compareSets(self2, that);
    }
    return compareRecords(self2, that);
  });
}
function withCache(self2, that, f) {
  let selfMap = equalityCache.get(self2);
  if (!selfMap) {
    selfMap = new WeakMap;
    equalityCache.set(self2, selfMap);
  } else if (selfMap.has(that)) {
    return selfMap.get(that);
  }
  const result = f(self2, that);
  selfMap.set(that, result);
  let thatMap = equalityCache.get(that);
  if (!thatMap) {
    thatMap = new WeakMap;
    equalityCache.set(that, thatMap);
  }
  thatMap.set(self2, result);
  return result;
}
var equalityCache = /* @__PURE__ */ new WeakMap;
function compareArrays(self2, that) {
  for (let i = 0;i < self2.length; i++) {
    if (!compareBoth(self2[i], that[i])) {
      return false;
    }
  }
  return true;
}
function compareTypedArrays(self2, that) {
  if (self2.length !== that.length) {
    return false;
  }
  for (let i = 0;i < self2.length; i++) {
    if (self2[i] !== that[i]) {
      return false;
    }
  }
  return true;
}
function compareRecords(self2, that) {
  const selfKeys = getAllObjectKeys(self2);
  const thatKeys = getAllObjectKeys(that);
  if (selfKeys.size !== thatKeys.size) {
    return false;
  }
  for (const key of selfKeys) {
    if (!thatKeys.has(key) || !compareBoth(self2[key], that[key])) {
      return false;
    }
  }
  return true;
}
function makeCompareMap(keyEquivalence, valueEquivalence) {
  return function compareMaps(self2, that) {
    const thatEntries = Array.from(that);
    for (const [selfKey, selfValue] of self2) {
      let found = false;
      for (let i = 0;i < thatEntries.length; i++) {
        const [thatKey, thatValue] = thatEntries[i];
        if (keyEquivalence(selfKey, thatKey) && valueEquivalence(selfValue, thatValue)) {
          thatEntries[i] = thatEntries[thatEntries.length - 1];
          thatEntries.pop();
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  };
}
var compareMaps = /* @__PURE__ */ makeCompareMap(compareBoth, compareBoth);
function makeCompareSet(equivalence) {
  return function compareSets(self2, that) {
    const thatValues = Array.from(that);
    for (const selfValue of self2) {
      let found = false;
      for (let i = 0;i < thatValues.length; i++) {
        const thatValue = thatValues[i];
        if (equivalence(selfValue, thatValue)) {
          thatValues[i] = thatValues[thatValues.length - 1];
          thatValues.pop();
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  };
}
var compareSets = /* @__PURE__ */ makeCompareSet(compareBoth);
var isEqual = (u) => hasProperty(u, symbol2);

// node_modules/effect/dist/Redactable.js
var symbolRedactable = /* @__PURE__ */ Symbol.for("~effect/Redactable");
var isRedactable = (u) => hasProperty(u, symbolRedactable);
function redact(u) {
  if (isRedactable(u))
    return getRedacted(u);
  return u;
}
function getRedacted(redactable) {
  return redactable[symbolRedactable](globalThis[currentFiberTypeId]?.context ?? emptyContext);
}
var currentFiberTypeId = "~effect/Fiber/currentFiber";
var emptyMap = /* @__PURE__ */ new Map;
var emptyContext = {
  "~effect/Context": {},
  base: emptyMap,
  depth: 0,
  mapUnsafe: emptyMap,
  pipe() {
    return pipeArguments(this, arguments);
  }
};

// node_modules/effect/dist/Formatter.js
function format(input, options) {
  const space = options?.space ?? 0;
  const ancestors = new WeakSet;
  const gap = !space ? "" : typeof space === "number" ? " ".repeat(space) : space;
  const ind = (d) => gap.repeat(d);
  const wrap = (v, body) => {
    const ctor = v?.constructor;
    return ctor && ctor !== Object.prototype.constructor && ctor.name ? `${ctor.name}(${body})` : body;
  };
  const ownKeys = (o) => {
    try {
      return Reflect.ownKeys(o);
    } catch {
      return ["[ownKeys threw]"];
    }
  };
  function recur(v, d = 0) {
    if (typeof v === "string")
      return JSON.stringify(v);
    if (typeof v === "number" || v == null || typeof v === "boolean" || typeof v === "symbol")
      return String(v);
    if (typeof v === "bigint")
      return String(v) + "n";
    if (typeof v === "object" || typeof v === "function") {
      if (ancestors.has(v))
        return CIRCULAR;
      ancestors.add(v);
      let output;
      if (symbolRedactable in v) {
        output = recur(getRedacted(v), d);
      } else if (Array.isArray(v)) {
        output = !gap || v.length <= 1 ? `[${v.map((x) => recur(x, d)).join(",")}]` : `[
${ind(d + 1)}${v.map((x) => recur(x, d + 1)).join(`,
` + ind(d + 1))}
${ind(d)}]`;
      } else if (v instanceof Date) {
        output = formatDate(v);
      } else if (!options?.ignoreToString && hasProperty(v, "toString") && typeof v["toString"] === "function" && v["toString"] !== Object.prototype.toString && v["toString"] !== Array.prototype.toString) {
        const s = safeToString(v);
        output = v instanceof Error && v.cause ? `${s} (cause: ${recur(v.cause, d)})` : s;
      } else if (Symbol.iterator in v) {
        output = `${v.constructor.name}(${recur(Array.from(v), d)})`;
      } else {
        const keys = ownKeys(v);
        if (!gap || keys.length <= 1) {
          const body = `{${keys.map((k) => `${formatPropertyKey(k)}:${recur(v[k], d)}`).join(",")}}`;
          output = wrap(v, body);
        } else {
          const body = `{
${keys.map((k) => `${ind(d + 1)}${formatPropertyKey(k)}: ${recur(v[k], d + 1)}`).join(`,
`)}
${ind(d)}}`;
          output = wrap(v, body);
        }
      }
      ancestors.delete(v);
      return output;
    }
    return String(v);
  }
  return recur(input, 0);
}
var CIRCULAR = "[Circular]";
function formatPropertyKey(name) {
  return typeof name === "string" ? JSON.stringify(name) : String(name);
}
function formatDate(date) {
  try {
    return date.toISOString();
  } catch {
    return "Invalid Date";
  }
}
function safeToString(input) {
  try {
    const s = input.toString();
    return typeof s === "string" ? s : String(s);
  } catch {
    return "[toString threw]";
  }
}
function formatJson(input, options) {
  const ancestors = [];
  return JSON.stringify(input, function(key, value) {
    const original = Object.getOwnPropertyDescriptor(this, key)?.value;
    const redacted = hasProperty(original, symbolRedactable) ? redact(original) : redact(value);
    if (typeof redacted === "bigint") {
      return format(redacted);
    }
    if (typeof redacted !== "object" || redacted === null) {
      return redacted;
    }
    while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
      ancestors.pop();
    }
    if (ancestors.includes(redacted)) {
      return;
    }
    ancestors.push(redacted);
    return redacted;
  }, options?.space) ?? "null";
}

// node_modules/effect/dist/Inspectable.js
var NodeInspectSymbol = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
var toJson = (input) => {
  try {
    input = redact(input);
    if (hasProperty(input, "toJSON") && isFunction(input["toJSON"]) && input["toJSON"].length === 0) {
      return input.toJSON();
    } else if (Array.isArray(input)) {
      return input.map(toJson);
    }
    return input;
  } catch {
    return "[toJSON threw]";
  }
};
var BaseProto = {
  toJSON() {
    return toJson(this);
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  toString() {
    return format(this.toJSON());
  }
};

// node_modules/effect/dist/Utils.js
class SingleShotGen {
  called = false;
  self;
  constructor(self2) {
    this.self = self2;
  }
  next(a) {
    return this.called ? {
      value: a,
      done: true
    } : (this.called = true, {
      value: this.self,
      done: false
    });
  }
  [Symbol.iterator]() {
    return new SingleShotGen(this.self);
  }
}
var pickInternalCall = () => {
  const InternalTypeId = "~effect/Utils/internal";
  const standard = {
    [InternalTypeId]: (body) => {
      return body();
    }
  };
  const forced = {
    [InternalTypeId]: (body) => {
      try {
        return body();
      } finally {}
    }
  };
  const isNotOptimizedAway = standard[InternalTypeId](() => new Error().stack)?.includes(InternalTypeId) === true;
  return isNotOptimizedAway ? standard[InternalTypeId] : forced[InternalTypeId];
};
var internalCall = /* @__PURE__ */ pickInternalCall();

// node_modules/effect/dist/internal/record.js
function assignProperty(self2, key, value) {
  if (key === "__proto__") {
    Object.defineProperty(self2, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true
    });
  } else {
    self2[key] = value;
  }
}
function assignProperties(self2, source) {
  for (const key of Reflect.ownKeys(source)) {
    if (Object.prototype.propertyIsEnumerable.call(source, key)) {
      assignProperty(self2, key, source[key]);
    }
  }
}

// node_modules/effect/dist/internal/core.js
var EffectTypeId = `~effect/Effect`;
var ExitTypeId = `~effect/Exit`;
var effectVariance = {
  _A: identity,
  _E: identity,
  _R: identity
};
var identifier = `${EffectTypeId}/identifier`;
var args = `${EffectTypeId}/args`;
var evaluate = `${EffectTypeId}/evaluate`;
var contA = `${EffectTypeId}/successCont`;
var contE = `${EffectTypeId}/failureCont`;
var contAll = `${EffectTypeId}/ensureCont`;
var Yield = /* @__PURE__ */ Symbol.for("effect/Effect/Yield");
var PipeInspectableProto = {
  pipe() {
    return pipeArguments(this, arguments);
  },
  toJSON() {
    return {
      ...this
    };
  },
  toString() {
    return format(this.toJSON(), {
      ignoreToString: true,
      space: 2
    });
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
};
var StructuralProto = {
  [symbol]() {
    return structureKeys(this, Object.keys(this));
  },
  [symbol2](that) {
    const selfKeys = Object.keys(this);
    const thatKeys = Object.keys(that);
    if (selfKeys.length !== thatKeys.length)
      return false;
    for (let i = 0;i < selfKeys.length; i++) {
      if (selfKeys[i] !== thatKeys[i] || !equals(this[selfKeys[i]], that[selfKeys[i]])) {
        return false;
      }
    }
    return true;
  }
};
var EffectProto = {
  [EffectTypeId]: effectVariance,
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  },
  toJSON() {
    return {
      _id: "Effect",
      op: this[identifier],
      ...args in this ? {
        args: this[args]
      } : undefined
    };
  }
};
var isExit = (u) => hasProperty(u, ExitTypeId);
var CauseTypeId = "~effect/Cause";
var CauseReasonTypeId = "~effect/Cause/Reason";
var isCause = (self2) => hasProperty(self2, CauseTypeId);
class CauseImpl {
  [CauseTypeId];
  reasons;
  constructor(failures) {
    this[CauseTypeId] = CauseTypeId;
    this.reasons = failures;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toJSON() {
    return {
      _id: "Cause",
      failures: this.reasons.map((f) => f.toJSON())
    };
  }
  toString() {
    return `Cause(${format(this.reasons)})`;
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  [symbol2](that) {
    return isCause(that) && this.reasons.length === that.reasons.length && this.reasons.every((e, i) => equals(e, that.reasons[i]));
  }
  [symbol]() {
    return array(this.reasons);
  }
}
var annotationsMap = /* @__PURE__ */ new WeakMap;

class ReasonBase {
  [CauseReasonTypeId];
  annotations;
  _tag;
  constructor(_tag, annotations, originalError) {
    this[CauseReasonTypeId] = CauseReasonTypeId;
    this._tag = _tag;
    if (annotations !== constEmptyAnnotations && typeof originalError === "object" && originalError !== null && annotations.size > 0) {
      const prevAnnotations = annotationsMap.get(originalError);
      if (prevAnnotations) {
        annotations = new Map([...prevAnnotations, ...annotations]);
      }
      annotationsMap.set(originalError, annotations);
    }
    this.annotations = annotations;
  }
  annotate(annotations, options) {
    if (annotations.mapUnsafe.size === 0)
      return this;
    const newAnnotations = new Map(this.annotations);
    annotations.mapUnsafe.forEach((value, key) => {
      if (options?.overwrite !== true && newAnnotations.has(key))
        return;
      newAnnotations.set(key, value);
    });
    const self2 = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    self2.annotations = newAnnotations;
    return self2;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toString() {
    return format(this);
  }
  [NodeInspectSymbol]() {
    return this.toString();
  }
}
var constEmptyAnnotations = /* @__PURE__ */ new Map;

class Fail extends ReasonBase {
  error;
  constructor(error, annotations = constEmptyAnnotations) {
    super("Fail", annotations, error);
    this.error = error;
  }
  toString() {
    return `Fail(${format(this.error)})`;
  }
  toJSON() {
    return {
      _tag: "Fail",
      error: this.error
    };
  }
  [symbol2](that) {
    return isFailReason(that) && equals(this.error, that.error) && equals(this.annotations, that.annotations);
  }
  [symbol]() {
    return combine(string(this._tag))(combine(hash(this.error))(hash(this.annotations)));
  }
}
var causeFromReasons = (reasons) => new CauseImpl(reasons);
var causeFail = (error) => new CauseImpl([new Fail(error)]);

class Die extends ReasonBase {
  defect;
  constructor(defect, annotations = constEmptyAnnotations) {
    super("Die", annotations, defect);
    this.defect = defect;
  }
  toString() {
    return `Die(${format(this.defect)})`;
  }
  toJSON() {
    return {
      _tag: "Die",
      defect: this.defect
    };
  }
  [symbol2](that) {
    return isDieReason(that) && equals(this.defect, that.defect) && equals(this.annotations, that.annotations);
  }
  [symbol]() {
    return combine(string(this._tag))(combine(hash(this.defect))(hash(this.annotations)));
  }
}
var causeDie = (defect) => new CauseImpl([new Die(defect)]);
var causeAnnotate = /* @__PURE__ */ dual((args) => isCause(args[0]), (self2, annotations, options) => {
  if (annotations.mapUnsafe.size === 0)
    return self2;
  return new CauseImpl(self2.reasons.map((f) => f.annotate(annotations, options)));
});
var isFailReason = (self2) => self2._tag === "Fail";
var isDieReason = (self2) => self2._tag === "Die";
var isInterruptReason = (self2) => self2._tag === "Interrupt";
function defaultEvaluate(_fiber) {
  return exitDie(`Effect.evaluate: Not implemented`);
}
var makePrimitiveProto = (options) => ({
  ...EffectProto,
  [identifier]: options.op,
  [evaluate]: options[evaluate] ?? defaultEvaluate,
  [contA]: options[contA],
  [contE]: options[contE],
  [contAll]: options[contAll]
});
var makePrimitive = (options) => {
  const Proto = makePrimitiveProto(options);
  return function() {
    const self2 = Object.create(Proto);
    self2[args] = options.single === false ? arguments : arguments[0];
    return self2;
  };
};
var makeExit = (options) => {
  const Proto = {
    [ExitTypeId]: ExitTypeId,
    _tag: options.op,
    get [options.prop]() {
      return this[args];
    },
    ...makePrimitiveProto(options),
    toString() {
      return `${options.op}(${format(this[args])})`;
    },
    toJSON() {
      return {
        _id: "Exit",
        _tag: options.op,
        [options.prop]: this[args]
      };
    },
    [symbol2](that) {
      return isExit(that) && that._tag === this._tag && equals(this[args], that[args]);
    },
    [symbol]() {
      return combine(string(options.op), hash(this[args]));
    }
  };
  return function(value) {
    const self2 = Object.create(Proto);
    self2[args] = value;
    return self2;
  };
};
var exitSucceed = /* @__PURE__ */ makeExit({
  op: "Success",
  prop: "value",
  [evaluate](fiber) {
    const cont = fiber.getCont(contA);
    return cont ? cont[contA](this[args], fiber, this) : fiber.yieldWith(this);
  }
});
var StackTraceKey = {
  key: "effect/Cause/StackTrace"
};
var InterruptorStackTrace = {
  key: "effect/Cause/InterruptorStackTrace"
};
var exitFailCause = /* @__PURE__ */ makeExit({
  op: "Failure",
  prop: "cause",
  [evaluate](fiber) {
    let cause = this[args];
    let annotated = false;
    if (fiber.currentStackFrame) {
      cause = causeAnnotate(cause, {
        mapUnsafe: new Map([[StackTraceKey.key, fiber.currentStackFrame]])
      });
      annotated = true;
    }
    let cont = fiber.getCont(contE);
    while (fiber.interruptible && fiber._interruptedCause && cont) {
      cont = fiber.getCont(contE);
    }
    return cont ? cont[contE](cause, fiber, annotated ? undefined : this) : fiber.yieldWith(annotated ? exitFailCause(cause) : this);
  }
});
var exitFail = (e) => exitFailCause(causeFail(e));
var exitDie = (defect) => exitFailCause(causeDie(defect));
var withFiber = /* @__PURE__ */ makePrimitive({
  op: "WithFiber",
  [evaluate](fiber) {
    return this[args](fiber);
  }
});
var YieldableError = /* @__PURE__ */ function() {

  class YieldableError extends globalThis.Error {
  }
  const proto = /* @__PURE__ */ makePrimitiveProto({
    op: "YieldableError",
    [evaluate]() {
      return exitFail(this);
    }
  });
  delete proto.toString;
  Object.assign(YieldableError.prototype, proto);
  return YieldableError;
}();
var Error2 = /* @__PURE__ */ function() {
  const plainArgsSymbol = /* @__PURE__ */ Symbol.for("effect/Data/Error/plainArgs");
  return class Base extends YieldableError {
    constructor(args) {
      super(args?.message, args?.cause ? {
        cause: args.cause
      } : undefined);
      if (args) {
        assignProperties(this, args);
        Object.defineProperty(this, plainArgsSymbol, {
          value: args,
          enumerable: false
        });
      }
    }
    toJSON() {
      return {
        ...this[plainArgsSymbol],
        ...this
      };
    }
  };
}();
var TaggedError = (tag) => {

  class Base extends Error2 {
    _tag = tag;
  }
  Base.prototype.name = tag;
  return Base;
};
var DoneTypeId = "~effect/Cause/Done";
var DoneVoid = {
  [DoneTypeId]: DoneTypeId,
  _tag: "Done",
  value: undefined
};

// node_modules/effect/dist/Effectable.js
var Prototype2 = (options) => makePrimitiveProto({
  op: options.label,
  [evaluate]: options.evaluate
});

// node_modules/effect/dist/Equivalence.js
var make = (isEquivalent) => (self2, that) => self2 === that || isEquivalent(self2, that);
var isStrictEquivalent = (x, y) => x === y;
var strictEqual = () => isStrictEquivalent;

// node_modules/effect/dist/internal/option.js
var TypeId = "~effect/data/Option";
var CommonProto = {
  [TypeId]: {
    _A: (_) => _
  },
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  }
};
var SomeProto = /* @__PURE__ */ Object.defineProperty(/* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto), {
  _tag: "Some",
  _op: "Some",
  [symbol2](that) {
    return isOption(that) && isSome(that) && equals(this.value, that.value);
  },
  [symbol]() {
    return combine(hash(this._tag))(hash(this.value));
  },
  toString() {
    return `some(${format(this.value)})`;
  },
  toJSON() {
    return {
      _id: "Option",
      _tag: this._tag,
      value: toJson(this.value)
    };
  }
}), "valueOrUndefined", {
  get() {
    return this.value;
  }
});
var NoneHash = /* @__PURE__ */ hash("None");
var NoneProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto), {
  _tag: "None",
  _op: "None",
  valueOrUndefined: undefined,
  [symbol2](that) {
    return isOption(that) && isNone(that);
  },
  [symbol]() {
    return NoneHash;
  },
  toString() {
    return `none()`;
  },
  toJSON() {
    return {
      _id: "Option",
      _tag: this._tag
    };
  }
});
var isOption = (input) => hasProperty(input, TypeId);
var isNone = (fa) => fa._tag === "None";
var isSome = (fa) => fa._tag === "Some";
var none = /* @__PURE__ */ Object.create(NoneProto);
var some = (value) => {
  const a = Object.create(SomeProto);
  a.value = value;
  return a;
};

// node_modules/effect/dist/internal/result.js
var TypeId2 = "~effect/data/Result";
var CommonProto2 = {
  [TypeId2]: {
    _A: (_) => _,
    _E: (_) => _
  },
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  }
};
var SuccessProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto2), {
  _tag: "Success",
  _op: "Success",
  [symbol2](that) {
    return isResult(that) && isSuccess(that) && equals(this.success, that.success);
  },
  [symbol]() {
    return combine(hash(this._tag))(hash(this.success));
  },
  toString() {
    return `success(${format(this.success)})`;
  },
  toJSON() {
    return {
      _id: "Result",
      _tag: this._tag,
      value: toJson(this.success)
    };
  }
});
var FailureProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto2), {
  _tag: "Failure",
  _op: "Failure",
  [symbol2](that) {
    return isResult(that) && isFailure(that) && equals(this.failure, that.failure);
  },
  [symbol]() {
    return combine(hash(this._tag))(hash(this.failure));
  },
  toString() {
    return `failure(${format(this.failure)})`;
  },
  toJSON() {
    return {
      _id: "Result",
      _tag: this._tag,
      failure: toJson(this.failure)
    };
  }
});
var isResult = (input) => hasProperty(input, TypeId2);
var isFailure = (result) => result._tag === "Failure";
var isSuccess = (result) => result._tag === "Success";
var fail = (failure) => {
  const a = Object.create(FailureProto);
  a.failure = failure;
  return a;
};
var succeed = (success) => {
  const a = Object.create(SuccessProto);
  a.success = success;
  return a;
};

// node_modules/effect/dist/Order.js
function make2(compare) {
  return (self2, that) => self2 === that ? 0 : compare(self2, that);
}
var Number2 = /* @__PURE__ */ make2((self2, that) => {
  if (globalThis.Number.isNaN(self2) && globalThis.Number.isNaN(that))
    return 0;
  if (globalThis.Number.isNaN(self2))
    return -1;
  if (globalThis.Number.isNaN(that))
    return 1;
  return self2 < that ? -1 : 1;
});
var isLessThan = (O) => dual(2, (self2, that) => O(self2, that) === -1);
var isGreaterThan = (O) => dual(2, (self2, that) => O(self2, that) === 1);
var isLessThanOrEqualTo = (O) => dual(2, (self2, that) => O(self2, that) !== 1);
var isGreaterThanOrEqualTo = (O) => dual(2, (self2, that) => O(self2, that) !== -1);

// node_modules/effect/dist/Option.js
var none2 = () => none;
var some2 = some;
var isNone2 = isNone;
var isSome2 = isSome;
var match = /* @__PURE__ */ dual(2, (self2, {
  onNone,
  onSome
}) => isNone2(self2) ? onNone() : onSome(self2.value));
var liftThrowable = (f) => (...a) => {
  try {
    return some2(f(...a));
  } catch {
    return none2();
  }
};
var map = /* @__PURE__ */ dual(2, (self2, f) => isNone2(self2) ? none2() : some2(f(self2.value)));
var filter = /* @__PURE__ */ dual(2, (self2, predicate) => isNone2(self2) ? none2() : predicate(self2.value) ? some2(self2.value) : none2());

// node_modules/effect/dist/Context.js
var ServiceTypeId = "~effect/Context/Service";
var Service = function() {
  function KeyClass() {}
  const self2 = KeyClass;
  Object.setPrototypeOf(self2, ServiceProto);
  const init = (key, options) => {
    self2.key = key;
    if (options?.defaultValue) {
      self2[ReferenceTypeId] = ReferenceTypeId;
      self2.defaultValue = options.defaultValue;
    }
    if (options?.make) {
      self2.make = options.make;
    }
    if (options?.fiberCached) {
      cacheKeys.add(key);
    }
    return self2;
  };
  return arguments.length > 0 ? init(arguments[0], arguments[1]) : init;
};
var ServiceProto = {
  [ServiceTypeId]: ServiceTypeId,
  .../* @__PURE__ */ Prototype2({
    label: "Service",
    evaluate(fiber) {
      return exitSucceed(get(fiber.context, this));
    }
  }),
  toJSON() {
    return {
      _id: "Service",
      key: this.key
    };
  },
  of(self2) {
    return self2;
  },
  context(self2) {
    return make3(this, self2);
  },
  use(f) {
    return withFiber((fiber) => f(get(fiber.context, this)));
  },
  useSync(f) {
    return withFiber((fiber) => exitSucceed(f(get(fiber.context, this))));
  }
};
var cacheKeys = /* @__PURE__ */ new Set;
var ReferenceTypeId = "~effect/Context/Reference";
var TypeId3 = "~effect/Context";
var MaxDepth = 8;
var FlattenAfterBaseHits = 8;
var makeImpl = (cacheRoot, base, overlay, depth) => {
  const self2 = Object.create(Proto);
  self2.cacheRoot = cacheRoot ?? self2;
  self2.base = base;
  self2.overlay = overlay;
  self2.depth = depth;
  self2._flat = undefined;
  self2.baseHits = 0;
  return self2;
};
var applyOverlays = (map, overlay) => {
  if (!overlay)
    return;
  applyOverlays(map, overlay.parent);
  map.set(overlay.key, overlay.value);
};
var flatten = (self2) => {
  if (self2._flat)
    return self2._flat;
  if (!self2.overlay)
    return self2._flat = self2.base;
  const map = new Map(self2.base);
  applyOverlays(map, self2.overlay);
  return self2._flat = map;
};
var notFound = /* @__PURE__ */ Symbol();
var lookup = (self2, key) => {
  const impl = self2;
  for (let overlay = impl.overlay;overlay; overlay = overlay.parent) {
    if (overlay.key === key)
      return overlay.value;
  }
  const value = impl.base.get(key);
  if (value === undefined && !impl.base.has(key))
    return notFound;
  if (impl.overlay && ++impl.baseHits >= FlattenAfterBaseHits) {
    impl.base = flatten(impl);
    impl.overlay = undefined;
    impl.depth = 0;
  }
  return value;
};
var makeUnsafe = (mapUnsafe) => makeImpl(undefined, mapUnsafe, undefined, 0);
var Proto = {
  get mapUnsafe() {
    return flatten(this);
  },
  ...PipeInspectableProto,
  [TypeId3]: {
    _Services: (_) => _
  },
  toJSON() {
    return {
      _id: "Context",
      services: Array.from(this.mapUnsafe).map(([key, value]) => ({
        key,
        value
      }))
    };
  },
  [symbol2](that) {
    if (!isContext(that))
      return false;
    const self2 = this.mapUnsafe;
    const other = that.mapUnsafe;
    if (self2.size !== other.size)
      return false;
    for (const [key, value] of self2) {
      if (!other.has(key) || !equals(value, other.get(key)))
        return false;
    }
    return true;
  },
  [symbol]() {
    return number(this.mapUnsafe.size);
  }
};
var hasSameCache = (self2, that) => self2.cacheRoot === that.cacheRoot;
var isContext = (u) => hasProperty(u, TypeId3);
var isReference = (u) => !!u[ReferenceTypeId];
var empty = () => emptyContext2;
var emptyContext2 = /* @__PURE__ */ makeUnsafe(/* @__PURE__ */ new Map);
var make3 = (key, service) => makeUnsafe(new Map([[key.key, service]]));
var add = /* @__PURE__ */ dual(3, (self2, key, service) => addUnsafe(self2, key.key, service));
var addUnsafe = (self2, key, service) => {
  const impl = self2;
  const cacheRoot = cacheKeys.has(key) ? undefined : impl.cacheRoot;
  if (impl.depth >= MaxDepth) {
    const map = new Map(impl.mapUnsafe);
    map.set(key, service);
    return makeImpl(cacheRoot, map, undefined, 0);
  }
  return makeImpl(cacheRoot, impl.base, {
    key,
    value: service,
    parent: impl.overlay
  }, impl.depth + 1);
};
var getOrUndefinedUnsafe = (self2, key) => {
  const value = lookup(self2, key);
  return value === notFound ? undefined : value;
};
var getUnsafe = /* @__PURE__ */ dual(2, (self2, service) => {
  const value = lookup(self2, service.key);
  if (value === notFound) {
    if (isReference(service))
      return getDefaultValue(service);
    throw serviceNotFoundError(service);
  }
  return value;
});
var get = getUnsafe;
var defaultValueCacheKey = "~effect/Context/defaultValue";
var getDefaultValue = (ref) => {
  if (defaultValueCacheKey in ref) {
    return ref[defaultValueCacheKey];
  }
  return ref[defaultValueCacheKey] = ref.defaultValue();
};
var serviceNotFoundError = (service) => {
  const error = new Error(`Service not found${service.key ? `: ${String(service.key)}` : ""}`);
  if (error.stack) {
    const lines = error.stack.split(`
`);
    lines.splice(1, 3);
    error.stack = lines.join(`
`);
  }
  return error;
};
var Reference = Service;

// node_modules/effect/dist/internal/array.js
var isArrayNonEmpty = (self2) => self2.length > 0;

// node_modules/effect/dist/Result.js
var succeed2 = succeed;
var fail2 = fail;
var isFailure2 = isFailure;
var match2 = /* @__PURE__ */ dual(2, (self2, {
  onFailure,
  onSuccess
}) => isFailure2(self2) ? onFailure(self2.failure) : onSuccess(self2.success));

// node_modules/effect/dist/Array.js
var Array2 = globalThis.Array;
var fromIterable = (collection) => Array2.isArray(collection) ? collection : Array2.from(collection);
var append = /* @__PURE__ */ dual(2, (self2, last) => [...self2, last]);
var appendAll = /* @__PURE__ */ dual(2, (self2, that) => fromIterable(self2).concat(fromIterable(that)));
var isArray = Array2.isArray;
var isArrayNonEmpty2 = isArrayNonEmpty;
var isReadonlyArrayNonEmpty = isArrayNonEmpty;
var hashBucketsAdd = (buckets, value) => {
  const hash2 = hash(value);
  const bucket = buckets.get(hash2);
  if (bucket === undefined) {
    buckets.set(hash2, [value]);
    return true;
  }
  for (const previous of bucket) {
    if (equals(previous, value)) {
      return false;
    }
  }
  bucket.push(value);
  return true;
};
var union = /* @__PURE__ */ dual(2, (self2, that) => {
  const a = fromIterable(self2);
  const b = fromIterable(that);
  if (isReadonlyArrayNonEmpty(a)) {
    return isReadonlyArrayNonEmpty(b) ? dedupe(appendAll(a, b)) : a;
  }
  return b;
});
var empty2 = () => [];
var map2 = /* @__PURE__ */ dual(2, (self2, f) => self2.map(f));
var dedupe = (self2) => {
  const input = fromIterable(self2);
  if (input.length < 2) {
    return [...input];
  }
  const buckets = new Map;
  const out = [];
  for (const value of input) {
    if (hashBucketsAdd(buckets, value)) {
      out.push(value);
    }
  }
  return out;
};

// node_modules/effect/dist/Scheduler.js
var Scheduler = /* @__PURE__ */ Reference("effect/Scheduler", {
  fiberCached: true,
  defaultValue: () => new MixedScheduler
});
var setImmediate = "setImmediate" in globalThis ? (f) => {
  const timer = globalThis.setImmediate(f);
  return () => globalThis.clearImmediate(timer);
} : (f) => {
  const timer = setTimeout(f, 0);
  return () => clearTimeout(timer);
};
var setMicrotask = (f) => {
  let cancelled = false;
  Promise.resolve().then(() => {
    if (!cancelled)
      f();
  });
  return () => {
    cancelled = true;
  };
};

class PriorityBuckets {
  buckets = [];
  scheduleTask(task, priority) {
    const buckets = this.buckets;
    const len = buckets.length;
    let bucket;
    let index = 0;
    for (;index < len; index++) {
      if (buckets[index][0] > priority)
        break;
      bucket = buckets[index];
    }
    if (bucket && bucket[0] === priority) {
      bucket[1].push(task);
    } else if (index === len) {
      buckets.push([priority, [task]]);
    } else {
      buckets.splice(index, 0, [priority, [task]]);
    }
  }
  drain() {
    const buckets = this.buckets;
    this.buckets = [];
    return buckets;
  }
}

class MixedScheduler {
  executionMode;
  setImmediate;
  constructor(executionMode = "async", setImmediateFn) {
    this.executionMode = executionMode;
    this.setImmediate = setImmediateFn ?? (executionMode === "sync" ? setMicrotask : setImmediate);
  }
  shouldYield(fiber) {
    return fiber.currentOpCount >= fiber.maxOpsBeforeYield;
  }
  makeDispatcher() {
    return new MixedSchedulerDispatcher(this.setImmediate);
  }
}

class MixedSchedulerDispatcher {
  tasks = /* @__PURE__ */ new PriorityBuckets;
  running = undefined;
  setImmediate;
  constructor(setImmediateFn = setImmediate) {
    this.setImmediate = setImmediateFn;
  }
  scheduleTask(task, priority) {
    this.tasks.scheduleTask(task, priority);
    if (this.running === undefined) {
      this.running = this.setImmediate(this.afterScheduled);
    }
  }
  afterScheduled = () => {
    this.running = undefined;
    this.runTasks();
  };
  runTasks() {
    const buckets = this.tasks.drain();
    for (let i = 0;i < buckets.length; i++) {
      const toRun = buckets[i][1];
      for (let j = 0;j < toRun.length; j++) {
        toRun[j]();
      }
    }
  }
  flush() {
    while (this.tasks.buckets.length > 0) {
      if (this.running !== undefined) {
        this.running();
        this.running = undefined;
      }
      this.runTasks();
    }
  }
}
var MaxOpsBeforeYield = /* @__PURE__ */ Reference("effect/Scheduler/MaxOpsBeforeYield", {
  fiberCached: true,
  defaultValue: () => 2048
});
var PreventSchedulerYield = /* @__PURE__ */ Reference("effect/Scheduler/PreventSchedulerYield", {
  fiberCached: true,
  defaultValue: () => false
});

// node_modules/effect/dist/Data.js
var Class2 = class extends Class {
  constructor(props) {
    super();
    if (props) {
      assignProperties(this, props);
    }
  }
};
var TaggedError2 = TaggedError;

// node_modules/effect/dist/Encoding.js
var EncodingErrorTypeId = "~effect/encoding/EncodingError";

class EncodingError extends (/* @__PURE__ */ TaggedError2("EncodingError")) {
  [EncodingErrorTypeId] = EncodingErrorTypeId;
}
var encodeBase64 = (input) => typeof input === "string" ? base64EncodeUint8Array(encoder.encode(input)) : base64EncodeUint8Array(input);
var decodeBase64 = (str) => {
  const stripped = stripCrlf(str);
  const length = stripped.length;
  if (length % 4 !== 0) {
    return fail2(new EncodingError({
      kind: "Decode",
      module: "Base64",
      input: stripped,
      message: `Length must be a multiple of 4, but is ${length}`
    }));
  }
  const index = stripped.indexOf("=");
  if (index !== -1 && (index < length - 2 || index === length - 2 && stripped[length - 1] !== "=")) {
    return fail2(new EncodingError({
      kind: "Decode",
      module: "Base64",
      input: stripped,
      message: `Found a '=' character, but it is not at the end`
    }));
  }
  try {
    const missingOctets = stripped.endsWith("==") ? 2 : stripped.endsWith("=") ? 1 : 0;
    const result = new Uint8Array(3 * (length / 4) - missingOctets);
    for (let i = 0, j = 0;i < length; i += 4, j += 3) {
      const buffer = getBase64Code(stripped.charCodeAt(i)) << 18 | getBase64Code(stripped.charCodeAt(i + 1)) << 12 | getBase64Code(stripped.charCodeAt(i + 2)) << 6 | getBase64Code(stripped.charCodeAt(i + 3));
      result[j] = buffer >> 16;
      result[j + 1] = buffer >> 8 & 255;
      result[j + 2] = buffer & 255;
    }
    return succeed2(result);
  } catch (e) {
    return fail2(new EncodingError({
      kind: "Decode",
      module: "Base64",
      input: stripped,
      message: e instanceof Error ? e.message : "Invalid input"
    }));
  }
};
var encoder = /* @__PURE__ */ new TextEncoder;
var stripCrlf = (str) => str.replace(/[\n\r]/g, "");
var base64EncodeUint8Array = (bytes) => {
  const length = bytes.length;
  let result = "";
  let i;
  for (i = 2;i < length; i += 3) {
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
    result += base64abc[(bytes[i - 1] & 15) << 2 | bytes[i] >> 6];
    result += base64abc[bytes[i] & 63];
  }
  if (i === length + 1) {
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[(bytes[i - 2] & 3) << 4];
    result += "==";
  }
  if (i === length) {
    result += base64abc[bytes[i - 2] >> 2];
    result += base64abc[(bytes[i - 2] & 3) << 4 | bytes[i - 1] >> 4];
    result += base64abc[(bytes[i - 1] & 15) << 2];
    result += "=";
  }
  return result;
};
function getBase64Code(charCode) {
  if (charCode >= base64codes.length) {
    throw new TypeError(`Invalid character ${String.fromCharCode(charCode)}`);
  }
  const code = base64codes[charCode];
  if (code === 255) {
    throw new TypeError(`Invalid character ${String.fromCharCode(charCode)}`);
  }
  return code;
}
var base64abc = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"];
var base64codes = [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255, 255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];
var byteToHex = [];
for (let i = 0;i < 256; i++) {
  byteToHex.push(i.toString(16).padStart(2, "0"));
}

// node_modules/effect/dist/Tracer.js
var ParentSpanKey = "effect/Tracer/ParentSpan";
var TracerKey = "effect/Tracer";

// node_modules/effect/dist/internal/metric.js
var FiberRuntimeMetricsKey = "effect/observability/Metric/FiberRuntimeMetricsKey";

// node_modules/effect/dist/internal/references.js
var CurrentStackFrame = /* @__PURE__ */ Reference("effect/References/CurrentStackFrame", {
  fiberCached: true,
  defaultValue: constUndefined
});
var CurrentLogLevel = /* @__PURE__ */ Reference("effect/References/CurrentLogLevel", {
  fiberCached: true,
  defaultValue: () => "Info"
});
var MinimumLogLevel = /* @__PURE__ */ Reference("effect/References/MinimumLogLevel", {
  fiberCached: true,
  defaultValue: () => "Info"
});

// node_modules/effect/dist/internal/effect.js
class Interrupt extends ReasonBase {
  fiberId;
  constructor(fiberId, annotations = constEmptyAnnotations) {
    super("Interrupt", annotations, "Interrupted");
    this.fiberId = fiberId;
  }
  toString() {
    return `Interrupt(${this.fiberId})`;
  }
  toJSON() {
    return {
      _tag: "Interrupt",
      fiberId: this.fiberId
    };
  }
  [symbol2](that) {
    return isInterruptReason(that) && this.fiberId === that.fiberId && this.annotations === that.annotations;
  }
  [symbol]() {
    return combine(string(`${this._tag}:${this.fiberId}`))(random(this.annotations));
  }
}
var causeInterrupt = (fiberId) => new CauseImpl([new Interrupt(fiberId)]);
var findError = (self2) => {
  for (let i = 0;i < self2.reasons.length; i++) {
    const reason = self2.reasons[i];
    if (reason._tag === "Fail") {
      return succeed2(reason.error);
    }
  }
  return fail2(self2);
};
var hasInterrupts = (self2) => self2.reasons.some(isInterruptReason);
var causeCombine = /* @__PURE__ */ dual(2, (self2, that) => {
  if (self2.reasons.length === 0) {
    return that;
  } else if (that.reasons.length === 0) {
    return self2;
  }
  const newCause = new CauseImpl(union(self2.reasons, that.reasons));
  return equals(self2, newCause) ? self2 : newCause;
});
var causeMap = /* @__PURE__ */ dual(2, (self2, f) => {
  let hasFail = false;
  const failures = self2.reasons.map((failure) => {
    if (isFailReason(failure)) {
      hasFail = true;
      return new Fail(f(failure.error), failure.annotations);
    }
    return failure;
  });
  return hasFail ? causeFromReasons(failures) : self2;
});
var FiberTypeId = "~effect/Fiber";
var fiberVariance = {
  _A: identity,
  _E: identity
};
var fiberIdStore = {
  id: 0
};
var getCurrentFiber = () => globalThis[currentFiberTypeId];

class FiberImpl {
  constructor(context, interruptible = true) {
    this[FiberTypeId] = fiberVariance;
    this.setContext(context);
    this.id = ++fiberIdStore.id;
    this.currentOpCount = 0;
    this.interruptible = interruptible;
    this._stack = [];
    this._observers = [];
    this._exit = undefined;
    this._children = undefined;
    this._interruptedCause = undefined;
    this._yielded = undefined;
    this._running = false;
    this._deferredInterrupt = false;
    this.runtimeMetrics?.recordFiberStart(this.context);
  }
  [FiberTypeId];
  id;
  interruptible;
  currentOpCount;
  _stack;
  _observers;
  _exit;
  _children;
  _interruptedCause;
  _yielded;
  _running;
  _deferredInterrupt;
  context;
  currentScheduler;
  currentTracerContext;
  currentSpan;
  currentLogLevel;
  minimumLogLevel;
  currentStackFrame;
  runtimeMetrics;
  maxOpsBeforeYield;
  currentPreventYield;
  _dispatcher = undefined;
  get currentDispatcher() {
    return this._dispatcher ??= this.currentScheduler.makeDispatcher();
  }
  getRef(ref) {
    return get(this.context, ref);
  }
  addObserver(cb) {
    if (this._exit) {
      cb(this._exit);
      return constVoid;
    }
    this._observers.push(cb);
    return () => {
      if (this._exit)
        return;
      const index = this._observers.indexOf(cb);
      if (index >= 0) {
        this._observers.splice(index, 1);
      }
    };
  }
  interruptUnsafe(fiberId, annotations) {
    if (this._exit) {
      return;
    }
    let cause = causeInterrupt(fiberId);
    if (this.currentStackFrame) {
      cause = causeAnnotate(cause, make3(StackTraceKey, this.currentStackFrame));
    }
    if (annotations) {
      cause = causeAnnotate(cause, annotations);
    }
    this._interruptedCause = this._interruptedCause ? causeCombine(this._interruptedCause, cause) : cause;
    if (this.interruptible) {
      if (this._running) {
        this._deferredInterrupt = true;
      } else {
        this.evaluate(failCause(this._interruptedCause));
      }
    }
  }
  pollUnsafe() {
    return this._exit;
  }
  evaluate(effect) {
    if (this._exit) {
      return;
    } else if (this._yielded !== undefined) {
      const yielded = this._yielded;
      this._yielded = undefined;
      yielded();
    }
    const exit = this.runLoop(effect);
    if (exit === Yield) {
      return;
    }
    const interruptChildren = fiberMiddleware.interruptChildren && fiberMiddleware.interruptChildren(this);
    if (interruptChildren !== undefined) {
      return this.evaluate(flatMap(interruptChildren, () => exit));
    }
    this._exit = exit;
    this.runtimeMetrics?.recordFiberEnd(this.context, this._exit);
    for (let i = 0;i < this._observers.length; i++) {
      this._observers[i](exit);
    }
    this._observers.length = 0;
    this._stack.length = 0;
    this._children = undefined;
    this.context = empty();
  }
  runLoop(effect) {
    const prevFiber = globalThis[currentFiberTypeId];
    globalThis[currentFiberTypeId] = this;
    const prevRunning = this._running;
    this._running = true;
    let yielding = false;
    let current = effect;
    this.currentOpCount = 0;
    try {
      while (true) {
        if (this._deferredInterrupt) {
          this._deferredInterrupt = false;
          current = failCause(this._interruptedCause);
        }
        this.currentOpCount++;
        if (!yielding && !this.currentPreventYield && this.currentScheduler.shouldYield(this)) {
          yielding = true;
          const prev = current;
          current = flatMap(yieldNow, () => prev);
        }
        current = this.currentTracerContext ? this.currentTracerContext(current, this) : current[evaluate](this);
        if (current === Yield) {
          const yielded = this._yielded;
          if (ExitTypeId in yielded) {
            this._deferredInterrupt = false;
            this._yielded = undefined;
            return yielded;
          } else if (this._deferredInterrupt) {
            this._yielded = undefined;
            yielded();
            continue;
          }
          return Yield;
        }
      }
    } catch (error) {
      if (!hasProperty(current, evaluate)) {
        return exitDie(`Fiber.runLoop: Not a valid effect: ${String(current)}`);
      }
      return this.runLoop(exitDie(error));
    } finally {
      this._running = prevRunning;
      globalThis[currentFiberTypeId] = prevFiber;
    }
  }
  getCont(symbol) {
    if (this._deferredInterrupt) {
      this._deferredInterrupt = false;
      return deferredInterruptCont;
    }
    while (true) {
      const op = this._stack.pop();
      if (!op)
        return;
      const cont = op[contAll] && op[contAll](this);
      if (cont) {
        cont[symbol] = cont;
        return cont;
      }
      if (op[symbol])
        return op;
    }
  }
  yieldWith(value) {
    this._yielded = value;
    return Yield;
  }
  children() {
    return this._children ??= new Set;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  setContext(context) {
    const previous = this.context;
    this.context = context;
    if (previous !== undefined && hasSameCache(previous, context))
      return;
    const scheduler = this.getRef(Scheduler);
    if (scheduler !== this.currentScheduler) {
      this.currentScheduler = scheduler;
      this._dispatcher = undefined;
    }
    this.currentSpan = getOrUndefinedUnsafe(context, ParentSpanKey);
    this.currentLogLevel = this.getRef(CurrentLogLevel);
    this.minimumLogLevel = this.getRef(MinimumLogLevel);
    this.currentStackFrame = this.getRef(CurrentStackFrame);
    this.maxOpsBeforeYield = this.getRef(MaxOpsBeforeYield);
    this.currentPreventYield = this.getRef(PreventSchedulerYield);
    this.runtimeMetrics = getOrUndefinedUnsafe(context, FiberRuntimeMetricsKey);
    const currentTracer = getOrUndefinedUnsafe(context, TracerKey);
    this.currentTracerContext = currentTracer ? currentTracer["context"] : undefined;
  }
  get currentSpanLocal() {
    return this.currentSpan?._tag === "Span" ? this.currentSpan : undefined;
  }
}
var deferredInterruptCont = {
  [contA](_value, fiber) {
    return failCause(fiber._interruptedCause);
  },
  [contE](_cause, fiber) {
    return failCause(fiber._interruptedCause);
  }
};
var fiberMiddleware = {
  interruptChildren: undefined
};
var fiberStackAnnotations = (fiber) => {
  if (!fiber.currentStackFrame)
    return;
  const annotations = new Map;
  annotations.set(InterruptorStackTrace.key, fiber.currentStackFrame);
  return makeUnsafe(annotations);
};
var fiberAwaitAll = (self2) => callback((resume) => {
  const iter = self2[Symbol.iterator]();
  const exits = [];
  let cancel = undefined;
  function loop() {
    let result = iter.next();
    while (!result.done) {
      if (result.value._exit) {
        exits.push(result.value._exit);
        result = iter.next();
        continue;
      }
      cancel = result.value.addObserver((exit) => {
        exits.push(exit);
        loop();
      });
      return;
    }
    resume(succeed3(exits));
  }
  loop();
  return sync(() => cancel?.());
});
var fiberInterruptAll = (fibers) => withFiber((parent) => {
  const annotations = fiberStackAnnotations(parent);
  let fiberArr = empty2();
  for (const fiber of fibers) {
    fiber.interruptUnsafe(parent.id, annotations);
    fiberArr.push(fiber);
  }
  return asVoid(fiberAwaitAll(fiberArr));
});
var succeed3 = exitSucceed;
var failCause = exitFailCause;
var fail3 = exitFail;
var sync = /* @__PURE__ */ makePrimitive({
  op: "Sync",
  [evaluate](fiber) {
    const value = this[args]();
    const cont = fiber.getCont(contA);
    return cont ? cont[contA](value, fiber) : fiber.yieldWith(exitSucceed(value));
  }
});
var suspend = /* @__PURE__ */ makePrimitive({
  op: "Suspend",
  [evaluate](_fiber) {
    return this[args]();
  }
});
var fromResult = /* @__PURE__ */ match2({
  onFailure: fail3,
  onSuccess: succeed3
});
var yieldNowWith = /* @__PURE__ */ makePrimitive({
  op: "Yield",
  [evaluate](fiber) {
    let resumed = false;
    fiber.currentDispatcher.scheduleTask(() => {
      if (resumed)
        return;
      fiber.evaluate(exitVoid);
    }, this[args] ?? 0);
    return fiber.yieldWith(() => {
      resumed = true;
    });
  }
});
var yieldNow = /* @__PURE__ */ yieldNowWith(0);
var succeedNone = /* @__PURE__ */ succeed3(/* @__PURE__ */ none2());
var failCauseSync = (evaluate) => suspend(() => failCause(internalCall(evaluate)));
var die = (defect) => exitDie(defect);
var failSync = (error) => suspend(() => fail3(internalCall(error)));
var void_ = /* @__PURE__ */ succeed3(undefined);
var try_ = (options) => {
  const evaluate = typeof options === "function" ? options : options.try;
  const catcher = typeof options === "function" ? (cause) => new UnknownError(cause, "An error occurred in Effect.try") : options.catch;
  return suspend(() => {
    try {
      return succeed3(internalCall(evaluate));
    } catch (err) {
      return fail3(internalCall(() => catcher(err)));
    }
  });
};
var tryPromise = (options) => {
  const f = typeof options === "function" ? options : options.try;
  const catcher = typeof options === "function" ? (cause) => new UnknownError(cause, "An error occurred in Effect.tryPromise") : options.catch;
  return callbackOptions(function(resume, signal) {
    const failWithCatch = (cause) => {
      try {
        resume(fail3(internalCall(() => catcher(cause))));
      } catch (err) {
        resume(die(err));
      }
    };
    try {
      internalCall(() => f(signal)).then((a) => resume(succeed3(a)), failWithCatch);
    } catch (err) {
      failWithCatch(err);
    }
  }, f.length !== 0);
};
var callbackOptions = /* @__PURE__ */ makePrimitive({
  op: "Async",
  single: false,
  [evaluate](fiber) {
    const register = internalCall(() => this[args][0].bind(fiber.currentScheduler));
    let resumed = false;
    let yielded = false;
    const controller = this[args][1] ? new AbortController : undefined;
    const onCancel = register((effect) => {
      if (resumed)
        return;
      resumed = true;
      if (yielded) {
        fiber.evaluate(effect);
      } else {
        yielded = effect;
      }
    }, controller?.signal);
    if (yielded !== false)
      return yielded;
    yielded = true;
    fiber._yielded = () => {
      resumed = true;
    };
    if (controller === undefined && onCancel === undefined) {
      return Yield;
    }
    fiber._stack.push(asyncFinalizer(() => {
      resumed = true;
      controller?.abort();
      return onCancel ?? exitVoid;
    }));
    return Yield;
  }
});
var asyncFinalizer = /* @__PURE__ */ makePrimitive({
  op: "AsyncFinalizer",
  [contAll](fiber) {
    if (fiber.interruptible) {
      fiber.interruptible = false;
      fiber._stack.push(setInterruptibleTrue);
    }
  },
  [contE](cause, _fiber) {
    return hasInterrupts(cause) ? flatMap(this[args](), () => failCause(cause)) : failCause(cause);
  }
});
var callback = (register) => callbackOptions(register, register.length >= 2);
var defineFunctionLength = (length, fn) => Object.defineProperty(fn, "length", {
  value: length,
  configurable: true
});
var fnUntracedEager = (body, ...pipeables) => defineFunctionLength(body.length, pipeables.length === 0 ? function() {
  return fromIteratorEagerUnsafe(() => body.apply(this, arguments));
} : function() {
  let effect = fromIteratorEagerUnsafe(() => body.apply(this, arguments));
  for (const pipeable of pipeables) {
    effect = pipeable(effect);
  }
  return effect;
});
var fromIteratorEagerUnsafe = (evaluate) => {
  try {
    const iterator = evaluate();
    let value = undefined;
    while (true) {
      const state = iterator.next(value);
      if (state.done) {
        return succeed3(state.value);
      }
      const primitive = state.value;
      if (primitive && primitive._tag === "Success") {
        value = primitive.value;
        continue;
      } else if (primitive && primitive._tag === "Failure") {
        return state.value;
      } else {
        let isFirstExecution = true;
        return suspend(() => {
          if (isFirstExecution) {
            isFirstExecution = false;
            return flatMap(state.value, (value) => fromIteratorUnsafe(iterator, value));
          } else {
            return suspend(() => fromIteratorUnsafe(evaluate()));
          }
        });
      }
    }
  } catch (error) {
    return die(error);
  }
};
var fromIteratorUnsafe = /* @__PURE__ */ makePrimitive({
  op: "Iterator",
  single: false,
  [contA](value, fiber) {
    const iter = this[args][0];
    while (true) {
      const state = iter.next(value);
      if (state.done)
        return succeed3(state.value);
      if (!effectIsExit(state.value)) {
        fiber._stack.push(this);
        return state.value;
      } else if (state.value._tag === "Failure") {
        return state.value;
      }
      value = state.value.value;
    }
  },
  [evaluate](fiber) {
    return this[contA](this[args][1], fiber);
  }
});
var asVoid = (self2) => flatMap(self2, (_) => exitVoid);
var flatMap = /* @__PURE__ */ dual(2, (self2, f) => {
  const onSuccess = Object.create(OnSuccessProto);
  onSuccess[args] = self2;
  onSuccess[contA] = f.length !== 1 ? (a) => f(a) : f;
  return onSuccess;
});
var OnSuccessProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnSuccess",
  [evaluate](fiber) {
    fiber._stack.push(this);
    return this[args];
  }
});
var effectIsExit = (effect) => (ExitTypeId in effect);
var flatMapEager = /* @__PURE__ */ dual(2, (self2, f) => {
  if (effectIsExit(self2)) {
    return self2._tag === "Success" ? f(self2.value) : self2;
  }
  return flatMap(self2, f);
});
var map4 = /* @__PURE__ */ dual(2, (self2, f) => flatMap(self2, (a) => succeed3(internalCall(() => f(a)))));
var mapEager = /* @__PURE__ */ dual(2, (self2, f) => effectIsExit(self2) ? exitMap(self2, f) : map4(self2, f));
var mapErrorEager = /* @__PURE__ */ dual(2, (self2, f) => effectIsExit(self2) ? exitMapError(self2, f) : mapError(self2, f));
var exitIsSuccess = (self2) => self2._tag === "Success";
var exitVoid = /* @__PURE__ */ exitSucceed(undefined);
var exitMap = /* @__PURE__ */ dual(2, (self2, f) => self2._tag === "Success" ? exitSucceed(f(self2.value)) : self2);
var exitMapError = /* @__PURE__ */ dual(2, (self2, f) => {
  if (self2._tag === "Success")
    return self2;
  const error = findError(self2.cause);
  if (isFailure2(error))
    return self2;
  return exitFail(f(error.success));
});
var catchCause = /* @__PURE__ */ dual(2, (self2, f) => {
  const onFailure = Object.create(OnFailureProto);
  onFailure[args] = self2;
  onFailure[contE] = f.length !== 1 ? (cause) => f(cause) : f;
  return onFailure;
});
var OnFailureProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnFailure",
  [evaluate](fiber) {
    fiber._stack.push(this);
    return this[args];
  }
});
var catchCauseFilter = /* @__PURE__ */ dual(3, (self2, filter, f) => catchCause(self2, (cause) => {
  const eb = filter(cause);
  return isFailure2(eb) ? failCause(eb.failure) : internalCall(() => f(eb.success, cause));
}));
var catch_ = /* @__PURE__ */ dual(2, (self2, f) => catchCauseFilter(self2, findError, (e) => f(e)));
var mapError = /* @__PURE__ */ dual(2, (self2, f) => catch_(self2, (error) => failSync(() => f(error))));
var OnSuccessAndFailureProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnSuccessAndFailure",
  [evaluate](fiber) {
    fiber._stack.push(this);
    return this[args];
  }
});
var exit = (self2) => effectIsExit(self2) ? exitSucceed(self2) : exitPrimitive(self2);
var exitPrimitive = /* @__PURE__ */ makePrimitive({
  op: "Exit",
  [evaluate](fiber) {
    fiber._stack.push(this);
    return this[args];
  },
  [contA](value, _, exit) {
    return succeed3(exit ?? exitSucceed(value));
  },
  [contE](cause, _, exit) {
    return succeed3(exit ?? exitFailCause(cause));
  }
});
var combineFinalizerCause = (exit_, finalizer) => exitIsSuccess(exit_) ? finalizer : catchCause(finalizer, (cause) => failCause(causeCombine(exit_.cause, cause)));
var onExitPrimitive = /* @__PURE__ */ makePrimitive({
  op: "OnExit",
  single: false,
  [evaluate](fiber) {
    fiber._stack.push(this);
    return this[args][0];
  },
  [contAll](fiber) {
    if (fiber.interruptible && this[args][2] !== true) {
      fiber._stack.push(setInterruptibleTrue);
      fiber.interruptible = false;
    }
  },
  [contA](value, _, exit) {
    exit ??= exitSucceed(value);
    const eff = this[args][1](exit);
    return eff ? flatMap(eff, (_) => exit) : exit;
  },
  [contE](cause, _, exit) {
    exit ??= exitFailCause(cause);
    const eff = this[args][1](exit);
    return eff ? flatMap(combineFinalizerCause(exit, eff), (_) => exit) : exit;
  }
});
var uninterruptible = (self2) => withFiber((fiber) => {
  if (!fiber.interruptible)
    return self2;
  fiber.interruptible = false;
  fiber._stack.push(setInterruptibleTrue);
  return self2;
});
var setInterruptible = /* @__PURE__ */ makePrimitive({
  op: "SetInterruptible",
  [contAll](fiber) {
    fiber.interruptible = this[args];
    if (fiber._interruptedCause && fiber.interruptible) {
      return () => failCause(fiber._interruptedCause);
    }
  }
});
var setInterruptibleTrue = /* @__PURE__ */ setInterruptible(true);
var whileLoop = /* @__PURE__ */ makePrimitive({
  op: "While",
  [contA](value, fiber) {
    this[args].step(value);
    if (this[args].while()) {
      fiber._stack.push(this);
      return this[args].body();
    }
    return exitVoid;
  },
  [evaluate](fiber) {
    if (this[args].while()) {
      fiber._stack.push(this);
      return this[args].body();
    }
    return exitVoid;
  }
});
var iterateEagerImpl = (options) => {
  const onItem = options.onItem;
  const step = options.step;
  const runSequential = (state, items, index, end) => {
    for (;index < end; index++) {
      const item = items[index];
      const effect = onItem(state, item, index);
      if (!effectIsExit(effect)) {
        return flatMap(exit(effect), (itemExit) => step(state, item, itemExit, index) ?? runSequential(state, items, index + 1, end) ?? void_);
      }
      const terminal = step(state, item, effect, index);
      if (terminal)
        return terminal._tag === "Failure" ? terminal : undefined;
    }
  };
  return (state, items, opts) => {
    let index = 0;
    const end = opts?.end ?? items.length;
    const concurrency = opts?.concurrency ?? 1;
    if (concurrency === 1) {
      return runSequential(state, items, 0, end);
    }
    const orderedStep = opts?.orderedStep === true;
    let done = false;
    let parentFiber;
    let fibers;
    let resume;
    let interrupted = false;
    let terminal;
    let effect;
    let nextIndex = index;
    const exits = orderedStep ? new Array(end) : undefined;
    const failDefect = (error) => {
      const defect = exitDie(error);
      terminal = defect;
      done = true;
      interrupted = true;
      return fibers && fibers.size > 0 ? flatMap(uninterruptible(fiberInterruptAll(Array.from(fibers))), () => defect) : defect;
    };
    const runStep = (item, exit, currentIndex) => {
      if (!orderedStep)
        return step(state, item, exit, currentIndex);
      if (terminal)
        return terminal;
      exits[currentIndex] = exit;
      while (nextIndex < end) {
        const nextExit = exits[nextIndex];
        if (nextExit === undefined)
          return;
        exits[nextIndex] = undefined;
        const index = nextIndex++;
        const result = step(state, items[index], nextExit, index);
        if (result)
          return result;
      }
    };
    const go = () => {
      let paused = false;
      for (;!terminal && index < end; index++) {
        const item = items[index];
        const eff = effect ?? onItem(state, item, index);
        if (effectIsExit(eff)) {
          terminal = runStep(item, eff, index);
          if (terminal)
            break;
        } else if (!parentFiber) {
          return callback((cb) => {
            parentFiber = getCurrentFiber();
            fibers = new Set;
            effect = eff;
            resume = cb;
            let result;
            try {
              result = go();
            } catch (error) {
              return cb(failDefect(error));
            }
            if (result)
              return cb(result);
            return suspend(() => {
              terminal = exitVoid;
              interrupted = true;
              return fibers ? fiberInterruptAll(fibers) : void_;
            });
          });
        } else {
          effect = undefined;
          const fiber = forkUnsafe(parentFiber, eff, true, true, "inherit");
          if (fiber._exit) {
            terminal = runStep(item, fiber._exit, index);
            if (terminal)
              break;
            continue;
          }
          fibers.add(fiber);
          const currentIndex = index;
          fiber.addObserver((exit) => {
            fibers.delete(fiber);
            try {
              if (terminal) {
                if (!interrupted && exit._tag === "Failure") {
                  for (const reason of exit.cause.reasons) {
                    if (reason._tag === "Interrupt")
                      continue;
                    else if (terminal._tag === "Failure") {
                      terminal.cause.reasons.push(reason);
                    } else {
                      terminal = exitFailCause(causeFromReasons([reason]));
                    }
                  }
                }
              } else {
                const result = runStep(item, exit, currentIndex);
                if (result) {
                  terminal = result._tag === "Failure" ? exitFailCause(causeFromReasons(result.cause.reasons.slice())) : result;
                  go();
                }
              }
              if (paused) {
                const eff = go();
                if (eff)
                  resume(eff);
              } else if (done && fibers.size === 0) {
                resume(terminal ?? void_);
              }
            } catch (error) {
              resume(failDefect(error));
            }
          });
          if (fibers.size < concurrency)
            continue;
          paused = true;
          index++;
          return;
        }
      }
      done = true;
      if (terminal) {
        if (fibers && fibers.size > 0) {
          const annotations = fiberStackAnnotations(parentFiber);
          fibers.forEach((f) => f.interruptUnsafe(parentFiber.id, annotations));
          return;
        }
        if (resume || terminal._tag === "Failure") {
          return terminal;
        }
      } else if (resume) {
        if (!fibers) {
          return exitVoid;
        } else if (fibers.size === 0) {
          resume(void_);
        }
      }
    };
    return go();
  };
};
var iterateEager = () => iterateEagerImpl;
var forkUnsafe = (parent, effect, immediate = false, daemon = false, uninterruptible = false) => {
  const parentRuntime = parent;
  const interruptible = uninterruptible === "inherit" ? parentRuntime.interruptible : !uninterruptible;
  const child = new FiberImpl(parentRuntime.context, interruptible);
  if (immediate) {
    child.evaluate(effect);
  } else {
    parentRuntime.currentDispatcher.scheduleTask(() => child.evaluate(effect), 0);
  }
  if (!daemon && !child._exit) {
    parentRuntime.children().add(child);
    child.addObserver(() => parentRuntime._children.delete(child));
  }
  return child;
};
var runForkWith = (context) => (effect, options) => {
  const fiber = new FiberImpl(options?.scheduler ? add(context, Scheduler, options.scheduler) : context, options?.uninterruptible !== true);
  fiber.evaluate(effect);
  if (fiber._exit)
    return fiber;
  if (options?.signal) {
    if (options.signal.aborted) {
      fiber.interruptUnsafe();
    } else {
      const abort = () => fiber.interruptUnsafe();
      options.signal.addEventListener("abort", abort, {
        once: true
      });
      fiber.addObserver(() => options.signal.removeEventListener("abort", abort));
    }
  }
  if (options?.onFiberStart) {
    options.onFiberStart(fiber);
  }
  return fiber;
};
var runSyncExitWith = (context) => {
  const runFork = runForkWith(context);
  return (effect) => {
    if (effectIsExit(effect))
      return effect;
    const scheduler = new MixedScheduler("sync");
    const fiber = runFork(effect, {
      scheduler
    });
    fiber._dispatcher?.flush();
    return fiber._exit ?? exitDie(new AsyncFiberError(fiber));
  };
};
var runSyncExit = /* @__PURE__ */ runSyncExitWith(/* @__PURE__ */ empty());
var MAX_TIMER_MILLIS = 2 ** 31 - 1;
var IllegalArgumentErrorTypeId = "~effect/Cause/IllegalArgumentError";
class IllegalArgumentError extends (/* @__PURE__ */ TaggedError("IllegalArgumentError")) {
  [IllegalArgumentErrorTypeId] = IllegalArgumentErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
}
var AsyncFiberErrorTypeId = "~effect/Cause/AsyncFiberError";
class AsyncFiberError extends (/* @__PURE__ */ TaggedError("AsyncFiberError")) {
  [AsyncFiberErrorTypeId] = AsyncFiberErrorTypeId;
  constructor(fiber) {
    super({
      message: "An asynchronous Effect was executed with Effect.runSync",
      fiber
    });
  }
}
var UnknownErrorTypeId = "~effect/Cause/UnknownError";
class UnknownError extends (/* @__PURE__ */ TaggedError("UnknownError")) {
  [UnknownErrorTypeId] = UnknownErrorTypeId;
  constructor(cause, message) {
    super({
      message,
      cause
    });
  }
}
var LoggerTypeId = "~effect/Logger";
var LoggerProto = {
  [LoggerTypeId]: {
    _Message: identity,
    _Output: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
var colors = {
  bold: "1",
  red: "31",
  green: "32",
  yellow: "33",
  blue: "34",
  cyan: "36",
  white: "37",
  gray: "90",
  black: "30",
  bgBrightRed: "101"
};
var logLevelColors = {
  None: [],
  All: [],
  Trace: [colors.gray],
  Debug: [colors.blue],
  Info: [colors.green],
  Warn: [colors.yellow],
  Error: [colors.red],
  Fatal: [colors.bgBrightRed, colors.black]
};

// node_modules/effect/dist/Exit.js
var succeed4 = exitSucceed;
var failCause2 = exitFailCause;
var fail4 = exitFail;
var void_2 = exitVoid;
var isSuccess3 = exitIsSuccess;

// node_modules/effect/dist/Cause.js
var isFailReason2 = isFailReason;
var map5 = causeMap;
var IllegalArgumentError2 = IllegalArgumentError;

// node_modules/effect/dist/internal/dateTime.js
var TypeId4 = "~effect/time/DateTime";
var TimeZoneTypeId = "~effect/time/DateTime/TimeZone";
var Proto2 = {
  [TypeId4]: TypeId4,
  pipe() {
    return pipeArguments(this, arguments);
  },
  [NodeInspectSymbol]() {
    return this.toString();
  },
  toJSON() {
    return toDateUtc(this).toJSON();
  }
};
var ProtoUtc = {
  ...Proto2,
  _tag: "Utc",
  [symbol]() {
    return number(this.epochMilliseconds);
  },
  [symbol2](that) {
    return isDateTime(that) && that._tag === "Utc" && this.epochMilliseconds === that.epochMilliseconds;
  },
  toString() {
    return `DateTime.Utc(${toDateUtc(this).toJSON()})`;
  }
};
var ProtoZoned = {
  ...Proto2,
  _tag: "Zoned",
  [symbol]() {
    return combine(number(this.epochMilliseconds))(hash(this.zone));
  },
  [symbol2](that) {
    return isDateTime(that) && that._tag === "Zoned" && this.epochMilliseconds === that.epochMilliseconds && equals(this.zone, that.zone);
  },
  toString() {
    return `DateTime.Zoned(${formatIsoZoned(this)})`;
  }
};
var ProtoTimeZone = {
  [TimeZoneTypeId]: TimeZoneTypeId,
  [NodeInspectSymbol]() {
    return this.toString();
  }
};
var ProtoTimeZoneNamed = {
  ...ProtoTimeZone,
  _tag: "Named",
  [symbol]() {
    return string(`Named:${this.id}`);
  },
  [symbol2](that) {
    return isTimeZone(that) && that._tag === "Named" && this.id === that.id;
  },
  toString() {
    return `TimeZone.Named(${this.id})`;
  },
  toJSON() {
    return {
      _id: "TimeZone",
      _tag: "Named",
      id: this.id
    };
  }
};
var ProtoTimeZoneOffset = {
  ...ProtoTimeZone,
  _tag: "Offset",
  [symbol]() {
    return string(`Offset:${this.offset}`);
  },
  [symbol2](that) {
    return isTimeZone(that) && that._tag === "Offset" && this.offset === that.offset;
  },
  toString() {
    return `TimeZone.Offset(${offsetToString(this.offset)})`;
  },
  toJSON() {
    return {
      _id: "TimeZone",
      _tag: "Offset",
      offset: this.offset
    };
  }
};
var isDateTime = (u) => hasProperty(u, TypeId4);
var isTimeZone = (u) => hasProperty(u, TimeZoneTypeId);
var isUtc = (self2) => self2._tag === "Utc";
var Equivalence = /* @__PURE__ */ make((a, b) => a.epochMilliseconds === b.epochMilliseconds);
var Order = /* @__PURE__ */ make2((self2, that) => self2.epochMilliseconds < that.epochMilliseconds ? -1 : self2.epochMilliseconds > that.epochMilliseconds ? 1 : 0);
var makeUtc = (epochMillis) => {
  const self2 = Object.create(ProtoUtc);
  self2.epochMilliseconds = epochMillis;
  Object.defineProperty(self2, "partsUtc", {
    value: undefined,
    enumerable: false,
    writable: true
  });
  return self2;
};
var fromDateUnsafe = (date) => {
  const epochMillis = date.getTime();
  if (Number.isNaN(epochMillis)) {
    throw new IllegalArgumentError2("Invalid date");
  }
  return makeUtc(epochMillis);
};
var makeUnsafe2 = (input) => {
  if (isDateTime(input)) {
    return input;
  } else if (input instanceof Date) {
    return fromDateUnsafe(input);
  } else if (typeof input === "object") {
    if ("epochMilliseconds" in input) {
      return fromDateUnsafe(new Date(input.epochMilliseconds));
    }
    const date = new Date(0);
    setPartsDate(date, input);
    return fromDateUnsafe(date);
  } else if (typeof input === "string" && !hasZone(input)) {
    return fromDateUnsafe(new Date(input + "Z"));
  }
  return fromDateUnsafe(new Date(input));
};
var hasZone = (input) => /Z|GMT|[+-]\d{2}$|[+-]\d{2}:?\d{2}$|\]$/.test(input);
var minEpochMillis = -8640000000000000 + 12 * 60 * 60 * 1000;
var maxEpochMillis = 8640000000000000 - 14 * 60 * 60 * 1000;
var make4 = /* @__PURE__ */ liftThrowable(makeUnsafe2);
var toUtc = (self2) => makeUtc(self2.epochMilliseconds);
var toDateUtc = (self2) => new Date(self2.epochMilliseconds);
var toDate = (self2) => {
  if (self2._tag === "Utc") {
    return new Date(self2.epochMilliseconds);
  } else if (self2.zone._tag === "Offset") {
    return new Date(self2.epochMilliseconds + self2.zone.offset);
  } else if (self2.adjustedEpochMilliseconds !== undefined) {
    return new Date(self2.adjustedEpochMilliseconds);
  }
  const parts = self2.zone.format.formatToParts(self2.epochMilliseconds).filter((_) => _.type !== "literal");
  const date = new Date(0);
  date.setUTCFullYear(Number(parts[2].value), Number(parts[0].value) - 1, Number(parts[1].value));
  date.setUTCHours(Number(parts[3].value), Number(parts[4].value), Number(parts[5].value), Number(parts[6].value));
  self2.adjustedEpochMilliseconds = date.getTime();
  return date;
};
var zonedOffset = (self2) => {
  const date = toDate(self2);
  return date.getTime() - toEpochMillis(self2);
};
var offsetToString = (offset) => {
  const abs = Math.abs(offset);
  let hours = Math.floor(abs / (60 * 60 * 1000));
  let minutes = Math.round(abs % (60 * 60 * 1000) / (60 * 1000));
  if (minutes === 60) {
    hours += 1;
    minutes = 0;
  }
  return `${offset < 0 ? "-" : "+"}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};
var zonedOffsetIso = (self2) => offsetToString(zonedOffset(self2));
var toEpochMillis = (self2) => self2.epochMilliseconds;
var setPartsDate = (date, parts) => {
  if (parts.year !== undefined) {
    date.setUTCFullYear(parts.year);
  }
  if (parts.month !== undefined) {
    date.setUTCMonth(parts.month - 1);
  }
  if (parts.day !== undefined) {
    date.setUTCDate(parts.day);
  }
  if (parts.weekDay !== undefined) {
    const diff = parts.weekDay - date.getUTCDay();
    date.setUTCDate(date.getUTCDate() + diff);
  }
  if (parts.hour !== undefined) {
    date.setUTCHours(parts.hour);
  }
  if (parts.minute !== undefined) {
    date.setUTCMinutes(parts.minute);
  }
  if (parts.second !== undefined) {
    date.setUTCSeconds(parts.second);
  }
  if (parts.millisecond !== undefined) {
    date.setUTCMilliseconds(parts.millisecond);
  }
};
var constDayMillis = 24 * 60 * 60 * 1000;
var formatIso = (self2) => toDateUtc(self2).toISOString();
var formatIsoOffset = (self2) => {
  const date = toDate(self2);
  return self2._tag === "Utc" ? date.toISOString() : `${date.toISOString().slice(0, -1)}${zonedOffsetIso(self2)}`;
};
var formatIsoZoned = (self2) => self2.zone._tag === "Offset" ? formatIsoOffset(self2) : `${formatIsoOffset(self2)}[${self2.zone.id}]`;

// node_modules/effect/dist/String.js
var String2 = globalThis.String;
var trim = (self2) => self2.trim();

// node_modules/effect/dist/Effect.js
var tryPromise2 = tryPromise;
var succeed5 = succeed3;
var succeedNone2 = succeedNone;
var fail5 = fail3;
var failCauseSync2 = failCauseSync;
var die2 = die;
var try_2 = try_;
var fromResult2 = fromResult;
var flatMap2 = flatMap;
var exit2 = exit;
var catchCause2 = catchCause;
var runSyncExit2 = runSyncExit;
var mapEager2 = mapEager;
var mapErrorEager2 = mapErrorEager;
var flatMapEager2 = flatMapEager;
var fnUntracedEager2 = fnUntracedEager;

// node_modules/effect/dist/DateTime.js
var isDateTime2 = isDateTime;
var isUtc2 = isUtc;
var Equivalence2 = Equivalence;
var Order2 = Order;
var fromDateUnsafe2 = fromDateUnsafe;
var makeUnsafe3 = makeUnsafe2;
var make5 = make4;
var toUtc2 = toUtc;
var toDateUtc2 = toDateUtc;
var toEpochMillis2 = toEpochMillis;
var formatIso2 = formatIso;
// node_modules/effect/dist/internal/schema/annotations.js
function resolve(ast) {
  return ast.checks ? ast.checks[ast.checks.length - 1].annotations : ast.annotations;
}
function resolveAt(key) {
  return (ast) => resolve(ast)?.[key];
}
var STRUCTURAL_ANNOTATION_KEY = "~structural";
var SENTINELS_ANNOTATION_KEY = "~sentinels";
var CONSTRUCTOR_ANNOTATION_KEY = "~constructor";
var resolveBrands = /* @__PURE__ */ resolveAt("brands");

// node_modules/effect/dist/internal/schema/parser.js
var missing = /* @__PURE__ */ Symbol();
var succeed6 = succeed4;
var missingExit = /* @__PURE__ */ succeed6(missing);
var sameExit = /* @__PURE__ */ succeed6(missing);
var toOption = (value) => value === missing ? none2() : some2(value);
var fromOptionExit = (option) => option._tag === "None" ? missingExit : succeed6(option.value);

// node_modules/effect/dist/SchemaIssue.js
var TypeId5 = "~effect/SchemaIssue/Issue";
function isIssue(u) {
  return hasProperty(u, TypeId5) && u[TypeId5] === TypeId5;
}
class Base {
  [TypeId5] = TypeId5;
  constructor(input, options) {
    if (options?.reportInput === true && input !== missing) {
      this.input = input;
    }
  }
}

class Filter extends Base {
  _tag = "Filter";
  filter;
  issue;
  constructor(filter, issue, input, options) {
    super(input, options);
    this.filter = filter;
    this.issue = issue;
  }
}

class Encoding extends Base {
  _tag = "Encoding";
  ast;
  issue;
  constructor(ast, issue, input, options) {
    super(input, options);
    this.ast = ast;
    this.issue = issue;
  }
}

class Pointer extends Base {
  _tag = "Pointer";
  path;
  issue;
  constructor(path, issue) {
    super();
    this.path = path;
    this.issue = issue;
  }
}

class MissingKey extends Base {
  _tag = "MissingKey";
  annotations;
  constructor(annotations) {
    super();
    this.annotations = annotations;
  }
}

class UnexpectedKey extends Base {
  _tag = "UnexpectedKey";
  ast;
  constructor(ast, input, options) {
    super(input, options);
    this.ast = ast;
  }
}

class Composite extends Base {
  _tag = "Composite";
  ast;
  issues;
  constructor(ast, issues, input, options) {
    super(input, options);
    this.ast = ast;
    this.issues = issues;
  }
}

class InvalidType extends Base {
  _tag = "InvalidType";
  ast;
  constructor(ast, input, options) {
    super(input, options);
    this.ast = ast;
  }
}

class InvalidValue extends Base {
  _tag = "InvalidValue";
  annotations;
  constructor(annotations, input, options) {
    super(input, options);
    this.annotations = annotations;
  }
}
class AnyOf extends Base {
  _tag = "AnyOf";
  ast;
  issues;
  constructor(ast, issues, input, options) {
    super(input, options);
    this.ast = ast;
    this.issues = issues;
  }
}

class OneOf extends Base {
  _tag = "OneOf";
  ast;
  successes;
  constructor(ast, successes, input, options) {
    super(input, options);
    this.ast = ast;
    this.successes = successes;
  }
}
function makeFilterIssue(entry, input, options) {
  if (isIssue(entry)) {
    return entry;
  }
  if (typeof entry === "string") {
    return new InvalidValue({
      message: entry
    }, input, options);
  }
  const inner = typeof entry.issue === "string" ? new InvalidValue({
    message: entry.issue
  }, input, options) : entry.issue;
  return new Pointer(entry.path, inner);
}
function makeSingle(out, input, options) {
  if (out === undefined) {
    return;
  }
  if (typeof out === "boolean") {
    return out ? undefined : new InvalidValue(undefined, input, options);
  }
  return makeFilterIssue(out, input, options);
}
function normalizeFilterOutput(ast, out, input, options) {
  if (Array.isArray(out)) {
    if (!isReadonlyArrayNonEmpty(out)) {
      return;
    }
    return out.length === 1 ? makeFilterIssue(out[0], input, options) : new Composite(ast, map2(out, (entry) => makeFilterIssue(entry, input, options)), input, options);
  }
  return makeSingle(out, input, options);
}

// node_modules/effect/dist/internal/schema/cause.js
function getSchemaIssue(cause) {
  let issue;
  for (const reason of cause.reasons) {
    if (!isFailReason2(reason) || !isIssue(reason.error)) {
      return;
    }
    issue ??= reason.error;
  }
  return issue;
}
function getSchemaIssueOrThrow(cause, message) {
  const issue = getSchemaIssue(cause);
  if (issue === undefined) {
    throw new Error(message, {
      cause
    });
  }
  return issue;
}

// node_modules/effect/dist/SchemaGetter.js
class Getter extends Class {
  run;
  constructor(run) {
    super();
    this.run = run;
  }
  map(f) {
    return new Getter((oe, options) => this.run(oe, options).pipe(mapEager2(map(f))));
  }
  compose(other) {
    if (isPassthrough(this)) {
      return other;
    }
    if (isPassthrough(other)) {
      return this;
    }
    return new Getter((oe, options) => this.run(oe, options).pipe(flatMapEager2((ot) => other.run(ot, options))));
  }
}
var passthrough_ = /* @__PURE__ */ new Getter(succeed5);
function isPassthrough(getter) {
  return getter.run === passthrough_.run;
}
function passthrough() {
  return passthrough_;
}
function onSome(f) {
  return new Getter((oe, options) => isNone2(oe) ? succeedNone2 : f(oe.value, options));
}
function transform(f) {
  return transformOptional(map(f));
}
function transformOrFail(f) {
  return onSome((e, options) => f(e, options).pipe(mapEager2(some2)));
}
function transformOptional(f) {
  return new Getter((oe) => succeed5(f(oe)));
}
function withDefault(defaultValue) {
  return new Getter((o) => {
    const filtered = filter(o, isNotUndefined);
    return isSome2(filtered) ? succeed5(filtered) : mapEager2(defaultValue, some2);
  });
}
function String3() {
  return transform(globalThis.String);
}
function Number3() {
  return transform(globalThis.Number);
}
function trim2() {
  return transform(trim);
}
function encodeBase642() {
  return transform(encodeBase64);
}
function decodeBase642() {
  return transformOrFail((input, options) => mapErrorEager2(fromResult2(decodeBase64(input)), () => new InvalidValue({
    expected: "a valid Base64 string"
  }, input, options)));
}

// node_modules/effect/dist/SchemaTransformation.js
var TypeId6 = "~effect/SchemaTransformation/Transformation";

class Transformation {
  [TypeId6] = TypeId6;
  _tag = "Transformation";
  decode;
  encode;
  constructor(decode, encode) {
    this.decode = decode;
    this.encode = encode;
  }
  flip() {
    return new Transformation(this.encode, this.decode);
  }
  compose(other) {
    return new Transformation(this.decode.compose(other.decode), other.encode.compose(this.encode));
  }
}
function isTransformation(u) {
  return hasProperty(u, TypeId6) && u[TypeId6] === TypeId6;
}
var make6 = (options) => {
  if (isTransformation(options)) {
    return options;
  }
  return new Transformation(options.decode, options.encode);
};
function transformOrFail2(options) {
  return new Transformation(transformOrFail(options.decode), transformOrFail(options.encode));
}
function transform2(options) {
  return new Transformation(transform(options.decode), transform(options.encode));
}
function trim3() {
  return new Transformation(trim2(), passthrough());
}
var passthrough_2 = /* @__PURE__ */ new Transformation(/* @__PURE__ */ passthrough(), /* @__PURE__ */ passthrough());
function passthrough2() {
  return passthrough_2;
}
var numberFromString = /* @__PURE__ */ new Transformation(/* @__PURE__ */ Number3(), /* @__PURE__ */ String3());
var isJsonError = (input) => isObject(input) && typeof input["message"] === "string";
var decodeJsonError = (input) => {
  const hasCause = Object.hasOwn(input, "cause");
  const err = hasCause ? new Error(input.message, {
    cause: decodeDefect(input.cause)
  }) : new Error(input.message);
  if (typeof input.name === "string" && input.name !== "Error")
    err.name = input.name;
  if (typeof input.stack === "string")
    err.stack = input.stack;
  return err;
};
var encodeUnknownAsJson = (input) => {
  try {
    const json = formatJson(input);
    return json === undefined ? format(input) : JSON.parse(json);
  } catch {
    return format(input);
  }
};
var encodeJsonError = (input, options, encodeDefect) => {
  const encoded = {
    name: input.name,
    message: typeof input.message === "string" ? input.message : ""
  };
  if (options?.includeStack && typeof input.stack === "string") {
    encoded.stack = input.stack;
  }
  if (!options?.excludeCause && input.cause !== undefined) {
    encoded.cause = encodeDefect(input.cause);
  }
  return encoded;
};
var makeEncodeDefect = (options) => {
  const seen = new WeakSet;
  const encode = (input) => {
    if (isError(input)) {
      if (seen.has(input)) {
        return "[Circular]";
      }
      seen.add(input);
      const encoded = encodeJsonError(input, options, encode);
      seen.delete(input);
      return encoded;
    }
    return encodeUnknownAsJson(input);
  };
  return encode;
};
var decodeDefect = (input) => isJsonError(input) ? decodeJsonError(input) : input;
var defectFromJson = (options) => transform2({
  decode: decodeDefect,
  encode: makeEncodeDefect(options)
});
var urlFromString = /* @__PURE__ */ transformOrFail2({
  decode: (s, options) => URL.canParse(s) ? succeed5(new URL(s)) : fail5(new InvalidValue({
    expected: "a valid URL string"
  }, s, options)),
  encode: (url) => succeed5(url.href)
});
var uint8ArrayFromBase64String = /* @__PURE__ */ new Transformation(/* @__PURE__ */ decodeBase642(), /* @__PURE__ */ encodeBase642());
var dateTimeUtcFromString = /* @__PURE__ */ transformOrFail2({
  decode: (s, options) => {
    return match(make5(s), {
      onNone: () => fail5(new InvalidValue({
        expected: "a valid UTC DateTime string"
      }, s, options)),
      onSome: (result) => succeed5(toUtc2(result))
    });
  },
  encode: (utc) => succeed5(formatIso2(utc))
});

// node_modules/effect/dist/SchemaAST.js
function makeGuard(tag) {
  return (ast) => ast._tag === tag;
}
var isDeclaration = /* @__PURE__ */ makeGuard("Declaration");
var isNever2 = /* @__PURE__ */ makeGuard("Never");
var isLiteral = /* @__PURE__ */ makeGuard("Literal");
var isUniqueSymbol = /* @__PURE__ */ makeGuard("UniqueSymbol");
var isArrays = /* @__PURE__ */ makeGuard("Arrays");
var isObjects = /* @__PURE__ */ makeGuard("Objects");
var isUnion = /* @__PURE__ */ makeGuard("Union");
var isSuspend = /* @__PURE__ */ makeGuard("Suspend");

class Link {
  to;
  transformation;
  constructor(to, transformation) {
    this.to = to;
    this.transformation = transformation;
  }
}
var defaultParseOptions = {};

class Context {
  isOptional;
  isMutable;
  constructorDefault;
  annotations;
  constructor(isOptional, isMutable, constructorDefault = undefined, annotations = undefined) {
    this.isOptional = isOptional;
    this.isMutable = isMutable;
    this.constructorDefault = constructorDefault;
    this.annotations = annotations;
  }
}
var TypeId7 = "~effect/Schema";

class Base2 {
  [TypeId7] = TypeId7;
  annotations;
  checks;
  encoding;
  context;
  constructor(annotations = undefined, checks = undefined, encoding = undefined, context = undefined) {
    this.annotations = annotations;
    this.checks = checks;
    this.encoding = encoding;
    this.context = context;
  }
  toString() {
    return `<${this._tag}>`;
  }
}

class Declaration extends Base2 {
  _tag = "Declaration";
  typeParameters;
  run;
  encodingChecks;
  encodingRun;
  constructor(typeParameters, run, annotations, checks, encoding, context, encodingChecks, encodingRun) {
    super(annotations, checks, encoding, context);
    this.typeParameters = typeParameters;
    this.run = run;
    this.encodingChecks = encodingChecks;
    this.encodingRun = encodingRun;
  }
  getParser() {
    let run;
    return (input, options) => {
      if (input === missing)
        return missingExit;
      return (run ??= this.run(this.typeParameters))(input, this, options);
    };
  }
  _rebuild(recur, checks, encodingChecks, run, encodingRun) {
    const tps = mapOrSame(this.typeParameters, recur);
    return tps === this.typeParameters && checks === this.checks && encodingChecks === this.encodingChecks && run === this.run && encodingRun === this.encodingRun ? this : new Declaration(tps, run, this.annotations, checks, undefined, this.context, encodingChecks, encodingRun);
  }
  recur(recur) {
    return this._rebuild(recur, this.checks, this.encodingChecks, this.run, this.encodingRun);
  }
  flip(recur) {
    return this._rebuild(recur, this.encodingChecks, this.checks, this.encodingRun ?? this.run, this.run);
  }
  getExpected() {
    const expected = this.annotations?.expected;
    if (typeof expected === "string")
      return expected;
    return "<Declaration>";
  }
}

class Null extends Base2 {
  _tag = "Null";
  getParser() {
    return fromConst(this, null);
  }
  getExpected() {
    return "null";
  }
}
var null_ = /* @__PURE__ */ new Null;
class Undefined extends Base2 {
  _tag = "Undefined";
  getParser() {
    return fromConst(this, undefined);
  }
  toCodecJson() {
    return replaceEncoding(this, [undefinedToNull]);
  }
  getExpected() {
    return "undefined";
  }
}
var undefinedToNull = /* @__PURE__ */ new Link(null_, /* @__PURE__ */ new Transformation(/* @__PURE__ */ transform(() => {
  return;
}), /* @__PURE__ */ transform(() => null)));
var undefined_2 = /* @__PURE__ */ new Undefined;
class Any extends Base2 {
  _tag = "Any";
  getParser() {
    return fromRefinement(this, isUnknown);
  }
  getExpected() {
    return "any";
  }
}
var any = /* @__PURE__ */ new Any;

class Unknown extends Base2 {
  _tag = "Unknown";
  getParser() {
    return fromRefinement(this, isUnknown);
  }
  getExpected() {
    return "unknown";
  }
}
var unknown = /* @__PURE__ */ new Unknown;
class Literal extends Base2 {
  _tag = "Literal";
  literal;
  constructor(literal, annotations, checks, encoding, context) {
    super(annotations, checks, encoding, context);
    if (typeof literal === "number" && !globalThis.Number.isFinite(literal)) {
      throw new Error(`A numeric literal must be finite, got ${format(literal)}`);
    }
    this.literal = literal;
  }
  getParser() {
    return fromConst(this, this.literal);
  }
  matchPart(s, _options) {
    return s === globalThis.String(this.literal) ? this.literal : undefined;
  }
  toCodecJson() {
    return typeof this.literal === "bigint" ? literalToString(this) : this;
  }
  toCodecStringTree() {
    return typeof this.literal === "string" ? this : literalToString(this);
  }
  getExpected() {
    return typeof this.literal === "string" ? JSON.stringify(this.literal) : globalThis.String(this.literal);
  }
}
function literalToString(ast) {
  const literalAsString = globalThis.String(ast.literal);
  return replaceEncoding(ast, [new Link(new Literal(literalAsString), new Transformation(transform(() => ast.literal), transform(() => literalAsString)))]);
}

class String4 extends Base2 {
  _tag = "String";
  getParser() {
    return fromRefinement(this, isString);
  }
  matchPart(s, options) {
    const checks = this.checks;
    return checks && !options.disableChecks && collectIssues(checks, s, undefined, this, options) ? undefined : s;
  }
  getExpected() {
    return "string";
  }
}
var string2 = /* @__PURE__ */ new String4;

class Number4 extends Base2 {
  _tag = "Number";
  getParser() {
    return fromRefinement(this, isNumber);
  }
  matchKey(s, options) {
    return this._match(isStringNumberRegExp, s, options);
  }
  matchPart(s, options) {
    return this._match(isStringFiniteRegExp, s, options);
  }
  _match(regexp, s, options) {
    if (!regexp.test(s))
      return;
    const value = globalThis.Number(s);
    if (options.disableChecks || !this.checks)
      return value;
    return collectIssues(this.checks, value, undefined, this, options) ? undefined : value;
  }
  toCodecJson() {
    if (this.checks && (hasCheck(this.checks, "effect/schema/isFinite") || hasCheck(this.checks, "effect/schema/isInt"))) {
      return this;
    }
    return replaceEncoding(this, [numberToJson]);
  }
  toCodecStringTree() {
    if (this.toCodecJson() === this) {
      return replaceEncoding(this, [finiteToString]);
    }
    return replaceEncoding(this, [numberToString]);
  }
  getExpected() {
    return "number";
  }
}
function hasCheck(checks, id) {
  return checks.some((check) => check.annotations?.representation?.id === id || check._tag === "FilterGroup" && hasCheck(check.checks, id));
}
var number2 = /* @__PURE__ */ new Number4;

class Boolean2 extends Base2 {
  _tag = "Boolean";
  getParser() {
    return fromRefinement(this, isBoolean);
  }
  getExpected() {
    return "boolean";
  }
}
var boolean = /* @__PURE__ */ new Boolean2;
class Arrays extends Base2 {
  _tag = "Arrays";
  isMutable;
  elements;
  rest;
  encodingChecks;
  constructor(isMutable, elements, rest, annotations, checks, encoding, context, encodingChecks) {
    super(annotations, checks, encoding, context);
    this.isMutable = isMutable;
    this.elements = elements;
    this.rest = rest;
    this.encodingChecks = encodingChecks;
    let hasOptional = false;
    for (let i = 0;i < elements.length; i++) {
      if (isOptional(elements[i])) {
        hasOptional = true;
      } else if (hasOptional) {
        throw new Error("A required element cannot follow an optional element. ts(1257)");
      }
    }
    if (hasOptional && rest.length > 1) {
      throw new Error("A required element cannot follow an optional element. ts(1257)");
    }
    for (let i = 1;i < rest.length; i++) {
      if (isOptional(rest[i])) {
        throw new Error("An optional element cannot follow a rest element. ts(1266)");
      }
    }
  }
  getParser(compile, compileConstructorDefault = compile) {
    const ast = this;
    let elements;
    let rest;
    const elementLen = ast.elements.length;
    const tailLen = Math.max(0, ast.rest.length - 1);
    function getParser(tailThreshold, index) {
      if (index < elementLen) {
        return elements[index];
      } else if (index >= tailThreshold) {
        return rest[index - tailThreshold + 1];
      }
      return rest[0];
    }
    return fnUntracedEager2(function* (input, options) {
      if (input === missing) {
        return missing;
      }
      if (!Array.isArray(input)) {
        return yield* fail5(new InvalidType(ast, input, options));
      }
      if (!elements) {
        elements = ast.elements.map((ast) => ({
          ast,
          parser: compileConstructorDefault(ast)
        }));
        rest = ast.rest.map((ast) => ({
          ast,
          parser: compileConstructorDefault(ast)
        }));
      }
      const len = input.length;
      const state = {
        ast,
        getParser,
        input,
        len,
        tailThreshold: Math.max(elementLen, len - tailLen),
        output: new globalThis.Array(len),
        issues: undefined,
        options
      };
      const concurrency = resolveConcurrency(options?.concurrency);
      const eff = parseArray(state, input, {
        concurrency: concurrency?.concurrency,
        end: ast.rest.length === 0 ? elementLen : Math.max(len, elementLen + tailLen)
      });
      if (eff)
        yield* eff;
      if (ast.rest.length === 0 && len > elementLen) {
        for (let i = elementLen;i <= len - 1; i++) {
          const unexpected = new UnexpectedKey(ast, input[i], options);
          const issue = new Pointer([i], unexpected);
          if (options.errors === "all") {
            if (state.issues)
              state.issues.push(issue);
            else
              state.issues = [issue];
          } else {
            return yield* fail5(new Composite(ast, [issue], input, options));
          }
        }
      }
      if (state.issues) {
        return yield* fail5(new Composite(ast, state.issues, input, options));
      }
      return state.output;
    });
  }
  _rebuild(recur, checks, encodingChecks) {
    const elements = mapOrSame(this.elements, recur);
    const rest = mapOrSame(this.rest, recur);
    return elements === this.elements && rest === this.rest && checks === this.checks && encodingChecks === this.encodingChecks ? this : new Arrays(this.isMutable, elements, rest, this.annotations, checks, undefined, this.context, encodingChecks);
  }
  recur(recur) {
    return this._rebuild(recur, this.checks, this.encodingChecks);
  }
  flip(recur) {
    return this._rebuild(recur, this.encodingChecks, this.checks);
  }
  getExpected() {
    return "array";
  }
}
var parseArray = /* @__PURE__ */ iterateEager()({
  onItem(s, item, i) {
    const value = i < s.len ? item : missing;
    return s.getParser(s.tailThreshold, i).parser(value, s.options);
  },
  step(s, item, exit, i) {
    if (exit._tag === "Failure") {
      return wrapPropertyKeyIssue(s, s.ast, i, exit);
    }
    const value = exit === sameExit ? item : exit[args];
    if (value !== missing) {
      s.output[i] = value;
    } else {
      const p = s.getParser(s.tailThreshold, i);
      if (isOptional(p.ast))
        return;
      const issue = new Pointer([i], new MissingKey(p.ast.context?.annotations));
      if (s.options.errors === "all") {
        if (s.issues)
          s.issues.push(issue);
        else
          s.issues = [issue];
      } else {
        return fail4(new Composite(s.ast, [issue], s.input, s.options));
      }
    }
  }
});
var resolveConcurrency = (value) => {
  value = value === "unbounded" ? Infinity : value ?? 1;
  return value > 1 ? {
    concurrency: value
  } : undefined;
};
var wrapPropertyKeyIssue = (s, ast, key, exit) => {
  if (exit.cause.reasons.length === 0) {
    return exit;
  }
  const issue = getSchemaIssue(exit.cause);
  if (issue === undefined) {
    return failCause2(map5(exit.cause, (issue) => new Composite(ast, [new Pointer([key], issue)], s.input, s.options)));
  }
  const pointer = new Pointer([key], issue);
  if (s.options.errors === "all") {
    if (s.issues)
      s.issues.push(pointer);
    else
      s.issues = [pointer];
  } else {
    return fail4(new Composite(ast, [pointer], s.input, s.options));
  }
};
var FINITE_PATTERN = "[+-]?\\d*\\.?\\d+(?:[Ee][+-]?\\d+)?";
function getIndexSignatureKeys(input, parameter, options = defaultParseOptions) {
  let stringKeys;
  let symbolKeys;
  function go(parameter) {
    switch (parameter._tag) {
      case "String":
      case "TemplateLiteral":
        return (stringKeys ??= Object.keys(input)).filter((k) => parameter.matchPart(k, options) !== undefined);
      case "Number":
        return (stringKeys ??= Object.keys(input)).filter((k) => parameter.matchKey(k, options) !== undefined);
      case "Symbol":
        return (symbolKeys ??= Object.getOwnPropertySymbols(input)).filter((k) => parameter.matchKey(k, options) !== undefined);
      case "Union":
        return [...new Set(parameter.types.flatMap(go))];
      default:
        return [];
    }
  }
  return go(parameterFromPropertyKey(toEncoded(parameter)));
}

class PropertySignature {
  name;
  type;
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
}
function isIndexSignatureParameterSide(ast) {
  switch (ast._tag) {
    case "String":
    case "Number":
    case "Symbol":
    case "TemplateLiteral":
      return true;
    case "Union":
      return ast.types.every(isIndexSignatureParameterSide);
    default:
      return false;
  }
}
function isIndexSignatureParameter(ast) {
  return isIndexSignatureParameterSide(ast) && isIndexSignatureParameterSide(toEncoded(ast));
}

class IndexSignature {
  parameter;
  type;
  constructor(parameter, type) {
    if (!isIndexSignatureParameter(parameter)) {
      throw new Error(`Invalid index signature parameter ${parameter._tag}`);
    }
    this.parameter = parameter;
    this.type = type;
    if (isOptional(type) && !containsUndefined(type)) {
      throw new Error("Cannot use `Schema.optionalKey` with index signatures, use `Schema.optional` instead.");
    }
  }
}

class Objects extends Base2 {
  _tag = "Objects";
  propertySignatures;
  indexSignatures;
  encodingChecks;
  constructor(propertySignatures, indexSignatures, annotations, checks, encoding, context, encodingChecks) {
    super(annotations, checks, encoding, context);
    this.propertySignatures = propertySignatures;
    this.indexSignatures = indexSignatures;
    this.encodingChecks = encodingChecks;
    const duplicates = propertySignatures.map((ps) => ps.name).filter((name, i, arr) => arr.indexOf(name) !== i);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate identifiers: ${JSON.stringify(duplicates)}. ts(2300)`);
    }
  }
  getParser(compile, compileConstructorDefault = compile) {
    const ast = this;
    const expectedKeys = [];
    for (const ps of ast.propertySignatures) {
      expectedKeys.push(ps.name);
    }
    const hasProperties = expectedKeys.length;
    const indexCount = ast.indexSignatures.length;
    let expectedKeysSet = hasProperties && indexCount ? new Set(expectedKeys) : undefined;
    if (!hasProperties && !indexCount) {
      return fromRefinement(ast, isNotNullish);
    }
    let properties;
    let indexes;
    const finishIndex = (s, key, k2, inputValue, exitValue) => {
      if (exitValue._tag === "Failure") {
        return wrapPropertyKeyIssue(s, ast, key, exitValue) ?? void_2;
      }
      const value = exitValue === sameExit ? inputValue : exitValue[args];
      if (k2 !== missing && value !== missing) {
        if (hasProperties && (expectedKeysSet.has(key) || expectedKeysSet.has(k2)))
          return void_2;
        assignProperty(s.out, k2, value);
      }
      return void_2;
    };
    const parseIndex = (s, key, index, exitKey) => {
      if (!exitKey) {
        const eff = index.parserKey(key, s.options);
        if (!effectIsExit(eff)) {
          return flatMap2(exit2(eff), (exit) => parseIndex(s, key, index, exit));
        }
        exitKey = eff;
      }
      if (exitKey._tag === "Failure") {
        return wrapPropertyKeyIssue(s, ast, key, exitKey) ?? void_2;
      }
      const k2 = exitKey === sameExit ? key : exitKey[args];
      const inputValue = s.input[key];
      const result = index.parserValue(inputValue, s.options);
      return effectIsExit(result) ? finishIndex(s, key, k2, inputValue, result) : flatMap2(exit2(result), (exit) => finishIndex(s, key, k2, inputValue, exit));
    };
    const parseStringIndex = (s, key, index) => {
      const inputValue = s.input[key];
      const result = index.parserValue(inputValue, s.options);
      return effectIsExit(result) ? finishIndex(s, key, key, inputValue, result) : flatMap2(exit2(result), (exit) => finishIndex(s, key, key, inputValue, exit));
    };
    const parseIndexes = indexCount ? iterateEager()({
      onItem: (s, [key, index]) => parseIndex(s, key, index),
      step: (_s, _, exit) => exit._tag === "Failure" ? exit : undefined
    }) : undefined;
    const compileMembers = () => {
      if (!properties) {
        properties = ast.propertySignatures.map((ps) => ({
          parser: compileConstructorDefault(ps.type),
          name: ps.name,
          type: ps.type
        }));
        indexes = indexCount ? ast.indexSignatures.map((is) => ({
          is,
          parserKey: compile(parameterFromPropertyKey(is.parameter)),
          parserValue: compileConstructorDefault(is.type)
        })) : undefined;
      }
      return properties;
    };
    const fallback = fnUntracedEager2(function* (input, options) {
      if (input === missing) {
        return missing;
      }
      if (!(typeof input === "object" && input !== null && !Array.isArray(input))) {
        return yield* fail5(new InvalidType(ast, input, options));
      }
      compileMembers();
      const record = input;
      const out = {};
      const state = {
        ast,
        input: record,
        out,
        issues: undefined,
        options
      };
      const errorsAllOption = options.errors === "all";
      const onExcessPropertyError = options.onExcessProperty === "error";
      const onExcessPropertyPreserve = options.onExcessProperty === "preserve";
      let inputKeys;
      if (!indexCount && (onExcessPropertyError || onExcessPropertyPreserve)) {
        expectedKeysSet ??= new Set(expectedKeys);
        inputKeys = Reflect.ownKeys(record);
        for (let i = 0;i < inputKeys.length; i++) {
          const key = inputKeys[i];
          if (!expectedKeysSet.has(key)) {
            if (onExcessPropertyError) {
              const unexpected = new UnexpectedKey(ast, record[key], options);
              const issue = new Pointer([key], unexpected);
              if (errorsAllOption) {
                if (state.issues) {
                  state.issues.push(issue);
                } else {
                  state.issues = [issue];
                }
                continue;
              } else {
                return yield* fail5(new Composite(ast, [issue], input, options));
              }
            } else {
              assignProperty(out, key, record[key]);
            }
          }
        }
      }
      const concurrency = resolveConcurrency(options?.concurrency);
      if (hasProperties) {
        const eff = parseProperties(state, properties, concurrency);
        if (eff)
          yield* eff;
      }
      if (indexCount && !concurrency) {
        for (let i = 0;i < indexCount; i++) {
          const index = indexes[i];
          const parse = index.is.parameter === string2 ? parseStringIndex : parseIndex;
          const keys = index.is.parameter === string2 ? Object.keys(record) : getIndexSignatureKeys(record, index.is.parameter, options);
          for (let j = 0;j < keys.length; j++) {
            const eff = parse(state, keys[j], index);
            if (!effectIsExit(eff))
              yield* eff;
            else if (eff._tag === "Failure")
              return yield* eff;
          }
        }
      } else if (parseIndexes) {
        const keyPairs = empty2();
        for (let i = 0;i < indexCount; i++) {
          const index = indexes[i];
          const keys = getIndexSignatureKeys(record, index.is.parameter, options);
          for (let j = 0;j < keys.length; j++) {
            keyPairs.push([keys[j], index]);
          }
        }
        const eff = parseIndexes(state, keyPairs, concurrency);
        if (eff)
          yield* eff;
      }
      if (state.issues) {
        return yield* fail5(new Composite(ast, state.issues, input, options));
      }
      if (options.propertyOrder === "original") {
        const keys = (inputKeys ?? Reflect.ownKeys(record)).concat(expectedKeys);
        const preserved = {};
        for (const key of keys) {
          if (Object.hasOwn(out, key)) {
            assignProperty(preserved, key, out[key]);
          }
        }
        return preserved;
      }
      return out;
    });
    if (indexCount)
      return fallback;
    const resume = (state, index, pending) => {
      const property = properties[index];
      return flatMap2(exit2(pending), (exit) => {
        const terminal = stepProperty(state, property, exit);
        if (terminal)
          return terminal;
        const done = () => succeed6(state.out);
        const eff = parseProperties(state, properties.slice(index + 1));
        return eff ? flatMapEager2(eff, done) : done();
      });
    };
    return (input, options) => {
      if (input === missing)
        return missingExit;
      if (options.errors === "all" || options.onExcessProperty !== undefined || options.propertyOrder === "original" || options.concurrency !== undefined) {
        return fallback(input, options);
      }
      if (!(typeof input === "object" && input !== null && !Array.isArray(input))) {
        return fail5(new InvalidType(ast, input, options));
      }
      const props = compileMembers();
      const record = input;
      const out = {};
      const state = {
        ast,
        input: record,
        out,
        issues: undefined,
        options
      };
      try {
        for (let index = 0;index < props.length; index++) {
          const property = props[index];
          const name = property.name;
          const hasKey = Object.hasOwn(record, name);
          const value = hasKey ? record[name] : missing;
          const exit = property.parser(value, options);
          if (!effectIsExit(exit)) {
            return resume(state, index, exit);
          }
          if (exit === sameExit) {
            if (hasKey)
              assignProperty(out, name, value);
            continue;
          }
          const terminal = stepProperty(state, property, exit);
          if (terminal)
            return terminal;
        }
      } catch (error) {
        return die2(error);
      }
      return succeed6(out);
    };
  }
  _rebuild(recur, recurParameter, checks, encodingChecks) {
    const props = mapOrSame(this.propertySignatures, (ps) => {
      const t = recur(ps.type);
      return t === ps.type ? ps : new PropertySignature(ps.name, t);
    });
    const indexes = mapOrSame(this.indexSignatures, (is) => {
      const p = recurParameter(is.parameter);
      const t = recur(is.type);
      return p === is.parameter && t === is.type ? is : new IndexSignature(p, t);
    });
    return props === this.propertySignatures && indexes === this.indexSignatures && checks === this.checks && encodingChecks === this.encodingChecks ? this : new Objects(props, indexes, this.annotations, checks, undefined, this.context, encodingChecks);
  }
  flip(recur) {
    return this._rebuild(recur, recur, this.encodingChecks, this.checks);
  }
  recur(recur, recurParameter = recur) {
    return this._rebuild(recur, recurParameter, this.checks, this.encodingChecks);
  }
  getExpected() {
    if (this.propertySignatures.length === 0 && this.indexSignatures.length === 0)
      return "object | array";
    return "object";
  }
}
function stepProperty(s, p, exit) {
  if (exit._tag === "Failure") {
    return wrapPropertyKeyIssue(s, s.ast, p.name, exit);
  }
  if (exit === sameExit)
    return;
  const value = exit[args];
  if (value !== missing) {
    assignProperty(s.out, p.name, value);
    return;
  }
  delete s.out[p.name];
  if (!isOptional(p.type)) {
    const issue = new Pointer([p.name], new MissingKey(p.type.context?.annotations));
    if (s.options.errors === "all") {
      if (s.issues)
        s.issues.push(issue);
      else
        s.issues = [issue];
      return;
    } else {
      return fail4(new Composite(s.ast, [issue], s.input, s.options));
    }
  }
}
var parseProperties = /* @__PURE__ */ iterateEager()({
  onItem(s, p) {
    if (!Object.hasOwn(s.input, p.name)) {
      return p.parser(missing, s.options);
    }
    const value = s.input[p.name];
    assignProperty(s.out, p.name, value);
    return p.parser(value, s.options);
  },
  step: stepProperty
});
function combineChecks(a, b) {
  if (!a)
    return b;
  if (!b)
    return a;
  return [...a, ...b];
}
function struct(fields, checks, annotations) {
  return new Objects(Reflect.ownKeys(fields).map((key) => {
    return new PropertySignature(key, fields[key].ast);
  }), [], annotations, checks);
}
function getAST(self2) {
  return self2.ast;
}
function tuple(elements, checks = undefined) {
  return new Arrays(false, elements.map((e) => e.ast), [], undefined, checks);
}
function union2(members, mode, checks) {
  return new Union(members.map(getAST), mode, undefined, checks);
}
function structWithRest(ast, records) {
  if (ast.encoding || records.some((r) => r.encoding)) {
    throw new Error("StructWithRest does not support encodings");
  }
  let propertySignatures = ast.propertySignatures;
  let indexSignatures = ast.indexSignatures;
  let checks = ast.checks;
  for (const record of records) {
    propertySignatures = propertySignatures.concat(record.propertySignatures);
    indexSignatures = indexSignatures.concat(record.indexSignatures);
    checks = combineChecks(checks, record.checks);
  }
  return new Objects(propertySignatures, indexSignatures, undefined, checks);
}
var toCandidate = /* @__PURE__ */ memoizeIdempotent((ast) => {
  while (true) {
    if (isSuspend(ast))
      return unknown;
    const encoding = ast.encoding;
    if (!encoding) {
      return ast.recur?.(toCandidate, identity) ?? ast;
    }
    if (encoding.some((link) => link.transformation._tag === "Middleware" && link.transformation.decode !== identity))
      return unknown;
    ast = encoding[encoding.length - 1].to;
  }
});
function getCandidateTypes(ast) {
  switch (ast._tag) {
    case "Null":
      return ["null"];
    case "Undefined":
      return ["undefined"];
    case "String":
    case "TemplateLiteral":
      return ["string"];
    case "Number":
      return ["number"];
    case "Boolean":
      return ["boolean"];
    case "Symbol":
    case "UniqueSymbol":
      return ["symbol"];
    case "BigInt":
      return ["bigint"];
    case "Arrays":
      return ["array"];
    case "ObjectKeyword":
      return ["object", "array", "function"];
    case "Objects":
      return ast.propertySignatures.length || ast.indexSignatures.length ? ["object"] : ["string", "number", "boolean", "symbol", "bigint", "object", "array", "function"];
    case "Enum":
      return Array.from(new Set(ast.enums.map(([, v]) => typeof v)));
    case "Literal":
      return [typeof ast.literal];
    case "Union":
      return Array.from(new Set(ast.types.flatMap(getCandidateTypes)));
    default:
      return ["null", "undefined", "string", "number", "boolean", "symbol", "bigint", "object", "array", "function"];
  }
}
function collectSentinels(ast) {
  switch (ast._tag) {
    default:
      return [];
    case "Declaration": {
      const s = ast.annotations?.[SENTINELS_ANNOTATION_KEY];
      return Array.isArray(s) ? s : [];
    }
    case "Objects":
      return ast.propertySignatures.flatMap((ps) => {
        const type = ps.type;
        if (!isOptional(type)) {
          if (isLiteral(type)) {
            return [{
              key: ps.name,
              literal: type.literal
            }];
          }
          if (isUniqueSymbol(type)) {
            return [{
              key: ps.name,
              literal: type.symbol
            }];
          }
        }
        return [];
      });
    case "Arrays":
      return ast.elements.flatMap((e, i) => {
        if (!isOptional(e)) {
          if (isLiteral(e)) {
            return [{
              key: i,
              literal: e.literal
            }];
          }
          if (isUniqueSymbol(e)) {
            return [{
              key: i,
              literal: e.symbol
            }];
          }
        }
        return [];
      });
    case "Union": {
      if (ast.types.length === 0)
        return [];
      const members = ast.types.map((type) => collectSentinels(toCandidate(type)));
      return members[0].filter((s) => members.every((sentinels) => sentinels.some((o) => o.key === s.key && o.literal === s.literal)));
    }
    case "Suspend":
      return collectSentinels(ast.thunk());
  }
}
var candidateIndexCache = /* @__PURE__ */ new WeakMap;
var emptyCandidates = /* @__PURE__ */ Object.freeze([]);
function getIndex(types) {
  let index = candidateIndexCache.get(types);
  if (index)
    return index;
  let bySentinel;
  let sentinelCandidateCount = 0;
  let otherwise;
  let literalCandidates;
  let onlyLiterals = true;
  for (let i = 0;i < types.length; i++) {
    const a = types[i];
    const encoded = toCandidate(a);
    if (isNever2(encoded))
      continue;
    if (onlyLiterals) {
      if (isLiteral(encoded) || isUniqueSymbol(encoded)) {
        literalCandidates ??= new Map;
        const literal = isLiteral(encoded) ? encoded.literal : encoded.symbol;
        let arr = literalCandidates.get(literal);
        if (!arr)
          literalCandidates.set(literal, arr = []);
        arr.push(a);
      } else {
        onlyLiterals = false;
      }
    }
    const sentinels = collectSentinels(encoded);
    if (sentinels.length) {
      bySentinel ??= new Map;
      sentinelCandidateCount++;
      for (const {
        key,
        literal
      } of sentinels) {
        let entry = bySentinel.get(key);
        if (!entry)
          bySentinel.set(key, entry = [new Map, new Set]);
        entry[1].add(i);
        let indexes = entry[0].get(literal);
        if (!indexes)
          entry[0].set(literal, indexes = new Set);
        indexes.add(i);
      }
    } else {
      otherwise ??= {};
      const candidateTypes = getCandidateTypes(encoded);
      for (const t of candidateTypes)
        (otherwise[t] ??= []).push(i);
    }
  }
  if (onlyLiterals && literalCandidates) {
    literalCandidates.forEach(Object.freeze);
    index = (input) => literalCandidates.get(input) ?? emptyCandidates;
  } else if (bySentinel?.size === 1 && !otherwise) {
    const [key, [byValue]] = bySentinel.entries().next().value;
    const candidates = byValue;
    for (const [literal, indexes] of byValue) {
      candidates.set(literal, Object.freeze(Array.from(indexes, (index) => types[index])));
    }
    index = (input, isConstructor) => {
      if (isObjectKeyword(input)) {
        const value = Object.hasOwn(input, key) ? input[key] : undefined;
        if (value !== undefined)
          return candidates.get(value) ?? emptyCandidates;
        if (isConstructor)
          return types;
      }
      return emptyCandidates;
    };
  } else if (bySentinel) {
    let commonSentinel;
    for (const entry of bySentinel) {
      if ((!commonSentinel || entry[1][0].size > commonSentinel[1][0].size) && entry[1][1].size === sentinelCandidateCount) {
        commonSentinel = entry;
      }
    }
    index = (input, isConstructor) => {
      const runtimeType = input === null ? "null" : Array.isArray(input) ? "array" : typeof input;
      const base = otherwise?.[runtimeType] ?? emptyCandidates;
      if (!isObjectKeyword(input))
        return base.map((i) => types[i]);
      const selected = new Set(base);
      let directKey;
      if (commonSentinel) {
        const [key, [byValue]] = commonSentinel;
        const hasKey = Object.hasOwn(input, key);
        const value = hasKey ? input[key] : undefined;
        if (hasKey && (!isConstructor || value !== undefined)) {
          const match = byValue.get(value);
          if (!match)
            return base.map((i) => types[i]);
          for (const i of match)
            selected.add(i);
          directKey = key;
        }
      }
      if (directKey === undefined) {
        for (const [key, [byValue, all]] of bySentinel) {
          const hasKey = Object.hasOwn(input, key);
          const value = hasKey ? input[key] : undefined;
          if (hasKey && (!isConstructor || value !== undefined)) {
            const match = byValue.get(value);
            if (match) {
              for (const i of match)
                selected.add(i);
            }
          } else if (isConstructor) {
            for (const i of all)
              selected.add(i);
          }
        }
      }
      for (const [key, [byValue, all]] of bySentinel) {
        if (key === directKey)
          continue;
        const hasKey = Object.hasOwn(input, key);
        const value = hasKey ? input[key] : undefined;
        if (hasKey && (!isConstructor || value !== undefined)) {
          const match = byValue.get(value);
          for (const i of selected) {
            if (all.has(i) && !match?.has(i))
              selected.delete(i);
          }
        }
      }
      return Array.from(selected).sort((a, b) => a - b).map((i) => types[i]);
    };
  } else {
    index = (input) => {
      const runtimeType = input === null ? "null" : Array.isArray(input) ? "array" : typeof input;
      return (otherwise?.[runtimeType] ?? emptyCandidates).map((i) => types[i]).filter(filterLiterals(input));
    };
  }
  candidateIndexCache.set(types, index);
  return index;
}
function filterLiterals(input) {
  return (ast) => {
    const encoded = toCandidate(ast);
    return encoded._tag === "Literal" ? encoded.literal === input : encoded._tag === "UniqueSymbol" ? encoded.symbol === input : true;
  };
}
function getCandidates(input, types, isConstructor = false) {
  return getIndex(types)(input, isConstructor);
}

class Union extends Base2 {
  _tag = "Union";
  types;
  mode;
  encodingChecks;
  constructor(types, mode, annotations, checks, encoding, context, encodingChecks) {
    super(annotations, checks, encoding, context);
    this.types = types;
    this.mode = mode;
    this.encodingChecks = encodingChecks;
  }
  getParser(compile, compileConstructorDefault) {
    const ast = this;
    return (input, options) => {
      if (input === missing) {
        return missingExit;
      }
      const candidates = getCandidates(input, ast.types, compileConstructorDefault !== undefined);
      if (candidates.length === 1) {
        const result = compile(candidates[0])(input, options);
        if (result._tag === "Success")
          return result;
        return effectIsExit(result) ? failSingleUnionCandidate(ast, result.cause, input, options) : catchCause2(result, (cause) => failSingleUnionCandidate(ast, cause, input, options));
      }
      const state = {
        ast,
        compile,
        input,
        out: undefined,
        successes: ast.mode === "oneOf" ? [] : undefined,
        issues: undefined,
        options
      };
      const concurrency = resolveConcurrency(options?.concurrency);
      const eff = parseUnion(state, candidates, concurrency ? {
        ...concurrency,
        orderedStep: true
      } : undefined);
      if (!eff) {
        if (state.out)
          return state.out;
        return fail5(new AnyOf(ast, state.issues ?? [], input, options));
      }
      return flatMapEager2(eff, (_) => {
        if (state.out === sameExit)
          return succeed5(input);
        if (state.out)
          return state.out;
        return fail5(new AnyOf(ast, state.issues ?? [], input, options));
      });
    };
  }
  _rebuild(recur, checks, encodingChecks) {
    const types = mapOrSame(this.types, recur);
    return types === this.types && checks === this.checks && encodingChecks === this.encodingChecks ? this : new Union(types, this.mode, this.annotations, checks, undefined, this.context, encodingChecks);
  }
  recur(recur) {
    return this._rebuild(recur, this.checks, this.encodingChecks);
  }
  flip(recur) {
    return this._rebuild(recur, this.encodingChecks, this.checks);
  }
  matchPart(s, options) {
    for (const type of this.types) {
      const out = type.matchPart(s, options);
      if (out !== undefined)
        return out;
    }
    return;
  }
  getExpected(getExpected) {
    const expected = this.annotations?.expected;
    if (typeof expected === "string")
      return expected;
    if (this.types.length === 0)
      return "never";
    const types = this.types.map((type) => {
      const encoded = toEncoded(type);
      switch (encoded._tag) {
        case "Arrays": {
          const literals = encoded.elements.filter(isLiteral);
          if (literals.length > 0) {
            return `${formatIsMutable(encoded.isMutable)}[ ${literals.map((e) => getExpected(e) + formatIsOptional(e.context?.isOptional)).join(", ")}, ... ]`;
          }
          break;
        }
        case "Objects": {
          const literals = encoded.propertySignatures.filter((ps) => isLiteral(ps.type));
          if (literals.length > 0) {
            return `{ ${literals.map((ps) => `${formatIsMutable(ps.type.context?.isMutable)}${formatPropertyKey(ps.name)}${formatIsOptional(ps.type.context?.isOptional)}: ${getExpected(ps.type)}`).join(", ")}, ... }`;
          }
          break;
        }
      }
      return getExpected(encoded);
    });
    return Array.from(new Set(types)).join(" | ");
  }
}
function failSingleUnionCandidate(ast, cause, input, options) {
  const issue = getSchemaIssue(cause);
  if (!issue)
    return failCause2(cause);
  return fail4(new AnyOf(ast, [issue], input, options));
}
var parseUnion = /* @__PURE__ */ iterateEager()({
  onItem(s, ast) {
    const parser = s.compile(ast);
    return parser(s.input, s.options);
  },
  step(s, candidate, exit) {
    if (exit._tag === "Failure") {
      const issue = getSchemaIssue(exit.cause);
      if (issue === undefined) {
        return exit;
      }
      if (s.issues)
        s.issues.push(issue);
      else
        s.issues = [issue];
    } else {
      if (s.out && s.successes) {
        s.successes.push(candidate);
        return fail4(new OneOf(s.ast, s.successes, s.input, s.options));
      }
      s.out = exit;
      if (s.successes) {
        s.successes.push(candidate);
      } else {
        return void_2;
      }
    }
  }
});
var nonFiniteLiterals = /* @__PURE__ */ new Union([/* @__PURE__ */ new Literal("Infinity"), /* @__PURE__ */ new Literal("-Infinity"), /* @__PURE__ */ new Literal("NaN")], "anyOf");
function formatIsMutable(isMutable) {
  return isMutable ? "" : "readonly ";
}
function formatIsOptional(isOptional) {
  return isOptional ? "?" : "";
}
function memoizeThunk(f) {
  let done = false;
  let a;
  return () => {
    if (done) {
      return a;
    }
    a = f();
    done = true;
    return a;
  };
}

class Suspend extends Base2 {
  _tag = "Suspend";
  thunk;
  constructor(thunk, annotations, checks, encoding, context) {
    if (checks) {
      throw new Error("Cannot add checks to Suspend");
    }
    super(annotations, undefined, encoding, context);
    this.thunk = memoizeThunk(thunk);
  }
  getParser(compile) {
    let parser;
    return (input, options) => (parser ??= compile(this.thunk()))(input, options);
  }
  recur(recur) {
    return new Suspend(() => recur(this.thunk()), this.annotations, undefined, undefined, this.context);
  }
  getExpected(getExpected) {
    return getExpected(this.thunk());
  }
}

class Filter2 extends Class {
  _tag = "Filter";
  run;
  annotations;
  aborted;
  constructor(run, annotations = undefined, aborted = false) {
    super();
    this.run = run;
    this.annotations = annotations;
    this.aborted = aborted;
  }
  annotate(annotations) {
    return new Filter2(this.run, {
      ...this.annotations,
      ...annotations
    }, this.aborted);
  }
  abort() {
    return new Filter2(this.run, this.annotations, true);
  }
  and(other, annotations) {
    return new FilterGroup([this, other], annotations);
  }
}

class FilterGroup extends Class {
  _tag = "FilterGroup";
  checks;
  annotations;
  constructor(checks, annotations = undefined) {
    super();
    this.checks = checks;
    this.annotations = annotations;
  }
  annotate(annotations) {
    return new FilterGroup(this.checks, {
      ...this.annotations,
      ...annotations
    });
  }
  and(other, annotations) {
    return new FilterGroup([this, other], annotations);
  }
}
function makeFilter(filter, annotations, aborted = false) {
  return new Filter2((input, ast, options) => normalizeFilterOutput(ast, filter(input, ast, options), input, options), annotations, aborted);
}
function isFinite(annotations) {
  return makeFilter((n) => globalThis.Number.isFinite(n), {
    expected: "a finite number",
    representation: {
      id: "effect/schema/isFinite",
      payload: null
    },
    toJsonSchema: () => ({
      type: "number"
    }),
    toCode: () => ({
      runtime: "Schema.isFinite()"
    }),
    arbitrary: {
      constraint: {
        noInfinity: true,
        noNaN: true
      }
    },
    ...annotations
  });
}
var finite = /* @__PURE__ */ appendChecks(number2, [/* @__PURE__ */ isFinite()]);
var numberToJson = /* @__PURE__ */ new Link(/* @__PURE__ */ new Union([finite, nonFiniteLiterals], "anyOf"), /* @__PURE__ */ new Transformation(/* @__PURE__ */ Number3(), /* @__PURE__ */ transform((n) => globalThis.Number.isFinite(n) ? n : globalThis.String(n))));
function isPattern(regExp, annotations) {
  const source = regExp.source;
  const pattern = new globalThis.RegExp(source, regExp.flags);
  return makeFilter((s) => {
    pattern.lastIndex = 0;
    return pattern.test(s);
  }, {
    expected: `a string matching the RegExp ${source}`,
    representation: {
      id: "effect/schema/isPattern",
      payload: {
        source,
        flags: regExp.flags
      }
    },
    toJsonSchema: () => ({
      pattern: source
    }),
    arbitrary: {
      constraint: {
        patterns: [regExp.source]
      }
    },
    ...annotations
  });
}
function modifyOwnPropertyDescriptors(ast, f) {
  const d = Object.getOwnPropertyDescriptors(ast);
  f(d);
  return Object.create(Object.getPrototypeOf(ast), d);
}
var contextOwners = /* @__PURE__ */ new WeakMap;
function getContextOwner(ast) {
  return contextOwners.get(ast) ?? ast;
}
function replaceEncoding(ast, encoding) {
  if (ast.encoding === encoding) {
    return ast;
  }
  return modifyOwnPropertyDescriptors(ast, (d) => {
    d.encoding.value = encoding;
  });
}
function replaceContext(ast, context) {
  if (ast.context === context) {
    return ast;
  }
  const owner = getContextOwner(ast);
  if (owner.context === context) {
    return owner;
  }
  const out = modifyOwnPropertyDescriptors(ast, (d) => {
    d.context.value = context;
  });
  contextOwners.set(out, owner);
  return out;
}
function annotate(ast, annotations) {
  if (ast.checks) {
    const last = ast.checks[ast.checks.length - 1];
    return replaceChecks(ast, append(ast.checks.slice(0, -1), last.annotate(annotations)));
  }
  return modifyOwnPropertyDescriptors(ast, (d) => {
    d.annotations.value = {
      ...d.annotations.value,
      ...annotations
    };
  });
}
function replaceChecks(ast, checks) {
  if (ast._tag === "Suspend" && checks) {
    throw new Error("Cannot add checks to Suspend");
  }
  if (ast.checks === checks) {
    return ast;
  }
  return modifyOwnPropertyDescriptors(ast, (d) => {
    d.checks.value = checks;
  });
}
function appendChecks(ast, checks) {
  return replaceChecks(ast, combineChecks(ast.checks, checks));
}
function mapLink(link, f) {
  const to = f(link.to);
  return to === link.to ? link : new Link(to, link.transformation);
}
function updateLastLink(encoding, f) {
  const links = encoding;
  const last = links[links.length - 1];
  const out = mapLink(last, f);
  return out === last ? encoding : append(encoding.slice(0, encoding.length - 1), out);
}
function applyToLastLink(f) {
  return (ast) => ast.encoding ? replaceEncoding(ast, updateLastLink(ast.encoding, f)) : ast;
}
function applyToSelfOrLastLinkEncodingIdempotent(f, options) {
  function out(ast) {
    if (ast.encoding) {
      const last = ast.encoding[ast.encoding.length - 1];
      return options?.stopAt?.(last) ? ast : replaceEncoding(ast, updateLastLink(ast.encoding, out));
    }
    return f(ast);
  }
  return memoizeIdempotent(out);
}
function appendTransformation(from, transformation, to) {
  const link = new Link(from, transformation);
  return replaceEncoding(to, to.encoding ? [...to.encoding, link] : [link]);
}
function brand(ast, brand) {
  const existing = resolveBrands(ast);
  const brands = existing ? [...existing, brand] : [brand];
  return annotate(ast, {
    brands
  });
}
function mapOrSame(as, f) {
  let changed = false;
  const out = new Array(as.length);
  for (let i = 0;i < as.length; i++) {
    const a = as[i];
    const fa = f(a);
    if (fa !== a) {
      changed = true;
    }
    out[i] = fa;
  }
  return changed ? out : as;
}
function annotateKey(ast, annotations) {
  const context = ast.context ? new Context(ast.context.isOptional, ast.context.isMutable, ast.context.constructorDefault, {
    ...ast.context.annotations,
    ...annotations
  }) : new Context(false, false, undefined, annotations);
  return replaceContext(ast, context);
}
var optionalKey = /* @__PURE__ */ memoizeIdempotent((ast) => {
  const context = ast.context ? ast.context.isOptional === false ? new Context(true, ast.context.isMutable, ast.context.constructorDefault, ast.context.annotations) : ast.context : new Context(true, false);
  return optionalKeyLastLink(replaceContext(ast, context));
});
var optionalKeyLastLink = /* @__PURE__ */ applyToLastLink(optionalKey);
var optional = /* @__PURE__ */ memoize((ast) => optionalKey(new Union([ast, undefined_2], "anyOf")));
function withConstructorDefault(ast, defaultValue) {
  const transformation = new Transformation(withDefault(defaultValue), passthrough());
  const constructorDefault = new Link(unknown, transformation);
  const context = ast.context ? new Context(ast.context.isOptional, ast.context.isMutable, constructorDefault, ast.context.annotations) : new Context(false, false, constructorDefault);
  return replaceContext(ast, context);
}
function decodeTo(from, to, transformation) {
  return appendTransformation(from, transformation, to);
}
function parseParameter(ast) {
  const literals = [];
  const parameters = [];
  function go(ast) {
    switch (ast._tag) {
      case "Literal":
        if (isPropertyKey(ast.literal)) {
          literals.push(ast.literal);
        }
        return;
      case "UniqueSymbol":
        literals.push(ast.symbol);
        return;
      case "Never":
        return;
      case "Union":
        for (let i = 0;i < ast.types.length; i++) {
          go(ast.types[i]);
        }
        return;
      default:
        parameters.push(ast);
    }
  }
  go(ast);
  return {
    literals,
    parameters
  };
}
function record(key, value) {
  const {
    literals,
    parameters: indexSignatures
  } = parseParameter(key);
  return new Objects(literals.map((literal) => new PropertySignature(literal, value)), indexSignatures.map((parameter) => new IndexSignature(parameter, value)));
}
function isOptional(ast) {
  return ast.context?.isOptional ?? false;
}
function isStructuralCheck(check) {
  return check.annotations?.[STRUCTURAL_ANNOTATION_KEY] === true || check._tag === "FilterGroup" && check.checks.every(isStructuralCheck);
}
function extractStructuralChecks(checks) {
  function extract(check) {
    if (isStructuralCheck(check))
      return [check];
    return check._tag === "FilterGroup" ? check.checks.flatMap(extract) : [];
  }
  const out = checks.flatMap(extract);
  return isArrayNonEmpty2(out) ? out : undefined;
}
var toType = /* @__PURE__ */ memoizeIdempotent((ast) => {
  if (ast.encoding) {
    return toType(replaceEncoding(ast, undefined));
  }
  const out = ast;
  const type = out.recur?.(toType) ?? out;
  const encodingChecks = type.encodingChecks;
  if (encodingChecks) {
    const checks = type === ast ? encodingChecks : isArrays(type) || isObjects(type) || isDeclaration(type) && type.typeParameters.length > 0 ? extractStructuralChecks(encodingChecks) : undefined;
    return modifyOwnPropertyDescriptors(type, (d) => {
      d.encodingChecks.value = undefined;
      d.checks.value = combineChecks(type.checks, checks);
    });
  }
  return type;
});
var toEncoded = /* @__PURE__ */ memoizeIdempotent((ast) => {
  return toType(flip2(ast));
});
function flipEncoding(ast, encoding) {
  const links = encoding;
  const len = links.length;
  const last = links[len - 1];
  const ls = [new Link(flip2(replaceEncoding(ast, undefined)), links[0].transformation.flip())];
  for (let i = 1;i < len; i++) {
    ls.unshift(new Link(flip2(links[i - 1].to), links[i].transformation.flip()));
  }
  const to = flip2(last.to);
  if (to.encoding) {
    return replaceEncoding(to, [...to.encoding, ...ls]);
  } else {
    return replaceEncoding(to, ls);
  }
}
var flip2 = /* @__PURE__ */ memoize((ast) => {
  if (ast.encoding) {
    return flipEncoding(ast, ast.encoding);
  }
  const out = ast;
  return out.flip?.(flip2) ?? out.recur?.(flip2) ?? out;
});
function containsUndefined(ast) {
  switch (ast._tag) {
    case "Undefined":
      return true;
    case "Union":
      return ast.types.some(containsUndefined);
    default:
      return false;
  }
}
function fromConst(ast, value) {
  const succeed = succeed6(value);
  return (input, options) => {
    if (input === missing)
      return missingExit;
    if (input === value)
      return succeed;
    return fail5(new InvalidType(ast, input, options));
  };
}
function fromRefinement(ast, refinement) {
  return (input, options) => {
    if (input === missing)
      return missingExit;
    if (refinement(input))
      return sameExit;
    return fail5(new InvalidType(ast, input, options));
  };
}
var parameterFromPropertyKey = /* @__PURE__ */ applyToSelfOrLastLinkEncodingIdempotent((ast) => {
  switch (ast._tag) {
    default:
      return ast;
    case "Number":
      return ast.toCodecStringTree();
    case "Union":
      return ast.recur(parameterFromPropertyKey);
  }
});
var isStringFiniteRegExp = /* @__PURE__ */ new globalThis.RegExp(`^${FINITE_PATTERN}$`);
var isStringNumberRegExp = /* @__PURE__ */ new globalThis.RegExp(`^(?:${FINITE_PATTERN}|Infinity|-Infinity|NaN)$`);
function isStringFinite(annotations) {
  return isPattern(isStringFiniteRegExp, {
    expected: "a string representing a finite number",
    representation: {
      id: "effect/schema/isStringFinite",
      payload: null
    },
    toJsonSchema: () => ({
      pattern: isStringFiniteRegExp.source
    }),
    ...annotations
  });
}
var finiteString = /* @__PURE__ */ appendChecks(string2, [/* @__PURE__ */ isStringFinite()]);
var finiteToString = /* @__PURE__ */ new Link(finiteString, numberFromString);
var numberToString = /* @__PURE__ */ new Link(/* @__PURE__ */ new Union([finiteString, nonFiniteLiterals], "anyOf"), numberFromString);
var BIGINT_PATTERN = "-?\\d+";
var isStringBigIntRegExp = /* @__PURE__ */ new globalThis.RegExp(`^${BIGINT_PATTERN}$`);
var REGEXP_PATTERN = "Symbol\\((.*)\\)";
var isStringSymbolRegExp = /* @__PURE__ */ new globalThis.RegExp(`^${REGEXP_PATTERN}$`);
function collectIssues(checks, value, issues, ast, options) {
  for (let i = 0;i < checks.length; i++) {
    const check = checks[i];
    if (check._tag === "FilterGroup") {
      issues = collectIssues(check.checks, value, issues, ast, options);
      if (issues && (options.errors !== "all" || issues[issues.length - 1].filter.aborted)) {
        return issues;
      }
    } else {
      const issue = check.run(value, ast, options);
      if (issue) {
        const filter = new Filter(check, issue, value, options);
        if (issues)
          issues.push(filter);
        else
          issues = [filter];
        if (options.errors !== "all" || check.aborted) {
          return issues;
        }
      }
    }
  }
  return issues;
}
function getConstructorDescriptor(ast) {
  if (!isDeclaration(ast))
    return;
  const getDescriptor = ast.annotations?.[CONSTRUCTOR_ANNOTATION_KEY];
  return isFunction(getDescriptor) ? getDescriptor(ast.typeParameters) : undefined;
}
function isJsonLeaf(u) {
  return u === null || typeof u === "string" || typeof u === "boolean" || typeof u === "number" && globalThis.Number.isFinite(u);
}
function isStringTreeLeaf(u) {
  return u === undefined || typeof u === "string";
}
function isTree(u, isLeaf) {
  const cache = new WeakMap;
  const stack = [];
  outer:
    while (true) {
      if (typeof u !== "object" || u === null) {
        if (!isLeaf(u)) {
          return false;
        }
      } else {
        const value = u;
        const cached = cache.get(value);
        if (cached === false) {
          return false;
        }
        if (cached === undefined) {
          const isArray = Array.isArray(value);
          if (!isArray) {
            const prototype = Object.getPrototypeOf(value);
            if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
              return false;
            }
          }
          cache.set(value, false);
          stack.push({
            value,
            keys: isArray ? value.length : Object.keys(value),
            index: 0
          });
        }
      }
      while (stack.length > 0) {
        const frame = stack[stack.length - 1];
        const keys = frame.keys;
        if (typeof keys === "number") {
          if (frame.index < keys) {
            u = frame.value[frame.index++];
            continue outer;
          }
        } else if (frame.index < keys.length) {
          u = frame.value[keys[frame.index++]];
          continue outer;
        }
        cache.set(frame.value, true);
        stack.pop();
      }
      return true;
    }
}
function isJson(u) {
  return isTree(u, isJsonLeaf);
}
var Json = /* @__PURE__ */ new Declaration([], () => (input, ast, options) => isJson(input) ? sameExit : fail5(new InvalidType(ast, input, options)), {
  representation: {
    id: "effect/schema/Json",
    payload: null
  },
  expected: "JSON value",
  toCodecJson: () => {
    return;
  },
  toCodecStringTree: () => unknownToStringTree,
  toArbitrary: () => (fc) => fc.jsonValue()
});
function isStringTree(u) {
  return isTree(u, isStringTreeLeaf);
}
var StringTree = /* @__PURE__ */ new Declaration([], () => (input, ast, options) => isStringTree(input) ? sameExit : fail5(new InvalidType(ast, input, options)), {
  expected: "StringTree",
  toCodecStringTree: () => {
    return;
  }
});
var unknownToStringTree = /* @__PURE__ */ new Link(StringTree, /* @__PURE__ */ passthrough2());

// node_modules/effect/dist/SchemaParser.js
function makeEffect(schema) {
  const parser = runWithCompiler(constructorCompiler, toType(schema.ast));
  return (input, options) => {
    return parser(input, options?.disableChecks ? options?.parseOptions ? {
      ...options.parseOptions,
      disableChecks: true
    } : {
      disableChecks: true
    } : options?.parseOptions);
  };
}
function makeOption(schema) {
  const parser = makeEffect(schema);
  return (input, options) => {
    const exit = runSyncExit2(parser(input, options));
    if (isSuccess3(exit)) {
      return some2(exit.value);
    }
    getSchemaIssueOrThrow(exit.cause, "Option adapter can only return none for schema issues");
    return none2();
  };
}
function make7(schema) {
  const parser = makeEffect(schema);
  return (input, options) => {
    const exit = runSyncExit2(parser(input, options));
    if (isSuccess3(exit)) {
      return exit.value;
    }
    const issue = getSchemaIssueOrThrow(exit.cause, "Constructor adapter can only throw schema issues");
    throw new Error("Schema validation failed", {
      cause: issue
    });
  };
}
function is(schema) {
  return _is(schema.ast);
}
function _is(ast) {
  const parser = asExit(run(toType(ast)));
  return (input) => {
    const exit = parser(input, defaultParseOptions);
    if (isSuccess3(exit)) {
      return true;
    }
    getSchemaIssueOrThrow(exit.cause, "Type guard adapter can only return false for schema issues");
    return false;
  };
}
var mergeParseOptions = (options, overrideOptions) => overrideOptions ? {
  ...options,
  ...overrideOptions
} : options;
var getValue = (value) => {
  if (value === missing) {
    return fail5(new InvalidValue);
  }
  return succeed5(value);
};
function run(ast) {
  return runWithCompiler(normalCompiler, ast);
}
function runWithCompiler(compiler, ast) {
  let parser;
  return (input, options) => {
    const result = (parser ??= compiler(ast))(input, options ?? defaultParseOptions);
    if (result === sameExit) {
      return succeed5(input);
    }
    if (!effectIsExit(result)) {
      return flatMapEager2(result, getValue);
    }
    return result[args] === missing ? getValue(missing) : result;
  };
}
function asExit(parser) {
  return (input, options) => runSyncExit2(parser(input, options));
}
var normalCompiler = /* @__PURE__ */ memoize((ast) => makeParser(ast, normalCompiler));
var constructorCompiler = /* @__PURE__ */ memoize((ast) => makeParser(ast, constructorCompiler, compileConstructorDefault));
var compileDefaulted = /* @__PURE__ */ memoize((ast) => makeParser(ast, constructorCompiler, compileConstructorDefault, ast.context?.constructorDefault));
function compileConstructorDefault(ast) {
  return ast.context?.constructorDefault ? compileDefaulted(ast) : constructorCompiler(ast);
}
function applyTransformation(result, current, transformation, options) {
  let transformed;
  if (effectIsExit(result) && result._tag === "Success") {
    const optional = toOption(result === sameExit ? current : result[args]);
    transformed = transformation._tag === "Transformation" ? transformation.decode.run(optional, options) : transformation.decode(succeed6(optional), options);
  } else if (transformation._tag === "Transformation") {
    transformed = flatMapEager2(result, (value) => transformation.decode.run(toOption(value), options));
  } else {
    transformed = transformation.decode(mapEager2(result, toOption), options);
  }
  return effectIsExit(transformed) && transformed._tag === "Success" ? fromOptionExit(transformed[args]) : flatMapEager2(transformed, fromOptionExit);
}
function makeConstructorParser(descriptor, compile) {
  let sourceParser;
  return (input, options) => {
    if (input === missing)
      return missingExit;
    if (descriptor.isConstructed(input))
      return sameExit;
    const result = (sourceParser ??= compile(descriptor.link.to))(input, options);
    return applyTransformation(result, input, descriptor.link.transformation, options);
  };
}
function makeParser(ast, compile, compileConstructorDefault, constructorDefault) {
  const descriptor = compileConstructorDefault ? getConstructorDescriptor(ast) : undefined;
  const parser = descriptor ? makeConstructorParser(descriptor, compile) : ast.getParser(compile, compileConstructorDefault);
  const checks = ast.checks;
  const links = constructorDefault ? ast.encoding ? [...ast.encoding, constructorDefault] : [constructorDefault] : ast.encoding;
  const encodingChecks = ast.encodingChecks;
  const astOptions = (checks ? checks[checks.length - 1].annotations : ast.annotations)?.["parseOptions"];
  if (!links && !checks && !encodingChecks) {
    if (!astOptions) {
      return parser;
    }
    return (input, options) => parser(input, mergeParseOptions(options, astOptions));
  }
  let encodingParsers;
  const parseLocal = (input, options) => {
    let result = parser(input, options);
    if (encodingChecks && !options.disableChecks) {
      if (effectIsExit(result)) {
        if (result._tag === "Success") {
          const output = result === sameExit ? input : result[args];
          if (input !== missing && output !== missing) {
            const issues = collectIssues(encodingChecks, input, undefined, ast, options);
            if (issues) {
              result = fail5(new Composite(ast, issues, input, options));
            }
          }
        }
      } else {
        result = flatMap2(result, (value) => {
          if (input !== missing && value !== missing) {
            const issues = collectIssues(encodingChecks, input, undefined, ast, options);
            if (issues) {
              return fail5(new Composite(ast, issues, input, options));
            }
          }
          return succeed5(value);
        });
      }
    }
    if (checks && !options.disableChecks) {
      if (effectIsExit(result)) {
        if (result._tag === "Success") {
          const value = result === sameExit ? input : result[args];
          if (value === missing)
            return result;
          const issues = collectIssues(checks, value, undefined, ast, options);
          if (issues) {
            result = fail5(new Composite(ast, issues, value, options));
          }
        }
      } else {
        result = flatMap2(result, (value) => {
          if (value !== missing) {
            const issues = collectIssues(checks, value, undefined, ast, options);
            if (issues) {
              return fail5(new Composite(ast, issues, value, options));
            }
          }
          return succeed5(value);
        });
      }
    }
    return result;
  };
  if (!links) {
    return astOptions ? (input, options) => parseLocal(input, mergeParseOptions(options, astOptions)) : parseLocal;
  }
  return (input, options) => {
    if (astOptions) {
      options = mergeParseOptions(options, astOptions);
    }
    const parsers = encodingParsers ??= links.map((link) => compile(link.to));
    let current = input;
    let result = parsers[parsers.length - 1](input, options);
    for (let i = links.length - 1;i >= 0; i--) {
      result = applyTransformation(result, current, links[i].transformation, options);
      if (i !== 0) {
        const next = parsers[i - 1];
        if (result._tag === "Success") {
          current = result[args];
          result = next(current, options);
        } else {
          result = flatMapEager2(result, (value) => {
            const nextResult = next(value, options);
            return nextResult === sameExit ? succeed6(value) : nextResult;
          });
        }
      }
    }
    if (result._tag === "Success") {
      const value = result[args];
      const local = parseLocal(value, options);
      return local === sameExit ? result : local;
    }
    result = catchCause2(result, (cause) => failCauseSync2(() => map5(cause, (issue) => new Encoding(ast, issue, input, options))));
    return flatMapEager2(result, (value) => {
      const local = parseLocal(value, options);
      return local === sameExit ? succeed6(value) : local;
    });
  };
}

// node_modules/effect/dist/internal/schema/schema.js
var TypeId8 = "~effect/Schema/Schema";
var SchemaProto = {
  [TypeId8]: TypeId8,
  pipe() {
    return pipeArguments(this, arguments);
  },
  annotate(annotations) {
    return this.rebuild(annotate(this.ast, annotations));
  },
  annotateKey(annotations) {
    return this.rebuild(annotateKey(this.ast, annotations));
  },
  check(...checks) {
    return this.rebuild(appendChecks(this.ast, checks));
  }
};
function make8(ast, options) {
  function Schema() {}
  const self2 = Object.defineProperties(Object.setPrototypeOf(Schema, SchemaProto), Object.getOwnPropertyDescriptors({
    ...options
  }));
  self2.ast = ast;
  self2.rebuild = (ast) => make8(ast, options);
  self2.makeEffect = makeEffect(self2);
  self2.make = make7(self2);
  self2.makeOption = makeOption(self2);
  return self2;
}

// node_modules/effect/dist/Struct.js
var omit = /* @__PURE__ */ dual(2, (self2, keys) => {
  return buildStruct(self2, (k, v) => !keys.includes(k) ? [k, v] : undefined);
});
var lambda = (f) => f;
function buildStruct(source, f) {
  const out = {};
  for (const k of Reflect.ownKeys(source)) {
    if (!Object.prototype.propertyIsEnumerable.call(source, k))
      continue;
    const res = f(k, source[k]);
    if (res) {
      const [nk, nv] = res;
      assignProperty(out, nk, nv);
    }
  }
  return out;
}

// node_modules/effect/dist/internal/schema/toEquivalence.js
var toEquivalence = /* @__PURE__ */ memoize((ast) => {
  return recur(ast, []);
});
function recur(ast, path) {
  const annotation = resolve(ast)?.["toEquivalence"];
  if (annotation) {
    return annotation(isDeclaration(ast) ? ast.typeParameters.map((tp) => recur(tp, path)) : []);
  }
  switch (ast._tag) {
    case "Never":
      return strictEqual();
    case "Declaration":
    case "Null":
    case "Undefined":
    case "Void":
    case "Unknown":
    case "Any":
    case "String":
    case "Number":
    case "Boolean":
    case "BigInt":
    case "Symbol":
    case "Literal":
    case "UniqueSymbol":
    case "ObjectKeyword":
    case "Enum":
    case "TemplateLiteral":
      return equals;
    case "Arrays": {
      const elements = ast.elements.map((e, i) => recur(e, [...path, i]));
      const len = ast.elements.length;
      const rest = ast.rest.map((r, i) => recur(r, [...path, len + i]));
      return make((a, b) => {
        if (!Array.isArray(a) || !Array.isArray(b)) {
          return false;
        }
        const len = a.length;
        if (len !== b.length) {
          return false;
        }
        let i = 0;
        for (;i < Math.min(len, ast.elements.length); i++) {
          if (!elements[i](a[i], b[i])) {
            return false;
          }
        }
        if (rest.length > 0) {
          const [head, ...tail] = rest;
          for (;i < len - tail.length; i++) {
            if (!head(a[i], b[i])) {
              return false;
            }
          }
          for (let j = 0;j < tail.length; j++) {
            if (!tail[j](a[i + j], b[i + j])) {
              return false;
            }
          }
        }
        return true;
      });
    }
    case "Objects": {
      if (ast.propertySignatures.length === 0 && ast.indexSignatures.length === 0) {
        return equals;
      }
      const propertySignatures = ast.propertySignatures.map((ps) => recur(ps.type, [...path, ps.name]));
      const indexSignatures = ast.indexSignatures.map((is) => recur(is.type, path));
      return make((a, b) => {
        if (!isObject(a) || !isObject(b)) {
          return false;
        }
        for (let i = 0;i < propertySignatures.length; i++) {
          const ps = ast.propertySignatures[i];
          const name = ps.name;
          const aHas = Object.hasOwn(a, name);
          const bHas = Object.hasOwn(b, name);
          if (isOptional(ps.type)) {
            if (aHas !== bHas) {
              return false;
            }
          }
          if (aHas && bHas && !propertySignatures[i](a[name], b[name])) {
            return false;
          }
        }
        for (let i = 0;i < indexSignatures.length; i++) {
          const is = ast.indexSignatures[i];
          const aKeys = getIndexSignatureKeys(a, is.parameter);
          const bKeys = getIndexSignatureKeys(b, is.parameter);
          if (aKeys.length !== bKeys.length)
            return false;
          for (let j = 0;j < aKeys.length; j++) {
            const key = aKeys[j];
            if (!Object.hasOwn(b, key) || !indexSignatures[i](a[key], b[key])) {
              return false;
            }
          }
        }
        return true;
      });
    }
    case "Union": {
      const types = toType(ast).types;
      const compiled = new Map(types.map((candidate, i) => [candidate, [_is(candidate), recur(ast.types[i], path)]]));
      return make((a, b) => {
        const candidates = getCandidates(a, types);
        for (let i = 0;i < candidates.length; i++) {
          const [is, equivalence] = compiled.get(candidates[i]);
          if (is(a) && is(b)) {
            return equivalence(a, b);
          }
        }
        return false;
      });
    }
    case "Suspend": {
      const get = memoizeThunk(() => recur(ast.thunk(), path));
      return make((a, b) => get()(a, b));
    }
  }
}

// node_modules/effect/dist/RegExp.js
var RegExp2 = globalThis.RegExp;
var escape = (string) => string.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&");

// node_modules/effect/dist/Schema.js
var TypeId9 = TypeId8;
function declareConstructor() {
  return (typeParameters, run, annotations) => {
    return make9(new Declaration(typeParameters.map(getAST), (typeParameters) => run(typeParameters.map((ast) => make9(ast))), annotations));
  };
}
function declare(is, annotations) {
  return declareConstructor()([], () => (input, ast, options) => is(input) ? succeed5(input) : fail5(new InvalidType(ast, input, options)), annotations);
}
function annotate2(annotations) {
  return (self2) => self2.annotate(annotations);
}
var is2 = is;
var make9 = make8;
function isSchema(u) {
  return hasProperty(u, TypeId9) && u[TypeId9] === TypeId9;
}
var optionalKey2 = /* @__PURE__ */ lambda((schema) => make9(optionalKey(schema.ast), {
  schema
}));
var optional2 = /* @__PURE__ */ lambda((self2) => {
  const schema = UndefinedOr(self2);
  return make9(optional(self2.ast), {
    schema
  });
});
var toType2 = /* @__PURE__ */ lambda((schema) => make9(toType(schema.ast), {
  schema
}));
var toEncoded2 = /* @__PURE__ */ lambda((schema) => make9(toEncoded(schema.ast), {
  schema
}));
function Literal2(literal) {
  const out = make9(new Literal(literal), {
    literal,
    transform(to) {
      return out.pipe(decodeTo2(Literal2(to), {
        decode: transform(() => to),
        encode: transform(() => literal)
      }));
    }
  });
  return out;
}
var Any2 = /* @__PURE__ */ make9(any);
var Unknown2 = /* @__PURE__ */ make9(unknown);
var Null2 = /* @__PURE__ */ make9(null_);
var Undefined2 = /* @__PURE__ */ make9(undefined_2);
var String5 = /* @__PURE__ */ make9(string2);
var Number5 = /* @__PURE__ */ make9(number2);
var Boolean3 = /* @__PURE__ */ make9(boolean);
function makeStruct(ast, fields) {
  return make9(ast, {
    fields,
    mapFields(f, options) {
      const fields = f(this.fields);
      return makeStruct(struct(fields, options?.unsafePreserveChecks ? this.ast.checks : undefined), fields);
    }
  });
}
function Struct(fields) {
  return makeStruct(struct(fields, undefined), fields);
}
function Record(key, value) {
  return make9(record(key.ast, value.ast), {
    key,
    value
  });
}
function StructWithRest(schema, records) {
  return make9(structWithRest(schema.ast, records.map(getAST)), {
    schema,
    records
  });
}
function makeTuple(ast, elements) {
  return make9(ast, {
    elements,
    mapElements(f, options) {
      const elements = f(this.elements);
      return makeTuple(tuple(elements, options?.unsafePreserveChecks ? this.ast.checks : undefined), elements);
    }
  });
}
function Tuple(elements) {
  return makeTuple(tuple(elements), elements);
}
var ArraySchema = /* @__PURE__ */ lambda((schema) => make9(new Arrays(false, [], [schema.ast]), {
  value: schema
}));
var NonEmptyArray = /* @__PURE__ */ lambda((schema) => make9(new Arrays(false, [schema.ast], [schema.ast]), {
  value: schema
}));
function makeUnion(ast, members) {
  return make9(ast, {
    members,
    mapMembers(f, options) {
      const members = f(this.members);
      return makeUnion(union2(members, this.ast.mode, options?.unsafePreserveChecks ? this.ast.checks : undefined), members);
    }
  });
}
function Union2(members, options) {
  return makeUnion(union2(members, options?.mode ?? "anyOf", undefined), members);
}
function Literals(literals) {
  const members = literals.map(Literal2);
  return make9(union2(members, "anyOf", undefined), {
    literals,
    members,
    mapMembers(f) {
      return Union2(f(this.members));
    },
    pick(literals) {
      return Literals(literals);
    },
    transform(to) {
      return Union2(members.map((member, index) => member.transform(to[index])));
    }
  });
}
var NullOr = /* @__PURE__ */ lambda((self2) => Union2([self2, Null2]));
var UndefinedOr = /* @__PURE__ */ lambda((self2) => Union2([self2, Undefined2]));
function suspend2(f) {
  return make9(new Suspend(() => f().ast));
}
function check(...checks) {
  return (self2) => self2.check(...checks);
}
function brand2(identifier) {
  return (schema) => make9(brand(schema.ast, identifier), {
    schema,
    identifier
  });
}
function decodeTo2(to, transformation) {
  return (from) => {
    return make9(decodeTo(from.ast, to.ast, transformation ? make6(transformation) : passthrough2()), {
      from,
      to
    });
  };
}
function withConstructorDefault2(defaultValue) {
  return (schema) => make9(withConstructorDefault(schema.ast, defaultValue), {
    schema
  });
}
function tag(literal) {
  return Literal2(literal).pipe(withConstructorDefault2(succeed5(literal)));
}
function TaggedStruct(value, fields) {
  return Struct({
    _tag: tag(value),
    ...fields
  });
}
function toTaggedUnion(tag) {
  return (self2) => {
    const cases = {};
    const discriminants = [];
    const discriminantKeys = new Set;
    const guards = {};
    const isAnyOf = (keys) => (value) => keys.includes(value[tag]);
    walk(self2);
    return Object.assign(self2, {
      cases,
      discriminants,
      isAnyOf,
      guards,
      match,
      matchOrElse
    });
    function walk(schema) {
      const ast = schema.ast;
      if (isUnion(ast) && "members" in schema && globalThis.Array.isArray(schema.members) && schema.members.every(isSchema)) {
        return schema.members.forEach(walk);
      }
      const sentinels = collectSentinels(ast);
      if (sentinels.length > 0) {
        const literal = sentinels.find((s) => s.key === tag)?.literal;
        if (isPropertyKey(literal)) {
          const key = typeof literal === "number" ? globalThis.String(literal) : literal;
          if (discriminantKeys.has(key)) {
            throw new globalThis.Error(`Duplicate discriminant: ${globalThis.String(literal)}`);
          }
          discriminantKeys.add(key);
          discriminants.push(literal);
          assignProperty(cases, literal, schema);
          assignProperty(guards, literal, is2(toType2(schema)));
          return;
        }
      }
      throw new globalThis.Error("No literal or unique symbol found");
    }
    function match() {
      if (arguments.length === 1) {
        const cases = arguments[0];
        return function(value) {
          const key = value[tag];
          const handler = Object.hasOwn(cases, key) ? cases[key] : undefined;
          return handler(value);
        };
      }
      const value = arguments[0];
      const cases = arguments[1];
      const key = value[tag];
      const handler = Object.hasOwn(cases, key) ? cases[key] : undefined;
      return handler(value);
    }
    function matchOrElse() {
      if (arguments.length === 2) {
        const cases = arguments[0];
        const orElse = arguments[1];
        return function(value) {
          const key = value[tag];
          const handler = Object.hasOwn(cases, key) ? cases[key] ?? orElse : orElse;
          return handler(value);
        };
      }
      const value = arguments[0];
      const cases = arguments[1];
      const orElse = arguments[2];
      const key = value[tag];
      const handler = Object.hasOwn(cases, key) ? cases[key] ?? orElse : orElse;
      return handler(value);
    }
  };
}
function instanceOf(constructor, annotations) {
  return declare((u) => u instanceof constructor, annotations);
}
function link() {
  return (encodeTo, transformation) => {
    return new Link(encodeTo.ast, make6(transformation));
  };
}
var makeFilter2 = makeFilter;
var TRIMMED_PATTERN = "^\\S[\\s\\S]*\\S$|^\\S$|^$";
function isTrimmed(annotations) {
  const regExp = new globalThis.RegExp(TRIMMED_PATTERN);
  return makeFilter2((s) => s.trim() === s, {
    expected: "a string with no leading or trailing whitespace",
    representation: {
      id: "effect/schema/isTrimmed",
      payload: null
    },
    toJsonSchema: () => ({
      pattern: regExp.source
    }),
    toCode: () => ({
      runtime: "Schema.isTrimmed()"
    }),
    arbitrary: {
      constraint: {
        patterns: [TRIMMED_PATTERN]
      }
    },
    ...annotations
  });
}
function isPattern2(regExp, annotations) {
  const source = regExp.source;
  const flags = regExp.flags;
  const runtimeRegExp = flags === "" ? `new RegExp(${format(source)})` : `new RegExp(${format(source)}, ${format(flags)})`;
  return isPattern(regExp, {
    toCode: () => ({
      runtime: `Schema.isPattern(${runtimeRegExp})`
    }),
    ...annotations
  });
}
function isBase64(annotations) {
  const regExp = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  return isPattern2(regExp, {
    expected: "a base64 encoded string",
    representation: {
      id: "effect/schema/isBase64",
      payload: null
    },
    toJsonSchema: () => ({
      pattern: regExp.source
    }),
    toCode: () => ({
      runtime: "Schema.isBase64()"
    }),
    ...annotations
  });
}
function isStartsWith(startsWith, annotations) {
  const formatted = JSON.stringify(startsWith);
  const regExp = new globalThis.RegExp(`^${escape(startsWith)}`);
  return makeFilter2((s) => s.startsWith(startsWith), {
    expected: `a string starting with ${formatted}`,
    representation: {
      id: "effect/schema/isStartsWith",
      payload: {
        startsWith
      }
    },
    toJsonSchema: () => ({
      pattern: regExp.source
    }),
    toCode: () => ({
      runtime: `Schema.isStartsWith(${format(startsWith)})`
    }),
    arbitrary: {
      constraint: {
        patterns: [regExp.source]
      }
    },
    ...annotations
  });
}
var Finite = /* @__PURE__ */ make9(finite);
function makeIsGreaterThan(options) {
  const gt = isGreaterThan(options.order);
  const formatter = options.formatter ?? format;
  return (exclusiveMinimum, annotations) => {
    return makeFilter2((input) => gt(input, exclusiveMinimum), {
      expected: `a value greater than ${formatter(exclusiveMinimum)}`,
      arbitrary: {
        constraint: {
          ordered: {
            order: options.order,
            minimum: exclusiveMinimum,
            exclusiveMinimum: true
          }
        }
      },
      ...options.annotate?.(exclusiveMinimum),
      ...annotations
    });
  };
}
function makeIsGreaterThanOrEqualTo(options) {
  const gte = isGreaterThanOrEqualTo(options.order);
  const formatter = options.formatter ?? format;
  return (minimum, annotations) => {
    return makeFilter2((input) => gte(input, minimum), {
      expected: `a value greater than or equal to ${formatter(minimum)}`,
      arbitrary: {
        constraint: {
          ordered: {
            order: options.order,
            minimum
          }
        }
      },
      ...options.annotate?.(minimum),
      ...annotations
    });
  };
}
function makeIsLessThanOrEqualTo(options) {
  const lte = isLessThanOrEqualTo(options.order);
  const formatter = options.formatter ?? format;
  return (maximum, annotations) => {
    return makeFilter2((input) => lte(input, maximum), {
      expected: `a value less than or equal to ${formatter(maximum)}`,
      arbitrary: {
        constraint: {
          ordered: {
            order: options.order,
            maximum
          }
        }
      },
      ...options.annotate?.(maximum),
      ...annotations
    });
  };
}
function makeIsBetween(deriveOptions) {
  const greaterThanOrEqualTo = isGreaterThanOrEqualTo(deriveOptions.order);
  const greaterThan = isGreaterThan(deriveOptions.order);
  const lessThanOrEqualTo = isLessThanOrEqualTo(deriveOptions.order);
  const lessThan = isLessThan(deriveOptions.order);
  const formatter = deriveOptions.formatter ?? format;
  return (options, annotations) => {
    const gte = options.exclusiveMinimum ? greaterThan : greaterThanOrEqualTo;
    const lte = options.exclusiveMaximum ? lessThan : lessThanOrEqualTo;
    return makeFilter2((input) => gte(input, options.minimum) && lte(input, options.maximum), {
      expected: `a value between ${formatter(options.minimum)}${options.exclusiveMinimum ? " (excluded)" : ""} and ${formatter(options.maximum)}${options.exclusiveMaximum ? " (excluded)" : ""}`,
      arbitrary: {
        constraint: {
          ordered: {
            order: deriveOptions.order,
            minimum: options.minimum,
            maximum: options.maximum,
            ...options.exclusiveMinimum && {
              exclusiveMinimum: true
            },
            ...options.exclusiveMaximum && {
              exclusiveMaximum: true
            }
          }
        }
      },
      ...deriveOptions.annotate?.(options),
      ...annotations
    });
  };
}
function encodeNumberPayload(number) {
  if (!globalThis.Number.isFinite(number)) {
    throw new globalThis.RangeError(`Expected a finite number, got ${format(number)}`);
  }
  return number;
}
var isGreaterThan3 = /* @__PURE__ */ makeIsGreaterThan({
  order: Number2,
  annotate: (exclusiveMinimum) => ({
    representation: {
      id: "effect/schema/isGreaterThan",
      payload: {
        exclusiveMinimum: encodeNumberPayload(exclusiveMinimum)
      }
    },
    toJsonSchema: () => ({
      exclusiveMinimum
    }),
    toCode: () => ({
      runtime: `Schema.isGreaterThan(${format(exclusiveMinimum)})`
    })
  })
});
var isGreaterThanOrEqualTo3 = /* @__PURE__ */ makeIsGreaterThanOrEqualTo({
  order: Number2,
  annotate: (minimum) => ({
    representation: {
      id: "effect/schema/isGreaterThanOrEqualTo",
      payload: {
        minimum: encodeNumberPayload(minimum)
      }
    },
    toJsonSchema: () => ({
      minimum
    }),
    toCode: () => ({
      runtime: `Schema.isGreaterThanOrEqualTo(${format(minimum)})`
    })
  })
});
var isLessThanOrEqualTo3 = /* @__PURE__ */ makeIsLessThanOrEqualTo({
  order: Number2,
  annotate: (maximum) => ({
    representation: {
      id: "effect/schema/isLessThanOrEqualTo",
      payload: {
        maximum: encodeNumberPayload(maximum)
      }
    },
    toJsonSchema: () => ({
      maximum
    }),
    toCode: () => ({
      runtime: `Schema.isLessThanOrEqualTo(${format(maximum)})`
    })
  })
});
var isBetween2 = /* @__PURE__ */ makeIsBetween({
  order: Number2,
  annotate: (options) => {
    const exclusiveMinimum = options.exclusiveMinimum ? true : undefined;
    const exclusiveMaximum = options.exclusiveMaximum ? true : undefined;
    const payload = {
      minimum: encodeNumberPayload(options.minimum),
      maximum: encodeNumberPayload(options.maximum),
      ...exclusiveMinimum && {
        exclusiveMinimum
      },
      ...exclusiveMaximum && {
        exclusiveMaximum
      }
    };
    return {
      representation: {
        id: "effect/schema/isBetween",
        payload
      },
      toJsonSchema: () => ({
        [exclusiveMinimum ? "exclusiveMinimum" : "minimum"]: options.minimum,
        [exclusiveMaximum ? "exclusiveMaximum" : "maximum"]: options.maximum
      }),
      toCode: () => ({
        runtime: `Schema.isBetween({ minimum: ${format(options.minimum)}, maximum: ${format(options.maximum)}, exclusiveMinimum: ${format(exclusiveMinimum)}, exclusiveMaximum: ${format(exclusiveMaximum)} })`
      })
    };
  }
});
function isInt(annotations) {
  return makeFilter2((n) => globalThis.Number.isSafeInteger(n), {
    expected: "an integer",
    representation: {
      id: "effect/schema/isInt",
      payload: null
    },
    toJsonSchema: () => ({
      type: "integer"
    }),
    toCode: () => ({
      runtime: "Schema.isInt()"
    }),
    arbitrary: {
      constraint: {
        integer: true
      }
    },
    ...annotations
  });
}
var Int = /* @__PURE__ */ Number5.check(/* @__PURE__ */ isInt());
function isMinLength(minLength, annotations) {
  minLength = Math.max(0, Math.floor(minLength));
  return makeFilter2((input) => input.length >= minLength, {
    expected: `a value with a length of at least ${minLength}`,
    representation: {
      id: "effect/schema/isMinLength",
      payload: {
        minLength
      }
    },
    toJsonSchema: ({
      type
    }) => type === "array" ? {
      minItems: minLength
    } : {
      minLength
    },
    toCode: () => ({
      runtime: `Schema.isMinLength(${minLength})`
    }),
    [STRUCTURAL_ANNOTATION_KEY]: true,
    arbitrary: {
      constraint: {
        minLength
      }
    },
    ...annotations
  });
}
function isNonEmpty(annotations) {
  return isMinLength(1, annotations);
}
var getErrorOptionsKey = (options) => (options?.includeStack === true ? 1 : 0) | (options?.excludeCause === true ? 2 : 0);
var getErrorOptions = (key) => {
  switch (key) {
    case 0:
      return;
    case 1:
      return {
        includeStack: true
      };
    case 2:
      return {
        excludeCause: true
      };
    case 3:
      return {
        includeStack: true,
        excludeCause: true
      };
  }
};
var defectSchemaCache = [];
function Defect(options) {
  const key = getErrorOptionsKey(options);
  const cached = defectSchemaCache[key];
  if (cached !== undefined) {
    return cached;
  }
  const schema = Json2.pipe(decodeTo2(Unknown2, defectFromJson(getErrorOptions(key))));
  defectSchemaCache[key] = schema;
  return schema;
}
var RegExp3 = /* @__PURE__ */ instanceOf(globalThis.RegExp, {
  representation: {
    id: "effect/schema/RegExp",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.RegExp`,
    Type: `globalThis.RegExp`
  }),
  expected: "RegExp",
  toCodecJson: () => link()(Struct({
    source: String5,
    flags: String5
  }), transformOrFail2({
    decode: (e, options) => try_2({
      try: () => new globalThis.RegExp(e.source, e.flags),
      catch: () => new InvalidValue({
        expected: "valid RegExp source and flags"
      }, e, options)
    }),
    encode: (regExp) => succeed5({
      source: regExp.source,
      flags: regExp.flags
    })
  })),
  toArbitrary: () => (fc) => fc.tuple(fc.constantFrom(".", ".*", "\\d+", "\\w+", "[a-z]+", "[A-Z]+", "[0-9]+", "^[a-zA-Z0-9]+$", "^\\d{4}-\\d{2}-\\d{2}$"), fc.uniqueArray(fc.constantFrom("g", "i", "m", "s", "u", "y"), {
    minLength: 0,
    maxLength: 6
  }).map((flags) => flags.join(""))).map(([source, flags]) => new globalThis.RegExp(source, flags)),
  toEquivalence: () => (a, b) => a.source === b.source && a.flags === b.flags
});
var URLString = /* @__PURE__ */ String5.annotate({
  expected: "a string that will be decoded as a URL"
});
var URL2 = /* @__PURE__ */ instanceOf(globalThis.URL, {
  representation: {
    id: "effect/schema/URL",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.URL`,
    Type: `globalThis.URL`
  }),
  expected: "URL",
  toCodecJson: () => link()(URLString, urlFromString),
  toArbitrary: () => (fc) => fc.webUrl().map((s) => new globalThis.URL(s)),
  toEquivalence: () => (a, b) => a.toString() === b.toString()
});
function dateArbitraryConstraints(ordered, base, toDate) {
  const out = {
    ...base
  };
  if (ordered?.minimum !== undefined) {
    const minimum = toDate === undefined ? ordered.minimum : toDate(ordered.minimum);
    const nextMin = ordered.exclusiveMinimum ? new globalThis.Date(minimum.getTime() + 1) : minimum;
    if (out.min === undefined || nextMin.getTime() > out.min.getTime()) {
      out.min = nextMin;
    }
  }
  if (ordered?.maximum !== undefined) {
    const maximum = toDate === undefined ? ordered.maximum : toDate(ordered.maximum);
    const nextMax = ordered.exclusiveMaximum ? new globalThis.Date(maximum.getTime() - 1) : maximum;
    if (out.max === undefined || nextMax.getTime() < out.max.getTime()) {
      out.max = nextMax;
    }
  }
  return out;
}
var File2 = /* @__PURE__ */ instanceOf(globalThis.File, {
  representation: {
    id: "effect/schema/File",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.File`,
    Type: `globalThis.File`
  }),
  expected: "File",
  toCodecJson: () => link()(Struct({
    data: String5.check(isBase64()),
    type: String5,
    name: String5,
    lastModified: Int
  }), transformOrFail2({
    decode: (e, options) => match2(decodeBase64(e.data), {
      onFailure: () => fail5(new InvalidValue({
        expected: "a valid Base64 string"
      }, e.data, options)),
      onSuccess: (bytes) => {
        const buffer = new globalThis.Uint8Array(bytes);
        return succeed5(new globalThis.File([buffer], e.name, {
          type: e.type,
          lastModified: e.lastModified
        }));
      }
    }),
    encode: (file, options) => tryPromise2({
      try: async () => {
        const bytes = new globalThis.Uint8Array(await file.arrayBuffer());
        return {
          data: encodeBase64(bytes),
          type: file.type,
          name: file.name,
          lastModified: file.lastModified
        };
      },
      catch: () => new InvalidValue({
        expected: "a readable File"
      }, file, options)
    })
  }))
});
var FormData2 = /* @__PURE__ */ instanceOf(globalThis.FormData, {
  representation: {
    id: "effect/schema/FormData",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.FormData`,
    Type: `globalThis.FormData`
  }),
  expected: "FormData",
  toCodecJson: () => link()(ArraySchema(Tuple([String5, Union2([Struct({
    _tag: tag("String"),
    value: String5
  }), Struct({
    _tag: tag("File"),
    value: File2
  })])])), transformOrFail2({
    decode: (e) => {
      const out = new globalThis.FormData;
      for (const [key, entry] of e) {
        out.append(key, entry.value);
      }
      return succeed5(out);
    },
    encode: (formData) => {
      return succeed5(globalThis.Array.from(formData.entries()).map(([key, value]) => {
        if (typeof value === "string") {
          return [key, {
            _tag: "String",
            value
          }];
        } else {
          return [key, {
            _tag: "File",
            value
          }];
        }
      }));
    }
  }))
});
var URLSearchParams2 = /* @__PURE__ */ instanceOf(globalThis.URLSearchParams, {
  representation: {
    id: "effect/schema/URLSearchParams",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.URLSearchParams`,
    Type: `globalThis.URLSearchParams`
  }),
  expected: "URLSearchParams",
  toCodecJson: () => link()(String5.annotate({
    expected: "a query string that will be decoded as URLSearchParams"
  }), transform2({
    decode: (e) => new globalThis.URLSearchParams(e),
    encode: (params) => params.toString()
  }))
});
var Trimmed = /* @__PURE__ */ String5.check(/* @__PURE__ */ isTrimmed());
var Trim = /* @__PURE__ */ String5.annotate({
  expected: "a string that will be decoded as a trimmed string"
}).pipe(/* @__PURE__ */ decodeTo2(Trimmed, /* @__PURE__ */ trim3()));
var Base64String = /* @__PURE__ */ String5.annotate({
  expected: "a base64 encoded string that will be decoded as Uint8Array",
  format: "byte",
  contentEncoding: "base64"
});
var Uint8Array2 = /* @__PURE__ */ instanceOf(globalThis.Uint8Array, {
  representation: {
    id: "effect/schema/Uint8Array",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.Uint8Array`,
    Type: `globalThis.Uint8Array`
  }),
  expected: "Uint8Array",
  toCodecJson: () => link()(Base64String, uint8ArrayFromBase64String),
  toArbitrary: () => (fc) => fc.uint8Array()
});
var DateTimeUtc = /* @__PURE__ */ declare((u) => isDateTime2(u) && isUtc2(u), {
  representation: {
    id: "effect/schema/DateTimeUtc",
    payload: null
  },
  toCode: () => ({
    runtime: `Schema.DateTimeUtc`,
    Type: `DateTime.Utc`,
    importDeclarations: [`import * as DateTime from "effect/DateTime"`]
  }),
  expected: "DateTime.Utc",
  toCodecJson: () => link()(String5, dateTimeUtcFromString),
  toArbitrary: () => (fc, ctx) => fc.date(dateArbitraryConstraints(ctx?.constraint?.ordered?.order === Order2 ? ctx.constraint.ordered : undefined, {
    noInvalidDate: true
  }, toDateUtc2)).map((date) => fromDateUnsafe2(date)),
  toFormatter: () => (utc) => utc.toString(),
  toEquivalence: () => Equivalence2
});
var immerable = /* @__PURE__ */ globalThis.Symbol.for("immer-draftable");
var payloadToken = {};
function makeClass(Inherited, identifier, struct2, annotations, proto) {
  const getClassSchema = getClassSchemaFactory(struct2, identifier, annotations);
  const ClassTypeId = getClassTypeId(identifier);
  const out = class extends Inherited {
    constructor(...[input, options]) {
      const internalOptions = options;
      const payload = internalOptions?.["~payload"];
      const value = payload?.token === payloadToken ? payload.value : struct2.make(input ?? {}, options);
      super(value, {
        ...options,
        disableChecks: true,
        "~payload": {
          token: payloadToken,
          value
        }
      });
    }
    static [TypeId9] = TypeId9;
    get [ClassTypeId]() {
      return ClassTypeId;
    }
    static [immerable] = true;
    static identifier = identifier;
    static fields = struct2.fields;
    static get ast() {
      return getClassSchema(this).ast;
    }
    static pipe() {
      return pipeArguments(this, arguments);
    }
    static rebuild(ast) {
      return getClassSchema(this).rebuild(ast);
    }
    static make(input, options) {
      return new this(input, options);
    }
    static makeOption(input, options) {
      return makeOption(getClassSchema(this))(input ?? {}, options);
    }
    static makeEffect(input, options) {
      return getClassSchema(this).makeEffect(input ?? {}, options);
    }
    static annotate(annotations) {
      return this.rebuild(annotate(this.ast, annotations));
    }
    static annotateKey(annotations) {
      return this.rebuild(annotateKey(this.ast, annotations));
    }
    static check(...checks) {
      return this.rebuild(appendChecks(this.ast, checks));
    }
    static extend(identifier2) {
      return (schema, annotations) => {
        const extension = isStruct(schema) ? schema : Struct(schema);
        const fields = {
          ...struct2.fields,
          ...extension.fields
        };
        const ast = struct(fields, struct2.ast.checks, {
          identifier: identifier2
        });
        return makeClass(this, identifier2, makeStruct(appendChecks(ast, extension.ast.checks), fields), annotations, proto);
      };
    }
    static mapFields(f, options) {
      return struct2.mapFields(f, options);
    }
  };
  if (proto !== undefined) {
    Object.assign(out.prototype, proto(identifier));
  }
  return out;
}
function getClassTransformation(self2) {
  return new Transformation(transform((input) => new self2(input, {
    "~payload": {
      token: payloadToken,
      value: input
    }
  })), passthrough());
}
function getClassTypeId(identifier) {
  return `~effect/Schema/Class/${identifier}`;
}
function getClassSchemaFactory(from, identifier, annotations) {
  let memo;
  return (self2) => {
    if (memo !== undefined) {
      return memo;
    }
    const ClassTypeId = getClassTypeId(identifier);
    const isClassValue = (input) => input instanceof self2 || hasProperty(input, ClassTypeId);
    const transformation = getClassTransformation(self2);
    const to = make9(new Declaration([from.ast], () => (input, ast, options) => {
      return isClassValue(input) ? succeed5(input) : fail5(new InvalidType(ast, input, options));
    }, {
      identifier,
      [CONSTRUCTOR_ANNOTATION_KEY]: ([from]) => ({
        isConstructed: isClassValue,
        link: new Link(from, transformation)
      }),
      toCodec: ([from]) => new Link(from.ast, transformation),
      toArbitrary: ([from]) => () => ({
        arbitrary: from.arbitrary.map((args) => new self2(args)),
        terminal: from.terminal?.map((args) => new self2(args))
      }),
      toFormatter: ([from]) => (t) => `${self2.identifier}(${from(t)})`,
      [SENTINELS_ANNOTATION_KEY]: collectSentinels(from.ast),
      ...annotations
    }));
    return memo = decodeTo2(to, transformation)(from);
  };
}
function isStruct(schema) {
  return isSchema(schema);
}
var Class3 = (identifier) => (schema, annotations) => {
  const struct = isStruct(schema) ? schema : Struct(schema);
  return makeClass(Class2, identifier, struct, annotations, (identifier) => ({
    toString() {
      return `${identifier}(${format({
        ...this
      })})`;
    }
  }));
};
var Error3 = (identifier) => (schema, annotations) => {
  const struct = isStruct(schema) ? schema : Struct(schema);
  const self2 = makeClass(Error2, identifier, struct, annotations, (identifier) => ({
    name: identifier
  }));
  return self2;
};
var TaggedError3 = (identifier) => {
  return (tagValue, schema, annotations) => {
    const struct = isStruct(schema) ? schema.mapFields((fields) => ({
      _tag: tag(tagValue),
      ...fields
    }), {
      unsafePreserveChecks: true
    }) : TaggedStruct(tagValue, schema);
    return Error3(identifier ?? tagValue)(struct, annotations);
  };
};
function toEquivalence2(schema) {
  return toEquivalence(schema.ast);
}
var Json2 = /* @__PURE__ */ make9(/* @__PURE__ */ annotate(Json, {
  toCode: () => ({
    runtime: "Schema.Json",
    Type: "Schema.Json"
  })
}));
// node_modules/@opencode/schema/dist/schema.js
var PositiveInt = Int.check(isGreaterThan3(0));
var NonNegativeInt = Int.check(isGreaterThanOrEqualTo3(0));
var RelativePath = String5.pipe(brand2("RelativePath"));
var AbsolutePath = String5.pipe(brand2("AbsolutePath"));
var optional3 = (schema) => optionalKey2(schema).pipe(decodeTo2(optional2(toType2(schema)), {
  decode: passthrough({ strict: false }),
  encode: transformOptional(filter((value) => value !== undefined))
}));
var statics = (methods) => (schema) => Object.assign(schema, methods(schema));
var DateTimeUtcFromMillis = Finite.pipe(decodeTo2(DateTimeUtc, {
  decode: transform((value) => makeUnsafe3(value)),
  encode: transform((value) => toEpochMillis2(value))
}));

// node_modules/@opencode/schema/dist/identifier.js
var length = 26;
var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
var lastTimestamp = 0;
var counter = 0;
function ascending() {
  return create(false);
}
function descending() {
  return create(true);
}
function create(descending, timestamp = Date.now()) {
  if (timestamp !== lastTimestamp) {
    lastTimestamp = timestamp;
    counter = 0;
  }
  counter++;
  const current = BigInt(timestamp) * 0x1000n + BigInt(counter);
  const value = descending ? ~current : current;
  const time = Array.from({ length: 6 }, (_, index) => Number(value >> BigInt(40 - 8 * index) & 0xffn).toString(16).padStart(2, "0")).join("");
  const bytes = crypto.getRandomValues(new Uint8Array(length - 12));
  return time + Array.from(bytes, (byte) => chars[byte % 62]).join("");
}
// node_modules/@opencode/schema/dist/project-id.js
var ProjectID = String5.pipe(brand2("Project.ID"), statics((schema) => ({ global: schema.make("global") })));

// node_modules/@opencode/schema/dist/workspace-id.js
var WorkspaceID = String5.check(isStartsWith("wrk")).pipe(brand2("Workspace.ID"), statics((schema) => {
  const create = () => schema.make("wrk_" + ascending());
  return {
    ascending: (id) => {
      if (!id)
        return create();
      if (!id.startsWith("wrk"))
        throw new Error(`ID ${id} does not start with wrk`);
      return schema.make(id);
    },
    create
  };
}));

// node_modules/@opencode/schema/dist/location.js
var Ref2 = Struct({
  directory: AbsolutePath,
  workspaceID: optional3(WorkspaceID)
}).annotate({ identifier: "Location.Ref" });
var PublicRef = Struct(omit(Ref2.fields, ["workspaceID"])).annotate({
  identifier: "Location.PublicRef"
});

class Info extends Class3("Location.Info")({
  directory: AbsolutePath,
  workspaceID: optional3(WorkspaceID),
  project: Struct({
    id: ProjectID,
    directory: AbsolutePath,
    canonical: AbsolutePath
  })
}) {
}
var PublicInfo = Struct(omit(Info.fields, ["workspaceID"])).annotate({
  identifier: "Location.PublicInfo"
});

// node_modules/@opencode/schema/dist/event.js
var ID = String5.check(isStartsWith("evt_")).pipe(brand2("Event.ID"), statics((schema) => ({ create: () => schema.make("evt_" + ascending()) })));
var Seq = Int.check(isGreaterThanOrEqualTo3(0)).pipe(brand2("Event.Seq"));
var Version = Int.check(isGreaterThanOrEqualTo3(1)).pipe(brand2("Event.Version"));
var DurableEnvelope = Struct({ aggregateID: String5, seq: Seq, version: Version });
function durable(input) {
  const data = Struct(input.schema);
  const durable = Struct({
    aggregateID: DurableEnvelope.fields.aggregateID,
    seq: DurableEnvelope.fields.seq,
    version: Literal2(input.durable.version).pipe(decodeTo2(toType2(Version), transform2({
      decode: () => Version.make(input.durable.version),
      encode: () => input.durable.version
    })))
  });
  return Struct({
    id: ID,
    created: Finite,
    metadata: optional3(Record(String5, Unknown2)),
    type: Literal2(input.type),
    durable,
    location: optional3(Ref2),
    data
  }).annotate({ identifier: input.identifier ?? input.type }).pipe(statics(() => ({
    type: input.type,
    durability: "durable",
    durable: input.durable,
    data
  })));
}
function ephemeral(input) {
  const data = Struct(input.schema);
  return Struct({
    id: ID,
    created: Finite,
    metadata: optional3(Record(String5, Unknown2)),
    type: Literal2(input.type),
    location: optional3(Ref2),
    data
  }).annotate({ identifier: input.identifier ?? input.type }).pipe(statics(() => ({
    type: input.type,
    durability: "ephemeral",
    durable: undefined,
    data
  })));
}
function inventory(...definitions) {
  return Object.freeze(definitions);
}
// node_modules/@opencode/schema/dist/integration-id.js
var IntegrationID = String5.pipe(brand2("Integration.ID"));
var IntegrationMethodID = String5.pipe(brand2("Integration.MethodID"));
// node_modules/@opencode/schema/dist/form.js
var IDSchema = String5.check(isStartsWith("frm_")).pipe(brand2("Form.ID"));
var ID2 = IDSchema.pipe(statics((schema) => ({ create: (id) => schema.make(id ?? "frm_" + ascending()) })));
var Metadata = Record(String5, Unknown2).annotate({ identifier: "Form.Metadata" });
var Option = Struct({
  value: String5,
  label: String5,
  description: String5.pipe(optional3)
}).annotate({ identifier: "Form.Option" });
var When = Struct({
  key: String5,
  op: Literals(["eq", "neq"]),
  value: Union2([String5, Number5, Boolean3])
}).annotate({ identifier: "Form.When" });
var FieldBase = {
  key: String5,
  title: String5.pipe(optional3),
  description: String5.pipe(optional3),
  required: Boolean3.pipe(optional3),
  hidden: Boolean3.pipe(optional3).annotate({
    description: "Skip the interactive authentication prompt and use the default unless an answer is supplied"
  }),
  when: ArraySchema(When).pipe(optional3)
};
var StringField = Struct({
  ...FieldBase,
  type: Literal2("string"),
  format: Literals(["email", "uri", "date", "date-time"]).pipe(optional3),
  minLength: NonNegativeInt.pipe(optional3),
  maxLength: NonNegativeInt.pipe(optional3),
  pattern: String5.pipe(optional3),
  placeholder: String5.pipe(optional3),
  default: String5.pipe(optional3),
  options: ArraySchema(Option).pipe(optional3),
  custom: Boolean3.pipe(optional3)
}).annotate({ identifier: "Form.StringField" });
var NumberField = Struct({
  ...FieldBase,
  type: Literal2("number"),
  minimum: Number5.pipe(optional3),
  maximum: Number5.pipe(optional3),
  default: Number5.pipe(optional3)
}).annotate({ identifier: "Form.NumberField" });
var IntegerField = Struct({
  ...FieldBase,
  type: Literal2("integer"),
  minimum: Number5.pipe(optional3),
  maximum: Number5.pipe(optional3),
  default: Number5.pipe(optional3)
}).annotate({ identifier: "Form.IntegerField" });
var BooleanField = Struct({
  ...FieldBase,
  type: Literal2("boolean"),
  default: Boolean3.pipe(optional3)
}).annotate({ identifier: "Form.BooleanField" });
var MultiselectField = Struct({
  ...FieldBase,
  type: Literal2("multiselect"),
  options: ArraySchema(Option),
  minItems: NonNegativeInt.pipe(optional3),
  maxItems: NonNegativeInt.pipe(optional3),
  custom: Boolean3.pipe(optional3),
  default: ArraySchema(String5).pipe(optional3)
}).annotate({ identifier: "Form.MultiselectField" });
var ExternalField = Struct({
  key: String5,
  type: Literal2("external"),
  url: String5,
  title: String5.pipe(optional3),
  description: String5.pipe(optional3)
}).annotate({ identifier: "Form.ExternalField" });
var Field = Union2([
  StringField,
  NumberField,
  IntegerField,
  BooleanField,
  MultiselectField,
  ExternalField
]).pipe(toTaggedUnion("type"), annotate2({ identifier: "Form.Field" }));
var Fields = NonEmptyArray(Field).annotate({ identifier: "Form.Fields" });
var InfoBase = {
  id: ID2,
  sessionID: String5,
  title: String5,
  metadata: Metadata.pipe(optional3)
};
var Info2 = Struct({
  ...InfoBase,
  fields: Fields
}).annotate({ identifier: "Form.Info" });
var Value = Union2([String5, Number5, Boolean3, ArraySchema(String5)]).annotate({
  identifier: "Form.Value"
});
var Answer = Record(String5, Value).annotate({ identifier: "Form.Answer" });
var State = Union2([
  Struct({ status: Literal2("pending") }),
  Struct({ status: Literal2("answered"), answer: Answer }),
  Struct({ status: Literal2("cancelled"), message: String5.pipe(optional3) })
]).pipe(toTaggedUnion("status")).annotate({ identifier: "Form.State" });
var Detail = Struct({
  ...Info2.fields,
  state: State
}).annotate({ identifier: "Form.Detail" });
var Reply = Struct({
  answer: Answer
}).annotate({ identifier: "Form.Reply" });
var Created = ephemeral({ type: "form.created", schema: { form: Info2 } });
var Replied = ephemeral({ type: "form.replied", schema: { id: ID2, sessionID: String5, answer: Answer } });
var Cancelled = ephemeral({ type: "form.cancelled", schema: { id: ID2, sessionID: String5 } });
var Event = { Created, Replied, Cancelled, Definitions: inventory(Created, Replied, Cancelled) };

// node_modules/@opencode/schema/dist/credential.js
var ID3 = String5.pipe(brand2("Credential.ID"), statics((schema) => ({ create: () => schema.make("cred_" + ascending()) })));
var Updated = ephemeral({
  type: "credential.updated",
  schema: {}
});
var Switched = ephemeral({
  type: "credential.switched",
  schema: { integrationID: IntegrationID, credentialID: NullOr(ID3) }
});
var Event2 = {
  Updated,
  Switched,
  Definitions: inventory(Updated, Switched)
};
var OAuth = Struct({
  type: Literal2("oauth"),
  methodID: IntegrationMethodID,
  refresh: String5,
  access: String5,
  expires: NonNegativeInt,
  metadata: optional3(Record(String5, Unknown2))
}).annotate({ identifier: "Credential.OAuth" });
var Key = Struct({
  type: Literal2("key"),
  key: String5,
  metadata: optional3(Record(String5, Unknown2)),
  configuration: optional3(Answer)
}).annotate({ identifier: "Credential.Key" });
var External = Struct({
  type: Literal2("external"),
  methodID: IntegrationMethodID,
  metadata: optional3(Record(String5, Unknown2))
}).annotate({ identifier: "Credential.External" });
var Value2 = Union2([OAuth, Key, External]).pipe(toTaggedUnion("type")).annotate({ identifier: "Credential.Value" });
var Entry = Struct({
  id: ID3,
  integrationID: IntegrationID,
  label: String5,
  active: Boolean3,
  value: Value2
}).annotate({ identifier: "Credential.Entry" });
var CreateInput = Struct({
  id: optional3(ID3),
  integrationID: IntegrationID,
  label: optional3(String5),
  value: Value2,
  activate: optional3(Boolean3)
}).annotate({ identifier: "Credential.CreateInput" });

// node_modules/@opencode/schema/dist/connection.js
var Status = Struct({
  status: Literals(["needs_auth"]),
  message: String5,
  url: optional3(String5)
}).annotate({ identifier: "Connection.Status" });
var CredentialInfo = Struct({
  type: Literal2("credential"),
  id: ID3,
  label: String5,
  method: Literals(["key", "oauth", "external"]),
  status: optional3(Status)
}).annotate({ identifier: "Connection.CredentialInfo" });
var EnvInfo = Struct({
  type: Literal2("env"),
  name: String5,
  status: optional3(Status)
}).annotate({ identifier: "Connection.EnvInfo" });
var Info3 = Union2([CredentialInfo, EnvInfo]).pipe(toTaggedUnion("type")).annotate({ identifier: "Connection.Info" });

// node_modules/@opencode/schema/dist/integration.js
var ID4 = IntegrationID;
var MethodID = IntegrationMethodID;
var OAuthMethod = Struct({
  id: MethodID,
  type: Literal2("oauth"),
  label: String5,
  form: optional3(Fields)
}).annotate({ identifier: "Integration.OAuthMethod" });
var CommandMethod = Struct({
  id: MethodID,
  type: Literal2("command"),
  label: String5,
  command: ArraySchema(String5)
}).annotate({ identifier: "Integration.CommandMethod" });
var KeyMethod = Struct({
  type: Literal2("key"),
  label: optional3(String5),
  form: optional3(Fields)
}).annotate({ identifier: "Integration.KeyMethod" });
var ExternalMethod = Struct({
  id: MethodID,
  type: Literal2("external"),
  label: String5,
  form: optional3(Fields)
}).annotate({ identifier: "Integration.ExternalMethod" });
var EnvMethod = Struct({
  type: Literal2("env"),
  names: ArraySchema(String5)
}).annotate({ identifier: "Integration.EnvMethod" });
var Method = Union2([OAuthMethod, CommandMethod, KeyMethod, ExternalMethod, EnvMethod]).pipe(toTaggedUnion("type")).annotate({ identifier: "Integration.Method" });
var Updated2 = ephemeral({
  type: "integration.updated",
  schema: {}
});
var Event3 = { Updated: Updated2, Definitions: inventory(Updated2) };
var Ref3 = Struct({
  id: ID4,
  name: String5,
  metadata: optional3(Record(String5, Any2))
}).annotate({ identifier: "Integration.Ref" });
var Info4 = Struct({
  id: ID4,
  name: String5,
  metadata: optional3(Record(String5, Any2)),
  methods: ArraySchema(Method),
  connections: ArraySchema(Info3)
}).annotate({ identifier: "Integration.Info" });
var AttemptID = String5.pipe(brand2("Integration.AttemptID"), statics((schema) => ({ create: () => schema.make("con_" + ascending()) })));
var AttemptTime = Struct({
  created: Number5,
  expires: Number5
});

class Attempt extends Class3("Integration.Attempt")({
  attemptID: AttemptID,
  url: String5,
  instructions: String5,
  mode: Literals(["auto", "code"]),
  time: AttemptTime
}) {
}
var AttemptStatus = Union2([
  Struct({ status: Literal2("pending"), time: AttemptTime }),
  Struct({ status: Literal2("complete"), time: AttemptTime }),
  Struct({ status: Literal2("failed"), message: String5, time: AttemptTime }),
  Struct({ status: Literal2("expired"), time: AttemptTime })
]).pipe(toTaggedUnion("status")).annotate({ identifier: "Integration.AttemptStatus" });
var CommandAttempt = Struct({
  attemptID: AttemptID,
  time: AttemptTime
}).annotate({ identifier: "Integration.CommandAttempt" });
var CommandAttemptStatus = Union2([
  Struct({ status: Literal2("pending"), message: optional3(String5), time: AttemptTime }),
  Struct({ status: Literal2("complete"), time: AttemptTime }),
  Struct({ status: Literal2("failed"), message: String5, time: AttemptTime }),
  Struct({ status: Literal2("expired"), time: AttemptTime })
]).pipe(toTaggedUnion("status")).annotate({ identifier: "Integration.CommandAttemptStatus" });

// node_modules/@opencode/schema/dist/provider.js
var ID5 = String5.pipe(brand2("Provider.ID"), statics((schema) => ({
  opencode: schema.make("opencode"),
  anthropic: schema.make("anthropic"),
  openai: schema.make("openai"),
  google: schema.make("google"),
  googleVertex: schema.make("google-vertex"),
  githubCopilot: schema.make("github-copilot"),
  amazonBedrock: schema.make("amazon-bedrock"),
  azure: schema.make("azure"),
  openrouter: schema.make("openrouter"),
  mistral: schema.make("mistral"),
  gitlab: schema.make("gitlab")
})));
var Updated3 = ephemeral({ type: "provider.updated", schema: {} });
var Event4 = { Updated: Updated3, Definitions: inventory(Updated3) };
var Package = String5;
var Activation = Literals(["auto", "enabled", "disabled"]);
var Compaction = Union2([
  Struct({ type: Literal2("summary") }),
  Struct({ type: Literal2("native") })
]).pipe(toTaggedUnion("type")).annotate({ identifier: "Provider.Compaction" });
var Transport = Literals(["http", "websocket"]).annotate({ identifier: "Provider.Transport" });
var Settings = StructWithRest(Struct({
  timeout: Union2([Finite, Literal2(false)]).pipe(optional3),
  headerTimeout: Union2([Finite, Literal2(false)]).pipe(optional3),
  chunkTimeout: Union2([Finite, Literal2(false)]).pipe(optional3),
  compaction: Compaction.pipe(optional3),
  transport: Transport.pipe(optional3)
}), [Record(String5, Any2)]).annotate({ identifier: "Provider.Settings" });
var Overlays = {
  settings: Settings.pipe(optional3),
  headers: Record(String5, String5).pipe(optional3),
  body: Record(String5, Any2).pipe(optional3)
};
var Request3 = Struct({
  settings: Settings.pipe(withConstructorDefault2(succeed5({}))),
  headers: Record(String5, String5),
  body: Record(String5, Any2)
}).annotate({ identifier: "Provider.Request" });
var Info5 = Struct({
  id: ID5,
  canonical: ID5.pipe(optional3),
  integrationID: ID4.pipe(optional3),
  name: String5,
  activation: Activation,
  package: Package,
  ...Overlays
}).annotate({ identifier: "Provider.Info" }).pipe(statics(() => ({
  empty: (id) => ({ id, name: id, activation: "auto", package: "" })
})));
// node_modules/@opencode/schema/dist/money.js
var USD = Finite.pipe(brand2("Money.USD"), annotate2({ identifier: "Money.USD" }), statics((schema) => ({ zero: schema.make(0) })));
var USDPerMillionTokens = Finite.pipe(brand2("Money.USDPerMillionTokens"), annotate2({ identifier: "Money.USDPerMillionTokens" }), statics((schema) => ({ zero: schema.make(0) })));

// node_modules/@opencode/schema/dist/model.js
var ID6 = String5.pipe(brand2("Model.ID"));
var Updated4 = ephemeral({ type: "model.updated", schema: {} });
var Event5 = { Updated: Updated4, Definitions: inventory(Updated4) };
var VariantID = String5.pipe(brand2("Model.VariantID"));
var Ref4 = Struct({
  id: ID6,
  providerID: ID5,
  variant: VariantID.pipe(optional3)
}).annotate({ identifier: "Model.Ref" }).pipe(statics((schema) => ({
  parse: (input) => {
    const providerEnd = input.indexOf("/");
    if (providerEnd <= 0)
      throw new Error(`Invalid model reference: ${input}`);
    const providerID = input.slice(0, providerEnd);
    const variantStart = input.indexOf("#", providerEnd + 1);
    const id = input.slice(providerEnd + 1, variantStart === -1 ? undefined : variantStart);
    const variant = variantStart === -1 ? undefined : input.slice(variantStart + 1);
    if (!id || providerID.includes("#") || variant !== undefined && (!variant || variant.includes("#")))
      throw new Error(`Invalid model reference: ${input}`);
    return schema.make({
      providerID: ID5.make(providerID),
      id: ID6.make(id),
      ...variant ? { variant: VariantID.make(variant) } : {}
    });
  }
})));
var Family = String5.pipe(brand2("Model.Family"));
var ReasoningField = Union2([
  Literals(["reasoning", "reasoning_content", "reasoning_text"]),
  String5
]).annotate({ identifier: "Model.ReasoningField" });
var MaxTokensField = Literals(["max_completion_tokens", "max_tokens"]).annotate({
  identifier: "Model.MaxTokensField"
});
var Settings2 = StructWithRest(Struct({
  compaction: Compaction.pipe(optional3)
}), [Record(String5, Any2)]).annotate({ identifier: "Model.Settings" });
var Overlays2 = {
  settings: Settings2.pipe(optional3),
  headers: Record(String5, String5).pipe(optional3),
  body: Record(String5, Any2).pipe(optional3)
};
var Compatibility = Struct({
  reasoningField: ReasoningField.pipe(optional3),
  requireReasoning: Boolean3.pipe(optional3),
  maxTokensField: MaxTokensField.pipe(optional3),
  requireFinishReason: Boolean3.pipe(optional3),
  requireAssistantAfterTool: Boolean3.pipe(optional3),
  supportsPromptCacheKey: Boolean3.pipe(optional3),
  supportsThinkingBlockBinding: Boolean3.pipe(optional3),
  supportsEffortUpdates: Boolean3.pipe(optional3)
}).annotate({ identifier: "Model.Compatibility" });
var Capabilities = Struct({
  tools: Boolean3,
  input: ArraySchema(String5),
  output: ArraySchema(String5)
}).annotate({ identifier: "Model.Capabilities" }).pipe(statics(() => ({
  default: () => ({ tools: true, input: ["text", "image"], output: ["text"] })
})));
var Cost = Struct({
  tier: Struct({
    type: tag("context"),
    size: Int
  }).pipe(optional3),
  input: USDPerMillionTokens,
  output: USDPerMillionTokens,
  cache: Struct({
    read: USDPerMillionTokens,
    write: USDPerMillionTokens
  })
}).annotate({ identifier: "Model.Cost" });
var Variant = Struct({
  id: VariantID,
  ...Overlays2
}).annotate({ identifier: "Model.Variant" });
var Info6 = Struct({
  id: ID6,
  modelID: ID6,
  providerID: ID5,
  canonical: ID5.pipe(optional3),
  family: Family.pipe(optional3),
  name: String5,
  compatibility: Compatibility.pipe(optional3),
  package: Package.pipe(optional3),
  ...Overlays2,
  capabilities: Capabilities,
  variants: ArraySchema(Variant),
  time: Struct({
    released: Finite
  }),
  cost: ArraySchema(Cost),
  status: Literals(["alpha", "beta", "deprecated", "active"]),
  enabled: Boolean3,
  limit: Struct({
    context: Int,
    input: Int.pipe(optional3),
    output: Int
  })
}).annotate({ identifier: "Model.Info" }).pipe(statics(() => ({
  default: (providerID, id) => ({
    id,
    modelID: id,
    providerID,
    name: id,
    capabilities: Capabilities.default(),
    variants: [],
    time: { released: 0 },
    cost: [],
    status: "active",
    enabled: true,
    limit: { context: 200000, output: 32000 }
  })
})));
// node_modules/@opencode/schema/dist/session-id.js
var SessionID = String5.check(isStartsWith("ses")).pipe(brand2("SessionID"), statics((schema) => {
  const create = () => schema.make("ses_" + descending());
  return {
    create,
    descending: (id) => id === undefined ? create() : schema.make(id)
  };
}));

// node_modules/@opencode/schema/dist/permission.js
var ID7 = String5.check(isStartsWith("per")).pipe(brand2("Permission.ID"), statics((schema) => ({ create: (id) => schema.make(id ?? "per_" + ascending()) })));
var Source = Union2([
  Struct({
    type: Literal2("tool"),
    messageID: String5,
    id: String5
  })
]).annotate({ identifier: "Permission.Source" });
var RequestFields = {
  sessionID: SessionID,
  action: String5,
  resources: ArraySchema(String5),
  save: ArraySchema(String5).pipe(optional3),
  metadata: Record(String5, Unknown2).pipe(optional3),
  source: Source.pipe(optional3),
  message: String5.pipe(optional3)
};
var Request4 = Struct({
  id: ID7,
  ...RequestFields
}).annotate({ identifier: "Permission.Request" });
var Reply2 = Literals(["once", "always", "reject"]).annotate({ identifier: "Permission.Reply" });
var Asked = ephemeral({ type: "permission.asked", schema: Request4.fields });
var Replied2 = ephemeral({
  type: "permission.replied",
  schema: {
    sessionID: SessionID,
    requestID: ID7,
    reply: Reply2
  }
});
var Event6 = { Asked, Replied: Replied2, Definitions: inventory(Asked, Replied2) };
var Effect = Literals(["allow", "deny", "ask"]).annotate({ identifier: "Permission.Effect" });
var Rule = Struct({
  action: String5,
  resource: String5,
  effect: Effect
}).annotate({ identifier: "Permission.Rule" });
var Ruleset = ArraySchema(Rule).annotate({ identifier: "Permission.Ruleset" });

// node_modules/@opencode/schema/dist/agent.js
var Updated5 = ephemeral({ type: "agent.updated", schema: {} });
var ID8 = String5.pipe(brand2("Agent.ID"));
var Name = String5.pipe(brand2("Agent.Name"));
var Color = String5.annotate({ identifier: "Agent.Color" });
var Info7 = Struct({
  id: ID8,
  name: Name,
  model: Ref4.pipe(optional3),
  request: Request3,
  system: String5.pipe(optional3),
  description: String5.pipe(optional3),
  mode: Literals(["subagent", "primary", "all"]),
  hidden: Boolean3,
  color: Color.pipe(optional3),
  steps: PositiveInt.pipe(optional3),
  permissions: Ruleset
}).annotate({ identifier: "Agent.Info" }).pipe(statics(() => ({
  default: (id) => ({
    id,
    name: Name.make(id),
    request: { settings: {}, headers: {}, body: {} },
    mode: "primary",
    hidden: false,
    permissions: [
      { action: "*", resource: "*", effect: "allow" },
      { action: "read", resource: "*.env", effect: "ask" },
      { action: "read", resource: "*.env.*", effect: "ask" },
      { action: "read", resource: "*.env.example", effect: "allow" }
    ]
  })
})));
var Event7 = {
  Updated: Updated5,
  Definitions: inventory(Updated5)
};
// node_modules/@opencode/schema/dist/command.js
var Updated6 = ephemeral({ type: "command.updated", schema: {} });
var Info8 = Struct({
  name: String5,
  description: String5.pipe(optional3)
}).annotate({ identifier: "Command.Info" });
var Event8 = {
  Updated: Updated6,
  Definitions: inventory(Updated6)
};
// node_modules/@opencode/schema/dist/mcp.js
class TimeoutConfig extends Class3("Mcp.TimeoutConfig")({
  startup: PositiveInt.pipe(optional3).annotate({
    description: "Maximum time in milliseconds to establish and initialize the MCP server."
  }),
  catalog: PositiveInt.pipe(optional3).annotate({
    description: "Maximum time in milliseconds to wait for MCP discovery requests such as tools/list and prompts/list."
  }),
  execution: PositiveInt.pipe(optional3).annotate({
    description: "Maximum time in milliseconds to wait for MCP tool and prompt execution."
  })
}) {
}
var Protocol = Literals(["legacy", "auto", "2026-07-28"]).annotate({
  identifier: "Mcp.Protocol",
  description: 'MCP protocol negotiation. "legacy" (default) opens with the initialize handshake and speaks protocol revisions up to 2025-11-25. "auto" probes for the 2026-07-28 revision and falls back to legacy when the server does not support it. "2026-07-28" requires that revision and fails otherwise.'
});

class LocalConfig extends Class3("Mcp.LocalConfig")({
  type: Literal2("local"),
  command: String5.pipe(ArraySchema),
  cwd: String5.pipe(optional3).annotate({
    description: "Working directory for the MCP server process. Relative paths resolve from the workspace directory."
  }),
  environment: Record(String5, String5).pipe(optional3),
  disabled: Boolean3.pipe(optional3),
  codemode: Boolean3.pipe(optional3).annotate({
    description: "Expose this server's tools through Code Mode. Defaults to true."
  }),
  timeout: TimeoutConfig.pipe(optional3),
  protocol: Protocol.pipe(optional3)
}) {
}

class OAuthConfig extends Class3("Mcp.OAuthConfig")({
  client_id: String5.pipe(optional3),
  client_secret: String5.pipe(optional3),
  scope: String5.pipe(optional3),
  callback_port: Int.check(isBetween2({ minimum: 1, maximum: 65535 })).pipe(optional3),
  redirect_uri: String5.pipe(optional3),
  auth_server_metadata_url: String5.pipe(optional3).annotate({
    description: "URL of the OAuth or OpenID Connect authorization server metadata document. Set when the MCP server does not publish protected resource metadata that names its authorization server."
  })
}) {
}

class RemoteConfig extends Class3("Mcp.RemoteConfig")({
  type: Literal2("remote"),
  url: String5,
  headers: Record(String5, String5).pipe(optional3),
  oauth: Union2([OAuthConfig, Literal2(false)]).pipe(optional3),
  disabled: Boolean3.pipe(optional3),
  codemode: Boolean3.pipe(optional3).annotate({
    description: "Expose this server's tools through Code Mode. Defaults to true."
  }),
  timeout: TimeoutConfig.pipe(optional3),
  protocol: Protocol.pipe(optional3)
}) {
}
var ServerConfig = Union2([LocalConfig, RemoteConfig]).pipe(toTaggedUnion("type"));
var Connected = Struct({ status: Literal2("connected") }).annotate({
  identifier: "Mcp.Status.Connected"
});
var Pending = Struct({ status: Literal2("pending") }).annotate({
  identifier: "Mcp.Status.Pending"
});
var Disabled = Struct({ status: Literal2("disabled") }).annotate({
  identifier: "Mcp.Status.Disabled"
});
var Failed = Struct({ status: Literal2("failed"), error: String5 }).annotate({
  identifier: "Mcp.Status.Failed"
});
var NeedsAuth = Struct({ status: Literal2("needs_auth"), error: String5 }).annotate({
  identifier: "Mcp.Status.NeedsAuth"
});
var Status2 = Union2([Connected, Pending, Disabled, Failed, NeedsAuth]).pipe(toTaggedUnion("status"));
var Server = Struct({
  name: String5,
  status: Status2,
  integrationID: optional3(IntegrationID)
}).annotate({ identifier: "Mcp.Server" });
var Resource2 = Struct({
  server: String5,
  name: String5,
  uri: String5,
  description: optional3(String5),
  mimeType: optional3(String5)
}).annotate({ identifier: "Mcp.Resource" });
var ResourceTemplate = Struct({
  server: String5,
  name: String5,
  uriTemplate: String5,
  description: optional3(String5),
  mimeType: optional3(String5)
}).annotate({ identifier: "Mcp.ResourceTemplate" });
var ResourceCatalog = Struct({
  resources: ArraySchema(Resource2),
  templates: ArraySchema(ResourceTemplate)
}).annotate({ identifier: "Mcp.ResourceCatalog" });
var ResourceContentPart = Union2([
  Struct({
    type: Literal2("text"),
    uri: String5,
    text: String5,
    mimeType: optional3(String5)
  }),
  Struct({
    type: Literal2("blob"),
    uri: String5,
    blob: String5,
    mimeType: optional3(String5)
  })
]).pipe(toTaggedUnion("type"), annotate2({ identifier: "Mcp.ResourceContentPart" }));
var ResourceContent = Struct({
  server: String5,
  uri: String5,
  contents: ArraySchema(ResourceContentPart)
}).annotate({ identifier: "Mcp.ResourceContent" });
// node_modules/@opencode/schema/dist/pty.js
var IDSchema2 = String5.check(isStartsWith("pty")).pipe(brand2("PtyID"));
var ID9 = IDSchema2.pipe(statics((schema) => {
  const create = () => schema.make("pty_" + ascending());
  return {
    create,
    ascending: (id) => id === undefined ? create() : schema.make(id)
  };
}));
var Info9 = Struct({
  id: ID9,
  title: String5,
  command: String5,
  args: ArraySchema(String5),
  cwd: String5,
  status: Literals(["running", "exited"]),
  pid: NonNegativeInt,
  exitCode: optional3(NonNegativeInt)
}).annotate({ identifier: "Pty" });
var Created2 = ephemeral({ type: "pty.created", schema: { info: Info9 } });
var Updated7 = ephemeral({ type: "pty.updated", schema: { info: Info9 } });
var Exited = ephemeral({ type: "pty.exited", schema: { id: ID9, exitCode: NonNegativeInt } });
var Deleted = ephemeral({ type: "pty.deleted", schema: { id: ID9 } });
var Event9 = { Created: Created2, Updated: Updated7, Exited, Deleted, Definitions: inventory(Created2, Updated7, Exited, Deleted) };
var CreateInput2 = Struct({
  command: optional3(String5),
  args: optional3(ArraySchema(String5)),
  cwd: optional3(String5),
  title: optional3(String5),
  env: optional3(Record(String5, String5))
});
var UpdateInput = Struct({
  title: optional3(String5),
  size: optional3(Struct({
    rows: PositiveInt,
    cols: PositiveInt
  }))
});
// node_modules/@opencode/schema/dist/project.js
var ID10 = ProjectID;
var Vcs = String5.check(isPattern2(/^[a-z][a-z0-9._-]*$/)).annotate({
  identifier: "Project.Vcs"
});
var Current = Struct({
  id: ID10,
  directory: AbsolutePath,
  canonical: AbsolutePath
}).annotate({ identifier: "Project.Current" });
var Icon = Struct({
  url: optional3(String5),
  override: optional3(String5),
  color: optional3(String5)
}).annotate({ identifier: "Project.Icon" });
var Commands = Struct({
  start: optional3(String5.annotate({ description: "Startup script to run when creating a new workspace (worktree)" }))
}).annotate({ identifier: "Project.Commands" });
var Time = Struct({
  created: NonNegativeInt,
  updated: NonNegativeInt,
  active: NonNegativeInt
}).annotate({ identifier: "Project.Time" });
var Info10 = Struct({
  id: ID10,
  canonical: AbsolutePath,
  vcs: optional3(Vcs),
  name: optional3(String5),
  icon: optional3(Icon),
  commands: optional3(Commands),
  time: Time,
  sandboxes: ArraySchema(String5)
}).annotate({ identifier: "Project" });
var UpdateInput2 = Struct({
  projectID: ID10,
  canonical: optional3(AbsolutePath),
  name: optional3(String5),
  icon: optional3(Icon),
  commands: optional3(Commands)
}).annotate({ identifier: "Project.UpdateInput" });
var Updated8 = ephemeral({ type: "project.updated", schema: Info10.fields });
var Event10 = { Updated: Updated8, Definitions: inventory(Updated8) };
// node_modules/@opencode/schema/dist/llm.js
var FinishReason = Literals(["stop", "length", "tool-calls", "content-filter", "error", "unknown"]);
// node_modules/@opencode/schema/dist/tool.js
var CallID = String5.pipe(brand2("Tool.CallID"));

class Error4 extends TaggedError3()("Tool.Error", {
  message: String5,
  error: optional2(Defect()),
  metadata: optional2(Record(String5, Unknown2))
}) {
}
var TextContent = Struct({
  type: Literal2("text"),
  text: String5
}).annotate({ identifier: "Tool.TextContent" });
var FileContent = Struct({
  type: Literal2("file"),
  uri: String5,
  mime: String5,
  name: optional2(String5)
}).annotate({ identifier: "Tool.FileContent" });
var Content = Union2([TextContent, FileContent]).pipe(toTaggedUnion("type")).annotate({ identifier: "Tool.Content" });

// node_modules/@opencode/schema/dist/session-metadata.js
var SessionMetadata = Record(String5, Json2).annotate({
  identifier: "Session.Metadata"
});
// node_modules/@opencode/schema/dist/session-provider-context.js
var Provenance = Struct({
  providerID: ID5,
  provider: String5,
  modelID: String5,
  route: String5,
  protocol: String5,
  endpoint: String5
}).annotate({ identifier: "Session.ProviderContext.Provenance" });
var Info11 = Struct({
  version: Literal2(1),
  provenance: Provenance,
  messages: Json2
}).annotate({ identifier: "Session.ProviderContext" });
// node_modules/@opencode/schema/dist/skill.js
var ID11 = String5.pipe(brand2("Skill.ID"));
var Name2 = String5.pipe(brand2("Skill.Name"));
var DirectorySource = Struct({
  type: tag("directory"),
  path: AbsolutePath
}).annotate({ identifier: "Skill.DirectorySource" });
var UrlSource = Struct({
  type: tag("url"),
  url: String5
}).annotate({ identifier: "Skill.UrlSource" });
var Info12 = Struct({
  id: ID11,
  name: Name2,
  description: String5.pipe(optional3),
  autoinvoke: Boolean3.pipe(optional3),
  path: AbsolutePath,
  content: String5
}).annotate({ identifier: "Skill.Info" });
var Updated9 = ephemeral({ type: "skill.updated", schema: {} });
var Event11 = { Updated: Updated9, Definitions: inventory(Updated9) };
var EmbeddedSource = Struct({
  type: tag("embedded"),
  skill: suspend2(() => Info12)
}).annotate({ identifier: "Skill.EmbeddedSource" });
var Source2 = Object.assign(Union2([DirectorySource, UrlSource, EmbeddedSource]).pipe(toTaggedUnion("type"), annotate2({ identifier: "Skill.Source" })), {
  equals: (a, b) => {
    if (a.type !== b.type)
      return false;
    if (a.type === "directory" && b.type === "directory")
      return a.path === b.path;
    if (a.type === "url" && b.type === "url")
      return a.url === b.url;
    if (a.type === "embedded" && b.type === "embedded")
      return a.skill.id === b.skill.id;
    return false;
  },
  key: (source) => source.type === "directory" ? `directory:${source.path}` : source.type === "url" ? `url:${source.url}` : `embedded:${source.skill.id}`
});

// node_modules/@opencode/schema/dist/prompt.js
var PromptMention = Struct({
  start: Finite,
  end: Finite,
  text: String5
}).annotate({ identifier: "Prompt.Mention" });
var FileSource = Union2([
  Struct({ type: Literal2("inline") }),
  Struct({ type: Literal2("uri"), uri: String5 })
]).pipe(toTaggedUnion("type")).annotate({ identifier: "Prompt.FileSource" });
var Base64 = String5.check(isPattern2(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/)).annotate({ identifier: "Prompt.Base64" });
var FileAttachment = Struct({
  data: Base64,
  mime: String5,
  source: FileSource,
  name: String5.pipe(optional3),
  description: String5.pipe(optional3),
  mention: PromptMention.pipe(optional3)
}).annotate({ identifier: "Prompt.FileAttachment" }).pipe(statics((schema) => ({
  create: (input) => schema.make({
    data: input.data,
    mime: input.mime,
    source: input.source,
    name: input.name,
    description: input.description,
    mention: input.mention
  })
})));
var AgentAttachment = Struct({
  name: String5,
  mention: PromptMention.pipe(optional3)
}).annotate({ identifier: "Prompt.AgentAttachment" });
var SkillAttachment = Struct({
  id: ID11,
  name: Name2,
  text: String5.pipe(optional3),
  mention: PromptMention.pipe(optional3)
}).annotate({ identifier: "Prompt.SkillAttachment" });
var Prompt = Struct({
  text: String5,
  files: ArraySchema(FileAttachment).pipe(optional3),
  agents: ArraySchema(AgentAttachment).pipe(optional3),
  skills: ArraySchema(SkillAttachment).pipe(optional3)
}).annotate({ identifier: "Prompt" }).pipe(statics((schema) => ({
  equivalence: toEquivalence2(schema),
  fromUserMessage: (input) => schema.make({
    text: input.text,
    ...input.files === undefined ? {} : { files: input.files },
    ...input.agents === undefined ? {} : { agents: input.agents },
    ...input.skills === undefined ? {} : { skills: input.skills }
  })
})));
// node_modules/@opencode/schema/dist/shell.js
var IDSchema3 = String5.check(isStartsWith("sh_")).pipe(brand2("Shell.ID"));
var ID12 = IDSchema3.pipe(statics((schema) => {
  const create = () => schema.make("sh_" + ascending());
  return {
    create,
    ascending: (id) => id === undefined ? create() : schema.make(id)
  };
}));
var Status3 = Literals(["running", "exited", "timeout", "killed"]);
var Time2 = Struct({
  started: Finite.annotate({ description: "Start time in milliseconds since the Unix epoch" }),
  completed: optional3(Finite).annotate({
    description: "Completion time in milliseconds since the Unix epoch"
  })
});
var Metadata2 = Record(String5, Unknown2);
var Info13 = Struct({
  id: ID12,
  status: Status3,
  command: String5,
  cwd: String5,
  shell: String5,
  file: String5,
  pid: optional3(NonNegativeInt),
  exit: optional3(Finite),
  signal: optional3(String5),
  metadata: Metadata2,
  time: Time2
}).annotate({ identifier: "Shell.Info" });
var Created3 = ephemeral({ type: "shell.created", schema: { info: Info13 } });
var Exited2 = ephemeral({ type: "shell.exited", schema: { id: ID12, exit: optional3(Finite), status: Status3 } });
var Deleted2 = ephemeral({ type: "shell.deleted", schema: { id: ID12 } });
var Event12 = { Created: Created3, Exited: Exited2, Deleted: Deleted2, Definitions: inventory(Created3, Exited2, Deleted2) };
var CreateInput3 = Struct({
  command: String5,
  cwd: optional3(String5),
  timeout: optional3(NonNegativeInt),
  metadata: optional3(Metadata2)
});
var OutputInput = Struct({
  cursor: optional3(NonNegativeInt),
  limit: optional3(NonNegativeInt)
});
var Output = Struct({
  output: String5,
  cursor: NonNegativeInt,
  size: NonNegativeInt,
  truncated: Boolean3
});
// node_modules/@opencode/schema/dist/session-error.js
var Error5 = Struct({
  type: String5,
  message: String5,
  status: Int.check(isBetween2({ minimum: 100, maximum: 599 })).pipe(optional3),
  response: Struct({ body: String5 }).pipe(optional3)
}).annotate({ identifier: "Session.StructuredError" });
// node_modules/@opencode/schema/dist/snapshot.js
var ID13 = String5.pipe(brand2("Snapshot.ID"));
// node_modules/@opencode/schema/dist/token-usage.js
var Info14 = Struct({
  input: Finite,
  output: Finite,
  reasoning: Finite,
  cache: Struct({
    read: Finite,
    write: Finite
  })
}).annotate({ identifier: "TokenUsage.Info" });

// node_modules/@opencode/schema/dist/session-message.js
var ID14 = String5.check(isStartsWith("msg_")).pipe(brand2("Session.Message.ID"), statics((schema) => ({
  create: () => schema.make("msg_" + ascending()),
  fromEvent: (eventID) => schema.make(eventID.replace(/^evt_/, "msg_"))
})));
var Base3 = {
  id: ID14,
  metadata: Record(String5, Unknown2).pipe(optional3),
  time: Struct({ created: DateTimeUtcFromMillis })
};
var ProviderState = Record(String5, Unknown2).annotate({
  identifier: "Session.Message.ProviderState"
});
var AgentSelected = Struct({
  ...Base3,
  type: tag("agent-switched"),
  agent: ID8,
  previous: ID8.pipe(optional3)
}).annotate({ identifier: "Session.Message.AgentSelected" });
var ModelSelected = Struct({
  ...Base3,
  type: tag("model-switched"),
  model: Ref4,
  previous: Ref4.pipe(optional3)
}).annotate({ identifier: "Session.Message.ModelSelected" });
var LocationSwitched = Struct({
  ...Base3,
  type: tag("location-switched"),
  location: Ref2,
  projectID: ID10.pipe(optional3),
  subpath: RelativePath.pipe(optional3),
  previous: Struct({
    location: Ref2,
    projectID: ID10.pipe(optional3),
    subpath: RelativePath.pipe(optional3)
  }).pipe(optional3)
}).annotate({ identifier: "Session.Message.LocationSwitched" });
var User = Struct({
  ...Base3,
  text: Prompt.fields.text,
  files: Prompt.fields.files,
  agents: Prompt.fields.agents,
  skills: Prompt.fields.skills,
  type: tag("user")
}).annotate({ identifier: "Session.Message.User" });
var Synthetic = Struct({
  ...Base3,
  text: String5,
  description: String5.pipe(optional3),
  type: tag("synthetic")
}).annotate({ identifier: "Session.Message.Synthetic" });
var System = Struct({
  ...Base3,
  type: tag("system"),
  text: String5,
  description: String5.pipe(optional3)
}).annotate({ identifier: "Session.Message.System" });
var Skill = Struct({
  ...Base3,
  type: tag("skill"),
  skill: ID11,
  name: Name2,
  text: String5
}).annotate({ identifier: "Session.Message.Skill" });
var Shell = Struct({
  ...Base3,
  type: tag("shell"),
  shellID: ID12,
  command: String5,
  status: Status3,
  exit: Number5.pipe(optional3),
  output: Output.pipe(optional3),
  time: Struct({
    created: DateTimeUtcFromMillis,
    completed: DateTimeUtcFromMillis.pipe(optional3)
  })
}).annotate({ identifier: "Session.Message.Shell" });
var ToolStateStreaming = Struct({
  status: tag("streaming"),
  input: String5
}).annotate({ identifier: "Session.Message.ToolState.Streaming" });
var ToolStateRunning = Struct({
  status: tag("running"),
  input: Record(String5, Unknown2),
  metadata: Record(String5, Json2)
}).annotate({ identifier: "Session.Message.ToolState.Running" });
var ToolStateCompleted = Struct({
  status: tag("completed"),
  input: Record(String5, Unknown2),
  content: NonEmptyArray(Content),
  metadata: Record(String5, Json2).pipe(optional3)
}).annotate({ identifier: "Session.Message.ToolState.Completed" });
var ToolStateError = Struct({
  status: tag("error"),
  input: Record(String5, Unknown2),
  error: Error5,
  content: NonEmptyArray(Content).pipe(optional3),
  metadata: Record(String5, Json2).pipe(optional3)
}).annotate({ identifier: "Session.Message.ToolState.Error" });
var ToolState = Union2([ToolStateStreaming, ToolStateRunning, ToolStateCompleted, ToolStateError]).pipe(toTaggedUnion("status"));
var AssistantTool = Struct({
  type: tag("tool"),
  id: String5,
  name: String5,
  executed: Boolean3.pipe(optional3),
  providerState: ProviderState.pipe(optional3),
  providerResultState: ProviderState.pipe(optional3),
  state: ToolState,
  time: Struct({
    created: DateTimeUtcFromMillis,
    ran: DateTimeUtcFromMillis.pipe(optional3),
    completed: DateTimeUtcFromMillis.pipe(optional3)
  })
}).annotate({ identifier: "Session.Message.Assistant.Tool" });
var AssistantText = Struct({
  type: tag("text"),
  text: String5,
  state: ProviderState.pipe(optional3)
}).annotate({ identifier: "Session.Message.Assistant.Text" });
var AssistantReasoning = Struct({
  type: tag("reasoning"),
  text: String5,
  state: ProviderState.pipe(optional3),
  time: Struct({
    created: DateTimeUtcFromMillis,
    completed: DateTimeUtcFromMillis.pipe(optional3)
  }).pipe(optional3)
}).annotate({ identifier: "Session.Message.Assistant.Reasoning" });
var AssistantContent = Union2([AssistantText, AssistantReasoning, AssistantTool]).pipe(toTaggedUnion("type"));
var AssistantContentEncoded = toEncoded2(AssistantContent).annotate({
  identifier: "Session.Message.AssistantContent.Encoded"
});
var AssistantRetry = Struct({
  attempt: PositiveInt,
  at: DateTimeUtcFromMillis,
  error: Error5
}).annotate({ identifier: "Session.Message.Assistant.Retry" });
var Assistant = Struct({
  ...Base3,
  type: tag("assistant"),
  agent: ID8,
  model: Ref4,
  content: AssistantContent.pipe(ArraySchema),
  snapshot: Struct({
    start: ID13.pipe(optional3),
    end: ID13.pipe(optional3),
    files: ArraySchema(RelativePath).pipe(optional3)
  }).pipe(optional3),
  finish: FinishReason.pipe(optional3),
  rawFinish: String5.pipe(optional3),
  providerState: ProviderState.pipe(optional3),
  cost: USD.pipe(optional3),
  tokens: Info14.pipe(optional3),
  error: Error5.pipe(optional3),
  retry: AssistantRetry.pipe(optional3),
  time: Struct({
    created: DateTimeUtcFromMillis,
    streamed: DateTimeUtcFromMillis.pipe(optional3),
    completed: DateTimeUtcFromMillis.pipe(optional3)
  })
}).annotate({ identifier: "Session.Message.Assistant" });
var CompactionBase = { type: tag("compaction"), ...Base3 };
var CompactionUsage = {
  cost: USD.pipe(optional3),
  tokens: Info14.pipe(optional3)
};
var CompactionRunning = Struct({
  ...CompactionBase,
  status: tag("running"),
  reason: Literals(["auto", "manual"]),
  summary: String5,
  recent: String5
}).annotate({ identifier: "Session.Message.Compaction.Running" });
var CompactionCompleted = Struct({
  ...CompactionBase,
  status: tag("completed"),
  reason: Literals(["auto", "manual"]),
  model: Ref4.pipe(optional3),
  providerState: ProviderState.pipe(optional3),
  summary: String5,
  recent: String5,
  providerContext: Info11.pipe(optional3),
  ...CompactionUsage
}).annotate({ identifier: "Session.Message.Compaction.Completed" });
var CompactionFailed = Struct({
  ...CompactionBase,
  status: tag("failed"),
  reason: Literals(["auto", "manual"]),
  error: Error5,
  ...CompactionUsage
}).annotate({ identifier: "Session.Message.Compaction.Failed" });
var Compaction2 = Union2([CompactionRunning, CompactionCompleted, CompactionFailed]).pipe(toTaggedUnion("status"), annotate2({ identifier: "Session.Message.Compaction" }));
var Idle = Struct({
  ...Base3,
  type: tag("idle"),
  outcome: Literals(["succeeded", "failed", "interrupted"])
}).annotate({ identifier: "Session.Message.Idle" });
var Info15 = Union2([
  AgentSelected,
  ModelSelected,
  LocationSwitched,
  User,
  Synthetic,
  System,
  Skill,
  Shell,
  Assistant,
  Compaction2,
  Idle
]).annotate({ identifier: "Session.Message.Info" });
// node_modules/@opencode/schema/dist/file-diff.js
var Info16 = Struct({
  file: String5,
  patch: String5,
  additions: NonNegativeInt,
  deletions: NonNegativeInt,
  status: Literals(["added", "deleted", "modified"])
}).annotate({ identifier: "FileDiff.Info" });
var LegacyInfo = Struct({
  file: String5.pipe(optional3),
  patch: String5.pipe(optional3),
  additions: Finite,
  deletions: Finite,
  status: Literals(["added", "deleted", "modified"]).pipe(optional3)
}).annotate({ identifier: "FileDiff.LegacyInfo" });

// node_modules/@opencode/schema/dist/session-revert.js
var Revert = Struct({
  messageID: ID14,
  partID: String5.pipe(optional3),
  snapshot: ID13.pipe(optional3),
  files: ArraySchema(Info16).pipe(optional3)
}).annotate({ identifier: "Session.Revert" });
var FileDiffV1 = Struct({
  path: String5,
  status: Literals(["added", "modified", "deleted"]),
  additions: Finite,
  deletions: Finite,
  patch: String5
});
var RevertV1 = Struct({
  messageID: ID14,
  partID: String5.pipe(optional3),
  snapshot: String5.pipe(optional3),
  diff: String5.pipe(optional3),
  files: ArraySchema(FileDiffV1).pipe(optional3)
}).annotate({ identifier: "Session.RevertV1" });
var PersistedCurrent = Revert.pipe(decodeTo2(Struct({ source: tag("current"), revert: toType2(Revert) }), transform2({
  decode: (revert) => ({
    source: "current",
    revert
  }),
  encode: (value) => value.revert
})));
var PersistedLegacy = RevertV1.pipe(decodeTo2(Struct({ source: tag("legacy"), revert: toType2(RevertV1) }), transform2({
  decode: (revert) => ({
    source: "legacy",
    revert
  }),
  encode: (value) => value.revert
})));
var PersistedRevert = Union2([PersistedCurrent, PersistedLegacy]).pipe(toTaggedUnion("source"), decodeTo2(toType2(Revert), transform2({
  decode: (persisted) => {
    if (persisted.source === "current")
      return persisted.revert;
    return Revert.make({
      messageID: persisted.revert.messageID,
      partID: persisted.revert.partID,
      snapshot: persisted.revert.snapshot ? ID13.make(persisted.revert.snapshot) : undefined,
      files: persisted.revert.files?.map((file) => ({
        file: file.path,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch
      }))
    });
  },
  encode: (revert) => ({
    source: "current",
    revert
  })
})), annotate2({ identifier: "Session.Revert.Persisted" }));
// node_modules/@opencode/schema/dist/instruction.js
var Key2 = String5.check(isPattern2(/^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._/-]*$/)).pipe(brand2("Instruction.Key"));
var Hash2 = String5.check(isPattern2(/^[a-f0-9]{64}$/)).pipe(brand2("Instruction.Hash"));
var Values = Record(Key2, Hash2);
var Removed = Literal2("removed");
var removed = Removed.make("removed");
var Delta = Record(String5, Union2([Hash2, Removed]));
// node_modules/@opencode/schema/dist/instruction-entry.js
var Key3 = String5.check(isPattern2(/^[a-z0-9][a-z0-9._-]*$/)).annotate({
  identifier: "InstructionEntry.Key",
  description: "Instruction entry key (lowercase alphanumerics plus . _ -)"
});
var Info17 = Struct({
  key: Key3,
  value: Json2.annotate({ description: "JSON value attached to the session's instructions" })
}).annotate({ identifier: "InstructionEntry.Info" });
var Snapshot = ArraySchema(Struct({
  ...Info17.fields,
  removed: Boolean3
})).annotate({ identifier: "InstructionEntry.Snapshot" });
var MaxValueBytes = 256 * 1024;

class ValueTooLargeError extends TaggedError3()("InstructionEntryValueTooLargeError", {
  actualBytes: Int,
  maxBytes: Int,
  message: String5
}, { httpApiStatus: 413 }) {
}
// node_modules/@opencode/schema/dist/session-inbox.js
var Delivery = Literals(["steer", "queue"]).annotate({ identifier: "Session.Inbox.Delivery" });
var UserPayload = Struct({
  ...Prompt.fields,
  metadata: Record(String5, Unknown2).pipe(optional3)
}).annotate({ identifier: "Session.Inbox.UserPayload" });
var SyntheticPayload = Struct({
  text: String5,
  description: String5.pipe(optional3),
  metadata: Record(String5, Unknown2).pipe(optional3)
}).annotate({ identifier: "Session.Inbox.SyntheticPayload" });
var CompactionPayload = Struct({}).annotate({ identifier: "Session.Inbox.CompactionPayload" });
var MovePayload = Struct({
  location: Ref2,
  projectID: ID10,
  subpath: RelativePath.pipe(optional3)
}).annotate({ identifier: "Session.Inbox.MovePayload" });
var UserItem = Struct({ type: tag("user"), payload: UserPayload, delivery: Delivery });
var SyntheticItem = Struct({ type: tag("synthetic"), payload: SyntheticPayload, delivery: Delivery });
var CompactionItem = Struct({
  type: tag("compaction"),
  payload: CompactionPayload,
  delivery: Delivery
});
var MoveItem = Struct({ type: tag("move"), payload: MovePayload, delivery: Delivery });
var Item = Union2([UserItem, SyntheticItem, CompactionItem, MoveItem]).pipe(toTaggedUnion("type"), annotate2({ identifier: "Session.Inbox.Item" }));
var Enqueued = {
  id: ID14,
  sessionID: SessionID,
  time: Struct({ created: DateTimeUtcFromMillis })
};
var User2 = Struct({ ...Enqueued, ...UserItem.fields }).annotate({ identifier: "Session.Inbox.User" });
var Synthetic2 = Struct({ ...Enqueued, ...SyntheticItem.fields }).annotate({
  identifier: "Session.Inbox.Synthetic"
});
var Compaction3 = Struct({ ...Enqueued, ...CompactionItem.fields }).annotate({
  identifier: "Session.Inbox.Compaction"
});
var Move = Struct({ ...Enqueued, ...MoveItem.fields }).annotate({ identifier: "Session.Inbox.Move" });
var Info18 = Union2([User2, Synthetic2, Compaction3, Move]).pipe(toTaggedUnion("type"), annotate2({ identifier: "Session.Inbox.Info" }));
// node_modules/@opencode/schema/dist/session-fork.js
var Boundary = Union2([
  Struct({ type: Literal2("before"), messageID: ID14 }),
  Struct({ type: Literal2("through"), messageID: ID14 })
]).annotate({ identifier: "Session.ForkBoundary" });

// node_modules/@opencode/schema/dist/session-event.js
var Source3 = Struct({
  start: NonNegativeInt,
  end: NonNegativeInt,
  text: String5
}).annotate({
  identifier: "Session.Event.Source"
});
var Base4 = {
  sessionID: SessionID
};
var options = {
  durable: {
    aggregate: "sessionID",
    version: 1
  }
};
var Created4 = durable({
  type: "session.created",
  ...options,
  schema: {
    ...Base4,
    projectID: ID10,
    location: Ref2,
    subpath: RelativePath.pipe(optional3),
    parentID: SessionID.pipe(optional3),
    slug: String5,
    title: String5.pipe(optional3),
    agent: ID8.pipe(optional3),
    model: Ref4.pipe(optional3),
    metadata: SessionMetadata.pipe(optional3),
    permissions: Ruleset.pipe(optional3),
    version: String5
  }
});
var AgentSelected2 = durable({
  type: "session.agent.selected",
  ...options,
  schema: {
    ...Base4,
    agent: ID8,
    previous: ID8.pipe(optional3)
  }
});
var ModelSelected2 = durable({
  type: "session.model.selected",
  ...options,
  schema: {
    ...Base4,
    model: Ref4,
    previous: Ref4.pipe(optional3)
  }
});
var Moved = durable({
  type: "session.moved",
  ...options,
  schema: {
    ...Base4,
    ...MovePayload.fields
  }
});
var Renamed = durable({
  type: "session.renamed",
  ...options,
  schema: {
    ...Base4,
    title: String5
  }
});
var MetadataUpdated = durable({
  type: "session.metadata.updated",
  ...options,
  schema: {
    ...Base4,
    metadata: SessionMetadata
  }
});
var Permissions = durable({
  type: "session.permissions",
  ...options,
  schema: {
    ...Base4,
    permissions: Ruleset
  }
});
var Viewed = durable({
  type: "session.viewed",
  ...options,
  schema: {
    ...Base4,
    idle: Finite
  }
});
var MessageContentUpdated = durable({
  type: "session.message.content.updated",
  ...options,
  schema: {
    ...Base4,
    messageID: ID14,
    content: ArraySchema(AssistantContentEncoded)
  }
});
var UsageRecorded = durable({
  type: "session.usage.recorded",
  ...options,
  schema: {
    ...Base4,
    source: Literals(["title", "compaction"]),
    cost: USD,
    tokens: Info14
  }
});
var UsageUpdated = ephemeral({
  type: "session.usage.updated",
  schema: {
    ...Base4,
    cost: USD,
    tokens: Info14
  }
});
var Deleted3 = durable({
  type: "session.deleted",
  durable: {
    aggregate: "sessionID",
    version: 2
  },
  schema: Base4
});
var Forked = durable({
  type: "session.forked",
  durable: {
    aggregate: "sessionID",
    version: 2
  },
  schema: {
    ...Base4,
    parentID: SessionID,
    boundary: Boundary,
    instructions: Values.pipe(optional3),
    instructionEntries: Snapshot.pipe(optional3)
  }
});
var InboxRef = {
  ...Base4,
  inboxID: ID14
};
var InboxDelivered = durable({
  type: "session.inbox.delivered",
  ...options,
  schema: InboxRef
});
var InboxEnqueued = durable({
  type: "session.inbox.enqueued",
  ...options,
  schema: {
    ...InboxRef,
    item: Item
  }
});
var InboxCancelled = durable({
  type: "session.inbox.cancelled",
  ...options,
  schema: InboxRef
});
var InboxDeliveryChanged = durable({
  type: "session.inbox.delivery.changed",
  ...options,
  schema: { ...InboxRef, delivery: Delivery }
});
var Execution;
(function(Execution) {
  Execution.Started = durable({ type: "session.execution.started", ...options, schema: Base4 });
  Execution.Succeeded = durable({ type: "session.execution.succeeded", ...options, schema: Base4 });
  Execution.Failed = durable({
    type: "session.execution.failed",
    ...options,
    schema: { ...Base4, error: Error5 }
  });
  Execution.Interrupted = durable({
    type: "session.execution.interrupted",
    ...options,
    schema: { ...Base4, reason: Literals(["user", "shutdown", "superseded", "inactivity"]) }
  });
})(Execution || (Execution = {}));
var InstructionsUpdated = durable({
  type: "session.instructions.updated",
  durable: {
    aggregate: "sessionID",
    version: 2
  },
  schema: {
    ...Base4,
    delta: Delta,
    text: String5.pipe(optional3)
  }
});
var Synthetic3 = durable({
  type: "session.synthetic",
  ...options,
  schema: {
    ...Base4,
    text: String5,
    description: String5.pipe(optional3),
    metadata: Record(String5, Unknown2).pipe(optional3)
  }
});
var Skill2;
(function(Skill) {
  Skill.Activated = durable({
    type: "session.skill.activated",
    ...options,
    schema: {
      ...Base4,
      id: ID11,
      name: Name2,
      text: String5
    }
  });
})(Skill2 || (Skill2 = {}));
var Shell2;
(function(Shell) {
  Shell.Started = durable({
    type: "session.shell.started",
    ...options,
    schema: {
      ...Base4,
      shell: Info13
    }
  });
  Shell.Ended = durable({
    type: "session.shell.ended",
    ...options,
    schema: {
      ...Base4,
      shell: Info13,
      output: Output
    }
  });
})(Shell2 || (Shell2 = {}));
var Step;
(function(Step) {
  Step.Started = durable({
    type: "session.step.started",
    ...options,
    schema: {
      ...Base4,
      assistantMessageID: ID14,
      agent: ID8,
      model: Ref4,
      snapshot: ID13.pipe(optional3),
      started: NonNegativeInt
    }
  });
  Step.Streamed = durable({
    type: "session.step.streamed",
    ...options,
    schema: {
      ...Base4,
      assistantMessageID: ID14
    }
  });
  Step.Ended = durable({
    type: "session.step.ended",
    ...options,
    schema: {
      ...Base4,
      assistantMessageID: ID14,
      finish: FinishReason,
      rawFinish: String5.pipe(optional3),
      providerState: ProviderState.pipe(optional3),
      cost: USD,
      tokens: Info14,
      snapshot: ID13.pipe(optional3),
      files: ArraySchema(RelativePath).pipe(optional3)
    }
  });
  Step.Failed = durable({
    type: "session.step.failed",
    ...options,
    schema: {
      ...Base4,
      assistantMessageID: ID14,
      error: Error5,
      finish: Literals(["content-filter"]).pipe(optional3),
      rawFinish: String5.pipe(optional3),
      providerState: ProviderState.pipe(optional3),
      cost: USD.pipe(optional3),
      tokens: Info14.pipe(optional3),
      snapshot: ID13.pipe(optional3),
      files: ArraySchema(RelativePath).pipe(optional3)
    }
  });
})(Step || (Step = {}));
var Text;
(function(Text) {
  Text.Started = durable({
    type: "session.text.started",
    ...options,
    schema: {
      ...Base4,
      assistantMessageID: ID14,
      ordinal: NonNegativeInt
    }
  });
  Text.Delta = ephemeral({
    type: "session.text.delta",
    schema: {
      ...Base4,
      assistantMessageID: ID14,
      ordinal: NonNegativeInt,
      delta: String5
    }
  });
  Text.Ended = durable({
    type: "session.text.ended",
    ...options,
    schema: {
      ...Base4,
      assistantMessageID: ID14,
      ordinal: NonNegativeInt,
      text: String5,
      state: ProviderState.pipe(optional3)
    }
  });
})(Text || (Text = {}));
var Reasoning;
(function(Reasoning) {
  Reasoning.Started = durable({
    type: "session.reasoning.started",
    ...options,
    schema: {
      ...Base4,
      assistantMessageID: ID14,
      ordinal: NonNegativeInt,
      state: ProviderState.pipe(optional3)
    }
  });
  Reasoning.Delta = ephemeral({
    type: "session.reasoning.delta",
    schema: {
      ...Base4,
      assistantMessageID: ID14,
      ordinal: NonNegativeInt,
      delta: String5
    }
  });
  Reasoning.Ended = durable({
    type: "session.reasoning.ended",
    ...options,
    schema: {
      ...Base4,
      assistantMessageID: ID14,
      ordinal: NonNegativeInt,
      text: String5,
      state: ProviderState.pipe(optional3)
    }
  });
})(Reasoning || (Reasoning = {}));
var Tool;
(function(Tool) {
  const ToolBase = {
    ...Base4,
    assistantMessageID: ID14,
    id: String5
  };
  let Input;
  (function(Input) {
    Input.Started = durable({
      type: "session.tool.input.started",
      ...options,
      schema: {
        ...ToolBase,
        name: String5
      }
    });
    Input.Delta = ephemeral({
      type: "session.tool.input.delta",
      schema: {
        ...ToolBase,
        delta: String5
      }
    });
    Input.Ended = durable({
      type: "session.tool.input.ended",
      ...options,
      schema: {
        ...ToolBase,
        text: String5
      }
    });
  })(Input = Tool.Input || (Tool.Input = {}));
  Tool.Called = durable({
    type: "session.tool.called",
    ...options,
    schema: {
      ...ToolBase,
      input: Record(String5, Unknown2),
      executed: Boolean3,
      state: ProviderState.pipe(optional3)
    }
  });
  Tool.Progress = ephemeral({
    type: "session.tool.progress",
    schema: {
      ...ToolBase,
      metadata: Record(String5, Json2)
    }
  });
  Tool.Success = durable({
    type: "session.tool.success",
    durable: {
      aggregate: "sessionID",
      version: 2
    },
    schema: {
      ...ToolBase,
      content: NonEmptyArray(Content),
      metadata: Record(String5, Json2).pipe(optional3),
      executed: Boolean3,
      resultState: ProviderState.pipe(optional3)
    }
  });
  Tool.Failed = durable({
    type: "session.tool.failed",
    durable: {
      aggregate: "sessionID",
      version: 2
    },
    schema: {
      ...ToolBase,
      error: Error5,
      content: NonEmptyArray(Content).pipe(optional3),
      metadata: Record(String5, Json2).pipe(optional3),
      executed: Boolean3,
      resultState: ProviderState.pipe(optional3)
    }
  });
})(Tool || (Tool = {}));
var RetryScheduled = durable({
  type: "session.retry.scheduled",
  ...options,
  schema: {
    ...Base4,
    assistantMessageID: ID14,
    attempt: PositiveInt,
    at: NonNegativeInt,
    error: Error5
  }
});
var Compaction4;
(function(Compaction) {
  Compaction.Started = durable({
    type: "session.compaction.started",
    ...options,
    schema: {
      ...Base4,
      reason: Literals(["auto", "manual"]),
      recent: String5,
      inputID: ID14.pipe(optional3)
    }
  });
  Compaction.Delta = ephemeral({
    type: "session.compaction.delta",
    schema: {
      ...Base4,
      text: String5
    }
  });
  Compaction.Ended = durable({
    type: "session.compaction.ended",
    ...options,
    schema: {
      ...Base4,
      reason: Compaction.Started.data.fields.reason,
      model: CompactionCompleted.fields.model,
      providerState: CompactionCompleted.fields.providerState,
      providerContext: CompactionCompleted.fields.providerContext,
      text: String5,
      recent: String5,
      cost: CompactionCompleted.fields.cost,
      tokens: CompactionCompleted.fields.tokens
    }
  });
  Compaction.Failed = durable({
    type: "session.compaction.failed",
    ...options,
    schema: {
      ...Base4,
      reason: Compaction.Started.data.fields.reason,
      error: Error5,
      inputID: ID14.pipe(optional3),
      cost: CompactionFailed.fields.cost,
      tokens: CompactionFailed.fields.tokens
    }
  });
})(Compaction4 || (Compaction4 = {}));
var RevertEvent;
(function(RevertEvent) {
  RevertEvent.Staged = durable({
    type: "session.revert.staged",
    ...options,
    schema: { ...Base4, revert: Revert }
  });
  RevertEvent.Cleared = durable({ type: "session.revert.cleared", ...options, schema: Base4 });
  RevertEvent.Committed = durable({
    type: "session.revert.committed",
    ...options,
    schema: { ...Base4, to: ID14 }
  });
})(RevertEvent || (RevertEvent = {}));
var Definitions = inventory(Created4, AgentSelected2, ModelSelected2, Moved, Renamed, MetadataUpdated, Permissions, Viewed, UsageUpdated, Deleted3, Forked, InboxDelivered, InboxEnqueued, InboxCancelled, InboxDeliveryChanged, Execution.Started, Execution.Succeeded, Execution.Failed, Execution.Interrupted, InstructionsUpdated, Synthetic3, Skill2.Activated, Shell2.Started, Shell2.Ended, Step.Started, Step.Streamed, Step.Ended, Step.Failed, Text.Started, Text.Delta, Text.Ended, Reasoning.Started, Reasoning.Delta, Reasoning.Ended, Tool.Input.Started, Tool.Input.Delta, Tool.Input.Ended, Tool.Called, Tool.Progress, Tool.Success, Tool.Failed, RetryScheduled, Compaction4.Started, Compaction4.Delta, Compaction4.Ended, Compaction4.Failed, RevertEvent.Staged, RevertEvent.Cleared, RevertEvent.Committed);
var DurableDefinitions = inventory(...Definitions.filter((definition) => definition.durability === "durable"), UsageRecorded, MessageContentUpdated);
var EphemeralDefinitions = inventory(...Definitions.filter((definition) => definition.durability === "ephemeral"));
var Durable = Union2(DurableDefinitions, { mode: "oneOf" }).pipe(toTaggedUnion("type")).annotate({ identifier: "Session.Event.Durable" });
var All = Union2([Durable, ...EphemeralDefinitions], { mode: "oneOf" }).pipe(toTaggedUnion("type"));

// node_modules/@opencode/schema/dist/session.js
var ID15 = SessionID;
var Metadata3 = SessionMetadata;
var ForkBoundary = Boundary;
var Info19 = Struct({
  id: ID15,
  parentID: ID15.pipe(optional3),
  fork: Struct({
    sessionID: ID15,
    boundary: ForkBoundary
  }).pipe(optional3),
  projectID: ID10,
  agent: ID8.pipe(optional3),
  model: Ref4.pipe(optional3),
  cost: USD,
  tokens: Info14,
  outcome: Literals(["succeeded", "failed", "interrupted"]).pipe(optional3),
  time: Struct({
    created: DateTimeUtcFromMillis,
    updated: DateTimeUtcFromMillis,
    idle: DateTimeUtcFromMillis.pipe(optional3),
    viewed: DateTimeUtcFromMillis.pipe(optional3),
    archived: DateTimeUtcFromMillis.pipe(optional3)
  }),
  title: String5.pipe(optional3),
  location: Ref2,
  subpath: RelativePath.pipe(optional3),
  metadata: Metadata3.pipe(optional3),
  permissions: Ruleset.pipe(optional3),
  revert: Revert.pipe(optional3)
}).annotate({ identifier: "Session.Info" });
var ListAnchor = Struct({
  id: ID15,
  time: Finite,
  direction: Literals(["previous", "next"])
}).annotate({ identifier: "Session.ListAnchor" });

// node_modules/@opencode/schema/dist/persistent-pty.js
var Info20 = Struct({
  ...Info9.fields,
  sessionID: ID15,
  foregroundProcess: NullOr(String5),
  size: Struct({ cols: PositiveInt, rows: PositiveInt }),
  output: Struct({ head: NonNegativeInt, tail: NonNegativeInt })
}).annotate({ identifier: "PersistentPty.Info" });
var Handoff = Struct({
  directory: String5,
  instanceID: String5,
  ticket: String5,
  expiresAt: Number5
}).annotate({ identifier: "PersistentPty.Handoff" });
var CreateInput4 = Struct({
  command: optional3(String5),
  args: ArraySchema(String5),
  cwd: optional3(String5),
  title: String5,
  env: Record(String5, String5),
  size: optional3(Struct({ cols: PositiveInt, rows: PositiveInt }))
}).annotate({ identifier: "PersistentPty.CreateInput" });
var UpdateInput3 = Struct({
  attachmentID: optional3(String5),
  size: Struct({ cols: PositiveInt, rows: PositiveInt })
}).annotate({ identifier: "PersistentPty.UpdateInput" });
var Snapshot2 = Struct({
  info: Info20,
  text: String5,
  checkpoint: Uint8Array2,
  cursor: Struct({ x: NonNegativeInt, y: NonNegativeInt })
}).annotate({ identifier: "PersistentPty.Snapshot" });
var ReadLines = PositiveInt.check(isLessThanOrEqualTo3(65535)).annotate({
  identifier: "PersistentPty.ReadLines"
});
var ReadResult = Struct({
  ptyID: ID9,
  title: String5,
  cwd: String5,
  foregroundProcess: NullOr(String5),
  screen: Struct({
    text: String5,
    cols: PositiveInt,
    rows: PositiveInt,
    cursor: Snapshot2.fields.cursor
  })
}).annotate({ identifier: "PersistentPty.ReadResult" });
var Added = ephemeral({ type: "persistent-pty.added", schema: { sessionID: ID15, terminal: Info20 } });
var Removed2 = ephemeral({ type: "persistent-pty.removed", schema: { sessionID: ID15, ptyID: ID9 } });
var Event13 = { Added, Removed: Removed2, Definitions: inventory(Added, Removed2) };
// node_modules/@opencode/schema/dist/reference.js
var Updated10 = ephemeral({ type: "reference.updated", schema: {} });
var Event14 = { Updated: Updated10, Definitions: inventory(Updated10) };
var LocalSource = Struct({
  type: Literal2("local"),
  path: AbsolutePath,
  description: String5.pipe(optional3),
  hidden: Boolean3.pipe(optional3)
}).annotate({ identifier: "Reference.LocalSource" });
var GitSource = Struct({
  type: Literal2("git"),
  repository: String5,
  branch: String5.pipe(optional3),
  description: String5.pipe(optional3),
  hidden: Boolean3.pipe(optional3)
}).annotate({ identifier: "Reference.GitSource" });
var Source4 = Union2([LocalSource, GitSource]).pipe(toTaggedUnion("type")).annotate({ identifier: "Reference.Source" });
var Info21 = Struct({
  name: String5,
  path: AbsolutePath,
  description: String5.pipe(optional3),
  hidden: Boolean3.pipe(optional3),
  source: Source4
}).annotate({ identifier: "Reference.Info" });
// node_modules/@opencode/schema/dist/vcs.js
var Branch = Struct({
  current: optional3(String5),
  default: optional3(String5)
}).annotate({ identifier: "Vcs.Branch" });
var Info22 = Struct({
  provider: optional3(String5),
  branch: Branch
}).annotate({ identifier: "Vcs.Info" });
var BranchList = ArraySchema(String5).annotate({ identifier: "Vcs.BranchList" });
var Base5 = Struct({
  name: String5,
  ref: String5,
  source: Literals(["reflog", "default"])
}).annotate({ identifier: "Vcs.Base" });
var Mode = Literals(["working", "branch", "committed"]).annotate({ identifier: "Vcs.Mode" });
var FileStatus = Struct({
  file: String5,
  additions: NonNegativeInt,
  deletions: NonNegativeInt,
  status: Literals(["added", "deleted", "modified"])
}).annotate({ identifier: "Vcs.FileStatus" });
// node_modules/@opencode/schema/dist/websearch.js
var ID16 = String5.pipe(brand2("WebSearch.ID"));
var Provider = Struct({
  id: ID16,
  name: String5
}).annotate({ identifier: "WebSearch.Provider" });
var Input = Struct({
  query: String5,
  providerID: ID16.pipe(optional3)
}).annotate({ identifier: "WebSearch.Input" });
var Result2 = Struct({
  url: String5,
  title: String5.pipe(optional3),
  content: String5.pipe(optional3),
  time: Struct({
    published: Finite.pipe(optional3).annotate({
      description: "Publication time in milliseconds since the Unix epoch"
    })
  })
}).annotate({ identifier: "WebSearch.Result" });

class Response extends Class3("WebSearch.Response")({
  providerID: ID16,
  results: ArraySchema(Result2)
}) {
}
var Updated11 = ephemeral({
  type: "websearch.updated",
  schema: {}
});
var Event15 = { Updated: Updated11, Definitions: inventory(Updated11) };
// node_modules/@opencode/schema/dist/worktree.js
var StrategyID = Trim.pipe(check(isNonEmpty()), brand2("Worktree.StrategyID"));
var CreateInput5 = Struct({
  projectID: ID10,
  from: optional3(AbsolutePath),
  branch: optional3(Trim.pipe(check(isNonEmpty()))),
  directory: optional3(AbsolutePath).annotate({
    description: "Parent directory for the new worktree. Uses the project's canonical configuration, then defaults to the server's data directory under worktree/<first six project ID characters>."
  }),
  name: optional3(String5)
}).annotate({ identifier: "Worktree.CreateInput" });
var RemoveInput = Struct({
  projectID: ID10,
  directory: AbsolutePath,
  force: Boolean3
}).annotate({ identifier: "Worktree.RemoveInput" });
var Info23 = Struct({
  directory: AbsolutePath
}).annotate({ identifier: "Worktree.Info" });
var Directory = Struct({
  directory: AbsolutePath,
  strategy: optional3(String5)
}).annotate({ identifier: "Worktree.Directory" });
var ListEntry = Struct({
  directory: AbsolutePath,
  type: Literals(["root", "worktree"])
}).annotate({ identifier: "Worktree.ListEntry" });

class OperationError extends TaggedError3()("Worktree.OperationError", {
  message: String5,
  forceRequired: optional3(Boolean3)
}) {
}
var List = ArraySchema(Directory).annotate({ identifier: "Worktree.List" });
var Updated12 = ephemeral({
  type: "worktree.updated",
  schema: { projectID: ID10 }
});
var Resolved = durable({
  type: "worktree.resolved",
  durable: { aggregate: "projectID", version: 1 },
  schema: {
    projectID: ID10,
    directory: AbsolutePath,
    previous: ID10,
    adopted: optional3(ArraySchema(ID10))
  }
});
var Event16 = { Updated: Updated12, Resolved, Definitions: inventory(Updated12, Resolved) };
// node_modules/supermemory/dist/esm/generated/core/auth/AuthProvider.js
function isAuthProvider(value) {
  return typeof value === "object" && value !== null && "getAuthRequest" in value && typeof value.getAuthRequest === "function";
}
// node_modules/supermemory/dist/esm/generated/core/auth/NoOpAuthProvider.js
class NoOpAuthProvider {
  getAuthRequest() {
    return Promise.resolve({ headers: {} });
  }
}
// node_modules/supermemory/dist/esm/generated/core/fetcher/EndpointSupplier.js
var EndpointSupplier = {
  get: async (supplier, arg) => {
    if (typeof supplier === "function") {
      return supplier(arg);
    } else {
      return supplier;
    }
  }
};

// node_modules/supermemory/dist/esm/generated/core/json.js
var toJson2 = (value, replacer, space) => {
  return JSON.stringify(value, replacer, space);
};
function fromJson(text, reviver) {
  return JSON.parse(text, reviver);
}

// node_modules/supermemory/dist/esm/generated/core/logging/logger.js
var LogLevel2 = {
  Debug: "debug",
  Info: "info",
  Warn: "warn",
  Error: "error"
};
var logLevelMap = {
  [LogLevel2.Debug]: 1,
  [LogLevel2.Info]: 2,
  [LogLevel2.Warn]: 3,
  [LogLevel2.Error]: 4
};

class ConsoleLogger {
  debug(message, ...args) {
    console.debug(message, ...args);
  }
  info(message, ...args) {
    console.info(message, ...args);
  }
  warn(message, ...args) {
    console.warn(message, ...args);
  }
  error(message, ...args) {
    console.error(message, ...args);
  }
}

class Logger2 {
  level;
  logger;
  silent;
  constructor(config) {
    this.level = logLevelMap[config.level];
    this.logger = config.logger;
    this.silent = config.silent;
  }
  shouldLog(level) {
    return !this.silent && this.level <= logLevelMap[level];
  }
  isDebug() {
    return this.shouldLog(LogLevel2.Debug);
  }
  debug(message, ...args) {
    if (this.isDebug()) {
      this.logger.debug(message, ...args);
    }
  }
  isInfo() {
    return this.shouldLog(LogLevel2.Info);
  }
  info(message, ...args) {
    if (this.isInfo()) {
      this.logger.info(message, ...args);
    }
  }
  isWarn() {
    return this.shouldLog(LogLevel2.Warn);
  }
  warn(message, ...args) {
    if (this.isWarn()) {
      this.logger.warn(message, ...args);
    }
  }
  isError() {
    return this.shouldLog(LogLevel2.Error);
  }
  error(message, ...args) {
    if (this.isError()) {
      this.logger.error(message, ...args);
    }
  }
}
function createLogger(config) {
  if (config == null) {
    return defaultLogger;
  }
  if (config instanceof Logger2) {
    return config;
  }
  config = config ?? {};
  config.level ??= LogLevel2.Info;
  config.logger ??= new ConsoleLogger;
  config.silent ??= true;
  return new Logger2(config);
}
var defaultLogger = new Logger2({
  level: LogLevel2.Info,
  logger: new ConsoleLogger,
  silent: true
});

// node_modules/supermemory/dist/esm/generated/core/url/qs.js
var defaultQsOptions = {
  arrayFormat: "indices",
  encode: true
};
function encodeValue(value, shouldEncode) {
  if (value === undefined) {
    return "";
  }
  if (value === null) {
    return "";
  }
  const stringValue = String(value);
  return shouldEncode ? encodeURIComponent(stringValue) : stringValue;
}
function stringifyObject(obj, prefix = "", options) {
  const parts = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (value == null) {
      continue;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        continue;
      }
      const effectiveFormat = options.arrayFormat;
      if (effectiveFormat === "comma") {
        const encodedKey = options.encode ? encodeURIComponent(fullKey) : fullKey;
        const encodedValues = value.filter((item) => item !== undefined && item !== null).map((item) => encodeValue(item, options.encode));
        if (encodedValues.length > 0) {
          parts.push(`${encodedKey}=${encodedValues.join(",")}`);
        }
      } else {
        for (let i = 0;i < value.length; i++) {
          const item = value[i];
          if (item == null) {
            continue;
          }
          if (typeof item === "object" && !Array.isArray(item) && item !== null) {
            const arrayKey = effectiveFormat === "indices" ? `${fullKey}[${i}]` : fullKey;
            parts.push(...stringifyObject(item, arrayKey, options));
          } else {
            const arrayKey = effectiveFormat === "indices" ? `${fullKey}[${i}]` : fullKey;
            const encodedKey = options.encode ? encodeURIComponent(arrayKey) : arrayKey;
            parts.push(`${encodedKey}=${encodeValue(item, options.encode)}`);
          }
        }
      }
    } else if (typeof value === "object" && value !== null) {
      if (Object.keys(value).length === 0) {
        continue;
      }
      parts.push(...stringifyObject(value, fullKey, options));
    } else {
      const encodedKey = options.encode ? encodeURIComponent(fullKey) : fullKey;
      parts.push(`${encodedKey}=${encodeValue(value, options.encode)}`);
    }
  }
  return parts;
}
function toQueryString(obj, options) {
  if (obj == null || typeof obj !== "object") {
    return "";
  }
  const parts = stringifyObject(obj, "", {
    ...defaultQsOptions,
    ...options
  });
  return parts.join("&");
}

// node_modules/supermemory/dist/esm/generated/core/fetcher/createRequestUrl.js
function createRequestUrl(baseUrl, queryParameters) {
  const queryString = toQueryString(queryParameters, { arrayFormat: "repeat" });
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// node_modules/supermemory/dist/esm/generated/core/fetcher/BinaryResponse.js
function getBinaryResponse(response) {
  const binaryResponse = {
    get bodyUsed() {
      return response.bodyUsed;
    },
    stream: () => response.body,
    arrayBuffer: response.arrayBuffer.bind(response),
    blob: response.blob.bind(response)
  };
  if ("bytes" in response && typeof response.bytes === "function") {
    binaryResponse.bytes = response.bytes.bind(response);
  }
  return binaryResponse;
}

// node_modules/supermemory/dist/esm/generated/core/fetcher/getResponseBody.js
function retainResponse(target, response) {
  Object.defineProperty(target, "__fern_response_ref", {
    value: response,
    enumerable: false,
    configurable: true,
    writable: false
  });
}
async function getResponseBody(response, responseType) {
  switch (responseType) {
    case "binary-response":
      return getBinaryResponse(response);
    case "blob":
      return await response.blob();
    case "arrayBuffer":
      return await response.arrayBuffer();
    case "sse":
      if (response.body == null) {
        return {
          ok: false,
          error: {
            reason: "body-is-null",
            statusCode: response.status
          }
        };
      }
      retainResponse(response.body, response);
      return response.body;
    case "streaming":
      if (response.body == null) {
        return {
          ok: false,
          error: {
            reason: "body-is-null",
            statusCode: response.status
          }
        };
      }
      retainResponse(response.body, response);
      return response.body;
    case "text":
      return await response.text();
  }
  const text = await response.text();
  if (text.length > 0) {
    try {
      const responseBody = fromJson(text);
      return responseBody;
    } catch (_err) {
      return {
        ok: false,
        error: {
          reason: "non-json",
          statusCode: response.status,
          rawBody: text
        }
      };
    }
  }
  return;
}

// node_modules/supermemory/dist/esm/generated/core/fetcher/getErrorResponseBody.js
async function getErrorResponseBody(response) {
  let contentType = response.headers.get("Content-Type")?.toLowerCase();
  if (contentType == null || contentType.length === 0) {
    return getResponseBody(response);
  }
  if (contentType.indexOf(";") !== -1) {
    contentType = contentType.split(";")[0]?.trim() ?? "";
  }
  switch (contentType) {
    case "application/hal+json":
    case "application/json":
    case "application/ld+json":
    case "application/problem+json":
    case "application/vnd.api+json":
    case "text/json": {
      const text = await response.text();
      return text.length > 0 ? fromJson(text) : undefined;
    }
    default:
      if (contentType.startsWith("application/vnd.") && contentType.endsWith("+json")) {
        const text = await response.text();
        return text.length > 0 ? fromJson(text) : undefined;
      }
      return await response.text();
  }
}

// node_modules/supermemory/dist/esm/generated/core/fetcher/getFetchFn.js
async function getFetchFn() {
  return fetch;
}

// node_modules/supermemory/dist/esm/generated/core/fetcher/getRequestBody.js
async function getRequestBody({ body, type }) {
  if (type === "form") {
    return toQueryString(body, { arrayFormat: "repeat", encode: true });
  }
  if (type.includes("json")) {
    return toJson2(body);
  } else {
    return body;
  }
}

// node_modules/supermemory/dist/esm/generated/core/fetcher/Headers.js
var Headers2;
if (typeof globalThis.Headers !== "undefined") {
  Headers2 = globalThis.Headers;
} else {
  Headers2 = class Headers2 {
    headers;
    constructor(init) {
      this.headers = new Map;
      if (init) {
        if (init instanceof Headers2) {
          init.forEach((value, key) => this.append(key, value));
        } else if (Array.isArray(init)) {
          for (const [key, value] of init) {
            if (typeof key === "string" && typeof value === "string") {
              this.append(key, value);
            } else {
              throw new TypeError("Each header entry must be a [string, string] tuple");
            }
          }
        } else {
          for (const [key, value] of Object.entries(init)) {
            if (typeof value === "string") {
              this.append(key, value);
            } else {
              throw new TypeError("Header values must be strings");
            }
          }
        }
      }
    }
    append(name, value) {
      const key = name.toLowerCase();
      const existing = this.headers.get(key) || [];
      this.headers.set(key, [...existing, value]);
    }
    delete(name) {
      const key = name.toLowerCase();
      this.headers.delete(key);
    }
    get(name) {
      const key = name.toLowerCase();
      const values = this.headers.get(key);
      return values ? values.join(", ") : null;
    }
    has(name) {
      const key = name.toLowerCase();
      return this.headers.has(key);
    }
    set(name, value) {
      const key = name.toLowerCase();
      this.headers.set(key, [value]);
    }
    forEach(callbackfn, thisArg) {
      const boundCallback = thisArg ? callbackfn.bind(thisArg) : callbackfn;
      this.headers.forEach((values, key) => boundCallback(values.join(", "), key, this));
    }
    getSetCookie() {
      return this.headers.get("set-cookie") || [];
    }
    *entries() {
      for (const [key, values] of this.headers.entries()) {
        yield [key, values.join(", ")];
      }
    }
    *keys() {
      yield* this.headers.keys();
    }
    *values() {
      for (const values of this.headers.values()) {
        yield values.join(", ");
      }
    }
    [Symbol.iterator]() {
      return this.entries();
    }
  };
}

// node_modules/supermemory/dist/esm/generated/core/fetcher/signals.js
var TIMEOUT = "timeout";
function getTimeoutSignal(timeoutMs) {
  const controller = new AbortController;
  const abortId = setTimeout(() => controller.abort(new DOMException(TIMEOUT, "AbortError")), timeoutMs);
  return { signal: controller.signal, abortId };
}
function anySignal(...args) {
  const signals = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
  const controller = new AbortController;
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal?.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal?.reason), {
      signal: controller.signal
    });
    if (signal.aborted) {
      controller.abort(signal?.reason);
      return controller.signal;
    }
  }
  return controller.signal;
}

// node_modules/supermemory/dist/esm/generated/core/fetcher/makeRequest.js
var _cacheNoStoreSupported;
function isCacheNoStoreSupported() {
  if (_cacheNoStoreSupported != null) {
    return _cacheNoStoreSupported;
  }
  try {
    new Request("http://localhost", { cache: "no-store" });
    _cacheNoStoreSupported = true;
  } catch {
    _cacheNoStoreSupported = false;
  }
  return _cacheNoStoreSupported;
}
var makeRequest = async (fetchFn, url, method, headers, requestBody, timeoutMs, abortSignal, withCredentials, duplex, disableCache) => {
  const signals = [];
  let timeoutAbortId;
  if (timeoutMs != null) {
    const { signal, abortId } = getTimeoutSignal(timeoutMs);
    timeoutAbortId = abortId;
    signals.push(signal);
  }
  if (abortSignal != null) {
    signals.push(abortSignal);
  }
  const newSignals = anySignal(signals);
  try {
    return await fetchFn(url, {
      method,
      headers,
      body: requestBody,
      signal: newSignals,
      credentials: withCredentials ? "include" : undefined,
      duplex,
      ...disableCache && isCacheNoStoreSupported() ? { cache: "no-store" } : {}
    });
  } finally {
    if (timeoutAbortId != null) {
      clearTimeout(timeoutAbortId);
    }
  }
};

// node_modules/supermemory/dist/esm/generated/core/fetcher/RawResponse.js
var abortRawResponse = {
  headers: new Headers2,
  redirected: false,
  status: 499,
  statusText: "Client Closed Request",
  type: "error",
  url: ""
};
var unknownRawResponse = {
  headers: new Headers2,
  redirected: false,
  status: 0,
  statusText: "Unknown Error",
  type: "error",
  url: ""
};
function toRawResponse(response) {
  return {
    headers: response.headers,
    redirected: response.redirected,
    status: response.status,
    statusText: response.statusText,
    type: response.type,
    url: response.url
  };
}

// node_modules/supermemory/dist/esm/generated/core/fetcher/redactUrl.js
var SENSITIVE_QUERY_PARAMS = new Set([
  "api_key",
  "api-key",
  "apikey",
  "token",
  "access_token",
  "access-token",
  "auth_token",
  "auth-token",
  "password",
  "passwd",
  "secret",
  "api_secret",
  "api-secret",
  "apisecret",
  "key",
  "session",
  "session_id",
  "session-id"
]);
function redactUrl(url) {
  const protocolIndex = url.indexOf("://");
  if (protocolIndex === -1)
    return url;
  const afterProtocol = protocolIndex + 3;
  const pathStart = url.indexOf("/", afterProtocol);
  let queryStart = url.indexOf("?", afterProtocol);
  let fragmentStart = url.indexOf("#", afterProtocol);
  const firstDelimiter = Math.min(pathStart === -1 ? url.length : pathStart, queryStart === -1 ? url.length : queryStart, fragmentStart === -1 ? url.length : fragmentStart);
  let atIndex = -1;
  for (let i = afterProtocol;i < firstDelimiter; i++) {
    if (url[i] === "@") {
      atIndex = i;
    }
  }
  if (atIndex !== -1) {
    url = `${url.slice(0, afterProtocol)}[REDACTED]@${url.slice(atIndex + 1)}`;
  }
  queryStart = url.indexOf("?");
  if (queryStart === -1)
    return url;
  fragmentStart = url.indexOf("#", queryStart);
  const queryEnd = fragmentStart !== -1 ? fragmentStart : url.length;
  const queryString = url.slice(queryStart + 1, queryEnd);
  if (queryString.length === 0)
    return url;
  const lower = queryString.toLowerCase();
  const hasSensitive = lower.includes("token") || lower.includes("key") || lower.includes("password") || lower.includes("passwd") || lower.includes("secret") || lower.includes("session") || lower.includes("auth");
  if (!hasSensitive) {
    return url;
  }
  const redactedParams = [];
  const params = queryString.split("&");
  for (const param of params) {
    const equalIndex = param.indexOf("=");
    if (equalIndex === -1) {
      redactedParams.push(param);
      continue;
    }
    const key = param.slice(0, equalIndex);
    let shouldRedact = SENSITIVE_QUERY_PARAMS.has(key.toLowerCase());
    if (!shouldRedact && key.includes("%")) {
      try {
        const decodedKey = decodeURIComponent(key);
        shouldRedact = SENSITIVE_QUERY_PARAMS.has(decodedKey.toLowerCase());
      } catch {}
    }
    redactedParams.push(shouldRedact ? `${key}=[REDACTED]` : param);
  }
  return url.slice(0, queryStart + 1) + redactedParams.join("&") + url.slice(queryEnd);
}

// node_modules/supermemory/dist/esm/generated/core/fetcher/requestWithRetries.js
var INITIAL_RETRY_DELAY = 1000;
var MAX_RETRY_DELAY = 60000;
var DEFAULT_MAX_RETRIES = 2;
var JITTER_FACTOR = 0.2;
function isRetryableStatusCode(statusCode) {
  return [408, 429].includes(statusCode) || statusCode >= 500;
}
function addPositiveJitter(delay) {
  const jitterMultiplier = 1 + Math.random() * JITTER_FACTOR;
  return delay * jitterMultiplier;
}
function addSymmetricJitter(delay) {
  const jitterMultiplier = 1 + (Math.random() - 0.5) * JITTER_FACTOR;
  return delay * jitterMultiplier;
}
function getRetryDelayFromHeaders(response, retryAttempt) {
  const retryAfter = response.headers.get("Retry-After");
  if (retryAfter) {
    const retryAfterSeconds = parseInt(retryAfter, 10);
    if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
      return Math.min(retryAfterSeconds * 1000, MAX_RETRY_DELAY);
    }
    const retryAfterDate = new Date(retryAfter);
    if (!Number.isNaN(retryAfterDate.getTime())) {
      const delay = retryAfterDate.getTime() - Date.now();
      if (delay > 0) {
        return Math.min(Math.max(delay, 0), MAX_RETRY_DELAY);
      }
    }
  }
  const rateLimitReset = response.headers.get("X-RateLimit-Reset");
  if (rateLimitReset) {
    const resetTime = parseInt(rateLimitReset, 10);
    if (!Number.isNaN(resetTime)) {
      const delay = resetTime * 1000 - Date.now();
      if (delay > 0) {
        return addPositiveJitter(Math.min(delay, MAX_RETRY_DELAY));
      }
    }
  }
  return addSymmetricJitter(Math.min(INITIAL_RETRY_DELAY * 2 ** retryAttempt, MAX_RETRY_DELAY));
}
async function requestWithRetries(requestFn, maxRetries = DEFAULT_MAX_RETRIES, abortSignal) {
  for (let i = 0;; ++i) {
    let response;
    try {
      response = await requestFn();
    } catch (error) {
      const aborted = abortSignal?.aborted === true || error instanceof Error && error.name === "AbortError";
      if (aborted || i >= maxRetries)
        throw error;
      await new Promise((resolve) => setTimeout(resolve, addSymmetricJitter(Math.min(INITIAL_RETRY_DELAY * 2 ** i, MAX_RETRY_DELAY))));
      continue;
    }
    if (!isRetryableStatusCode(response.status) || i >= maxRetries)
      return response;
    await new Promise((resolve) => setTimeout(resolve, getRetryDelayFromHeaders(response, i)));
  }
}

// node_modules/supermemory/dist/esm/generated/core/fetcher/Fetcher.js
var SENSITIVE_HEADERS = new Set([
  "authorization",
  "www-authenticate",
  "x-api-key",
  "api-key",
  "apikey",
  "x-api-token",
  "x-auth-token",
  "auth-token",
  "cookie",
  "set-cookie",
  "proxy-authorization",
  "proxy-authenticate",
  "x-csrf-token",
  "x-xsrf-token",
  "x-session-token",
  "x-access-token"
]);
function redactHeaders(headers) {
  const filtered = {};
  for (const [key, value] of headers instanceof Headers2 ? headers.entries() : Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      filtered[key] = "[REDACTED]";
    } else {
      filtered[key] = value;
    }
  }
  return filtered;
}
function redactQueryParameters(queryParameters) {
  if (queryParameters == null) {
    return;
  }
  const redacted = {};
  for (const [key, value] of Object.entries(queryParameters)) {
    redacted[key] = SENSITIVE_QUERY_PARAMS.has(key.toLowerCase()) ? "[REDACTED]" : value;
  }
  return redacted;
}
async function getHeaders(args) {
  const newHeaders = new Headers2;
  newHeaders.set("Accept", args.responseType === "json" ? "application/json" : args.responseType === "text" ? "text/plain" : args.responseType === "sse" ? "text/event-stream" : "*/*");
  if (args.body !== undefined && args.contentType != null) {
    newHeaders.set("Content-Type", args.contentType);
  }
  if (args.headers == null) {
    return newHeaders;
  }
  for (const [key, value] of Object.entries(args.headers)) {
    const result = await EndpointSupplier.get(value, { endpointMetadata: args.endpointMetadata ?? {} });
    if (typeof result === "string") {
      newHeaders.set(key, result);
      continue;
    }
    if (result == null) {
      continue;
    }
    newHeaders.set(key, `${result}`);
  }
  return newHeaders;
}
async function fetcherImpl(args) {
  let url = args.url;
  if (args.queryString != null && args.queryString.length > 0) {
    url = `${url}?${args.queryString}`;
  } else {
    url = createRequestUrl(args.url, args.queryParameters);
  }
  const requestBody = await getRequestBody({
    body: args.body,
    type: args.requestType ?? "other"
  });
  const fetchFn = args.fetchFn ?? await getFetchFn();
  const headers = await getHeaders(args);
  const logger = createLogger(args.logging);
  if (logger.isDebug()) {
    const metadata = {
      method: args.method,
      url: redactUrl(url),
      headers: redactHeaders(headers),
      queryParameters: redactQueryParameters(args.queryParameters),
      hasBody: requestBody != null
    };
    logger.debug("Making HTTP request", metadata);
  }
  try {
    const response = await requestWithRetries(async () => makeRequest(fetchFn, url, args.method, headers, requestBody, args.timeoutMs, args.abortSignal, args.withCredentials, args.duplex, args.responseType === "streaming" || args.responseType === "sse"), args.maxRetries, args.abortSignal);
    if (response.status >= 200 && response.status < 400) {
      if (logger.isDebug()) {
        const metadata = {
          method: args.method,
          url: redactUrl(url),
          statusCode: response.status,
          responseHeaders: redactHeaders(response.headers)
        };
        logger.debug("HTTP request succeeded", metadata);
      }
      const body = await getResponseBody(response, args.responseType);
      return {
        ok: true,
        body,
        headers: response.headers,
        rawResponse: toRawResponse(response)
      };
    } else {
      if (logger.isError()) {
        const metadata = {
          method: args.method,
          url: redactUrl(url),
          statusCode: response.status,
          responseHeaders: redactHeaders(Object.fromEntries(response.headers.entries()))
        };
        logger.error("HTTP request failed with error status", metadata);
      }
      return {
        ok: false,
        error: {
          reason: "status-code",
          statusCode: response.status,
          body: await getErrorResponseBody(response)
        },
        rawResponse: toRawResponse(response)
      };
    }
  } catch (error) {
    if (args.abortSignal?.aborted) {
      if (logger.isError()) {
        const metadata = {
          method: args.method,
          url: redactUrl(url)
        };
        logger.error("HTTP request was aborted", metadata);
      }
      return {
        ok: false,
        error: {
          reason: "unknown",
          errorMessage: "The user aborted a request",
          cause: error
        },
        rawResponse: abortRawResponse
      };
    } else if (error instanceof Error && error.name === "AbortError") {
      if (logger.isError()) {
        const metadata = {
          method: args.method,
          url: redactUrl(url),
          timeoutMs: args.timeoutMs
        };
        logger.error("HTTP request timed out", metadata);
      }
      return {
        ok: false,
        error: {
          reason: "timeout",
          cause: error
        },
        rawResponse: abortRawResponse
      };
    } else if (error instanceof Error) {
      if (logger.isError()) {
        const metadata = {
          method: args.method,
          url: redactUrl(url),
          errorMessage: error.message
        };
        logger.error("HTTP request failed with error", metadata);
      }
      return {
        ok: false,
        error: {
          reason: "unknown",
          errorMessage: error.message,
          cause: error
        },
        rawResponse: unknownRawResponse
      };
    }
    if (logger.isError()) {
      const metadata = {
        method: args.method,
        url: redactUrl(url),
        error: toJson2(error)
      };
      logger.error("HTTP request failed with unknown error", metadata);
    }
    return {
      ok: false,
      error: {
        reason: "unknown",
        errorMessage: toJson2(error),
        cause: error
      },
      rawResponse: unknownRawResponse
    };
  }
}
var fetcher = fetcherImpl;
// node_modules/supermemory/dist/esm/generated/core/fetcher/HttpResponsePromise.js
class HttpResponsePromise extends Promise {
  innerPromise;
  unwrappedPromise;
  constructor(promise) {
    super((resolve) => {
      resolve(undefined);
    });
    this.innerPromise = promise;
  }
  static fromFunction(fn, ...args) {
    return new HttpResponsePromise(fn(...args));
  }
  static interceptFunction(fn) {
    return (...args) => {
      return HttpResponsePromise.fromPromise(fn(...args));
    };
  }
  static fromPromise(promise) {
    return new HttpResponsePromise(promise);
  }
  static fromExecutor(executor) {
    const promise = new Promise(executor);
    return new HttpResponsePromise(promise);
  }
  static fromResult(result) {
    const promise = Promise.resolve(result);
    return new HttpResponsePromise(promise);
  }
  unwrap() {
    if (!this.unwrappedPromise) {
      this.unwrappedPromise = this.innerPromise.then(({ data }) => data);
    }
    return this.unwrappedPromise;
  }
  then(onfulfilled, onrejected) {
    return this.unwrap().then(onfulfilled, onrejected);
  }
  catch(onrejected) {
    return this.unwrap().catch(onrejected);
  }
  finally(onfinally) {
    return this.unwrap().finally(onfinally);
  }
  async withRawResponse() {
    return await this.innerPromise;
  }
}
// node_modules/supermemory/dist/esm/generated/core/url/join.js
function join(base, ...segments) {
  if (!base) {
    return "";
  }
  if (segments.length === 0) {
    return base;
  }
  if (base.includes("://")) {
    let url;
    try {
      url = new URL(base);
    } catch {
      return joinPath(base, ...segments);
    }
    const lastSegment = segments[segments.length - 1];
    const shouldPreserveTrailingSlash = lastSegment?.endsWith("/");
    for (const segment of segments) {
      const cleanSegment = trimSlashes(segment);
      if (cleanSegment) {
        url.pathname = joinPathSegments(url.pathname, cleanSegment);
      }
    }
    if (shouldPreserveTrailingSlash && !url.pathname.endsWith("/")) {
      url.pathname += "/";
    }
    return url.toString();
  }
  return joinPath(base, ...segments);
}
function joinPath(base, ...segments) {
  if (segments.length === 0) {
    return base;
  }
  let result = base;
  const lastSegment = segments[segments.length - 1];
  const shouldPreserveTrailingSlash = lastSegment?.endsWith("/");
  for (const segment of segments) {
    const cleanSegment = trimSlashes(segment);
    if (cleanSegment) {
      result = joinPathSegments(result, cleanSegment);
    }
  }
  if (shouldPreserveTrailingSlash && !result.endsWith("/")) {
    result += "/";
  }
  return result;
}
function joinPathSegments(left, right) {
  if (left.endsWith("/")) {
    return left + right;
  }
  return `${left}/${right}`;
}
function trimSlashes(str) {
  if (!str)
    return str;
  let start = 0;
  let end = str.length;
  if (str.startsWith("/"))
    start = 1;
  if (str.endsWith("/"))
    end = str.length - 1;
  return start === 0 && end === str.length ? str : str.slice(start, end);
}

// node_modules/supermemory/dist/esm/generated/core/fetcher/Supplier.js
var Supplier = {
  get: async (supplier) => {
    if (typeof supplier === "function") {
      return supplier();
    } else {
      return supplier;
    }
  }
};

// node_modules/supermemory/dist/esm/generated/core/fetcher/makePassthroughRequest.js
async function makePassthroughRequest(input, init, clientOptions, requestOptions) {
  const logger = createLogger(clientOptions.logging);
  let url;
  let effectiveInit = init;
  if (input instanceof Request) {
    url = input.url;
    if (init == null) {
      effectiveInit = {
        method: input.method,
        headers: Object.fromEntries(input.headers.entries()),
        body: input.body,
        signal: input.signal,
        credentials: input.credentials,
        cache: input.cache,
        redirect: input.redirect,
        referrer: input.referrer,
        integrity: input.integrity,
        mode: input.mode
      };
    }
  } else {
    url = input instanceof URL ? input.toString() : input;
  }
  const baseUrl = (clientOptions.baseUrl != null ? await Supplier.get(clientOptions.baseUrl) : undefined) ?? (clientOptions.environment != null ? await Supplier.get(clientOptions.environment) : undefined);
  let fullUrl;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    fullUrl = url;
  } else if (baseUrl != null) {
    fullUrl = join(baseUrl, url);
  } else {
    fullUrl = url;
  }
  const mergedHeaders = {};
  if (clientOptions.headers != null) {
    for (const [key, value] of Object.entries(clientOptions.headers)) {
      const resolved = await EndpointSupplier.get(value, { endpointMetadata: {} });
      if (resolved != null) {
        mergedHeaders[key.toLowerCase()] = `${resolved}`;
      }
    }
  }
  if (clientOptions.getAuthHeaders != null && targetsBaseUrl(fullUrl, baseUrl)) {
    const authHeaders = await clientOptions.getAuthHeaders();
    for (const [key, value] of Object.entries(authHeaders)) {
      mergedHeaders[key.toLowerCase()] = value;
    }
  }
  if (effectiveInit?.headers != null) {
    const initHeaders = effectiveInit.headers instanceof Headers ? Object.fromEntries(effectiveInit.headers.entries()) : Array.isArray(effectiveInit.headers) ? Object.fromEntries(effectiveInit.headers) : effectiveInit.headers;
    for (const [key, value] of Object.entries(initHeaders)) {
      if (value != null) {
        mergedHeaders[key.toLowerCase()] = value;
      }
    }
  }
  if (requestOptions?.headers != null) {
    for (const [key, value] of Object.entries(requestOptions.headers)) {
      mergedHeaders[key.toLowerCase()] = value;
    }
  }
  const method = effectiveInit?.method ?? "GET";
  const body = effectiveInit?.body;
  const timeoutInSeconds = requestOptions?.timeoutInSeconds ?? clientOptions.timeoutInSeconds;
  const timeoutMs = timeoutInSeconds != null ? timeoutInSeconds * 1000 : undefined;
  const maxRetries = requestOptions?.maxRetries ?? clientOptions.maxRetries;
  const abortSignal = requestOptions?.abortSignal ?? effectiveInit?.signal ?? undefined;
  const fetchFn = clientOptions.fetch ?? await getFetchFn();
  if (logger.isDebug()) {
    logger.debug("Making passthrough HTTP request", {
      method,
      url: redactUrl(fullUrl),
      hasBody: body != null
    });
  }
  const response = await requestWithRetries(async () => makeRequest(fetchFn, fullUrl, method, mergedHeaders, body ?? undefined, timeoutMs, abortSignal, effectiveInit?.credentials === "include", undefined, false), maxRetries);
  if (logger.isDebug()) {
    logger.debug("Passthrough HTTP request completed", {
      method,
      url: redactUrl(fullUrl),
      statusCode: response.status
    });
  }
  return response;
}
function targetsBaseUrl(fullUrl, baseUrl) {
  if (baseUrl == null) {
    return false;
  }
  try {
    return new URL(fullUrl).origin === new URL(baseUrl).origin;
  } catch {
    return false;
  }
}
// node_modules/supermemory/dist/esm/generated/core/file/file.js
async function toMultipartDataPart(file) {
  const { data, filename, contentType } = await getFileWithMetadata(file, {
    noSniffFileSize: true
  });
  return {
    data,
    filename,
    contentType
  };
}
async function getFileWithMetadata(file, { noSniffFileSize } = {}) {
  if (file == null) {
    throw new Error(`Expected file to be a Blob, Buffer, ReadableStream, or an object with a "path" or "data" property, but received ${file === null ? "null" : "undefined"}.`);
  }
  if (isFileLike(file)) {
    return getFileWithMetadata({
      data: file
    }, { noSniffFileSize });
  }
  if ("path" in file) {
    const fs = await import("fs");
    if (!fs?.createReadStream) {
      throw new Error("File path uploads are not supported in this environment.");
    }
    const data = fs.createReadStream(file.path);
    const contentLength = file.contentLength ?? (noSniffFileSize === true ? undefined : await tryGetFileSizeFromPath(file.path));
    const filename = file.filename ?? getNameFromPath(file.path);
    return {
      data,
      filename,
      contentType: file.contentType,
      contentLength
    };
  }
  if ("data" in file) {
    const data = file.data;
    const contentLength = file.contentLength ?? await tryGetContentLengthFromFileLike(data, {
      noSniffFileSize
    });
    const filename = file.filename ?? tryGetNameFromFileLike(data);
    return {
      data,
      filename,
      contentType: file.contentType ?? tryGetContentTypeFromFileLike(data),
      contentLength
    };
  }
  throw new Error(`Invalid FileUpload of type ${typeof file}: ${JSON.stringify(file)}`);
}
function isFileLike(value) {
  return isBuffer(value) || isArrayBufferView(value) || isArrayBuffer(value) || isUint8Array(value) || isBlob(value) || isFile(value) || isStreamLike(value) || isReadableStream(value);
}
async function tryGetFileSizeFromPath(path) {
  try {
    const fs = await import("fs");
    if (!fs?.promises?.stat) {
      return;
    }
    const fileStat = await fs.promises.stat(path);
    return fileStat.size;
  } catch (_fallbackError) {
    return;
  }
}
function tryGetNameFromFileLike(data) {
  if (isNamedValue(data)) {
    return data.name;
  }
  if (isPathedValue(data)) {
    return getNameFromPath(data.path.toString());
  }
  return;
}
async function tryGetContentLengthFromFileLike(data, { noSniffFileSize } = {}) {
  if (isBuffer(data)) {
    return data.length;
  }
  if (isArrayBufferView(data)) {
    return data.byteLength;
  }
  if (isArrayBuffer(data)) {
    return data.byteLength;
  }
  if (isBlob(data)) {
    return data.size;
  }
  if (isFile(data)) {
    return data.size;
  }
  if (noSniffFileSize === true) {
    return;
  }
  if (isPathedValue(data)) {
    return await tryGetFileSizeFromPath(data.path.toString());
  }
  return;
}
function tryGetContentTypeFromFileLike(data) {
  if (isBlob(data)) {
    return data.type;
  }
  if (isFile(data)) {
    return data.type;
  }
  return;
}
function getNameFromPath(path) {
  const lastForwardSlash = path.lastIndexOf("/");
  const lastBackSlash = path.lastIndexOf("\\");
  const lastSlashIndex = Math.max(lastForwardSlash, lastBackSlash);
  return lastSlashIndex >= 0 ? path.substring(lastSlashIndex + 1) : path;
}
function isNamedValue(value) {
  return typeof value === "object" && value != null && "name" in value;
}
function isPathedValue(value) {
  return typeof value === "object" && value != null && "path" in value;
}
function isStreamLike(value) {
  return typeof value === "object" && value != null && (("read" in value) || ("pipe" in value));
}
function isReadableStream(value) {
  return typeof value === "object" && value != null && "getReader" in value;
}
function isBuffer(value) {
  return typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(value);
}
function isArrayBufferView(value) {
  return typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(value);
}
function isArrayBuffer(value) {
  return typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer;
}
function isUint8Array(value) {
  return typeof Uint8Array !== "undefined" && value instanceof Uint8Array;
}
function isBlob(value) {
  return typeof Blob !== "undefined" && value instanceof Blob;
}
function isFile(value) {
  return typeof File !== "undefined" && value instanceof File;
}
// node_modules/supermemory/dist/esm/generated/core/runtime/runtime.js
var RUNTIME = evaluateRuntime();
function evaluateRuntime() {
  const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";
  if (isBrowser) {
    return {
      type: "browser",
      version: window.navigator.userAgent
    };
  }
  const isCloudflare = typeof globalThis !== "undefined" && globalThis?.navigator?.userAgent === "Cloudflare-Workers";
  if (isCloudflare) {
    return {
      type: "workerd"
    };
  }
  const isEdgeRuntime = typeof EdgeRuntime === "string";
  if (isEdgeRuntime) {
    return {
      type: "edge-runtime"
    };
  }
  const isWebWorker = typeof self === "object" && typeof self?.importScripts === "function" && (self.constructor?.name === "DedicatedWorkerGlobalScope" || self.constructor?.name === "ServiceWorkerGlobalScope" || self.constructor?.name === "SharedWorkerGlobalScope");
  if (isWebWorker) {
    return {
      type: "web-worker"
    };
  }
  const isDeno = typeof Deno !== "undefined" && typeof Deno.version !== "undefined" && typeof Deno.version.deno !== "undefined";
  if (isDeno) {
    return {
      type: "deno",
      version: Deno.version.deno,
      os: Deno.build?.os,
      arch: Deno.build?.arch
    };
  }
  const isBun = typeof Bun !== "undefined" && typeof Bun.version !== "undefined";
  if (isBun) {
    return {
      type: "bun",
      version: Bun.version,
      os: typeof process !== "undefined" ? process.platform : undefined,
      arch: typeof process !== "undefined" ? process.arch : undefined
    };
  }
  const isReactNative = typeof navigator !== "undefined" && navigator?.product === "ReactNative";
  if (isReactNative) {
    return {
      type: "react-native"
    };
  }
  const _process = typeof process !== "undefined" ? process : undefined;
  const isNode = typeof _process !== "undefined" && typeof _process.versions?.node === "string";
  if (isNode) {
    return {
      type: "node",
      version: _process.versions.node,
      parsedVersion: Number(_process.versions.node.split(".")[0]),
      os: _process.platform,
      arch: _process.arch
    };
  }
  return {
    type: "unknown"
  };
}
var X86_64_ARCH_ALIASES = new Set(["x64", "amd64", "x86_64"]);
// node_modules/supermemory/dist/esm/generated/core/form-data-utils/FormDataWrapper.js
async function newFormData() {
  return new FormDataWrapper;
}

class FormDataWrapper {
  fd = new FormData;
  async setup() {}
  append(key, value) {
    this.fd.append(key, String(value));
  }
  async appendFile(key, value) {
    if (value == null) {
      throw new Error(`File upload for "${key}" received ${value === null ? "null" : "undefined"}. The generated code should not call appendFile with null/undefined — check that optional file fields are guarded before this call.`);
    }
    const { data, filename, contentType } = await toMultipartDataPart(value);
    const blob = await convertToBlob(data, contentType);
    if (filename) {
      this.fd.append(key, blob, filename);
    } else {
      this.fd.append(key, blob);
    }
  }
  getRequest() {
    return {
      body: this.fd,
      headers: {},
      duplex: "half"
    };
  }
}
function isStreamLike2(value) {
  return typeof value === "object" && value != null && (("read" in value) || ("pipe" in value));
}
function isReadableStream2(value) {
  return typeof value === "object" && value != null && "getReader" in value;
}
function isBuffer2(value) {
  return typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(value);
}
function isArrayBufferView2(value) {
  return ArrayBuffer.isView(value);
}
async function streamToBuffer(stream) {
  if (RUNTIME.type === "node") {
    const { Readable } = await import("stream");
    if (stream instanceof Readable) {
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }
  }
  if (isReadableStream2(stream)) {
    const reader = stream.getReader();
    const chunks = [];
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done)
          break;
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return Buffer.from(result);
  }
  throw new Error(`Unsupported stream type: ${typeof stream}. Expected Node.js Readable stream or Web ReadableStream.`);
}
async function convertToBlob(value, contentType) {
  if (isStreamLike2(value) || isReadableStream2(value)) {
    const buffer = await streamToBuffer(value);
    return new Blob([buffer], { type: contentType });
  }
  if (value instanceof Blob) {
    return value;
  }
  if (isBuffer2(value)) {
    return new Blob([value], { type: contentType });
  }
  if (value instanceof ArrayBuffer) {
    return new Blob([value], { type: contentType });
  }
  if (isArrayBufferView2(value)) {
    return new Blob([value], { type: contentType });
  }
  if (typeof value === "string") {
    return new Blob([value], { type: contentType });
  }
  if (typeof value === "object" && value !== null) {
    return new Blob([toJson2(value)], { type: contentType ?? "application/json" });
  }
  return new Blob([String(value)], { type: contentType });
}
// node_modules/supermemory/dist/esm/generated/core/url/encodePathParam.js
function encodePathParam(param) {
  if (param === null) {
    return "null";
  }
  const typeofParam = typeof param;
  switch (typeofParam) {
    case "undefined":
      return "undefined";
    case "string":
    case "number":
    case "boolean":
      break;
    default:
      param = String(param);
      break;
  }
  return encodeURIComponent(param);
}
// node_modules/supermemory/dist/esm/generated/core/url/QueryStringBuilder.js
function queryBuilder() {
  return new QueryStringBuilder;
}

class QueryStringBuilder {
  parts = new Map;
  add(key, value, options) {
    if (value === undefined || value === null) {
      return this;
    }
    const serialized = toQueryString({ [key]: value }, { arrayFormat: options?.style === "comma" ? "comma" : "repeat" });
    if (serialized.length > 0) {
      this.parts.set(key, serialized);
    }
    return this;
  }
  addMany(params) {
    if (params != null) {
      for (const [key, value] of Object.entries(params)) {
        this.add(key, value);
      }
    }
    return this;
  }
  mergeAdditional(additionalParams) {
    if (additionalParams != null) {
      for (const [key, value] of Object.entries(additionalParams)) {
        if (value === undefined || value === null) {
          continue;
        }
        const serialized = toQueryString({ [key]: value }, { arrayFormat: "repeat" });
        if (serialized.length > 0) {
          this.parts.set(key, serialized);
        }
      }
    }
    return this;
  }
  build() {
    return [...this.parts.values()].join("&");
  }
}
// node_modules/supermemory/dist/esm/generated/errors/SupermemoryError.js
class SupermemoryError extends Error {
  statusCode;
  body;
  rawResponse;
  cause;
  constructor({ message, statusCode, body, rawResponse, cause }) {
    super(buildMessage({ message, statusCode, body }));
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = "SupermemoryError";
    this.statusCode = statusCode;
    this.body = body;
    this.rawResponse = rawResponse;
    if (cause != null) {
      this.cause = cause;
    }
  }
  get requestId() {
    return this.rawResponse?.headers?.get("x-request-id") ?? undefined;
  }
}
function buildMessage({ message, statusCode, body }) {
  const lines = [];
  if (message != null) {
    lines.push(message);
  }
  if (statusCode != null) {
    lines.push(`Status code: ${statusCode.toString()}`);
  }
  if (body != null) {
    lines.push(`Body: ${toJson2(body, undefined, 2)}`);
  }
  return lines.join(`
`);
}
// node_modules/supermemory/dist/esm/generated/errors/SupermemoryTimeoutError.js
class SupermemoryTimeoutError extends SupermemoryError {
  constructor(message, opts) {
    super({
      message,
      cause: opts?.cause
    });
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = "SupermemoryTimeoutError";
  }
}
// node_modules/supermemory/dist/esm/generated/auth/BearerAuthProvider.js
var TOKEN_PARAM = "apiKey";
var ENV_TOKEN = "SUPERMEMORY_API_KEY";

class BearerAuthProvider {
  options;
  constructor(options) {
    this.options = options;
  }
  static canCreate(options) {
    return options?.[TOKEN_PARAM] != null || process.env?.[ENV_TOKEN] != null;
  }
  async getAuthRequest({ endpointMetadata } = {}) {
    const apiKey = await Supplier.get(this.options[TOKEN_PARAM]) ?? process.env?.[ENV_TOKEN];
    if (apiKey == null) {
      throw new SupermemoryError({
        message: BearerAuthProvider.AUTH_CONFIG_ERROR_MESSAGE
      });
    }
    return {
      headers: { Authorization: `Bearer ${apiKey}` }
    };
  }
}
(function(BearerAuthProvider) {
  BearerAuthProvider.AUTH_SCHEME = "bearerAuth";
  BearerAuthProvider.AUTH_CONFIG_ERROR_MESSAGE = `Please provide '${TOKEN_PARAM}' when initializing the client, or set the '${ENV_TOKEN}' environment variable`;
  function createInstance(options) {
    return new BearerAuthProvider(options);
  }
  BearerAuthProvider.createInstance = createInstance;
})(BearerAuthProvider || (BearerAuthProvider = {}));

// node_modules/supermemory/dist/esm/generated/core/headers.js
function mergeHeaders(...headersArray) {
  const result = {};
  for (const [key, value] of headersArray.filter((headers) => headers != null).flatMap((headers) => Object.entries(headers))) {
    const insensitiveKey = key.toLowerCase();
    if (value != null) {
      result[insensitiveKey] = value;
    } else if (insensitiveKey in result) {
      delete result[insensitiveKey];
    }
  }
  return result;
}
function mergeOnlyDefinedHeaders(...headersArray) {
  const result = {};
  for (const [key, value] of headersArray.filter((headers) => headers != null).flatMap((headers) => Object.entries(headers))) {
    const insensitiveKey = key.toLowerCase();
    if (value != null) {
      result[insensitiveKey] = value;
    }
  }
  return result;
}

// node_modules/supermemory/dist/esm/generated/BaseClient.js
function normalizeClientOptions(options) {
  const headers = mergeHeaders({
    "X-Fern-Language": "JavaScript",
    "X-Fern-Runtime": RUNTIME.type,
    "X-Fern-Runtime-Version": RUNTIME.version
  }, options?.headers);
  return {
    ...options,
    logging: createLogger(options?.logging),
    headers
  };
}
function normalizeClientOptionsWithAuth(options) {
  const normalized = normalizeClientOptions(options);
  if (options.auth === false) {
    normalized.authProvider = new NoOpAuthProvider;
    return normalized;
  }
  if (options.auth != null) {
    if (typeof options.auth === "function") {
      normalized.authProvider = { getAuthRequest: options.auth };
      return normalized;
    }
    if (isAuthProvider(options.auth)) {
      normalized.authProvider = options.auth;
      return normalized;
    }
    Object.assign(normalized, options.auth);
  }
  const normalizedWithNoOpAuthProvider = withNoOpAuthProvider(normalized);
  normalized.authProvider ??= new BearerAuthProvider(normalizedWithNoOpAuthProvider);
  return normalized;
}
function withNoOpAuthProvider(options) {
  return {
    ...options,
    authProvider: new NoOpAuthProvider
  };
}

// node_modules/supermemory/dist/esm/generated/core/requestBody.js
function mergeAdditionalBodyParameters(body, additionalBodyParameters) {
  if (additionalBodyParameters == null) {
    return body;
  }
  if (body == null) {
    return { ...additionalBodyParameters };
  }
  if (typeof body === "object" && !Array.isArray(body)) {
    return { ...body, ...additionalBodyParameters };
  }
  return body;
}

// node_modules/supermemory/dist/esm/generated/environments.js
var SupermemoryEnvironment = {
  Default: "https://api.supermemory.ai"
};

// node_modules/supermemory/dist/esm/generated/errors/handleNonStatusCodeError.js
function handleNonStatusCodeError(error, rawResponse, method, path) {
  switch (error.reason) {
    case "non-json":
      throw new SupermemoryError({
        statusCode: error.statusCode,
        body: error.rawBody,
        rawResponse
      });
    case "body-is-null":
      throw new SupermemoryError({
        statusCode: error.statusCode,
        rawResponse
      });
    case "timeout":
      throw new SupermemoryTimeoutError(`Timeout exceeded when calling ${method} ${path}.`, {
        cause: error.cause
      });
    case "unknown":
      throw new SupermemoryError({
        message: error.errorMessage,
        rawResponse,
        cause: error.cause
      });
    default:
      throw new SupermemoryError({
        message: "Unknown error",
        rawResponse
      });
  }
}

// node_modules/supermemory/dist/esm/generated/api/errors/BadRequestError.js
class BadRequestError extends SupermemoryError {
  constructor(body, rawResponse) {
    super({
      message: "BadRequestError",
      statusCode: 400,
      body,
      rawResponse
    });
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = "BadRequestError";
  }
}

// node_modules/supermemory/dist/esm/generated/api/errors/ConflictError.js
class ConflictError extends SupermemoryError {
  constructor(body, rawResponse) {
    super({
      message: "ConflictError",
      statusCode: 409,
      body,
      rawResponse
    });
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = "ConflictError";
  }
}

// node_modules/supermemory/dist/esm/generated/api/errors/ForbiddenError.js
class ForbiddenError extends SupermemoryError {
  constructor(body, rawResponse) {
    super({
      message: "ForbiddenError",
      statusCode: 403,
      body,
      rawResponse
    });
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = "ForbiddenError";
  }
}

// node_modules/supermemory/dist/esm/generated/api/errors/InternalServerError.js
class InternalServerError extends SupermemoryError {
  constructor(body, rawResponse) {
    super({
      message: "InternalServerError",
      statusCode: 500,
      body,
      rawResponse
    });
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = "InternalServerError";
  }
}

// node_modules/supermemory/dist/esm/generated/api/errors/NotFoundError.js
class NotFoundError extends SupermemoryError {
  constructor(body, rawResponse) {
    super({
      message: "NotFoundError",
      statusCode: 404,
      body,
      rawResponse
    });
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = "NotFoundError";
  }
}

// node_modules/supermemory/dist/esm/generated/api/errors/PaymentRequiredError.js
class PaymentRequiredError extends SupermemoryError {
  constructor(body, rawResponse) {
    super({
      message: "PaymentRequiredError",
      statusCode: 402,
      body,
      rawResponse
    });
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = "PaymentRequiredError";
  }
}

// node_modules/supermemory/dist/esm/generated/api/errors/ServiceUnavailableError.js
class ServiceUnavailableError extends SupermemoryError {
  constructor(body, rawResponse) {
    super({
      message: "ServiceUnavailableError",
      statusCode: 503,
      body,
      rawResponse
    });
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = "ServiceUnavailableError";
  }
}

// node_modules/supermemory/dist/esm/generated/api/errors/UnauthorizedError.js
class UnauthorizedError extends SupermemoryError {
  constructor(body, rawResponse) {
    super({
      message: "UnauthorizedError",
      statusCode: 401,
      body,
      rawResponse
    });
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = "UnauthorizedError";
  }
}

// node_modules/supermemory/dist/esm/generated/api/resources/connectors/client/Client.js
class ConnectorsClient {
  _options;
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  listAll(request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__listAll(request, requestOptions));
  }
  async __listAll(request = {}, requestOptions) {
    const { provider, page, limit } = request;
    const _queryParams = {
      provider: provider != null ? provider : undefined,
      page,
      limit
    };
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, "connectors"),
      method: "GET",
      headers: _headers,
      queryString: queryBuilder().addMany(_queryParams).mergeAdditional(requestOptions?.queryParams).build(),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return {
        data: _response.body,
        rawResponse: _response.rawResponse
      };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/connectors");
  }
  list(namespace, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(namespace, request, requestOptions));
  }
  async __list(namespace, request = {}, requestOptions) {
    const { provider, page, limit } = request;
    const _queryParams = {
      provider: provider != null ? provider : undefined,
      page,
      limit
    };
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/connectors`),
      method: "GET",
      headers: _headers,
      queryString: queryBuilder().addMany(_queryParams).mergeAdditional(requestOptions?.queryParams).build(),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/ns/{namespace}/connectors");
  }
  create(namespace, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__create(namespace, request, requestOptions));
  }
  async __create(namespace, request, requestOptions) {
    const { body: _body } = request;
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/connectors`),
      method: "POST",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(_body, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 402:
          throw new PaymentRequiredError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        case 503:
          throw new ServiceUnavailableError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/ns/{namespace}/connectors");
  }
  get(namespace, id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__get(namespace, id, request, requestOptions));
  }
  async __get(namespace, id, request = {}, requestOptions) {
    const { include, returnUrl } = request;
    const _queryParams = {
      include: Array.isArray(include) ? include.map((item) => item) : include != null ? include : undefined,
      returnUrl
    };
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/connectors/${encodePathParam(id)}`),
      method: "GET",
      headers: _headers,
      queryString: queryBuilder().addMany(_queryParams).mergeAdditional(requestOptions?.queryParams).build(),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 404:
          throw new NotFoundError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/ns/{namespace}/connectors/{id}");
  }
  delete(namespace, id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__delete(namespace, id, request, requestOptions));
  }
  async __delete(namespace, id, request = {}, requestOptions) {
    const { deleteDocuments } = request;
    const _queryParams = {
      deleteDocuments
    };
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/connectors/${encodePathParam(id)}`),
      method: "DELETE",
      headers: _headers,
      queryString: queryBuilder().addMany(_queryParams).mergeAdditional(requestOptions?.queryParams).build(),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 404:
          throw new NotFoundError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "DELETE", "/ns/{namespace}/connectors/{id}");
  }
  update(namespace, id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__update(namespace, id, request, requestOptions));
  }
  async __update(namespace, id, request = {}, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/connectors/${encodePathParam(id)}`),
      method: "PATCH",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(request, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 404:
          throw new NotFoundError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "PATCH", "/ns/{namespace}/connectors/{id}");
  }
  sync(namespace, id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__sync(namespace, id, request, requestOptions));
  }
  async __sync(namespace, id, _request = {}, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/connectors/${encodePathParam(id)}/sync`),
      method: "POST",
      headers: _headers,
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 402:
          throw new PaymentRequiredError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 404:
          throw new NotFoundError(_response.error.body, _response.rawResponse);
        case 409:
          throw new ConflictError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        case 503:
          throw new ServiceUnavailableError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/ns/{namespace}/connectors/{id}/sync");
  }
}

// node_modules/supermemory/dist/esm/generated/api/resources/documents/client/Client.js
class DocumentsClient {
  _options;
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  delete(namespace, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__delete(namespace, request, requestOptions));
  }
  async __delete(namespace, request, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/document`),
      method: "DELETE",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(request, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "DELETE", "/ns/{namespace}/document");
  }
  batchAdd(namespace, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__batchAdd(namespace, request, requestOptions));
  }
  async __batchAdd(namespace, request, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/document/batch`),
      method: "POST",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(request, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return {
        data: _response.body,
        rawResponse: _response.rawResponse
      };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 402:
          throw new PaymentRequiredError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/ns/{namespace}/document/batch");
  }
  get(namespace, id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__get(namespace, id, request, requestOptions));
  }
  async __get(namespace, id, request = {}, requestOptions) {
    const { include } = request;
    const _queryParams = {
      include: Array.isArray(include) ? include.map((item) => item) : include != null ? include : undefined
    };
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/document/${encodePathParam(id)}`),
      method: "GET",
      headers: _headers,
      queryString: queryBuilder().addMany(_queryParams).mergeAdditional(requestOptions?.queryParams).build(),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 404:
          throw new NotFoundError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/ns/{namespace}/document/{id}");
  }
  update(namespace, id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__update(namespace, id, request, requestOptions));
  }
  async __update(namespace, id, request = {}, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/document/${encodePathParam(id)}`),
      method: "PATCH",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(request, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 402:
          throw new PaymentRequiredError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 404:
          throw new NotFoundError(_response.error.body, _response.rawResponse);
        case 409:
          throw new ConflictError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "PATCH", "/ns/{namespace}/document/{id}");
  }
  uploadFile(namespace, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__uploadFile(namespace, request, requestOptions));
  }
  async __uploadFile(namespace, request, requestOptions) {
    const _body = await newFormData();
    await _body.appendFile("file", request.file);
    if (request.supportingContext != null) {
      _body.append("supportingContext", request.supportingContext);
    }
    if (request.metadata != null) {
      _body.append("metadata", request.metadata);
    }
    if (request.group != null) {
      _body.append("group", request.group);
    }
    if (request.date != null) {
      _body.append("date", request.date);
    }
    if (request.taskType != null) {
      _body.append("taskType", request.taskType);
    }
    if (request.dreaming != null) {
      _body.append("dreaming", request.dreaming);
    }
    if (request.fileType != null) {
      _body.append("fileType", request.fileType);
    }
    if (request.mimeType != null) {
      _body.append("mimeType", request.mimeType);
    }
    const _maybeEncodedRequest = await _body.getRequest();
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, mergeOnlyDefinedHeaders({ ..._maybeEncodedRequest.headers }), requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/document/file`),
      method: "POST",
      headers: _headers,
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "file",
      duplex: _maybeEncodedRequest.duplex,
      body: _maybeEncodedRequest.body,
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return {
        data: _response.body,
        rawResponse: _response.rawResponse
      };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 402:
          throw new PaymentRequiredError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 409:
          throw new ConflictError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/ns/{namespace}/document/file");
  }
  replaceWithFile(namespace, id, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__replaceWithFile(namespace, id, request, requestOptions));
  }
  async __replaceWithFile(namespace, id, request, requestOptions) {
    const _body = await newFormData();
    await _body.appendFile("file", request.file);
    if (request.supportingContext != null) {
      _body.append("supportingContext", request.supportingContext);
    }
    if (request.metadata != null) {
      _body.append("metadata", request.metadata);
    }
    if (request.group != null) {
      _body.append("group", request.group);
    }
    if (request.date != null) {
      _body.append("date", request.date);
    }
    if (request.taskType != null) {
      _body.append("taskType", request.taskType);
    }
    if (request.dreaming != null) {
      _body.append("dreaming", request.dreaming);
    }
    if (request.fileType != null) {
      _body.append("fileType", request.fileType);
    }
    if (request.mimeType != null) {
      _body.append("mimeType", request.mimeType);
    }
    const _maybeEncodedRequest = await _body.getRequest();
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, mergeOnlyDefinedHeaders({ ..._maybeEncodedRequest.headers }), requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/document/file/${encodePathParam(id)}`),
      method: "POST",
      headers: _headers,
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "file",
      duplex: _maybeEncodedRequest.duplex,
      body: _maybeEncodedRequest.body,
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return {
        data: _response.body,
        rawResponse: _response.rawResponse
      };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 402:
          throw new PaymentRequiredError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 404:
          throw new NotFoundError(_response.error.body, _response.rawResponse);
        case 409:
          throw new ConflictError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/ns/{namespace}/document/file/{id}");
  }
  updateFile(namespace, id, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__updateFile(namespace, id, request, requestOptions));
  }
  async __updateFile(namespace, id, request, requestOptions) {
    const _body = await newFormData();
    if (request.file != null) {
      await _body.appendFile("file", request.file);
    }
    if (request.supportingContext != null) {
      _body.append("supportingContext", request.supportingContext);
    }
    if (request.metadata != null) {
      _body.append("metadata", request.metadata);
    }
    if (request.group != null) {
      _body.append("group", request.group);
    }
    if (request.date != null) {
      _body.append("date", request.date);
    }
    if (request.taskType != null) {
      _body.append("taskType", request.taskType);
    }
    if (request.dreaming != null) {
      _body.append("dreaming", request.dreaming);
    }
    if (request.fileType != null) {
      _body.append("fileType", request.fileType);
    }
    if (request.mimeType != null) {
      _body.append("mimeType", request.mimeType);
    }
    const _maybeEncodedRequest = await _body.getRequest();
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, mergeOnlyDefinedHeaders({ ..._maybeEncodedRequest.headers }), requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/document/file/${encodePathParam(id)}`),
      method: "PATCH",
      headers: _headers,
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "file",
      duplex: _maybeEncodedRequest.duplex,
      body: _maybeEncodedRequest.body,
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return {
        data: _response.body,
        rawResponse: _response.rawResponse
      };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 402:
          throw new PaymentRequiredError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 404:
          throw new NotFoundError(_response.error.body, _response.rawResponse);
        case 409:
          throw new ConflictError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "PATCH", "/ns/{namespace}/document/file/{id}");
  }
}

// node_modules/supermemory/dist/esm/generated/api/resources/memories/client/Client.js
class MemoriesClient {
  _options;
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  forget(namespace, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__forget(namespace, request, requestOptions));
  }
  async __forget(namespace, request, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/memories`),
      method: "DELETE",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(request, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "DELETE", "/ns/{namespace}/memories");
  }
  forgetMatching(namespace, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__forgetMatching(namespace, request, requestOptions));
  }
  async __forgetMatching(namespace, request, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/memories/semantic`),
      method: "DELETE",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(request, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return {
        data: _response.body,
        rawResponse: _response.rawResponse
      };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "DELETE", "/ns/{namespace}/memories/semantic");
  }
  get(namespace, id, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__get(namespace, id, request, requestOptions));
  }
  async __get(namespace, id, request = {}, requestOptions) {
    const { include, relatedLimit } = request;
    const _queryParams = {
      include: Array.isArray(include) ? include.map((item) => item) : include != null ? include : undefined,
      relatedLimit
    };
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/memories/${encodePathParam(id)}`),
      method: "GET",
      headers: _headers,
      queryString: queryBuilder().addMany(_queryParams).mergeAdditional(requestOptions?.queryParams).build(),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 404:
          throw new NotFoundError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/ns/{namespace}/memories/{id}");
  }
}

// node_modules/supermemory/dist/esm/generated/api/resources/namespaces/client/Client.js
class NamespacesClient {
  _options;
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  list(request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(request, requestOptions));
  }
  async __list(request = {}, requestOptions) {
    const { page, limit } = request;
    const _queryParams = {
      page,
      limit
    };
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, "ns"),
      method: "GET",
      headers: _headers,
      queryString: queryBuilder().addMany(_queryParams).mergeAdditional(requestOptions?.queryParams).build(),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/ns");
  }
  get(namespace, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__get(namespace, request, requestOptions));
  }
  async __get(namespace, _request = {}, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}`),
      method: "GET",
      headers: _headers,
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 404:
          throw new NotFoundError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/ns/{namespace}");
  }
  delete(namespace, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__delete(namespace, request, requestOptions));
  }
  async __delete(namespace, request = {}, requestOptions) {
    const { moveTo } = request;
    const _queryParams = {
      moveTo
    };
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}`),
      method: "DELETE",
      headers: _headers,
      queryString: queryBuilder().addMany(_queryParams).mergeAdditional(requestOptions?.queryParams).build(),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 404:
          throw new NotFoundError(_response.error.body, _response.rawResponse);
        case 409:
          throw new ConflictError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "DELETE", "/ns/{namespace}");
  }
  update(namespace, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__update(namespace, request, requestOptions));
  }
  async __update(namespace, request = {}, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}`),
      method: "PATCH",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(request, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 404:
          throw new NotFoundError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "PATCH", "/ns/{namespace}");
  }
}

// node_modules/supermemory/dist/esm/generated/api/resources/organization/client/Client.js
class OrganizationClient {
  _options;
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get(requestOptions) {
    return HttpResponsePromise.fromPromise(this.__get(requestOptions));
  }
  async __get(requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, "organization"),
      method: "GET",
      headers: _headers,
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/organization");
  }
  update(request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__update(request, requestOptions));
  }
  async __update(request, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, "organization"),
      method: "PATCH",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(request, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return {
        data: _response.body,
        rawResponse: _response.rawResponse
      };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "PATCH", "/organization");
  }
}

// node_modules/supermemory/dist/esm/generated/api/resources/profiles/client/Client.js
class ProfilesClient {
  _options;
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  getBuckets(namespace, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__getBuckets(namespace, request, requestOptions));
  }
  async __getBuckets(namespace, _request = {}, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/profile/buckets`),
      method: "GET",
      headers: _headers,
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return {
        data: _response.body,
        rawResponse: _response.rawResponse
      };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "GET", "/ns/{namespace}/profile/buckets");
  }
  setBuckets(namespace, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__setBuckets(namespace, request, requestOptions));
  }
  async __setBuckets(namespace, request, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/profile/buckets`),
      method: "PUT",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(request, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return {
        data: _response.body,
        rawResponse: _response.rawResponse
      };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 404:
          throw new NotFoundError(_response.error.body, _response.rawResponse);
        case 409:
          throw new ConflictError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "PUT", "/ns/{namespace}/profile/buckets");
  }
  deleteBuckets(namespace, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__deleteBuckets(namespace, request, requestOptions));
  }
  async __deleteBuckets(namespace, request, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/profile/buckets`),
      method: "DELETE",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(request, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return {
        data: _response.body,
        rawResponse: _response.rawResponse
      };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 404:
          throw new NotFoundError(_response.error.body, _response.rawResponse);
        case 409:
          throw new ConflictError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "DELETE", "/ns/{namespace}/profile/buckets");
  }
}

// node_modules/supermemory/dist/esm/generated/Client.js
class SupermemoryClient {
  _options;
  _documents;
  _profiles;
  _memories;
  _connectors;
  _namespaces;
  _organization;
  constructor(options = {}) {
    this._options = normalizeClientOptionsWithAuth(options);
  }
  get documents() {
    return this._documents ??= new DocumentsClient(this._options);
  }
  get profiles() {
    return this._profiles ??= new ProfilesClient(this._options);
  }
  get memories() {
    return this._memories ??= new MemoriesClient(this._options);
  }
  get connectors() {
    return this._connectors ??= new ConnectorsClient(this._options);
  }
  get namespaces() {
    return this._namespaces ??= new NamespacesClient(this._options);
  }
  get organization() {
    return this._organization ??= new OrganizationClient(this._options);
  }
  add(namespace, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__add(namespace, request, requestOptions));
  }
  async __add(namespace, request, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/document`),
      method: "POST",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(request, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 402:
          throw new PaymentRequiredError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 409:
          throw new ConflictError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/ns/{namespace}/document");
  }
  search(namespace, request, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__search(namespace, request, requestOptions));
  }
  async __search(namespace, request, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/search`),
      method: "POST",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(request, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 402:
          throw new PaymentRequiredError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/ns/{namespace}/search");
  }
  profile(namespace, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__profile(namespace, request, requestOptions));
  }
  async __profile(namespace, request = {}, requestOptions) {
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/profile`),
      method: "POST",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(request, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/ns/{namespace}/profile");
  }
  list(namespace, type, request = {}, requestOptions) {
    return HttpResponsePromise.fromPromise(this.__list(namespace, type, request, requestOptions));
  }
  async __list(namespace, type, request = {}, requestOptions) {
    const { page, limit, sort, order, ..._body } = request;
    const _queryParams = {
      page,
      limit,
      sort: sort != null ? sort : undefined,
      order: order != null ? order : undefined
    };
    const _authRequest = await this._options.authProvider.getAuthRequest();
    const _headers = mergeHeaders(_authRequest.headers, this._options?.headers, requestOptions?.headers);
    const _response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/list/${encodePathParam(type)}`),
      method: "POST",
      headers: _headers,
      contentType: "application/json",
      queryString: queryBuilder().addMany(_queryParams).mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: mergeAdditionalBodyParameters(_body, requestOptions?.additionalBodyParameters),
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options?.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options?.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options?.fetch,
      logging: this._options.logging
    });
    if (_response.ok) {
      return { data: _response.body, rawResponse: _response.rawResponse };
    }
    if (_response.error.reason === "status-code") {
      switch (_response.error.statusCode) {
        case 400:
          throw new BadRequestError(_response.error.body, _response.rawResponse);
        case 401:
          throw new UnauthorizedError(_response.error.body, _response.rawResponse);
        case 403:
          throw new ForbiddenError(_response.error.body, _response.rawResponse);
        case 500:
          throw new InternalServerError(_response.error.body, _response.rawResponse);
        default:
          throw new SupermemoryError({
            statusCode: _response.error.statusCode,
            body: _response.error.body,
            rawResponse: _response.rawResponse
          });
      }
    }
    return handleNonStatusCodeError(_response.error, _response.rawResponse, "POST", "/ns/{namespace}/list/{type}");
  }
  async fetch(input, init, requestOptions) {
    return makePassthroughRequest(input, init, {
      baseUrl: this._options.baseUrl ?? this._options.environment,
      headers: this._options.headers,
      timeoutInSeconds: this._options.timeoutInSeconds,
      maxRetries: this._options.maxRetries,
      fetch: this._options.fetch,
      logging: this._options.logging,
      getAuthHeaders: async () => (await this._options.authProvider.getAuthRequest()).headers
    }, requestOptions);
  }
}
// node_modules/supermemory/dist/esm/index.js
class Connectors extends ConnectorsClient {
  create(namespace, request, requestOptions) {
    return super.create(namespace, "provider" in request ? { body: request } : request, requestOptions);
  }
}

class Supermemory extends SupermemoryClient {
  get connectors() {
    return this._connectors ??= new Connectors(this._options);
  }
  async profileMarkdown(namespace, request = {}, requestOptions) {
    const auth = await this._options.authProvider.getAuthRequest();
    const response = await fetcher({
      url: join(await Supplier.get(this._options.baseUrl) ?? await Supplier.get(this._options.environment) ?? SupermemoryEnvironment.Default, `ns/${encodePathParam(namespace)}/profile`),
      method: "POST",
      headers: mergeHeaders(auth.headers, this._options.headers, requestOptions?.headers, { Accept: "text/markdown" }),
      contentType: "application/json",
      queryString: queryBuilder().mergeAdditional(requestOptions?.queryParams).build(),
      requestType: "json",
      body: request,
      responseType: "text",
      timeoutMs: (requestOptions?.timeoutInSeconds ?? this._options.timeoutInSeconds ?? 60) * 1000,
      maxRetries: requestOptions?.maxRetries ?? this._options.maxRetries,
      abortSignal: requestOptions?.abortSignal,
      fetchFn: this._options.fetch,
      logging: this._options.logging
    });
    if (response.ok)
      return response.body;
    if (response.error.reason === "status-code") {
      throw new SupermemoryError({ statusCode: response.error.statusCode, body: response.error.body, rawResponse: response.rawResponse });
    }
    return handleNonStatusCodeError(response.error, response.rawResponse, "POST", `/ns/${namespace}/profile`);
  }
}

// src/index.ts
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join as join3 } from "node:path";
import { homedir as homedir2 } from "node:os";

// src/config.ts
import { existsSync, readFileSync } from "node:fs";
import { join as join2 } from "node:path";
import { homedir } from "node:os";

// node_modules/jsonc-parser/lib/esm/impl/scanner.js
function createScanner(text, ignoreTrivia = false) {
  const len = text.length;
  let pos = 0, value = "", tokenOffset = 0, token = 16, lineNumber = 0, lineStartOffset = 0, tokenLineStartOffset = 0, prevTokenLineStartOffset = 0, scanError = 0;
  function scanHexDigits(count, exact) {
    let digits = 0;
    let value = 0;
    while (digits < count || !exact) {
      let ch = text.charCodeAt(pos);
      if (ch >= 48 && ch <= 57) {
        value = value * 16 + ch - 48;
      } else if (ch >= 65 && ch <= 70) {
        value = value * 16 + ch - 65 + 10;
      } else if (ch >= 97 && ch <= 102) {
        value = value * 16 + ch - 97 + 10;
      } else {
        break;
      }
      pos++;
      digits++;
    }
    if (digits < count) {
      value = -1;
    }
    return value;
  }
  function setPosition(newPosition) {
    pos = newPosition;
    value = "";
    tokenOffset = 0;
    token = 16;
    scanError = 0;
  }
  function scanNumber() {
    let start = pos;
    if (text.charCodeAt(pos) === 48) {
      pos++;
    } else {
      pos++;
      while (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
      }
    }
    if (pos < text.length && text.charCodeAt(pos) === 46) {
      pos++;
      if (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
        while (pos < text.length && isDigit(text.charCodeAt(pos))) {
          pos++;
        }
      } else {
        scanError = 3;
        return text.substring(start, pos);
      }
    }
    let end = pos;
    if (pos < text.length && (text.charCodeAt(pos) === 69 || text.charCodeAt(pos) === 101)) {
      pos++;
      if (pos < text.length && text.charCodeAt(pos) === 43 || text.charCodeAt(pos) === 45) {
        pos++;
      }
      if (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
        while (pos < text.length && isDigit(text.charCodeAt(pos))) {
          pos++;
        }
        end = pos;
      } else {
        scanError = 3;
      }
    }
    return text.substring(start, end);
  }
  function scanString() {
    let result = "", start = pos;
    while (true) {
      if (pos >= len) {
        result += text.substring(start, pos);
        scanError = 2;
        break;
      }
      const ch = text.charCodeAt(pos);
      if (ch === 34) {
        result += text.substring(start, pos);
        pos++;
        break;
      }
      if (ch === 92) {
        result += text.substring(start, pos);
        pos++;
        if (pos >= len) {
          scanError = 2;
          break;
        }
        const ch2 = text.charCodeAt(pos++);
        switch (ch2) {
          case 34:
            result += '"';
            break;
          case 92:
            result += "\\";
            break;
          case 47:
            result += "/";
            break;
          case 98:
            result += "\b";
            break;
          case 102:
            result += "\f";
            break;
          case 110:
            result += `
`;
            break;
          case 114:
            result += "\r";
            break;
          case 116:
            result += "\t";
            break;
          case 117:
            const ch3 = scanHexDigits(4, true);
            if (ch3 >= 0) {
              result += String.fromCharCode(ch3);
            } else {
              scanError = 4;
            }
            break;
          default:
            scanError = 5;
        }
        start = pos;
        continue;
      }
      if (ch >= 0 && ch <= 31) {
        if (isLineBreak(ch)) {
          result += text.substring(start, pos);
          scanError = 2;
          break;
        } else {
          scanError = 6;
        }
      }
      pos++;
    }
    return result;
  }
  function scanNext() {
    value = "";
    scanError = 0;
    tokenOffset = pos;
    lineStartOffset = lineNumber;
    prevTokenLineStartOffset = tokenLineStartOffset;
    if (pos >= len) {
      tokenOffset = len;
      return token = 17;
    }
    let code = text.charCodeAt(pos);
    if (isWhiteSpace(code)) {
      do {
        pos++;
        value += String.fromCharCode(code);
        code = text.charCodeAt(pos);
      } while (isWhiteSpace(code));
      return token = 15;
    }
    if (isLineBreak(code)) {
      pos++;
      value += String.fromCharCode(code);
      if (code === 13 && text.charCodeAt(pos) === 10) {
        pos++;
        value += `
`;
      }
      lineNumber++;
      tokenLineStartOffset = pos;
      return token = 14;
    }
    switch (code) {
      case 123:
        pos++;
        return token = 1;
      case 125:
        pos++;
        return token = 2;
      case 91:
        pos++;
        return token = 3;
      case 93:
        pos++;
        return token = 4;
      case 58:
        pos++;
        return token = 6;
      case 44:
        pos++;
        return token = 5;
      case 34:
        pos++;
        value = scanString();
        return token = 10;
      case 47:
        const start = pos - 1;
        if (text.charCodeAt(pos + 1) === 47) {
          pos += 2;
          while (pos < len) {
            if (isLineBreak(text.charCodeAt(pos))) {
              break;
            }
            pos++;
          }
          value = text.substring(start, pos);
          return token = 12;
        }
        if (text.charCodeAt(pos + 1) === 42) {
          pos += 2;
          const safeLength = len - 1;
          let commentClosed = false;
          while (pos < safeLength) {
            const ch = text.charCodeAt(pos);
            if (ch === 42 && text.charCodeAt(pos + 1) === 47) {
              pos += 2;
              commentClosed = true;
              break;
            }
            pos++;
            if (isLineBreak(ch)) {
              if (ch === 13 && text.charCodeAt(pos) === 10) {
                pos++;
              }
              lineNumber++;
              tokenLineStartOffset = pos;
            }
          }
          if (!commentClosed) {
            pos++;
            scanError = 1;
          }
          value = text.substring(start, pos);
          return token = 13;
        }
        value += String.fromCharCode(code);
        pos++;
        return token = 16;
      case 45:
        value += String.fromCharCode(code);
        pos++;
        if (pos === len || !isDigit(text.charCodeAt(pos))) {
          return token = 16;
        }
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        value += scanNumber();
        return token = 11;
      default:
        while (pos < len && isUnknownContentCharacter(code)) {
          pos++;
          code = text.charCodeAt(pos);
        }
        if (tokenOffset !== pos) {
          value = text.substring(tokenOffset, pos);
          switch (value) {
            case "true":
              return token = 8;
            case "false":
              return token = 9;
            case "null":
              return token = 7;
          }
          return token = 16;
        }
        value += String.fromCharCode(code);
        pos++;
        return token = 16;
    }
  }
  function isUnknownContentCharacter(code) {
    if (isWhiteSpace(code) || isLineBreak(code)) {
      return false;
    }
    switch (code) {
      case 125:
      case 93:
      case 123:
      case 91:
      case 34:
      case 58:
      case 44:
      case 47:
        return false;
    }
    return true;
  }
  function scanNextNonTrivia() {
    let result;
    do {
      result = scanNext();
    } while (result >= 12 && result <= 15);
    return result;
  }
  return {
    setPosition,
    getPosition: () => pos,
    scan: ignoreTrivia ? scanNextNonTrivia : scanNext,
    getToken: () => token,
    getTokenValue: () => value,
    getTokenOffset: () => tokenOffset,
    getTokenLength: () => pos - tokenOffset,
    getTokenStartLine: () => lineStartOffset,
    getTokenStartCharacter: () => tokenOffset - prevTokenLineStartOffset,
    getTokenError: () => scanError
  };
}
function isWhiteSpace(ch) {
  return ch === 32 || ch === 9;
}
function isLineBreak(ch) {
  return ch === 10 || ch === 13;
}
function isDigit(ch) {
  return ch >= 48 && ch <= 57;
}
var CharacterCodes;
(function(CharacterCodes) {
  CharacterCodes[CharacterCodes["lineFeed"] = 10] = "lineFeed";
  CharacterCodes[CharacterCodes["carriageReturn"] = 13] = "carriageReturn";
  CharacterCodes[CharacterCodes["space"] = 32] = "space";
  CharacterCodes[CharacterCodes["_0"] = 48] = "_0";
  CharacterCodes[CharacterCodes["_1"] = 49] = "_1";
  CharacterCodes[CharacterCodes["_2"] = 50] = "_2";
  CharacterCodes[CharacterCodes["_3"] = 51] = "_3";
  CharacterCodes[CharacterCodes["_4"] = 52] = "_4";
  CharacterCodes[CharacterCodes["_5"] = 53] = "_5";
  CharacterCodes[CharacterCodes["_6"] = 54] = "_6";
  CharacterCodes[CharacterCodes["_7"] = 55] = "_7";
  CharacterCodes[CharacterCodes["_8"] = 56] = "_8";
  CharacterCodes[CharacterCodes["_9"] = 57] = "_9";
  CharacterCodes[CharacterCodes["a"] = 97] = "a";
  CharacterCodes[CharacterCodes["b"] = 98] = "b";
  CharacterCodes[CharacterCodes["c"] = 99] = "c";
  CharacterCodes[CharacterCodes["d"] = 100] = "d";
  CharacterCodes[CharacterCodes["e"] = 101] = "e";
  CharacterCodes[CharacterCodes["f"] = 102] = "f";
  CharacterCodes[CharacterCodes["g"] = 103] = "g";
  CharacterCodes[CharacterCodes["h"] = 104] = "h";
  CharacterCodes[CharacterCodes["i"] = 105] = "i";
  CharacterCodes[CharacterCodes["j"] = 106] = "j";
  CharacterCodes[CharacterCodes["k"] = 107] = "k";
  CharacterCodes[CharacterCodes["l"] = 108] = "l";
  CharacterCodes[CharacterCodes["m"] = 109] = "m";
  CharacterCodes[CharacterCodes["n"] = 110] = "n";
  CharacterCodes[CharacterCodes["o"] = 111] = "o";
  CharacterCodes[CharacterCodes["p"] = 112] = "p";
  CharacterCodes[CharacterCodes["q"] = 113] = "q";
  CharacterCodes[CharacterCodes["r"] = 114] = "r";
  CharacterCodes[CharacterCodes["s"] = 115] = "s";
  CharacterCodes[CharacterCodes["t"] = 116] = "t";
  CharacterCodes[CharacterCodes["u"] = 117] = "u";
  CharacterCodes[CharacterCodes["v"] = 118] = "v";
  CharacterCodes[CharacterCodes["w"] = 119] = "w";
  CharacterCodes[CharacterCodes["x"] = 120] = "x";
  CharacterCodes[CharacterCodes["y"] = 121] = "y";
  CharacterCodes[CharacterCodes["z"] = 122] = "z";
  CharacterCodes[CharacterCodes["A"] = 65] = "A";
  CharacterCodes[CharacterCodes["B"] = 66] = "B";
  CharacterCodes[CharacterCodes["C"] = 67] = "C";
  CharacterCodes[CharacterCodes["D"] = 68] = "D";
  CharacterCodes[CharacterCodes["E"] = 69] = "E";
  CharacterCodes[CharacterCodes["F"] = 70] = "F";
  CharacterCodes[CharacterCodes["G"] = 71] = "G";
  CharacterCodes[CharacterCodes["H"] = 72] = "H";
  CharacterCodes[CharacterCodes["I"] = 73] = "I";
  CharacterCodes[CharacterCodes["J"] = 74] = "J";
  CharacterCodes[CharacterCodes["K"] = 75] = "K";
  CharacterCodes[CharacterCodes["L"] = 76] = "L";
  CharacterCodes[CharacterCodes["M"] = 77] = "M";
  CharacterCodes[CharacterCodes["N"] = 78] = "N";
  CharacterCodes[CharacterCodes["O"] = 79] = "O";
  CharacterCodes[CharacterCodes["P"] = 80] = "P";
  CharacterCodes[CharacterCodes["Q"] = 81] = "Q";
  CharacterCodes[CharacterCodes["R"] = 82] = "R";
  CharacterCodes[CharacterCodes["S"] = 83] = "S";
  CharacterCodes[CharacterCodes["T"] = 84] = "T";
  CharacterCodes[CharacterCodes["U"] = 85] = "U";
  CharacterCodes[CharacterCodes["V"] = 86] = "V";
  CharacterCodes[CharacterCodes["W"] = 87] = "W";
  CharacterCodes[CharacterCodes["X"] = 88] = "X";
  CharacterCodes[CharacterCodes["Y"] = 89] = "Y";
  CharacterCodes[CharacterCodes["Z"] = 90] = "Z";
  CharacterCodes[CharacterCodes["asterisk"] = 42] = "asterisk";
  CharacterCodes[CharacterCodes["backslash"] = 92] = "backslash";
  CharacterCodes[CharacterCodes["closeBrace"] = 125] = "closeBrace";
  CharacterCodes[CharacterCodes["closeBracket"] = 93] = "closeBracket";
  CharacterCodes[CharacterCodes["colon"] = 58] = "colon";
  CharacterCodes[CharacterCodes["comma"] = 44] = "comma";
  CharacterCodes[CharacterCodes["dot"] = 46] = "dot";
  CharacterCodes[CharacterCodes["doubleQuote"] = 34] = "doubleQuote";
  CharacterCodes[CharacterCodes["minus"] = 45] = "minus";
  CharacterCodes[CharacterCodes["openBrace"] = 123] = "openBrace";
  CharacterCodes[CharacterCodes["openBracket"] = 91] = "openBracket";
  CharacterCodes[CharacterCodes["plus"] = 43] = "plus";
  CharacterCodes[CharacterCodes["slash"] = 47] = "slash";
  CharacterCodes[CharacterCodes["formFeed"] = 12] = "formFeed";
  CharacterCodes[CharacterCodes["tab"] = 9] = "tab";
})(CharacterCodes || (CharacterCodes = {}));

// node_modules/jsonc-parser/lib/esm/impl/string-intern.js
var cachedSpaces = new Array(20).fill(0).map((_, index) => {
  return " ".repeat(index);
});
var maxCachedValues = 200;
var cachedBreakLinesWithSpaces = {
  " ": {
    "\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return `
` + " ".repeat(index);
    }),
    "\r": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r" + " ".repeat(index);
    }),
    "\r\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return `\r
` + " ".repeat(index);
    })
  },
  "\t": {
    "\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return `
` + "\t".repeat(index);
    }),
    "\r": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r" + "\t".repeat(index);
    }),
    "\r\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return `\r
` + "\t".repeat(index);
    })
  }
};

// node_modules/jsonc-parser/lib/esm/impl/parser.js
var ParseOptions;
(function(ParseOptions) {
  ParseOptions.DEFAULT = {
    allowTrailingComma: false
  };
})(ParseOptions || (ParseOptions = {}));
function parse(text, errors = [], options = ParseOptions.DEFAULT) {
  let currentProperty = null;
  let currentParent = [];
  const previousParents = [];
  function onValue(value) {
    if (Array.isArray(currentParent)) {
      currentParent.push(value);
    } else if (currentProperty !== null) {
      currentParent[currentProperty] = value;
    }
  }
  const visitor = {
    onObjectBegin: () => {
      const object = {};
      onValue(object);
      previousParents.push(currentParent);
      currentParent = object;
      currentProperty = null;
    },
    onObjectProperty: (name) => {
      currentProperty = name;
    },
    onObjectEnd: () => {
      currentParent = previousParents.pop();
    },
    onArrayBegin: () => {
      const array = [];
      onValue(array);
      previousParents.push(currentParent);
      currentParent = array;
      currentProperty = null;
    },
    onArrayEnd: () => {
      currentParent = previousParents.pop();
    },
    onLiteralValue: onValue,
    onError: (error, offset, length) => {
      errors.push({ error, offset, length });
    }
  };
  visit(text, visitor, options);
  return currentParent[0];
}
function visit(text, visitor, options = ParseOptions.DEFAULT) {
  const _scanner = createScanner(text, false);
  const _jsonPath = [];
  let suppressedCallbacks = 0;
  function toNoArgVisit(visitFunction) {
    return visitFunction ? () => suppressedCallbacks === 0 && visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
  }
  function toOneArgVisit(visitFunction) {
    return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
  }
  function toOneArgVisitWithPath(visitFunction) {
    return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice()) : () => true;
  }
  function toBeginVisit(visitFunction) {
    return visitFunction ? () => {
      if (suppressedCallbacks > 0) {
        suppressedCallbacks++;
      } else {
        let cbReturn = visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice());
        if (cbReturn === false) {
          suppressedCallbacks = 1;
        }
      }
    } : () => true;
  }
  function toEndVisit(visitFunction) {
    return visitFunction ? () => {
      if (suppressedCallbacks > 0) {
        suppressedCallbacks--;
      }
      if (suppressedCallbacks === 0) {
        visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter());
      }
    } : () => true;
  }
  const onObjectBegin = toBeginVisit(visitor.onObjectBegin), onObjectProperty = toOneArgVisitWithPath(visitor.onObjectProperty), onObjectEnd = toEndVisit(visitor.onObjectEnd), onArrayBegin = toBeginVisit(visitor.onArrayBegin), onArrayEnd = toEndVisit(visitor.onArrayEnd), onLiteralValue = toOneArgVisitWithPath(visitor.onLiteralValue), onSeparator = toOneArgVisit(visitor.onSeparator), onComment = toNoArgVisit(visitor.onComment), onError = toOneArgVisit(visitor.onError);
  const disallowComments = options && options.disallowComments;
  const allowTrailingComma = options && options.allowTrailingComma;
  function scanNext() {
    while (true) {
      const token = _scanner.scan();
      switch (_scanner.getTokenError()) {
        case 4:
          handleError(14);
          break;
        case 5:
          handleError(15);
          break;
        case 3:
          handleError(13);
          break;
        case 1:
          if (!disallowComments) {
            handleError(11);
          }
          break;
        case 2:
          handleError(12);
          break;
        case 6:
          handleError(16);
          break;
      }
      switch (token) {
        case 12:
        case 13:
          if (disallowComments) {
            handleError(10);
          } else {
            onComment();
          }
          break;
        case 16:
          handleError(1);
          break;
        case 15:
        case 14:
          break;
        default:
          return token;
      }
    }
  }
  function handleError(error, skipUntilAfter = [], skipUntil = []) {
    onError(error);
    if (skipUntilAfter.length + skipUntil.length > 0) {
      let token = _scanner.getToken();
      while (token !== 17) {
        if (skipUntilAfter.indexOf(token) !== -1) {
          scanNext();
          break;
        } else if (skipUntil.indexOf(token) !== -1) {
          break;
        }
        token = scanNext();
      }
    }
  }
  function parseString(isValue) {
    const value = _scanner.getTokenValue();
    if (isValue) {
      onLiteralValue(value);
    } else {
      onObjectProperty(value);
      _jsonPath.push(value);
    }
    scanNext();
    return true;
  }
  function parseLiteral() {
    switch (_scanner.getToken()) {
      case 11:
        const tokenValue = _scanner.getTokenValue();
        let value = Number(tokenValue);
        if (isNaN(value)) {
          handleError(2);
          value = 0;
        }
        onLiteralValue(value);
        break;
      case 7:
        onLiteralValue(null);
        break;
      case 8:
        onLiteralValue(true);
        break;
      case 9:
        onLiteralValue(false);
        break;
      default:
        return false;
    }
    scanNext();
    return true;
  }
  function parseProperty() {
    if (_scanner.getToken() !== 10) {
      handleError(3, [], [2, 5]);
      return false;
    }
    parseString(false);
    if (_scanner.getToken() === 6) {
      onSeparator(":");
      scanNext();
      if (!parseValue()) {
        handleError(4, [], [2, 5]);
      }
    } else {
      handleError(5, [], [2, 5]);
    }
    _jsonPath.pop();
    return true;
  }
  function parseObject() {
    onObjectBegin();
    scanNext();
    let needsComma = false;
    while (_scanner.getToken() !== 2 && _scanner.getToken() !== 17) {
      if (_scanner.getToken() === 5) {
        if (!needsComma) {
          handleError(4, [], []);
        }
        onSeparator(",");
        scanNext();
        if (_scanner.getToken() === 2 && allowTrailingComma) {
          break;
        }
      } else if (needsComma) {
        handleError(6, [], []);
      }
      if (!parseProperty()) {
        handleError(4, [], [2, 5]);
      }
      needsComma = true;
    }
    onObjectEnd();
    if (_scanner.getToken() !== 2) {
      handleError(7, [2], []);
    } else {
      scanNext();
    }
    return true;
  }
  function parseArray() {
    onArrayBegin();
    scanNext();
    let isFirstElement = true;
    let needsComma = false;
    while (_scanner.getToken() !== 4 && _scanner.getToken() !== 17) {
      if (_scanner.getToken() === 5) {
        if (!needsComma) {
          handleError(4, [], []);
        }
        onSeparator(",");
        scanNext();
        if (_scanner.getToken() === 4 && allowTrailingComma) {
          break;
        }
      } else if (needsComma) {
        handleError(6, [], []);
      }
      if (isFirstElement) {
        _jsonPath.push(0);
        isFirstElement = false;
      } else {
        _jsonPath[_jsonPath.length - 1]++;
      }
      if (!parseValue()) {
        handleError(4, [], [4, 5]);
      }
      needsComma = true;
    }
    onArrayEnd();
    if (!isFirstElement) {
      _jsonPath.pop();
    }
    if (_scanner.getToken() !== 4) {
      handleError(8, [4], []);
    } else {
      scanNext();
    }
    return true;
  }
  function parseValue() {
    switch (_scanner.getToken()) {
      case 3:
        return parseArray();
      case 1:
        return parseObject();
      case 10:
        return parseString(true);
      default:
        return parseLiteral();
    }
  }
  scanNext();
  if (_scanner.getToken() === 17) {
    if (options.allowEmptyContent) {
      return true;
    }
    handleError(4, [], []);
    return false;
  }
  if (!parseValue()) {
    handleError(4, [], []);
    return false;
  }
  if (_scanner.getToken() !== 17) {
    handleError(9, [], []);
  }
  return true;
}

// node_modules/jsonc-parser/lib/esm/main.js
var ScanError;
(function(ScanError) {
  ScanError[ScanError["None"] = 0] = "None";
  ScanError[ScanError["UnexpectedEndOfComment"] = 1] = "UnexpectedEndOfComment";
  ScanError[ScanError["UnexpectedEndOfString"] = 2] = "UnexpectedEndOfString";
  ScanError[ScanError["UnexpectedEndOfNumber"] = 3] = "UnexpectedEndOfNumber";
  ScanError[ScanError["InvalidUnicode"] = 4] = "InvalidUnicode";
  ScanError[ScanError["InvalidEscapeCharacter"] = 5] = "InvalidEscapeCharacter";
  ScanError[ScanError["InvalidCharacter"] = 6] = "InvalidCharacter";
})(ScanError || (ScanError = {}));
var SyntaxKind;
(function(SyntaxKind) {
  SyntaxKind[SyntaxKind["OpenBraceToken"] = 1] = "OpenBraceToken";
  SyntaxKind[SyntaxKind["CloseBraceToken"] = 2] = "CloseBraceToken";
  SyntaxKind[SyntaxKind["OpenBracketToken"] = 3] = "OpenBracketToken";
  SyntaxKind[SyntaxKind["CloseBracketToken"] = 4] = "CloseBracketToken";
  SyntaxKind[SyntaxKind["CommaToken"] = 5] = "CommaToken";
  SyntaxKind[SyntaxKind["ColonToken"] = 6] = "ColonToken";
  SyntaxKind[SyntaxKind["NullKeyword"] = 7] = "NullKeyword";
  SyntaxKind[SyntaxKind["TrueKeyword"] = 8] = "TrueKeyword";
  SyntaxKind[SyntaxKind["FalseKeyword"] = 9] = "FalseKeyword";
  SyntaxKind[SyntaxKind["StringLiteral"] = 10] = "StringLiteral";
  SyntaxKind[SyntaxKind["NumericLiteral"] = 11] = "NumericLiteral";
  SyntaxKind[SyntaxKind["LineCommentTrivia"] = 12] = "LineCommentTrivia";
  SyntaxKind[SyntaxKind["BlockCommentTrivia"] = 13] = "BlockCommentTrivia";
  SyntaxKind[SyntaxKind["LineBreakTrivia"] = 14] = "LineBreakTrivia";
  SyntaxKind[SyntaxKind["Trivia"] = 15] = "Trivia";
  SyntaxKind[SyntaxKind["Unknown"] = 16] = "Unknown";
  SyntaxKind[SyntaxKind["EOF"] = 17] = "EOF";
})(SyntaxKind || (SyntaxKind = {}));
var parse2 = parse;
var ParseErrorCode;
(function(ParseErrorCode) {
  ParseErrorCode[ParseErrorCode["InvalidSymbol"] = 1] = "InvalidSymbol";
  ParseErrorCode[ParseErrorCode["InvalidNumberFormat"] = 2] = "InvalidNumberFormat";
  ParseErrorCode[ParseErrorCode["PropertyNameExpected"] = 3] = "PropertyNameExpected";
  ParseErrorCode[ParseErrorCode["ValueExpected"] = 4] = "ValueExpected";
  ParseErrorCode[ParseErrorCode["ColonExpected"] = 5] = "ColonExpected";
  ParseErrorCode[ParseErrorCode["CommaExpected"] = 6] = "CommaExpected";
  ParseErrorCode[ParseErrorCode["CloseBraceExpected"] = 7] = "CloseBraceExpected";
  ParseErrorCode[ParseErrorCode["CloseBracketExpected"] = 8] = "CloseBracketExpected";
  ParseErrorCode[ParseErrorCode["EndOfFileExpected"] = 9] = "EndOfFileExpected";
  ParseErrorCode[ParseErrorCode["InvalidCommentToken"] = 10] = "InvalidCommentToken";
  ParseErrorCode[ParseErrorCode["UnexpectedEndOfComment"] = 11] = "UnexpectedEndOfComment";
  ParseErrorCode[ParseErrorCode["UnexpectedEndOfString"] = 12] = "UnexpectedEndOfString";
  ParseErrorCode[ParseErrorCode["UnexpectedEndOfNumber"] = 13] = "UnexpectedEndOfNumber";
  ParseErrorCode[ParseErrorCode["InvalidUnicode"] = 14] = "InvalidUnicode";
  ParseErrorCode[ParseErrorCode["InvalidEscapeCharacter"] = 15] = "InvalidEscapeCharacter";
  ParseErrorCode[ParseErrorCode["InvalidCharacter"] = 16] = "InvalidCharacter";
})(ParseErrorCode || (ParseErrorCode = {}));

// src/config.ts
var DIR = process.env.OPENCODE_CONFIG_DIR?.trim() || join2(homedir(), ".config", "opencode");
var DEFAULTS = {
  baseUrl: "https://api.supermemory.ai",
  nameSpace: "opencode",
  similarityThreshold: 0.6,
  maxMemories: 3,
  injectProfile: true,
  rerank: false,
  rewriteQuery: false,
  aggregate: false,
  includeSummaries: false,
  supportingContext: `Shared coding-agent memory for one user.
EXTRACT:
- User preferences, accepted decisions, durable workflows, actions, and learnings
- Architecture, conventions, patterns, setup details
- Decisions and their rationale
SKIP:
- Generic suggestions the user did not accept
- Transient command output and low-value chatter
- Granular details that do not help future work`
};
var FILES = [
  ["supermemory-credentials.json", false],
  ["supermemory.jsonc", true],
  ["supermemory-credentials.jsonc", true],
  ["supermemory.json", false]
];
function read(name, jsonc) {
  const p = join2(DIR, name);
  if (!existsSync(p))
    return null;
  try {
    const raw = readFileSync(p, "utf-8").replace(/^\uFEFF/, "");
    const errors = [];
    const out = jsonc ? parse2(raw, errors, { allowTrailingComma: true }) : JSON.parse(raw);
    return typeof out === "object" && out !== null && !Array.isArray(out) ? out : null;
  } catch {
    return null;
  }
}
function key(v) {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
function isRange(v, min, max) {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}
function isInt2(v) {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 100;
}
function b(v, d) {
  return typeof v === "boolean" ? v : d;
}
function url(v) {
  if (typeof v !== "string")
    return DEFAULTS.baseUrl;
  const s = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(v) ? v : `http://${v}`;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === `https:` ? u.toString().replace(/\/$/, "") : DEFAULTS.baseUrl;
  } catch {
    return DEFAULTS.baseUrl;
  }
}
function loadConfig() {
  const f = Object.fromEntries(FILES.map(([n, j]) => [n, read(n, j)]));
  const SUPERMEMORY_API_KEY = key(process.env.SUPERMEMORY_API_KEY) ?? key(f["supermemory-credentials.json"]?.SUPERMEMORY_API_KEY) ?? key(f["supermemory.jsonc"]?.SUPERMEMORY_API_KEY) ?? key(f["supermemory-credentials.jsonc"]?.SUPERMEMORY_API_KEY) ?? key(f["supermemory.json"]?.SUPERMEMORY_API_KEY) ?? "dummy";
  const base = f["supermemory.jsonc"] ?? f["supermemory.json"] ?? {};
  return {
    SUPERMEMORY_API_KEY,
    baseUrl: url(base.baseUrl),
    nameSpace: typeof base.nameSpace === "string" && /^[a-zA-Z0-9_:-]{1,100}$/.test(base.nameSpace) ? base.nameSpace : DEFAULTS.nameSpace,
    similarityThreshold: isRange(base.similarityThreshold, 0, 1) ? base.similarityThreshold : DEFAULTS.similarityThreshold,
    maxMemories: isInt2(base.maxMemories) ? base.maxMemories : DEFAULTS.maxMemories,
    injectProfile: b(base.injectProfile, DEFAULTS.injectProfile),
    supportingContext: typeof base.supportingContext === "string" && base.supportingContext.length <= 1500 ? base.supportingContext : DEFAULTS.supportingContext,
    rerank: b(base.rerank, DEFAULTS.rerank),
    rewriteQuery: b(base.rewriteQuery, DEFAULTS.rewriteQuery),
    aggregate: b(base.aggregate, DEFAULTS.aggregate),
    includeSummaries: b(base.includeSummaries, DEFAULTS.includeSummaries)
  };
}
var Config2 = loadConfig();

// src/index.ts
var KEYWORD_PATTERN = /\b(remember|memorize|save\s+this|note\s+this|keep\s+in\s+mind|don'?t\s+forget|learn\s+this|store\s+this|record\s+this|make\s+a\s+note|take\s+note|jot\s+down|commit\s+to\s+memory|never\s+forget|always\s+remember|log\s+this|write\s+down)\b/i;
var SAVE_NUDGE = `[MEMORY TRIGGER DETECTED]
The user wants you to remember something. Use the "SuperMemory Remember Tool" to save this information.
Extract the durable facts and save it as a concise memory.
DO NOT skip this step. The user explicitly asked you to remember.`;
var ingestedMessageIds = new Set;
var profiledSessions = new Set;
var searchedMessageIds = new Set;
var LOG_FILE = join3(homedir2(), ".local", "share", "opencode", "log", "superMemory-Redux_OpenCode.log");
function errMsg(error) {
  return error instanceof Error ? error.message : String(error);
}
function fileLog(level, message, extra) {
  const line = `${new Date().toISOString()} ${level} ${message}${extra === undefined ? "" : " " + String(extra)}
`;
  try {
    mkdirSync(dirname(LOG_FILE), { recursive: true });
    appendFileSync(LOG_FILE, line);
  } catch (error) {
    console.error("[superMemory Redux] Log write failed:", errMsg(error));
  }
}
var src_default = define({
  id: "oc-superMemory-Redux",
  async setup(ctx) {
    fileLog("info", `Memory integration is starting up ${ctx.location.directory}`);
    const sm = new Supermemory({
      apiKey: Config2.SUPERMEMORY_API_KEY,
      baseUrl: Config2.baseUrl,
      timeoutInSeconds: 8,
      maxRetries: 0
    });
    const apiHeaders = {
      Authorization: `Bearer ${Config2.SUPERMEMORY_API_KEY}`,
      "Content-Type": "application/json"
    };
    try {
      await sm.namespaces.update(Config2.nameSpace, {
        supportingContext: Config2.supportingContext
      });
      fileLog("info", "supporting context sync complete");
    } catch (error) {
      fileLog("warn", errMsg(error));
    }
    const postSynthetic = async (sessionID, text) => {
      return await ctx.session.synthetic({
        sessionID,
        text,
        delivery: "steer",
        resume: false,
        metadata: { source: "opencode" }
      });
    };
    await ctx.session.hook("prompt", async (event) => {
      const rawUserMessage = event.prompt.text?.trim();
      if (!rawUserMessage)
        return;
      const sessionID = event.sessionID;
      const turnID = `${sessionID}:${event.messageID ?? rawUserMessage}`;
      const searchKey = `${turnID}:search`;
      if (!profiledSessions.has(sessionID)) {
        try {
          const profileResponse = await sm.profile(Config2.nameSpace);
          await postSynthetic(sessionID, JSON.stringify(profileResponse));
        } catch (error) {
          fileLog("error", errMsg(error));
        } finally {
          profiledSessions.add(sessionID);
        }
      } else if (!searchedMessageIds.has(searchKey)) {
        try {
          const results = await sm.search(Config2.nameSpace, {
            query: rawUserMessage,
            limit: Config2.maxMemories,
            threshold: Config2.similarityThreshold,
            rewriteQuery: Config2.rewriteQuery
          });
          await postSynthetic(sessionID, JSON.stringify(results));
        } catch (error) {
          fileLog("error", errMsg(error));
        } finally {
          searchedMessageIds.add(searchKey);
        }
      }
      if (KEYWORD_PATTERN.test(rawUserMessage)) {
        await postSynthetic(sessionID, SAVE_NUDGE);
      }
      fileLog("info", `keyword trigger attempted for session:${sessionID}`);
      const ingestKey = `${turnID}:ingest`;
      try {
        if (!ingestedMessageIds.has(ingestKey)) {
          const context = await ctx.session.context({ sessionID });
          const msgs = Array.isArray(context) ? context : context?.data ?? [];
          let assistantText = "";
          for (const m of msgs) {
            if (m?.role === "assistant") {
              assistantText = (m.content ?? []).filter((p) => p?.type === "text").map((p) => String(p?.text ?? "")).join(`
`).trim();
            }
          }
          const contents = [
            `USER: ${rawUserMessage}`,
            `ASSISTANT: ${assistantText}`
          ].filter(Boolean).join("").trim();
          await sm.add(Config2.nameSpace, {
            content: contents,
            id: sessionID,
            supportingContext: Config2.supportingContext,
            metadata: {
              contains: "conversation",
              source: "opencode",
              session: sessionID
            },
            dreaming: "dynamic"
          });
          ingestedMessageIds.add(ingestKey);
          fileLog("info", `conversation turn ingestion successful for session ${sessionID}`, {
            userChars: rawUserMessage.length,
            asstChars: assistantText.length
          });
        }
      } catch (error) {
        fileLog("error", `conversation turn ingestion failed for session ${sessionID}`, errMsg(error));
      }
    });
    const wrapExecute = (toolName, fn) => async (input) => {
      try {
        const { content } = await fn(input);
        fileLog("info", `${toolName} success`);
        return { content };
      } catch (error) {
        const message = errMsg(error);
        fileLog("error", `${toolName} failed`, message);
        return { content: JSON.stringify({ success: false, error: message }) };
      }
    };
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "search",
        description: "Find relevant past memories for the current task. Check on your own when prior context could help.",
        input: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query text" },
            limit: { type: "number", description: "Max memories to return" }
          },
          required: ["query"],
          additionalProperties: false
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("search", async (input) => {
          const args = input;
          const effectiveLimit = args.limit ?? Config2.maxMemories;
          const results = await sm.search(Config2.nameSpace, {
            query: args.query,
            searchMode: "hybrid",
            threshold: Config2.similarityThreshold
          });
          const n = results?.results?.length ?? 0;
          return {
            content: JSON.stringify({ success: true, results }),
            resolved: {
              limit: effectiveLimit,
              threshold: Config2.similarityThreshold,
              returned: n
            }
          };
        })
      });
      editor.add({
        name: "add",
        description: "Save lasting facts, decisions, or setup details. Save on your own when something worth keeping appears.",
        input: {
          type: "object",
          properties: {
            content: { type: "string", description: "Durable fact or summary to store" },
            metadata: { type: "object", description: "Optional metadata", additionalProperties: { type: ["string", "number", "boolean", "array"] } },
            taskType: { type: "string", enum: ["memory", "superrag"], description: "memory (default) or superrag" }
          },
          required: ["content"],
          additionalProperties: false
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("add", async (input) => {
          const args = input;
          const results = await sm.add(Config2.nameSpace, {
            content: args.content,
            metadata: args.metadata,
            taskType: args.taskType,
            dreaming: "dynamic"
          });
          return {
            content: JSON.stringify({ success: true, results }),
            resolved: {
              chars: args.content.length,
              taskType: args.taskType ?? "memory",
              dreaming: "dynamic"
            }
          };
        })
      });
      editor.add({
        name: "remember",
        description: "Save an exact user-stated fact. Use when the user says remember this.",
        input: {
          type: "object",
          properties: {
            content: { type: "string", description: "Exact fact text to store" },
            metadata: { type: "object", description: "Optional metadata", additionalProperties: { type: "string" } }
          },
          required: ["content"],
          additionalProperties: false
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("remember", async (input) => {
          const args = input;
          const response = await fetch(`${Config2.baseUrl}/v4/memories`, {
            method: "POST",
            headers: apiHeaders,
            body: JSON.stringify({
              memories: [
                {
                  content: args.content,
                  isStatic: false,
                  metadata: {
                    source: "opencode",
                    ...args.metadata ?? {}
                  }
                }
              ],
              nameSpace: Config2.nameSpace
            })
          });
          if (!response.ok) {
            throw new Error(`Remember failed (${response.status}): ${await response.text()}`);
          }
          return {
            content: JSON.stringify({ success: true, result: await response.json() }),
            resolved: { chars: args.content.length }
          };
        })
      });
      editor.add({
        name: "forget",
        description: "Delete a stored memory. Only on explicit user request.",
        input: {
          type: "object",
          properties: {
            memoryId: { type: "string", description: "Memory ID to forget" },
            content: { type: "string", description: "Exact content when ID unknown" },
            reason: { type: "string", description: "Reason for forgetting" }
          },
          required: [],
          additionalProperties: false
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("forget", async (input) => {
          const args = input;
          const result = await sm.memories.forget(Config2.nameSpace, {
            ids: args.memoryIds ?? []
          });
          return {
            content: JSON.stringify({ success: true, result }),
            resolved: { memoryIds: args.memoryIds ?? null }
          };
        })
      });
      editor.add({
        name: "list",
        description: "List recent stored documents. Use to browse before get.",
        input: {
          type: "object",
          properties: { limit: { type: "number", description: "Max documents" } },
          required: [],
          additionalProperties: false
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("list", async (input) => {
          const args = input;
          const result = await sm.list(Config2.nameSpace, "chunks", {
            limit: args.limit ?? Config2.maxMemories,
            sort: "createdAt",
            order: "desc"
          });
          return {
            content: JSON.stringify({
              success: true,
              count: result.memories.length,
              memories: result.memories.map((d) => ({
                id: d.id,
                customId: d.customId,
                title: d.title,
                summary: d.summary,
                type: d.type,
                status: d.status
              }))
            }),
            resolved: {
              limit: args.limit ?? Config2.maxMemories,
              count: result.memories.length
            }
          };
        })
      });
      editor.add({
        name: "get",
        description: "Open one stored document by ID. Use after list or search.",
        input: {
          type: "object",
          properties: { documentId: { type: "string", description: "Document ID" } },
          required: ["documentId"],
          additionalProperties: false
        },
        options: { namespace: "supermemory" },
        execute: wrapExecute("get", async (input) => {
          const args = input;
          const result = await sm.documents.get(Config2.nameSpace, args.documentId);
          return {
            content: JSON.stringify({ success: true, result }),
            resolved: { documentId: args.documentId }
          };
        })
      });
    });
  }
});
export {
  src_default as default
};
