import assert from "node:assert/strict";
import {
  outputText,
  validNutrition,
} from "../netlify/functions/analyze-nutrition.mjs";

const validResult = {
  found: true,
  name: "牛奶",
  basisMode: "amount",
  basisAmount: 200,
  basisUnit: "ml",
  kcal: 126,
  protein: 6.8,
  carbs: 9.6,
  fat: 7.6,
  confidence: "high",
  notes: "",
};

assert.equal(validNutrition(validResult), true);
assert.equal(validNutrition({ ...validResult, basisAmount: 0 }), false);
assert.equal(validNutrition({ ...validResult, basisUnit: "oz" }), false);
assert.equal(validNutrition({ found: false }), true);
assert.equal(
  outputText({
    output: [{ content: [{ type: "output_text", text: '{"found":true}' }] }],
  }),
  '{"found":true}',
);

console.log("nutrition analysis tests passed");
