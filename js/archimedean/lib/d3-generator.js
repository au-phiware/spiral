const { cos, sin } = Math;

export function Generator(parent) {
  this._parent = parent;
}

function generator(parent = document.documentElement) {
  return new Generator(parent);
}

async function begin(iterator, remote, args) {
  console.time("produce");
  const data = [];
  for await (const d of iterator) {
    data.push(d);
    if (remote.abort) break;
  }
  console.timeEnd("produce");
  console.time("draw");
  const nodes = this.selectNodes(this._parent);
  nodes.data(data, this.key).call(this.loop, ...args);
  remote.abort = true;
  console.timeEnd("draw");
}

Generator.prototype = generator.prototype = {
  begin(iterator, ...args) {
    let remote = { abort: false, timer: false };
    begin.call(this, iterator, remote, args);
    return () => remote.abort = true;
  },

  loop($) {
    $.enter().append('g');
  },

  selectNodes($) {
    return $.selectAll('g');
  }
};

function callable(f, g) {
  if ('function' === typeof f)
    return f;
  if ('function' === typeof g)
    return (...args) => g.apply(this, args);
  return () => f;
}

export async function *parameter(step = 1, initial = 0) {
  let f = callable(step, a => a + step);
  for (;;) {
    yield initial;
    initial = f.call(this, initial);
  }
}

export async function *archimedean(windingNumber, g) {
  let f = callable(windingNumber);
  for await (let t of g) {
    yield {
      angle: t,
      radius: t ** (1 / f.call(this, t))
    };
  }
}

export async function *transform(a, g) {
  for await (let d of g) yield a.call(this, d);
}

export async function *scale(factor, g) {
  let f = callable(factor);
  for await (let d of g) {
    let a = f.call(this, d);
    if ("object" === typeof a) {
      for (let i in a) if (i in d) d[i] *= a[i];
      yield d;
    } else {
      yield a * d;
    }
  }
}

export async function *rectangular(g) {
  for await (let d of g) {
    d.x = d.radius * cos(d.angle);
    d.y = d.radius * sin(d.angle);
    yield d;
  }
}

export async function *viewbox(box, g) {
  let f = callable(box);
  for await (let d of g) {
    let b = f.call(this, d);
    if (b.left <= d.x && d.x <= b.left + b.width &&
        b.top <= d.y && d.y <= b.top + b.height) {
      yield d;
    }
  }
}

export async function *limit(max, g) {
  let f = callable(max);
  for await (let d of g) {
    let m = f.call(this, d);
    if ("object" === typeof m) {
      for (let i in m) if (i in d && d[i] > m[i]) return;
    } else {
      if (d > m) return;
    }
    yield d;
  }
}

export async function *count(g) {
  let i = 0;
  for await (let d of g) {
    d.ordinal = ++i;
    yield d;
  }
}

export default generator;
