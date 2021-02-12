import post from './post.js';
import { datetimeLocal } from './periodList.js';

export function renderPeriodInfo(json) {
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
      <button id="download" class="download" type="button">Download Selections <i class="fas fa-download"></i></button>
      <label for="studentData">Want more detailed student data?<br/>Upload the student data csv below:</label>
      <input type="file" id="studentData" accept="text/csv"/>
      <p id="studentDataError"></p>
    </form>
    `;
  document.querySelector('.sportlist').innerHTML = `<h2 id="sportlist" periodid="${json.period.periodid}" class="visuallyhidden">Sport List</h2><ul></ul>`;

  document.querySelector('.periodlist').querySelectorAll('.active').forEach(period => {
    period.classList.remove('active');
  });

  document.querySelector('.periodlist').querySelector(`.period${json.period.periodid}`).classList.add('active');

  document.getElementById('download').onclick = downloadSelections;

  document.getElementById('studentData').onchange = storeStudentData;
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

      downloadSelections.apply(button);

      document.getElementById('studentDataError').innerHTML = `Found ${Object.keys(students).length} students, downloading selections...`;
    } catch (e) {
      document.getElementById('studentDataError').className = 'error';
      document.getElementById('studentDataError').innerHTML = e;
    }
  };
  fr.readAsText(file);
}

function storeStudentData() {
  for (let i = 0; i < this.files.length; i++) {
    storeStudentDataFile(this, this.files[i]);
  }
}

function downloadSelections() {
  const form = this.form;
  
  form.download.innerText = 'Downloading...';

  post(config.adminEndPoint + '?action=downloadSelections&database=' + config.database, {
    periodid: form.periodid.value
  }, (json, err) => {
    if (err || json.error) {
      disconnect(err || json.error);
    } else {
      downloadSelectionsCsv(json.name, json.csv);
      form.download.innerText = 'Downloaded';
    }
  });
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