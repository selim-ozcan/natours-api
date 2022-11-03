const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "A user must have a name"]
    },
    email: {
        type: String,
        required: [true, "A user must have an email"],
        unique: true,
        lowercase: true,
        validate: {
            validator: validator.isEmail,
            message: 'Please provide a valid email'
        }
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        required: [true, "A user must have a role"],
        lowercase: true,
        default: 'user',
        enum: {
            values: ['user', 'guide', 'lead-guide', 'admin']
        }
    },
    password: {
        type: String,
        required: [true, "A user must have a password"],
        minLength: 8,
        select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
    timestamps: true
});

userSchema.pre(/^find/, function (next) {
    this.where('active').ne(false);
    next();
})

userSchema.pre('save', async function (next) {
    if (!this.password) return next();
    const encryptedPassword = await bcrypt.hash(this.password, 12);
    this.password = encryptedPassword;
    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
})

userSchema.methods.checkPassword = async function (inputPassword, hashedRealPassword) {
    return await bcrypt.compare(inputPassword, hashedRealPassword)
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + process.env.RESET_TOKEN_MINUTE * 60 * 1000;

    return resetToken;
}

const User = mongoose.model("User", userSchema);

module.exports = User;