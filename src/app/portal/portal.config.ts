/*
 * Copyright (c) 2026 AMSIDEL Technologies. All rights reserved.
 * Designed and developed by AMSIDEL Technologies.
 */
// Where the staff portal finds the companyportal-backend API.
// TODO (production): set PRODUCTION_API to the URL where companyportal-backend is deployed, and keep
// BACKEND_HEALTH in worker/index.js in step with it.
const LOCAL_API = 'http://localhost:8080';
const PRODUCTION_API = 'https://companyportal-backend.onrender.com';

const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const API_BASE = isLocal ? LOCAL_API : PRODUCTION_API;

/** Sent with each attendance check-in (device info); raise it with each release. */
export const APP_VERSION = '1.0.0';
