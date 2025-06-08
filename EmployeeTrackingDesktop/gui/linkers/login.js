const mysql = require('mysql2');

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

function getLogin() {
  var emailValue = document.getElementById('e_email').value;

  var pwdValue = document.getElementById('e_password').value;

  if (emailValue && pwdValue) {
    connection.query(
      'SELECT * FROM employee where e_email = ? and e_password =?',
      [emailValue, pwdValue],
      function (err, result, fields) {
        if (result.length > 0) {
          console.log('аутентификация выполнена!');
          sessionStorage.setItem('e_name', result[0].e_name);
          sessionStorage.setItem('e_id', result[0].id);
          sessionStorage.setItem('o_id', result[0].o_id_id);
          window.location.href = 'app.html';
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Ошибка',
            text: 'Неверный логин',
          });
          console.log('нет результата!');
        }
      }
    );
  }
  else
  {
    Swal.fire({
      icon: 'error',
      title: 'Ошибка',
      text: 'Введите Email и Пароль!',
    });
  }
}
