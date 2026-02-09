const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // a validation rule
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: val => Math.round(val * 10) / 10, // Round to one decimal place  
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        //this only points to current doc on NEW document creation
        //it does not work for update operations
        validator: function(val) {
          return val < this.price; // Price discount must be less than the price
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
      default: 0,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // Exclude from query results by default
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: { 
        type: String,
        default: 'Point',
        enum: ['Point'], // GeoJSON type
      },
      coordinates:  [Number], // [longitude, latitude]
      address: String,
      description: String,
    },
    locations: [
      {
        type: { 
          type: String,
          default: 'Point',
          enum: ['Point'], // GeoJSON type
        },
        coordinates: [Number], // [longitude, latitude]
        address: String,
        description: String,
        day: Number, // Day of the tour
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Reference to User model
      }
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; // Calculate duration in weeks
});

tourSchema.index({ price: 1, ratingsAverage: -1 }); // Compound index for price and ratings average
tourSchema.index({ slug: 1 }); // Index for slug field
tourSchema.index({ startLocation: '2dsphere' }); // 2dsphere index for geospatial queries
// Virtual Populate 
tourSchema.virtual('reviews', {
  ref: 'Review', 
  foreignField: 'tour', // Field in Review model that references Tour
  localField: '_id', // Field in tour model that is referenced
});
//DOCUMENT MIDDLEWARE
tourSchema.pre('save', function (next) {
  // Middleware to perform actions before saving a tour
  this.slug = slugify(this.name, { lower: true }); // Create a slug from the name
  next();
});

// For Embedding User documents in the guides field

// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id)); // Convert guide IDs to User documents
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
// tourSchema.pre('save', function (next) {
//   // Middleware to perform actions before saving a tour
//   console.log('Will save document...');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   // Middleware to perform actions after saving a tour
//   console.log(doc);
//   next();
// });

//Query middleware to log the time taken for the query
tourSchema.pre(/^find/, function (next) {
  // Middleware to perform actions before finding tours
  this.find({ secretTour: { $ne: true } }); // Exclude secret tours from query results
  this.start = Date.now(); // Record the start time of the query
  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   // Middleware to perform actions after finding tours
//   // console.log(`Query took ${Date.now() - this.start} milliseconds!`); // commented out: debug log
//   next();
// });

// Populate guides automatically for find queries
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides'
  });
  next();
});

//AGGREGATION middleware to log the time taken for aggregation
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // Exclude secret tours from aggregation results

  // console.log(this.pipeline()); // commented out: debug log
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
