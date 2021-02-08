import post from './post.js';
import { doCountdown, datetimeLocal, renderPeriodList } from './periodList.js';
import { disconnect } from './admin.js';
import { loadSport } from './sportInfo.js';
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
    // Render main aswell
    document.querySelector('main').innerHTML = `
      <form>
        <h2 id="name" contenteditable>${json.period.name}</h2>
        <input type="hidden" name="periodid" value="${json.period.periodid}"/>
        <label for="opens">Opens at:</label>
        <input type="datetime-local" id="opens" name="opens" value="${datetimeLocal(json.period.opens).slice(0, 16)}"/>
        <label for="closes">Closes at:</label>
        <input type="datetime-local" id="closes" name="closes" value="${datetimeLocal(json.period.closes).slice(0, 16)}"/>
        <label for="description">Description:</label>
        <textarea id="description" name="description">${json.period.description}</textarea>
        <button id="submit">Save <i class="fas fa-save"></i></button>
        <button onclick="downloadSelections(this)" id="download" class="download" type="button">Download Selections <i class="fas fa-download"></i></button>
        <label for="studentData">Want more detailed student data?<br/>Upload the student data csv below:</label>
        <input type="file" id="studentData" onchange="storeStudentData(this)" accept="text/csv"/>
        <p id="studentDataError"></p>
      </form>
      `;
    document.querySelector('.sportlist').innerHTML = `<h2 id="sportlist" periodid="${json.period.periodid}" class="visuallyhidden">Sport List</h2><ul></ul>`;
    
    document.querySelector('.periodlist').querySelectorAll('.active').forEach(period => {
      period.classList.remove('active');
    });

    document.querySelector('.periodlist').querySelector(`.period${json.period.periodid}`).classList.add('active');
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
    li.querySelector('.users').innerHTML = `${sport.users ? sport.users.length : 0}/${sport.maxusers} users`;
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