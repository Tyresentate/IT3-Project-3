// login.js
(function() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const successDiv = document.getElementById('loginSuccess');

  function clearErrors() {
    emailError.textContent = '';
    passwordError.textContent = '';
  }

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const vEmail = email.value.trim().toLowerCase();
    const vPass = password.value;

    let ok = true;
    if (!vEmail) { emailError.textContent = 'Email is required'; ok = false; }
    else if (!validEmail(vEmail)) { emailError.textContent = 'Enter a valid email'; ok = false; }
    if (!vPass) { passwordError.textContent = 'Password is required'; ok = false; }
    if (!ok) return;

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: vEmail, password: vPass })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.message.toLowerCase().includes('email')) emailError.textContent = result.message;
        else if (result.message.toLowerCase().includes('password')) passwordError.textContent = result.message;
        else alert(result.message);
        return;
      }

      if (result.user) localStorage.setItem('loggedUser', JSON.stringify(result.user));

      if (successDiv) {
        successDiv.textContent = 'Login successful! Redirecting...';
        successDiv.style.display = 'block';
      }

      form.reset();

      setTimeout(() => {
        // Redirect based on role
        if (result.user.doctorId) {
          window.location.href = 'viewschedule.html';
        } else {
          window.location.href = 'booking.html';
        }
      }, 1000);

    } catch (err) {
      console.error(err);
      alert('Login failed. Please try again.');
    }
  });
})();
