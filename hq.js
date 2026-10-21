const T=24,MW=53,MH=31,cv=document.getElementById('c'),x=cv.getContext('2d');
let st=null,sel='tile',ox=0,oy=0,tick=0;
let SC=1;function rs(){cv.width=innerWidth;cv.height=innerHeight;SC=Math.min(innerWidth/(MW*T),(innerHeight-40)/(MH*T));ox=Math.floor((innerWidth/SC-MW*T)/2);oy=Math.floor(((innerHeight-40)/SC-MH*T)/2)+40/SC}
addEventListener('resize',rs);rs();
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const sh=(c,a)=>{const n=parseInt(c.slice(1),16);let r=(n>>16)+a,g=(n>>8&255)+a,b=(n&255)+a;r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b));return`rgb(${r},${g},${b})`};
// ---------- map ----------
const ROOMS=[
 {n:'COMMAND',x:3,y:3,w:15,h:12,f:'steel',door:[10,14]},
 {n:'STUDIO',x:19,y:3,w:15,h:12,f:'wood',door:[26,14]},
 {n:'INBOX BAY',x:35,y:3,w:15,h:12,f:'carpetB',door:[42,14]},
 {n:'RESEARCH LAB',x:3,y:16,w:15,h:12,f:'white',door:[10,16]},
 {n:'FACTORY',x:19,y:16,w:15,h:12,f:'concrete',door:[26,16]},
 {n:'WAR ROOM',x:35,y:16,w:15,h:12,f:'carpetR',door:[42,16]}];
const R=Object.fromEntries(ROOMS.map(r=>[r.n,r]));
const FL={steel:['#6d7278',1],wood:['#8a6a46',2],carpetB:['#4c5a6a',3],white:['#a9aca6',1],concrete:['#7b766c',4],carpetR:['#6e3b36',3]};
// furniture: [type,x,y,w,h,(rot)]
const FURN=[
 ['console',5,4,4,1],['desk',11,4,3,2],['desk',14,4,3,2],['rug',7,8,5,4],['plant',4,12,1,1],['lamp',16,12,1,1],['table',8,9,3,2],['lamp',4,4,1,1],
 ['easel',21,5,2,2],['drawtable',25,4,4,2],['shelf',30,4,3,1],['rug',23,9,6,4],['plant',32,12,1,1],['lamp',20,12,1,1],['desk',29,8,3,2],
 ['mail',37,4,4,1],['mail',42,4,4,1],['sorter',39,8,5,2],['plant',48,4,1,1],['lamp',36,12,1,1],['bench',45,10,3,1],
 ['shelf',5,17,4,1],['shelf',10,17,4,1],['desk',5,21,3,2],['desk',11,21,3,2],['plant',16,26,1,1],['lamp',4,26,1,1],['lamp',16,17,1,1],['bench',13,25,2,1],
 ['press',21,18,4,3],['conveyor',25,22,8,1],['crates',30,18,3,2],['lamp',20,26,1,1],['crates',21,25,2,2],
 ['wartable',39,20,6,4],['screen',38,17,7,1],['plant',48,26,1,1],['lamp',36,17,1,1],['chair',38,22,1,1],['chair',45,22,1,1]];
// workstations: room,spot tile, activity icon
const WS={console:['COMMAND',7,5.6,'⌨'],cdesk:['COMMAND',12,6.4,'✎'],ctable:['COMMAND',9.5,11.3,'☕'],
 mail:['INBOX BAY',39,5.6,'✉'],mail2:['INBOX BAY',44,5.6,'✉'],sorter:['INBOX BAY',41.5,10.6,'✉'],
 easel:['STUDIO',22,7.4,'🎨'],draw:['STUDIO',27,6.4,'✎'],sdesk:['STUDIO',30.5,10.4,'⌨'],sshelf:['STUDIO',31.5,5.6,'📖'],
 lshelf:['RESEARCH LAB',7,18.6,'📖'],lshelf2:['RESEARCH LAB',12,18.6,'📖'],ldesk:['RESEARCH LAB',6.5,23.4,'⌨'],ldesk2:['RESEARCH LAB',12.5,23.4,'🔍'],
 press:['FACTORY',23,21.6,'⚙'],conv:['FACTORY',29,23.6,'📦'],war:['WAR ROOM',42,24.6,'⚑']};
// ---------- static render ----------
const bg=document.createElement('canvas');bg.width=MW*T;bg.height=MH*T;const b=bg.getContext('2d');
function px(c,X,Y,w,h,col){c.fillStyle=col;c.fillRect(X,Y,w,h)}
function ground(){for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){const X=tx*T,Y=ty*T,path=ty==15||tx==18||tx==34||ty==28&&tx>2&&tx<50;
 const base=path?'#6b5a42':(rnd()<.12?'#56693a':'#4f6436');px(b,X,Y,T,T,base);
 for(let i=0;i<10;i++)px(b,X+rnd()*T|0,Y+rnd()*T|0,2,path?2:3,path?(rnd()<.5?'#5d4e39':'#7a6850'):(rnd()<.5?'#5d7642':'#44582f'))}}
function floorTile(X,Y,k){const[c,t]=FL[k];px(b,X,Y,T,T,c);
 if(t==1){px(b,X,Y,T,1,sh(c,25));px(b,X,Y,1,T,sh(c,20));px(b,X,Y+T-1,T,1,sh(c,-30));px(b,X+T-1,Y,1,T,sh(c,-25));px(b,X+4,Y+4,2,2,sh(c,-20));px(b,X+T-6,Y+T-6,2,2,sh(c,-20))}
 else if(t==2){for(let i=0;i<4;i++){px(b,X,Y+i*6,T,6,sh(c,(rnd()*20-10)|0));px(b,X,Y+i*6+5,T,1,sh(c,-35));px(b,X+((rnd()*T)|0),Y+i*6,1,5,sh(c,-30))}}
 else if(t==3){for(let i=0;i<14;i++)px(b,X+rnd()*T|0,Y+rnd()*T|0,2,2,sh(c,(rnd()*24-12)|0))}
 else{for(let i=0;i<8;i++)px(b,X+rnd()*T|0,Y+rnd()*T|0,2,2,sh(c,(rnd()*20-10)|0));px(b,X,Y,T,1,sh(c,-15))}}
function wall(tx,ty){const X=tx*T,Y=ty*T;px(b,X,Y,T,T,'#3a3631');px(b,X+2,Y+2,T-4,T-4,'#4a453e');px(b,X+2,Y+2,T-4,3,'#5a554c');px(b,X+2,Y+T-5,T-4,3,'#2e2b27')}
function door(tx,ty){const X=tx*T,Y=ty*T;px(b,X,Y,T,T,'#3a3631');px(b,X+2,Y+6,T-4,T-12,'#8a6f4a');px(b,X+2,Y+11,T-4,2,'#5e4a30');px(b,X+T/2-1,Y+6,2,T-12,'#5e4a30')}
function shadow(c,X,Y,w,h){c.fillStyle='rgba(0,0,0,.28)';c.fillRect(X+4,Y+5,w,h)}
function furn(f){const[k,tx,ty,tw,th]=f,X=tx*T,Y=ty*T,W=tw*T,H=th*T,c=b;
 if(k!='rug')shadow(c,X,Y,W,H);
 const box=(col)=>{px(c,X+1,Y+1,W-2,H-2,sh(col,-40));px(c,X+2,Y+2,W-4,H-5,col);px(c,X+2,Y+2,W-4,2,sh(col,30))};
 switch(k){
 case 'rug':px(c,X,Y,W,H,'#7a5a3a');px(c,X+4,Y+4,W-8,H-8,'#9b4a3a');px(c,X+10,Y+10,W-20,H-20,'#b8875a');px(c,X+14,Y+14,W-28,H-28,'#9b4a3a');break;
 case 'desk':box('#7a5636');px(c,X+6,Y+6,20,13,'#222');px(c,X+8,Y+8,16,9,'#4fb3c8');px(c,X+14,Y+19,4,3,'#222');px(c,X+32,Y+12,22,8,'#ccc');px(c,X+33,Y+13,20,1,'#999');px(c,X+W/2-6,Y+H-2,12,8,'#3d3a36');break;
 case 'console':box('#4c5258');for(let i=0;i<4;i++){px(c,X+6+i*23,Y+4,18,12,'#1a1d20');px(c,X+8+i*23,Y+6,14,8,['#5ec46a','#4fb3c8','#e0b84a','#c86a4f'][i])}break;
 case 'table':box('#6d4c2e');px(c,X+20,Y+14,10,10,'#ddd');px(c,X+46,Y+20,8,8,'#c9b07a');break;
 case 'shelf':box('#5e4026');for(let i=4;i<W-6;i+=5)px(c,X+i,Y+5,4,13,['#a23b3b','#3b6aa2','#c9a24a','#3b8a5a','#7a4aa2'][(i/5|0)%5]);break;
 case 'easel':px(c,X+10,Y+4,28,36,'#6d4c2e');px(c,X+13,Y+7,22,26,'#f2ead8');px(c,X+16,Y+12,8,8,'#7ddcc0');px(c,X+24,Y+18,8,9,'#e88a3a');px(c,X+18,Y+24,10,4,'#c8608a');break;
 case 'drawtable':box('#8a6a46');px(c,X+8,Y+6,38,30,'#f4efe2');for(let i=0;i<5;i++)px(c,X+12+i*7,Y+10+(i%2)*8,6,6,['#7ddcc0','#e88a3a','#6a8ad8','#d8c06a','#c8608a'][i]);px(c,X+60,Y+10,20,4,'#333');break;
 case 'mail':box('#6b5236');for(let i=0;i<W-8;i+=12){px(c,X+5+i,Y+5,10,12,'#3d2c1c');px(c,X+6+i,Y+9,8,6,rnd()<.6?'#e8e0c8':'#3d2c1c')}break;
 case 'sorter':box('#5a6068');for(let i=0;i<6;i++)px(c,X+8+i*18,Y+10,12,8,'#e8e0c8');px(c,X+6,Y+30,W-12,4,'#3a3f45');break;
 case 'bench':box('#6d4c2e');break;
 case 'chair':px(c,X+4,Y+4,16,16,'#3d3a36');px(c,X+6,Y+6,12,12,'#6b5a4a');break;
 case 'press':box('#4a4f55');px(c,X+10,Y+10,W-20,H-20,'#2f3338');px(c,X+20,Y+20,W-40,10,'#a8a8a0');px(c,X+16,Y+44,W-32,12,'#7a7f86');px(c,X+W-14,Y+6,8,8,'#d84a3a');break;
 case 'conveyor':px(c,X,Y+2,W,H-4,'#2a2c2e');for(let i=0;i<W;i+=8)px(c,X+i,Y+4,2,H-8,'#45484c');break;
 case 'crates':for(let i=0;i<tw;i++)for(let j=0;j<th;j++){const a=X+i*T,bb=Y+j*T;px(c,a+1,bb+1,T-2,T-2,'#7a5a32');px(c,a+3,bb+3,T-6,T-6,'#9a7444');px(c,a+3,bb+T/2-1,T-6,2,'#6a4a28')}break;
 case 'wartable':box('#4a3a2c');px(c,X+8,Y+8,W-16,H-16,'#3e5a3a');for(let i=0;i<9;i++)px(c,X+12+rnd()*(W-30)|0,Y+12+rnd()*(H-30)|0,8,6,'#6a8a52');px(c,X+40,Y+30,6,6,'#d84a3a');px(c,X+90,Y+50,6,6,'#4a7ad8');break;
 case 'screen':box('#2a2c30');px(c,X+6,Y+4,W-12,14,'#1e3a4a');for(let i=0;i<8;i++)px(c,X+10+i*19,Y+8+(i%3)*3,12,3,'#5ec4d8');break;
 case 'plant':px(c,X+6,Y+12,12,10,'#8a5a3a');for(let i=0;i<7;i++)px(c,X+2+rnd()*14|0,Y+rnd()*12|0,7,7,rnd()<.5?'#4a8a3a':'#3a6e2e');break;
 case 'lamp':px(c,X+9,Y+9,6,6,'#f0d890');px(c,X+7,Y+7,10,2,'#555');break;}}
function tree(tx,ty){const X=tx*T+12,Y=ty*T+12;b.fillStyle='rgba(0,0,0,.3)';b.beginPath();b.ellipse(X+6,Y+8,20,13,0,0,7);b.fill();
 [['#2c4f26',18,0,0],['#3a6630',14,-3,-3],['#4a7a3a',9,-6,-6],['#5c8c46',4,-8,-8]].forEach(([c,r,dx,dy])=>{b.fillStyle=c;b.beginPath();b.arc(X+dx,Y+dy,r,0,7);b.fill()});
 for(let i=0;i<10;i++)px(b,X-14+rnd()*26|0,Y-14+rnd()*26|0,3,3,rnd()<.5?'#2c4f26':'#5c8c46')}
function rock(tx,ty){const X=tx*T,Y=ty*T;shadow(b,X+4,Y+6,16,12);px(b,X+4,Y+6,16,12,'#7a7670');px(b,X+6,Y+7,10,4,'#9a968e')}
function build(){ground();for(let i=0;i<120;i++){const X=rnd()*MW*T|0,Y=rnd()*MH*T|0;px(b,X,Y,2,2,['#d8c860','#e8e0d0','#c87a8a','#3f5229'][i%4])}
 for(const r of ROOMS){for(let ty=r.y;ty<r.y+r.h;ty++)for(let tx=r.x;tx<r.x+r.w;tx++){const edge=tx==r.x||ty==r.y||tx==r.x+r.w-1||ty==r.y+r.h-1;
  if(!edge)floorTile(tx*T,ty*T,r.f)}}
 FURN.forEach(furn);for(const r of ROOMS){b.fillStyle='rgba(255,200,120,.05)';b.fillRect((r.x+1)*T,(r.y+1)*T,(r.w-2)*T,(r.h-2)*T)}
 for(const r of ROOMS){b.fillStyle='rgba(0,0,0,.35)';b.fillRect((r.x+1)*T,(r.y+1)*T,(r.w-2)*T,6);b.fillRect((r.x+1)*T,(r.y+1)*T,6,(r.h-2)*T);
  for(let ty=r.y;ty<r.y+r.h;ty++)for(let tx=r.x;tx<r.x+r.w;tx++)if(tx==r.x||ty==r.y||tx==r.x+r.w-1||ty==r.y+r.h-1){(tx==r.door[0]&&ty==r.door[1])?door(tx,ty):wall(tx,ty)}
  b.font='bold 11px Verdana';const w=b.measureText(r.n).width;b.fillStyle='rgba(0,0,0,.45)';b.fillRect((r.x+1)*T+4,(r.y+r.h-1)*T-20,w+10,16);b.fillStyle='#e8dfc6';b.fillText(r.n,(r.x+1)*T+9,(r.y+r.h-1)*T-8)}
 [[1,1],[0,8],[1,20],[51,2],[52,12],[51,24],[17,29],[30,29],[45,29],[8,0],[25,0],[44,0],[1,29]].forEach(([a,c])=>tree(a,c));
 [[2,14],[50,15],[33,29],[12,29],[52,6],[38,0]].forEach(([a,c])=>rock(a,c))}
build();
const NM={console:'comms console',cdesk:'command desk',ctable:'briefing table',mail:'mail shelves',mail2:'mail shelves',sorter:'mail sorter',easel:'easel',draw:'drawing table',sdesk:'studio desk',sshelf:'reference shelf',lshelf:'research shelves',lshelf2:'research shelves',ldesk:'research terminal',ldesk2:'research terminal',press:'printing press',conv:'conveyor',war:'war table'};
const LAMPS=FURN.filter(f=>f[0]=='lamp').map(f=>[f[1]*T+12,f[2]*T+12]).concat(FURN.filter(f=>['console','screen','desk'].includes(f[0])).map(f=>[f[1]*T+f[3]*T/2,f[2]*T+20]));
// ---------- pawns ----------
const P=[{id:'goji',name:'Goji',home:'COMMAND',outfit:'#e8762a',skin:'#f0b98a',hair:'#d85a1a',x:9*T,y:9*T,path:[],wait:60,cur:null},
 {id:'tile',name:'Tile',home:'STUDIO',outfit:'#6fd8b4',skin:'#e8c4a0',hair:'#2f7a64',x:26*T,y:8*T,path:[],wait:30,cur:null}];
function plan(p){const a=st&&st.agents[p.id],task=(a&&a.task||'').toLowerCase();
 if(p.id=='goji')return a&&a.state=='working'?['mail','sorter','console','cdesk']:['console','cdesk','ctable','mail'];
 if(task.includes('book')||task.includes('produc'))return['press','conv','draw','easel'];
 return['sdesk','lshelf','ldesk','sshelf','lshelf2','ldesk2','draw']}
function roomOf(px_,py_){return ROOMS.find(r=>px_>=r.x*T&&px_<(r.x+r.w)*T&&py_>=r.y*T&&py_<(r.y+r.h)*T)}
function route(p,k){const[rn,sx,sy,ic]=WS[k],to=R[rn],from=roomOf(p.x,p.y)||to,pts=[];
 if(from!==to){const d1=from.door,d2=to.door,in1=d1[1]==14?-1:1,in2=d2[1]==14?-1:1;
  pts.push([d1[0]*T+12,(d1[1]+in1)*T+12],[d1[0]*T+12,15*T+12],[d2[0]*T+12,15*T+12],[d2[0]*T+12,(d2[1]+in2)*T+12])}
 pts.push([sx*T+12,sy*T]);p.path=pts;p.cur=k}
function step(p){if(p.wait>0){p.wait--;return}
 if(!p.path.length){const opts=plan(p).filter(k=>k!=p.cur);route(p,opts[(Math.random()*opts.length)|0]);return}
 const[tx,ty]=p.path[0],dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy),sp=1.3;
 if(d<sp){p.x=tx;p.y=ty;p.path.shift();if(!p.path.length)p.wait=200+Math.random()*250}else{p.x+=dx/d*sp;p.y+=dy/d*sp;p.face=dx}}
function pawn(p,X0,Y0){x.save();x.translate(X0,Y0);x.scale(1.35,1.35);const X=0,Y=0;const working=p.wait>0&&!p.path.length&&p.cur,bob=working?Math.round(Math.sin(tick/6)):(p.path.length?Math.round(Math.abs(Math.sin(tick/5))*-2):0);
 x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.ellipse(X,Y+11,9,4,0,0,7);x.fill();
 x.fillStyle=sh(p.outfit,-50);x.beginPath();x.ellipse(X,Y+3+bob,9,8,0,0,7);x.fill();x.fillStyle=p.outfit;x.beginPath();x.ellipse(X,Y+2+bob,8,7,0,0,7);x.fill();
 if(working){const s=Math.sin(tick/4)*3;x.fillStyle=p.skin;x.fillRect(X-10,Y-1+s,4,4);x.fillRect(X+6,Y-1-s,4,4)}
 x.fillStyle=sh(p.skin,-40);x.beginPath();x.arc(X,Y-7+bob,7.5,0,7);x.fill();x.fillStyle=p.skin;x.beginPath();x.arc(X,Y-7+bob,6.5,0,7);x.fill();
 x.fillStyle=p.hair;x.beginPath();x.arc(X,Y-9+bob,6.5,Math.PI,0);x.fill();
 x.fillStyle='#222';const f=(p.face||0)>0?1:(p.face||0)<0?-1:0;x.fillRect(X-3+f*2,Y-7+bob,2,2);x.fillRect(X+2+f*2,Y-7+bob,2,2);
 if(sel==p.id){x.strokeStyle='#f0e08a';x.lineWidth=1.5;const s=13;[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,c])=>{x.beginPath();x.moveTo(X+a*s,Y-4+c*s-c*5);x.lineTo(X+a*s,Y-4+c*s);x.lineTo(X+a*s-a*5,Y-4+c*s);x.stroke()})}
 x.font='11px Verdana';const w=x.measureText(p.name).width;x.fillStyle='rgba(0,0,0,.55)';x.fillRect(X-w/2-3,Y+14,w+6,14);x.fillStyle='#fff';x.fillText(p.name,X-w/2,Y+25);
 if(working){const ic=WS[p.cur][3];x.fillStyle='rgba(245,240,225,.95)';x.beginPath();x.roundRect(X+6,Y-34,22,18,5);x.fill();x.beginPath();x.moveTo(X+9,Y-17);x.lineTo(X+6,Y-12);x.lineTo(X+14,Y-17);x.fill();
  x.font='12px sans-serif';x.fillStyle='#333';x.fillText(ic,X+10,Y-20)}
 x.restore();p.hit=[(X0-19)*SC,(Y0-25)*SC,38*SC,62*SC]}
function draw(){tick++;P.forEach(step);x.setTransform(1,0,0,1,0,0);x.fillStyle='#1b1a16';x.fillRect(0,0,cv.width,cv.height);x.setTransform(SC,0,0,SC,0,0);x.imageSmoothingEnabled=false;x.drawImage(bg,ox,oy);
 x.save();x.globalCompositeOperation='lighter';for(const[lx,ly]of LAMPS){const g=x.createRadialGradient(ox+lx,oy+ly,2,ox+lx,oy+ly,80);const a=.2+.03*Math.sin(tick/30+lx);g.addColorStop(0,`rgba(255,210,140,${a})`);g.addColorStop(1,'rgba(255,210,140,0)');x.fillStyle=g;x.fillRect(ox+lx-95,oy+ly-95,190,190)}x.restore();
 [...P].sort((a,c)=>a.y-c.y).forEach(p=>pawn(p,ox+p.x,oy+p.y));
 x.setTransform(1,0,0,1,0,0);const v=x.createRadialGradient(cv.width/2,cv.height/2,cv.height*.45,cv.width/2,cv.height/2,cv.width*.75);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.45)');x.fillStyle=v;x.fillRect(0,0,cv.width,cv.height);
 if(tick%15==0)info();requestAnimationFrame(draw)}
// ---------- UI ----------
function portrait(p){const c=document.createElement('canvas');c.width=44;c.height=44;const g=c.getContext('2d');g.fillStyle='#3a362e';g.fillRect(0,0,44,44);
 g.fillStyle=p.outfit;g.beginPath();g.ellipse(22,44,16,12,0,0,7);g.fill();g.fillStyle=p.skin;g.beginPath();g.arc(22,20,12,0,7);g.fill();g.fillStyle=p.hair;g.beginPath();g.arc(22,16,12,Math.PI,0);g.fill();
 g.fillStyle='#222';g.fillRect(16,20,3,3);g.fillRect(25,20,3,3);return c}
function barUI(){const bar=document.getElementById('bar');bar.innerHTML='';P.forEach(p=>{const a=st&&st.agents[p.id],d=document.createElement('div');d.className='col'+(sel==p.id?' sel':'');
 d.appendChild(portrait(p));d.insertAdjacentHTML('beforeend',`<div>${p.name}</div><div style="font-size:8px;color:#a89f88;padding:0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a?a.task:''}</div><div class="st" style="color:${a&&a.state=='working'?'#8fd06a':'#d8c06a'}">${a?a.state:'…'}</div>`);d.onclick=()=>{sel=p.id;barUI();info()};bar.appendChild(d)})}
function info(){const el=document.getElementById('info'),p=P.find(q=>q.id==sel);if(!p||!st){el.style.display='none';return}const a=st.agents[p.id];
 const doing=p.path.length?'Walking to '+WS[p.cur][0].toLowerCase():(p.cur?'At '+NM[p.cur]+' ('+WS[p.cur][0].toLowerCase()+')':'Standing');
 el.innerHTML=`<h2>${a.name}</h2><div><span class="k">Role</span>${a.role}</div><div><span class="k">Task</span>${a.task}</div><div><span class="k">Status</span><b style="color:${a.state=='working'?'#8fd06a':'#d8c06a'}">${a.state}</b> · ${doing}</div>`+
 (p.id=='tile'&&st.notes&&st.notes.exists?`<div><span class="k">Notes</span>${st.notes.last_heading||'-'} (${st.notes.modified})</div>`:'')+(st.last_usage?`<div><span class="k">Usage</span>${st.last_usage}</div>`:'');el.style.display='block'}
cv.onclick=e=>{const p=P.find(p=>p.hit&&e.clientX>p.hit[0]&&e.clientX<p.hit[0]+p.hit[2]&&e.clientY>p.hit[1]&&e.clientY<p.hit[1]+p.hit[3]);sel=p?p.id:null;barUI();info()};
async function poll(){try{const r=await fetch(new URL('status.json',location.origin+location.pathname).href+'?'+Date.now(),{credentials:'include',cache:'no-store'});st=await r.json();const c=st.counts;cr.textContent=c.research;cb.textContent=c.books;cl.textContent=c.logs;upd.textContent='synced '+st.updated.slice(11,16);barUI();info()}catch(e){upd.textContent='offline'}}
function clock(){const d=new Date();clk.textContent=d.toLocaleTimeString('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit'})+' London';date.textContent=d.toLocaleDateString('en-GB',{timeZone:'Europe/London',weekday:'short',day:'numeric',month:'short',year:'numeric'})}
clock();setInterval(clock,1000);poll();setInterval(poll,10000);draw();
