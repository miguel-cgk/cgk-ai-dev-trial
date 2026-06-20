// Ambient declaration so TypeScript accepts global CSS side-effect imports
// (e.g. `import "./globals.css"`). Next 15's bundled types don't declare these
// for the standalone type-check that `next build` runs.
declare module "*.css";
