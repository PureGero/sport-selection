import post from './post.js';
import { requestGroups } from './groups.js';

export function sendEmails() {
  const button = this;

  button.innerHTML = 'Sending...';
  
  post(config.adminEndPoint + '?action=sendEmails&database=' + config.database, {
    host: location.host,
    title: config.title,
    darkColor: config.darkColor
  }, (json, err) => {
    if (err || json.error) {
      button.innerHTML = err || json.error;
    } else {
      button.innerHTML = `Sent ${json.count} emails`;
      requestGroups();
    }
  });
}