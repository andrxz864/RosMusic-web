const $=id=>document.getElementById(id);
const audio=$('audio');let tracks=[],queue=[],index=-1,favorites=JSON.parse(localStorage.getItem('ros-favorites')||'[]'),dynamic=localStorage.getItem('ros-dynamic')!=='false',installPrompt=null;
const fmt=s=>{s=Math.floor(s||0);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2300)}
function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));$(name+'View').classList.remove('hidden');document.querySelectorAll('.nav[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));if(name==='favorites')renderFavorites();window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('.nav[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));
$('settingsBtn').onclick=()=>showView('settings');
$('heroSearch').onclick=()=>{showView('search');$('searchInput2').focus()};
$('themeToggle').onclick=()=>{document.body.classList.toggle('light');$('darkMode').checked=!document.body.classList.contains('light');localStorage.setItem('ros-light',String(document.body.classList.contains('light')))};
$('darkMode').checked=localStorage.getItem('ros-light')!=='true';
document.body.classList.toggle('light',localStorage.getItem('ros-light')==='true');
$('dynamicColor').checked=dynamic;
$('darkMode').onchange=e=>{document.body.classList.toggle('light',!e.target.checked);localStorage.setItem('ros-light',String(!e.target.checked))};
$('dynamicColor').onchange=e=>{dynamic=e.target.checked;localStorage.setItem('ros-dynamic',String(dynamic));if(index>=0)applyCoverColor(queue[index].cover)};
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderTracks(list,target){const el=$(target);if(!list.length){el.innerHTML='<div class="empty">No encontramos canciones para mostrar.</div>';return}el.classList.remove('empty');el.innerHTML=list.map((t,i)=>`<div class="track"><img src="${escapeHtml(t.cover)}" alt="Portada de ${escapeHtml(t.album||t.title)}" loading="lazy"><div class="track-text" data-detail="${i}" role="button" tabindex="0"><b>${escapeHtml(t.title)}</b><small>${escapeHtml(t.artist)} · ${escapeHtml(t.album||'')}</small></div><button class="track-play" data-detail="${i}" title="Ver canción" aria-label="Ver canción">▶</button><button data-fav="${t.id}" title="Guardar en favoritos" aria-label="Guardar en favoritos">${favorites.some(f=>f.id===t.id)?'♥':'♡'}</button></div>`).join('');el.querySelectorAll('[data-detail]').forEach(b=>{const open=()=>openDetail(list[Number(b.dataset.detail)]);b.onclick=open;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}}});el.querySelectorAll('[data-fav]').forEach(b=>b.onclick=()=>toggleFavorite(list.find(t=>String(t.id)===b.dataset.fav)))}
function toggleFavorite(t){if(!t)return;const exists=favorites.some(f=>f.id===t.id);favorites=exists?favorites.filter(f=>f.id!==t.id):[...favorites,t];localStorage.setItem('ros-favorites',JSON.stringify(favorites));renderTracks(tracks,'results');renderTracks(tracks,'results2');renderFavorites();toast(exists?'Quitada de favoritos':'Añadida a favoritos')}
function renderFavorites(){renderTracks(favorites,'favoriteList');renderTracks(favorites.slice(0,4),'homeFavorites')}
async function search(q,target,status){if(!q.trim())return;$(status).textContent='Buscando canciones…';$(target).innerHTML='';try{const url=`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=25`;const r=await fetch(url);if(!r.ok)throw Error('API');const data=await r.json();tracks=(data.results||[]).filter(x=>x.previewUrl).slice(0,20).map(x=>({id:x.trackId,title:x.trackName,artist:x.artistName,album:x.collectionName||'Sencillo',cover:(x.artworkUrl100||'').replace('100x100bb','600x600bb'),preview:x.previewUrl,appleUrl:x.trackViewUrl||x.collectionViewUrl||''}));$(status).textContent=tracks.length?`Encontramos ${tracks.length} canciones. Toca una para ver su portada y abrir el reproductor integrado.`:'No encontramos canciones disponibles.';renderTracks(tracks,target)}catch(e){$(status).textContent='No se pudo conectar con el catálogo musical. Inténtalo más tarde.'}}
$('searchForm').onsubmit=e=>{e.preventDefault();search($('searchInput').value,'results','status')};
$('searchForm2').onsubmit=e=>{e.preventDefault();search($('searchInput2').value,'results2','status2')};
function applyCoverColor(src){if(!dynamic||!src)return;const img=new Image();img.crossOrigin='anonymous';img.onload=()=>{try{const c=document.createElement('canvas'),ctx=c.getContext('2d',{willReadFrequently:true});c.width=c.height=1;ctx.drawImage(img,0,0,1,1);const [r,g,b]=ctx.getImageData(0,0,1,1).data;const color='#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');document.documentElement.style.setProperty('--glow',color);document.documentElement.style.setProperty('--accent',color)}catch(e){document.documentElement.style.setProperty('--glow','#8f59d6')}};img.onerror=()=>document.documentElement.style.setProperty('--glow','#8f59d6');img.src=src}
function openDetail(t){if(!t)return;$('detailCover').src=t.cover;$('detailTitle').textContent=t.title;$('detailArtist').textContent=t.artist;$('detailAlbum').textContent=t.album||'Sencillo';$('detailAppleLink').href=t.appleUrl||'https://music.apple.com/';let embed=t.appleUrl||'';if(embed.includes('music.apple.com/'))embed=embed.replace('https://music.apple.com/','https://embed.music.apple.com/');$('appleEmbed').src=embed||'about:blank';$('trackDetail').classList.remove('hidden');document.body.style.overflow='hidden';queue=[t];index=0;$('nowTitle').textContent=t.title;$('nowArtist').textContent=t.artist;$('nowCover').src=t.cover;applyCoverColor(t.cover)}
$('closeDetail').onclick=()=>{$('trackDetail').classList.add('hidden');$('appleEmbed').src='about:blank';document.body.style.overflow=''};
$('trackDetail').onclick=e=>{if(e.target===$('trackDetail'))$('closeDetail').click()};
function playList(list,i){queue=list;index=i;const t=queue[index];audio.src=t.preview;audio.play().then(()=>$('playBtn').textContent='Ⅱ').catch(()=>toast('No se pudo iniciar la muestra de audio'));$('nowTitle').textContent=t.title;$('nowArtist').textContent=t.artist;$('nowCover').src=t.cover;applyCoverColor(t.cover)}
$('playBtn').onclick=()=>{if(!audio.src){toast('Primero elige una canción');return}if(audio.paused){audio.play().then(()=>$('playBtn').textContent='Ⅱ').catch(()=>toast('No se pudo reproducir'))}else{audio.pause();$('playBtn').textContent='▶'}};
$('nextBtn').onclick=()=>{if(queue.length)playList(queue,(index+1)%queue.length)};
$('prevBtn').onclick=()=>{if(queue.length)playList(queue,(index-1+queue.length)%queue.length)};
audio.ontimeupdate=()=>{$('seek').value=audio.currentTime;$('currentTime').textContent=fmt(audio.currentTime)};
audio.onpause=()=>{$('playBtn').textContent='▶'};
audio.onplay=()=>{$('playBtn').textContent='Ⅱ'};
audio.onended=()=>$('nextBtn').click();
audio.onloadedmetadata=()=>{$('seek').max=audio.duration||30;$('duration').textContent=fmt(audio.duration||30)};
$('seek').oninput=e=>{if(audio.duration)audio.currentTime=Number(e.target.value)};
$('volumeBtn').onclick=()=>{audio.muted=!audio.muted;$('volumeBtn').textContent=audio.muted?'◌':'♪'};
$('closeNotice').onclick=()=>{$('.beta-notice')?.classList.add('hidden');localStorage.setItem('ros-notice-hidden','true')};
if(localStorage.getItem('ros-notice-hidden')==='true')document.querySelector('.beta-notice')?.classList.add('hidden');
const savedButtons=localStorage.getItem('ros-button-style')||'round',savedProgress=localStorage.getItem('ros-progress-style')||'pill';
document.body.classList.add('buttons-'+savedButtons,'progress-'+savedProgress);
$('buttonStyle').value=savedButtons;$('progressStyle').value=savedProgress;
$('buttonStyle').onchange=e=>{document.body.classList.remove('buttons-round','buttons-soft','buttons-square');document.body.classList.add('buttons-'+e.target.value);localStorage.setItem('ros-button-style',e.target.value)};
$('progressStyle').onchange=e=>{document.body.classList.remove('progress-pill','progress-line','progress-bold');document.body.classList.add('progress-'+e.target.value);localStorage.setItem('ros-progress-style',e.target.value)};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installBtn').classList.remove('hidden')});
$('installBtn').onclick=async()=>{if(!installPrompt){toast('Usa el menú del navegador y elige “Instalar aplicación” o “Añadir a pantalla de inicio”.');return}installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installBtn').classList.add('hidden')};
if('serviceWorker' in navigator && location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
renderFavorites();