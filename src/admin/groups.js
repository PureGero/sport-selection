import post from './post.js';

export let globalGroups = [];
let groupCounts = null;

export function updateGroups(groups, callback) {
  post(config.adminBulkEndPoint + '?action=updateGroups&database=' + config.database, {
    groups
  }, (json, err) => {
    if (err || json.error) {
      callback(null, err || json.error);
    } else {
      callback(json);
    }
  });
}

export function updatePaidGroups(students, callback) {
  post(config.adminBulkEndPoint + '?action=updatePaidGroups&database=' + config.database, {
    students
  }, (json, err) => {
    if (err || json.error) {
      callback(null, err || json.error);
    } else {
      callback(json);
    }
  });
}

export function requestGroups() {
  post(config.adminEndPoint + '?action=groups&database=' + config.database, {}, (json, err) => {
    if (err || json.error) {
      throw err || json.error;
    } else {
      groupCounts = json.groups;
      globalGroups = Object.keys(json.groups).sort();
      renderStudentCounts();
    }
  });
}

export function renderGroups() {
  if (groupCounts === null) {
    requestGroups();
  } else {
    renderStudentCounts();
  }
}

function renderStudentCounts() {
  const studentCounts = document.getElementById('studentCounts');

  if (studentCounts) {
    studentCounts.innerHTML = Object.entries(groupCounts).map(
      ([key, value]) => `${key}: ${value} student${value == 1 ? '' : 's'}`
    ).join('<br/>');
  }
}