const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1) Get the tour ID 
    const tourID = await Tour.findById(req.params.tourId);

    // Check if tour exists
    if (!tourID) {
        return next(new AppError('Tour not found with that ID', 404));
    }

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tourID.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tourID.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `${tourID.name} Tour`,
                    description: tourID.summary,
                    images: [`https://www.natours.dev/img/tours/${tourID.imageCover}`]
                },
                unit_amount: tourID.price * 100
            },
            quantity: 1
        }]
    });

    // 3) Send session as response
    res.status(200).json({
        status: 'success',
        session
    });

});

exports.createBookingCheckout = catchAsync( async (req, res, next) => {
    // Temporary solution unsecure
    const { tour, user, price } = req.query;

    if(!tour && !user && !price) return next();

    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?')[0]);
});

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);