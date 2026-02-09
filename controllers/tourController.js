const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

const upload = multer({ 
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1},
  { name: 'images', maxCount: '3' }
]);

exports.resizeTourImages = catchAsync( async(req, res, next) => {
  if(!req.files.imageCover && !req.files.images) return next();

  // 1) Cover Image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];

  await Promise.all( 
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    }));

  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'price,-ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if(!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }, // Match tours with average rating >= 4.5
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // Group by difficulty level
        numTours: { $sum: 1 }, // Count number of tours
        numRatings: { $sum: '$ratingsQuantity' }, // Sum of ratings quantity
        avgRating: { $avg: '$ratingsAverage' }, // Average rating
        avgPrice: { $avg: '$price' }, // Average price
        minPrice: { $min: '$price' }, // Minimum price
        maxPrice: { $max: '$price' }, // Maximum price
      },
    },
    {
      $sort: { avgPrice: 1 }, // Sort by average price ascending
    },
    //match: { _id: { $ne: 'EASY' } }, // Exclude easy tours
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const year = req.params.year * 1; // Convert year to number
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', // Deconstruct the startDates array
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), // Match dates from the start of the year
          $lte: new Date(`${year}-12-31`), // Match dates until the end of the year
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, // Group by month
        numTours: { $sum: 1 }, // Count number of tours
        tours: { $push: '$name' }, // Collect tour names in an array
      },
    },
    {
      $addFields: { month: '$_id' }, // Add a field for month
    },
    {
      $project: { _id: 0 }, // Exclude the _id field from output
    },
    {
      $sort: { month: 1 }, // Sort by month ascending
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync( async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng ] = latlng.spilt(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // Convert distance to radians

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat, lng', 400
      )
    );
  };

  // console.log(distance, lat, lng, unit); // commented out: debug log

  const tours = await Tour.find({ 
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], distance / radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
     data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; // Convert to miles or kilometers

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat, lng', 400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1], // Convert to numbers
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});