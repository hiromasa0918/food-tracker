const assert = require("node:assert/strict");
const { amountFor, basisAmount, macroKcal, mathValue, measureUnit } = require("../js/nutrition.js");

assert.equal(macroKcal(10, 20, 5), 165);
assert.equal(mathValue("75×3"), 225);
assert.equal(mathValue("（10＋5）÷3"), 5);
assert.ok(Number.isNaN(mathValue("alert(1)")));

assert.equal(measureUnit({ basis: "100g" }), "g");
assert.equal(measureUnit({ basis: "100ml" }), "ml");
assert.equal(measureUnit({ basis: "serving", servingUnit: "ml" }), "ml");
assert.equal(measureUnit({ basis: "100g", basisUnit: "ml" }), "ml");
assert.equal(basisAmount({ basis: "100g", basisAmount: 30 }), 30);
assert.equal(basisAmount({ basis: "100g" }), 100);

assert.equal(amountFor({ basis: "100ml", servingGrams: 250 }, 2, "serving"), 500);
assert.equal(amountFor({ basis: "100ml" }, 300, "ml"), 300);
assert.equal(amountFor({ basis: "serving", servingUnit: "ml", servingGrams: 250 }, 500, "ml"), 2);
assert.equal(amountFor({ basis: "100g", servingGrams: 50 }, 2, "serving"), 100);
assert.ok(Number.isNaN(amountFor({ basis: "100ml" }, 100, "g")));

console.log("nutrition tests passed");

