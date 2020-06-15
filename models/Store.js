const mongoose = require("mongoose");
// tell mongoose Promise to use the global Promise (built in ES6 Promise)
mongoose.Promise = global.Promise;
const slug = require("slugs");

// we are using a strict schema by default and it will only pick up the actual fields that we have set out in this schema, everything else will get thrown away.
const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: "Please enter a store name",
  },
  slug: String,
  description: {
    type: String,
    trim: true,
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: {
      type: String,
      default: "Point",
    },
    coordinates: [
      {
        type: Number,
        required: "You must supply coordinates!",
      },
    ],
    address: {
      type: String,
      required: "You must supply and address!",
    },
  },
});

// needs to be a regular function and not => because we need to use "this"
storeSchema.pre("save", function (next) {
  // if the store's name is not modified
  if (!this.isModified("name")) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  next();
  // TODO make more resilient so slugs are unique
});

module.exports = mongoose.model("Store", storeSchema);
