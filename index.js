
const express = require('express')
const axios = require('axios')
const qs = require('qs')
const mysql = require('mysql2')
const moment = require('moment-timezone');
const { isEmpty } = require('lodash')
const cronJob = require('cron').CronJob;
const dotenv = require('dotenv')
dotenv.config()
const app = express()

const PORT = process.env.PORT
const lineEndpoint = process.env.LINE_ENDPOINT
const lineKey = process.env.LINE_API_KEY
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

app.get('/', (req, res) => {
  res.json(`Hello Today ${moment().tz("Asia/Bangkok").format('DD-MM-YYYY')}`)
});

new cronJob(
  '20 13 * * *',
  function () {
    sendMsg('Running a task')
    notify()
  },
  null,
  true,
  'Asia/Bangkok'
);

const notify = () => {
  connection.query(
    'SELECT * FROM tb_notify WHERE alerted_date = ? and is_active = ?',
    [moment().tz("Asia/Bangkok").format('DD'), 1],
    function (err, results) {
      if (err) {
        sendMsg(err)
      }

      if (!isEmpty(results)) {
        results.forEach(el => {
          sendMsg(el.description)
        })
      }
    }
  )
}

const sendMsg = (msg) => {
  const messageResponse = {
    message: `\n ${msg} ${moment().tz("Asia/Bangkok").format('DD-MM-YYYY')}`
  }

  axios.post(lineEndpoint, qs.stringify(messageResponse), {
    headers: {
      Authorization: `Bearer ${lineKey}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
    }
  })
}

app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`);
});