
const axios = require('axios')
const { requestResponse } = require('../config/respons')
const fs = require('fs');
let response

const dataLog = async ({ IDUSER }) => {
  try {
    const res = await axios.get(`https://backend-tes.up.railway.app/settanam/getbyuser/${IDUSER}`)
    const data = res.data.data

    const resultArray = [];
    for (const document of data) {
      const alatData = {};
      for (const alat of document.ALAT) {
        const idAlat = alat.MAC_ADDRESS;
        const matchingDataFromFile = await getDataFromFile(idAlat)
        const dataTerbaru = matchingDataFromFile.reduce((a, b) => {
          return new Date(b.DATE_TIME) > new Date(a.DATE_TIME) ? b : a
        })

        const index = document.ALAT_DATA.findIndex(item => item.MAC_ADDRESS === idAlat);
        if (index !== -1) {
          document.ALAT_DATA[index].DATA_SENSOR = [dataTerbaru];
        }

        alatData[idAlat] = dataTerbaru
      }

      const dataTerbaruArray = Object.values(alatData)

      const result = {
        ...document,
        DATA_SENSOR: dataTerbaruArray,
      };
      resultArray.push(result);
    }
    // console.log(data)
    return data

  } catch (error) {
    console.log(`${error}`)
  }
}

const getAllDataByID = async (id) => {
  try {
    const res = await axios.get(`https://backend-tes.up.railway.app/alat/get/${id}`)
    const data = res.data.data
    const sensor = await getDataFromFile(data.MAC_ADDRESS)

    return response = { ...data, DATA_SENSOR: sensor }
  } catch (error) {
    console.log(error)
  }
}

const getDataFromFile = (idAlat) => {
  return new Promise((resolve, reject) => {
    fs.readFile('public/data.json', 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      } else {
        // console.log('data')
        try {
          const jsonData = JSON.parse(data);
          const matchingData = jsonData.filter((item) => item.ID === idAlat)
          resolve(matchingData)
        } catch (error) {

        }

      }
    });
  });
};

module.exports = {
  dataLog,
  getAllDataByID
}
