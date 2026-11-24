const $ = id => document.getElementById(id);
const canvas = $('designCanvas'), elementsLayer = $('canvasElements'), bgLayer = $('canvasBackground');
const state = {width:2,height:6,selected:null,elements:[],background:null,zoom:1,stream:null,countdown:false};
const DPI=300, SCALE=120; // editor pixels per inch; export renders at 300 DPI
let nextId=1, drag=null, toastTimer;

function notify(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2200)}
function dimensions(){canvas.style.width=(state.width*SCALE)+'px';canvas.style.height=(state.height*SCALE)+'px';$('canvasDimensions').textContent=`${state.width} × ${state.height} inches`; $('widthInput').value=state.width;$('heightInput').value=state.height;}
function makeElement(type,x,y,w,h,extra={}){return {id:nextId++,type,name:type==='photo'?'Photo frame':type==='text'?'Text':'Logo',x,y,w,h,rotation:0,text:'Your text here',fontSize:24,fontFamily:'Manrope',fontWeight:'800',color:'#242424',fill:'#e9e9ee',fit:'cover',src:null,...extra}}
function setTemplate(kind){
  state.elements=[];state.selected=null;
  const W=state.width*SCALE,H=state.height*SCALE;
  if(kind==='strip'){
    const margin=W*.12,gap=H*.025,fh=(H-margin*2-gap*3)/4;
    for(let i=0;i<4;i++)state.elements.push(makeElement('photo',margin,margin+i*(fh+gap),W-2*margin,fh));
    state.elements.push(makeElement('text',margin,H-margin*.8,W-2*margin,margin*.55,{text:'YOUR EVENT • 2026',fontSize:12,color:'#333',name:'Footer text'}));
  } else if(kind==='two'){
    const m=W*.07,g=W*.04,fw=(W-2*m-g)/2;
    state.elements.push(makeElement('photo',m,H*.18,fw,H*.62));
    state.elements.push(makeElement('photo',m+fw+g,H*.18,fw,H*.62));
    state.elements.push(makeElement('text',m,H*.04,W-2*m,H*.1,{text:'PHOTOBOOTH',fontSize:16,color:'#333'}));
  } else if(kind==='collage'){
    const m=W*.08,g=W*.04,fw=(W-2*m-g)/2,fh=(H-2*m-g)/2;
    [[m,m],[m+fw+g,m],[m,m+fh+g],[m+fw+g,m+fh+g]].forEach(([x,y])=>state.elements.push(makeElement('photo',x,y,fw,fh)));
  } else {
    state.elements.push(makeElement('photo',W*.08,H*.13,W*.84,H*.68));
    state.elements.push(makeElement('text',W*.08,H*.84,W*.84,H*.09,{text:'A MOMENT TO REMEMBER',fontSize:15,color:'#333'}));
  }
  render();$('saveState').textContent='Unsaved changes';
}
function render(){
  dimensions();elementsLayer.innerHTML='';
  state.elements.forEach(el=>{
    const node=document.createElement('div');node.className=`design-element ${el.type}-element ${state.selected===el.id?'selected':''}`;node.dataset.id=el.id;
    Object.assign(node.style,{left:el.x+'px',top:el.y+'px',width:el.w+'px',height:el.h+'px',transform:`rotate(${el.rotation||0}deg)`,zIndex:el.z||1});
    const content=document.createElement('div');content.className='element-content';
    if(el.type==='photo'){content.style.background=el.fill;if(el.src){const img=document.createElement('img');img.src=el.src;img.style.objectFit=el.fit||'cover';content.append(img)}else{content.textContent='PHOTO '+el.id;content.style.color='#9b9ba9';content.style.fontSize='11px';content.style.fontWeight='700'}}
    else if(el.type==='text'){content.textContent=el.text;content.style.color=el.color;content.style.fontSize=el.fontSize+'px';content.style.fontFamily=el.fontFamily||'Manrope';content.style.fontWeight=el.fontWeight||'800';content.style.textAlign='center';}
    else if(el.type==='image'){if(el.src){const img=document.createElement('img');img.src=el.src;img.style.objectFit='contain';content.append(img)}}
    node.append(content);const handle=document.createElement('div');handle.className='resize-handle';node.append(handle);
    node.addEventListener('pointerdown',e=>beginDrag(e,el.id, e.target===handle));elementsLayer.append(node);
  });
  bgLayer.style.backgroundColor=state.bgColor||'#ffffff';bgLayer.style.backgroundImage=state.background?`url("${state.background}")`:'none';
  updateProperties();
}
function beginDrag(e,id,resizing){e.preventDefault();e.stopPropagation();select(id);const el=state.elements.find(a=>a.id===id);drag={id,resizing,startX:e.clientX,startY:e.clientY,x:el.x,y:el.y,w:el.w,h:el.h};window.addEventListener('pointermove',moveDrag);window.addEventListener('pointerup',endDrag,{once:true})}
function moveDrag(e){if(!drag)return;const el=state.elements.find(a=>a.id===drag.id),dx=(e.clientX-drag.startX)/state.zoom,dy=(e.clientY-drag.startY)/state.zoom;if(drag.resizing){el.w=Math.max(20,drag.w+dx);el.h=Math.max(20,drag.h+dy)}else{el.x=Math.max(0,drag.x+dx);el.y=Math.max(0,drag.y+dy)}render()}
function endDrag(){drag=null;window.removeEventListener('pointermove',moveDrag);$('saveState').textContent='Unsaved changes'}
function select(id){state.selected=id;render()}
function selected(){return state.elements.find(e=>e.id===state.selected)}
function updateProperties(){
  const el=selected(),empty=!el;$('emptyProperties').classList.toggle('hidden',!empty);$('elementProperties').classList.toggle('hidden',empty);$('selectionTag').textContent=el?el.type.toUpperCase():'No selection';
  if(!el)return;
  $('propName').value=el.name||'';$('propX').value=Math.round(el.x);$('propY').value=Math.round(el.y);$('propW').value=Math.round(el.w);$('propH').value=Math.round(el.h);$('propRotation').value=el.rotation||0;
  $('textProperty').classList.toggle('hidden',el.type!=='text');$('photoProperty').classList.toggle('hidden',el.type!=='photo');
  if(el.type==='text'){$('propText').value=el.text;$('propTextColor').value=el.color;$('propFontSize').value=el.fontSize;$('propFontFamily').value=el.fontFamily||'Manrope';$('propFontWeight').value=el.fontWeight||'800'}
  if(el.type==='photo'){$('propFill').value=el.fill;$('propFit').value=el.fit||'cover'}
}
function updateSelected(key,value){const el=selected();if(!el)return;el[key]=value;render();$('saveState').textContent='Unsaved changes'}
function bindValue(id,key,convert=v=>v){$(id).addEventListener('input',e=>updateSelected(key,convert(e.target.value)))}
['propName','propX','propY','propW','propH','propRotation','propText','propTextColor','propFontSize','propFontFamily','propFontWeight','propFill','propFit'].forEach(id=>{
 const map={propName:'name',propX:'x',propY:'y',propW:'w',propH:'h',propRotation:'rotation',propText:'text',propTextColor:'color',propFontSize:'fontSize',propFontFamily:'fontFamily',propFontWeight:'fontWeight',propFill:'fill',propFit:'fit'};
 const numeric=['propX','propY','propW','propH','propRotation','propFontSize'];
 bindValue(id,map[id],v=>numeric.includes(id)?Number(v):v);
});
$('formatSelect').addEventListener('change',e=>{if(e.target.value==='2x6'){state.width=2;state.height=6}else if(e.target.value==='4x6'){state.width=4;state.height=6}else{$('widthInput').focus();return}setTemplate('strip')});
function setSize(){state.width=Math.max(1,Math.min(12,Number($('widthInput').value)||2));state.height=Math.max(1,Math.min(18,Number($('heightInput').value)||6));$('formatSelect').value=(state.width===2&&state.height===6)?'2x6':(state.width===4&&state.height===6)?'4x6':'custom';setTemplate('strip')}
$('widthInput').addEventListener('change',setSize);$('heightInput').addEventListener('change',setSize);
document.querySelectorAll('[data-template]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-template]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');setTemplate(btn.dataset.template)}));
$('addPhotoBtn').onclick=()=>{const el=makeElement('photo',30,30,state.width*SCALE*.7,state.height*SCALE*.15);state.elements.push(el);select(el.id)};
$('addTextBtn').onclick=()=>{const el=makeElement('text',20,20,state.width*SCALE*.8,50);state.elements.push(el);select(el.id)};
$('duplicateBtn').onclick=()=>{const el=selected();if(!el)return;const copy={...el,id:nextId++,x:el.x+12,y:el.y+12,name:el.name+' copy'};state.elements.push(copy);select(copy.id)};
$('deleteBtn').onclick=()=>{state.elements=state.elements.filter(e=>e.id!==state.selected);state.selected=null;render()};
$('bgColor').oninput=e=>{state.bgColor=e.target.value;render()};
$('clearBackgroundBtn').onclick=()=>{state.background=null;render()};
function readImage(file,cb){if(!file)return;const r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(file)}
$('backgroundUpload').onchange=e=>readImage(e.target.files[0],src=>{state.background=src;render();notify('Background added')});
$('logoUpload').onchange=e=>readImage(e.target.files[0],src=>{const el=makeElement('image',20,20,state.width*SCALE*.35,state.width*SCALE*.2,{src,name:'Logo / overlay'});state.elements.push(el);select(el.id);notify('Image added')});
$('photoUpload').onchange=e=>readImage(e.target.files[0],src=>{const el=selected();if(el){el.src=src;render();notify('Photo added to frame')}});
$('canvasElements').addEventListener('pointerdown',e=>{if(e.target===elementsLayer){state.selected=null;render()}});
$('newTemplateBtn').onclick=()=>{if(confirm('Start a new design? Unsaved changes will be lost.')){state.background=null;state.bgColor='#ffffff';setTemplate('strip')}};
function snapshot(){return {width:state.width,height:state.height,bgColor:state.bgColor||'#ffffff',background:state.background,elements:state.elements}}
function save(){const name=prompt('Name this template:',`My ${state.width}x${state.height} design`);if(!name)return;const all=JSON.parse(localStorage.getItem('ctrlziTemplates')||'[]');all.push({name,created:new Date().toISOString(),data:snapshot()});localStorage.setItem('ctrlziTemplates',JSON.stringify(all));renderSaved();$('saveState').textContent='Saved';notify('Template saved on this device')}
$('saveBtn').onclick=save;
function renderSaved(){const all=JSON.parse(localStorage.getItem('ctrlziTemplates')||'[]'),wrap=$('savedTemplates');wrap.innerHTML='';if(!all.length){wrap.innerHTML='<p class="empty">No saved templates yet.</p>';return}all.forEach((t,i)=>{const row=document.createElement('div');row.className='saved-item';const name=document.createElement('span');name.textContent=t.name;const load=document.createElement('button');load.textContent='Load';load.onclick=()=>{Object.assign(state,{...t.data,selected:null});render();notify('Template loaded')};const del=document.createElement('button');del.textContent='×';del.title='Delete';del.onclick=()=>{all.splice(i,1);localStorage.setItem('ctrlziTemplates',JSON.stringify(all));renderSaved()};row.append(name,load,del);wrap.append(row)})}
function drawImageCover(ctx,img,x,y,w,h,fit='cover'){if(fit==='contain'){const s=Math.min(w/img.width,h/img.height),nw=img.width*s,nh=img.height*s;ctx.drawImage(img,x+(w-nw)/2,y+(h-nh)/2,nw,nh)}else{const scale=Math.max(w/img.width,h/img.height),sw=w/scale,sh=h/scale,sx=(img.width-sw)/2,sy=(img.height-sh)/2;ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h)}}
async function imageFrom(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src})}
async function renderExport(){
 const out=document.createElement('canvas');out.width=Math.round(state.width*DPI);out.height=Math.round(state.height*DPI);const ctx=out.getContext('2d');ctx.fillStyle=state.bgColor||'#fff';ctx.fillRect(0,0,out.width,out.height);
 if(state.background){try{const bg=await imageFrom(state.background);drawImageCover(ctx,bg,0,0,out.width,out.height)}catch{}}
 const scale=DPI/SCALE;
 for(const el of state.elements){ctx.save();const x=el.x*scale,y=el.y*scale,w=el.w*scale,h=el.h*scale;ctx.translate((x+w/2),(y+h/2));ctx.rotate((el.rotation||0)*Math.PI/180);const left=-w/2,top=-h/2;
  if(el.type==='photo'){ctx.fillStyle=el.fill||'#e9e9ee';ctx.fillRect(left,top,w,h);if(el.src){try{const im=await imageFrom(el.src);drawImageCover(ctx,im,left,top,w,h,el.fit)}catch{}}}
  else if(el.type==='text'){ctx.fillStyle=el.color||'#222';ctx.font=`${el.fontWeight||'800'} ${Math.max(8,el.fontSize*scale)}px "${el.fontFamily||'Manrope'}", Arial`;ctx.textAlign='center';ctx.textBaseline='middle';const lines=String(el.text||'').split('\n');const lineH=Math.max(10,el.fontSize*scale*1.15);lines.forEach((line,i)=>ctx.fillText(line,0,(i-(lines.length-1)/2)*lineH,w))}
  else if(el.type==='image'&&el.src){try{const im=await imageFrom(el.src);drawImageCover(ctx,im,left,top,w,h,'contain')}catch{}}
  ctx.restore();
 }
 return out;
}
$('exportBtn').onclick=async()=>{try{const out=await renderExport();const a=document.createElement('a');a.download=`ctrlzi-photobooth-${state.width}x${state.height}.png`;a.href=out.toDataURL('image/png');a.click();notify('Print-ready PNG exported')}catch(e){console.error(e);notify('Could not export image')}};
$('zoomIn').onclick=()=>setZoom(state.zoom+.1);$('zoomOut').onclick=()=>setZoom(state.zoom-.1);$('fitBtn').onclick=()=>setZoom(1);
function setZoom(z){state.zoom=Math.max(.4,Math.min(1.5,z));$('canvasWrap').style.transform=`scale(${state.zoom})`;$('zoomLabel').textContent=Math.round(state.zoom*100)+'%'}
async function startCamera(){try{state.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});$('cameraVideo').srcObject=state.stream;$('cameraStatus').textContent='LIVE';$('cameraStatus').classList.add('on');$('startCameraBtn').disabled=true;$('captureBtn').disabled=false;$('stopCameraBtn').disabled=false;$('cameraMessage').textContent='Camera ready. Capture adds the image to a new photo frame.'}catch(e){notify('Camera unavailable. Allow camera access and use localhost or HTTPS.');$('cameraMessage').textContent='Camera permission was denied or no camera was found.'}}
function stopCamera(){if(state.stream)state.stream.getTracks().forEach(t=>t.stop());state.stream=null;$('cameraVideo').srcObject=null;$('cameraStatus').textContent='OFFLINE';$('cameraStatus').classList.remove('on');$('startCameraBtn').disabled=false;$('captureBtn').disabled=true;$('stopCameraBtn').disabled=true}
$('startCameraBtn').onclick=startCamera;$('stopCameraBtn').onclick=stopCamera;
$('captureBtn').onclick=async()=>{const video=$('cameraVideo');if(!video.videoWidth)return;const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);const src=c.toDataURL('image/jpeg',.92);const el=state.elements.find(e=>e.id===state.selected&&e.type==='photo');if(el){el.src=src;render()}else{const frame=makeElement('photo',20,20,state.width*SCALE*.8,state.height*SCALE*.2,{src});state.elements.push(frame);select(frame.id)}notify('Photo captured')};
$('countdownBtn').onclick=async()=>{if(!$('captureBtn').disabled){$('captureBtn').disabled=true;for(let i=3;i>0;i--){$('cameraMessage').textContent=`Capturing in ${i}…`;await new Promise(r=>setTimeout(r,1000))}$('captureBtn').disabled=false;$('captureBtn').click();$('cameraMessage').textContent='Photo captured.'}else notify('Start the camera first')};
canvas.addEventListener('pointerdown',e=>{if(e.target===canvas||e.target===bgLayer){state.selected=null;render()}});
setTemplate('strip');renderSaved();