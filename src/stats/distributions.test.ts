import { describe, it, expect } from "vitest";
import { binomialCoeff, binomialPMF, normalPDF, normalCDF } from "./distributions";

describe("binomialCoeff", () => {
  it("returns 1 for C(n, 0)", () => {
    expect(binomialCoeff(5, 0)).toBe(1);
  });
  it("returns 1 for C(n, n)", () => {
    expect(binomialCoeff(5, 5)).toBe(1);
  });
  it("computes C(10, 3) = 120", () => {
    expect(binomialCoeff(10, 3)).toBe(120);
  });
  it("computes C(20, 7) = 77520", () => {
    expect(binomialCoeff(20, 7)).toBe(77520);
  });
  it("returns 0 for k > n", () => {
    expect(binomialCoeff(3, 5)).toBe(0);
  });
  it("returns 0 for k < 0", () => {
    expect(binomialCoeff(3, -1)).toBe(0);
  });
});

describe("binomialPMF", () => {
  it("returns 1 for n=0, k=0", () => {
    expect(binomialPMF(0, 0, 0.5)).toBeCloseTo(1, 10);
  });
  it("computes P(X=2; n=4, p=0.5) = 0.375", () => {
    expect(binomialPMF(4, 2, 0.5)).toBeCloseTo(0.375, 10);
  });
  it("computes P(X=0; n=10, p=0.3) ≈ 0.02824752", () => {
    expect(binomialPMF(10, 0, 0.3)).toBeCloseTo(0.02824752, 8);
  });
  it("sums to 1 over all k for n=10, p=0.4", () => {
    let s = 0;
    for (let k = 0; k <= 10; k++) s += binomialPMF(10, k, 0.4);
    expect(s).toBeCloseTo(1, 10);
  });
});

describe("normalPDF", () => {
  it("standard normal at 0 is 1/sqrt(2π) ≈ 0.39894", () => {
    expect(normalPDF(0, 0, 1)).toBeCloseTo(0.3989422804, 8);
  });
  it("standard normal at 1 ≈ 0.24197", () => {
    expect(normalPDF(1, 0, 1)).toBeCloseTo(0.2419707245, 8);
  });
  it("is symmetric: f(-x) = f(x)", () => {
    expect(normalPDF(-1.7, 0, 1)).toBeCloseTo(normalPDF(1.7, 0, 1), 12);
  });
});

describe("normalCDF", () => {
  it("Φ(0) = 0.5", () => {
    expect(normalCDF(0, 0, 1)).toBeCloseTo(0.5, 5);
  });
  it("Φ(1.96) ≈ 0.975", () => {
    expect(normalCDF(1.96, 0, 1)).toBeCloseTo(0.975, 4);
  });
  it("Φ(-1.96) ≈ 0.025", () => {
    expect(normalCDF(-1.96, 0, 1)).toBeCloseTo(0.025, 4);
  });
  it("Φ(3) ≈ 0.99865", () => {
    expect(normalCDF(3, 0, 1)).toBeCloseTo(0.99865, 4);
  });
});
