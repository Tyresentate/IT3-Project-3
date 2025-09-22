(function(){
  const grid = document.getElementById('appointmentsGrid');
  if(!grid) return;

  const placeholder = Array.from({length: 6}).map((_,i)=>({ id:i+1 }));

  function render(items){
    grid.innerHTML = items.map(()=>`
      <article class="card">
        <div class="avatar">
          <img src="images/Generic avatar.png" alt="Patient"/>
        </div>
        <div class="lines">
          <div class="line"></div>
          <div class="line"></div>
          <div class="line small"></div>
        </div>
      </article>
    `).join('');
  }

  // Try to fetch real appointments; fall back to placeholders
  fetch('http://localhost:5000/appointments')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then((data) => {
      if(!Array.isArray(data) || data.length === 0){ render(placeholder); return; }
      grid.innerHTML = data.map((a)=>`
        <article class="card">
          <div class="avatar"><img src="images/Generic avatar.png" alt="Patient"/></div>
          <div class="lines">
            <div class="line" style="width:70%"></div>
            <div class="line" style="width:80%"></div>
            <div class="line small"></div>
          </div>
        </article>
      `).join('');
    })
    .catch(()=> render(placeholder));
})();
