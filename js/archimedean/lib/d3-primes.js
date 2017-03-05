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

async function isPrime(n) {
  let i = indexOf(await primes, n);
  return i >= 0;
}

export async function *generator(propertyName, g) {
  for await (const d of g) {
    let n = propertyName ? d[propertyName] : d;
    d.isPrime = await isPrime(n);
    yield d;
  }
}

export default generator;
