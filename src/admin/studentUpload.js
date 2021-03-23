import post from './post.js';
import { requestGroups, updateGroups, updatePaidGroups } from './groups.js';

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
          if (/^[a-z]{1,5}[0-9]{1,10}$/.test(column)) {
            student.misid = column;
          } else if (~column.indexOf('@')) {
            if (student.email) {
              throw 'Multiple emails detected: ' + entry;
            }
            student.email = column;
          } else if (/^[0-9]{1,2}$/.test(column) && parseInt(column) >= 7 && parseInt(column) <= 12) {
            if (student.year) {
              throw 'Multiple year levels detected: ' + entry;
            }
            student.year = column;
          }
        });

        if (!student.email && student.misid) {
          student.email = `${student.misid}@eq.edu.au`;
        }

        if ((student.email || student.year) &&
            !(student.email && student.year)) {
          throw 'Invalid student entry: ' + entry;
        }

        if (student.email) {
          delete student.misid;
          students[student.email] = student;
        }
      });

      console.log(students);

      Object.values(students).forEach(student => {
        const yearGroup = `Year${student.year}`;
        const splitGroup = student.year <= 9 ? 'Junior' : 'Senior';

        if (!(yearGroup in groups)) groups[yearGroup] = [];
        if (!(splitGroup in groups)) groups[splitGroup] = [];

        groups[yearGroup].push(student.email);
        groups[splitGroup].push(student.email);
      });

      console.log(groups);

      document.getElementById('studentDataError').innerHTML = `Uploading ${file.name}...`;

      updateGroups(groups, (json, err) => {
        if (err || json.error) {
          document.querySelector('#studentDataError').innerText = err || json.error;
        } else {
          document.getElementById('studentDataError').innerHTML = `Uploaded ${Object.keys(students).length} students`;

          requestGroups();
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
          if (/^[a-z]{1,5}[0-9]{1,10}$/.test(column)) {
            student.misid = column;
          } else if (~column.indexOf('@')) {
            if (student.email) {
              throw 'Multiple emails detected: ' + entry;
            }
            student.email = column;
          }
        });

        if (!student.email && student.misid) {
          student.email = `${student.misid}@eq.edu.au`;
        }

        if (student.email) {
          delete student.misid;
          students[student.email] = student;
        }
      });

      console.log(students);

      document.getElementById('paidDataError').innerHTML = `Uploading ${file.name}...`;

      updatePaidGroups(students, (json, err) => {
        if (err || json.error) {
          document.querySelector('#paidDataError').innerText = err || json.error;
        } else {
          document.getElementById('paidDataError').innerHTML = `Uploaded ${Object.keys(students).length} paid students`;

          requestGroups();
        }
      });
    } catch (e) {
      document.getElementById('paidDataError').className = 'error';
      document.getElementById('paidDataError').innerHTML = e;
    }
  };
  fr.readAsText(file);
}

export function uploadPaidData() {
  for (let i = 0; i < this.files.length; i++) {
    uploadPaidDataFile(this.files[i]);
  }
}

function uploadTeacherDataFile(file) {
  console.log('Processing ' + file.name);
  document.getElementById('teacherDataError').className = '';
  document.getElementById('teacherDataError').innerHTML = `Processing ${file.name}`;

  const fr = new FileReader();
  fr.onload = function() {
    try {
      const csv = fr.result.split('\n');
      const teachers = {};

      csv.forEach(entry => {
        const columns = entry.trim().split(',');
        const teacher = {};

        columns.forEach(column => {
          if (~column.indexOf('@')) {
            if (teacher.email) {
              throw 'Multiple emails detected: ' + entry;
            }
            teacher.email = column;
          }
        });

        if (teacher.email) {
          teachers[teacher.email] = teacher;
        }
      });

      const groups = { Teacher: Object.keys(teachers) };

      console.log(groups);

      document.getElementById('teacherDataError').innerHTML = `Uploading ${file.name}...`;

      updateGroups(groups, (json, err) => {
        if (err || json.error) {
          document.querySelector('#teacherDataError').innerText = err || json.error;
        } else {
          document.getElementById('teacherDataError').innerHTML = `Uploaded ${teachers.length} teachers`;

          requestGroups();
        }
      });
    } catch (e) {
      document.getElementById('teacherDataError').className = 'error';
      document.getElementById('teacherDataError').innerHTML = e;
    }
  };
  fr.readAsText(file);
}

export function uploadTeacherData() {
  for (let i = 0; i < this.files.length; i++) {
    uploadTeacherDataFile(this.files[i]);
  }
}