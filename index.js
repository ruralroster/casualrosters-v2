const BACKEND_URL = 'https://ruralrostersproxy-staging-168129620374.australia-southeast1.run.app';
const LOCATIONS = ['Innisfail', 'Mareeba', 'Tully', 'Yarrabah', 'Atherton', 'Mossman', 'Babinda', 'Cairns', 'Telehealth', 'TestHub'];
const JOB_TYPES_BY_LOCATION = {
    'Innisfail': ['Day', 'Night', 'RFDS'],
    'Mareeba': ['Day', 'Night'],
    'Tully': ['Day', 'Night'],
    'Yarrabah': ['Day', 'Night'],
    'Atherton': ['Day'],
    'Mossman': ['Day'],
    'Babinda': ['Day'],
    'Cairns': ['Day', 'Night', 'RFDS'],
    'Telehealth': ['Day'],
    'TestHub': ['Day', 'Night', 'RFDS']
};

let currentUser = null;
let userRole = null;
let userLocations = [];
let officerLocations = [];
let pendingDenySwap = null;
let pendingFortnightSwap = null;

async function callBackend(action, params) {
    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action, params})
        });
        return await response.json();
    } catch(err) {
        console.error('Backend error:', err);
        return { error: err.toString() };
    }
}

function loginWithEmail() {
    const email = document.getElementById('emailInput').value.trim().toLowerCase();
    const password = document.getElementById('passwordInput').value;
    
    if (!email || !password) {
        showMessage('Please enter both email and password', 'error');
        return;
    }

    callBackend('checkUserExists', {email, password}).then(user => {
        if (user && user.error) {
            showMessage(user.error, 'error');
            return;
        }
        if (user) {
            currentUser = { email: user.email, name: user.name };
            userRole = user.role;
            userLocations = user.locations ? user.locations.split(',').map(l => l.trim()) : [];
            showDashboard();
        }
    });
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainDashboard').style.display = 'block';
    document.getElementById('userNameDisplay').textContent = currentUser.name || currentUser.email;
    
    if (userRole === 'Officer') {
        callBackend('getOfficerLocations', {email: currentUser.email}).then(locs => {
            officerLocations = locs || [];
            setupTabs();
            setTimeout(() => loadMyVacancies(), 500);
        });
    } else {
        setupTabs();
        setTimeout(() => loadStaffShifts(), 500);
    }
}

function setupTabs() {
    const tabsContainer = document.getElementById('tabsContainer');
    const tabsContent = document.getElementById('tabsContent');
    
    tabsContainer.innerHTML = '';
    tabsContent.innerHTML = '';

    if (userRole === 'Officer') {
        tabsContainer.innerHTML = `
            <button class="tab-button active" onclick="switchTab(0, this)">My Vacancies</button>
            <button class="tab-button" onclick="switchTab(1, this)">Shift Cover Approvals</button>
            <button class="tab-button" onclick="switchTab(2, this)">Pending Swaps</button>
        `;
        tabsContent.innerHTML = `
            <div id="tab-0" class="tab-content active">
                <h3>My Vacancies</h3>
                <button class="btn-primary" onclick="addVacancyRow()">+ Add Shift</button>
                <button class="btn-primary" onclick="saveVacancies()" style="margin-left: 10px;">Save Changes</button>
                <div id="vacanciesContainer"></div>
            </div>
            <div id="tab-1" class="tab-content"><h3>Shift Cover Approvals</h3><div id="approvalsContainer"></div></div>
            <div id="tab-2" class="tab-content"><h3>Pending Swaps</h3><div id="swapsContainer"></div></div>
        `;
    } else {
        tabsContainer.innerHTML = `
            <button class="tab-button active" onclick="switchTab(0, this)">Available Shifts</button>
            <button class="tab-button" onclick="switchTab(1, this)">Shift Swaps</button>
            <button class="tab-button" onclick="switchTab(2, this)">Settings</button>
        `;
        tabsContent.innerHTML = `
            <div id="tab-0" class="tab-content active"><h3>Available Shifts</h3><button class="btn-primary" onclick="requestShifts()" style="margin-bottom: 15px;">Request Selected Shifts</button><div id="shiftsContainer"></div></div>
            <div id="tab-1" class="tab-content">
                <h3>Shift Swaps</h3>
                <h4>Current Shifts Up for Swap (Approved)</h4>
                <div id="currentSwapsContainer"></div>
                <h4 style="margin-top: 30px;">List a New Shift for Swap</h4>
                <div class="form-group"><label>Date</label><input type="date" id="swapDate" /></div>
                <div class="form-group"><label>Location</label><select id="swapLocation" onchange="updateSwapJobTypes()"><option value="">Select Location</option></select></div>
                <div class="form-group"><label>Job Type</label><select id="swapJobType"><option value="">Select Job Type</option></select></div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;"><input type="checkbox" id="swapIsServiceDisruption" /><label for="swapIsServiceDisruption" style="margin-bottom: 0;">Service-disruption shift</label></div>
                <button class="btn-primary" onclick="openFortnightModal()">Select Available Days</button>
            </div>
            <div id="tab-2" class="tab-content">
                <h3>Settings</h3>
                <h4>Work Location Preferences</h4>
                <div id="locationList"></div>
                <button class="btn-primary" style="margin-top: 20px;" onclick="saveSettings()">Save Settings</button>
            </div>
        `;
        populateSwapLocations();
        loadLocationCheckboxes();
    }
}

function switchTab(idx, btn) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + idx).classList.add('active');
    btn.classList.add('active');
    
    if (userRole === 'Officer') {
        if (idx === 0) loadMyVacancies();
        if (idx === 1) loadOfficerApprovals();
        if (idx === 2) loadPendingSwaps();
    } else {
        if (idx === 0) loadStaffShifts();
        if (idx === 1) loadCurrentSwaps();
    }
}

function loadMyVacancies() {
    showMessage('Loading vacancies...', 'info');
    callBackend('getOfficerVacancies', {email: currentUser.email}).then(vacancies => {
        renderVacancies(vacancies || []);
    });
}

function renderVacancies(vacancies) {
    const container = document.getElementById('vacanciesContainer');
    
    if (!vacancies || vacancies.length === 0) {
        container.innerHTML = '<p style="color: #999;">No vacancies yet</p>';
        return;
    }

    let html = '<table><tr><th>Date</th><th>Location</th><th>Job Type</th><th>Action</th></tr>';
    
    vacancies.forEach((vac) => {
        let dateString = '';
        if (vac.date && vac.date.includes('/')) {
            const parts = vac.date.split('/');
            if (parts.length === 3) {
                dateString = parts[2] + '-' + String(parts[1]).padStart(2, '0') + '-' + String(parts[0]).padStart(2, '0');
            }
        }
        
        html += `<tr>
            <td><input type="date" class="vac-date" value="${dateString}" disabled style="background: #f9f9f9; cursor: not-allowed;" /></td>
            <td style="padding: 12px;">${vac.location}</td>
            <td><input type="text" value="${vac.jobType}" disabled style="background: #f9f9f9; cursor: not-allowed;" /></td>
            <td><button class="btn-secondary" onclick="removeVacancyRow(this)" style="padding: 4px 8px; font-size: 12px;">Remove</button></td>
        </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
}

function addVacancyRow() {
    const container = document.getElementById('vacanciesContainer');
    let table = container.querySelector('table');
    
    if (!table) {
        container.innerHTML = '<table><tr><th>Date</th><th>Location</th><th>Job Type</th><th>Action</th></tr></table>';
        table = container.querySelector('table');
    }
    
    const newRow = table.insertRow();
    
    let locHtml = '<select class="vac-location" onchange="updateNewRowJobTypes(this)" style="width: 100%; padding: 6px;"><option value="">Select Location</option>';
    officerLocations.forEach(loc => {
        locHtml += `<option value="${loc}">${loc}</option>`;
    });
    locHtml += '</select>';
    
    newRow.innerHTML = `<td><input type="date" class="vac-date" style="width: 100%; padding: 6px; border: 1px solid #ddd;"></td>
    <td>${locHtml}</td>
    <td><select class="vac-jobtype" style="width: 100%; padding: 6px;"><option value="">Select Job Type</option></select></td>
    <td><button class="btn-secondary" onclick="removeVacancyRow(this)" style="padding: 4px 8px; font-size: 12px;">Remove</button></td>`;
}

function updateNewRowJobTypes(select) {
    const location = select.value;
    const row = select.closest('tr');
    const jobTypeSelect = row.querySelector('.vac-jobtype');
    const jobTypes = JOB_TYPES_BY_LOCATION[location] || [];
    
    jobTypeSelect.innerHTML = '<option value="">Select Job Type</option>';
    jobTypes.forEach(jt => {
        const opt = document.createElement('option');
        opt.value = jt;
        opt.textContent = jt;
        jobTypeSelect.appendChild(opt);
    });
}

function removeVacancyRow(btn) {
    btn.parentElement.parentElement.remove();
}

function saveVacancies() {
    const rows = document.querySelectorAll('#vacanciesContainer table tr');
    const vacancies = [];
    
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const dateInput = row.querySelector('.vac-date');
        const jobtypeSelect = row.querySelector('.vac-jobtype');
        const locationSelect = row.querySelector('.vac-location');
        
        if (dateInput && jobtypeSelect && locationSelect && !dateInput.disabled) {
            let date = dateInput.value;
            const jobType = jobtypeSelect.value;
            const location = locationSelect.value;
            
            if (date && date.includes('-')) {
                const [year, month, day] = date.split('-');
                date = day + '/' + month + '/' + year;
            }
            
            if (date && jobType && location) {
                vacancies.push({ date, jobType, location });
            }
        }
    }

    if (vacancies.length === 0) {
        showMessage('No valid new vacancies to save', 'error');
        return;
    }

    showMessage('Saving vacancies...', 'info');

    callBackend('saveOfficerVacancies', {
        email: currentUser.email,
        vacancies: vacancies
    }).then(result => {
        if (result.error) {
            showMessage(result.error, 'error');
        } else {
            showMessage('✓ Vacancies saved', 'success');
            loadMyVacancies();
        }
    });
}

function loadOfficerApprovals() {
    showMessage('Loading approvals...', 'info');
    Promise.all([
        callBackend('getOfficerPendingApprovals', {email: currentUser.email}),
        callBackend('getOfficerPastApprovals', {email: currentUser.email})
    ]).then(([pending, past]) => {
        renderApprovals(pending || [], past || []);
    });
}

function renderApprovals(pending, past) {
    const container = document.getElementById('approvalsContainer');
    
    let html = '';

    // Outstanding Cover Requests
    if (pending.length === 0) {
        html += '<h4>Outstanding Cover Requests</h4><p style="color: #999;">No outstanding requests</p>';
    } else {
        html += '<h4>Outstanding Cover Requests</h4>';
        const grouped = {};
        pending.forEach(claim => {
            const key = claim.date + '|' + claim.jobType + '|' + claim.location;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(claim);
        });

        for (let key in grouped) {
            const claimList = grouped[key];
            const first = claimList[0];
            html += `<div class="shift-item">
                <div class="shift-item-header">
                    <strong>${first.date} - ${first.jobType} @ ${first.location}</strong>
                </div>`;
            
            claimList.forEach((claim) => {
                html += `<div class="applicant-row">
                    <div class="applicant-info">
                        <strong>${claim.claimingName}</strong><br>
                        <span style="color: #666; font-size: 12px;">Submitted: ${claim.claimedTimestamp}</span>
                    </div>
                    <div class="applicant-buttons">
                        <button class="btn-success" onclick="approveSwapCall('${claim.claimingEmail}', '${claim.claimingName}', '${claim.originalEmail || ''}', '${claim.originalName || ''}', '${claim.date}', '${claim.jobType}', '${claim.location}')">Approve</button>
                        <button class="btn-danger" onclick="denySwapCall('${claim.claimingEmail}', '${claim.claimingName}', '${claim.originalEmail || ''}', '${claim.originalName || ''}', '${claim.date}', '${claim.jobType}', '${claim.location}')">Deny</button>
                    </div>
                </div>`;
            });
            html += '</div>';
        }
    }

    // Past Cover Requests
    html += '<h4>Past Cover Requests</h4>';
    if (past.length === 0) {
        html += '<p style="color: #999;">No resolved requests</p>';
    } else {
        html += '<table>';
        html += '<tr><th>Shift Date</th><th>Location</th><th>Job Type</th><th>Date Resolved</th><th>Shift Approved For</th><th>Shift Denied For</th></tr>';
        
        past.forEach(item => {
            const approvedLink = item.approved ? `<a href="mailto:${item.approved.email}">${item.approved.name}</a>` : '-';
            const deniedLinks = item.denied.length > 0 ? item.denied.map(d => `<a href="mailto:${d.email}">${d.name}</a>`).join(', ') : '-';
            
            html += `<tr>
                <td>${item.date}</td>
                <td>${item.location}</td>
                <td>${item.jobType}</td>
                <td>${item.resolvedDate}</td>
                <td>${approvedLink}</td>
                <td>${deniedLinks}</td>
            </tr>`;
        });
        html += '</table>';
    }

    container.innerHTML = html;
}

function approveSwapCall(claimingEmail, claimingName, originalEmail, originalName, date, jobType, location) {
    showMessage('Approving swap...', 'info');
    callBackend('approveSwap', {
        claimingEmail, claimingName, originalEmail, originalName,
        officerEmail: currentUser.email,
        officerName: currentUser.name,
        date, jobType, location
    }).then(result => {
        if (result.error) showMessage(result.error, 'error');
        else { showMessage('✓ Approved and auto-denied other applicants', 'success'); loadOfficerApprovals(); }
    });
}

function denySwapCall(claimingEmail, claimingName, originalEmail, originalName, date, jobType, location) {
    showMessage('Denying swap...', 'info');
    callBackend('denySwap', {
        claimingEmail, claimingName, originalEmail, originalName,
        officerEmail: currentUser.email,
        officerName: currentUser.name,
        date, jobType, location
    }).then(result => {
        if (result.error) showMessage(result.error, 'error');
        else { showMessage('✓ Denied', 'success'); loadOfficerApprovals(); }
    });
}

function loadPendingSwaps() {
    showMessage('Loading pending swaps...', 'info');
    callBackend('getOfficerMarketplaceListings', {email: currentUser.email}).then(listings => {
        renderPendingSwaps(listings || []);
    });
}

function renderPendingSwaps(listings) {
    const container = document.getElementById('swapsContainer');
    
    if (!listings || listings.length === 0) {
        container.innerHTML = '<p style="color: #999;">No pending swaps</p>';
        return;
    }

    let html = '';
    listings.forEach(listing => {
        const color = listing.isServiceDisruption ? '#ffe6e6' : '#f9f9f9';
        const borderColor = listing.isServiceDisruption ? '#dc3545' : '#000';
        html += `<div style="background: ${color}; border-left: 4px solid ${borderColor}; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                <strong>${listing.date} - ${listing.jobType} @ ${listing.location}</strong>
                ${listing.isServiceDisruption ? '<span style="color: #dc3545; font-weight: bold;">SERVICE-DISRUPTION</span>' : ''}
            </div>
            <div style="color: #666; font-size: 13px; margin-bottom: 10px;">Offered by: ${listing.originalName}</div>
            <div style="display: flex; gap: 10px;">
                <button class="btn-success" style="padding: 6px 12px; font-size: 12px;" onclick="approvePendingSwap('${listing.originalEmail}', '${listing.originalName}', '${listing.date}', '${listing.jobType}', '${listing.location}')">Approve to Marketplace</button>
                <button class="btn-danger" style="padding: 6px 12px; font-size: 12px;" onclick="openDenySwapModal('${listing.originalEmail}', '${listing.originalName}', '${listing.date}', '${listing.jobType}', '${listing.location}')">Deny</button>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function approvePendingSwap(email, name, date, jobType, location) {
    showMessage('Approving pending swap for marketplace...', 'info');
    callBackend('approvePendingSwap', {
        staffEmail: email,
        staffName: name,
        date, jobType, location
    }).then(result => {
        if (result.error) showMessage(result.error, 'error');
        else { 
            showMessage('✓ Swap approved and moved to marketplace', 'success'); 
            loadPendingSwaps();
        }
    });
}

function openDenySwapModal(email, name, date, jobType, location) {
    pendingDenySwap = { email, name, date, jobType, location };
    document.getElementById('denySwapModal').classList.add('active');
    document.getElementById('denyReason').value = '';
}

function closeDenyModal() {
    document.getElementById('denySwapModal').classList.remove('active');
    pendingDenySwap = null;
}

function submitDenySwap() {
    if (!pendingDenySwap) return;
    
    const reason = document.getElementById('denyReason').value.trim();
    if (!reason) {
        showMessage('Please provide a reason', 'error');
        return;
    }

    showMessage('Denying swap...', 'info');
    callBackend('denySwapWithReason', {
        staffEmail: pendingDenySwap.email,
        staffName: pendingDenySwap.name,
        date: pendingDenySwap.date,
        jobType: pendingDenySwap.jobType,
        location: pendingDenySwap.location,
        reason: reason
    }).then(result => {
        if (result.error) showMessage(result.error, 'error');
        else {
            showMessage('✓ Swap denied and email sent', 'success');
            closeDenyModal();
            loadPendingSwaps();
        }
    });
}

function loadStaffShifts() {
    showMessage('Loading shifts...', 'info');
    callBackend('getStaffAvailableShifts', {email: currentUser.email}).then(shifts => {
        renderAllShifts(shifts || []);
    });
}

function renderAllShifts(shifts) {
    const container = document.getElementById('shiftsContainer');
    if (!shifts || shifts.length === 0) {
        container.innerHTML = '<p style="color: #999;">No shifts available</p>';
        return;
    }

    let html = '';
    shifts.forEach((shift, idx) => {
        html += `<div class="shift-item">
            <div class="shift-item-header">
                <input type="checkbox" class="shift-checkbox" value="${idx}" style="margin-right: 10px;">
                <label style="margin-bottom: 0; flex: 1;"><strong>${shift.date} - ${shift.jobType} @ ${shift.location}</strong></label>
            </div>
        </div>`;
    });
    
    container.innerHTML = html;
}

function requestShifts() {
    const checkboxes = document.querySelectorAll('.shift-checkbox:checked');
    if (checkboxes.length === 0) {
        showMessage('Please select at least one shift', 'error');
        return;
    }

    showMessage('Sending shift requests...', 'info');
    callBackend('requestShifts', {
        email: currentUser.email,
        name: currentUser.name,
        shifts: Array.from(checkboxes).map(cb => {
            const item = cb.parentElement.parentElement;
            const text = item.querySelector('label strong').textContent;
            const [date, jobAndLocation] = text.split(' - ');
            const [jobType, location] = jobAndLocation.split(' @ ');
            return { date: date.trim(), jobType: jobType.trim(), location: location.trim() };
        })
    }).then(result => {
        if (result.error) showMessage(result.error, 'error');
        else {
            showMessage('✓ Shift requests sent!', 'success');
            Array.from(checkboxes).forEach(cb => cb.checked = false);
        }
    });
}

function loadCurrentSwaps() {
    callBackend('getMarketplaceListings', {email: currentUser.email}).then(swaps => {
        const container = document.getElementById('currentSwapsContainer');
        if (!swaps || swaps.length === 0) {
            container.innerHTML = '<p style="color: #999;">No approved swaps available (awaiting officer approval of your swap offers)</p>';
        } else {
            let html = '';
            swaps.forEach(s => {
                const availableDaysText = s.availableDays ? `<div style="color: #666; font-size: 12px; margin-top: 5px;"><strong>Can work:</strong> ${s.availableDays}</div>` : '';
                html += `<div class="shift-item">
                    <div><strong>${s.date} - ${s.jobType} @ ${s.location}</strong></div>
                    <div style="color: #666; font-size: 13px;">Offered by: ${s.originalName}</div>
                    ${availableDaysText}
                </div>`;
            });
            container.innerHTML = html;
        }
    });
}

function populateSwapLocations() {
    const select = document.getElementById('swapLocation');
    select.innerHTML = '<option value="">Select Location</option>';
    userLocations.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc;
        opt.textContent = loc;
        select.appendChild(opt);
    });
}

function updateSwapJobTypes() {
    const location = document.getElementById('swapLocation').value;
    const jobTypeSelect = document.getElementById('swapJobType');
    const jobTypes = JOB_TYPES_BY_LOCATION[location] || [];
    
    jobTypeSelect.innerHTML = '<option value="">Select Job Type</option>';
    jobTypes.forEach(jt => {
        const opt = document.createElement('option');
        opt.value = jt;
        opt.textContent = jt;
        jobTypeSelect.appendChild(opt);
    });
}

function openFortnightModal() {
    const date = document.getElementById('swapDate').value;
    const location = document.getElementById('swapLocation').value;
    const jobType = document.getElementById('swapJobType').value;

    if (!date || !location || !jobType) {
        showMessage('Please fill in Date, Location, and Job Type first', 'error');
        return;
    }

    pendingFortnightSwap = { date, location, jobType };
    renderFortnightGrid(date);
    document.getElementById('fortnightModal').classList.add('active');
}

function renderFortnightGrid(dateStr) {
    const container = document.getElementById('fortnightGrid');
    
    const [year, month, day] = dateStr.split('-');
    const shiftDate = new Date(year, parseInt(month) - 1, parseInt(day));
    
    const fortnightStart = new Date(shiftDate);
    const dayOfWeek = fortnightStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
    fortnightStart.setDate(fortnightStart.getDate() + daysToMonday);

    let html = '<div class="fortnight-grid">';
    
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 14; i++) {
        const d = new Date(fortnightStart);
        d.setDate(d.getDate() + i);
        const dayName = dayNames[i % 7];
        const dateNum = d.getDate();
        html += `<div class="fortnight-day">${dayName}<br>${dateNum}</div>`;
    }

    html += '</div><div style="margin-top: 20px;"><h4>Day Shifts</h4><div class="fortnight-grid">';
    for (let i = 0; i < 14; i++) {
        html += `<div class="fortnight-checkbox"><input type="checkbox" class="fortnight-day-checkbox" value="${i}"><label style="margin-bottom: 0; font-size: 11px;">Day</label></div>`;
    }
    html += '</div></div>';

    html += '<div style="margin-top: 20px;"><h4>Night Shifts</h4><div class="fortnight-grid">';
    for (let i = 0; i < 14; i++) {
        html += `<div class="fortnight-checkbox"><input type="checkbox" class="fortnight-night-checkbox" value="${i}"><label style="margin-bottom: 0; font-size: 11px;">Night</label></div>`;
    }
    html += '</div></div>';

    container.innerHTML = html;
}

function submitFortnightSelection() {
    const dayChecks = Array.from(document.querySelectorAll('.fortnight-day-checkbox:checked')).map(cb => `Day-${cb.value}`);
    const nightChecks = Array.from(document.querySelectorAll('.fortnight-night-checkbox:checked')).map(cb => `Night-${cb.value}`);
    const selectedDays = [...dayChecks, ...nightChecks];

    if (selectedDays.length === 0) {
        showMessage('Please select at least one day', 'error');
        return;
    }

    showMessage('Submitting swap request (pending officer approval)...', 'info');
    callBackend('listShiftForSwap', {
        email: currentUser.email,
        name: currentUser.name,
        date: pendingFortnightSwap.date,
        jobType: pendingFortnightSwap.jobType,
        location: pendingFortnightSwap.location,
        isServiceDisruption: document.getElementById('swapIsServiceDisruption').checked,
        availableDays: selectedDays.join(',')
    }).then(result => {
        if (result.error) showMessage(result.error, 'error');
        else {
            showMessage('✓ Swap request submitted and pending officer approval', 'success');
            document.getElementById('swapDate').value = '';
            document.getElementById('swapLocation').value = '';
            document.getElementById('swapJobType').value = '';
            document.getElementById('swapIsServiceDisruption').checked = false;
            closeFortnightModal();
            loadCurrentSwaps();
        }
    });
}

function closeFortnightModal() {
    document.getElementById('fortnightModal').classList.remove('active');
    pendingFortnightSwap = null;
}

function loadLocationCheckboxes() {
    const container = document.getElementById('locationList');
    let html = '';
    LOCATIONS.forEach(loc => {
        const checked = userLocations.includes(loc) ? ' checked' : '';
        html += `<div class="location-item"><input type="checkbox" id="loc-${loc}" value="${loc}"${checked}><label for="loc-${loc}">${loc}</label></div>`;
    });
    container.innerHTML = html;
}

function saveSettings() {
    const checkboxes = document.querySelectorAll('#locationList input[type="checkbox"]:checked');
    userLocations = Array.from(checkboxes).map(cb => cb.value);
    
    if (userLocations.length === 0) {
        showMessage('Please select at least one location', 'error');
        return;
    }
    
    showMessage('✓ Settings saved', 'success');
    populateSwapLocations();
}

function showMessage(text, type) {
    const container = document.getElementById('messageContainer');
    if (!text) {
        container.innerHTML = '';
        return;
    }
    const messageEl = document.createElement('div');
    messageEl.className = 'message ' + type;
    messageEl.textContent = text;
    container.innerHTML = '';
    container.appendChild(messageEl);
    if (type !== 'error') setTimeout(() => { if (messageEl.parentNode) messageEl.remove(); }, 3000);
}

function logout() {
    document.getElementById('mainDashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('emailInput').value = '';
    document.getElementById('passwordInput').value = '';
}
