import post from './post.js';
import { disconnect } from './admin.js';
import { groups } from './groups.js';

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

  let allowed = '';
  
  groups.forEach(group => {
    // Remove the username prefix from the group name
    const groupName = ~group.indexOf('_') ? group.substr(group.indexOf('_') + 1) : group;
    const selected = (json.sport.allowed && ~json.sport.allowed.indexOf(group)) ? 'checked' : '';
    allowed += `<li><input type="checkbox" id="allowed.${group}" name="allowed.${group}" value="${group}" ${selected}/><label for="allowed.${group}">${groupName}</label></li>`;
  });
  
  if (json.sport.allowed) {
    json.sport.allowed.forEach(group => {
      if (!~groups.indexOf(group)) {
        const groupName = ~group.indexOf('_') ? group.substr(group.indexOf('_') + 1) : group;
        allowed += `<li><input type="checkbox" id="allowed.${group}" name="allowed.${group}" value="${group}" checked/><label for="allowed.${group}">${groupName}</label></li>`;
      }
    });
  }

  document.querySelector('.sportlist').querySelectorAll('.active').forEach(sport => {
    sport.classList.remove('active');
  });

  document.querySelector('.sportlist').querySelector(`.sport${json.sport.sportid}`).classList.add('active');
  
  document.querySelector('main').innerHTML = `
    <form onsubmit="return submitSport(this)">
      <h2 id="name" contenteditable>${json.sport.name}</h2>
      <input type="hidden" name="periodid" value="${json.sport.periodid}"/>
      <input type="hidden" name="sportid" value="${json.sport.sportid}"/>
      <label for="maxusers">Max users:</label>
      <input type="number" id="maxusers" name="maxusers" value="${json.sport.maxusers}"/>
      <label for="description">Description:</label>
      <textarea id="description" name="description">${json.sport.description}</textarea>
      <label for="allowed">Allowed groups:</label>
      <ul id="allowed">${allowed}</ul>
      <label for="users">Users enrolled (${json.sport.users ? json.sport.users.length : 0}):</label>
      <div id="users">
        ${json.sport.users ? json.sport.users.map(renderUser).join('\n') : ''}
      </div>
      <p></p>
      <button id="submit">Save <i class="fas fa-save"></i></button>
      <button onclick="deleteSport(this)" id="delete" class="delete" type="button">Delete <i class="fas fa-trash-alt"></i></button>
    </form>
    `;
}

function renderUser(user) {
  return `<div class="user">${user} <button onclick="deleteUser(this, '${user}')" class="fas fa-minus-circle fa-lg" title="Remove ${user} from sport"></button></div>`;
}