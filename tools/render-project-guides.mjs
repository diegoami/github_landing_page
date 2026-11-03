// Offline output: Pages serves the checked-in HTML and images, not this tool.
// Maintenance requires Node/npm; the Markdown renderer is pinned and build-only.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const guides=JSON.parse(readFileSync(resolve(root,'guides/manifest.json'),'utf8'));
const npmCli=[process.env.npm_execpath,resolve(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),resolve(dirname(process.execPath),'../lib/node_modules/npm/bin/npm-cli.js')].find(p=>p&&existsSync(p));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const slug=s=>s.replace(/<[^>]*>/g,'').replaceAll('&#39;','').replaceAll('&amp;','and').toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu,'').trim().replace(/\s+/g,'-');

for(const guide of guides){
 const dir=resolve(root,'guides',guide.slug);
 const args=['exec','--yes','--package=marked@18.0.14','--','marked','--input',resolve(dir,'guide.md'),'--gfm'];
 let html=execFileSync(npmCli?process.execPath:'npm',npmCli?[npmCli,...args]:args,{encoding:'utf8',maxBuffer:4*1024*1024});
 const headingIds=new Map(),contents=[];
 html=html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g,(_all,level,title)=>{
  const base=slug(title),count=headingIds.get(base)||0;headingIds.set(base,count+1);const id=count?`${base}-${count}`:base;
  if(Number(level)<=3)contents.push(`<li class="level-${level}"><a href="#${id}">${title}</a></li>`);
  return `<h${level} id="${id}">${title}</h${level}>`;
 });
 const sourceUrl=`https://github.com/diegoami/${guide.sourceRepo}/blob/${guide.sourceRef}/${guide.sourcePath}`;
 html=html.replace(/\b(href|src)="([^"]*)"/g,(_all,attribute,value)=>{
  if(attribute==='src'&&!/^https?:/.test(value)){
   const local=guide.imageMap[value];if(!local||!existsSync(resolve(dir,local)))throw Error(`${guide.slug}: missing illustration ${value}`);
   return `src="${escape(local)}" loading="lazy"`;
  }
  if(/^(?:https?:|mailto:|#)/.test(value))return `${attribute}="${value}"`;
  const url=new URL(value,`https://source.invalid/${guide.sourcePath}`);
  const kind=url.pathname.endsWith('/')?'tree':'blob';
  return `${attribute}="https://github.com/diegoami/${guide.sourceRepo}/${kind}/${guide.sourceRef}${url.pathname}${url.hash}"`;
 });
 html=html.replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/g,(_all,img)=>{
  const src=/src="([^"]*)"/.exec(img)?.[1],alt=/alt="([^"]*)"/.exec(img)?.[1]||'';
  return `<figure><a href="${src}" target="_blank" rel="noopener">${img}</a><figcaption>${alt} <a href="${src}" target="_blank" rel="noopener">Open full size</a></figcaption></figure>`;
 });
 const actions=[guide.playUrl?`<a class="primary" href="${escape(guide.playUrl)}">Play in your browser</a>`:'',`<a href="${sourceUrl}">Source reference</a>`,`<a href="https://github.com/diegoami/${guide.sourceRepo}">Project</a>`].filter(Boolean).join('');
 const document=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(guide.title)} — diegoami</title><meta name="description" content="${escape(guide.summary)}"><link rel="stylesheet" href="../guide.css"></head>
<body><header class="hero"><div class="wrap"><a class="back" href="../../">← All projects</a><p class="eyebrow">${escape(guide.kind)}</p><h1>${escape(guide.title)}</h1><p class="lead">${escape(guide.summary)}</p><div class="actions">${actions}</div>${guide.notice?`<aside class="notice">${escape(guide.notice)}</aside>`:''}</div></header>
<main class="wrap"><nav class="contents" aria-label="On this page"><details><summary>Contents · ${contents.length} sections</summary><ol>${contents.join('')}</ol></details></nav><article class="prose">${html}</article></main>
<footer class="wrap"><p>Based on the linked project reference at source <code>${guide.sourceRef.slice(0,12)}</code>. The illustrations keep their stated version and context.</p><a href="../../">Back to the project portfolio</a></footer></body></html>\n`;
 writeFileSync(resolve(dir,'index.html'),document);
 console.log(`${guide.slug}: ${Object.keys(guide.imageMap).length} illustrations, ${contents.length} sections`);
}

const cards=guides.map(g=>`<article class="guide-card"><p class="eyebrow">${escape(g.kind)}</p><h2><a href="${g.slug}/">${escape(g.title)}</a></h2><p>${escape(g.summary)}</p><a href="${g.slug}/">${g.kind.includes('Design')?'View the illustrated design':'Read the illustrated guide'} →</a></article>`).join('');
writeFileSync(resolve(root,'guides/index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Illustrated guides and designs — diegoami</title><link rel="stylesheet" href="guide.css"></head><body><header class="hero"><div class="wrap"><a class="back" href="../">← All projects</a><p class="eyebrow">Guides and designs</p><h1>See how the projects work.</h1><p class="lead">Real game walkthroughs, a screen-by-screen design and a versioned native-game manual. Each page includes illustrations and its source context.</p></div></header><main class="wrap guide-grid">${cards}</main><footer class="wrap"><a href="../">Back to the project portfolio</a></footer></body></html>\n`);
