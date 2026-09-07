/**
 * Self-check for the hand-rolled CSV parser and the header guesser.
 * Run: npx tsx lib/parseSheet.test.ts   (or `npm run test:parse`)
 */
import assert from "node:assert/strict";
import { parseCsv, guessMapping } from "./parseSheet";

// Plain rows
assert.deepEqual(parseCsv("a,b\n1,2"), [
  ["a", "b"],
  ["1", "2"],
]);

// Quoted field containing the delimiter
assert.deepEqual(parseCsv('name,note\nAcme,"Hello, world"'), [
  ["name", "note"],
  ["Acme", "Hello, world"],
]);

// Escaped quotes inside a quoted field
assert.deepEqual(parseCsv('a\n"He said ""hi"""'), [["a"], ['He said "hi"']]);

// Newline inside a quoted field must not split the row
assert.deepEqual(parseCsv('a,b\n"line1\nline2",x'), [
  ["a", "b"],
  ["line1\nline2", "x"],
]);

// CRLF line endings
assert.deepEqual(parseCsv("a,b\r\n1,2\r\n"), [
  ["a", "b"],
  ["1", "2"],
]);

// UTF-8 BOM is stripped from the first header
assert.equal(parseCsv("﻿name,email\nx,y")[0][0], "name");

// Trailing newline does not produce a phantom row
assert.equal(parseCsv("a,b\n1,2\n").length, 2);

// Blank lines are dropped
assert.equal(parseCsv("a,b\n\n1,2\n\n").length, 2);

// Empty fields survive
assert.deepEqual(parseCsv("a,b,c\n1,,3"), [
  ["a", "b", "c"],
  ["1", "", "3"],
]);

// Semicolon delimiter (EU exports)
assert.deepEqual(parseCsv("a;b\n1;2", ";"), [
  ["a", "b"],
  ["1", "2"],
]);

// Header guessing tolerates casing, spaces and common synonyms
{
  const m = guessMapping([
    "Brand name",
    "Instagram handle",
    "Website",
    "Country",
    "Email",
    "Phone number",
  ]);
  assert.equal(m[0], "name");
  assert.equal(m[1], "contact");
  assert.equal(m[2], "website");
  assert.equal(m[3], "country");
  assert.equal(m[4], "email");
  assert.equal(m[5], "phone");
}

// An unrecognised header maps to nothing rather than guessing wrong
assert.equal(guessMapping(["Lifetime value"])[0], null);

console.log("parseSheet: all checks passed");
