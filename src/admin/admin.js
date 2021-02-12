import './admin.scss';

export function disconnect(error) {
  document.querySelector('.disconnected').style.display = '';
  throw error;
}

import { login } from './login.js';

const loginForm = document.querySelector('#loginForm');

if (loginForm) {
  loginForm.onsubmit = login;
}