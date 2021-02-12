import './admin.scss';

let ws = {};

export function disconnect(error) {
  document.querySelector('.disconnected').style.display = '';
  throw error;
}

ws.onerror = (error) => {
  console.error(error);
};

ws.onmessage = (event) => {
  let json = JSON.parse(event.data);

  if (json.action == 'login') {
    if (json.error) {
      document.querySelector('.error').innerHTML = json.error;
      document.querySelector('form').submit.innerText = 'Login';
    } else {
      init(json.username);
    }
  } else if (json.action == 'groups') {
    groups = json.groups;
  } else if (json.action == 'periodlist') {
    renderPeriodList(json);
  } else if (json.action == 'sportlist') {
    renderSportList(json);
  } else if (json.action == 'sportinfo') {
    renderSportInfo(json);
  } else if (json.action == 'selectionsdownload') {
    downloadSelectionsCsv(json.name, json.csv);
  } else if (json.action == 'studentcounts') {
    renderStudentCounts(json.counts);
  }
};

function send(json) {
  // ws.send(JSON.stringify(json));
}

function deleteUser(button, user) {
  let form = button.form;

  if (!confirm(`Are you sure you want to delete ${user} from ${form.querySelector('#name').innerText}?`)) {
    return;
  }

  send({
    action: 'deleteuser',
    periodid: form.periodid.value,
    sportid: form.sportid.value,
    user: user
  });
  
  form.submit.innerText = 'Deleting...';
}

import { login } from './login.js';

const loginForm = document.querySelector('#loginForm');

if (loginForm) {
  loginForm.onsubmit = login;
}