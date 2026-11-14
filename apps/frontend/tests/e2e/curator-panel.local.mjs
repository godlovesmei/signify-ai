// Visual/interaction QA of the actual components with synthetic fixtures only.
// No user accounts, database writes, real videos, or external data requests.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, join, extname } from "node:path";
import { chromium } from "@playwright/test";
const require = createRequire(import.meta.url);
const viteRequire = createRequire(require.resolve("vitest/package.json"));
const { build } = await import(viteRequire.resolve("vite"));
const root = process.cwd();
const responsive = process.argv.includes("--responsive");
const typography = process.argv.includes('--typography');
const directory = resolve(typography ? 'test-results/dataset-typography' : responsive ? "test-results/dataset-responsive" : "test-results/curator-panel");
const fixtureDir = join(directory, "fixture");
const assetsDir = join(directory, "assets");
await mkdir(fixtureDir, { recursive: true });
await writeFile(join(fixtureDir, "navigation.tsx"), `import React from "react";
export const Link=({href,children,...props})=><a href={href} {...props}>{children}</a>;
export const useRouter=()=>({push:href=>{window.__navigation=href},replace:(href,options)=>{const url=new URL(href,location.origin);url.searchParams.set("locale",options?.locale||"id");location.assign(url)}});
export const usePathname=()=>location.pathname;`);
await writeFile(join(fixtureDir, "api.ts"), `import { CONTRIBUTION, LABEL, POLICY, ID } from "../../../tests/datasetFixtures";
export class DatasetApiError extends Error { constructor(public status:number,public code:string){super(code);} }
export const datasetErrorKey=()=>"network";
let rows=["Terima Kasih","Makan","Saya"].map((word,index)=>({...CONTRIBUTION,id:"7700000"+index+"-0000-4000-8000-000000000030",proposed_label_text:new URLSearchParams(location.search).has("long")&&index===0?"KontribusiDenganNamaPanjangTanpaSpasiUntukMengujiTampilanPadaLayarKecil":word}));
let accounts=[];let approved=2,rejected=1;
window.__submitContribution=()=>{rows.unshift({...CONTRIBUTION,id:'88000000-0000-4000-8000-000000000099',proposed_label_text:'Kiriman akun lain'});window.dispatchEvent(new Event('dataset-live-update'))};
export const datasetApi={
 policy:async()=>({...POLICY,min_duration_ms:3000,max_duration_ms:7000,max_size_bytes:16*1048576}),
 list:async()=>({items:[{...CONTRIBUTION,proposed_label_id:null,proposed_label_text:"KontribusiDenganNamaPanjangTanpaSpasiUntukMengujiTampilanPadaLayarKecil",status:"REJECTED",rejection_reason:"Catatan pengirim sangat panjang untuk menguji pembungkusan teks di layar mobile."}],next_offset:null,total:1}),
 summary:async()=>({total:1,PENDING:0,APPROVED:0,REJECTED:1}),
 detail:async()=>({...CONTRIBUTION,id:ID,status:"REJECTED",rejection_reason:"Catatan pengirim sangat panjang untuk menguji pembungkusan teks di layar mobile."}),
 reviewInfo:async()=>({available:false,target_business_days:null,can_review:false}),
 access:async()=>({is_admin:new URLSearchParams(location.search).get("mode")==="admin",is_curator:new URLSearchParams(location.search).get("mode")!=="admin"&&new URLSearchParams(location.search).get("mode")!=="user",review_available:true}),
 reviewQueue:async(offset,signal,q="")=>{const items=rows.filter(x=>!q||x.proposed_label_text.includes(q));return {items:items.slice(offset,offset+10),next_offset:null,total:items.length}},
 reviewSummary:async()=>({total:rows.length+approved+rejected,PENDING:rows.length,APPROVED:approved,REJECTED:rejected}),
 labels:async()=>({items:[LABEL]}),
 review:async(id,input)=>{rows=rows.filter(x=>x.id!==id);if(input.decision==="APPROVED")approved++;else rejected++;return {revision:2,status:input.decision}},
 playback:async()=>fetch('http://127.0.0.1:43210/storage/fixture').then(response=>response.blob()),
 curators:async()=>({items:accounts}),
 grantCurator:async(email,note)=>{accounts=[{user_id:"fixture",email,display_name:"Kurator Uji",qualification_note:note,granted_at:new Date().toISOString(),revoked_at:null}];return {active:true}},
 revokeCurator:async()=>{accounts=accounts.map(x=>({...x,revoked_at:new Date().toISOString()}));return {active:false}},
};
export const uploadContribution=async()=>({contribution:CONTRIBUTION,replayed:false});`);
await writeFile(join(fixtureDir, "params.ts"), `export const useParams=()=>({id:"bff6b03c-a794-431e-b974-a869727b0820"});`);
await writeFile(join(fixtureDir, 'live.ts'), `import {useEffect} from 'react';
export function useDatasetLiveUpdates(refresh){useEffect(()=>{window.addEventListener('dataset-live-update',refresh);return()=>window.removeEventListener('dataset-live-update',refresh)},[refresh])}`);
await writeFile(join(fixtureDir, "image.tsx"), `import React from "react";export default function Image(props){return <img {...props}/>}`);
await writeFile(join(fixtureDir, "entry.tsx"), `import React from "react"; import {createRoot} from "react-dom/client";
import {NextIntlClientProvider} from "next-intl"; import idMessages from "../../../messages/id.json"; import enMessages from "../../../messages/en.json";
import "../../../styles/globals.css";
import ContributionsContent from "../../../app/[locale]/(workspace)/contributions/_content";
import NewContributionContent from "../../../app/[locale]/(workspace)/contributions/new/_content";
import ContributionDetailContent from "../../../app/[locale]/(workspace)/contributions/[id]/_content";
import DatasetCuration from "../../../components/features/dataset/DatasetCuration";
import DatasetCuratorAccess from "../../../components/features/dataset/DatasetCuratorAccess";
import DatasetAccessGate from "../../../components/features/dataset/DatasetAccessGate";
import DatasetRoleNavigation from "../../../components/layout/DatasetRoleNavigation";
const params=new URLSearchParams(location.search);
const mode=params.get("mode")||"curator";
const locale=params.get("locale")==="en"?"en":"id";
document.documentElement.lang=locale;
document.documentElement.classList.toggle("dark",params.get("theme")==="dark");
const content=mode==="collection"?<ContributionsContent/>:mode==="new"?<NewContributionContent/>:mode==="detail"?<ContributionDetailContent/>:<DatasetAccessGate role={mode==="admin"?"admin":"curator"}>{mode==="admin"?<DatasetCuratorAccess/>:<DatasetCuration/>}</DatasetAccessGate>;
const access={is_admin:mode==="admin",is_curator:mode==="curator",review_available:true};
createRoot(document.getElementById("root")).render(<NextIntlClientProvider locale={locale} messages={locale==="en"?enMessages:idMessages}><div className="flex min-h-screen bg-cohere-canvas text-cohere-ink"><aside className="hidden w-56 shrink-0 border-r border-cohere-hairline p-4 lg:block"><p className="mb-8 text-xl">SignifyAI</p><DatasetRoleNavigation access={access} pathname={mode==="admin"?"/admin/curators":"/curator"}/></aside><main className="min-w-0 flex-1">{content}</main></div></NextIntlClientProvider>);`);
await build({ root, configFile:false, logLevel:"error", resolve:{alias:[
  {find:"@/lib/dataset/api",replacement:join(fixtureDir,"api.ts")},
  {find:'@/hooks/useDatasetLiveUpdates',replacement:join(fixtureDir,'live.ts')},
  {find:"@/i18n/navigation",replacement:join(fixtureDir,"navigation.tsx")},
  {find:"next/navigation",replacement:join(fixtureDir,"params.ts")},
  {find:"next/image",replacement:join(fixtureDir,"image.tsx")},
  {find:"@",replacement:root},
]}, define:{"process.env.NODE_ENV":JSON.stringify("production"),"process.env":JSON.stringify({NODE_ENV:"production"}),"process.env.NEXT_PUBLIC_DATASET_CONSENT_VERSION":JSON.stringify("synthetic-qa"),"process.env.NEXT_PUBLIC_DATASET_CONSENT_TEXT":JSON.stringify("Synthetic QA consent"),"process.env.NEXT_PUBLIC_DATASET_API_URL":JSON.stringify("http://127.0.0.1:43210"),"process.env.NEXT_PUBLIC_SUPABASE_URL":JSON.stringify("http://127.0.0.1:43210")},
  build:{outDir:assetsDir,emptyOutDir:true,lib:{entry:join(fixtureDir,"entry.tsx"),formats:["iife"],name:"CuratorQA",fileName:()=>"qa.js",cssFileName:"qa"},rollupOptions:{external:[]}},
  esbuild:{jsx:"automatic"},
});
let videoBytes=Buffer.alloc(0);
const server=createServer(async(req,res)=>{
  try {
    const pathname=new URL(req.url,"http://127.0.0.1:43210").pathname;
    if(pathname.startsWith("/storage/")){res.writeHead(200,{"Content-Type":"video/webm","Access-Control-Allow-Origin":"*"});res.end(videoBytes);return;}
    if(pathname==="/"||pathname==="/index.html"){res.setHeader("Content-Type","text/html");res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/qa.css"></head><body><div id="root"></div><script src="/qa.js"></script></body></html>');return;}
    const base=(pathname.startsWith("/fonts/")||pathname.startsWith("/alfabet/"))?resolve("public"):assetsDir;
    const path=resolve(base,"."+pathname);
    if(!path.startsWith(base+"/")){res.writeHead(403);res.end();return;}
    const data=await readFile(path);
    res.setHeader("Content-Type",({".css":"text/css",".js":"text/javascript",".woff2":"font/woff2",".jpg":"image/jpeg"})[extname(path)]||"application/octet-stream");res.end(data);
  }catch{res.writeHead(404);res.end();}
});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(43210,"127.0.0.1",resolve);});
let browser;
const checks=[];
try {
  browser=await chromium.launch({headless:true,args:["--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream"]});
  const context=await browser.newContext({viewport:{width:1500,height:950}});
  await context.route("**/*",route=>new URL(route.request().url()).hostname==="127.0.0.1"?route.continue():route.abort());
  const page=await context.newPage();
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  page.on("console",message=>{if(message.type()==="error"&&/MISSING_MESSAGE|FORMATTING_ERROR|INVALID_MESSAGE/.test(message.text()))errors.push(message.text())});
  await page.goto("http://127.0.0.1:43210/?mode=user");
  await page.getByRole("heading",{name:"Akses terbatas"}).waitFor().catch(async error=>{console.error(JSON.stringify({errors,body:await page.locator("body").innerText()}));await page.screenshot({path:join(directory,"qa-failure.png")});throw error;});checks.push("Regular account denied curator controls");
  videoBytes=Buffer.from(await page.evaluate(async()=>{
    const canvas=document.createElement("canvas");canvas.width=640;canvas.height=480;
    const ctx=canvas.getContext("2d");ctx.fillStyle="#17171c";ctx.fillRect(0,0,640,480);ctx.fillStyle="#edfce9";ctx.font="26px sans-serif";ctx.fillText("Video sintetis pengujian",155,240);
    const stream=canvas.captureStream(10);const chunks=[];const recorder=new MediaRecorder(stream,{mimeType:"video/webm"});
    recorder.ondataavailable=e=>chunks.push(e.data);const stopped=new Promise(resolve=>recorder.onstop=resolve);
    recorder.start();const repaint=setInterval(()=>{ctx.fillStyle="#edfce9";ctx.fillRect(100,300,440,3);},80);await new Promise(resolve=>setTimeout(resolve,1000));clearInterval(repaint);recorder.stop();await stopped;stream.getTracks().forEach(track=>track.stop());
    return [...new Uint8Array(await new Blob(chunks,{type:"video/webm"}).arrayBuffer())];
  }));
  if (typography) {
    for (const theme of ['light', 'dark']) for (const width of [390, 960, 1500]) {
      await page.setViewportSize({width,height:950});
      for (const mode of ['new', 'collection', 'curator', 'detail']) {
        const styles = {};
        for (const locale of ['id', 'en']) {
          await page.goto(`http://127.0.0.1:43210/?mode=${mode}&locale=${locale}&theme=${theme}`);
          await page.locator('h1').waitFor();
          if (mode === 'new') await page.locator('#contribution-word').waitFor();
          if (mode === 'curator' || mode === 'collection') await page.getByRole('table').waitFor();
          await page.evaluate(() => document.fonts.ready);
          styles[locale] = await page.evaluate(() => {
            const props = ['color','backgroundColor','borderColor','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'];
            const selectors = ['.dataset-surface', 'h1', 'h1 + p', '.dataset-surface label',
              '.dataset-surface input', '.dataset-surface select', '.dataset-surface button', '.dataset-surface th'];
            return selectors.map(selector => ({selector, nodes: [...document.querySelectorAll(selector)].map(node => {
              const style = getComputedStyle(node);
              return Object.fromEntries(props.map(key => [key, style[key]]));
            })}));
          });
          if (mode === 'new' && width === 960) await page.screenshot({path:join(directory,`recording-${locale}-${theme}.png`),fullPage:true});
        }
        assert.deepEqual(styles.en, styles.id, `${mode}/${theme}/${width}: English must use Indonesian typography and palette`);
        checks.push(`${mode}/${theme}/${width}: identical colors, fonts and weights`);
      }
    }
    assert.deepEqual(errors, []);
    await writeFile(join(directory,'report.json'),JSON.stringify({kind:'locale-style-parity',checks,errors},null,2));
    console.log(JSON.stringify({passed:checks.length,errors:errors.length,screenshots:directory}));
  } else if (responsive) {
    const id = JSON.parse(await readFile(resolve("messages/id.json"),"utf8")).workspace.contributions;
    const en = JSON.parse(await readFile(resolve("messages/en.json"),"utf8")).workspace.contributions;
    for (const locale of ["id","en"]) for (const theme of ["light","dark"]) for (const width of [320,390,768,1500]) {
      const t=locale==="id"?id:en;
      for (const mode of ["collection","curator","admin","new","detail"]) {
        await page.setViewportSize({width,height:900});
        await page.goto(`http://127.0.0.1:43210/?mode=${mode}&locale=${locale}&theme=${theme}&long=1`);
        const title=mode==="collection"?t.title:mode==="curator"?t.curatorPanel:mode==="admin"?t.curatorAccess:mode==="new"?t.newTitle:"Synthetic test label";
        await page.getByRole("heading",{name:title,exact:true}).waitFor();
        if(["collection","curator"].includes(mode))await page.getByRole("table").waitFor();
        if(mode==="new")await page.getByLabel(t.wordLabel,{exact:true}).waitFor();
        if(mode==="admin"){
          await page.getByText(t.noCurators,{exact:true}).waitFor();
          await page.getByLabel(t.curatorEmail,{exact:true}).fill("kurator.".repeat(12)+"uji@example.test");
          await page.getByLabel(t.qualificationNote,{exact:true}).fill("Catatan kompetensi panjang untuk pengujian. ".repeat(10));
          await page.getByRole("button",{name:t.grantCurator,exact:true}).click();
          await page.getByText("Kurator Uji",{exact:true}).waitFor();
        }
        if(mode==="detail")await page.getByRole("button",{name:t.loadVideo,exact:true}).waitFor();
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${mode}/${locale}/${theme}/${width} overflows`);
        if(["collection","curator"].includes(mode)&&width<=768){
          assert.equal(await page.locator(".dataset-table tbody tr").first().evaluate(row=>getComputedStyle(row).display),"grid");
          assert.ok(await page.locator(".dataset-table-container").evaluate(element=>element.scrollWidth<=element.clientWidth),`${mode}/${locale}/${theme}/${width} clips table content`);
        }
        if(width===390||width===1500)await page.screenshot({path:join(directory,`${mode}-${locale}-${theme}-${width}.png`),fullPage:true,animations:"disabled"});
        if(["collection","curator"].includes(mode)&&width===320){
          const action=page.getByRole("button",{name:mode==="collection"?new RegExp(locale==="id"?"Putar kontribusi":"Play contribution"):new RegExp(locale==="id"?"Periksa kontribusi":"Inspect contribution")}).first();
          await action.click();const dialog=page.getByRole("dialog");await dialog.waitFor();
          const box=await dialog.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width);
          const close=dialog.getByRole("button",{name:locale==="id"?"Tutup":"Close",exact:true});
          await close.click();await dialog.waitFor({state:"hidden"});
        }
        checks.push(`${mode}/${locale}/${theme}/${width}`);
      }
    }
    for(const locale of ["id","en"]){
      const t=locale==="id"?id:en;
      await page.setViewportSize({width:320,height:900});
      await page.goto(`http://127.0.0.1:43210/?mode=new&locale=${locale}&theme=dark`);
      const word=page.getByLabel(t.wordLabel,{exact:true});await word.fill("Terima Kasih");
      assert.ok(await word.evaluate(element=>parseFloat(getComputedStyle(element).fontSize)>=16));
      await page.getByRole("button",{name:t.openCamera,exact:true}).click();
      await page.getByRole("button",{name:t.start,exact:true}).waitFor();
      assert.ok((await page.locator('[aria-current="step"]').innerText()).includes(t.stepRecord));
      await page.getByRole("button",{name:t.start,exact:true}).click();
      await page.getByLabel(t.preview,{exact:true}).waitFor();
      assert.ok((await page.locator('[aria-current="step"]').innerText()).includes(t.stepReview));
      await page.getByRole("checkbox").check();
      await page.getByRole("button",{name:t.upload,exact:true}).click();
      const dialog=page.getByRole("dialog",{name:t.reviewTimingTitle,exact:true});await dialog.waitFor();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.screenshot({path:join(directory,`submission-dialog-${locale}-dark-320.png`),animations:"disabled"});
      await dialog.getByRole("button",{name:t.reviewConfirm,exact:true}).click();
      assert.ok(await page.evaluate(()=>window.__navigation?.startsWith("/contributions?submitted=")));
      checks.push(`record-review-submit/${locale}/dark/320`);
    }
    assert.deepEqual(errors,[]);
    await writeFile(join(directory,"report.json"),JSON.stringify({kind:"responsive-bilingual-theme-matrix",checks,errors,accounts_created:0,database_writes:0},null,2));
    console.log(JSON.stringify({passed:checks.length,errors:errors.length,screenshots:directory}));
  } else {
  await page.goto("http://127.0.0.1:43210/?mode=curator");await page.getByRole("table").waitFor();
  assert.equal(await page.getByRole("row").count(),4);checks.push("Desktop queue uses actual table component");
  await page.screenshot({path:join(directory,"curator-desktop.png"),fullPage:true,animations:"disabled"});
  await page.getByRole("button",{name:"Periksa kontribusi Terima Kasih"}).click();
  const dialog=page.getByRole("dialog");await dialog.waitFor();await dialog.locator("video").waitFor();
  await page.waitForFunction(()=>document.querySelector("video")?.readyState>=2);
  const playbackSource=await dialog.locator('video').getAttribute('src');
  await dialog.getByLabel('Catatan kurasi / alasan penolakan').fill('Catatan tetap tersimpan saat video baru masuk');
  await page.evaluate(()=>window.__submitContribution());
  await page.locator('button[aria-label="Periksa kontribusi Kiriman akun lain"]').waitFor();
  assert.equal(await dialog.getByLabel('Catatan kurasi / alasan penolakan').inputValue(),'Catatan tetap tersimpan saat video baru masuk');
  assert.equal(await dialog.locator('video').getAttribute('src'),playbackSource);
  await dialog.getByLabel('Catatan kurasi / alasan penolakan').fill('');
  checks.push('Incoming contribution updates queue without closing video or losing draft notes');
  await dialog.getByLabel("Label final").selectOption("__new__");
  await dialog.getByRole("button",{name:"Setujui",exact:true}).waitFor();
  await page.waitForFunction(()=>!Array.from(document.querySelectorAll('[role="dialog"] button')).find(button=>button.textContent.includes("Setujui"))?.disabled);
  await page.screenshot({path:join(directory,"curator-review-dialog.png"),fullPage:true,animations:"disabled"});
  assert.equal(await dialog.getByRole("button",{name:"Tolak",exact:true}).isEnabled(),false);
  await dialog.getByRole("button",{name:"Setujui",exact:true}).click();
  await dialog.waitFor({state:"hidden"});assert.equal(await page.getByRole("row").count(),4);checks.push("Approval closes dialog and refreshes queue");
  await page.setViewportSize({width:390,height:844});await page.goto("http://127.0.0.1:43210/?mode=curator");await page.getByRole("table").waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));checks.push("Mobile page has no horizontal overflow");
  await page.screenshot({path:join(directory,"curator-mobile.png"),fullPage:true,animations:"disabled"});
  await page.getByRole("button",{name:"Periksa kontribusi Terima Kasih"}).click();await page.getByRole("dialog").waitFor();
  assert.ok(await page.evaluate(()=>document.querySelector('[role="dialog"]').getBoundingClientRect().width<=innerWidth));
  await page.screenshot({path:join(directory,"curator-mobile-dialog.png"),fullPage:false,animations:"disabled"});checks.push("Mobile dialog fits the viewport");
  await page.getByRole("dialog").getByLabel("Catatan kurasi / alasan penolakan").fill("Alasan penolakan sintetis untuk pengujian.");
  await page.getByRole("dialog").getByRole("button",{name:"Tolak",exact:true}).click();
  await page.getByRole("dialog").waitFor({state:"hidden"});checks.push("Mobile review controls remain usable after scrolling");
  await page.setViewportSize({width:1500,height:950});await page.goto("http://127.0.0.1:43210/?mode=admin");
  await page.getByText(/Belum ada akun kurator/).waitFor();
  await page.getByLabel("Email akun kurator").fill("kurator.uji@example.test");
  await page.getByLabel("Catatan kompetensi / dasar penugasan").fill("Fixture pengujian tampilan, bukan akun sungguhan.");
  await page.getByRole("button",{name:"Berikan akses kurator",exact:true}).click();await page.getByText("Kurator Uji",{exact:true}).waitFor();
  await page.screenshot({path:join(directory,"curator-access-admin.png"),fullPage:true,animations:"disabled"});
  await page.getByRole("button",{name:"Cabut akses",exact:true}).click();
  await page.getByRole("dialog").getByRole("button",{name:"Cabut akses",exact:true}).click();
  await page.getByText("Dicabut",{exact:true}).waitFor();checks.push("Admin assignment and confirmed revocation UI work");
  await page.goto('http://127.0.0.1:43210/?mode=new');
  await page.getByLabel('Kata yang ingin dikontribusikan', { exact: true }).fill('Pengujian durasi');
  await page.getByRole('button', { name: 'Aktifkan kamera', exact: true }).click();
  await page.getByRole('button', { name: 'Mulai merekam', exact: true }).click();
  const stopRecording=page.getByRole('button', { name: 'Berhenti merekam', exact: true });
  await stopRecording.waitFor();
  assert.equal(await stopRecording.isDisabled(),true);
  await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(button=>button.textContent.includes('Berhenti merekam'))?.disabled);
  await page.screenshot({path:join(directory,'recorder-duration-3-7.png'),fullPage:true});
  await page.getByLabel('Pratinjau rekaman', { exact: true }).waitFor();
  checks.push('Recorder blocks early stop and automatically produces preview within 7 seconds');
  assert.deepEqual(errors,[]);
  await page.goto("http://127.0.0.1:43210/?mode=curator");await page.getByRole("table").waitFor();await page.evaluate(()=>document.documentElement.classList.add("dark"));
  await page.screenshot({path:join(directory,"curator-desktop-dark.png"),fullPage:true,animations:"disabled"});checks.push("Dark theme rendered");
  await writeFile(join(directory,"report.json"),JSON.stringify({kind:"synthetic-component-browser-qa",checks,errors,accounts_created:0,database_writes:0},null,2));
  console.log(JSON.stringify({passed:checks.length,errors:errors.length,screenshots:directory}));
  }
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
