(function(){
  const monthLabel = document.getElementById('monthLabel');
  const grid = document.getElementById('calendarGrid');
  const slotsEl = document.getElementById('slots');
  const bookBtn = document.getElementById('bookBtn');
  const welcome = document.getElementById('welcomeText');

  const now = new Date();
  let selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let selectedTime = null;

  // Prefill welcome name
  try{
    const raw = sessionStorage.getItem('registeredUser');
    if(raw){
      const u = JSON.parse(raw);
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.firstName;
      if(name && welcome) welcome.textContent = `Welcome, ${name}`;
    } else if(welcome) welcome.textContent = 'Welcome, XYZ';
  }catch{ if(welcome) welcome.textContent = 'Welcome, XYZ'; }

  function renderCalendar(date){
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month+1, 0);

    monthLabel.textContent = firstDay.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const startWeekday = firstDay.getDay(); // 0 Sun - 6 Sat
    const totalCells = startWeekday + lastDay.getDate();
    const rows = Math.ceil(totalCells / 7);

    grid.innerHTML = '';

    let dayCounter = 1;
    for(let r=0; r<rows; r++){
      for(let c=0; c<7; c++){
        const idx = r*7 + c;
        const div = document.createElement('div');
        div.className = 'cell';
        if(idx < startWeekday || dayCounter > lastDay.getDate()){
          div.classList.add('disabled');
          div.textContent = '';
        }else{
          div.textContent = String(dayCounter);
          const thisDate = new Date(year, month, dayCounter);
          if(thisDate.toDateString() === selectedDate.toDateString()){
            div.classList.add('selected');
          }
          div.addEventListener('click', () => {
            selectedDate = thisDate;
            document.querySelectorAll('.cell').forEach(c=>c.classList.remove('selected'));
            div.classList.add('selected');
            renderSlots();
          });
          dayCounter++;
        }
        grid.appendChild(div);
      }
    }
  }

  function renderSlots(){
    // Example times
    const times = ['09:00','14:30','15:30'];
    slotsEl.innerHTML = '';
    selectedTime = null;

    times.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'slot';
      btn.textContent = t.replace(':00', ':00').replace(':30', ':30');
      btn.addEventListener('click', () => {
        document.querySelectorAll('.slot').forEach(s=>s.classList.remove('selected'));
        btn.classList.add('selected');
        selectedTime = t;
      });
      slotsEl.appendChild(btn);
    });
  }

  bookBtn.addEventListener('click', () => {
    if(!selectedTime){
      alert('Please select a time slot first.');
      return;
    }
    const payload = {
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime
    };
    try{ sessionStorage.setItem('lastBooking', JSON.stringify(payload)); }catch{}
    window.location.href = 'Confirmation.html';
  });

  renderCalendar(now);
  renderSlots();
})();
