import fetch from 'node-fetch';
import {FakeServer, httpFakeCalls} from '../src';

const port = 6666;
const path = '/somePath';
const lettersRegex = '[a-zA-Z]+$';
let fakeServer;
let http;

beforeEach(() => {
  fakeServer = new FakeServer(port);
  fakeServer.start();
  http = httpFakeCalls(fakeServer);
});

afterEach(() => {
  fakeServer.stop();
});


// route defined with regex body restriction

test('regex restriction, assert on a specific string that matches the regex, request body equals test string - assertion success', async () => {
  const route = http.post().to(path)
    .withBodyThatMatches(lettersRegex)
    .willSucceed();
  const actualBody = 'abc';
  const testString = 'abc';

  await fetch(`http://localhost:${port}${path}`, {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: actualBody});

  expect(fakeServer.hasMade(route.call.withBodyText(testString))).toEqual(true);
});

test('regex restriction, assert on a specific string that matches the regex, request body does not equal test string (but matches regex) - assertion success', async () => {
  const route = http.post().to(path)
    .withBodyThatMatches(lettersRegex)
    .willSucceed();
  const actualBody = 'abc';
  const testString = 'def';

  await fetch(`http://localhost:${port}${path}`, {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: actualBody});

  expect(fakeServer.hasMade(route.call.withBodyText(testString))).toEqual(false);
});

test('regex restriction, assert on a specific string that does not match the regex - exception', () => {
  const route = http.post().to(path)
    .withBodyThatMatches(lettersRegex)
    .willSucceed();

  expect(() => route.call.withBodyText('123')).toThrow();
});

test('regex restriction, passing something other than string to specific string method - exception', () => {
  const route = http.post().to(path)
    .withBodyThatMatches(lettersRegex)
    .willSucceed();

  expect(() => route.call.withBodyText({})).toThrow();
});

test('regex restriction, assert on a specific object - exception', () => {
  const route = http.post().to(path)
    .withBodyThatMatches(lettersRegex)
    .willSucceed();

  expect(() => route.call.withSpecificBody({})).toThrow();
});


// route defined with minimal object body restriction

test('minimal object restriction, assert on a specific object that matches the minimal object, request body equals test object - assertion success', async () => {
  const expectedMinimalBody = {a: 1};
  const actualBody = {a: 1, b: 2};
  const testBody = {a: 1, b: 2};
  const route = http.post().to(path)
    .withBodyThatContains(expectedMinimalBody)
    .willSucceed();

  await fetch(`http://localhost:${port}${path}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(actualBody)});

  expect(fakeServer.hasMade(route.call.withSpecificBody(testBody))).toEqual(true);
});

test('minimal object restriction, assert on a specific object that matches the minimal object, request body does not equal test object (but matches minimal object) - assertion fails', async () => {
  const expectedMinimalBody = {a: 1};
  const actualBody = {a: 1, b: 2};
  const testBody = {a: 1};
  const route = http.post().to(path)
    .withBodyThatContains(expectedMinimalBody)
    .willSucceed();

  await fetch(`http://localhost:${port}${path}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(actualBody)});

  expect(fakeServer.hasMade(route.call.withSpecificBody(testBody))).toEqual(false);
});

test('minimal object restriction, assert on a specific object that does not match the minimal object - exception', () => {
  const expectedMinimalBody = {a: 1};
  const testBody = {b: 2};
  const route = http.post().to(path)
    .withBodyThatContains(expectedMinimalBody)
    .willSucceed();

  expect(() => route.call.withSpecificBody(testBody)).toThrow();
});

test('minimal object restriction, passing something other than object to specific object method - exception', () => {
  const route = http.post().to(path)
    .withBodyThatContains({a: 1})
    .willSucceed();

  expect(() => route.call.withSpecificBody('')).toThrow();
});

test('minimal object restriction, assert on a specific string - exception', () => {
  const route = http.post().to(path)
    .withBodyThatContains({})
    .willSucceed();

  expect(() => route.call.withBodyText('')).toThrow();
});


// route defined with object body restriction

test('object restriction, assert on a specific string - exception', () => {
  const route = http.post().to(path)
    .withBody({})
    .willSucceed();

  expect(() => route.call.withBodyText('')).toThrow();
});

test('object restriction, assert on a specific object (again) - exception', () => {
  const route = http.post().to(path)
    .withBody({})
    .willSucceed();

  expect(() => route.call.withSpecificBody({})).toThrow();
});


// route defined with no body restriction

test('no body restriction, assert on a specific string, application/json header, request body equals test string - assertion success', async () => {
  const route = http.post().to(path)
    .willSucceed();
  const actualBody = {a: 1};
  const testString = JSON.stringify({a: 1});

  await fetch(`http://localhost:${port}${path}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(actualBody)});

  expect(fakeServer.hasMade(route.call.withBodyText(testString))).toEqual(true);
});

test('no body restriction, assert on a specific string, no application/json header, request body equals test string - assertion success', async () => {
  const route = http.post().to(path)
    .willSucceed();
  const actualBody = 'abc';
  const testString = 'abc';

  await fetch(`http://localhost:${port}${path}`, {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: actualBody});

  expect(fakeServer.hasMade(route.call.withBodyText(testString))).toEqual(true);
});

test('no body restriction, assert on a specific object, application/json header request body equals test object - assertion success', async () => {
  const actualBody = {a: 1, b: 2};
  const testBody = {a: 1, b: 2};
  const route = http.post().to(path)
    .willSucceed();

  await fetch(`http://localhost:${port}${path}`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(actualBody)});

  expect(fakeServer.hasMade(route.call.withSpecificBody(testBody))).toEqual(true);
});

test('no body restriction, assert on a specific object, no application/json header, request body equals test object - assertion fails', async () => {
  const actualBody = {a: 1, b: 2};
  const testBody = {a: 1, b: 2};
  const route = http.post().to(path)
    .willSucceed();

  await fetch(`http://localhost:${port}${path}`, {method: 'POST', headers: {'Content-Type': 'text/plain'}, body: JSON.stringify(actualBody)});

  expect(fakeServer.hasMade(route.call.withSpecificBody(testBody))).toEqual(false);
});