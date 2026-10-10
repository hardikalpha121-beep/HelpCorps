import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../modules/users/user.model.js';
import Volunteer from '../modules/volunteers/volunteer.model.js';

dotenv.config();

const SEED_VOLUNTEERS = [
  {
    fullName: 'Aarav Sharma',
    email: 'aarav.sharma@helpcorps.community',
    mobile: '+919816012345',
    city: 'Hamirpur',
    location: { type: 'Point' as const, coordinates: [76.5266, 31.7061] as [number, number] },
    skills: ['Sign Language (ASL)', 'Mobility Assistance', 'First Aid & CPR'],
    preferredCategories: ['disability', 'general'],
    kindnessScore: 480,
    rating: 4.95,
    completedTasks: 38,
    address: 'Near Gandhi Chowk, Hamirpur, HP',
  },
  {
    fullName: 'Priya Verma',
    email: 'priya.verma@helpcorps.community',
    mobile: '+919816023456',
    city: 'Hamirpur',
    location: { type: 'Point' as const, coordinates: [76.5310, 31.7100] as [number, number] },
    skills: ['Elderly Care', 'Medical Escort', 'Wheelchair Support'],
    preferredCategories: ['elderly', 'general'],
    kindnessScore: 520,
    rating: 5.0,
    completedTasks: 44,
    address: 'Anu Chowk, Hamirpur, HP',
  },
  {
    fullName: 'Neha Thakur',
    email: 'neha.thakur@helpcorps.community',
    mobile: '+919816034567',
    city: 'Hamirpur',
    location: { type: 'Point' as const, coordinates: [76.5200, 31.7010] as [number, number] },
    skills: ['Women Safety Rapid Responder', 'Crisis Intervention', 'Self Defense Escort'],
    preferredCategories: ['womenSafety', 'general'],
    kindnessScore: 390,
    rating: 4.9,
    completedTasks: 29,
    address: 'Near Bus Stand, Hamirpur, HP',
  },
  {
    fullName: 'Vikram Singh',
    email: 'vikram.singh@helpcorps.community',
    mobile: '+919816045678',
    city: 'Hamirpur',
    location: { type: 'Point' as const, coordinates: [76.5410, 31.7180] as [number, number] },
    skills: ['Blind & Low Vision Scribe', 'Grocery & Pharmacy Delivery', 'Braille Reader'],
    preferredCategories: ['disability', 'elderly'],
    kindnessScore: 340,
    rating: 4.85,
    completedTasks: 21,
    address: 'Dosarka, Hamirpur, HP',
  },
  {
    fullName: 'Dr. Ananya Sen',
    email: 'ananya.sen@helpcorps.community',
    mobile: '+919816056789',
    city: 'Hamirpur',
    location: { type: 'Point' as const, coordinates: [76.5150, 31.6950] as [number, number] },
    skills: ['Vital Checks & Medication', 'Emergency Triage', 'Mental Health Support'],
    preferredCategories: ['elderly', 'womenSafety', 'disability'],
    kindnessScore: 610,
    rating: 5.0,
    completedTasks: 56,
    address: 'Civil Hospital Road, Hamirpur, HP',
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in environment');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB. Seeding verified volunteers...');

  const passwordHash = await bcrypt.hash('Volunteer@123', 10);

  for (const vol of SEED_VOLUNTEERS) {
    let user = await User.findOne({ email: vol.email });
    if (!user) {
      user = await User.create({
        fullName: vol.fullName,
        email: vol.email,
        password: passwordHash,
        mobile: vol.mobile,
        city: vol.city,
        role: 'volunteer',
        isVolunteer: true,
        location: vol.location,
        disabilityType: 'none',
      });
      console.log(`Created user: ${user.fullName}`);
    }

    let volunteerProfile = await Volunteer.findOne({ userId: user._id });
    if (!volunteerProfile) {
      volunteerProfile = await Volunteer.create({
        userId: user._id,
        skills: vol.skills,
        availability: {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          hours: { start: '08:00', end: '20:00' },
        },
        preferredCategories: vol.preferredCategories,
        location: vol.location,
        address: vol.address,
        kindnessScore: vol.kindnessScore,
        totalPointsEarned: vol.kindnessScore,
        rating: vol.rating,
        totalRatings: vol.completedTasks,
        completedTasks: vol.completedTasks,
        activeStatus: 'online',
        isVerified: true,
      });

      await User.findByIdAndUpdate(user._id, {
        volunteerProfile: volunteerProfile._id,
      });

      console.log(`Created verified online volunteer profile for ${vol.fullName}`);
    } else {
      // Ensure online and active
      await Volunteer.findByIdAndUpdate(volunteerProfile._id, {
        activeStatus: 'online',
        isVerified: true,
        location: vol.location,
      });
      console.log(`Updated volunteer profile for ${vol.fullName} to online & verified`);
    }
  }

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding volunteers:', err);
  process.exit(1);
});
