import post from './post.js';
import { renderSportList } from './sportList.js';
import { renderSportInfo } from './sportInfo.js';
import { globalGroups } from './groups.js';

export function renderCreateNewSport() {
  const periodid = this.dataset.periodid;

  let groups = '';
  
  globalGroups.forEach(group => {
    const groupName = ~group.indexOf('_') ? group.substr(group.indexOf('_') + 1) : group;
    groups += `<li><input type="checkbox" id="groups.${group}" name="groups.${group}" value="${group}"/><label for="groups.${group}">${groupName}</label></li>`;
  });

  document.querySelector('.sportlist').querySelectorAll('.active').forEach(period => {
    period.classList.remove('active');
  });

  document.querySelector('.sportlist').querySelector('.new').classList.add('active');

  document.querySelector('main').innerHTML = `
    <form>
      <h2 id="name">Create new sport</h2>
      <p class="error" aria-live="polite"></p>
      <input type="hidden" name="periodid" value="${periodid}"/>
      <label for="sport_name">Name:</label>
      <input type="text" id="sport_name" name="sport_name"/>
      <label for="maxusers">Max users:</label>
      <input type="number" id="maxusers" name="maxusers" value="25"/>
      <label for="description">Description:</label>
      <textarea id="description" name="description"></textarea>
      <label for="groups">Allowed groups:</label>
      <ul id="groups">${groups}</ul>
      <button id="submit">Create <i class="fas fa-plus-square"></i></button>
    </form>
    `;
  document.querySelector('#sport_name').focus();

  document.querySelector('main').querySelector('form').onsubmit = createSport;
}

function createSport() {
  const createText = this.submit.innerHTML;

  let groups = [];

  this.querySelectorAll('input[type=checkbox]:checked').forEach(checkbox => {
    groups.push(checkbox.value);
  });

  post(config.adminEndPoint + '?action=createSport&database=' + config.database, {
    periodid: this.periodid.value,
    name: this.sport_name.value,
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
  
  this.submit.innerHTML = 'Creating...';
  
  // Disable default form action
  return false;
}