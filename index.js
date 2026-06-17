/**
 * Rural Rosters Backend - Phase 2 with Marketplace + New Features
 * Uses embedded service account credentials (proven working pattern)
 */

const http = require('http');
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const nodemailer = require('nodemailer');

// Service account credentials (embedded - WORKING PATTERN)
const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "rural-rosters",
  private_key_id: "3f30d8812c36bf4d32ab0492eee60ae27f27d829",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDsvjaq0OtGrXFL\nXq0122BUAjKwq3Z9zlD9K6n6EVyoH9gojRnpoodqHSJY3EIq3xdRzXKiK8nly9Qi\ndTyRVmS/YR5t4TNFfIi01vOek23tj2wmU2iqPO2VSmyLOgVCEu/qjTVrd/D6X3OQ\n2h7ueXgtbOJWuTf3WPZ/LJ2XG6SIv2cRODOlQ0dMjsJOAlVAPU3XGlXGJvBfqt13\n2UA/jwbNr7oDa2q3l7aP8O1FJIRgzrKEkJ78kFse/V0lBN0CyDbXtIL3jx5cJpom\npd1pJCgDgciXzPem0H2btMlHjFcRjuFk8D8gcNDxEj0iBqsFD+EFhQjZIHGGz1JA\nnTxl0u6HAgMBAAECggEAVPZu6B7SUSst3b68qvdwOrYPOxhODhhdOH7TIcvZVP0Y\ntnTtN8v8jTinevyRQpGN7O2ulkTg0He2SieI9R/sSEKyiPypSebHqR77j42ZhghS\n5+5HQdFb8pgjHFRWTsA9GhBTe54v/asD7phZQXyWhLbvA/C1BTAIRtvcMr7Y7boS\nrpYgb1OQpEXUkcAmu6Elf0UvrgcqYmB4t17m2ky1/kNqyIxtGIWviWHr1zHtfabn\nrlMjixNEJzXVS0ju15d69aIPj44+C2NQkJN8qotgOTv+aU+Eg4FzUqV4YF5JR09Q\npYvqFwO1S2WaenmUU4DhEB4UVXis85rR13h/3ycvAQKBgQD3TXcqDNLV7BL3G4BD\n0ujd5750gaIkVJeqgWGGHNDCz+TaVfOPu8FwG4nxbRlgYHyvlWFzWCk9zpoj9BYw\nhkTV/z0MzGIUGIpXE1O8u8aGM/k9Xbq6gyc0VPaCWRbYQ2YdSlLWKaqNsJxrGHJY\nvKVquLaHIMvE4xnf4F6ttYGOCwKBgQD1Ea1ehWnTVnyReKOWLM8GvnsQbV6RE6oQ\n6xCmW02WazrterZQTocfoSSTbdYl6+Wh4EOGkVirIcfrghr4whqvxEw3SHT9ckSI\n3fymchE8wPIrYwTaXRDUucKvW5QKaZTTjOT9Tr53VRC/7Mzu4AsnDRPFE8q4skC1\nDONlria69QKBgDoISKVqevNOQakRIAlKbfDc1/mZDgZ+f1S4pb0F+AsvI+IEd3JM\nOflnzPgFhQXzvm6pnEOn9Y2WdN9pAOgEKhUZnybosz9J/vSuCWFpow2NFrjKzO3F\npyaFpY8y/sRjFIxdC5FMF8TGI/6RrwuZwSuJCvQswwSB0mmRykXzKOK/AoGAQLEN\n5umo6dTmxS/nXvktHUajDc8RK5LZTeX/Wyq27IIZ6B6Aiepw2PScxx4zbYc78uNU\nb+1mTqZ4M78Ah7IVgVh8FgvWdiD33nla/EUQL8VvJ+zXlx0CGGWA8vFlvunoE4AZ\n4pQqyy11YnSMFHKn/wMAuQFkfiTv19szG+BA8RECgYEApNOwO4Hq7IXsHJeERoB/\n0HdtJtFpfo09xUD/grjipzCzKF/fJgapHCFq7a5l56igwbVehQKTMHiV8BHs4GeI\nmQ85Bd9w14NdlK1YfufpcPylP701JsGvzDPtUaGyZ/3cPxjQlCPJIoLp/YQeXNa0\nieXG73xh8R9zF2AECz1Tk6E=\n-----END PRIVATE KEY-----\n",
  client_email: "rural-rosters-backend@rural-rosters.iam.gserviceaccount.com",
  client_id: "110632316482172106567",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/rural-rosters-backend%40rural-rosters.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Gmail credentials
const GMAIL_USER = 'ruralroster@gmail.com';
const GMAIL_APP_PASSWORD = 'gckg msat pnzq ltug';

const SHEET_ID = '1iG4SwN4LzFnzKNht2uy8R8YV6XKIftRTbmfW7_YZwtM';

// Initialize JWT client for Sheets
const auth = new JWT({
  email: SERVICE_ACCOUNT.client_email,
  key: SERVICE_ACCOUNT.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

// Initialize Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD
  }
});

console.log('Credentials initialized');

// HTTP Server
const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', service: 'Rural Rosters API' }));
    return;
  }

  // Only POST
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Parse body
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const { action, params } = JSON.parse(body);
      console.log('Action:', action);

      let result;
      switch (action) {
        case 'checkUserExists':
          result = await checkUserExists(params.email, params.password);
          break;
        case 'getOfficerLocations':
          result = await getOfficerLocations(params.email);
          break;
        case 'getOfficerVacancies':
          result = await getOfficerVacancies(params.email);
          break;
        case 'getStaffAvailableShifts':
          result = await getStaffAvailableShifts(params.email);
          break;
        case 'requestShifts':
          result = await requestShifts(params.email, params.name, params.shifts);
          break;
        case 'listShiftForSwap':
          result = await listShiftForSwap(params.email, params.name, params.date, params.jobType, params.location, params.isServiceDisruption, params.availableDays);
          break;
        case 'getMarketplaceListings':
          result = await getMarketplaceListings(params.email);
          break;
        case 'claimShift':
          result = await claimShift(params.claimingEmail, params.claimingName, params.originalEmail, params.originalName, params.date, params.jobType, params.location);
          break;
        case 'getOfficerMarketplaceListings':
          result = await getOfficerMarketplaceListings(params.email);
          break;
        case 'getOfficerPendingApprovals':
          result = await getOfficerPendingApprovals(params.email);
          break;
        case 'approveSwap':
          result = await approveSwap(params.claimingEmail, params.claimingName, params.originalEmail, params.originalName, params.officerEmail, params.officerName, params.date, params.jobType, params.location);
          break;
        case 'denySwap':
          result = await denySwap(params.claimingEmail, params.claimingName, params.originalEmail, params.originalName, params.officerEmail, params.officerName, params.date, params.jobType, params.location);
          break;
        case 'saveOfficerVacancies':
          result = await saveOfficerVacancies(params.email, params.vacancies);
          break;
        case 'approvePendingSwap':
          result = await approvePendingSwap(params.staffEmail, params.staffName, params.date, params.jobType, params.location);
          break;
        case 'denySwapWithReason':
          result = await denySwapWithReason(params.staffEmail, params.staffName, params.date, params.jobType, params.location, params.reason);
          break;
        case 'approveShiftRequest':
          result = await approveShiftRequest(params.email, params.name, params.date, params.jobType, params.location);
          break;
        case 'denyShiftRequest':
          result = await denyShiftRequest(params.email, params.name, params.date, params.jobType, params.location);
          break;
        default:
          result = { error: 'Unknown action: ' + action };
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
// ALL PHASE 1 FUNCTIONS (from working version)
// ============================================================================

async function checkUserExists(email, password) {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Users!A2:G'
    });

    const rows = result.data.values || [];
    const normalizedEmail = email.toLowerCase().trim();

    for (let row of rows) {
      if (row[0] && String(row[0]).toLowerCase().trim() === normalizedEmail && row[4] === password) {
        return {
          email: row[0],
          name: row[1],
          locations: row[2],
          role: row[3],
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

    for (let row of rows) {
      if (row[2] === email) {
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
        const locationsStr = row[2] || '';
        return locationsStr.split(',').map(l => l.trim());
      }
    }

    return [];
  } catch (err) {
    console.error('getStaffLocations error:', err);
    return [];
  }
}

async function getOfficerVacancies(email) {
  try {
    const locations = await getOfficerLocations(email);
    
    if (locations.length === 0) {
      return [];
    }

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
          allVacancies.push({
            date: formatDate(row[0]),
            jobType: row[1],
            location: row[2]
          });
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
            allShifts.push({
              date: formatDate(row[0]),
              jobType: row[1],
              location: row[2]
            });
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

async function requestShifts(officerEmail, officerName, shifts) {
  try {
    const timestamp = new Date().toLocaleString();
    
    console.log(`Shift request from ${officerName} (${officerEmail}) for ${shifts.length} shifts`);
    
    const officerResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Rostering Officers!A2:C'
    });

    const officerRows = officerResult.data.values || [];
    const officersByLocation = {};

    for (let row of officerRows) {
      const location = String(row[0]).trim();
      const rostName = String(row[1]).trim();
      const rostEmail = String(row[2]).trim();
      
      if (!officersByLocation[location]) {
        officersByLocation[location] = [];
      }
      officersByLocation[location].push({ name: rostName, email: rostEmail });
    }

    const requestsToAdd = [];
    for (let shift of shifts) {
      requestsToAdd.push([
        timestamp,
        officerEmail,
        officerName,
        shift.date,
        shift.jobType,
        shift.location,
        'Pending',
        '',
        ''
      ]);
    }

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
      if (!shiftsByLocation[shift.location]) {
        shiftsByLocation[shift.location] = [];
      }
      shiftsByLocation[shift.location].push(shift);
    }

    for (let location in shiftsByLocation) {
      const locationShifts = shiftsByLocation[location];
      const officers = officersByLocation[location] || [];
      
      const shiftList = locationShifts
        .map(s => `${s.date} - ${s.jobType} @ ${location}`)
        .join('<br>');

      for (let officer of officers) {
        try {
          const approveSubject = `Your application to cover shifts has been approved`;
          const approveBody = `Dear ${officerName},\n\nYou have been approved for the shift(s):\n${locationShifts.map(s => `${s.date} - ${s.jobType} @ ${s.location}`).join('\n')}\n\nThanks for helping out!\n\nSincerely\n${officer.name}`;
          const approveMail = `mailto:${officerEmail}?subject=${encodeURIComponent(approveSubject)}&body=${encodeURIComponent(approveBody)}`;

          const denySubject = `Your shift request could not be approved`;
          const denyBody = `Dear ${officerName},\n\nUnfortunately, we are unable to approve your request for the following shift(s) at this time:\n${locationShifts.map(s => `${s.date} - ${s.jobType} @ ${s.location}`).join('\n')}\n\nPlease contact ${officer.name}: mailto:${officer.email}`;
          const denyMail = `mailto:${officerEmail}?subject=${encodeURIComponent(denySubject)}&body=${encodeURIComponent(denyBody)}`;

          const htmlBody = `<p>Dear ${officer.name},</p>
<p>${officerName} is requesting to cover the following shifts:</p>
<p><strong>${shiftList}</strong></p>
<p><a href="${approveMail}">To approve and reply to ${officerName}</a></p>
<p><a href="${denyMail}">To deny and reply to ${officerName}</a></p>
<p>Thank you,<br>Rural Rosters Support</p>`;

          await transporter.sendMail({
            from: GMAIL_USER,
            to: officer.email,
            cc: 'ruralroster@gmail.com',
            subject: `[Rural Rosters] ${officerName} is requesting a shift`,
            html: htmlBody
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

async function listShiftForSwap(email, name, date, jobType, location, isServiceDisruption, availableDays) {
  try {
    const timestamp = new Date().toLocaleString();
    
    console.log(`${name} listing shift for swap: ${date} ${jobType} @ ${location}`);

    const row = [
      email,
      name,
      date,
      jobType,
      location,
      'Pending Verification',
      isServiceDisruption ? 'Y' : 'N',
      availableDays || ''
    ];

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
      const location = String(row[4]).trim();
      const status = String(row[5]).trim();
      
      if (locations.includes(location) && status === 'Available') {
        listings.push({
          originalEmail: row[0],
          originalName: row[1],
          date: row[2],
          jobType: row[3],
          location: row[4],
          isServiceDisruption: row[6] === 'Y',
          availableDays: row[7] || ''
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
    
    console.log(`${claimingName} claiming shift from ${originalName}: ${date} ${jobType} @ ${location}`);

    const claimRow = [
      claimingEmail,
      claimingName,
      originalEmail,
      originalName,
      date,
      jobType,
      location,
      timestamp,
      'Pending'
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Claims!A2:I',
      valueInputOption: 'RAW',
      resource: { values: [claimRow] }
    });

    const listingResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Listings!A2:H'
    });

    const listingRows = listingResult.data.values || [];
    for (let i = 0; i < listingRows.length; i++) {
      if (listingRows[i][0] === originalEmail && 
          listingRows[i][2] === date && 
          listingRows[i][3] === jobType && 
          listingRows[i][4] === location) {
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Marketplace Listings!F${i + 2}`,
          valueInputOption: 'RAW',
          resource: { values: [['Claimed']] }
        });
        break;
      }
    }

    const officerResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Rostering Officers!A2:C'
    });

    const officerRows = officerResult.data.values || [];
    for (let row of officerRows) {
      if (String(row[0]).trim() === location) {
        const officerEmail = String(row[2]).trim();
        const officerName = String(row[1]).trim();

        const htmlBody = `<p>Dear ${officerName},</p>
<p><strong>${claimingName}</strong> has claimed a shift from <strong>${originalName}</strong>:</p>
<p><strong>${date} - ${jobType} @ ${location}</strong></p>
<p>Please review and approve or deny this swap request.</p>
<p>Thank you,<br>Rural Rosters Support</p>`;

        await transporter.sendMail({
          from: GMAIL_USER,
          to: officerEmail,
          cc: 'ruralroster@gmail.com',
          subject: `[Rural Rosters] Shift Swap Claim - ${claimingName} claiming from ${originalName}`,
          html: htmlBody
        });

        console.log(`Claim notification sent to ${officerEmail}`);
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
      const location = String(row[4]).trim();
      const status = String(row[5]).trim();
      
      if (locations.includes(location) && status === 'Pending Verification') {
        listings.push({
          originalEmail: row[0],
          originalName: row[1],
          date: row[2],
          jobType: row[3],
          location: row[4],
          isServiceDisruption: row[6] === 'Y',
          availableDays: row[7] || '',
          color: row[6] === 'Y' ? 'red' : 'black'
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

    // Get swap claims
    const claimsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Claims!A2:I'
    });

    const claimsRows = claimsResponse.data.values || [];
    for (let i = 1; i < claimsRows.length; i++) {
      if (claimsRows[i][4] && locations.includes(claimsRows[i][6]) && claimsRows[i][8] && claimsRows[i][8].toUpperCase() === 'PENDING') {
        claims.push({
          type: 'swap_claim',
          claimingEmail: claimsRows[i][0],
          claimingName: claimsRows[i][1],
          originalEmail: claimsRows[i][2],
          originalName: claimsRows[i][3],
          date: claimsRows[i][4],
          jobType: claimsRows[i][5],
          location: claimsRows[i][6],
          claimedTimestamp: claimsRows[i][7]
        });
      }
    }

    // Get shift requests
    const requestsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Requests!A2:G'
    });

    const requestsRows = requestsResponse.data.values || [];
    for (let i = 1; i < requestsRows.length; i++) {
      if (requestsRows[i][5] && locations.includes(requestsRows[i][5]) && requestsRows[i][6] && requestsRows[i][6].toUpperCase() === 'PENDING') {
        claims.push({
          type: 'shift_request',
          claimingEmail: requestsRows[i][1],
          claimingName: requestsRows[i][2],
          date: requestsRows[i][3],
          jobType: requestsRows[i][4],
          location: requestsRows[i][5],
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

async function approveSwap(claimingEmail, claimingName, originalEmail, originalName, officerEmail, officerName, date, jobType, location) {
  try {
    console.log(`Approving swap: ${claimingName} claims ${originalName}'s shift`);

    const claimsResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Claims!A2:I'
    });

    const claimRows = claimsResult.data.values || [];
    for (let i = 0; i < claimRows.length; i++) {
      if (claimRows[i][0] === claimingEmail && 
          claimRows[i][2] === originalEmail && 
          claimRows[i][4] === date && 
          claimRows[i][5] === jobType) {
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Marketplace Claims!I${i + 2}`,
          valueInputOption: 'RAW',
          resource: { values: [['Approved']] }
        });
        break;
      }
    }

    const listingResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Listings!A2:H'
    });

    const listingRows = listingResult.data.values || [];
    for (let i = 0; i < listingRows.length; i++) {
      if (listingRows[i][0] === originalEmail && 
          listingRows[i][2] === date && 
          listingRows[i][3] === jobType) {
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Marketplace Listings!F${i + 2}`,
          valueInputOption: 'RAW',
          resource: { values: [['Approved']] }
        });
        break;
      }
    }

    const approveMail = `<p>Dear ${claimingName},</p>
<p>Your request to cover the shift has been <strong>APPROVED</strong>:</p>
<p><strong>${date} - ${jobType} @ ${location}</strong></p>
<p>Original staff member: ${originalName}</p>
<p>Please coordinate with ${originalName} to confirm the handover.</p>`;

    await transporter.sendMail({
      from: GMAIL_USER,
      to: claimingEmail,
      subject: `[Rural Rosters] Shift Swap Approved`,
      html: approveMail
    });

    const originalMail = `<p>Dear ${originalName},</p>
<p>Your shift swap request has been <strong>APPROVED</strong>:</p>
<p><strong>${date} - ${jobType} @ ${location}</strong></p>
<p>Staff member taking your shift: ${claimingName}</p>`;

    await transporter.sendMail({
      from: GMAIL_USER,
      to: originalEmail,
      subject: `[Rural Rosters] Your Shift Swap Approved`,
      html: originalMail
    });

    return { success: true, message: 'Swap approved and emails sent' };
  } catch (err) {
    console.error('approveSwap error:', err);
    return { error: err.toString() };
  }
}

async function denySwap(claimingEmail, claimingName, originalEmail, originalName, officerEmail, officerName, date, jobType, location) {
  try {
    console.log(`Denying swap: ${claimingName} claim rejected`);

    const claimsResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Claims!A2:I'
    });

    const claimRows = claimsResult.data.values || [];
    for (let i = 0; i < claimRows.length; i++) {
      if (claimRows[i][0] === claimingEmail && 
          claimRows[i][2] === originalEmail && 
          claimRows[i][4] === date) {
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Marketplace Claims!I${i + 2}`,
          valueInputOption: 'RAW',
          resource: { values: [['Rejected']] }
        });
        break;
      }
    }

    const listingResult = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Listings!A2:H'
    });

    const listingRows = listingResult.data.values || [];
    for (let i = 0; i < listingRows.length; i++) {
      if (listingRows[i][0] === originalEmail && 
          listingRows[i][2] === date && 
          listingRows[i][3] === jobType) {
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Marketplace Listings!F${i + 2}`,
          valueInputOption: 'RAW',
          resource: { values: [['Available']] }
        });
        break;
      }
    }

    const denyMail = `<p>Dear ${claimingName},</p>
<p>Unfortunately, your request to cover the shift has been <strong>DENIED</strong>:</p>
<p><strong>${date} - ${jobType} @ ${location}</strong></p>`;

    await transporter.sendMail({
      from: GMAIL_USER,
      to: claimingEmail,
      subject: `[Rural Rosters] Shift Swap Not Approved`,
      html: denyMail
    });

    return { success: true, message: 'Swap denied and emails sent' };
  } catch (err) {
    console.error('denySwap error:', err);
    return { error: err.toString() };
  }
}

async function saveOfficerVacancies(email, vacancies) {
  try {
    const locations = await getOfficerLocations(email);
    
    if (locations.length === 0) {
      return { error: 'No locations found for officer' };
    }

    console.log(`Saving ${vacancies.length} vacancies for officer ${email}`);

    const locationNames = ['Innisfail', 'Mareeba', 'Tully', 'Yarrabah', 'Atherton', 'Mossman', 'Babinda', 'Cairns', 'Telehealth'];
    
    for (let location of locations) {
      if (!locationNames.includes(location)) continue;
      
      const sheetName = `Vacancies - ${location}`;
      
      try {
        const result = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_ID,
          range: `${sheetName}!A2:D`
        });

        const existingRows = result.data.values || [];
        
        for (let i = existingRows.length - 1; i >= 0; i--) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID,
            range: `${sheetName}!A${i + 2}:D${i + 2}`,
            valueInputOption: 'RAW',
            resource: { values: [[]] }
          });
        }
      } catch (err) {
        console.log(`Sheet ${sheetName} might not exist yet, continuing...`);
      }
    }

    const vacanciesByLocation = {};
    for (let vac of vacancies) {
      const loc = vac.location;
      if (!vacanciesByLocation[loc]) {
        vacanciesByLocation[loc] = [];
      }
      vacanciesByLocation[loc].push(vac);
    }

    for (let location in vacanciesByLocation) {
      const sheetName = `Vacancies - ${location}`;
      const rows = vacanciesByLocation[location].map(vac => [vac.date, vac.jobType, location, '']);

      if (rows.length > 0) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: `${sheetName}!A2:D`,
          valueInputOption: 'RAW',
          resource: { values: rows }
        });
      }
    }

    return { success: true, message: `Saved ${vacancies.length} vacancies` };
  } catch (err) {
    console.error('saveOfficerVacancies error:', err);
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

    const htmlBody = `<p>Dear ${staffName},</p>
<p>Your swap request has been approved!</p>
<p><strong>${date} - ${jobType} @ ${location}</strong></p>
<p>Available days/shifts: ${availableDays}</p>`;

    await transporter.sendMail({
      from: GMAIL_USER,
      to: staffEmail,
      subject: `[Rural Rosters] Your Swap Approved`,
      html: htmlBody
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

    const htmlBody = `<p>Dear ${staffName},</p>
<p>Your shift swap request has been <strong>DENIED</strong>.</p>
<p><strong>${date} - ${jobType} @ ${location}</strong></p>
<p><strong>Reason:</strong> ${reason}</p>`;

    await transporter.sendMail({
      from: GMAIL_USER,
      to: staffEmail,
      cc: 'ruralroster@gmail.com',
      subject: `[Rural Rosters] Your Swap Request Denied`,
      html: htmlBody
    });

    return { success: true, message: 'Swap denied and email sent' };
  } catch (err) {
    console.error('denySwapWithReason error:', err);
    return { error: err.toString() };
  }
}

async function approveShiftRequest(email, name, date, jobType, location) {
  try {
    const requestsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Requests!A2:G'
    });
    const requestsRows = requestsResponse.data.values || [];

    for (let i = 1; i < requestsRows.length; i++) {
      if (requestsRows[i][1] === email && requestsRows[i][3] === date && requestsRows[i][4] === jobType && requestsRows[i][5] === location && requestsRows[i][6] === 'Pending') {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Requests!G${i + 1}`,
          valueInputOption: 'RAW',
          resource: { values: [['Approved']] }
        });
        break;
      }
    }

    const htmlBody = `<p>Dear ${name},</p>
<p>Your shift request has been <strong>APPROVED</strong>!</p>
<p><strong>${date} - ${jobType} @ ${location}</strong></p>`;

    await transporter.sendMail({
      from: GMAIL_USER,
      to: email,
      subject: `[Rural Rosters] Your Shift Request Approved`,
      html: htmlBody
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
      range: 'Requests!A2:G'
    });
    const requestsRows = requestsResponse.data.values || [];

    for (let i = 1; i < requestsRows.length; i++) {
      if (requestsRows[i][1] === email && requestsRows[i][3] === date && requestsRows[i][4] === jobType && requestsRows[i][5] === location && requestsRows[i][6] === 'Pending') {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Requests!G${i + 1}`,
          valueInputOption: 'RAW',
          resource: { values: [['Denied']] }
        });
        break;
      }
    }

    const htmlBody = `<p>Dear ${name},</p>
<p>Your shift request has been <strong>DENIED</strong>.</p>
<p><strong>${date} - ${jobType} @ ${location}</strong></p>`;

    await transporter.sendMail({
      from: GMAIL_USER,
      to: email,
      subject: `[Rural Rosters] Your Shift Request Denied`,
      html: htmlBody
    });

    return { success: true };
  } catch (err) {
    console.error('denyShiftRequest error:', err);
    return { error: err.toString() };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
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

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Rural Rosters Backend listening on port ${PORT}`);
});
