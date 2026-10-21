(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.FoodTrackerNutrition = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const macroKcal = (protein, carbs, fat) => protein * 4 + carbs * 4 + fat * 9;
  const perServing = (food) => Boolean(food) && food.basis === "serving";
  const measureUnit = (food) => {
    if (perServing(food)) return food?.servingUnit === "ml" ? "ml" : "g";
    if (food?.basisUnit === "ml" || food?.basis === "100ml") return "ml";
    return "g";
  };

  const basisAmount = (food) =>
    perServing(food)
      ? 1
      : Number(food?.basisAmount) > 0
        ? Number(food.basisAmount)
        : 100;

  function amountFor(food, quantity, unit) {
    const servingSize = Number(food.servingGrams);
    const baseUnit = measureUnit(food);
    if (unit === "serving" && perServing(food)) return quantity;
    if (unit === baseUnit && !perServing(food)) return quantity;
    if (unit !== baseUnit && unit !== "serving") return NaN;
    if (!(servingSize > 0)) return NaN;
    return perServing(food) ? quantity / servingSize : quantity * servingSize;
  }

  // Arithmetic input with a small whitelist-based parser; no eval or Function.
  function mathValue(value) {
    const src = String(value)
      .replace(/[０-９]/g, (char) => String(char.charCodeAt(0) - 65296))
      .replace(/[×✕ｘ]/g, "*")
      .replace(/[÷]/g, "/")
      .replace(/[＋]/g, "+")
      .replace(/[－−]/g, "-")
      .replace(/[（]/g, "(")
      .replace(/[）]/g, ")")
      .replace(/\s/g, "");
    if (!src || !/^[0-9.+\-*/()]+$/.test(src)) return NaN;

    let position = 0;
    function primary() {
      if (src[position] === "+") {
        position += 1;
        return primary();
      }
      if (src[position] === "-") {
        position += 1;
        return -primary();
      }
      if (src[position] === "(") {
        position += 1;
        const number = expression();
        if (src[position++] !== ")") throw new Error("Unclosed expression");
        return number;
      }
      const match = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(src.slice(position));
      if (!match) throw new Error("Invalid number");
      position += match[0].length;
      return Number(match[0]);
    }
    function term() {
      let number = primary();
      while (src[position] === "*" || src[position] === "/") {
        const operator = src[position++];
        const right = primary();
        number = operator === "*" ? number * right : number / right;
      }
      return number;
    }
    function expression() {
      let number = term();
      while (src[position] === "+" || src[position] === "-") {
        const operator = src[position++];
        const right = term();
        number = operator === "+" ? number + right : number - right;
      }
      return number;
    }

    try {
      const number = expression();
      return position === src.length && Number.isFinite(number) ? number : NaN;
    } catch {
      return NaN;
    }
  }

  return {
    macroKcal,
    perServing,
    measureUnit,
    basisAmount,
    amountFor,
    mathValue,
  };
});
