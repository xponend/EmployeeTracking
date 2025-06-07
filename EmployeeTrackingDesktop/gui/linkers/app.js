const electron = require("electron");
let { PythonShell } = require("python-shell");
const { join } = require("path");
const { desktopCapturer } = require("electron");
const powerMonitor = electron.remote.powerMonitor;
const mysql = require("mysql");
const axios = require("axios");

let loop_is_stopped = true;

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "employeetracking",
  port: 3306,
});

connection.connect((err) => {
  if (err) {
    return console.error("ошибка: " + err.message);
  }
  console.log("Подключено к серверу MySQL!");
});

var e_id = sessionStorage.getItem("e_id");
var e_name = sessionStorage.getItem("e_name");
var o_id = sessionStorage.getItem("o_id");

console.log(e_id);
console.log(e_name);
console.log(o_id);

function getTimeStamp() {
  var today = new Date();
  var date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  var time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date + " " + time;

  return dateTime;
}

function getDateOnly() {
  var today = new Date();
  var date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  return date;
}

function pushPowerLogsToDB(pm_status, pm_log_ts, e_id_id, o_id_id) {
  var sql =
    "INSERT INTO PowerMonitoring (pm_status, pm_log_ts, e_id_id, o_id_id) VALUES (?, ?, ?, ?)";
  connection.query(
    sql,
    [pm_status, pm_log_ts, e_id_id, o_id_id],
    function (err, result) {
      if (err) throw err;
      console.log("Количество записей, вставленных для pm: " + result.affectedRows);
    }
  );
}

function fullscreenScreenshot(callback, imageFormat) {
  var _this = this;
  this.callback = callback;
  imageFormat = imageFormat || "image/jpeg";

  this.handleStream = (stream) => {
    // Создать скрытый видео тег
    var video = document.createElement("video");
    video.style.cssText = "position:absolute;top:-10000px;left:-10000px;";

    // Событие, связанное с потоком
    video.onloadedmetadata = function () {
      // Установить ОРИГИНАЛЬНУЮ высоту видео (скриншот)
      video.style.height = this.videoHeight + "px"; // videoHeight
      video.style.width = this.videoWidth + "px"; // videoWidth

      video.play();

      // Создать холст
      var canvas = document.createElement("canvas");
      canvas.width = this.videoWidth;
      canvas.height = this.videoHeight;
      var ctx = canvas.getContext("2d");
      // Нарисовать видео на холсте
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (_this.callback) {
        // Сохранить скриншот в base64
        _this.callback(canvas.toDataURL(imageFormat));
      } else {
        console.log("Нужен callback!");
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

  this.handleError = function (e) {
    console.log(e);
  };

  desktopCapturer.getSources(
    { types: ["window", "screen"] },
    (_ignore, sources) => {
      for (const source of sources) {
        // Фильтр: главный экран
        if (
          source.name === "Entire screen" ||
          source.name === "Screen 1" ||
          source.name === "Screen 2"
        ) {
          navigator.mediaDevices
            .getUserMedia({
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: "desktop",
                  chromeMediaSourceId: source.id,
                  minWidth: 1280,
                  maxWidth: 1280,
                  minHeight: 720,
                  maxHeight: 720,
                },
              },
            })
            .then((stream) => {
              handleStream(stream);
            })
            .catch((e) => {
              handleError(e);
            });
          return;
        }
      }
    }
  );
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
    "INSERT INTO AttendanceLogs (a_date, a_time, a_status, a_ip_address, a_time_zone, a_lat, a_long, e_id_id, o_id_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  connection.query(
    sql,
    [
      getDateOnly(),
      current_ts,
      "1",
      a_ip_address,
      a_time_zone,
      a_lat,
      a_long,
      e_id_id,
      o_id_id,
    ],
    function (err, result) {
      if (err) throw err;
      console.log("Инициализация посещаемости выполнена: " + result.affectedRows);
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
    "INSERT INTO AttendanceLogs (a_date, a_time, a_status, a_ip_address, a_time_zone, a_lat, a_long, e_id_id, o_id_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  connection.query(
    sql,
    [
      getDateOnly(),
      current_ts,
      "0",
      a_ip_address,
      a_time_zone,
      a_lat,
      a_long,
      e_id_id,
      o_id_id,
    ],
    function (err, result) {
      if (err) throw err;
      console.log("Выход из посещаемости выполнен: " + result.affectedRows);
    }
  );
}

function loginMarkAttendance() {
  axios
    .get("http://ip-api.com/json/")
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
      console.log(error);
    })
    .then(function () {
      // всегда выполняется
    });
}

function logoutMarkAttendance() {
  axios
    .get("http://ip-api.com/json/")
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
      console.log(error);
    })
    .then(function () {
      // всегда выполняется
    });
}

function monitoringApp(flag) {
  var JSONObj = { e_id: e_id, o_id: o_id, flag: flag };
  const myJSON = JSON.stringify(JSONObj);
  var options = {
    scriptPath: join(__dirname, "/../engine/"),
    args: [myJSON],
  };

  console.log("flag: " + flag);

  var python_process;

  if (flag === "1") {
    loop_is_stopped = true;
    console.log("начат мониторинг");

    document.getElementById("start").style.visibility = "hidden";
    document.getElementById("stop").style.visibility = "visible";
    document.getElementById("animationStart").style.visibility = "visible";


    loginMarkAttendance();

    global.pyshell = new PythonShell("initApp.py", options);

    const runAsync = () => {
      if (loop_is_stopped) {
        console.log("запуск асинхронной функции");
        fullscreenScreenshot(function (base64data) {
          var sql =
            "INSERT INTO ScreenShotsMonitoring (ssm_img, ssm_log_ts, e_id_id, o_id_id) VALUES (?, ?, ?, ?)";
          connection.query(
            sql,
            [base64data, getTimeStamp(), e_id, o_id],
            function (err, result) {
              if (err) throw err;
              console.log(result);
              console.log(
                "Количество записей, вставленных для ssm: " + result.affectedRows
              );
            }
          );
        }, "image/png");

        setTimeout(() => {
          if (loop_is_stopped) {
            let v = runAsync();
            console.log("возвращаемое значение", v);
          }
        }, 10000);

        return "асинхронная функция возвращает true";
      } else {
        return "асинхронная функция возвращает false";
      }
    };

    console.log("возврат: ", runAsync());

    powerMonitor.on("suspend", () => {
      console.log("Система переходит в спящий режим");
      pushPowerLogsToDB("0", getTimeStamp(), e_id, o_id);
    });

    powerMonitor.on("resume", () => {
      console.log("Система возобновляет работу");
      pushPowerLogsToDB("1", getTimeStamp(), e_id, o_id);
    });

    powerMonitor.on("on-ac", () => {
      console.log("Система работает от сети переменного тока (зарядка)");
      pushPowerLogsToDB("2", getTimeStamp(), e_id, o_id);
    });

    powerMonitor.on("on-battery", () => {
      console.log("Система работает от батареи");
      pushPowerLogsToDB("3", getTimeStamp(), e_id, o_id);
    });

    powerMonitor.on("shutdown", () => {
      console.log("Система выключается");
      pushPowerLogsToDB("4", getTimeStamp(), e_id, o_id);
    });

    powerMonitor.on("lock-screen", () => {
      console.log("Система будет заблокирована");
      pushPowerLogsToDB("5", getTimeStamp(), e_id, o_id);
    });

    powerMonitor.on("unlock-screen", () => {
      console.log("Система разблокирована");
      pushPowerLogsToDB("6", getTimeStamp(), e_id, o_id);
    });
  } else {
    console.log("остановка мониторинга");

    loop_is_stopped = false;

    document.getElementById("start").style.visibility = "visible";
    document.getElementById("stop").style.visibility = "hidden";
    document.getElementById("animationStart").style.visibility = "hidden";

    powerMonitor.removeAllListeners("suspend");
    powerMonitor.removeAllListeners("resume");
    powerMonitor.removeAllListeners("on-ac");
    powerMonitor.removeAllListeners("on-battery");
    powerMonitor.removeAllListeners("shutdown");
    powerMonitor.removeAllListeners("lock-screen");
    powerMonitor.removeAllListeners("unlock-screen");

    logoutMarkAttendance();

    pyshell.end(function (err) {
      if (err) {
        console.log(err);
        console.log("завершено с ошибкой");
      }
      console.log("завершено без ошибок");
    });

    python_process = pyshell.childProcess;
    python_process.kill("SIGINT");

    let destroyPyshell = new PythonShell("destroyApp.py", options);

    destroyPyshell.end(function (err) {
      if (err) {
        console.log(err);
        console.log("завершено с ошибкой");
      }
      console.log("завершено без ошибок");
    });
  }
}
