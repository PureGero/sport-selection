import post from './post.js';

export let globalGroups = [];
let groupCounts = null;
let total = 0;
let emailsSent = 0;

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
      total = json.total;
      emailsSent = json.emailsSent;
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
      ([key, value]) => `${key}: ${value} user${value == 1 ? '' : 's'}`
    ).join('<br/>');
  }

  const emailsToSend = document.getElementById('emailsToSend');

  if (emailsToSend) {
    emailsToSend.innerHTML = total - emailsSent;
  }
}