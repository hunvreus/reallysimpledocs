import assert from 'node:assert/strict';
import { loadApi, resolveSchema, apiMarkdown } from '../src/runtime/lib/openapi.js';
import { getPages, getManifest, getMarkdownExport, buildMenus } from '../src/runtime/lib/docs.js';
const config = { docsDir: new URL('../docs/', import.meta.url).pathname, routeBase: '' };
const api = loadApi(config.docsDir, { source: './api/accounts.yaml', slug: 'api/accounts' });
const operations = api.groups.flatMap(group => group.operations);
assert.equal(operations.length, 4);
assert.equal(api.groups[0].name, "Accounts");
assert.equal(new Set(operations.map(op => op.id)).size, 4);
const create = operations.find(op => op.method === 'POST');
assert.equal(resolveSchema(create.spec, { $ref: '#/components/schemas/Address' }).required[0], 'country');
assert.throws(() => resolveSchema(create.spec, { $ref: '#/missing' }), /Unresolved/);
assert.throws(() => resolveSchema(create.spec, { $ref: 'other.yaml' }), /local references/);
assert.match(apiMarkdown(api), /postal_code/);
assert.match(apiMarkdown(api), /201/);
const page = getPages(config).find(page => page.slug === api.slug);
assert.equal(page.path, '/api/accounts/');
assert.match(getMarkdownExport(config, page), /email/);
assert.equal(getManifest(config).menu.at(-1).items[0].api.groups.length, 2);
const apiMenu = buildMenus(config, api.slug).sidebar.find(group => group.label === 'OpenAPI POC');
assert.deepEqual(apiMenu.items.map(({ type, url, current }) => ({ type, url, current })), [
  { type: 'item', url: page.path, current: true },
]);
const exported = getMarkdownExport(config, page);
assert.match(exported, /accounts:write/);
assert.match(exported, /Retry-After/);
assert.match(exported, /invalid_email/);
assert.equal(create.responses['429'].$ref, operations.find(op => op.id === 'list-accounts').responses['429'].$ref);
console.log('OpenAPI POC checks passed');

assert.deepEqual(api.groups.map(group => group.name), ['Accounts', 'Service']);
assert.match(apiMarkdown(api), /## Service/);
assert.equal(getPages(config).filter(page => page.api).length, 1);
