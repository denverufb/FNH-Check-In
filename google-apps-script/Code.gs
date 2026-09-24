// FNH Field Check — Google Apps Script backend
// Replace this placeholder with the private teacher key already used by the app.
const TEACHER_KEY = 'REPLACE_WITH_THE_PRIVATE_TEACHER_SYNC_KEY';
const LOG_SHEET_NAME = 'Field Log';
const STUDENTS_SHEET_NAME = 'Students';
const MESSAGES_SHEET_NAME = 'Messages';
const ROSTER_VERSION = 'fnh-roster-2026-09-24-v2';
const DEFAULT_STUDENTS = [
  'Ruth Allen ’28', 'Maiyah Calleb ’27', 'Michaela Coles ’28', 'Tristin Coon ’27',
  'Davis Johnson ’28', 'Taylor Lee ’27', 'Valentina Lizarazo ’28',
  'Avenly Lockhart ’28', 'Allie Medford ’28', 'Eli Morse ’27',
  'Peyton Webster ’27', 'Khanye Williams ’27', 'Allana Dow ’28',
  'Arwynne Dow ’28', 'Alana Henry ’28', 'Paige Ivy ’28'
];

function getSheet_(name, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Create this script from Extensions → Apps Script inside the FNH Google Sheet.');
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getLogSheet_() {
  return getSheet_(LOG_SHEET_NAME, ['Timestamp', 'Student', 'Destination', 'Status', 'Latitude', 'Longitude', 'Accuracy', 'Map', 'Time zone']);
}

function getStudentsSheet_() {
  const sheet = getSheet_(STUDENTS_SHEET_NAME, ['Student']);
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty('ROSTER_VERSION') !== ROSTER_VERSION) {
    const current = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat().map(String) : [];
    DEFAULT_STUDENTS.forEach(function(name) { if (current.indexOf(name) === -1) sheet.appendRow([name]); });
    properties.setProperty('ROSTER_VERSION', ROSTER_VERSION);
  }
  return sheet;
}

function getMessagesSheet_() {
  return getSheet_(MESSAGES_SHEET_NAME, ['Timestamp', 'ID', 'Recipient', 'Message']);
}

function requireTeacher_(data) {
  if (!data || data.teacherKey !== TEACHER_KEY) throw new Error('Unauthorized');
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    if (data.action === 'addStudent') {
      requireTeacher_(data);
      const name = String(data.student || '').trim();
      if (!name) throw new Error('Student name is required');
      const sheet = getStudentsSheet_();
      const current = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat() : [];
      if (current.indexOf(name) === -1) sheet.appendRow([name]);
      return json_({ ok: true });
    }
    if (data.action === 'removeStudent') {
      requireTeacher_(data);
      const name = String(data.student || '').trim();
      const sheet = getStudentsSheet_();
      for (let row = sheet.getLastRow(); row >= 2; row--) if (String(sheet.getRange(row, 1).getValue()).trim() === name) sheet.deleteRow(row);
      return json_({ ok: true });
    }
    if (data.action === 'message') {
      requireTeacher_(data);
      const message = String(data.message || '').trim();
      if (!message) throw new Error('Message is required');
      getMessagesSheet_().appendRow([new Date(), Utilities.getUuid(), data.recipient || 'Everyone', message]);
      return json_({ ok: true });
    }
    if (data.action === 'reset') {
      requireTeacher_(data);
      const sheet = getLogSheet_();
      if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
      return json_({ ok: true });
    }
    getLogSheet_().appendRow([
      new Date(), data.student || '', data.destination || '', data.status || '', data.latitude || '',
      data.longitude || '', data.accuracy || '', data.mapsUrl || '', data.deviceTimeZone || ''
    ]);
    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: String(error.message || error) });
  }
}

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    if (params.view === 'student') {
      const student = String(params.student || '');
      const messages = readMessages_().filter(function(item) { return item.recipient === 'Everyone' || (student && item.recipient === student); });
      return json_({ students: readStudents_(), messages: messages });
    }
    if (params.key !== TEACHER_KEY) return json_({ error: 'Unauthorized' });
    return json_({ events: readEvents_(), students: readStudents_(), messages: readMessages_() });
  } catch (error) {
    return json_({ error: String(error.message || error) });
  }
}

function readStudents_() {
  const sheet = getStudentsSheet_();
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat().map(String).filter(Boolean);
}

function readMessages_() {
  const rows = getMessagesSheet_().getDataRange().getValues();
  return rows.slice(1).filter(function(row) { return row[3]; }).slice(-100).map(function(row) {
    return { at: new Date(row[0]).toISOString(), id: String(row[1]), recipient: String(row[2] || 'Everyone'), message: String(row[3]) };
  });
}

function readEvents_() {
  const rows = getLogSheet_().getDataRange().getValues();
  return rows.slice(1).filter(function(row) { return row[1]; }).slice(-500).map(function(row) {
    return { at: new Date(row[0]).toISOString(), student: row[1], destination: row[2], status: row[3], latitude: row[4], longitude: row[5], accuracy: row[6], mapsUrl: row[7], deviceTimeZone: row[8] };
  });
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
