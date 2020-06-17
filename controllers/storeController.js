// in order to start working with the database, we'll need to import mongoose, package that we use to interface with our MongoDB database
const mongoose = require("mongoose");
const Store = mongoose.model("Store");
// need reference to our store.js schema
// rather than importing the schema from the file
// because we imported it once from our start.js file. we can reference off of our mongoose variable. Mongo uses a concept called singleton which allows us to import our models once and then reference them anywhere in our application
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid");

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith("image/");
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype isn't allowed!" }, false);
    }
  },
};

exports.homePage = (req, res) => {
  res.render("index");
};

exports.addStore = (req, res) => {
  res.render("editStore", { title: "Add Store" });
};

// reads the image into memory, it doesn't save the file to disk but stores in the memory of your server
exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }
  const extension = req.file.mimetype.split("/")[1];
  req.body.photo = `${uuid.v4()}.${extension}`;
  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  // once we have written the photo to our filesystem, kep going!
  next();
};

exports.createStore = async (req, res) => {
  // res.json sends data back to the user in JSON
  // req.body contains all the info about what got sent
  // res.json(req.body);
  // we want to save this data back to the database
  // How do we use mongoose as well as async/await to save the data to our database
  // once you call store.save() it will fire of a connection to your MongoDB database, save that data, and then come back to us with the store itself or an error
  const store = await new Store(req.body).save();
  req.flash(
    "success",
    `Successfully created ${store.name}. Care to leave a review.`
  );
  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  // 1. Query the database for a list of all stores before we can show them on the page
  const stores = await Store.find(); // will query the database for all of them
  res.render("stores", { title: "Stores", stores: stores });
};

exports.editStore = async (req, res) => {
  // 1. Find the store given the id
  const store = await Store.findOne({ _id: req.params.id });
  // 2. confirm they are the owner of the store
  // TODO
  // 3. Render out the edit form so the user can update their store
  res.render("editStore", { title: `Edit ${store.name}`, store: store });
};

exports.updateStore = async (req, res) => {
  // set the location data to be a point
  req.body.location.type = "Point";
  // 1. Find and update the store
  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // return the new store instead of the old one.
    runValidators: true, // force our models to run the required validators against it
  }).exec();
  req.flash(
    "success",
    `Succesfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store </a>`
  );
  res.redirect(`/stores/${store._id}/edit`);
  // 2. Redirect them to the store and tell them it worked
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug });
  if (!store) return next();
  res.render("store", { store, title: store.name });
};
