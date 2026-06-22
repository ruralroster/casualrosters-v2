/**
 * Rural Rosters Backend V2 - Staging
 * Staging credentials + clear-first vacancies + mailto links + checkUserExists fix
 */

const http = require('http');
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const nodemailer = require('nodemailer');

const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "rural-rosters-staging",
  private_key_id: "65a00fe4a4a7a42c29021c82bd9a64cc8e50b134",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7LrAStRZ7kcFC\ngP5mTxwPPmictBHHBOI2zUhBT3qMNshLLOWUA4kTIVu6rWtW5nyg0jNr1246FSsc\nTukTv99YP8OIEh4qRYr1OLV7DQCg2Jqy1fLPqTzAxIcO+3PK05ASDLe7VR+0M6Bj\nEWk2pGP3LhoDQnQ9tLACsjjH9k7KBWAumXCvKNHrbV2VUQH2PbWfwQUx0VoEHUui\ndZsnpjdGeRMdrfhtJaqw7yN13eEu9+NX7RGE3ALrSl2yJuy2iXhPmQkPb7utcDGG\nrwzF79ypPJAtI6JupO5eX4PiqV8m1l4Ygv2cLcLBvzjdFM0XZofEnja0iwmmlaQf\n1AbPglgtAgMBAAECggEAASChHV+7XK+uURL7VUztL5dR5H2+LKt2HFvkr0YGCDGt\nR6yjzl4uFXAqQAfa4Wlef0580k24I3/spE1CYKTTeNHbgOaRCXKlSWBX0X+szQs4\n9VJOFdugWs3kPV4c3rAjCkTK14VF/V0hPm+EqXhYhMzhibr8/cEonT+LEYNFirh2\naMy+vXQkH3xSsEmiZsSrNUfrmPHq+XCSRD258xA1ldiYa5OUrViJLOuEvf9Su5r4\nr64YVUzhsq6WHniFhJMhrAdHLL4GohvCEqT2SiGVOa3TOPSboPLwN60ESyoJBEUx\nzJK5dgYipIWH4Xs77K9o7umQCm5h1U4fHPiBLMwT2QKBgQD5RZ6Gv7H6neocNDFi\ntnnSY7m2sJSYeDsKYy+6nGcQ7/PfSx/l3Wmf1DcFKDjM1ZL6M2JVNRpxnb+rqhQo\nstE+lCzSIkAzM0YZhtek3fcXWhkMiTYzFDtDgeR63p93e+ikuIlrKNMaoOFZda6h\nNAs8J8/okJ5+Rerh6WlL9nb9hQKBgQDAPA01W649MvVxTCljpi87TXR/ZIffoedP\nJk9RrvlWnb1JwqpxSrEqgXo+EfB7WMZ8GDMti3EnOt/xD+0oy7BIi02aTDmA7qSL\nf2nZqNMWhwpJQSOxdude6UyGOSpgF73Z8377L68t8byzIpUWYKByefN2g6ElRxSE\n3k4Z0ju8iQKBgQDyUbBas60zwSFdS4uat2LTmGhn5V5+nZpfba5vTS2QNIMxVVlr\n3oKYgfb+h2w4C4K2wQ7dYCMVwdEa8tpn+fUZTXgIyoz4eOazV/b36WMTi12AZz6O\nByPZa0MOAq6ou4ab4lyMFIKrhyuqCJG7Wdl2IAmnvjak8Bj2hi37T1u69QKBgEZh\nNgzFBiPN1mKmmbisDTrO/sntSnmr0v39bqjfQNZfZf/tT22vBPIk+VZkRwFB3Vlt\nmr8gAEt2mKqvRArdmCrXJZBKO/tiY8fW3DAeSTpEMpXjTWgZulfbXnL91u/bgVyc\nc28PZDmT+Zw0GxVYRyXiVCqdwo/dWDvVEA8QE2LRAoGBAMBDjK2K8sQp9H3IBl2c\nj6v2qLJbB6FkDvwBkF2WQyHj982LQy9x7XP/He5WyHrSz6LuRaQA2F1S6Hq/Ug5m\npHaT0n+4QPtNkuJ3WtXVQwr9J8nXZTUI4F1CzX3EO9oRerXHFKOwUVShFsxgzClF\ne5FSMVxFFicPiIznVqT21BJ2\n-----END PRIVATE KEY-----\n",
  client_email: "rural-rosters-backend-staging@rural-rosters-staging.iam.gserviceaccount.com",
  client_id: "111139404380576050131",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/rural-rosters-backend-staging%40rural-rosters-staging.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

const GMAIL_USER = 'ruralroster@gmail.com';
const GMAIL_APP_PASSWORD = 'gckg msat pnzq ltug';

// STAGING Sheet ID
const SHEET_ID = '1VPj0f0KPisbr3zTexse_FFsCw4lGMIQCLzMOkEPc6dw';

console.log('[INIT] Starting backend initialization...');

let auth, sheets, transporter;

try {
  console.log('[INIT] Creating JWT auth...');
  auth = new JWT({
    email: SERVICE_ACCOUNT.client_email,
    key: SERVICE_ACCOUNT.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
  console.log('[INIT] JWT created successfully');

  console.log('[INIT] Initializing Google Sheets API...');
  sheets = google.sheets({ version: 'v4', auth });
  console.log('[INIT] Google Sheets API initialized');

  console.log('[INIT] Initializing Nodemailer...');
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
  });
  console.log('[INIT] Nodemailer initialized');

  console.log('[INIT] All initialization complete!');
} catch (err) {
  console.error('[INIT ERROR] Failed to initialize:', err.message);
  console.error(err);
  process.exit(1);
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method === 'GET' && req.url === '/') { res.writeHead(200); res.end(JSON.stringify({ status: 'ok', service: 'Rural Rosters API V2 Staging' })); return; }
  if (req.method !== 'POST') { res.writeHead(405); res.end(JSON.stringify({ error: 'Method not allowed' })); return; }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { action, params } = JSON.parse(body);
      console.log('Action:', action);
      let result;
      switch (action) {
        case 'checkUserExists':           result = await checkUserExists(params.email, params.password); break;
        case 'getOfficerLocations':       result = await getOfficerLocations(params.email); break;
        case 'getStaffLocations':         result = await getStaffLocations(params.email); break;
        case 'getJobTypesForLocation':    result = await getJobTypesForLocation(params.location); break;
        case 'getOfficerVacancies':       result = await getOfficerVacancies(params.email); break;
        case 'getStaffAvailableShifts':   result = await getStaffAvailableShifts(params.email); break;
        case 'requestShifts':             result = await requestShifts(params.email, params.name, params.shifts); break;
        case 'saveOfficerVacancies':      result = await saveOfficerVacancies(params.email, params.vacancies); break;
        case 'listShiftForSwap':          result = await listShiftForSwap(params.email, params.name, params.date, params.jobType, params.location, params.isServiceDisruption, params.availableDays); break;
        case 'getMarketplaceListings':    result = await getMarketplaceListings(params.email); break;
        case 'claimShift':                result = await claimShift(params.claimingEmail, params.claimingName, params.originalEmail, params.originalName, params.date, params.jobType, params.location); break;
        case 'getOfficerMarketplaceListings': result = await getOfficerMarketplaceListings(params.email); break;
        case 'getOfficerPendingApprovals':    result = await getOfficerPendingApprovals(params.email); break;
        case 'getOfficerPastApprovals':       result = await getOfficerPastApprovals(params.email); break;
        case 'approveSwap':               result = await approveSwap(params.claimingEmail, params.claimingName, params.originalEmail, params.originalName, params.officerEmail, params.officerName, params.date, params.jobType, params.location); break;
        case 'denySwap':                  result = await denySwap(params.claimingEmail, params.claimingName, params.originalEmail, params.originalName, params.officerEmail, params.officerName, params.date, params.jobType, params.location); break;
        case 'approvePendingSwap':        result = await approvePendingSwap(params.staffEmail, params.staffName, params.date, params.jobType, params.location); break;
        case 'denySwapWithReason':        result = await denySwapWithReason(params.staffEmail, params.staffName, params.date, params.jobType, params.location, params.reason); break;
        case 'approveShiftRequest':       result = await approveShiftRequest(params.email, params.name, params.date, params.jobType, params.location); break;
        case 'denyShiftRequest':          result = await denyShiftRequest(params.email, params.name, params.date, params.jobType, params.location); break;
        case 'updateUserLocations':       result = await updateUserLocations(params.email, params.locations, params.role); break;
        case 'updateUserAST':             result = await updateUserAST(params.email, params.astQuals); break;
        case 'countPendingRequests':      result = await countPendingRequests(params.email); break;
        default: result = { error: 'Unknown action: ' + action };
      }
      res.writeHead(200);
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error('Error:', err);
      res.writeHead(500);
      res.end(JSON.stringify({ error: err.toString() }));
    }
  });
});

// ============================================================================
// AUTH & USER FUNCTIONS
// ============================================================================

// Fix: immediate return on first email+password match — no collect-then-prefer logic.
// Rule: a user with two rows (Staff + Officer) must have a unique password per row.
// Staff rows should appear before Officer rows in the sheet as a safe default.
async function checkUserExists(email, password) {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Users!A2:G'
    });

    const rows = result.data.values || [];
    const normalizedEmail = email.toLowerCase().trim();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowEmail = String(row[0] || '').toLowerCase().trim();
      const rowPassword = String(row[4] || '').trim();
      const rowRole = String(row[3] || '').trim();

      console.log(`Row ${i}: email="${rowEmail}" role="${rowRole}" passwordMatch=${rowPassword === password}`);

      if (rowEmail === normalizedEmail && rowPassword === password) {
        console.log(`Login match at row ${i}: ${normalizedEmail} as ${rowRole}`);
        return {
          email: row[0],
          name: row[1],
          locations: row[2],
          role: rowRole,
          astQuals: row[6] || 'Emergency'
        };
      }
    }

    return { error: 'Invalid email or password' };
  } catch (err) {
    console.error('checkUserExists error:', err);
    return { error: err.toString() };
  }
}

async function getOfficerLocations(email) {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Rostering Officers!A2:C'
    });

    const rows = result.data.values || [];
    const locations = [];
    const normalizedEmail = String(email).toLowerCase().trim();

    for (let row of rows) {
      const rowEmail = String(row[2]).toLowerCase().trim();
      if (rowEmail === normalizedEmail) {
        const location = String(row[0]).trim();
        if (location && !locations.includes(location)) {
          locations.push(location);
        }
      }
    }

    return locations;
  } catch (err) {
    console.error('getOfficerLocations error:', err);
    return [];
  }
}

async function getStaffLocations(email) {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Users!A2:C'
    });

    const rows = result.data.values || [];
    const normalizedEmail = email.toLowerCase().trim();

    for (let row of rows) {
      if (row[0] && String(row[0]).toLowerCase().trim() === normalizedEmail) {
        return (row[2] || '').split(',').map(l => l.trim());
      }
    }

    return [];
  } catch (err) {
    console.error('getStaffLocations error:', err);
    return [];
  }
}

async function getJobTypesForLocation(location) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Shift Types!A2:B'
    });

    const rows = response.data.values || [];
    const jobTypes = new Set();

    rows.forEach(row => {
      const jobType = String(row[0]).trim();
      const loc = String(row[1]).trim();
      if (loc === location && jobType) {
        jobTypes.add(jobType);
      }
    });

    return { jobTypes: Array.from(jobTypes).sort() };
  } catch (err) {
    console.error('getJobTypesForLocation error:', err);
    return { error: err.toString() };
  }
}

// ============================================================================
// VACANCY FUNCTIONS
// ============================================================================

async function getOfficerVacancies(email) {
  try {
    const locations = await getOfficerLocations(email);
    if (locations.length === 0) return [];

    const allVacancies = [];
    const locationNames = ['Innisfail', 'Mareeba', 'Tully', 'Yarrabah', 'Atherton', 'Mossman', 'Babinda', 'Cairns', 'Telehealth'];

    for (let location of locations) {
      if (!locationNames.includes(location)) continue;
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `Vacancies - ${location}!A2:D`
      });
      const rows = result.data.values || [];
      for (let row of rows) {
        if (row[0] && row[1]) {
          allVacancies.push({ date: formatDate(row[0]), jobType: row[1], location: row[2] });
        }
      }
    }

    return allVacancies;
  } catch (err) {
    console.error('getOfficerVacancies error:', err);
    return [];
  }
}

async function getStaffAvailableShifts(email) {
  try {
    const locations = await getStaffLocations(email);
    if (locations.length === 0) {
      console.log('No locations found for staff member:', email);
      return [];
    }

    console.log('Staff locations:', locations);

    const allShifts = [];
    const locationNames = ['Innisfail', 'Mareeba', 'Tully', 'Yarrabah', 'Atherton', 'Mossman', 'Babinda', 'Cairns', 'Telehealth'];

    for (let location of locations) {
      if (!locationNames.includes(location)) {
        console.log('Skipping invalid location:', location);
        continue;
      }
      try {
        const result = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: `Vacancies - ${location}!A2:D`
        });
        const rows = result.data.values || [];
        console.log(`Found ${rows.length} shifts in ${location}`);
        for (let row of rows) {
          if (row[0] && row[1]) {
            allShifts.push({ date: formatDate(row[0]), jobType: row[1], location: row[2] });
          }
        }
      } catch (locErr) {
        console.log(`Error reading ${location} vacancies:`, locErr.message);
      }
    }

    console.log('Total shifts found:', allShifts.length);
    return allShifts;
  } catch (err) {
    console.error('getStaffAvailableShifts error:', err);
    return [];
  }
}

// Fix: clears existing vacancies for each officer location before writing new ones.
// Prevents duplicate accumulation on repeated saves.
async function saveOfficerVacancies(email, vacancies) {
  try {
    const locations = await getOfficerLocations(email);
    if (locations.length === 0) return { error: 'No locations found for officer' };

    console.log(`Saving ${vacancies.length} vacancies for officer ${email}`);

    const locationNames = ['Innisfail', 'Mareeba', 'Tully', 'Yarrabah', 'Atherton', 'Mossman', 'Babinda', 'Cairns', 'Telehealth'];

    const vacanciesByLocation = {};
    for (let vac of vacancies) {
      if (!vacanciesByLocation[vac.location]) vacanciesByLocation[vac.location] = [];
      vacanciesByLocation[vac.location].push(vac);
    }

    for (let location of locations) {
      if (!locationNames.includes(location)) continue;

      const sheetName = `Vacancies - ${location}`;
      const newVacancies = vacanciesByLocation[location] || [];

      try {
        // Clear all existing data for this location before writing
        await sheets.spreadsheets.values.clear({
          spreadsheetId: SHEET_ID,
          range: `${sheetName}!A2:D`
        });
        console.log(`Cleared old vacancies from ${sheetName}`);

        if (newVacancies.length > 0) {
          const rows = newVacancies.map(vac => [vac.date, vac.jobType, location, '']);
          await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: `${sheetName}!A2:D`,
            valueInputOption: 'RAW',
            resource: { values: rows }
          });
          console.log(`Added ${rows.length} new vacancies to ${sheetName}`);
        }
      } catch (err) {
        console.error(`Error updating ${sheetName}:`, err);
      }
    }

    return { success: true, message: `Saved ${vacancies.length} vacancies` };
  } catch (err) {
    console.error('saveOfficerVacancies error:', err);
    return { error: err.toString() };
  }
}

// ============================================================================
// SHIFT REQUEST FUNCTIONS
// ============================================================================

// Fix: includes mailto Approve/Deny buttons in officer notification emails (restored from V1)
async function requestShifts(email, name, shifts) {
  try {
    const timestamp = new Date().toLocaleString();
    console.log(`Shift request from ${name} (${email}) for ${shifts.length} shifts`);

    const officerResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Rostering Officers!A2:C'
    });

    const officerRows = officerResult.data.values || [];
    const officersByLocation = {};
    for (let row of officerRows) {
      const location = String(row[0]).trim();
      if (!officersByLocation[location]) officersByLocation[location] = [];
      officersByLocation[location].push({ name: String(row[1]).trim(), email: String(row[2]).trim() });
    }

    const requestsToAdd = shifts.map(s => [timestamp, email, name, s.date, s.jobType, s.location, 'Pending', '', '']);
    if (requestsToAdd.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Requests!A2:I',
        valueInputOption: 'RAW',
        resource: { values: requestsToAdd }
      });
      console.log(`Logged ${requestsToAdd.length} requests to Requests sheet`);
    }

    const shiftsByLocation = {};
    for (let shift of shifts) {
      if (!shiftsByLocation[shift.location]) shiftsByLocation[shift.location] = [];
      shiftsByLocation[shift.location].push(shift);
    }

    for (let location in shiftsByLocation) {
      const locationShifts = shiftsByLocation[location];
      const officers = officersByLocation[location] || [];
      const shiftList = locationShifts.map(s => `${s.date} - ${s.jobType} @ ${location}`).join('<br>');
      const shiftListText = locationShifts.map(s => `${s.date} - ${s.jobType} @ ${location}`).join(', ');

      const approveLink = `mailto:ruralroster@gmail.com?subject=APPROVE: ${location} ${shiftListText} - ${name}&body=I approve this shift request for ${name} on ${shiftListText}`;
      const denyLink = `mailto:ruralroster@gmail.com?subject=DENY: ${location} ${shiftListText} - ${name}&body=I deny this shift request for ${name} on ${shiftListText}. Reason: [Please provide reason]`;

      const htmlBody = `<p>Dear {OFFICER_NAME},</p>
<p><strong>${name}</strong> is requesting to cover the following shifts:</p>
<p><strong>${shiftList}</strong></p>
<p><a href="${approveLink}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-right: 10px;">Approve and reply to ${name}</a></p>
<p><a href="${denyLink}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Deny and reply to ${name}</a></p>
<p>To remove approved shifts from the system: log in, go to "My Vacancies", and remove the approved shift.</p>
<p>Thank you,<br>Rural Rosters Support</p>`;

      for (let officer of officers) {
        try {
          await transporter.sendMail({
            from: GMAIL_USER,
            to: officer.email,
            cc: 'ruralroster@gmail.com',
            subject: `[Rural Rosters] ${name} is requesting shifts`,
            html: htmlBody.replace('{OFFICER_NAME}', officer.name)
          });
          console.log(`Email sent to ${officer.email}`);
        } catch (err) {
          console.error(`Failed to email ${officer.email}:`, err);
        }
      }
    }

    return { success: true, message: 'Request submitted and emails sent' };
  } catch (err) {
    console.error('requestShifts error:', err);
    return { error: err.toString() };
  }
}

async function approveShiftRequest(email, name, date, jobType, location) {
  try {
    const requestsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Requests!A2:I'
    });
    const requestsRows = requestsResponse.data.values || [];
    for (let i = 0; i < requestsRows.length; i++) {
      if (requestsRows[i][1] === email && requestsRows[i][3] === date && requestsRows[i][4] === jobType && requestsRows[i][5] === location && requestsRows[i][6] === 'Pending') {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Requests!G${i + 2}`,
          valueInputOption: 'RAW',
          resource: { values: [['Approved']] }
        });
        break;
      }
    }
    await transporter.sendMail({
      from: GMAIL_USER, to: email,
      subject: `[Rural Rosters] Your Shift Request Approved`,
      html: `<p>Dear ${name},</p><p>Your shift request has been <strong>APPROVED</strong>!</p><p><strong>${date} - ${jobType} @ ${location}</strong></p><p>Thank you,<br>Rural Rosters Support</p>`
    });
    return { success: true };
  } catch (err) {
    console.error('approveShiftRequest error:', err);
    return { error: err.toString() };
  }
}

async function denyShiftRequest(email, name, date, jobType, location) {
  try {
    const requestsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Requests!A2:I'
    });
    const requestsRows = requestsResponse.data.values || [];
    for (let i = 0; i < requestsRows.length; i++) {
      if (requestsRows[i][1] === email && requestsRows[i][3] === date && requestsRows[i][4] === jobType && requestsRows[i][5] === location && requestsRows[i][6] === 'Pending') {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Requests!G${i + 2}`,
          valueInputOption: 'RAW',
          resource: { values: [['Denied']] }
        });
        break;
      }
    }
    await transporter.sendMail({
      from: GMAIL_USER, to: email,
      subject: `[Rural Rosters] Your Shift Request Denied`,
      html: `<p>Dear ${name},</p><p>Your shift request has been <strong>DENIED</strong>.</p><p><strong>${date} - ${jobType} @ ${location}</strong></p><p>Thank you,<br>Rural Rosters Support</p>`
    });
    return { success: true };
  } catch (err) {
    console.error('denyShiftRequest error:', err);
    return { error: err.toString() };
  }
}

// ============================================================================
// SWAP / MARKETPLACE FUNCTIONS
// ============================================================================

async function listShiftForSwap(email, name, date, jobType, location, isServiceDisruption, availableDays) {
  try {
    const row = [email, name, date, jobType, location, 'Pending Verification', isServiceDisruption ? 'Y' : 'N', availableDays || ''];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Listings!A2:H',
      valueInputOption: 'RAW',
      resource: { values: [row] }
    });
    return { success: true, message: 'Shift listed for swap (pending officer approval)' };
  } catch (err) {
    console.error('listShiftForSwap error:', err);
    return { error: err.toString() };
  }
}

async function getMarketplaceListings(email) {
  try {
    const locations = await getStaffLocations(email);
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Listings!A2:H'
    });
    const rows = result.data.values || [];
    const listings = [];
    for (let row of rows) {
      if (locations.includes(String(row[4]).trim()) && String(row[5]).trim() === 'Available') {
        listings.push({
          originalEmail: row[0], originalName: row[1], date: row[2], jobType: row[3], location: row[4],
          isServiceDisruption: row[6] === 'Y', availableDays: row[7] || ''
        });
      }
    }
    return listings;
  } catch (err) {
    console.error('getMarketplaceListings error:', err);
    return [];
  }
}

async function claimShift(claimingEmail, claimingName, originalEmail, originalName, date, jobType, location) {
  try {
    const timestamp = new Date().toLocaleString();
    const claimRow = [claimingEmail, claimingName, originalEmail, originalName, date, jobType, location, timestamp, 'Pending'];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Claims!A2:I',
      valueInputOption: 'RAW',
      resource: { values: [claimRow] }
    });
    const officerResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Rostering Officers!A2:C'
    });
    const officerRows = officerResult.data.values || [];
    for (let row of officerRows) {
      if (String(row[0]).trim() === location) {
        await transporter.sendMail({
          from: GMAIL_USER, to: String(row[2]).trim(), cc: 'ruralroster@gmail.com',
          subject: `[Rural Rosters] Shift Swap Claim - ${claimingName} claiming from ${originalName}`,
          html: `<p>Dear ${String(row[1]).trim()},</p><p><strong>${claimingName}</strong> has claimed a shift from <strong>${originalName}</strong>:</p><p><strong>${date} - ${jobType} @ ${location}</strong></p><p>Please review and approve or deny this swap request.</p><p>Thank you,<br>Rural Rosters Support</p>`
        });
        break;
      }
    }
    return { success: true, message: 'Shift claimed successfully' };
  } catch (err) {
    console.error('claimShift error:', err);
    return { error: err.toString() };
  }
}

async function getOfficerMarketplaceListings(email) {
  try {
    const locations = await getOfficerLocations(email);
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Listings!A2:H'
    });
    const rows = result.data.values || [];
    const listings = [];
    for (let row of rows) {
      if (locations.includes(String(row[4]).trim()) && String(row[5]).trim() === 'Pending Verification') {
        listings.push({
          originalEmail: row[0], originalName: row[1], date: row[2], jobType: row[3], location: row[4],
          isServiceDisruption: row[6] === 'Y', availableDays: row[7] || ''
        });
      }
    }
    return listings;
  } catch (err) {
    console.error('getOfficerMarketplaceListings error:', err);
    return [];
  }
}

async function getOfficerPendingApprovals(email) {
  try {
    const locations = await getOfficerLocations(email);
    const claims = [];

    const claimsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Claims!A2:J'
    });
    const claimsRows = claimsResponse.data.values || [];
    for (let i = 0; i < claimsRows.length; i++) {
      if (claimsRows[i][4] && locations.includes(claimsRows[i][6]) && claimsRows[i][8] && String(claimsRows[i][8]).toUpperCase() === 'PENDING') {
        claims.push({
          type: 'swap_claim',
          claimingEmail: claimsRows[i][0], claimingName: claimsRows[i][1],
          originalEmail: claimsRows[i][2], originalName: claimsRows[i][3],
          date: claimsRows[i][4], jobType: claimsRows[i][5], location: claimsRows[i][6],
          claimedTimestamp: claimsRows[i][7]
        });
      }
    }

    const requestsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Requests!A2:I'
    });
    const requestsRows = requestsResponse.data.values || [];
    for (let i = 0; i < requestsRows.length; i++) {
      if (requestsRows[i][5] && locations.includes(requestsRows[i][5]) && requestsRows[i][6] && String(requestsRows[i][6]).toUpperCase() === 'PENDING') {
        claims.push({
          type: 'shift_request',
          claimingEmail: requestsRows[i][1], claimingName: requestsRows[i][2],
          date: requestsRows[i][3], jobType: requestsRows[i][4], location: requestsRows[i][5],
          claimedTimestamp: requestsRows[i][0]
        });
      }
    }

    return claims;
  } catch (err) {
    console.error('getOfficerPendingApprovals error:', err);
    return [];
  }
}

async function getOfficerPastApprovals(email) {
  try {
    const locations = await getOfficerLocations(email);
    const pastApprovals = {};

    const claimsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Claims!A2:J'
    });
    const claimsRows = claimsResponse.data.values || [];
    for (let i = 0; i < claimsRows.length; i++) {
      const status = String(claimsRows[i][8] || '').trim().toUpperCase();
      if (claimsRows[i][4] && locations.includes(claimsRows[i][6]) && (status === 'APPROVED' || status === 'DENIED')) {
        const shiftKey = claimsRows[i][4] + '|' + claimsRows[i][5] + '|' + claimsRows[i][6];
        if (!pastApprovals[shiftKey]) {
          pastApprovals[shiftKey] = { date: claimsRows[i][4], jobType: claimsRows[i][5], location: claimsRows[i][6], approved: null, denied: [], resolvedDate: null };
        }
        if (status === 'APPROVED') {
          pastApprovals[shiftKey].approved = { email: claimsRows[i][0], name: claimsRows[i][1] };
          pastApprovals[shiftKey].resolvedDate = claimsRows[i][9] || claimsRows[i][7];
        } else {
          pastApprovals[shiftKey].denied.push({ email: claimsRows[i][0], name: claimsRows[i][1] });
          pastApprovals[shiftKey].resolvedDate = claimsRows[i][9] || claimsRows[i][7];
        }
      }
    }

    const requestsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Requests!A2:I'
    });
    const requestsRows = requestsResponse.data.values || [];
    for (let i = 0; i < requestsRows.length; i++) {
      const status = String(requestsRows[i][6] || '').trim().toUpperCase();
      if (requestsRows[i][5] && locations.includes(requestsRows[i][5]) && (status === 'APPROVED' || status === 'DENIED')) {
        const shiftKey = requestsRows[i][3] + '|' + requestsRows[i][4] + '|' + requestsRows[i][5];
        if (!pastApprovals[shiftKey]) {
          pastApprovals[shiftKey] = { date: requestsRows[i][3], jobType: requestsRows[i][4], location: requestsRows[i][5], approved: null, denied: [], resolvedDate: null };
        }
        if (status === 'APPROVED') {
          pastApprovals[shiftKey].approved = { email: requestsRows[i][1], name: requestsRows[i][2] };
          pastApprovals[shiftKey].resolvedDate = requestsRows[i][7] || requestsRows[i][0];
        } else {
          pastApprovals[shiftKey].denied.push({ email: requestsRows[i][1], name: requestsRows[i][2] });
          pastApprovals[shiftKey].resolvedDate = requestsRows[i][7] || requestsRows[i][0];
        }
      }
    }

    const result = Object.values(pastApprovals);
    result.sort((a, b) => new Date(b.date.split('/').reverse().join('-')) - new Date(a.date.split('/').reverse().join('-')));
    return result;
  } catch (err) {
    console.error('getOfficerPastApprovals error:', err);
    return [];
  }
}

async function approveSwap(claimingEmail, claimingName, originalEmail, originalName, officerEmail, officerName, date, jobType, location) {
  try {
    const resolvedTimestamp = new Date().toLocaleString();
    const claimsResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Claims!A2:J'
    });
    const claimRows = claimsResult.data.values || [];
    const otherApplicants = [];
    const isSwap = originalEmail && originalEmail.trim();

    for (let i = 0; i < claimRows.length; i++) {
      if (String(claimRows[i][4]).trim() === date && String(claimRows[i][5]).trim() === jobType && String(claimRows[i][6]).trim() === location) {
        if (claimRows[i][0] === claimingEmail && claimRows[i][2] === originalEmail) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `Marketplace Claims!I${i + 2}:J${i + 2}`,
            valueInputOption: 'RAW',
            resource: { values: [['Approved', resolvedTimestamp]] }
          });
        } else if (String(claimRows[i][8]).trim() === 'Pending') {
          otherApplicants.push({ email: claimRows[i][0], name: claimRows[i][1] });
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `Marketplace Claims!I${i + 2}:J${i + 2}`,
            valueInputOption: 'RAW',
            resource: { values: [['Denied', resolvedTimestamp]] }
          });
        }
      }
    }

    if (!isSwap && claimingEmail && claimingEmail.trim()) {
      await transporter.sendMail({
        from: GMAIL_USER, to: claimingEmail,
        subject: `[Rural Rosters] Your Shift Request Approved`,
        html: `<p>Dear ${claimingName},</p><p>Your request to cover the shift has been <strong>APPROVED</strong>:</p><p><strong>${date} - ${jobType} @ ${location}</strong></p><p>Thank you,<br>Rural Rosters Support</p>`
      });
    }

    if (isSwap) {
      if (claimingEmail && claimingEmail.trim()) {
        await transporter.sendMail({
          from: GMAIL_USER, to: claimingEmail,
          subject: `[Rural Rosters] Shift Swap Approved`,
          html: `<p>Dear ${claimingName},</p><p>Your request to cover the shift has been <strong>APPROVED</strong>:</p><p><strong>${date} - ${jobType} @ ${location}</strong></p><p>Original staff member: ${originalName}</p><p>Please coordinate with ${originalName} to confirm the handover.</p><p>Thank you,<br>Rural Rosters Support</p>`
        });
      }
      if (originalEmail && originalEmail.trim()) {
        await transporter.sendMail({
          from: GMAIL_USER, to: originalEmail,
          subject: `[Rural Rosters] Your Shift Swap Approved`,
          html: `<p>Dear ${originalName},</p><p>Your shift swap request has been <strong>APPROVED</strong>:</p><p><strong>${date} - ${jobType} @ ${location}</strong></p><p>Staff member taking your shift: ${claimingName}</p><p>Thank you,<br>Rural Rosters Support</p>`
        });
      }
      for (let applicant of otherApplicants) {
        if (applicant.email && applicant.email.trim()) {
          await transporter.sendMail({
            from: GMAIL_USER, to: applicant.email,
            subject: `[Rural Rosters] Shift Swap - Another Applicant Approved`,
            html: `<p>Dear ${applicant.name},</p><p>Unfortunately, another applicant was approved for the following shift:</p><p><strong>${date} - ${jobType} @ ${location}</strong></p><p>Please try again for future shifts.</p><p>Thank you,<br>Rural Rosters Support</p>`
          });
        }
      }
    }

    return { success: true, message: 'Shift approved and emails sent' };
  } catch (err) {
    console.error('approveSwap error:', err);
    return { error: err.toString() };
  }
}

async function denySwap(claimingEmail, claimingName, originalEmail, originalName, officerEmail, officerName, date, jobType, location) {
  try {
    const resolvedTimestamp = new Date().toLocaleString();
    const claimsResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Claims!A2:J'
    });
    const claimRows = claimsResult.data.values || [];
    const isSwap = originalEmail && originalEmail.trim();

    for (let i = 0; i < claimRows.length; i++) {
      if (claimRows[i][0] === claimingEmail && claimRows[i][2] === originalEmail && claimRows[i][4] === date) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Marketplace Claims!I${i + 2}:J${i + 2}`,
          valueInputOption: 'RAW',
          resource: { values: [['Denied', resolvedTimestamp]] }
        });
        break;
      }
    }

    if (claimingEmail && claimingEmail.trim()) {
      await transporter.sendMail({
        from: GMAIL_USER, to: claimingEmail,
        subject: isSwap ? `[Rural Rosters] Shift Swap Not Approved` : `[Rural Rosters] Your Shift Request Denied`,
        html: isSwap
          ? `<p>Dear ${claimingName},</p><p>Unfortunately, your request to cover the shift has been <strong>DENIED</strong>:</p><p><strong>${date} - ${jobType} @ ${location}</strong></p><p>Thank you,<br>Rural Rosters Support</p>`
          : `<p>Dear ${claimingName},</p><p>Unfortunately, your shift request has been <strong>DENIED</strong>:</p><p><strong>${date} - ${jobType} @ ${location}</strong></p><p>Thank you,<br>Rural Rosters Support</p>`
      });
    }

    return { success: true, message: 'Shift denied and email sent' };
  } catch (err) {
    console.error('denySwap error:', err);
    return { error: err.toString() };
  }
}

async function approvePendingSwap(staffEmail, staffName, date, jobType, location) {
  try {
    const listingsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Listings!A2:H'
    });
    const listingsRows = listingsResponse.data.values || [];
    let availableDays = '';
    for (let i = 0; i < listingsRows.length; i++) {
      if (listingsRows[i][0] === staffEmail && listingsRows[i][2] === date && listingsRows[i][3] === jobType && listingsRows[i][4] === location) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Marketplace Listings!F${i + 2}`,
          valueInputOption: 'RAW',
          resource: { values: [['Available']] }
        });
        availableDays = listingsRows[i][7] || '';
        break;
      }
    }
    await transporter.sendMail({
      from: GMAIL_USER, to: staffEmail,
      subject: `[Rural Rosters] Your Swap Approved`,
      html: `<p>Dear ${staffName},</p><p>Your swap request has been approved and is now live on the marketplace!</p><p><strong>${date} - ${jobType} @ ${location}</strong></p><p>Available days/shifts: ${availableDays}</p><p>Thank you,<br>Rural Rosters Support</p>`
    });
    return { success: true, message: 'Swap approved and moved to marketplace' };
  } catch (err) {
    console.error('approvePendingSwap error:', err);
    return { error: err.toString() };
  }
}

async function denySwapWithReason(staffEmail, staffName, date, jobType, location, reason) {
  try {
    const listingsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Listings!A2:H'
    });
    const listingsRows = listingsResponse.data.values || [];
    for (let i = 0; i < listingsRows.length; i++) {
      if (listingsRows[i][0] === staffEmail && listingsRows[i][2] === date && listingsRows[i][3] === jobType && listingsRows[i][4] === location) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Marketplace Listings!F${i + 2}`,
          valueInputOption: 'RAW',
          resource: { values: [['Denied']] }
        });
        break;
      }
    }
    await transporter.sendMail({
      from: GMAIL_USER, to: staffEmail, cc: 'ruralroster@gmail.com',
      subject: `[Rural Rosters] Your Swap Request Denied`,
      html: `<p>Dear ${staffName},</p><p>Your shift swap request has been <strong>DENIED</strong>.</p><p><strong>${date} - ${jobType} @ ${location}</strong></p><p><strong>Reason:</strong> ${reason}</p><p>Thank you,<br>Rural Rosters Support</p>`
    });
    return { success: true, message: 'Swap denied and email sent' };
  } catch (err) {
    console.error('denySwapWithReason error:', err);
    return { error: err.toString() };
  }
}

// ============================================================================
// SETTINGS FUNCTIONS
// ============================================================================

async function updateUserLocations(email, locations, role) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Users!A2:G'
    });
    const rows = result.data.values || [];
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).toLowerCase().trim() === normalizedEmail) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Users!C${i + 2}`,
          valueInputOption: 'RAW',
          resource: { values: [[locations]] }
        });
        console.log(`Updated locations for ${email}: ${locations}`);
        return { success: true, message: 'Locations updated' };
      }
    }
    return { error: 'User not found' };
  } catch (err) {
    console.error('updateUserLocations error:', err);
    return { error: err.toString() };
  }
}

async function updateUserAST(email, astQuals) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Users!A2:G'
    });
    const rows = result.data.values || [];
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][0]).toLowerCase().trim() === normalizedEmail) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Users!G${i + 2}`,
          valueInputOption: 'RAW',
          resource: { values: [[astQuals]] }
        });
        console.log(`Updated AST quals for ${email}: ${astQuals}`);
        return { success: true, message: 'AST qualifications updated' };
      }
    }
    return { error: 'User not found' };
  } catch (err) {
    console.error('updateUserAST error:', err);
    return { error: err.toString() };
  }
}

async function countPendingRequests(email) {
  try {
    const locations = await getOfficerLocations(email);
    if (locations.length === 0) return 0;

    let count = 0;
    const requestsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Requests!A2:G'
    });
    const requestsRows = requestsResponse.data.values || [];
    for (let row of requestsRows) {
      if (row[5] && locations.includes(String(row[5]).trim()) && row[6] && String(row[6]).toUpperCase() === 'PENDING') {
        count++;
      }
    }

    console.log(`Officer ${email} has ${count} pending requests`);
    return count;
  } catch (err) {
    console.error('countPendingRequests error:', err);
    return 0;
  }
}

// ============================================================================
// UTILITY
// ============================================================================

function formatDate(dateVal) {
  if (!dateVal) return '';
  if (dateVal instanceof Date) {
    const d = dateVal.getDate();
    const m = dateVal.getMonth() + 1;
    const y = dateVal.getFullYear();
    return (d < 10 ? '0' + d : d) + '/' + (m < 10 ? '0' + m : m) + '/' + y;
  }
  return String(dateVal);
}

// ============================================================================
// SERVER START
// ============================================================================

const PORT = process.env.PORT || 8080;

console.log(`[STARTUP] Attempting to listen on port ${PORT}...`);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SUCCESS] Rural Rosters Backend V2 Staging listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});
