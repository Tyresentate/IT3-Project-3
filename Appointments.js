(function(){
  const grid = document.getElementById('appointmentsGrid');
  if(!grid) return;

  function render(items){
    if(!items || items.length === 0){
      grid.innerHTML = '<p style="text-align:center;color:#6b7280;grid-column:1/-1">No appointments to show.</p>';
      return;
    }
    grid.innerHTML = items.map((a)=>{
      const name = a.name || 'Unknown Patient';
      const reason = a.reason || 'General consultation';
      const time = a.time || '';
      const date = a.date || '';
      return `
        <article class="card">
          <div class="avatar"><img src="images/Generic avatar.png" alt="Patient"/></div>
          <div class="content">
            <div class="title">${name}</div>
            <div class="row">${time ? `<span class="badge">${time}</span>` : ''} ${date ? `<span class="muted">${date}</span>` : ''}</div>
            <div class="row muted">${reason}</div>
          </div>
        </article>
      `;
    }).join('');
  }

  function addFromLastBooking(list){
    try{
      const raw = sessionStorage.getItem('lastBooking');
      if(!raw) return list;
      const lb = JSON.parse(raw);
      return [{ name:'You', reason:'New booking', time: lb.time, date: lb.date }, ...list];
    }catch{ return list; }
  }

  async function load(){
    // Try a few endpoints to maximize compatibility
    const today = new Date().toISOString().split('T')[0];
    const endpoints = [
      `http://localhost:5000/appointments?date=${today}`,
      `http://localhost:5000/appointments`
    ];
    for(const url of endpoints){
      try{
        const r = await fetch(url);
        if(!r.ok) continue;
        const data = await r.json();
        if(Array.isArray(data)){
          return addFromLastBooking(data);
        }
      }catch{}
    }
    // Fallback: just show last booking if present
    return addFromLastBooking([]);
  }

  load().then(render).catch(()=>render([]));
})();
