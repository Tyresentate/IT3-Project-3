(function() {
  const form = document.getElementById('registerForm');
  if (!form) return;
  const submitBtn = form.querySelector('.submit-btn');

  function showError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorDiv = document.getElementById(fieldId + 'Error');
    input.classList.add('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }

  function clearErrors() {
    document.querySelectorAll('.error-message').forEach(e => e.style.display = 'none');
    document.querySelectorAll('input').forEach(i => i.classList.remove('error'));
  }

  function showSuccess(message) {
    const successDiv = document.getElementById('registerSuccess');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const formData = new FormData(form);
    const data = {
      firstName: formData.get('firstName').trim(),
      lastName: formData.get('lastName').trim(),
      email: formData.get('email').trim().toLowerCase(),
      password: formData.get('password')
    };

    if (data.firstName.length < 2) { showError('firstName', 'First name must be at least 2 characters'); return; }
    if (data.lastName.length < 2) { showError('lastName', 'Last name must be at least 2 characters'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { showError('email', 'Please enter a valid email address'); return; }
    if (data.password.length < 8) { showError('password', 'Password must be at least 8 characters'); return; }

    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;

    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Registration failed');

      if (result.user) {
        // Store user info in localStorage for name display
        localStorage.setItem('loggedUser', JSON.stringify(result.user));
      }

      showSuccess('Registration successful! Redirecting...');
      form.reset();

      setTimeout(() => window.location.href = 'booking.html', 1500);

    } catch (error) {
      if (error.message.includes('email already exists')) showError('email', 'This email is already registered');
      else showError('email', 'Registration failed. Please try again.');
    } finally {
      submitBtn.textContent = 'Register';
      submitBtn.disabled = false;
    }
  });

  // Clear errors on input
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function () {
      if (this.classList.contains('error')) {
        this.classList.remove('error');
        document.getElementById(this.id + 'Error').style.display = 'none';
      }
    });
  });
})();
