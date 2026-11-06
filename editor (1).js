/* سطر — محرر الكود + المشغّل الآمن (Sandbox) + عارض Markdown */
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- Markdown خفيف وآمن ---------- */
export function md(src){
  const blocks=[];let t=String(src||'').replace(/\r/g,'').replace(/```(\w*)\n([\s\S]*?)```/g,(_,l,c)=>{blocks.push({l:(l||'').toLowerCase(),c:c.replace(/\n$/,'')});return '\n@@B'+(blocks.length-1)+'@@\n'});
  const inl=s=>esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  const out=[];let list=null;const close=()=>{if(list){out.push('</'+list+'>');list=null}};
  for(const raw of t.split('\n')){const L=raw.trimEnd();let m;
    if(m=L.match(/^@@B(\d+)@@$/)){close();const b=blocks[+m[1]],lang=normLang(b.l);out.push(`<pre data-l="${esc(lang)}"><code>${hl(b.c,lang)}</code>${['js','python','html'].includes(lang)?'<button type="button" class="rn g" data-run>▶ جرّب</button>':''}</pre>`);continue}
    if(m=L.match(/^(#{1,3})\s+(.*)$/)){close();out.push(`<h${m[1].length+1}>${inl(m[2])}</h${m[1].length+1}>`);continue}
    if(m=L.match(/^\s*[-*]\s+(.*)$/)){if(list!='ul'){close();out.push('<ul>');list='ul'}out.push('<li>'+inl(m[1])+'</li>');continue}
    if(m=L.match(/^\s*\d+[.)]\s+(.*)$/)){if(list!='ol'){close();out.push('<ol>');list='ol'}out.push('<li>'+inl(m[1])+'</li>');continue}
    close();if(L.trim())out.push('<p>'+inl(L)+'</p>')}
  close();return out.join('')}
export const normLang=l=>({py:'python',python:'python',js:'js',javascript:'js',html:'html',css:'html',web:'html'}[(l||'').toLowerCase()]||'js');

/* ---------- تلوين الكود ---------- */
const KW={js:'const let var function return if else for while do break continue switch case default new class extends import export from async await try catch finally throw typeof instanceof in of null undefined true false this super static',python:'def return if elif else for while in not and or is None True False class import from as try except finally raise with lambda pass break continue global yield print input range len int str float list dict set tuple'};
export function hl(code,lang){lang=normLang(lang);const e=esc;
  if(lang=='html'){return String(code).replace(/<!--[\s\S]*?-->|<\/?[\w-]+|"[^"]*"|'[^']*'|\/?>|[\s\S]/g,t=>t.startsWith('<!--')?`<span class="tk-c">${e(t)}</span>`:/^<\/?[\w-]/.test(t)?`<span class="tk-t">${e(t)}</span>`:/^["']/.test(t)&&t.length>1?`<span class="tk-s">${e(t)}</span>`:t=='>'||t=='/>'?`<span class="tk-t">${e(t)}</span>`:e(t))}
  const kw=new Set(KW[lang].split(' ')),cm=lang=='python'?'#[^\\n]*':'\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/';
  const re=new RegExp('('+cm+')|("""[\\s\\S]*?"""|"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'|`(?:\\\\.|[^`\\\\])*`)|(\\b\\d+(?:\\.\\d+)?\\b)|([A-Za-z_]\\w*)(\\s*\\()?|([\\s\\S])','g');
  return String(code).replace(re,(m,c,s,n,w,p,o)=>c?`<span class="tk-c">${e(c)}</span>`:s?`<span class="tk-s">${e(s)}</span>`:n?`<span class="tk-n">${n}</span>`:w?(kw.has(w)?`<span class="tk-k">${w}</span>`+(p?e(p):''):p?`<span class="tk-f">${w}</span>${e(p)}`:w):e(o))}

/* ---------- المحرر ---------- */
const SYMS=['Tab','{','}','(',')','[',']','"',"'",';',':','=','<','>','/','#','+','-','*','_','.',',','!','&','|'];
export function editor(host,{lang='js',value='',readOnly=false,label,sym=true,onInput}={}){
  lang=normLang(lang);
  host.classList.add('ed');host.innerHTML=`<div class="bar2"><b class="lb"></b><span class="xb"></span></div><div class="wr"><div class="gt"></div><div class="cw"><pre aria-hidden="true"></pre><textarea spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" ${readOnly?'readonly':''}></textarea></div></div>${sym&&!readOnly?'<div class="sym">'+SYMS.map(s=>`<button type="button" data-s="${s}">${s}</button>`).join('')+'</div>':''}`;
  const ta=host.querySelector('textarea'),pre=host.querySelector('pre'),gt=host.querySelector('.gt'),wr=host.querySelector('.wr'),lb=host.querySelector('.lb');
  const names={python:'main.py',js:'script.js',html:'index.html'};lb.textContent=label||names[lang];
  const paint=()=>{const v=ta.value;pre.innerHTML=hl(v,lang)+'\n';const n=v.split('\n').length;gt.textContent=Array.from({length:n},(_,i)=>i+1).join('\n');ta.style.height='auto';ta.style.height=Math.max(ta.scrollHeight,150)+'px';pre.style.height=ta.style.height;ta.style.width='100%';const w=Math.max(wr.clientWidth-gt.offsetWidth,ta.scrollWidth);ta.style.width=w+'px';pre.style.width=w+'px'};
  const ins=(s,back=0)=>{const a=ta.selectionStart,b=ta.selectionEnd;ta.setRangeText(s,a,b,'end');if(back)ta.selectionStart=ta.selectionEnd=ta.selectionEnd-back;ta.dispatchEvent(new Event('input'));ta.focus()};
  ta.value=value;paint();
  ta.addEventListener('input',()=>{paint();onInput&&onInput(ta.value)});
  ta.addEventListener('keydown',e=>{if(readOnly)return;if(e.key=='Tab'){e.preventDefault();ins('  ')}else if(e.key=='Enter'){const v=ta.value,p=ta.selectionStart,ls=v.lastIndexOf('\n',p-1)+1,line=v.slice(ls,p),ind=(line.match(/^\s*/)||[''])[0],extra=/[{(\[:]\s*$/.test(line)?'  ':'';e.preventDefault();ins('\n'+ind+extra)}});
  host.addEventListener('click',e=>{const b=e.target.closest('[data-s]');if(!b)return;e.preventDefault();const s=b.dataset.s;if(s=='Tab')ins('  ');else{const pair={'{':'}','(':')','[':']','"':'"',"'":"'"}[s];pair?ins(s+pair,1):ins(s)}});
  new ResizeObserver(()=>paint()).observe(wr);
  return{get:()=>ta.value,set:v=>{ta.value=v;paint()},focus:()=>ta.focus(),bar:host.querySelector('.xb'),setLang:l=>{lang=normLang(l);lb.textContent=label||names[lang];paint()},el:ta}}

/* ---------- المشغّل الآمن ---------- */
const JSW=`
const AF=Object.getPrototypeOf(async function(){}).constructor;
const fmt=v=>{try{if(typeof v=='string')return v;if(v===undefined)return 'undefined';if(typeof v=='function')return String(v);return JSON.stringify(v)}catch(e){return String(v)}};
const same=(got,exp)=>{exp=String(exp).trim();if(String(got).trim()===exp||fmt(got)===exp)return true;try{return JSON.stringify(JSON.parse(exp))===JSON.stringify(got)}catch(e){return false}};
async function once(code,stdin){const out=[],lines=String(stdin||'').split('\\n');let li=0;const log=(...a)=>out.push(a.map(x=>typeof x=='string'?x:fmt(x)).join(' '));
 const con={log,info:log,warn:log,error:log,debug:log},prompt=()=>li<lines.length&&stdin!==undefined&&stdin!==''?lines[li++]:null,alert=log;
 const f=new AF('console','prompt','alert','input','fetch','XMLHttpRequest','WebSocket','importScripts','self',code+'\\n;return (s)=>eval(s);');
 const ev=await f(con,prompt,alert,prompt,undefined,undefined,undefined,undefined,undefined);return{out,ev}}
onmessage=async e=>{const m=e.data,res=[];let out='',err='';
 try{const r=await once(m.code,m.stdin);out=r.out.join('\\n');
  for(const t of m.tests||[]){const d=t.d||'';
   try{if(t.k=='call'){const v=await r.ev(t.a);res.push({ok:same(v,t.e),d,got:fmt(v),exp:t.e,h:t.h})}
   else if(t.k=='out'){const o=await once(m.code,t.i);const g=o.out.join('\\n').trim().split('\\n').map(x=>x.trimEnd()).join('\\n'),x=String(t.e).trim().split('\\n').map(x=>x.trimEnd()).join('\\n');res.push({ok:g===x,d,got:g,exp:t.e,h:t.h})}
   else if(t.k=='re'){res.push({ok:new RegExp(t.a,'m').test(m.code),d,h:1})}}
   catch(x){res.push({ok:false,d,got:'خطأ: '+(x&&x.message||x),exp:t.e,h:t.h})}}}
 catch(x){err=(x&&x.name?x.name+': ':'')+(x&&x.message||x)}
 postMessage({out,err,results:res})}`;
const PYW=`
let py=null,ready=null;
async function boot(){importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');py=await loadPyodide()}
const lastErr=m=>{const l=String(m).trim().split('\\n').filter(x=>x.trim()&&!/^[\\s^~]+$/.test(x)),last=l[l.length-1]||'خطأ';let ln='';for(const x of l){const q=x.match(/File "<exec>", line (\\d+)/);if(q)ln=q[1]}return (ln?'السطر '+ln+': ':'')+last};
async function exec(code,stdin){const out=[];const lines=stdin?String(stdin).split('\\n'):[];py.setStdout({batched:s=>out.push(s)});py.setStderr({batched:s=>out.push(s)});py.setStdin({stdin:()=>lines.length?lines.shift():undefined});const g=py.globals.get('dict')();py.runPython(code,{globals:g});return{out,g}}
const norm=s=>String(s).trim().split('\\n').map(x=>x.trimEnd()).join('\\n');
onmessage=async e=>{const m=e.data,res=[];let out='',err='';
 try{if(!py){postMessage({loading:1});await (ready=ready||boot())}
  try{const r=await exec(m.code,m.stdin);out=r.out.join('\\n');
   for(const t of m.tests||[]){const d=t.d||'';
    try{if(t.k=='call'){const rp=py.runPython('repr('+t.a+')',{globals:r.g}),st=py.runPython('str('+t.a+')',{globals:r.g}),x=norm(t.e);let ok=norm(rp)===x||norm(st)===x;if(!ok){try{ok=JSON.stringify(JSON.parse(x))===JSON.stringify(JSON.parse(String(st).replace(/'/g,'"').replace(/True/g,'true').replace(/False/g,'false').replace(/None/g,'null')))}catch(_){}}res.push({ok,d,got:rp,exp:t.e,h:t.h})}
    else if(t.k=='out'){const o=await exec(m.code,t.i);const g=norm(o.out.join('\\n'));res.push({ok:g===norm(t.e),d,got:g,exp:t.e,h:t.h})}
    else if(t.k=='re'){res.push({ok:new RegExp(t.a,'m').test(m.code),d,h:1})}}
    catch(x){res.push({ok:false,d,got:'خطأ: '+lastErr(x.message||x),exp:t.e,h:t.h})}}}
  catch(x){err=lastErr(x.message||x)}}
 catch(x){err='تعذّر تحميل مشغّل بايثون — تأكد من اتصال الإنترنت ثم أعد المحاولة'}
 postMessage({out,err,results:res})}`;
const HARNESS=`<!doctype html><meta charset=utf-8><script>
const SRC={js:${JSON.stringify(JSW)},python:${JSON.stringify(PYW)}},W={};let firstPy=true;
const post=o=>parent.postMessage(o,'*');
function mk(l){return new Worker(URL.createObjectURL(new Blob([SRC[l]],{type:'text/javascript'})))}
function html(m){const d=new DOMParser().parseFromString(m.code,'text/html'),res=[];
 for(const t of m.tests||[]){try{if(t.k=='has'){const el=d.querySelector(t.a);let ok=!!el;if(ok&&t.e)ok=(el.textContent||'').toLowerCase().includes(String(t.e).toLowerCase());res.push({ok,d:t.d||'',h:1})}
  else if(t.k=='re'){res.push({ok:new RegExp(t.a,'im').test(m.code),d:t.d||'',h:1})}}catch(x){res.push({ok:false,d:t.d||'',h:1})}}
 post({id:m.id,out:'',err:'',results:res})}
onmessage=e=>{const m=e.data;if(m.lang=='html')return html(m);
 let w=W[m.lang];if(!w)w=W[m.lang]=mk(m.lang);
 let ms=m.timeout||6000;if(m.lang=='python'&&firstPy)ms+=60000;let t=setTimeout(()=>{try{w.terminate()}catch(x){}delete W[m.lang];post({id:m.id,out:'',err:'⏱ انتهى الوقت: الكود استغرق وقتاً طويلاً (حلقة لا نهائية؟)',results:[]})},ms);
 w.onmessage=ev=>{if(ev.data.loading){return}clearTimeout(t);if(m.lang=='python')firstPy=false;post(Object.assign({id:m.id},ev.data))};
 w.onerror=ev=>{clearTimeout(t);post({id:m.id,out:'',err:String(ev.message||'خطأ'),results:[]})};
 w.postMessage(m)};
<\/script>`;
let frame=null,seq=0,fready=null;const pend={};
function ensure(){if(frame)return fready;frame=document.createElement('iframe');frame.setAttribute('sandbox','allow-scripts');frame.style.display='none';fready=new Promise(r=>frame.addEventListener('load',()=>setTimeout(r,30),{once:true}));frame.srcdoc=HARNESS;document.body.appendChild(frame);
  addEventListener('message',e=>{if(!frame||e.source!==frame.contentWindow)return;const d=e.data;if(d&&pend[d.id]){pend[d.id](d);delete pend[d.id]}});return fready}
export async function runCode({lang,code,tests=[],timeout=6000,stdin=''}){await ensure();lang=normLang(lang);const id=++seq;
  return new Promise(res=>{pend[id]=res;frame.contentWindow.postMessage({id,lang,code:String(code||'').slice(0,40000),tests,timeout,stdin},'*');
    setTimeout(()=>{if(pend[id]){delete pend[id];res({out:'',err:'تعذّر تشغيل الكود',results:[]})}},timeout+75000)})}

/* ---------- ملعب جاهز: محرر + تشغيل + مخرجات/معاينة ---------- */
export function playground(host,{lang='js',value='',tests=null,onResult,readOnly=false,autorun=false}={}){
  lang=normLang(lang);host.innerHTML='<div class="ed-h"></div>'+(lang!='html'&&!tests?'<input class="sin" placeholder="مدخلات البرنامج (اختياري): سطر لكل input" style="margin:0;border-radius:0;font-family:JetBrains Mono,monospace;direction:ltr">':'')+'<div class="out" hidden></div><div class="tres" hidden></div>';
  const eh=host.querySelector('.ed-h'),out=host.querySelector('.out'),tr=host.querySelector('.tres');
  const ed=editor(eh,{lang,value,readOnly});const init=value;
  const rb=document.createElement('button');rb.type='button';rb.className='p';rb.textContent='▶ تشغيل';ed.bar.appendChild(rb);
  const rs=document.createElement('button');rs.type='button';rs.textContent='↺';rs.title='إعادة';if(!readOnly)ed.bar.appendChild(rs);
  let pv=null;
  const run=async()=>{rb.disabled=true;rb.textContent='⏳';out.hidden=false;tr.hidden=true;
    if(lang=='html'){if(!pv){pv=document.createElement('iframe');pv.className='pv';pv.setAttribute('sandbox','allow-scripts');host.insertBefore(pv,out)}pv.srcdoc=ed.get();out.hidden=true}
    let r={out:'',err:'',results:[]};
    if(lang!='html'||(tests&&tests.length)){out.textContent='جارٍ التشغيل…';r=await runCode({lang,code:ed.get(),tests:tests||[],stdin:(host.querySelector('.sin')||{}).value||''});
      if(lang!='html'){out.innerHTML=(r.out?esc(r.out):'')+(r.err?`<div class="e">${esc(r.err)}</div>`:'')||'<span style="color:#6272a4">لا يوجد ناتج — استخدم '+(lang=='python'?'print()':'console.log()')+' لعرض النتيجة</span>'}else out.hidden=true}
    if(r.results&&r.results.length){tr.hidden=false;tr.innerHTML=r.results.map((t,i)=>`<div class="${t.ok?'p':'f'}">${t.ok?'✔':'✘'} ${esc(t.d||'اختبار '+(i+1))}${!t.ok&&!t.h&&t.got!==undefined?` — الناتج: ${esc(t.got)} / المتوقع: ${esc(t.exp)}`:''}</div>`).join('')}
    rb.disabled=false;rb.textContent='▶ تشغيل';onResult&&onResult(r);return r};
  rb.onclick=run;rs.onclick=()=>{ed.set(init)};if(autorun)run();
  return{ed,run,get:ed.get}}
