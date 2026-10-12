/**
 * Resolve the package root directory.
 *
 * Uses import.meta.url (ESM) to compute an absolute path to the package root,
 * independent of process.cwd(). This file is ESM-only; in CJS test contexts
 * (Jest/ts-jest), it is replaced via moduleNameMapper — see jest.config.cjs.
 */
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

// dist/core/resolve-package-root.js → ../../ = package root
const __here = dirname(fileURLToPath(import.meta.url));
// SPARQ: the bundled server lives in <plugin>/server/ next to package.json; tsc output lives in dist/core/.
export const PACKAGE_ROOT = [__here, join(__here, '..'), join(__here, '..', '..')].find(d => existsSync(join(d, 'package.json'))) || join(__here, '..', '..');
