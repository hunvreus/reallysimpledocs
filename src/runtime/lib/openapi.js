import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

// POC contract: local OpenAPI 3 documents, local JSON pointers, one reference per service.
export function loadApi(docsDir, item) {
  const spec = parse(fs.readFileSync(path.resolve(docsDir, item.source), 'utf8'));
  if (!String(spec.openapi).startsWith('3.')) throw new Error('Expected OpenAPI 3.x');
  const operations = [];
  const slugs = new Set();
  for (const [url, entry] of Object.entries(spec.paths || {})) {
    for (const method of methods) {
      const operation = entry[method];
      if (!operation) continue;
      const id = operation.operationId || `${method}-${url.replace(/[^a-z0-9]+/gi, '-')}`;
      const slug = `${item.slug}/${id}`;
      if (slugs.has(slug)) throw new Error(`Duplicate API route: ${slug}`);
      slugs.add(slug);
      operations.push({ ...operation, slug, method: method.toUpperCase(), url,
        parameters: [...(entry.parameters || []), ...(operation.parameters || [])], spec,
        title: operation.summary || `${method.toUpperCase()} ${url}` });
    }
  }
  const groups = new Map((spec.tags || []).map(tag => [tag.name, { name: tag.name, description: tag.description, operations: [] }]));
  for (const operation of operations) {
    for (const name of operation.tags?.length ? operation.tags : ['Other']) {
      if (!groups.has(name)) groups.set(name, { name, operations: [] });
      groups.get(name).operations.push(operation);
    }
  }
  const ids = new Set();
  const anchor = (value) => {
    const base = String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
    let id = base;
    for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
    ids.add(id);
    return id;
  };
  return {
    slug: item.slug, title: item.label || spec.info?.title || 'API reference',
    description: spec.info?.description || '', spec,
    groups: [...groups.values()].filter(group => group.operations.length).map(group => ({
      ...group, id: anchor(`tag-${group.name}`),
      operations: group.operations.map(operation => ({ ...operation, id: anchor(operation.operationId || `${operation.method}-${operation.url}`) })),
    })),
  };
}

export function resolveSchema(spec, schema = {}) {
  if (!schema.$ref) return schema;
  if (!schema.$ref.startsWith('#/')) throw new Error('POC supports local references only');
  const value = schema.$ref.slice(2).split('/').reduce((node, key) => node?.[key.replaceAll('~1', '/').replaceAll('~0', '~')], spec);
  if (!value) throw new Error(`Unresolved reference: ${schema.$ref}`);
  return value;
}

export function operationMarkdown(api) {
  const lines = [`# ${api.title}`, '', `\`${api.method} ${api.url}\``, '', api.description || '', '', '## Parameters'];
  const security = api.security ?? api.spec.security ?? [];
  lines.splice(-1, 0, '## Authentication', '', ...(security.length
    ? security.map(requirement => '- ' + (Object.entries(requirement).map(([name, scopes]) =>
        scopes.length ? `${name}: ${scopes.join(', ')}` : name
      ).join(' and ') || 'Anonymous access'))
    : ['No authentication required.']), '');
  const fields = (schema, depth = 0) => {
    if (depth > 6) return;
    const value = resolveSchema(api.spec, schema);
    for (const [name, field] of Object.entries(value.properties || {})) {
      const resolved = resolveSchema(api.spec, field);
      lines.push(`${'  '.repeat(depth)}- **${name}** (${resolved.type || 'object'}${value.required?.includes(name) ? ', required' : ''}): ${resolved.description || ''}`);
      fields(resolved.items || resolved, depth + 1);
    }
  };
  for (const parameter of api.parameters) {
    const p = resolveSchema(api.spec, parameter);
    lines.push(`- **${p.name}** (${p.in}): ${p.description || ''}`);
  }
  const body = resolveSchema(api.spec, api.requestBody || {});
  fields(body.content?.['application/json']?.schema || {});
  lines.push('', '## Responses');
  for (const [status, response] of Object.entries(api.responses || {})) {
    const r = resolveSchema(api.spec, response);
    lines.push('', `### ${status}`, r.description || '');
    for (const [name, entry] of Object.entries(r.headers || {})) {
      const header = resolveSchema(api.spec, entry);
      lines.push(`- Header **${name}**: ${header.description || ''}`);
    }
    const content = r.content?.['application/json'];
    fields(content?.schema || {});
    const examples = [content?.example, ...Object.values(content?.examples || {}).map(entry => resolveSchema(api.spec, entry).value)];
    for (const example of examples) {
      if (example !== undefined) lines.push('', '```json', JSON.stringify(example, null, 2), '```');
    }
  }
  return lines.join('\n');
}

export function apiMarkdown(api) {
  return [`# ${api.title}`, api.description, ...api.groups.flatMap(group => [
    `## ${group.name}`, group.description || '',
    ...group.operations.map(operation => operationMarkdown(operation).replace(/^# /gm, '### ').replace(/^## /gm, '#### ').replace(/^### (\d)/gm, '##### $1')),
  ])].join('\n\n');
}
