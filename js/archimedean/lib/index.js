import "babel-polyfill";
import { Generator, viewbox, rectangular, limit, transform, count, archimedean, parameter } from './d3-generator';
import { select } from 'd3-selection';
import { dsvFormat } from 'd3-dsv';
import { request } from 'd3-request';
const { PI, pow, log2, sqrt, hypot, floor } = Math;

const TAU = 2 * PI;
const PHI = (sqrt(5) - 1) / 2;
const options = {
  squared: true,
  sect: 0,
  viewBox: { left:-700, top:-700, width: 1400, height: 1400 }
};

const step = t => options.squared ? TAU * sqrt(pow(t / TAU, 2) + 1) : t + TAU * PHI;
const spiral = viewbox(() => options.viewBox,
  rectangular(
    limit(() => ({ radius: hypot(options.viewBox.left, options.viewBox.top), ordinal: 10000 }),
      transform(d => {
        let a = pow(options.sect, 2);
        d.angle = (d.angle % TAU + a * PI) / (a + 1);
        return d;
      },
        count(
          archimedean(() => 1,
            parameter(step, TAU)))))));

const svg = new Generator(select('#plane'));

svg.key = d => d.ordinal;

svg.selectNodes = $ => $
  .attr('viewBox', `${options.viewBox.left} ${options.viewBox.top} ${options.viewBox.width} ${options.viewBox.height}`)
  .selectAll('circle');

svg.loop = ($, primes) => $
  .enter()
    .append('circle')
    .classed('square', d => isInteger(sqrt(d.ordinal)))
    .classed('power2', d => isInteger(log2(d.ordinal)))
    .classed('prime', d => d.ordinal == primes[0] && primes.shift())
    .classed('odd', d => d.ordinal % 2 == 1)
    .classed('even', d => d.ordinal % 2 == 0)
  .merge($)
    .attr('cx', d => d.x)
    .attr('cy', d => d.y);

request('a000040.txt')
  .mimeType('text/plain')
  .response(xhr => dsvFormat(" ").parseRows(xhr.responseText, d => +d[1]))
  .get(primes => svg.begin(spiral, primes));

function isInteger(j) {
  return j === floor(j);
}
