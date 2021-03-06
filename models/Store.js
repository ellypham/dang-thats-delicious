const mongoose = require("mongoose");
// tell mongoose Promise to use the global Promise (built in ES6 Promise)
mongoose.Promise = global.Promise;
const slug = require("slugs");

// we are using a strict schema by default and it will only pick up the actual fields that we have set out in this schema, everything else will get thrown away.
const storeSchema = new mongoose.Schema(
  {
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
    photo: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: "You must supply and author",
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Define our indexes
storeSchema.index({
  name: "text",
  description: "text",
});

storeSchema.index({ location: "2dsphere" });

// needs to be a regular function and not => because we need to use "this"
storeSchema.pre("save", async function (next) {
  // if the store's name is not modified
  if (!this.isModified("name")) {
    next(); // skip it
    return; // stop this function from running
  }
  this.slug = slug(this.name);
  // find other stores that have a slug of elly, elly-1, elly-2
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, "i");
  // this.constructor will be equal to store by the time it runs
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
  // TODO make more resilient so slugs are unique
});

storeSchema.statics.getTagsList = function () {
  // aggregate is a method like find.
  // mongoDB aggregate operators
  return this.aggregate([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

storeSchema.statics.getTopStores = function () {
  return this.aggregate([
    // Lookup Stores and populate their reviews
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "store",
        as: "reviews",
      },
    },
    // filter for only items that have 2 or more reviews
    { $match: { "reviews.1": { $exists: true } } },
    // Add the average reviews field
    {
      $project: {
        photo: "$$ROOT.photo",
        name: "$$ROOT.name",
        reviews: "$$ROOT.reviews",
        slug: "$$ROOT.slug",
        averageRating: { $avg: "$reviews.rating" },
      },
    },
    // sort it by our new field, highest reviews first
    { $sort: { averageRating: -1 } },
    // limit to at most 10
    { $limit: 5 },
  ]);
};

// find reviews where the stores _id property === reviews store property
storeSchema.virtual("reviews", {
  ref: "Review", // what model to link?
  localField: "_id", // which field on the store?
  foreignField: "store", // which field on the review?
});

function autopopulate(next) {
  this.populate("reviews");
  next();
}

storeSchema.pre("find", autopopulate);
storeSchema.pre("findOne", autopopulate);

module.exports = mongoose.model("Store", storeSchema);
