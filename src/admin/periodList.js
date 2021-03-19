import post from './post.js';
import { renderGroups } from './groups.js';
import { renderCreateNewPeriod } from './createPeriod.js';
import { loadPeriod } from './sportList.js';
import { disconnect } from './admin.js';
import { uploadStudentData, uploadPaidData, uploadTeacherData } from './studentUpload.js';
import { sendEmails } from './sendEmails.js';

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
      <h2 id="name">Getting started</h2>
      <h3>1. Upload student emails</h3>
      <p>Upload a csv containing emails and year levels.<br/>The students will be emailed a link they can use to log into ${location.host}.</p>
      <a href="How to generate a csv of EQIDs Birthdays and Year levels in IDAttend.pdf" target="_blank">How to generate this in IDAttend<sup class="fas fa-external-link-alt"></sup></a>
      <p id="studentDataError"></p>
      <input type="file" id="studentDataUpload" accept="text/csv"/>
      <small>Note: For EQ schools, an MISID will suffice for the email</small><br/>
      <small>Privacy Note: Only the emails and year levels will be uploaded to the server. Any other data will be filtered out.</small>
      <h3>2. Upload paid students (optional)</h3>
      <p>Upload a csv containing emails of students who have paid.</p>
      <p id="paidDataError"></p>
      <input type="file" id="paidStudentDataUpload" accept="text/csv"/>
      <small>Privacy Note: Only the student emails will be uploaded to the server. Any other data will be filtered out.</small>
      <h3>3. Upload teachers (optional)</h3>
      <p>Upload a csv containing emails of teachers.</p>
      <a href="How to export teacher emails in IDAttend.pdf" target="_blank">How to generate this in IDAttend<sup class="fas fa-external-link-alt"></sup></a>
      <p id="teacherDataError"></p>
      <input type="file" id="teacherDataUpload" accept="text/csv"/>
      <small>Privacy Note: Only the teacher emails will be uploaded to the server. Any other data will be filtered out.</small>
      <h3>4. Create a period</h3>
      <p>On the top left, click 'New Period' to create a selection period.</p>
      <h3>5. Create a sport</h3>
      <p>After clicking on your newly created period on the left, a 'New Sport' button will appear to the right of it. Click it to create a sport.</p>
      <h3>6. Send login codes</h3>
      <p>Click the button below to send login codes to all users for accessing the site.</p>
      <button id="sendEmails" class="download" type="button">Send login codes <i class="fas fa-paper-plane"></i></button>
      <small>This will send <span id="emailsToSend"></span> emails</small><br/>
      <small>Note: It may take a few minutes for emails to send</small>
      <h3>User counts</h3>
      <p>The counts of users in each group, for verifying the upload worked successfully</p>
      <p id="studentCounts"></p>
      `;
    document.querySelector('.periodlist').innerHTML = '<h2 id="periodlist" class="visuallyhidden">Period List</h2><ul></ul>';
    document.getElementById('studentDataUpload').onchange = uploadStudentData;
    document.getElementById('paidStudentDataUpload').onchange = uploadPaidData;
    document.getElementById('teacherDataUpload').onchange = uploadTeacherData;
    document.getElementById('sendEmails').onclick = sendEmails;
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
  
  renderGroups();
  
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