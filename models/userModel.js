const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A user must have a name'],
            trim: true,
        }, 
        email: {
            type: String,
            required: [true, 'A user must have an email'],
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, 'Please provide a valid email']
        }, 
        photo: {
            type: String, 
            default: 'default.jpg'
        }, 
        role: {
            type: String,
            enum: ['user', 'guide', 'lead-guide', 'admin'],
            default: 'user'
        },
        password: {
            type: String, 
            required: [true, 'A user must have a password'],
            minlength: 8,
            select: false // Do not return password by default
        },
        passwordConfirm: {
            type: String,
            required: [true, 'Please confirm your password'],
            validate: {
                // This only works on CREATE and SAVE
                validator: function(el) {
                    return el === this.password; // Check if password and passwordConfirm match
                },
                message: 'Passwords are not the same!'
            }
        }, 
        passwordChangedAt: Date, 
        passwordResetToken: String,
        passwordResetExpires: Date,
        active: {
            type: Boolean, 
            default: true,
            select: false // Do not return active status by default
        }
    }
);

userSchema.pre('save', async function(next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12 - how cpu intensive the hashing is
    this.password = await bcrypt.hash(this.password, 12);
    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
})

userSchema.pre('save', function(next) {
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000; // Set passwordChangedAt to current time minus 1 second to ensure it is before the JWT issued at time
    next();
});

userSchema.pre(/^find/, function(next) {
    // this points to the current query
    this.find({ active: { $ne: false } }); // Exclude inactive users
    this.select('-__v -passwordChangedAt -passwordResetToken -passwordResetExpires'); // Exclude sensitive fields
    next();
});

//Instance method to check if password is correct
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if(this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp; // If JWT timestamp is before password change, return true
    }
    // False means NOT changed
    return false;
}

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex'); // Generate random token
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // Hash the token
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Set expiration time to 10 minutes from now

    // console.log({ 
    //     resetToken, 
    //     hashed: this.passwordResetToken, 
    //     expires: this.passwordResetExpires,
    //     localExpires: this.passwordResetExpires.toLocaleString()
    // });
    // Note: Do not store the plain token in the database, only the hashed version
    return resetToken; // Return the un-hashed token to send to user
};

const User = mongoose.model('User', userSchema);

module.exports = User;