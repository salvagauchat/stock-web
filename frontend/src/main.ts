import { bootstrapApplication } from '@angular/platform-browser';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { appConfig } from './app/app.config';
import { App } from './app/app';

addIcons({ 'log-out-outline': logOutOutline });

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
