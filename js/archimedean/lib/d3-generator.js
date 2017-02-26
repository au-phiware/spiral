const { pow, cos, sin } = Math;

export function Generator(parent) {
  this._parent = parent;
}

function generator(parent = document.documentElement) {
  return new Generator(parent);
}

Generator.prototype = generator.prototype = {
  begin(iterator, ...args) {
    let data = [];
    let nodes = this.selectNodes(this._parent);
    let loop = () => nodes.data(data, this.key).call(this.loop, ...args);
    let timer = requestAnimationFrame(loop);
    for (let d of iterator) {
      data.push(d);
      if (this._abort) break;
    }
    cancelAnimationFrame(timer);
    this._abort = false;
    loop();
  },

  loop($) {
    $.enter().append('g');
  },

  selectNodes($) {
    return $.selectAll('g');
  },

  abort() {
    this._abort = true;
  }
};

function callable(f, g) {
  if ('function' === typeof f)
    return f;
  if ('function' === typeof g)
    return (...args) => g.apply(this, args);
  return () => f;
}

export function *parameter(step = 1, initial = 0) {
  let f = callable(step, a => a + step);
  for (;;) {
    yield initial;
    initial = f.call(this, initial);
  }
}

export function *archimedean(windingNumber, g) {
  let f = callable(windingNumber);
  for (let t of g) {
    yield {
      angle: t,
      radius: pow(t, 1 / f.call(this, t))
    };
  }
}

export function *transform(a, g) {
  for (let d of g) yield a.call(this, d);
}

export function *scale(factor, g) {
  let f = callable(factor);
  for (let d of g) {
    let a = f.call(this, d);
    if ("object" === typeof a) {
      for (let i in a) if (i in d) d[i] *= a[i];
      yield d;
    } else {
      yield a * d;
    }
  }
}

export function *rectangular(g) {
  for (let d of g) {
    d.x = d.radius * cos(d.angle);
    d.y = d.radius * sin(d.angle);
    yield d;
  }
}

export function *viewbox(box, g) {
  let f = callable(box);
  for (let d of g) {
    let b = f.call(this, d);
    if (b.left <= d.x && d.x <= b.left + b.width &&
        b.top <= d.y && d.y <= b.top + b.height) {
      yield d;
    }
  }
}

export function *limit(max, g) {
  let f = callable(max);
  for (let d of g) {
    let m = f.call(this, d);
    if ("object" === typeof m) {
      for (let i in m) if (i in d && d[i] > m[i]) return;
    } else {
      if (d > m) return;
    }
    yield d;
  }
}

export function *count(g) {
  let i = 0;
  for (let d of g) {
    d.ordinal = ++i;
    yield d;
  }
}

export default generator;
