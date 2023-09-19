const router = require("express").Router();
const axios = require('axios')
const mqtt = require('mqtt')
const fs = require('fs')

reconnect()
let response;

// const option = {
//   protocol: "amqp",
//   hostname: "rmq1.pptik.id",
//   port: "5672",
//   username: "shadoofpertanian",
//   password: "TaniBertani19",
//   vhost: "/shadoofpertanian",
// }

async function koneksiRmq() {
  require("amqplib/callback_api").connect('amqps://ubzpxram:oRtyxNbZq-D-Pi06v5kxR6Fm5uHJ3_fd@beaver.rmq.cloudamqp.com/ubzpxram',
    async function (err, conn) {
      try {
        if (err) {
          reconnect();
        } else {
          console.log("CONNECTING TO RMQ");
          // consumer(conn)
          setInterval(async () => {
            try {

              const res = await axios.get('https://backend-tes.up.railway.app/alat/get')
              const data = res.data.data

              const q = data.map((item) => item.NAMA_ALAT)
              const qlength = data.length
              let queue
              for (let i = 0; i < qlength; i++) {
                queue = q[i];
                consume(conn, queue)
              }
            } catch (error) {
              console.log('SERVICE 1 FAIL TO CONNECTED')
              reconnect()
            }
          }, 1000)
        }
      } catch (err) {
        reconnect()
      }
    }
  );
}

const mqttOption = {
  url: 'mqtt://rmq1.pptik.id:1883',
  username: '/shadoofpertanian:shadoofpertanian',
  password: 'TaniBertani19'
}

const sendRMQ = (topic, data) => {
  const client = mqtt.connect(mqttOption.url, {
    username: mqttOption.username,
    password: mqttOption.password
  })
  client.on('connect', () => {
    client.publish(topic, JSON.stringify(data), { qos: 1 })
    client.end()
  })
}

async function consume(conn, queue) {
  try {
    const data = queue
    conn.createChannel(function (err, ch) {
      if (err) {
        console.error(err)
        return
      }

      ch.assertQueue(queue, { durable: true })

      ch.consume(data, msg => {
        ch.ack(msg)
        const data = String(msg.content.toString())
        const dataJson = JSON.parse(data)

        const responseData = {
          ID: dataJson.MAC,
          DATA_SENSOR: dataJson.DATA,
          KETERANGAN: dataJson.KET,
          DATE_TIME: new Date(Date.now()),
        }

        saveMessageToJson(responseData)
      }, { noAck: false })
      // ch.close()
    })
  } catch (error) {
    console.log(error)
  }
}

// async function consumer(conn) {
//   try {
//     const res = await axios.get('http://localhost:3000/alat/get')
//     if (!res) {
//       console.log('SERVICE 1 FAIL TO CONNECTED')
//     }
//     const data = res.data.data
//     const cekQ = data
//     const q = cekQ.map((item) => item.NAMA_ALAT);
//     const qlength = q.length;
//     let queue
//     for (let i = 0; i < qlength; i++) {
//       queue = q[i];
//       conn.createChannel(function (err, ch) {
//         if (err) {
//           throw err
//         }

//         ch.assertQueue(queue, { durable: true })

//         ch.consume(queue, msg => {
//           console.log('ini')
//           ch.ack(msg)
//           const data = String(msg.content.toString())
//           const dataJson = JSON.parse(data)
//           const ID = dataJson.MAC
//           const DATA_SENSOR = dataJson.DATA
//           let keterangan = "Belum ada"

//           const responseData = {
//             ID: ID,
//             DATA_SENSOR: DATA_SENSOR,
//             KETERANGAN: keterangan,
//             DATE_TIME: new Date(Date.now()),
//           }

//           saveSingleMessageToJsonFile(responseData)
//         }, { noAck: false })
//       })
//     }
//     // }
//   } catch (error) {
//     console.log(`Terjadi Error : ${error}`);
//   }
// }

// async function consume(conn, queue) {
//   try {
//     const data = queue
//     const ch = await conn.createChannel()
//     const on_open = (err, ch) => {
//       ch.consume(data, msg => {
//         ch.ack(msg)
//         const data = String(msg.content.toString())
//         const splitData = data.split("#")
//         const ID = splitData[0]
//         const DATA_SENSOR = splitData[1]
//         let keterangan = "Belum ada"

//         const responseData = {
//           ID: ID,
//           DATA_SENSOR: DATA_SENSOR,
//           KETERANGAN: keterangan,
//           DATE_TIME: new Date(Date.now()),
//         }

//         saveSingleMessageToJsonFile(responseData)
//       })
//     }
//     on_open(null, ch)
//   } catch (error) {
//     reconnect()
//   }
// }

function saveMessageToJson(data) {
  const filePath = 'public/data.json';

  try {
    let existingData = []
    try {
      const jsonData = fs.readFileSync(filePath, 'utf8');
      existingData = JSON.parse(jsonData);
    } catch (error) {
      console.log(`${error}`)
    }
    existingData.push(data);

    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
  } catch (error) {
    console.log(`Terjadi error saat menyimpan data: ${error}`);
  }
}

function reconnect() {
  console.log("Menghubungkan kembali ke RabbitMQ");
  koneksiRmq();
}

module.exports = { router, sendRMQ };


// async function saveToJsonFile(data) {
//   try {
//     const jsonData = JSON.stringify(data, null, 2);
//     const filePath = 'public/data.json';

//     fs.writeFileSync(filePath, jsonData);

//     console.log('Data berhasil disimpan ke file .json');
//   } catch (error) {
//     console.log(`Terjadi error saat menyimpan data: ${error}`);
//   }
// }

// router.get('/data', (req, res) => {
//   res.json(response)
// })

// koneksi();

// function consume1r(conn) {
//   try {
//     var sukses = conn.createChannel(on_open);
//     function on_open(err, ch) {
//       ch.consume(q, function (msg) {
//         if (msg == null) {
//           console.log('Pesan Tidak Ada');
//         } else {
//           ch.ack(msg);
//           const dataku = String(msg.content.toString());
//           const datamu = String('{ "ADC" : ' + dataku + ' }');
//           console.log(datamu);
//           var json = String(datamu);
//           const obj = JSON.parse(json);
//           var ADC = obj.ADC;
//           const History = {
//             ADC: ADC,
//             keterangan: 'aman',
//             date: new Date()
//           };
//           try {
//             save(History);
//           } catc]h (err) {
//             console.log('err');
//           }
//         }
//       });
//     }
//   } catch (err) {
//     console.log('error');
//   }
// }

// function save(history) {
//   try {
//     db.collection('phs').insertOne(history, function (err) {
//       if (err) {
//         console.log('Gagal');
//       }
//     });
//   } catch (err) {
//     console.log('error');
//   }
// }

// function koneksi() {
//   mongo.connect('mongodb+srv://admin:uo5sgXzc9tz9mdWo@cluster0.c84ve12.mongodb.net/?retryWrites=true&w=majority', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   });
//   try {
//     db.once('open', () => console.log('berhasil terhubung ke database'));
//   } catch (err) {
//     db.on('error', (error) => console.log(error));
//     console.log('error');
//   }
// }





// Save to File.log

// const IDFolderName = responseData.ID
// const IDFolder = path.join(__dirname, '../public', IDFolderName);
// const logFileName = `${moment().format("YYYY-MM-DD_HH-mm-ss")}.log`;
// const logFilePath = path.join(IDFolder, logFileName)
// const logFilePath = path.join(__dirname, '../public', 'all_data.log')

// if (responseDataMap[ID]) {
//   responseDataMap[ID].push(responseData);
// } else {
//   responseDataMap[ID] = [responseData];
// }

// const allData = Object.values(responseDataMap).flat();
// fs.writeFileSync(logFilePath, JSON.stringify(allData));
// if (!fs.existsSync(macFolder)) {
//   fs.mkdirSync(macFolder, { recursive: true });
// }

// fs.writeFileSync(logFilePath, JSON.stringify(responseData))