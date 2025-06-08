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

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'employeetracking',
  port: 3306,
});

connection.connect((err) => {
  if (err) {
    return console.error('ошибка: ' + err.message);
  }
  console.log('Подключено к серверу MySQL!');
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
  connection.query(
    sql,
    [pm_status, pm_log_ts, e_id_id, o_id_id],
    function (err, result) {
      if (err) throw err;
      console.log('Количество записей, вставленных для pm: ' + result.affectedRows);
    }
  );
}

async function fullscreenScreenshot(callback, imageFormat) {
  imageFormat = imageFormat || 'image/jpeg';

  const handleStream = (stream) => {
    // Создать скрытый видео тег
    var video = document.createElement('video');
    video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';

    // Событие, связанное с потоком
    video.onloadedmetadata = function () {
      // Установить ОРИГИНАЛЬНУЮ высоту видео (скриншот)
      video.style.height = this.videoHeight + 'px'; // videoHeight
      video.style.width = this.videoWidth + 'px'; // videoWidth

      video.play();

      // Создать холст
      var canvas = document.createElement('canvas');
      canvas.width = this.videoWidth;
      canvas.height = this.videoHeight;
      var ctx = canvas.getContext('2d');
      // Нарисовать видео на холсте
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (callback) {
        // Сохранить скриншот в base64
        callback(canvas.toDataURL(imageFormat));
      } else {
        console.log('Нужен callback!');
      }

      // Удалить скрытый видео тег
      video.remove();
      try {
        // Уничтожить соединение с потоком
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
    // Use IPC to get desktop sources from main process
    const sources = await ipcRenderer.invoke('get-desktop-sources');
    
    if (!sources || sources.length === 0) {
      console.error('No desktop sources available');
      return;
    }

    for (const source of sources) {
      // Фильтр: главный экран
      if (
        source.name === 'Entire screen' ||
        source.name === 'Screen 1' ||
        source.name === 'Screen 2'
      ) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id,
                minWidth: 1280,
                maxWidth: 1280,
                minHeight: 720,
                maxHeight: 720,
              },
            },
          });
          handleStream(stream);
          return;
        } catch (e) {
          handleError(e);
        }
      }
    }
  } catch (error) {
    console.error('Failed to get desktop sources:', error);
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
      if (err) throw err;
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
      if (err) throw err;
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

    const runAsync = async () => {
      if (loop_is_stopped) {
        console.log('запуск асинхронной функции');
        await fullscreenScreenshot(function (base64data) {
          var sql =
            'INSERT INTO ScreenShotsMonitoring (ssm_img, ssm_log_ts, e_id_id, o_id_id) VALUES (?, ?, ?, ?)';
          connection.query(
            sql,
            [base64data, getTimeStamp(), e_id, o_id],
            function (err, result) {
              if (err) throw err;
              console.log(result);
              console.log(
                'Количество записей, вставленных для ssm: ' + result.affectedRows
              );
            }
          );
        }, 'image/png');

        setTimeout(() => {
          if (loop_is_stopped) {
            let v = runAsync();
            console.log('возвращаемое значение', v);
          }
        }, 10000);

        return 'асинхронная функция возвращает true';
      } else {
        return 'асинхронная функция возвращает false';
      }
    };

    console.log('возврат: ', runAsync());

    // Power monitoring is now handled by IPC events from main process
    // No need to set up listeners here

  } else {
    console.log('остановка мониторинга');

    loop_is_stopped = false;

    document.getElementById('start').style.visibility = 'visible';
    document.getElementById('stop').style.visibility = 'hidden';
    document.getElementById('animationStart').style.visibility = 'hidden';

    // Power monitoring cleanup is handled by main process
    // No listeners to remove here

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

    destroyPyshell.end(function (err) {
      if (err) {
        console.log(err);
        console.log('завершено с ошибкой');
      }
      console.log('завершено без ошибок');
    });
  }
}