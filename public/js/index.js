import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { showAlert } from './alerts';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookTourBtn = document.getElementById('book-tour');



// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  // Dynamic import - only loads mapbox-gl when map exists on page
  import('./mapbox').then(({ displayMap }) => {
    displayMap(locations);
  });
}

if (loginForm)
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (logOutBtn)
  logOutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // console.log('Logout button clicked'); // commented out: debug log
    logout();
  }
  );

if (userDataForm)
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    // console.log(form); // commented out: debug log

    updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

// BOOKING
if (bookTourBtn) {
  bookTourBtn.addEventListener('click', async e => {
    e.target.textContent = 'Processing...';
    const tourId = e.target.dataset.tourId;

    try {
      // Get checkout session
      const res = await fetch(`/api/v1/bookings/checkout-session/${tourId}`);
      const data = await res.json();

      if (data.status === 'fail') {
        showAlert('error', data.message);
        e.target.textContent = 'Book tour now!';
        return;
      }

      // Redirect to Stripe Checkout
      window.location.replace(data.session.url);
    } catch (err) {
      showAlert('error', 'Error booking tour');
      e.target.textContent = 'Book tour now!';
    }
  });
}