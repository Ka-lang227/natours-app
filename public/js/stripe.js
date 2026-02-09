import axios from 'axios';
import { showAlert } from './alerts.js';

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from backend
    const response = await axios(
      `/api/v1/bookings/checkout-session/${tourId}`
    );
    
    // 2) Redirect to Stripe Checkout URL
    if (response.data.status === 'success') {
      window.location.replace(response.data.session.url);
    }
  } catch (err) {
    console.log(err);
    showAlert('error', err.response?.data?.message || 'Error booking tour');
  }
}
