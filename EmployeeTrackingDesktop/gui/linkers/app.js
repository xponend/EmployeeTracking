const electron = require('electron');
const { PythonShell } = require('python-shell');
const { join } = require('path');
const { ipcRenderer } = require('electron');
const mysql = require('mysql2');

// Load axios with error handling
let axios;
try {
  axios = require('axios');
} catch (error) {
  console.error('Failed to load axios:', error);
}

var loop_is_stopped = true;

// Create connection with better error handling and reconnection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'employeetracking',
  port: 3306,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// Handle connection errors and reconnection
function handleDisconnect() {
  connection.on('error', function(err) {
    console.log('Database connection error:', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Reconnecting to database...');
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

connection.connect((err) => {
  if (err) {
    return console.error('ошибка: ' + err.message);
  }
  console.log('Подключено к серверу MySQL!');
  handleDisconnect();
});

var e_id = sessionStorage.getItem('e_id');
var e_name = sessionStorage.getItem('e_name');
var o_id = sessionStorage.getItem('o_id');

console.log(e_id);
console.log(e_name);
console.log(o_id);

// Listen for power events from main process
if (ipcRenderer) {
  ipcRenderer.on('power-event', (event, data) => {
    console.log(`Power event: ${data.type}`);
    pushPowerLogsToDB(data.status, getTimeStamp(), e_id, o_id);
  });
}

function getTimeStamp() {
  var today = new Date();
  var date =
    today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
  var time =
    today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
  var dateTime = date + ' ' + time;

  return dateTime;
}

function getDateOnly() {
  var today = new Date();
  var date =
    today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
  return date;
}

function pushPowerLogsToDB(pm_status, pm_log_ts, e_id_id, o_id_id) {
  var sql =
    'INSERT INTO PowerMonitoring (pm_status, pm_log_ts, e_id_id, o_id_id) VALUES (?, ?, ?, ?)';
  
  // Check if connection is alive
  if (connection.state === 'disconnected') {
    console.log('Connection is disconnected, skipping power log');
    return;
  }
  
  connection.query(
    sql,
    [pm_status, pm_log_ts, e_id_id, o_id_id],
    function (err, result) {
      if (err) {
        console.error('Power log error:', err);
        return;
      }
      console.log('Количество записей, вставленных для pm: ' + result.affectedRows);
    }
  );
}

// Compress and resize image before saving
function compressImage(canvas, quality = 0.3, maxWidth = 640, maxHeight = 480) {
  // Create a smaller canvas if the image is too large
  const originalWidth = canvas.width;
  const originalHeight = canvas.height;
  
  let newWidth = originalWidth;
  let newHeight = originalHeight;
  
  // Calculate new dimensions while maintaining aspect ratio
  if (originalWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = (originalHeight * maxWidth) / originalWidth;
  }
  
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = (originalWidth * maxHeight) / originalHeight;
  }
  
  // Create new canvas with compressed size
  const compressedCanvas = document.createElement('canvas');
  compressedCanvas.width = newWidth;
  compressedCanvas.height = newHeight;
  
  const ctx = compressedCanvas.getContext('2d');
  ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
  
  // Return compressed base64 with reduced quality
  const compressedData = compressedCanvas.toDataURL('image/jpeg', quality);
  
  // Log the size for debugging
  console.log(`Compressed image size: ${Math.round(compressedData.length / 1024)} KB`);
  
  return compressedData;
}

async function fullscreenScreenshot(callback, imageFormat) {
  imageFormat = imageFormat || 'image/jpeg';

  const handleStream = (stream) => {
    var video = document.createElement('video');
    video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';

    video.onloadedmetadata = function () {
      video.style.height = this.videoHeight + 'px';
      video.style.width = this.videoWidth + 'px';
      video.play();

      var canvas = document.createElement('canvas');
      canvas.width = this.videoWidth;
      canvas.height = this.videoHeight;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (callback) {
        // Compress the image before sending to callback
        const compressedImage = compressImage(canvas, 0.2, 640, 480);
        callback(compressedImage);
      } else {
        console.log('Нужен callback!');
      }

      video.remove();
      try {
        stream.getTracks()[0].stop();
      } catch (e) {}
    };

    video.srcObject = stream;
    document.body.appendChild(video);
  };

  const handleError = function (e) {
    console.log('Screenshot error:', e);
  };

  try {
    console.log('Renderer: Requesting screen capture from main process...');
    
    // Use IPC to get screen source from main process
    const result = await ipcRenderer.invoke('capture-screen');
    
    if (!result.success) {
      console.error('Failed to get screen source:', result.error);
      return;
    }
    
    console.log(`Renderer: Got source ID: ${result.sourceId} for ${result.sourceName}`);
    
    // Use the source ID to capture screen
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: result.sourceId,
          minWidth: 640,
          maxWidth: 640,
          minHeight: 480,
          maxHeight: 480,
        },
      },
    });
    
    console.log('Renderer: Successfully got media stream');
    handleStream(stream);
    
  } catch (error) {
    console.error('Renderer: Screenshot capture failed:', error);
    handleError(error);
  }
}

function pushStartAttendanceLogsToDB(
  a_ip_address,
  a_time_zone,
  a_lat,
  a_long,
  e_id_id,
  o_id_id
) {
  var current_ts = Math.round(new Date().getTime() / 1000);
  var sql =
    'INSERT INTO AttendanceLogs (a_date, a_time, a_status, a_ip_address, a_time_zone, a_lat, a_long, e_id_id, o_id_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  
  if (connection.state === 'disconnected') {
    console.log('Connection is disconnected, skipping attendance log');
    return;
  }
  
  connection.query(
    sql,
    [
      getDateOnly(),
      current_ts,
      '1',
      a_ip_address,
      a_time_zone,
      a_lat,
      a_long,
      e_id_id,
      o_id_id,
    ],
    function (err, result) {
      if (err) {
        console.error('Start attendance error:', err);
        return;
      }
      console.log('Инициализация посещаемости выполнена: ' + result.affectedRows);
    }
  );
}

function pushStopAttendanceLogsToDB(
  a_ip_address,
  a_time_zone,
  a_lat,
  a_long,
  e_id_id,
  o_id_id
) {
  var current_ts = Math.round(new Date().getTime() / 1000);
  var sql =
    'INSERT INTO AttendanceLogs (a_date, a_time, a_status, a_ip_address, a_time_zone, a_lat, a_long, e_id_id, o_id_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  
  if (connection.state === 'disconnected') {
    console.log('Connection is disconnected, skipping attendance log');
    return;
  }
  
  connection.query(
    sql,
    [
      getDateOnly(),
      current_ts,
      '0',
      a_ip_address,
      a_time_zone,
      a_lat,
      a_long,
      e_id_id,
      o_id_id,
    ],
    function (err, result) {
      if (err) {
        console.error('Stop attendance error:', err);
        return;
      }
      console.log('Выход из посещаемости выполнен: ' + result.affectedRows);
    }
  );
}

function loginMarkAttendance() {
  if (!axios) {
    console.error('Axios is not available');
    return Promise.reject('Axios not loaded');
  }

  return axios
    .get('http://ip-api.com/json/')
    .then(function (response) {
      console.log(response.data);
      pushStartAttendanceLogsToDB(
        response.data.query,
        response.data.timezone,
        response.data.lat,
        response.data.lon,
        e_id,
        o_id
      );
    })
    .catch(function (error) {
      console.log('Login attendance error:', error);
    });
}

function logoutMarkAttendance() {
  if (!axios) {
    console.error('Axios is not available');
    return Promise.reject('Axios not loaded');
  }

  return axios
    .get('http://ip-api.com/json/')
    .then(function (response) {
      console.log(response.data);
      pushStopAttendanceLogsToDB(
        response.data.query,
        response.data.timezone,
        response.data.lat,
        response.data.lon,
        e_id,
        o_id
      );
    })
    .catch(function (error) {
      console.log('Logout attendance error:', error);
    });
}

function monitoringApp(flag) {
  var JSONObj = { e_id: e_id, o_id: o_id, flag: flag };
  const myJSON = JSON.stringify(JSONObj);
  var options = {
    scriptPath: join(__dirname, '/../engine/'),
    args: [myJSON],
  };

  console.log('flag: ' + flag);

  var python_process;

  if (flag === '1') {
    loop_is_stopped = true;
    console.log('начат мониторинг');

    document.getElementById('start').style.visibility = 'hidden';
    document.getElementById('stop').style.visibility = 'visible';
    document.getElementById('animationStart').style.visibility = 'visible';

    loginMarkAttendance();

    global.pyshell = new PythonShell('initApp.py', options);

    // Handle Python script output and errors
    global.pyshell.on('message', function (message) {
      console.log('Python output:', message);
    });

    global.pyshell.on('error', function (error) {
      console.error('Python error:', error);
    });

    global.pyshell.on('close', function () {
      console.log('Python script closed');
    });

    const runAsync = async () => {
      if (loop_is_stopped) {
        console.log('запуск асинхронной функции');
        
        try {
          await fullscreenScreenshot(function (base64data) {
            // Check connection before inserting
            if (connection.state === 'disconnected') {
              console.log('Connection is disconnected, skipping screenshot');
              return;
            }
            
            // First, verify the employee exists
            const checkEmployeeSql = 'SELECT id FROM employee WHERE id = ?';
            connection.query(checkEmployeeSql, [e_id], function(checkErr, checkResult) {
              if (checkErr) {
                console.error('Error checking employee:', checkErr);
                return;
              }
              
              if (checkResult.length === 0) {
                console.error('Employee ID does not exist:', e_id);
                return;
              }
              
              // Employee exists, proceed with screenshot insert
              var sql = 'INSERT INTO ScreenShotsMonitoring (ssm_img, ssm_log_ts, e_id_id, o_id_id) VALUES (?, ?, ?, ?)';
              connection.query(
                sql,
                [base64data, getTimeStamp(), e_id, o_id],
                function (err, result) {
                  if (err) {
                    console.error('Screenshot database error:', err);
                    return;
                  }
                  console.log('Количество записей, вставленных для ssm: ' + result.affectedRows);
                }
              );
            });
          }, 'image/jpeg');
        } catch (error) {
          console.error('Screenshot capture error:', error);
        }

        setTimeout(() => {
          if (loop_is_stopped) {
            runAsync();
          }
        }, 10000);

        return 'асинхронная функция возвращает true';
      } else {
        return 'асинхронная функция возвращает false';
      }
    };

    console.log('возврат: ', runAsync());

  } else {
    console.log('остановка мониторинга');

    loop_is_stopped = false;

    document.getElementById('start').style.visibility = 'visible';
    document.getElementById('stop').style.visibility = 'hidden';
    document.getElementById('animationStart').style.visibility = 'hidden';

    logoutMarkAttendance();

    if (global.pyshell) {
      global.pyshell.end(function (err) {
        if (err) {
          console.log(err);
          console.log('завершено с ошибкой');
        }
        console.log('завершено без ошибок');
      });

      python_process = global.pyshell.childProcess;
      if (python_process) {
        python_process.kill('SIGINT');
      }
    }

    let destroyPyshell = new PythonShell('destroyApp.py', options);

    // Handle Python script output and errors
    destroyPyshell.on('message', function (message) {
      console.log('Destroy Python output:', message);
    });

    destroyPyshell.on('error', function (error) {
      console.error('Destroy Python error:', error);
    });

    destroyPyshell.end(function (err) {
      if (err) {
        console.log(err);
        console.log('завершено с ошибкой');
      }
      console.log('завершено без ошибок');
    });
  }
}

// Add this after the existing console.log statements around line 50
console.log('Session values - e_id:', e_id, 'o_id:', o_id);
console.log('e_id type:', typeof e_id, 'o_id type:', typeof o_id);