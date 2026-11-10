"use strict";
// Currency-parser tests only; this is not a browser rendering test.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const file = path.join(__dirname, "../frontend/app.js");
const source = fs.readFileSync(file, "utf8").replace(/\nloadData\(\);\s*$/, "\n");
const context = vm.createContext({ document: { getElementById: () => ({ addEventListener: () => {} }) } });
vm.runInContext(source, context, { timeout: 1000 });
for (const [input, expected] of [["100", 10000], ["100.00", 10000], ["0.01", 1], ["12,34", 1234], [" 1.5 ", 150], ["1000000.00", 100000000]]) {
  assert.equal(vm.runInContext("parseAmount(" + JSON.stringify(input) + ")", context), expected);
}
for (const input of ["0", "-1", "1.234", "abc", "1e2", "1000000.01", "", "1."]) {
  assert.throws(() => vm.runInContext("parseAmount(" + JSON.stringify(input) + ")", context));
}
console.log("PASS: 6 valid amounts and 8 invalid amounts; no network calls.");
