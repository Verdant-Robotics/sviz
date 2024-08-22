import { Fzf } from "fzf";

describe("fzf", () => {
  it("does fuzzy searching", () => {
    const fzf = new Fzf(["apple", "banana", "cherry"], { fuzzy: "v1" });
    const resA = fzf.find("a");
    expect(resA).toHaveLength(2);
    const resA0 = resA[0]!;
    const resA1 = resA[1]!;
    expect(resA0.start).toBe(0);
    expect(resA0.end).toBe(1);
    expect(resA0.item).toBe("apple");
    expect(resA1.start).toBe(1);
    expect(resA1.end).toBe(2);
    expect(resA1.item).toBe("banana");

    expect(fzf.find("b")).toHaveLength(1);
    expect(fzf.find("c")).toHaveLength(1);
  });
});
