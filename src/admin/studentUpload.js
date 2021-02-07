import post from './post.js';
import { requestGroups, updateGroups } from './groups.js';

function uploadStudentDataFile(file) {
  console.log('Processing ' + file.name);
  document.getElementById('studentDataError').className = '';
  document.getElementById('studentDataError').innerHTML = `Processing ${file.name}...`;

  const fr = new FileReader();
  fr.onload = function() {
    try {
      const csv = fr.result.split('\n');
      const students = {};
      const groups = {};

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

      Object.values(students).forEach(student => {
        const yearGroup = `Year${student.year}`;
        const splitGroup = student.year <= 9 ? 'Junior' : 'Senior';

        if (!(yearGroup in groups)) groups[yearGroup] = [];
        if (!(splitGroup in groups)) groups[splitGroup] = [];

        groups[yearGroup].push(student.username);
        groups[splitGroup].push(student.username);
      });

      console.log(groups);

      document.getElementById('studentDataError').innerHTML = `Uploading ${file.name}...`;

      post(config.adminBulkEndPoint + '?action=uploadStudents&database=' + config.database, {
        students: Object.values(students)
      }, (json, err) => {
        if (err || json.error) {
          document.querySelector('#studentDataError').innerText = err || json.error;
        } else {
          document.getElementById('studentDataError').innerHTML = `Updating groups...`;

          updateGroups(groups, (json, err) => {
            if (err || json.error) {
              document.querySelector('#studentDataError').innerText = err || json.error;
            } else {
              document.getElementById('studentDataError').innerHTML = `Uploaded ${Object.keys(students).length} students`;

              requestGroups();
            }
          });
        }
      });
    } catch (e) {
      document.getElementById('studentDataError').className = 'error';
      document.getElementById('studentDataError').innerHTML = e;
    }
  };
  fr.readAsText(file);
}

export function uploadStudentData() {
  for (let i = 0; i < this.files.length; i++) {
    uploadStudentDataFile(this.files[i]);
  }
}