import "babel-polyfill";
import { Generator, viewbox, rectangular, limit, transform, count, archimedean, parameter } from './d3-generator';
import findPrimes from './d3-primes';
import { select } from 'd3-selection';
const { PI, log10, log2, sqrt, floor } = Math;

const TAU = 2 * PI;
const PHI = (sqrt(5) - 1) / 2;
const options = {
  squared: true,
  step: PHI,
  sect: 0,
  scale: 0,
  windingNumber: 1,
  viewBox: { left:-700, top:-700, width: 1400, height: 1400 }
};
select('.controls').selectAll('input').each(function () {
  if (this.name in options) {
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
select('.controls').selectAll('input[type=checkbox][data-tristate]')
  .on('click', tristate)
  .each(tristate);
select('#prime').each(function() {
  this.readOnly = this.indeterminate = false; this.checked = true; tristate.call(this);
});

const step = t => options.squared
  ? TAU * sqrt((t / TAU) ** 2 + 1)
  : t + options.step * PI;
const spiral = () =>
  viewbox(() => options.viewBox,
    rectangular(
      limit(() => ({ ordinal: 10000 }),
        transform(d => {
          let a = options.sect ** 2;
          d.angle = (d.angle % TAU + a * PI) / (a + 1);
          d.radius *= 10 ** options.scale;
          return d;
        },
        findPrimes('ordinal',
          count(
            archimedean(() => options.windingNumber,
              parameter(step, TAU))))))));

const svg = new Generator(select('#plane'));

svg.key = d => d.ordinal;

svg.selectNodes = $ => $
  .attr('viewBox', `${options.viewBox.left} ${options.viewBox.top} ${options.viewBox.width} ${options.viewBox.height}`)
  .selectAll('circle');

svg.loop = $ => {
  $.exit().remove();
  $.enter()
    .append('circle')
    .classed('square', d => isInteger(sqrt(d.ordinal)))
    .classed('power2', d => isInteger(log2(d.ordinal)))
    .classed('prime', d => d.isPrime)
    .classed('odd', d => d.ordinal % 2 == 1)
    .classed('even', d => d.ordinal % 2 == 0)
  .merge($)
    .attr('cx', d => d.x)
    .attr('cy', d => d.y);
}

let abort = svg.begin(spiral());

select('.controls').selectAll('input').on('change checked', function () {
  if (this.name in options) {
    abort();
    options[this.name] = this.type === "checkbox" ? this.checked : +this.value;
    if (this.name === "step")
      select('#step-text').node().value = (PI * options[this.name]).toFixed(3);
    else if (this.name === 'sect')
      select('#sect-text').node().value = (1 / (1 + options[this.name] ** 2)).toFixed(3);
    else if (this.name === 'scale')
      select('#scale-text').node().value = (10 ** options[this.name]).toFixed(3);
    else if (this.type === 'range')
      select(`#${this.name}-text`).node().value = options[this.name].toFixed(3);
    abort = svg.begin(spiral());
  } else if (/-text$/.test(this.id)) {
    abort();
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
    abort = svg.begin(spiral());
  }
});

function isInteger(j) {
  return j === floor(j);
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
}

window.options = options;
window.app = svg;
window.generator = spiral;
