import './_tmp-scope.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { removeTree } from './_tmp-scope.mjs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
const childSource=new URL('../../duplicate-invoice-check/src/index.ts',import.meta.url);
const available=(await import('node:fs')).existsSync(childSource);
test('office proxy diagnoses duplicate candidates and preserves both report namespaces',{skip:!available},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'office-duplicates-'));
 const client=new Client({name:'office-duplicate-invoice-integration',version:'1'});
 const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../dist/index.js',import.meta.url))],stderr:'pipe',env:{...process.env,XDG_DATA_HOME:join(dir,'data'),XDG_CONFIG_HOME:join(dir,'config'),MCP_LICENSE_KEY:''}});
 let stderr='';transport.stderr.on('data',d=>stderr+=d.toString());
 try{
  await client.connect(transport);const tools=(await client.listTools()).tools;
  const names=tools.map(t=>t.name);assert(names.includes('duplicate_invoice_check'));
  assert(names.includes('three-way-match_report_get'));assert(names.includes('duplicate-invoice-check_report_get'));
  const map=JSON.parse((await client.readResource({uri:'office://tools_map'})).contents[0].text);
  assert(Array.isArray(map.tools));
  const owned=map.tools.filter(t=>t.child.startsWith('duplicate-invoice-check.'));
  assert.equal(owned.length,6);assert.equal(owned.find(t=>t.child.endsWith('.report_get')).exposed,'duplicate-invoice-check_report_get');
  const call=async(name,args={})=>{const r=await client.callTool({name,arguments:args});assert(!r.isError,r.content?.[0]?.text);return JSON.parse(r.content[0].text);};
  const base={entity_id:'E1',supplier_id:'S1',document_type:'invoice',invoice_number:'report_get',invoice_date:'2026-10-16',currency:'USD',total_minor:10000};
  const input={records:[{...base,record_id:'A'},{...base,record_id:'B'},{...base,record_id:'C',supplier_id:'OTHER'}],save:true};
  const result=await call('duplicate_invoice_check',input);assert.equal(result.saved,true);assert.equal(result.report.summary.candidate_record_count,2);
  assert.equal(result.report.records[0].invoice_number,'report_get');
  assert.equal(result.report.retrieval.page_tool,'duplicate-invoice-check_report_page');
  assert.equal(result.report.retrieval.export_tool,'duplicate-invoice-check_report_export_csv');
  const saved=await call('duplicate-invoice-check_report_get',{id:result.id});assert.equal(saved.report.summary.candidate_record_count,2);
  const csv=await call('duplicate-invoice-check_report_export_csv',{id:result.id});assert.equal(csv.total_rows,3);
  const page=await call('duplicate-invoice-check_report_page',{id:result.id,section:'records',limit:1});assert.equal(page.rows.length,1);assert.equal(page.rows[0].invoice_number,'report_get');
  assert(csv.csv.includes('report_get'));assert(!csv.csv.includes('duplicate-invoice-check_report_get'));
  assert.equal((await client.callTool({name:'duplicate_invoice_check',arguments:{...input,extra:true}})).isError,true);
  assert(!/failed to (connect|start)|optional child .*not found, skipping/.test(stderr),stderr);
 }finally{
  await client.close();const deadline=Date.now()+5000;
  while(existsSync(dir)){
   const open=spawnSync(process.platform==='darwin'?'/usr/sbin/lsof':'lsof',['-t','+D',dir],{encoding:'utf8'});
   if(open.status===1&&!open.stdout.trim())removeTree(dir);
   else if(open.error||open.status!==0)throw Error('Cannot prove fixture has no open handles');
   if(existsSync(dir)){assert(Date.now()<deadline,'Fixture retained with open child handles');await delay(100);}
  }
 }

});
