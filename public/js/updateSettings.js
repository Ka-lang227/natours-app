import { showAlert } from './alerts';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    const isFormData = data instanceof FormData;
    const res = await fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? data : JSON.stringify(data)
    });
    const result = await res.json();

    if (result.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
    } else {
      showAlert('error', result.message);
    }
  } catch (err) {
    showAlert('error', 'Something went wrong!');
  }
};
