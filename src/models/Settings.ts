import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: false
        }, 
        push: {
            type: Boolean,
            default: true
        }
    },
    theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
    },
    language: {
        type: String,
        enum: ['fr', 'en'],
        default: 'fr'
    },
    workingHours: {
        start: {
            type: String,
            default: '09:00'
        },
        end: {
            type: String,
            default: '18:00'
        }
    },
    appointmentDuration: {
        type: Number,
        default: 30,
        min: 15,
        max: 120
    }
}, {
    timestamps: true
});

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
