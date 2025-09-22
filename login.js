(function(){
  const form = document.getElementById('loginForm');
  if(!form) return;

  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');

  function clear(){ emailError.textContent=''; passwordError.textContent=''; }
  function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    clear();

    const vEmail = email.value.trim();
    const vPass = password.value;

    let ok = true;
    if(!vEmail){ emailError.textContent = 'Email is required'; ok = false; }
    else if(!validEmail(vEmail)){ emailError.textContent = 'Enter a valid email'; ok = false; }

    if(!vPass){ passwordError.textContent = 'Password is required'; ok = false; }

    if(!ok) return;

    // Simple demo auth: compare to sessionStorage registeredUser
    try{
      const raw = sessionStorage.getItem('registeredUser');
      if(raw){
        const u = JSON.parse(raw);
        if(u.email && u.email.toLowerCase() !== vEmail.toLowerCase()){
          emailError.textContent = 'No account found for this email';
          return;
        }
      }
    }catch{}

    alert('Login successful');
    window.location.href = 'Booking.html';
  });
})();