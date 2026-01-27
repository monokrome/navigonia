import { describe, it, expect } from 'vitest';
import { parseQuery, stringifyQuery } from '../src/query.js';

describe('parseQuery', () => {
  it('parses simple query string', () => {
    const result = parseQuery('foo=bar');

    expect(result).toEqual({ foo: 'bar' });
  });

  it('handles leading question mark', () => {
    const result = parseQuery('?foo=bar');

    expect(result).toEqual({ foo: 'bar' });
  });

  it('parses multiple params', () => {
    const result = parseQuery('foo=bar&baz=qux');

    expect(result).toEqual({ foo: 'bar', baz: 'qux' });
  });

  it('parses repeated keys as arrays', () => {
    const result = parseQuery('arr=1&arr=2&arr=3');

    expect(result).toEqual({ arr: ['1', '2', '3'] });
  });

  it('handles mixed single and repeated keys', () => {
    const result = parseQuery('foo=bar&arr=1&arr=2');

    expect(result).toEqual({ foo: 'bar', arr: ['1', '2'] });
  });

  it('handles empty values', () => {
    const result = parseQuery('foo=&bar=baz');

    expect(result).toEqual({ foo: '', bar: 'baz' });
  });

  it('handles keys without values', () => {
    const result = parseQuery('foo&bar=baz');

    expect(result).toEqual({ foo: '', bar: 'baz' });
  });

  it('decodes URI components', () => {
    const result = parseQuery('foo=hello%20world&bar=%26%3D');

    expect(result).toEqual({ foo: 'hello world', bar: '&=' });
  });

  it('handles empty query string', () => {
    const result = parseQuery('');

    expect(result).toEqual({});
  });

  it('handles just question mark', () => {
    const result = parseQuery('?');

    expect(result).toEqual({});
  });
});

describe('stringifyQuery', () => {
  it('stringifies simple params', () => {
    const result = stringifyQuery({ foo: 'bar' });

    expect(result).toBe('foo=bar');
  });

  it('stringifies multiple params', () => {
    const result = stringifyQuery({ foo: 'bar', baz: 'qux' });

    expect(result).toBe('foo=bar&baz=qux');
  });

  it('stringifies arrays as repeated keys', () => {
    const result = stringifyQuery({ arr: ['1', '2', '3'] });

    expect(result).toBe('arr=1&arr=2&arr=3');
  });

  it('encodes URI components', () => {
    const result = stringifyQuery({ foo: 'hello world', bar: '&=' });

    expect(result).toBe('foo=hello%20world&bar=%26%3D');
  });

  it('handles empty object', () => {
    const result = stringifyQuery({});

    expect(result).toBe('');
  });

  it('handles empty string values', () => {
    const result = stringifyQuery({ foo: '' });

    expect(result).toBe('foo=');
  });
});

describe('roundtrip', () => {
  it('parses stringified query', () => {
    const original = { foo: 'bar', arr: ['1', '2'] };
    const stringified = stringifyQuery(original);
    const parsed = parseQuery(stringified);

    expect(parsed).toEqual(original);
  });
});
