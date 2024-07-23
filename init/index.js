const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing.js');

main()
  .then((res) => {
    console.log('Connected to Database');
  })
  .catch((err) => {
    console.log(err);
  })

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/VacayStay');
}

const initDB = async () => {
  await Listing.deleteMany({});//clear all data before insert another data
  initData.data = initData.data.map((obj) => ({ ...obj, owner: '66921bbdc1758f7ceaa07965' }));
  await Listing.insertMany(initData.data);
  console.log('Data was initialized');
};

initDB();