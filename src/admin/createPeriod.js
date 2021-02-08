import post from './post.js';
import { renderPeriodList, datetimeLocal } from './periodList.js';
import { renderSportList } from './sportList.js';

export function renderCreateNewPeriod() {
  document.querySelector('.sportlist').innerHTML = '';

  document.querySelector('.periodlist').querySelectorAll('.active').forEach(period => {
    period.classList.remove('active');
  });

  document.querySelector('.periodlist').querySelector('.new').classList.add('active');

  document.querySelector('main').innerHTML = `
    <form>
      <h2 id="name">Create new period</h2>
      <p class="error" aria-live="polite"></p>
      <label for="period_name">Name:</label>
      <input type="text" id="period_name" name="period_name"/>
      <label for="opens">Opens at:</label>
      <input type="datetime-local" id="opens" name="opens" value="${datetimeLocal(Date.now()).slice(0, 16)}"/>
      <label for="closes">Closes at:</label>
      <input type="datetime-local" id="closes" name="closes" value="${datetimeLocal(Date.now() + 7 * 24 * 60 * 60 * 1000).slice(0, 16)}"/>
      <label for="description">Description:</label>
      <textarea id="description" name="description"></textarea>
      <button id="submit">Create <i class="fas fa-plus-square"></i></button>
    </form>
    `;
  document.querySelector('#period_name').focus();

  document.querySelector('main').querySelector('form').onsubmit = createPeriod;
}

function createPeriod() {
  const createText = this.submit.innerHTML;

  post(config.adminEndPoint + '?action=createPeriod&database=' + config.database, {
    name: this.period_name.value,
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
  
  this.submit.innerHTML = 'Creating...';
  
  // Disable default form action
  return false;
}