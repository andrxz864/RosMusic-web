const $=id=>document.getElementById(id);
const audio=$('audio');let tracks=[],queue=[],index=-1,favorites=JSON.parse(localStorage.getItem('ros-favorites')||'[]'),dynamic=localStorage.getItem('ros-dynamic')!=='false',installPrompt=null;

const SUPABASE_URL='https://avcjvhrarhxsupdzcvjn.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_mbgKjSevp3xW4PndlaThaA__HCwLKkO';
const supabaseClient=window.supabase?.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
let currentUser=null,playlists=[],activePlaylistTracks=[];
function favoriteStorageKey(){return currentUser?'ros-favorites-'+currentUser.id:'ros-favorites'}
function saveFavorites(){localStorage.setItem(favoriteStorageKey(),JSON.stringify(favorites))}
function accountMessage(message,isError=false){const el=$('accountMessage');if(el){el.textContent=message;el.classList.toggle('error',isError)}}
function updateAccountUI(){
  const status=$('accountStatus');
  if(!status)return;
  status.textContent=currentUser?'Sesión iniciada: '+currentUser.email:'No has iniciado sesión.';
  $('signUpBtn').classList.toggle('hidden',!!currentUser);
  $('signInBtn').classList.toggle('hidden',!!currentUser);
  $('signOutBtn').classList.toggle('hidden',!currentUser);
}
async function syncFavoritesForUser(user){
  const guestFavorites=JSON.parse(localStorage.getItem('ros-favorites')||'[]');
  const personalKey='ros-favorites-'+user.id;
  const personalFavorites=JSON.parse(localStorage.getItem(personalKey)||'[]');
  const localItems=[...guestFavorites,...personalFavorites];
  const {data:existing,error:readError}=await supabaseClient.from('favorites').select('track_id').eq('user_id',user.id);
  if(readError)throw readError;
  const known=new Set((existing||[]).map(row=>String(row.track_id)));
  const newRows=localItems.filter(t=>t&&t.id&&!known.has(String(t.id))).map(t=>({
    user_id:user.id,track_id:String(t.id),title:t.title||'Canción',artist:t.artist||'Artista',
    cover_url:t.cover||'',audio_url:t.audioUrl||''
  }));
  if(newRows.length){
    const {error}=await supabaseClient.from('favorites').insert(newRows);
    if(error)throw error;
  }
  const {data,error}=await supabaseClient.from('favorites').select('track_id,title,artist,cover_url,audio_url').eq('user_id',user.id).order('created_at',{ascending:false});
  if(error)throw error;
  favorites=(data||[]).map(row=>({
    id:String(row.track_id),title:row.title,artist:row.artist,album:'Favoritos',
    cover:row.cover_url||'',audioUrl:row.audio_url||'',provider:'Jamendo'
  }));
  localStorage.setItem(personalKey,JSON.stringify(favorites));
  localStorage.removeItem('ros-favorites');
  renderFavorites();
}
async function handleAuthSession(session){
  currentUser=session?.user||null;
  updateAccountUI();
  if(currentUser){
    try{await syncFavoritesForUser(currentUser);await loadPlaylists();accountMessage('Tus favoritos y playlists están sincronizados en esta cuenta.');}
    catch(error){console.error(error);accountMessage('La cuenta inició sesión, pero hubo un problema al sincronizar tus datos.',true);}
  }else{
    favorites=JSON.parse(localStorage.getItem('ros-favorites')||'[]');
    playlists=[];activePlaylistTracks=[];renderPlaylistOptions();renderPlaylistTracks();renderFavorites();
  }
  renderTracks(tracks,'results');renderTracks(tracks,'results2');
}
async function createAccount(){
  if(!supabaseClient){accountMessage('No se pudo cargar el servicio de cuentas. Recarga la página.',true);return}
  const email=$('accountEmail').value.trim(),password=$('accountPassword').value;
  if(!email||!password){accountMessage('Escribe tu correo y una contraseña.',true);return}
  if(password.length<6){accountMessage('La contraseña debe tener al menos 6 caracteres.',true);return}
  $('signUpBtn').disabled=true;accountMessage('Creando tu cuenta…');
  const {data,error}=await supabaseClient.auth.signUp({email,password});
  $('signUpBtn').disabled=false;
  if(error){accountMessage(error.message,true);return}
  if(data.session){accountMessage('¡Cuenta creada! Ya puedes usar RosMusic.');}
  else{accountMessage('Cuenta creada. Revisa tu correo y confirma la dirección antes de iniciar sesión.');}
}
async function signIn(){
  if(!supabaseClient){accountMessage('No se pudo cargar el servicio de cuentas. Recarga la página.',true);return}
  const email=$('accountEmail').value.trim(),password=$('accountPassword').value;
  if(!email||!password){accountMessage('Escribe tu correo y contraseña.',true);return}
  $('signInBtn').disabled=true;accountMessage('Iniciando sesión…');
  const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});
  $('signInBtn').disabled=false;
  if(error){accountMessage(error.message,true);return}
  accountMessage('¡Bienvenido a RosMusic!');
}
async function signOut(){
  if(!supabaseClient)return;
  const {error}=await supabaseClient.auth.signOut();
  if(error){accountMessage(error.message,true);return}
  accountMessage('Sesión cerrada.');
}
if(supabaseClient){
  $('signUpBtn')?.addEventListener('click',createAccount);
  $('signInBtn')?.addEventListener('click',signIn);
  $('signOutBtn')?.addEventListener('click',signOut);
  supabaseClient.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>handleAuthSession(session),0)});
}else{
  accountMessage('No se pudo cargar el servicio de cuentas. Comprueba tu conexión.',true);
}

const fmt=s=>{s=Math.floor(s||0);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2300)}
function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));$(name+'View').classList.remove('hidden');document.querySelectorAll('.nav[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));renderFavorites();window.scrollTo({top:0,behavior:'smooth'})}
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
function renderTracks(list,target){
  const el=$(target);
  if(!list.length){el.innerHTML='<div class="empty">No encontramos canciones para mostrar.</div>';return}
  el.classList.remove('empty');
  el.innerHTML=list.map((t,i)=>`<div class="track"><img src="${escapeHtml(t.cover)}" alt="Portada de ${escapeHtml(t.album||t.title)}" loading="lazy"><div class="track-text" data-detail="${i}" role="button" tabindex="0"><b>${escapeHtml(t.title)}</b><small>${escapeHtml(t.artist)} · ${escapeHtml(t.album||'')}</small></div><button class="track-play" data-play="${i}" title="Reproducir" aria-label="Reproducir">▶</button><button data-fav="${escapeHtml(t.id)}" title="Guardar en favoritos" aria-label="Guardar en favoritos">${favorites.some(f=>String(f.id)===String(t.id))?'♥':'♡'}</button><button data-add-playlist="${i}" title="Añadir a playlist" aria-label="Añadir a playlist">＋</button></div>`).join('');
  el.querySelectorAll('[data-detail]').forEach(b=>{const open=()=>openDetail(list[Number(b.dataset.detail)]);b.onclick=open;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}}});
  el.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>playList(list,Number(b.dataset.play)));
  el.querySelectorAll('[data-fav]').forEach(b=>b.onclick=()=>toggleFavorite(list.find(t=>String(t.id)===b.dataset.fav)));
  el.querySelectorAll('[data-add-playlist]').forEach(b=>b.onclick=()=>addTrackToPlaylist(list[Number(b.dataset.addPlaylist)]));
}
async function toggleFavorite(t){
  if(!t)return;
  const exists=favorites.some(f=>String(f.id)===String(t.id));
  favorites=exists?favorites.filter(f=>String(f.id)!==String(t.id)):[...favorites,t];
  saveFavorites();
  renderTracks(tracks,'results');renderTracks(tracks,'results2');renderFavorites();
  if(currentUser){
    const request=exists
      ?supabaseClient.from('favorites').delete().eq('user_id',currentUser.id).eq('track_id',String(t.id))
      :supabaseClient.from('favorites').insert({user_id:currentUser.id,track_id:String(t.id),title:t.title||'Canción',artist:t.artist||'Artista',cover_url:t.cover||'',audio_url:t.audioUrl||''});
    const {error}=await request;
    if(error){console.error(error);toast('No se pudo sincronizar este favorito.');return}
  }
  toast(exists?'Quitada de favoritos':'Añadida a favoritos');
}
function renderFavorites(){renderTracks(favorites,'favoriteList');renderTracks(favorites.slice(0,4),'homeFavorites')}
function renderPlaylistOptions(){
  const select=$('playlistSelect');if(!select)return;
  select.innerHTML=playlists.length?playlists.map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join(''):'<option value="">Crea una playlist primero</option>';
  if(activePlaylistId&&playlists.some(p=>p.id===activePlaylistId))select.value=activePlaylistId;
  else activePlaylistId=playlists[0]?.id||null;
}
let activePlaylistId=null;
async function loadPlaylists(){
  if(!currentUser||!supabaseClient)return;
  const {data,error}=await supabaseClient.from('playlists').select('id,name,created_at').eq('user_id',currentUser.id).order('created_at',{ascending:false});
  if(error)throw error;
  playlists=data||[];
  renderPlaylistOptions();
  await loadPlaylistTracks(activePlaylistId);
}
async function loadPlaylistTracks(playlistId){
  activePlaylistId=playlistId||null;
  renderPlaylistOptions();
  if(!currentUser||!activePlaylistId){activePlaylistTracks=[];renderPlaylistTracks();return}
  const {data,error}=await supabaseClient.from('playlist_tracks').select('id,track_id,title,artist,cover_url,audio_url').eq('playlist_id',activePlaylistId).order('created_at',{ascending:true});
  if(error){console.error(error);toast('No se pudieron cargar las canciones de esta playlist.');return}
  activePlaylistTracks=(data||[]).map(row=>({rowId:row.id,id:String(row.track_id),title:row.title,artist:row.artist||'Artista',album:'Playlist',cover:row.cover_url||'',audioUrl:row.audio_url||'',provider:'Jamendo'}));
  renderPlaylistTracks();
}
function renderPlaylistTracks(){
  const el=$('playlistTracks');if(!el)return;
  if(!currentUser){el.innerHTML='<div class="empty">Inicia sesión para crear y guardar tus playlists.</div>';return}
  if(!playlists.length){el.innerHTML='<div class="empty">Todavía no tienes playlists. Crea la primera arriba.</div>';return}
  if(!activePlaylistTracks.length){el.innerHTML='<div class="empty">Esta playlist está vacía. Busca una canción y pulsa ＋ para añadirla.</div>';return}
  el.innerHTML=activePlaylistTracks.map((t,i)=>`<div class="track"><img src="${escapeHtml(t.cover)}" alt="" loading="lazy"><div class="track-text"><b>${escapeHtml(t.title)}</b><small>${escapeHtml(t.artist)}</small></div><button class="track-play" data-play-playlist="${i}" title="Reproducir">▶</button><button data-remove-playlist-track="${escapeHtml(t.rowId)}" title="Quitar de playlist">×</button></div>`).join('');
  el.querySelectorAll('[data-play-playlist]').forEach(b=>b.onclick=()=>playList(activePlaylistTracks,Number(b.dataset.playPlaylist)));
  el.querySelectorAll('[data-remove-playlist-track]').forEach(b=>b.onclick=()=>removePlaylistTrack(b.dataset.removePlaylistTrack));
}
async function createPlaylist(event){
  event?.preventDefault();
  if(!currentUser){toast('Inicia sesión para crear playlists.');return}
  const input=$('playlistName'),name=input.value.trim();
  if(!name){input.focus();return}
  const {data,error}=await supabaseClient.from('playlists').insert({user_id:currentUser.id,name}).select('id,name,created_at').single();
  if(error){console.error(error);toast('No se pudo crear la playlist.');return}
  input.value='';playlists=[data,...playlists];activePlaylistId=data.id;renderPlaylistOptions();await loadPlaylistTracks(data.id);toast('Playlist creada');
}
async function addTrackToPlaylist(track){
  if(!currentUser){toast('Inicia sesión para guardar canciones en playlists.');return}
  const playlistId=$('playlistSelect')?.value;
  if(!playlistId){toast('Primero crea una playlist.');showView('playlists');return}
  const {error}=await supabaseClient.from('playlist_tracks').insert({
    playlist_id:playlistId,track_id:String(track.id),title:track.title||'Canción',
    artist:track.artist||'Artista',cover_url:track.cover||'',audio_url:track.audioUrl||''
  });
  if(error){console.error(error);toast(error.code==='23505'?'Esa canción ya está en la playlist.':'No se pudo añadir la canción.');return}
  activePlaylistId=playlistId;await loadPlaylistTracks(playlistId);toast('Añadida a tu playlist');
}
async function removePlaylistTrack(rowId){
  const {error}=await supabaseClient.from('playlist_tracks').delete().eq('id',rowId);
  if(error){console.error(error);toast('No se pudo quitar la canción.');return}
  await loadPlaylistTracks(activePlaylistId);toast('Canción quitada de la playlist');
}
$('playlistCreateForm')?.addEventListener('submit',createPlaylist);
$('playlistSelect')?.addEventListener('change',e=>loadPlaylistTracks(e.target.value));
const JAMENDO_CLIENT_ID='ee51e90a';
async function search(q,target,status){
  if(!q.trim())return;
  $(status).textContent='Buscando canciones de audio…';
  $(target).innerHTML='';
  try{
    const params=new URLSearchParams({client_id:JAMENDO_CLIENT_ID,format:'json',limit:'50',search:q.trim(),boost:'popularity_total',type:'single albumtrack',include:'licenses',audioformat:'mp32',imagesize:'300'});
    const response=await fetch(`https://api.jamendo.com/v3.0/tracks/?${params.toString()}`);
    if(!response.ok)throw Error('Jamendo API');
    const data=await response.json();
    if(data.headers?.status==='failed'||data.headers?.code!==0)throw Error(data.headers?.error_message||'Jamendo API');
    tracks=(data.results||[]).filter(x=>x.audio).map(x=>({id:String(x.id),title:x.name||'Canción sin título',artist:x.artist_name||'Artista independiente',album:x.album_name||'Sencillo',cover:x.album_image||x.image||'',duration:Number(x.duration)||0,audioUrl:x.audio,license:x.license_ccurl||'',provider:'Jamendo'}));
    $(status).textContent=tracks.length?`Encontramos ${tracks.length} canciones disponibles para escuchar como audio.`:'No encontramos canciones con audio disponible. Prueba otro término o artista independiente.';
    renderTracks(tracks,target);
  }catch(error){console.error(error);$(status).textContent='No se pudo completar la búsqueda: '+(error.message||'comprueba tu conexión.');}
}
$('searchForm').onsubmit=e=>{e.preventDefault();search($('searchInput').value,'results','status')};
$('searchForm2').onsubmit=e=>{e.preventDefault();search($('searchInput2').value,'results2','status2')};
function applyCoverColor(src){if(!dynamic||!src)return;const img=new Image();img.crossOrigin='anonymous';img.onload=()=>{try{const c=document.createElement('canvas'),ctx=c.getContext('2d',{willReadFrequently:true});c.width=c.height=1;ctx.drawImage(img,0,0,1,1);const [r,g,b]=ctx.getImageData(0,0,1,1).data;const color='#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');document.documentElement.style.setProperty('--glow',color);document.documentElement.style.setProperty('--accent',color)}catch(e){document.documentElement.style.setProperty('--glow','#8f59d6')}};img.onerror=()=>document.documentElement.style.setProperty('--glow','#8f59d6');img.src=src}
function openDetail(t){
  if(!t)return;
  $('detailCover').src=t.cover;$('detailTitle').textContent=t.title;$('detailArtist').textContent=t.artist;$('detailAlbum').textContent=t.album||'Sencillo';
  const license=$('detailLicense');
  if(license)license.textContent=t.license?'Licencia de esta pista: '+t.license:'Consulta las condiciones de uso de esta pista en Jamendo.';
  $('trackDetail').classList.remove('hidden');document.body.style.overflow='hidden';queue=[t];index=0;
  $('nowTitle').textContent=t.title;$('nowArtist').textContent=t.artist;$('nowCover').src=t.cover;applyCoverColor(t.cover);
}
$('closeDetail').onclick=()=>{$('trackDetail').classList.add('hidden');document.body.style.overflow=''};
$('trackDetail').onclick=e=>{if(e.target===$('trackDetail'))$('closeDetail').click()};
function playList(list,i){
  if(!list?.length)return;
  queue=list;index=i;const t=queue[index];
    if(!t.audioUrl){toast('Esta canción no tiene una transmisión disponible.');return}
  audio.src=t.audioUrl;
  audio.play().then(()=>$('playBtn').textContent='Ⅱ').catch(()=>toast('No se pudo reproducir esta pista. Inténtalo de nuevo.'));
  $('nowTitle').textContent=t.title;$('nowArtist').textContent=t.artist;$('nowCover').src=t.cover;applyCoverColor(t.cover);
}

$('playBtn').onclick=()=>{if(!audio.src){toast('Primero elige una canción');return}if(audio.paused){audio.play().then(()=>$('playBtn').textContent='Ⅱ').catch(()=>toast('No se pudo reproducir'))}else{audio.pause();$('playBtn').textContent='▶'}};
$('nextBtn').onclick=()=>{if(queue.length)playList(queue,(index+1)%queue.length)};
$('prevBtn').onclick=()=>{if(queue.length)playList(queue,(index-1+queue.length)%queue.length)};
audio.ontimeupdate=()=>{$('seek').value=audio.currentTime;$('currentTime').textContent=fmt(audio.currentTime)};
audio.onpause=()=>{$('playBtn').textContent='▶'};
audio.onplay=()=>{$('playBtn').textContent='Ⅱ'};
audio.onended=()=>$('nextBtn').click();
audio.onerror=()=>{toast('Jamendo no pudo entregar el audio de esta pista. Prueba otra canción.');$('playBtn').textContent='▶'};
audio.onloadedmetadata=()=>{$('seek').max=audio.duration||30;$('duration').textContent=fmt(audio.duration||30)};
$('seek').oninput=e=>{if(audio.duration)audio.currentTime=Number(e.target.value)};
$('volumeBtn').onclick=()=>{audio.muted=!audio.muted;$('volumeBtn').textContent=audio.muted?'◌':'♪'};
$('closeNotice').onclick=()=>{document.querySelector('.beta-notice')?.classList.add('hidden');localStorage.setItem('ros-notice-hidden','true')};
if(localStorage.getItem('ros-notice-hidden')==='true')document.querySelector('.beta-notice')?.classList.add('hidden');
const savedButtons=localStorage.getItem('ros-button-style')||'round',savedProgress=localStorage.getItem('ros-progress-style')||'pill';
document.body.classList.add('buttons-'+savedButtons,'progress-'+savedProgress);
$('buttonStyle').value=savedButtons;$('progressStyle').value=savedProgress;
$('buttonStyle').onchange=e=>{document.body.classList.remove('buttons-round','buttons-soft','buttons-square');document.body.classList.add('buttons-'+e.target.value);localStorage.setItem('ros-button-style',e.target.value)};
$('progressStyle').onchange=e=>{document.body.classList.remove('progress-pill','progress-line','progress-bold');document.body.classList.add('progress-'+e.target.value);localStorage.setItem('ros-progress-style',e.target.value)};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installBtn').classList.remove('hidden')});
$('installBtn').onclick=async()=>{if(!installPrompt){toast('Usa el menú del navegador y elige “Instalar aplicación” o “Añadir a pantalla de inicio”.');return}installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('installBtn').classList.add('hidden')};
if('serviceWorker' in navigator && location.protocol.startsWith('http'))window.addEventListener('load',async()=>{try{const registration=await navigator.serviceWorker.register('./sw.js?v=rosmusic16',{updateViaCache:'none'});navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});await registration.update();if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});}catch(error){console.warn('RosMusic: no se pudo actualizar el modo sin conexión',error);}});
renderFavorites();