import post from './post.js';
import { loadPeriod, renderSportList } from './sportList.js';
import { disconnect } from './admin.js';
import { globalGroups } from './groups.js';

export function loadSport() {
  const periodid = this.dataset.periodid;
  const sportid = this.dataset.sportid;

  console.log(`Loading sport ${periodid}: ${sportid}`);

  document.querySelector('main').innerHTML = '<h2 id="name">Loading sport...</h2>';

  post(config.adminEndPoint + '?action=sportInfo&database=' + config.database, {
    periodid: periodid,
    sportid: sportid
  }, (json, err) => {
    if (err || json.error) {
      disconnect(err || json.error);
    } else {
      renderSportInfo(json);
    }
  });
}

export function renderSportInfo(json) {
  if (!json.sport) return;

  let groups = '';
  
  globalGroups.forEach(group => {
    // Remove the username prefix from the group name
    const selected = (json.sport.groups && ~json.sport.groups.indexOf(group)) ? 'checked' : '';
    groups += `<li><input type="checkbox" id="groups.${group}" name="groups.${group}" value="${group}" ${selected}/><label for="groups.${group}">${group}</label></li>`;
  });
  
  if (json.sport.groups) {
    json.sport.groups.forEach(group => {
      if (!~globalGroups.indexOf(group)) {
        groups += `<li><input type="checkbox" id="groups.${group}" name="groups.${group}" value="${group}" checked/><label for="groups.${group}">${group}</label></li>`;
      }
    });
  }

  document.querySelector('.sportlist').querySelectorAll('.active').forEach(sport => {
    sport.classList.remove('active');
  });

  document.querySelector('.sportlist').querySelector(`.sport${json.sport.sportid}`).classList.add('active');
  
  document.querySelector('main').innerHTML = `
    <form>
      <h2 id="name" contenteditable>${json.sport.name}</h2>
      <p class="error" aria-live="polite"></p>
      <input type="hidden" name="periodid" value="${json.sport.periodid}"/>
      <input type="hidden" name="sportid" value="${json.sport.sportid}"/>
      <label for="maxusers">Max users:</label>
      <input type="number" id="maxusers" name="maxusers" value="${json.sport.maxusers}"/>
      <label for="description">Description:</label>
      <textarea id="description" name="description">${json.sport.description}</textarea>
      <label for="groups">Allowed groups:</label>
      <ul id="groups">${groups}</ul>
      <label for="users">Users enrolled (${json.sport.enrolled ? json.sport.enrolled.length : 0}):</label>
      <div id="users">
        ${json.sport.enrolled ? json.sport.enrolled.map(renderUser).join('\n') : ''}
      </div>
      <p></p>
      <button id="submit">Save <i class="fas fa-save"></i></button>
      <button id="delete" class="delete" type="button">Delete <i class="fas fa-trash-alt"></i></button>
    </form>
    `;

  document.querySelector('main').querySelector('form').onsubmit = submitSport;

  document.getElementById('delete').onclick = deleteSport;

  document.querySelectorAll('.deleteUserButton').forEach(deleteUserButton => deleteUserButton.onclick = deleteUser);
}

function renderUser(user) {
  return `<div class="user">${user} <button data-user="${user}" class="deleteUserButton fas fa-minus-circle fa-lg" title="Remove ${user} from sport" type="button"></button></div>`;
}

function submitSport() {
  const createText = this.submit.innerHTML;

  let groups = [];

  this.querySelectorAll('input[type=checkbox]:checked').forEach(checkbox => {
    groups.push(checkbox.value);
  });

  post(config.adminEndPoint + '?action=createSport&database=' + config.database, {
    sportid: this.sportid.value,
    periodid: this.periodid.value,
    name: this.querySelector('#name').innerText,
    maxusers: this.maxusers.value,
    description: this.description.value,
    groups,
  }, (json, err) => {
    if (err || json.error) {
      document.querySelector('.error').innerText = err || json.error;
      this.submit.innerHTML = createText;
    } else {
      renderSportList(json);
      renderSportInfo(json);
    }
  });
  
  this.submit.innerHTML = 'Saving...';
  
  // Disable default form action
  return false;
}

function deleteSport() {
  const form = this.form;

  if (!confirm(`Are you sure you want to delete ${form.querySelector('#name').innerText}?`)) {
    return;
  }

  const periodid = form.periodid.value;
  const sportid = form.sportid.value;

  post(config.adminEndPoint + '?action=deleteSport&database=' + config.database, {
    periodid,
    sportid
  }, (json, err) => {
    if (err || json.error) {
      disconnect(err || json.error);
    } else {
      loadPeriod.apply({ dataset: { periodid } });
    }
  });

  document.querySelector('.sportlist').innerHTML = '<h2 id="sportlist">Loading...</h2>';
  document.querySelector('main').innerHTML = '<h2 id="name">Deleting sport...</h2>';
}

function deleteUser() {
  const form = this.form;
  const user = this.dataset.user;

  if (!confirm(`Are you sure you want to delete ${user} from ${form.querySelector('#name').innerText}?`)) {
    return;
  }

  const periodid = form.periodid.value;
  const sportid = form.sportid.value;

  post(config.adminEndPoint + '?action=deleteUser&database=' + config.database, {
    periodid,
    sportid,
    user
  }, (json, err) => {
    if (err || json.error) {
      disconnect(err || json.error);
    } else {
      loadSport.apply({ dataset: { periodid, sportid } });
    }
  });
  
  form.submit.innerText = 'Deleting...';
}