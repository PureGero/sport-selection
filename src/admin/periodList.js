import post from './post.js';
import { requestGroups } from './groups.js';
import { renderCreateNewPeriod } from './createPeriod.js';
import { loadPeriod } from './sportList.js';
import { disconnect } from './admin.js';

export function loadPeriodList() {
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

export function renderPeriodList(json) {
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
  
  requestGroups();
  
  doCountdown();
}

export function doCountdown() {
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

export function datetimeLocal(millis) {
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