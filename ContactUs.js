// Contact Us page JS
// Add form validation or AJAX submission here if needed

document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('.contact-form form');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      // Example: Show alert on submit
      alert('Thank you for contacting us!');
      form.reset();
    });
  }
});
