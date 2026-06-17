const express = require('express');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

const SHEET_ID = '1iG4SwN4LzFnzKNht2uy8R8YV6XKIftRTbmfW7_YZwtM';
const GMAIL_USER = 'ruralroster@gmail.com';
const GMAIL_PASS = process.env.GMAIL_PASS || 'gckg msat pnzq ltug';

// Use default credentials (workload identity in Cloud Run)
const auth = new google.auth.GoogleAuth({
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/gmail.send'
  ]
});

const sheets = google.sheets({ version: 'v4', auth });
const gmail = google.gmail({ version: 'v1', auth });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: GMAIL_USER, pass: GMAIL_PASS }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Rural Rosters API' });
});

app.post('/', async (req, res) => {
  try {
    const { action, params } = req.body;
    let result = {};

    console.log(`Action: ${action}`, params);

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

async function checkUserExists(email, password) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Users!A:E'
    });
    const rows = response.data.values || [];
    for (let row of rows) {
      if (row[0] && row[0].toLowerCase() === email.toLowerCase() && row[4] === password) {
        return { email: row[0], name: row[1], locations: row[2], role: row[3] };
      }
    }
    return { error: 'Invalid credentials' };
  } catch (err) {
    console.error('checkUserExists error:', err);
    return { error: err.toString() };
  }
}

async function getOfficerLocations(email) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Rostering Officers!A:C'
    });
    const rows = response.data.values || [];
    const locations = [];
    for (let row of rows) {
      if (row[2] && row[2].toLowerCase() === email.toLowerCase()) {
        locations.push(row[0]);
      }
    }
    return locations;
  } catch (err) {
    console.error('getOfficerLocations error:', err);
    return [];
  }
}

async function getOfficerVacancies(email) {
  try {
    const locations = await getOfficerLocations(email);
    const allVacancies = [];

    for (let location of locations) {
      const sheetName = 'Vacancies - ' + location;
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `'${sheetName}'!A:D`
      });
      const rows = response.data.values || [];
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0]) {
          allVacancies.push({
            date: rows[i][0],
            jobType: rows[i][1],
            location: rows[i][2]
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
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Requests!A:G'
    });
    const rows = response.data.values || [];
    const shifts = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] && rows[i][6] && rows[i][6].toUpperCase() === 'AVAILABLE') {
        shifts.push({
          date: rows[i][3],
          jobType: rows[i][4],
          location: rows[i][5]
        });
      }
    }
    return shifts;
  } catch (err) {
    console.error('getStaffAvailableShifts error:', err);
    return [];
  }
}

async function requestShifts(email, name, shifts) {
  try {
    const timestamp = new Date().toISOString();

    for (let shift of shifts) {
      const row = [
        timestamp,
        email,
        name,
        shift.date,
        shift.jobType,
        shift.location,
        'PENDING',
        '',
        ''
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Requests!A:I',
        valueInputOption: 'RAW',
        resource: { values: [row] }
      });
    }

    // Send emails to rostering officers for each location
    const locations = [...new Set(shifts.map(s => s.location))];
    for (let location of locations) {
      const officerResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `Rostering Officers!A:C`
      });
      const officers = officerResponse.data.values || [];
      for (let officer of officers) {
        if (officer[0] === location) {
          const shiftList = shifts.filter(s => s.location === location).map(s => `${s.date} - ${s.jobType}`).join('<br>');
          const htmlBody = `<p>Dear ${officer[1]},</p>
<p>${name} has requested the following shifts:</p>
<p>${shiftList}</p>
<p>Please log in to Rural Rosters to approve or deny these requests.</p>
<p>Thank you,<br>Rural Rosters Support</p>`;

          await transporter.sendMail({
            from: GMAIL_USER,
            to: officer[2],
            subject: `[Rural Rosters] New Shift Request from ${name}`,
            html: htmlBody
          });
        }
      }
    }

    return { success: true, message: 'Shift requests submitted' };
  } catch (err) {
    console.error('requestShifts error:', err);
    return { error: err.toString() };
  }
}

async function listShiftForSwap(email, name, date, jobType, location, isServiceDisruption, availableDays) {
  try {
    const timestamp = new Date().toISOString();

    // Add to Marketplace Listings with status "Pending Verification"
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
      range: 'Marketplace Listings!A:H',
      valueInputOption: 'RAW',
      resource: { values: [row] }
    });

    // Send email to rostering officer
    const officerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `Rostering Officers!A:C`
    });
    const officers = officerResponse.data.values || [];
    for (let officer of officers) {
      if (officer[0] === location) {
        const htmlBody = `<p>Dear ${officer[1]},</p>
<p>${name} has offered a shift for swap:</p>
<p><strong>${date} - ${jobType} @ ${location}</strong></p>
<p>Available days/shifts: ${availableDays || 'Not specified'}</p>
<p>Please log in to Rural Rosters to approve or deny this swap offer.</p>
<p>Thank you,<br>Rural Rosters Support</p>`;

        await transporter.sendMail({
          from: GMAIL_USER,
          to: officer[2],
          subject: `[Rural Rosters] Swap Offer from ${name}`,
          html: htmlBody
        });
      }
    }

    return { success: true, message: 'Swap offer submitted for verification' };
  } catch (err) {
    console.error('listShiftForSwap error:', err);
    return { error: err.toString() };
  }
}

async function getMarketplaceListings(email) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Listings!A:H'
    });
    const rows = response.data.values || [];
    const listings = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][5] && rows[i][5].toUpperCase() === 'AVAILABLE') {
        listings.push({
          originalEmail: rows[i][0],
          originalName: rows[i][1],
          date: rows[i][2],
          jobType: rows[i][3],
          location: rows[i][4],
          status: rows[i][5],
          isServiceDisruption: rows[i][6] === 'Y',
          availableDays: rows[i][7] || ''
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
    const timestamp = new Date().toISOString();

    const row = [
      claimingEmail,
      claimingName,
      originalEmail,
      originalName,
      date,
      jobType,
      location,
      timestamp,
      'PENDING'
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Claims!A:I',
      valueInputOption: 'RAW',
      resource: { values: [row] }
    });

    return { success: true, message: 'Shift claimed' };
  } catch (err) {
    console.error('claimShift error:', err);
    return { error: err.toString() };
  }
}

async function getOfficerMarketplaceListings(email) {
  try {
    const locations = await getOfficerLocations(email);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Listings!A:H'
    });
    const rows = response.data.values || [];
    const listings = [];
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][4] && locations.includes(rows[i][4]) && rows[i][5] && rows[i][5].toUpperCase() === 'PENDING VERIFICATION') {
        listings.push({
          originalEmail: rows[i][0],
          originalName: rows[i][1],
          date: rows[i][2],
          jobType: rows[i][3],
          location: rows[i][4],
          status: rows[i][5],
          isServiceDisruption: rows[i][6] === 'Y',
          availableDays: rows[i][7] || ''
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
      range: 'Marketplace Claims!A:I'
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
      range: 'Requests!A:G'
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
    // Update Marketplace Claims status to APPROVED
    const claimsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Claims!A:I'
    });
    const claimsRows = claimsResponse.data.values || [];
    for (let i = 1; i < claimsRows.length; i++) {
      if (claimsRows[i][0] === claimingEmail && claimsRows[i][2] === originalEmail && claimsRows[i][4] === date) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Marketplace Claims!I${i + 1}`,
          valueInputOption: 'RAW',
          resource: { values: [['APPROVED']] }
        });
        break;
      }
    }

    // Send emails
    await transporter.sendMail({
      from: GMAIL_USER,
      to: claimingEmail,
      subject: `[Rural Rosters] Swap Approved`,
      html: `<p>Dear ${claimingName},</p><p>Your swap for ${date} - ${jobType} @ ${location} has been approved!</p>`
    });

    await transporter.sendMail({
      from: GMAIL_USER,
      to: originalEmail,
      subject: `[Rural Rosters] Swap Approved`,
      html: `<p>Dear ${originalName},</p><p>Your shift swap on ${date} - ${jobType} @ ${location} has been approved!</p>`
    });

    return { success: true };
  } catch (err) {
    console.error('approveSwap error:', err);
    return { error: err.toString() };
  }
}

async function denySwap(claimingEmail, claimingName, originalEmail, originalName, officerEmail, officerName, date, jobType, location) {
  try {
    // Update Marketplace Claims status to DENIED
    const claimsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Claims!A:I'
    });
    const claimsRows = claimsResponse.data.values || [];
    for (let i = 1; i < claimsRows.length; i++) {
      if (claimsRows[i][0] === claimingEmail && claimsRows[i][2] === originalEmail && claimsRows[i][4] === date) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Marketplace Claims!I${i + 1}`,
          valueInputOption: 'RAW',
          resource: { values: [['DENIED']] }
        });
        break;
      }
    }

    return { success: true };
  } catch (err) {
    console.error('denySwap error:', err);
    return { error: err.toString() };
  }
}

async function saveOfficerVacancies(email, vacancies) {
  try {
    const locations = await getOfficerLocations(email);
    
    for (let vacancy of vacancies) {
      if (!locations.includes(vacancy.location)) {
        return { error: `You don't have permission to add vacancies at ${vacancy.location}` };
      }

      const sheetName = 'Vacancies - ' + vacancy.location;
      const row = [vacancy.date, vacancy.jobType, vacancy.location];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: `'${sheetName}'!A:C`,
        valueInputOption: 'RAW',
        resource: { values: [row] }
      });
    }

    return { success: true, message: `${vacancies.length} vacancy/vacancies saved` };
  } catch (err) {
    console.error('saveOfficerVacancies error:', err);
    return { error: err.toString() };
  }
}

async function approvePendingSwap(staffEmail, staffName, date, jobType, location) {
  try {
    // Get the shift details from Marketplace Listings
    const listingsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Listings!A:H'
    });
    const listingsRows = listingsResponse.data.values || [];
    let availableDays = '';

    for (let i = 1; i < listingsRows.length; i++) {
      if (listingsRows[i][0] === staffEmail && listingsRows[i][2] === date && listingsRows[i][3] === jobType && listingsRows[i][4] === location) {
        // Update status to Available
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Marketplace Listings!F${i + 1}`,
          valueInputOption: 'RAW',
          resource: { values: [['Available']] }
        });
        availableDays = listingsRows[i][7] || '';
        break;
      }
    }

    // Send email to staff
    const htmlBody = `<p>Dear ${staffName},</p>
<p>Your swap request has been approved!</p>
<p><strong>${date} - ${jobType} @ ${location}</strong></p>
<p>Your shift is now available in the marketplace for other staff to claim.</p>
<p>Available days/shifts: ${availableDays}</p>
<p>Thank you,<br>Rural Rosters Support</p>`;

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
    // Remove from Marketplace Listings
    const listingsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Marketplace Listings!A:H'
    });
    const listingsRows = listingsResponse.data.values || [];

    for (let i = 1; i < listingsRows.length; i++) {
      if (listingsRows[i][0] === staffEmail && listingsRows[i][2] === date && listingsRows[i][3] === jobType && listingsRows[i][4] === location) {
        // Mark as Denied instead of deleting
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Marketplace Listings!F${i + 1}`,
          valueInputOption: 'RAW',
          resource: { values: [['Denied']] }
        });
        break;
      }
    }

    // Send email with reason
    const htmlBody = `<p>Dear ${staffName},</p>
<p>Your shift swap request has been <strong>DENIED</strong>.</p>
<p><strong>${date} - ${jobType} @ ${location}</strong></p>
<p><strong>Reason:</strong> ${reason}</p>
<p>Please contact your rostering officer directly to discuss this and make other arrangements for this shift.</p>
<p>Thank you,<br>Rural Rosters Support</p>`;

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
    // Update the Requests sheet to mark as APPROVED
    const requestsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Requests!A:G'
    });
    const requestsRows = requestsResponse.data.values || [];

    for (let i = 1; i < requestsRows.length; i++) {
      if (requestsRows[i][1] === email && requestsRows[i][3] === date && requestsRows[i][4] === jobType && requestsRows[i][5] === location && requestsRows[i][6] === 'PENDING') {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Requests!G${i + 1}`,
          valueInputOption: 'RAW',
          resource: { values: [['APPROVED']] }
        });
        break;
      }
    }

    // Send email
    const htmlBody = `<p>Dear ${name},</p>
<p>Your shift request has been <strong>APPROVED</strong>!</p>
<p><strong>${date} - ${jobType} @ ${location}</strong></p>
<p>Thank you,<br>Rural Rosters Support</p>`;

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
    // Update the Requests sheet to mark as DENIED
    const requestsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Requests!A:G'
    });
    const requestsRows = requestsResponse.data.values || [];

    for (let i = 1; i < requestsRows.length; i++) {
      if (requestsRows[i][1] === email && requestsRows[i][3] === date && requestsRows[i][4] === jobType && requestsRows[i][5] === location && requestsRows[i][6] === 'PENDING') {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Requests!G${i + 1}`,
          valueInputOption: 'RAW',
          resource: { values: [['DENIED']] }
        });
        break;
      }
    }

    // Send email
    const htmlBody = `<p>Dear ${name},</p>
<p>Your shift request has been <strong>DENIED</strong>.</p>
<p><strong>${date} - ${jobType} @ ${location}</strong></p>
<p>Please contact your rostering officer to discuss other options.</p>
<p>Thank you,<br>Rural Rosters Support</p>`;

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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
