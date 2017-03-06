import indexOf from 'binarysearch';
import { dsvFormat } from 'd3-dsv';
import { request } from 'd3-request';

const primes = new Promise((done, fail) =>
  request('a000040.txt')
    .mimeType('text/plain')
    .response(xhr => dsvFormat(" ").parseRows(xhr.responseText, d => +d[1]))
    .on('error', fail)
    .get(done)
);

export function isPrime(n) {
  return primes.then(primes =>
    indexOf(primes, n) >= 0);
}
