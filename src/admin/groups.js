import post from './post.js';

export const groups = [];

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

}