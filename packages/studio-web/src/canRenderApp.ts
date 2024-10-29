/**
 * Safari < 16.4 doesn't support `static{}` blocks in classes. TypeScript sometimes uses these when
 * emitting code for decorators.
 */
function supportsClassStaticInitialization() {
  try {
    // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
    new Function("class X { static { } }");
    return true;
  } catch (err) {
    // Safari does not support static{} blocks in classes
    return false;
  }
}

const supportsOffscreenCanvas =
  typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function";

/** Returns true if JS syntax and APIs required for rendering the rest of the app are supported. */
export function canRenderApp(): boolean {
  return (
    typeof BigInt64Array === "function" &&
    typeof BigUint64Array === "function" &&
    supportsClassStaticInitialization() &&
    supportsOffscreenCanvas
  );
}
