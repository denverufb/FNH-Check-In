// FNH Field Check — Google Apps Script backend
//
// Before deployment, replace the placeholder below with the private teacher
// sync key shown in the app's Teacher Setup screen. Never commit the real key
// to a public GitHub repository.

const TEACHER_KEY = 'REPLACE_WITH_THE_PRIVATE_TEACHER_SYNC_KEY';
const LOG_SHEET_NAME = 'Field Log';

function getLogSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('This script must be created from Extensions → Apps Script inside the FNH Google Sheet.');
  }

  let sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(LOG_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'Student',
      'Destination',
      'Status',
      'Latitude',
      'Longitude',
      'Accuracy',
      'Map',
      'Time zone'
    ]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getLogSheet_();

    if (data.action === 'reset') {
      if (data.teacherKey !== TEACHER_KEY) return json_({ error: 'Unauthorized' });
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
      }
      return json_({ ok: true, reset: true });
    }

    sheet.appendRow([
      new Date(data.at),
      data.student || '',
      data.destination || '',
      data.status || '',
      data.latitude || '',
      data.longitude || '',
      data.accuracy || '',
      data.mapsUrl || '',
      data.deviceTimeZone || ''
    ]);

    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: String(error.message || error) });
  }
}

function doGet(e) {
  if (!e || !e.parameter || e.parameter.key !== TEACHER_KEY) {
    return json_({ error: 'Unauthorized' });
  }

  try {
    const rows = getLogSheet_().getDataRange().getValues();
    const events = rows.slice(1).map(function(row) {
      return {
        at: new Date(row[0]).toISOString(),
        student: row[1],
        destination: row[2],
        status: row[3],
        latitude: row[4],
        longitude: row[5],
        accuracy: row[6],
        mapsUrl: row[7],
        deviceTimeZone: row[8]
      };
    }).filter(function(event) {
      return event.student;
    }).slice(-500);

    return json_({ events: events });
  } catch (error) {
    return json_({ error: String(error.message || error) });
  }
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
