import post from './post.js';
import { doCountdown, datetimeLocal, renderPeriodList } from './periodList.js';
import { disconnect } from './admin.js';
import { loadSport } from './sportInfo.js';
import { renderPeriodInfo } from './periodInfo.js';
import { renderCreateNewSport } from './createSport.js';

export function loadPeriod() {
  const periodid = this.dataset.periodid;

  console.log(`Loading period ${periodid}`);

  document.querySelector('.sportlist').innerHTML = '<h2 id="sportlist">Loading...</h2>';
  document.querySelector('main').innerHTML = '<h2 id="name">Loading period...</h2>';

  post(config.adminEndPoint + '?action=sportList&database=' + config.database, {
    periodid
  }, (json, err) => {
    if (err || json.error) {
      disconnect(err || json.error);
    } else {
      renderSportList(json);
    }
  });
}

export function renderSportList(json) {
  if (!json.sportList) return;

  if (json.period && (
      document.querySelector('.sportlist').innerHTML.length == 0 ||
      document.querySelector('.sportlist').innerHTML.indexOf('Loading...') >= 0
  )) {
    // Render period info aswell
    renderPeriodInfo(json);
  }
  
  // Update
  let ul = document.querySelector('.sportlist').querySelector('ul');
  
  if (!ul.querySelector('.new') && json.period) {
    ul.innerHTML += `<li class="new" data-periodid="${json.period.periodid}"><h3>New Sport</h3></li>`;
  }
  
  json.sportList.forEach(sport => {
    let li = ul.querySelector(`.sport${sport.sportid}`);
    
    if (!li) {
      ul.innerHTML += `<li class="sport sport${sport.sportid}" data-periodid="${sport.periodid}" data-sportid="${sport.sportid}"><h3></h3><span class="users"></span></li>`;
      li = ul.querySelector(`.sport${sport.sportid}`);
    }
    
    li.querySelector('h3').innerHTML = sport.name;
    li.querySelector('.users').innerHTML = `${sport.enrolled ? sport.enrolled.length : 0}/${sport.maxusers} users`;
  });

  ul.querySelectorAll('.new').forEach(li => li.onclick = renderCreateNewSport);
  ul.querySelectorAll('.sport').forEach(li => li.onclick = loadSport);

  document.querySelector('main').querySelector('form').onsubmit = submitPeriod;

  doCountdown();
}

function submitPeriod() {
  const createText = this.submit.innerHTML;

  post(config.adminEndPoint + '?action=createPeriod&database=' + config.database, {
    periodid: this.periodid.value,
    name: this.querySelector('#name').innerText,
    opens: new Date(this.opens.value).getTime(),
    closes: new Date(this.closes.value).getTime(),
    description: this.description.value
  }, (json, err) => {
    if (err || json.error) {
      document.querySelector('.error').innerText = err || json.error;
      this.submit.innerHTML = createText;
    } else {
      renderPeriodList(json);
      renderSportList(json);
    }
  });
  
  this.submit.innerHTML = 'Saving...';

  document.querySelector('.sportlist').innerHTML = '';
  
  // Disable default form action
  return false;
}