import './admin.scss';
import post from './post.js';

let groups = [];

let ws = {};

function disconnect(error) {
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

ws.onopen = () => {
  document.querySelector('.disconnected').style.display = 'none';
}

function send(json) {
  // ws.send(JSON.stringify(json));
}

function login() {
  document.querySelector('.error').innerHTML = '';
  
  post(config.adminEndPoint + '?action=login&database=' + config.database, {
    username: this.username.value,
    password: this.password.value
  }, (json, err) => {
    if (err || json.error) {
      document.querySelector('.error').innerText = err || json.error;
      this.submit.innerText = 'Login';
    } else {
      init(json.username);
    }
  });
  
  this.submit.innerText = 'Logging in...';
  
  // Disable default form action
  return false;
}

function init(username) {
  document.querySelector('h1').onclick = loadPeriodList;
  document.getElementById('loginstatus').innerHTML = 'Logged in as ' + username;
  
  loadPeriodList();
}

function loadPeriodList() {
  document.querySelector('.periodlist').innerHTML = '<h2 id="periodlist">Loading...</h2>';
  document.querySelector('.sportlist').innerHTML = '';
  document.querySelector('main').innerHTML = '<h2 id="name">Loading period list...</h2>';
  
  post(config.adminEndPoint + '?action=periodList&database=' + config.database, {}, (json, err) => {
    if (err) {
      disconnect(err);
    } else {
      renderPeriodList(json);
    }
  });
}

function requestStudentCounts() {
  send({
    action: 'studentcounts'
  });
}

function renderStudentCounts(counts) {
  const studentCounts = document.getElementById('studentCounts');

  if (studentCounts) {
    studentCounts.innerHTML = Object.entries(counts).map(
      ([key, value]) => `${~key.indexOf('_') ? key.substr(key.indexOf('_') + 1) : key}: ${value} student${value == 1 ? '' : 's'}`
    ).join('<br/>');
  }
}

function uploadStudentDataFile(file) {
  console.log('Processing ' + file.name);
  document.getElementById('studentDataError').className = '';
  document.getElementById('studentDataError').innerHTML = `Processing ${file.name}`;

  const fr = new FileReader();
  fr.onload = function() {
    try {
      const csv = fr.result.split('\n');
      const students = {};

      csv.forEach(entry => {
        const columns = entry.trim().split(',');
        const student = {};

        columns.forEach(column => {
          if (/[0-9]{10,10}[A-Z]/.test(column)) {
            student.username = column;
          } else if (/[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{1,4}/.test(column)) {
            student.password = column;
          } else if (/[0-9]{1,2}/.test(column) && parseInt(column) >= 7 && parseInt(column) <= 12) {
            student.year = column;
          }
        });

        if ((student.username || student.password || student.year) &&
            !(student.username && student.password && student.year)) {
          throw 'Invalid student entry: ' + entry;
        }

        if (student.username) {
          students[student.username] = student;
        }
      });

      console.log(students);

      send({
        action: 'uploadstudents',
        students: Object.values(students)
      });

      document.getElementById('studentDataError').innerHTML = `Uploaded ${Object.keys(students).length} students`;
    } catch (e) {
      document.getElementById('studentDataError').className = 'error';
      document.getElementById('studentDataError').innerHTML = e;
    }
  };
  fr.readAsText(file);
}

function uploadStudentData(input) {
  for (let i = 0; i < input.files.length; i++) {
    uploadStudentDataFile(input.files[i]);
  }

  setTimeout(requestStudentCounts, 1000);
}

function uploadPaidDataFile(file) {
  console.log('Processing ' + file.name);
  document.getElementById('paidDataError').className = '';
  document.getElementById('paidDataError').innerHTML = `Processing ${file.name}`;

  const fr = new FileReader();
  fr.onload = function() {
    try {
      const csv = fr.result.split('\n');
      const students = {};

      csv.forEach(entry => {
        const columns = entry.trim().split(',');
        const student = {};

        columns.forEach(column => {
          if (/[0-9]{10,10}[A-Z]/.test(column)) {
            student.username = column;
          }
        });

        if (student.username) {
          students[student.username] = student;
        }
      });

      console.log(students);

      send({
        action: 'uploadpaids',
        students: Object.values(students)
      });

      document.getElementById('paidDataError').innerHTML = `Uploaded ${Object.keys(students).length} paid students`;
    } catch (e) {
      document.getElementById('paidDataError').className = 'error';
      document.getElementById('paidDataError').innerHTML = e;
    }
  };
  fr.readAsText(file);
}

function uploadPaidData(input) {
  for (let i = 0; i < input.files.length; i++) {
    uploadPaidDataFile(input.files[i]);
  }

  setTimeout(requestStudentCounts, 1000);
}

let studentData = null;

function storeStudentDataFile(button, file) {
  studentData = {};
  console.log('Processing ' + file.name);
  document.getElementById('studentDataError').className = '';
  document.getElementById('studentDataError').innerHTML = `Processing ${file.name}`;

  const fr = new FileReader();
  fr.onload = function() {
    try {
      const csv = fr.result.split('\n');
      const students = {};
      const deleteColums = {};

      csv.forEach(entry => {
        const columns = entry.trim().split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const student = {};

        columns.forEach(column => {
          if (/[0-9]{10,10}[A-Z]/.test(column)) {
            student.username = column;
          }
        });

        if (student.username) {
          if (students[student.username]) {
            students[student.username].forEach((column, index) => {
              if (columns[index] != column && !deleteColums[index]) {
                console.log(index + '. ' + columns[index] + ' != ' + column);
                deleteColums[index] = true;
              }
            });
          }

          students[student.username] = columns;
        }
      });

      console.log(students);
      console.log(deleteColums);

      Object.keys(students).forEach(key => {
        students[key] = students[key].filter((column, index) => !deleteColums[index]);
      });

      studentData = students;

      downloadSelections(button);

      document.getElementById('studentDataError').innerHTML = `Found ${Object.keys(students).length} students, downloading selections...`;
    } catch (e) {
      document.getElementById('studentDataError').className = 'error';
      document.getElementById('studentDataError').innerHTML = e;
    }
  };
  fr.readAsText(file);
}

function storeStudentData(input) {
  for (let i = 0; i < input.files.length; i++) {
    storeStudentDataFile(input, input.files[i]);
  }
}

function renderPeriodList(json) {
  if (!json.periodList) return;

  if (document.querySelector('.periodlist').innerHTML.indexOf('Loading...') >= 0) {
    // Render main aswell
    document.querySelector('main').innerHTML = `
      <h2 id="name">Select a period on the left</h2>
      <h3>Upload student data</h3>
      <p>Upload a csv containing student ids, birthdays and year levels.<br/>The student ids will be the student's username to log into<br/>${location.host}, and the birthdays will be the password.</p>
      <a href="How to generate a csv of EQIDs Birthdays and Year levels in IDAttend.pdf" target="_blank">How to generate this in IDAttend<sup class="fas fa-external-link-alt"></sup></a>
      <p id="studentDataError"></p>
      <input type="file" onchange="uploadStudentData(this)" accept="text/csv"/>
      <h3>Upload paid students (optional)</h3>
      <p>Upload a csv containing student ids of students who have paid.</p>
      <p id="paidDataError"></p>
      <input type="file" onchange="uploadPaidData(this)" accept="text/csv"/>
      <h3>Student counts</h3>
      <p>The counts of students in each group, for verifying the upload worked successfully</p>
      <p id="studentCounts"></p>
      `;
    document.querySelector('.periodlist').innerHTML = '<h2 id="periodlist" class="visuallyhidden">Period List</h2><ul></ul>';
  }
  
  // Update
  const ul = document.querySelector('.periodlist').querySelector('ul');
  
  if (!ul.querySelector('.new')) {
    ul.innerHTML += '<li class="new"><h3>New Period</h3></li>';
  }
  
  json.periodList.forEach(period => {
    let li = ul.querySelector(`.period${period.periodid}`);
    
    if (!li) {
      ul.innerHTML += `<li class="period period${period.periodid}" data-periodid="${period.periodid}"><h3></h3><span class="time"></span></li>`;
      li = ul.querySelector(`.period${period.periodid}`);
    }
  
    let time;
    
    if (period.opens > Date.now()) {
      time = `Opens <time class="countdown" datetime="${datetime(period.opens)}"></time>`;
    } else if (period.closes > Date.now()) {
      time = `Closes <time class="countdown" datetime="${datetime(period.closes)}"></time>`;
    } else {
      time = `Closed`;
    }
    
    li.querySelector('h3').innerHTML = period.name;
    li.querySelector('.time').innerHTML = time;
  });

  ul.querySelectorAll('.new').forEach(li => li.onclick = renderCreateNewPeriod);
  ul.querySelectorAll('.period').forEach(li => li.onclick = loadPeriod);
  
  requestStudentCounts();
  
  doCountdown();
}

function renderCreateNewPeriod() {
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
  const createText = this.submit.innerText;

  post(config.adminEndPoint + '?action=createPeriod&database=' + config.database, {
    name: this.period_name.value,
    opens: new Date(this.opens.value).getTime(),
    closes: new Date(this.closes.value).getTime(),
    description: this.description.value
  }, (json, err) => {
    if (err || json.error) {
      document.querySelector('.error').innerText = err || json.error;
      this.submit.innerText = createText;
    } else {
      renderPeriodList(json);
      renderSportList(json);
    }
  });
  
  this.submit.innerText = 'Creating...';
  
  // Disable default form action
  return false;
}

function loadPeriod() {
  const periodid = this.dataset.periodid;

  console.log(`Loading period ${periodid}`);

  document.querySelector('.sportlist').innerHTML = '<h2 id="sportlist">Loading...</h2>';
  document.querySelector('main').innerHTML = '<h2 id="name">Loading period...</h2>';
  
  send({
    action: 'sportlist',
    periodid: periodid
  });
}

function renderSportList(json) {
  if (!json.sportList) return;

  if (json.period && (
      document.querySelector('.sportlist').innerHTML.length == 0 ||
      document.querySelector('.sportlist').innerHTML.indexOf('Loading...') >= 0
  )) {
    // Render main aswell
    document.querySelector('main').innerHTML = `
      <form onsubmit="return submitPeriod(this)">
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
  
  if (!ul.querySelector('.new')) {
    ul.innerHTML += `<li class="new" onclick="renderCreateNewSport(${json.period.periodid})"><h3>New Sport</h3></li>`;
  }
  
  json.sportList.forEach(sport => {
    let li = ul.querySelector(`.sport${sport.sportid}`);
    
    if (!li) {
      ul.innerHTML += `<li class="sport${sport.sportid}" onclick="loadSport(${json.period.periodid},${sport.sportid})"><h3></h3><span class="users"></span></li>`;
      li = ul.querySelector(`.sport${sport.sportid}`);
    }
    
    li.querySelector('h3').innerHTML = sport.name;
    li.querySelector('.users').innerHTML = `${sport.users}/${sport.maxusers} users`;
  });

  doCountdown();
}

function downloadSelections(button) {
  const form = button.form;

  send({
    action: 'downloadselections',
    periodid: form.periodid.value
  });
  
  form.download.innerText = 'Downloading...';
}

function downloadSelectionsCsv(name, csv) {
  if (studentData) {
    csv = csv.split('\n').map(line => {
      const username = line.substr(0, line.indexOf(','));

      if (username in studentData) {
        return studentData[username].join(',') + line.substr(line.indexOf(','));
      } else {
        return line;
      }
    }).join('\n');

    studentData = null;
  }

  const blob = new Blob([csv], {type: 'text/csv'});
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = name + '.csv';
  link.innerHTML = 'Download ' + name;
  link.click();

  document.querySelector('.download').innerText = 'Downloaded';
}

function submitPeriod(form) {
  send({
    action: 'updateperiod',
    periodid: form.periodid.value,
    name: form.querySelector('#name').innerText,
    opens: new Date(form.opens.value).getTime(),
    closes: new Date(form.closes.value).getTime(),
    description: form.description.value,
  });
  
  form.submit.innerText = 'Saving...';

  document.querySelector('.sportlist').innerHTML = '';
  
  // Disable default form action
  return false;
}

function renderCreateNewSport(periodid) {
  let allowed = '';
  
  groups.forEach(group => {
    const groupName = ~group.indexOf('_') ? group.substr(group.indexOf('_') + 1) : group;
    allowed += `<li><input type="checkbox" id="allowed.${group}" name="allowed.${group}" value="${group}"/><label for="allowed.${group}">${groupName}</label></li>`;
  });

  document.querySelector('.sportlist').querySelectorAll('.active').forEach(period => {
    period.classList.remove('active');
  });

  document.querySelector('.sportlist').querySelector('.new').classList.add('active');

  document.querySelector('main').innerHTML = `
    <form onsubmit="return createSport(this)">
      <h2 id="name">Create new sport</h2>
      <input type="hidden" name="periodid" value="${periodid}"/>
      <label for="sport_name">Name:</label>
      <input type="text" id="sport_name" name="sport_name"/>
      <label for="maxusers">Max users:</label>
      <input type="number" id="maxusers" name="maxusers" value="25"/>
      <label for="description">Description:</label>
      <textarea id="description" name="description"></textarea>
      <label for="allowed">Allowed groups:</label>
      <ul id="allowed">${allowed}</ul>
      <button id="submit">Create <i class="fas fa-plus-square"></i></button>
    </form>
    `;
  document.querySelector('#sport_name').focus();
}

function createSport(form) {
  let allowed = [];

  form.querySelectorAll('input[type=checkbox]:checked').forEach(checkbox => {
    allowed.push(checkbox.value);
  });

  send({
    action: 'createsport',
    periodid: form.periodid.value,
    name: form.sport_name.value,
    maxusers: form.maxusers.value,
    description: form.description.value,
    allowed: allowed,
  });
  
  form.submit.innerText = 'Creating...';
  
  // Disable default form action
  return false;
}

function loadSport(periodid, sportid) {
  document.querySelector('main').innerHTML = '<h2 id="name">Loading sport...</h2>';
  
  send({
    action: 'sportinfo',
    periodid: periodid,
    sportid: sportid
  });
}

function renderSportInfo(json) {
  let allowed = '';
  
  groups.forEach(group => {
    // Remove the username prefix from the group name
    const groupName = ~group.indexOf('_') ? group.substr(group.indexOf('_') + 1) : group;
    const selected = ~json.sport.allowed.indexOf(group) ? 'checked' : '';
    allowed += `<li><input type="checkbox" id="allowed.${group}" name="allowed.${group}" value="${group}" ${selected}/><label for="allowed.${group}">${groupName}</label></li>`;
  });
  
  json.sport.allowed.forEach(group => {
    if (!~groups.indexOf(group)) {
      const groupName = ~group.indexOf('_') ? group.substr(group.indexOf('_') + 1) : group;
      allowed += `<li><input type="checkbox" id="allowed.${group}" name="allowed.${group}" value="${group}" checked/><label for="allowed.${group}">${groupName}</label></li>`;
    }
  });

  document.querySelector('.sportlist').querySelectorAll('.active').forEach(period => {
    period.classList.remove('active');
  });

  document.querySelector('.sportlist').querySelector(`.sport${json.sport.sportid}`).classList.add('active');
  
  document.querySelector('main').innerHTML = `
    <form onsubmit="return submitSport(this)">
      <h2 id="name" contenteditable>${json.sport.name}</h2>
      <input type="hidden" name="periodid" value="${json.period.periodid}"/>
      <input type="hidden" name="sportid" value="${json.sport.sportid}"/>
      <label for="maxusers">Max users:</label>
      <input type="number" id="maxusers" name="maxusers" value="${json.sport.maxusers}"/>
      <label for="description">Description:</label>
      <textarea id="description" name="description">${json.sport.description}</textarea>
      <label for="allowed">Allowed groups:</label>
      <ul id="allowed">${allowed}</ul>
      <label for="users">Users enrolled (${json.sport.users.length}):</label>
      <div id="users">
        ${json.sport.users.map(renderUser).join('\n')}
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

function submitSport(form) {
  let allowed = [];

  form.querySelectorAll('input[type=checkbox]:checked').forEach(checkbox => {
    allowed.push(checkbox.value);
  });

  send({
    action: 'updatesport',
    periodid: form.periodid.value,
    sportid: form.sportid.value,
    name: form.querySelector('#name').innerText,
    maxusers: form.maxusers.value,
    description: form.description.value,
    allowed: allowed,
  });
  
  form.submit.innerText = 'Saving...';
  
  // Disable default form action
  return false;
}

function deleteSport(button) {
  let form = button.form;

  if (!confirm(`Are you sure you want to delete ${form.querySelector('#name').innerText}?`)) {
    return;
  }

  send({
    action: 'deletesport',
    periodid: form.periodid.value,
    sportid: form.sportid.value
  });

  document.querySelector('.sportlist').innerHTML = '<h2 id="sportlist">Loading...</h2>';
  document.querySelector('main').innerHTML = '<h2 id="name">Deleting sport...</h2>';
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

function doCountdown() {
  document.querySelectorAll('time.countdown').forEach(element => {
    countdown(element);
  });
}

setInterval(doCountdown, 1000);

function countdown(element) {
  let timeDiff = new Date(element.dateTime) - new Date();

  element.innerHTML = prettifyTime(timeDiff);
}

function datetime(millis) {
  return datetimeLocal(millis).replace(/-/g, "/").replace("T", " ");
}

function datetimeLocal(millis) {
  const time = new Date(millis);
  const offsetMs = time.getTimezoneOffset() * 60 * 1000;
  const dateLocal = new Date(time.getTime() - offsetMs);
  return dateLocal.toISOString().slice(0, 19);
}

function prettifyTime(millis) {
  if (millis < 0) {
    if (millis > -60000) {
      return "now";
    } else {
      return prettifyTime(-millis).replace('in ', '') + ' ago';
    }
  }

  var seconds = Math.floor(millis/1000);
  var minutes = Math.floor(seconds/60);
  var hours = Math.floor(minutes/60);
  var days = Math.floor(hours/24);
  
  if (seconds < 1) {
    return "in " + seconds + " seconds";
  } else if (seconds < 2) {
    return "in " + seconds + " second";
  } else if (seconds < 60) {
    return "in " + seconds + " seconds";
  } else if (minutes < 2) {
    return "in " + minutes + " minute";
  } else if (minutes < 60) {
    return "in " + minutes + " minutes";
  } else if (hours < 2) {
    return "in " + hours + " hour";
  } else if (hours < 24) {
    return "in " + hours + " hours";
  } else if (days < 2) {
    return "in " + days + " day";
  } else {
    return "in " + days + " days";
  }
}

const loginForm = document.querySelector('#loginForm');

if (loginForm) {
  loginForm.onsubmit = login;
}