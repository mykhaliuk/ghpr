export function throwError(error: any, code = 1) {
  if (error) {
    console.clear();
    console.log(error);
    process.exit(code);
  }
}
