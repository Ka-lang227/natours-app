const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            required: [true, 'A review must have content'],
            trim: true,
            maxlength: [500, 'A review must have less or equal than 500 characters'],
            minlength: [10, 'A review must have more or equal than 10 characters'],
        }, 
        rating: {
            type: Number,
            required: [true, 'A review must have a rating'],
            min: 1,
            max: 5,
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user'],
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour'],
        },
    }, 
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Prevent duplicate reviews: one user can only write one review per tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Query middleware to populate user and tour fields automatically
reviewSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user',
        select: 'name photo'
    });
    // .populate({
    //     path: 'tour',
    //     select: 'name'
    // });
    next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
    
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        }, 
        {
            $group: {
                _id: '$tour',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);
    
    // console.log('Stats calculated:', stats); // commented out: debug log
    
    if (stats.length > 0) {
        await mongoose.model('Tour').findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: Math.round(stats[0].avgRating * 10) / 10 // Round to 1 decimal
        });
        
    } else {
        await mongoose.model('Tour').findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
};

// Calculate ratings after saving a new review
reviewSchema.post('save', function() {
    // this points to the current document (review)
    this.constructor.calcAverageRatings(this.tour);
});

// For updates and deletes - store the document before it's modified/deleted
reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.clone().findOne();
    next();
});

// Recalculate ratings after the document is updated/deleted
reviewSchema.post(/^findOneAnd/, async function(result) {
    // this.r was set in the pre middleware
    if (this.r) {
        await this.r.constructor.calcAverageRatings(this.r.tour);
    }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review
