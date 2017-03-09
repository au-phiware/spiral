import "babel-polyfill";
import load from 'dynload';
import { isPrime } from './d3-primes';
import { select } from 'd3-selection';
const { PI, log10, log2, sqrt, hypot, sin, cos, floor, ceil, round, abs } = Math;
const { EPSILON } = Number;

const TAU = 2 * PI;
const PHI = (sqrt(5) - 1) / 2;
const options = {
  frameDuration: 10,
  step: PHI,
  sect: 0,
  scale: 0,
  windingNumber: 1,
  viewBox: { left:-700, top:-700, width: 1400, height: 1400, hypot: hypot(700, 700) }
};
const updateInputs = () => {
  select('.controls').selectAll('input').each(function () {
    if (this.name in options) {
      if (this[this.type === "checkbox" ? 'checked' : 'value'] !== options[this.name])
        restart = true;
      this[this.type === "checkbox" ? 'checked' : 'value'] = options[this.name];
      if (this.name === 'step')
        select('#step-text').node().value = (PI * options[this.name]).toFixed(3);
      else if (this.name === 'sect')
        select('#sect-text').node().value = (1 / (1 + options[this.name] ** 2)).toFixed(3);
      else if (this.name === 'scale')
        select('#scale-text').node().value = (10 ** options[this.name]).toFixed(3);
      else if (this.type === 'range')
        select(`#${this.name}-text`).node().value = options[this.name].toFixed(3);
    }
  });
  if (restart === true && timer === 0) timer = requestAnimationFrame(loop);
};
const onhashchange = () => {
  let [, hash] = document.location.hash.match(/^#?(.*)$/);
  if (hash) {
    for (let pair of hash.split('&')) {
      let [key, value] = pair.split('=', 2);
      if (key in options) {
        if ('number' === typeof options[key]) {
          value = Number(value);
          if (key === 'step') {
            options[key] = value / PI;
          } else if (key === 'sect') {
            options[key] = sqrt(1 / value - 1);
          } else if (key === 'scale') {
            options[key] = log10(value);
          } else {
            options[key] = value;
          }
        } else if ('boolean' === typeof options[key]) {
          options[key] = !(value === 'false' || Number(value) == false);
        }
      } else if (key === 'highlight') {
        let highlights = decodeURIComponent(value);
        select(document.body).attr('class', highlights);
        for (let highlight of highlights.split(/\s+/)) {
          let [, hide, name] = highlight.match(/^(hide-)?(.+)$/);
          let checkbox = select(`input#${name}`).node();
          if (checkbox) {
            checkbox.indeterminate = false;
            checkbox.readOnly = !!hide;
            checkbox.checked = !hide;
            tristate.call(checkbox);
          }
        }
      }
    }
  }
  updateInputs();
};
select('.controls').selectAll('input[type=checkbox][data-tristate]')
  .on('click', tristate)
  .each(tristate);
if (document.location.hash) {
  onhashchange();
} else {
  updateInputs();
  let checkbox = select('#prime').node();
  if (checkbox) {
    checkbox.readOnly = checkbox.indeterminate = false;
    checkbox.checked = true;
    tristate.call(checkbox);
  }
}

const isInViewBox = (x, y) =>
  options.viewBox.left <= x && x <= options.viewBox.left + options.viewBox.width && options.viewBox.top <= y && y <= options.viewBox.top + options.viewBox.height;
const squared = n => {
  let root = sqrt(n);
  let upper = ceil(root) ** 2;
  let lower = floor(root) ** 2;
  if (upper - lower === 0) return root;
  return floor(root) + (n - lower) / (upper - lower);
};
const parameter = n => TAU * (options.step === 0 ? squared(n) : n * options.step / 2);
const radius = t => t ** (1 / options.windingNumber) * 10 ** options.scale;
const angle = t => {
  let a = options.sect ** 2;
  if (isInteger(t / TAU, 128)) return a * PI / (a + 1);
  return (t % TAU + a * PI) / (a + 1);
};
const x = (a, r) => {
  return r * cos(a);
};
const y = (a, r) => {
  return r * sin(a);
};
const circleSize = d => {
  const body = select(document.body);
  if ((d.isPrime && body.classed('prime')) || (d.isPower2 && body.classed('power2')) || (d.isSquare && body.classed('square'))) return 2.6;
  if ((d.isOdd && body.classed('odd')) || (d.isEven && body.classed('even'))) return 1.6;
  return 1.0;
};

let svg = select('#plane').attr('viewBox', `${options.viewBox.left} ${options.viewBox.top} ${options.viewBox.width} ${options.viewBox.height}`);

const enter = ($) => {
  $ = $.append('circle')
    .attr('id', d => d.n)
    .attr('r', circleSize)
    .classed('square', d => d.isSquare)
    .classed('power2', d => d.isPower2)
    .classed('odd', d => d.isOdd)
    .classed('even', d => d.isEven)
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)
    .each(function(d) {
      ('isPrime' in d ? Promise.resolve(d.isPrime) : isPrime(d.n))
      .then(p => {
        const circle = select(this);
        circle.classed('prime', p);
        d.isPrime = p;
        if (p) circle.attr('r', circleSize);
      });
    });
  return $.node();
}
const exit = $ => $
  .classed('hide', true)
const update = ($) => $
  .classed('hide', false)
  .attr('cx', c => c.x)
  .attr('cy', c => c.y)

let restart = false;
let i = 1;
let timer = requestAnimationFrame(loop);
function loop() {
  if (restart) {
    exit(svg.selectAll('circle'));
    i = 1;
    restart = false;
  }
  let limit = performance.now() + options.frameDuration;
  let data = [];
  while (performance.now() < limit) {
    let t = parameter(i);
    let a = angle(t);
    let r = radius(t);
    let cx = x(a, r), cy = y(a, r);
    if (isInViewBox(cx, cy)) {
      data.push({
        n: i,
        isSquare: isInteger(sqrt(i)),
        isPower2: isInteger(log2(i)),
        isOdd: i % 2 == 1,
        isEven: i % 2 == 0,
        x: cx,
        y: cy
      });
    }
    i++;
    if (i > 1000000 || hypot(cx, cy) > options.viewBox.hypot)
      limit = 0;
  }
  let points = svg.selectAll('circle').data(data, d => d.n);
  points.enter().call(enter);
  points.call(update);
  if (limit)
    timer = requestAnimationFrame(loop);
  else {
    select(document.body).classed('ready', true);
    timer = 0;
  }
}

select('.controls').selectAll('input').on('change checked', function () {
  if (this.name in options) {
    options[this.name] = this.type === "checkbox" ? this.checked : +this.value;
    if (this.name === "step")
      select('#step-text').node().value = options.step === 0 ? 'squared' : (PI * options.step).toFixed(3);
    else if (this.name === 'sect')
      select('#sect-text').node().value = (1 / (1 + options.sect ** 2)).toFixed(3);
    else if (this.name === 'scale')
      select('#scale-text').node().value = (10 ** options.scale).toFixed(3);
    else if (this.type === 'range')
      select(`#${this.name}-text`).node().value = options[this.name].toFixed(3);
  } else if (/-text$/.test(this.id)) {
    let name = this.id.substring(0, this.id.length - 5);
    if (name === 'step') {
      select('#step').node().value = options[name] = +this.value / PI;
    } else if (name === 'sect') {
      select('#sect').node().value = options[name] = sqrt(1 / +this.value - 1);
    } else if (name === 'scale') {
      select('#scale').node().value = options[name] = log10(+this.value);
    } else {
      select(`#${name}`).node().value = options[name] = +this.value;
    }
  } else {
    return;
  }
  restart = true;
  if (timer === 0) timer = requestAnimationFrame(loop);
  window.onhashchange = null;
  window.location.hash = `step=${options.step === 0 ? 0 : select('#step-text').node().value}&sect=${select('#sect-text').node().value}&scale=${select('#scale-text').node().value}&windingNumber=${select('#windingNumber-text').node().value}&highlight=${encodeURIComponent(select(document.body).attr('class'))}`;
  window.onhashchange = onhashchange;
  window.addthis.update('share', 'url', window.location.href);
});

function isInteger(j, tolerance = 8) {
  let diff = abs(round(j) - j);
  return diff === 0 || diff / EPSILON <= tolerance;
}

function tristate() {
  if (this.readOnly) this.checked=this.readOnly=false;
  else if (!this.checked) this.readOnly=this.indeterminate=true;

  if (this.indeterminate) {
    select(document.body).classed(`hide-${this.name} ${this.name}`, false);
  } else {
    select(document.body).classed(`hide-${this.name}`, !this.checked);
    select(document.body).classed(`${this.name}`, this.checked);
  }
  if (svg && (this.indeterminate || this.checked)) {
    svg.selectAll(`circle.${this.name}`).attr('r', circleSize);
  }
}

window.addthis_share = {
  url_transforms: {
    add: {
    }
  }
};
window.addthis_config = { pubid: 'ra-58bd472cdbe0acf0' };
load('//s7.addthis.com/js/300/addthis_widget.js#domready=1');

window.options = options;
window.app = svg;
window.loop = loop;
window.onhashchange = onhashchange;
