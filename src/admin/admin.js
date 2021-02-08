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

import { login } from './login.js';

const loginForm = document.querySelector('#loginForm');

if (loginForm) {
  loginForm.onsubmit = login;
}