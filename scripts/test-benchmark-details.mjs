import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let server, Component;
before(async () => {
  server = await createServer({
    server: { middlewareMode: true }, appType: 'custom',
    define: { global: 'globalThis' },
    optimizeDeps: { noDiscovery: true, include: [], entries: [] },
  });
  Component = (await server.ssrLoadModule('/src/features/admin/components/BenchmarkMetricDetails.tsx')).BenchmarkMetricDetails;
});
after(async () => { await server?.close(); });
const render = metrics => renderToStaticMarkup(React.createElement(Component, {
  metrics, question: 'Câu hỏi gốc', documents: [],
}));

test('legacy scores stay visible without fabricated explanations', () => {
  const html = render({ contextPrecision: { value: .589, status: 'ok' } });
  assert.ok(html.includes('0,589'));
  assert.ok(html.includes('chưa lưu dữ liệu giải thích'));
  assert.ok(html.includes('P@k'));
});

test('new results show source evidence and all five substituted calculations', () => {
  const ok = details => ({ value: 1, status: 'ok', details: { version: 1, complete: true, ...details } });
  const html = render({
    contextPrecision: ok({ rows: [{rank:1, context:{pageNumber:3,text:'Source evidence'},verdict:1,reason:'Useful source',cumulativeRelevant:1,precisionAtK:1,contribution:1}], expectedContexts:1,relevantCount:1,numerator:1,denominator:1.0000000001,epsilon:1e-10 }),
    faithfulness: ok({ generatedStatements:['Claim'],statements:[{statement:'Claim',reason:'Source supports claim',verdict:1}],supportedCount:1,statementCount:1 }),
    answerRelevance: ok({ rows:[{question:'Reverse question',noncommittal:0,used:true,dotProduct:1,generatedNorm:1,cosine:1}],originalNorm:1,usedCount:1,meanCosine:1,substantiveFactor:1 }),
    citationAccuracy: ok({ expectedSources:[{documentCode:'OS1',pageNumber:3}],rows:[{documentId:1,documentCode:'OS1',pageNumber:3,correct:true}],matchedCount:1,predictedCount:1 }),
    latency: {value:105,status:'ok',details:{version:1,complete:true,routerMs:10,retrievalMs:20,synthesisMs:40,evaluatorMs:30,overheadMs:5,totalMs:105}},
  });
  for (const text of ['Source evidence','Useful source','1 + 10⁻¹⁰','Source supports claim','Reverse question','1 / (1 × 1) = 1','OS1','10 + 20 + 40 + 30 + 5 = 105']) {
    assert.ok(html.includes(text), `Missing evidence or calculation: ${text}`);
  }
});

test('timeouts show observed rows and never present an unfinished final calculation', () => {
  const html = render({ contextPrecision: {value:null,status:'error',reason:'TimeoutError',details:{version:1,complete:false,rows:[],expectedContexts:5,relevantCount:0,numerator:0,denominator:1e-10,epsilon:1e-10}} });
  assert.ok(html.includes('chưa hoàn tất'));
  assert.ok(html.includes('TimeoutError'));
  assert.ok(!html.includes('/ (0 + 10⁻¹⁰) ='));
});
