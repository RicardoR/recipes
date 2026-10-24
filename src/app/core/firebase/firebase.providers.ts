import {EnvironmentProviders, InjectionToken, inject, makeEnvironmentProviders} from '@angular/core';
import {FirebaseApp, initializeApp} from 'firebase/app';
import {Firestore, getFirestore} from 'firebase/firestore';
import {Auth, getAuth} from 'firebase/auth';
import {FirebaseStorage, getStorage} from 'firebase/storage';
import {Analytics, getAnalytics} from 'firebase/analytics';
import {environment} from '../../../environments/environment';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FirebaseApp');
export const FIRESTORE = new InjectionToken<Firestore>('Firestore');
export const FIREBASE_AUTH = new InjectionToken<Auth>('Auth');
export const FIREBASE_STORAGE = new InjectionToken<FirebaseStorage>('FirebaseStorage');
export const FIREBASE_ANALYTICS = new InjectionToken<Analytics>('Analytics');

export const firebaseProviders: EnvironmentProviders = makeEnvironmentProviders([
  {provide: FIREBASE_APP, useFactory: () => initializeApp(environment.firebase)},
  {provide: FIRESTORE, useFactory: () => getFirestore(inject(FIREBASE_APP))},
  {provide: FIREBASE_AUTH, useFactory: () => getAuth(inject(FIREBASE_APP))},
  {provide: FIREBASE_STORAGE, useFactory: () => getStorage(inject(FIREBASE_APP))},
  {provide: FIREBASE_ANALYTICS, useFactory: () => getAnalytics(inject(FIREBASE_APP))},
]);
