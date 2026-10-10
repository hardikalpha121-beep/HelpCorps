'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auth, volunteers, RegisterInput, RegisterVolunteerInput } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GPSLocationInput from '@/components/GPSLocationInput';
import { Coordinates } from '@/lib/location';

const ALL_SKILLS = [
  'Sign Language (ASL/ISL)',
  'Wheelchair & Mobility Escort',
  'Blind & Low-Vision Scribe',
  'Elderly Care & Companion',
  'First Aid & CPR',
  'Emergency Medical Triage',
  'Grocery & Medication Delivery',
  'Women Safety Rapid Responder',
  'Crisis De-escalation',
];

const PREFERRED_CATEGORIES = [
  { label: 'Disability Assistance', value: 'disability' },
  { label: 'Elderly Care', value: 'elderly' },
  { label: 'Women Safety SOS', value: 'womenSafety' },
  { label: 'General Civic Help', value: 'general' },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SHIFTS = [
  { label: 'Morning (08:00 - 13:00)', start: '08:00', end: '13:00' },
  { label: 'Afternoon (13:00 - 18:00)', start: '13:00', end: '18:00' },
  { label: 'Evening (18:00 - 22:00)', start: '18:00', end: '22:00' },
  { label: '24/7 On-Call Emergency', start: '00:00', end: '23:59' },
];

export default function VolunteerRegisterPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, setAuth } = useAuthStore();

  // Registration form
  const [accountForm, setAccountForm] = useState<RegisterInput & { confirmPassword: string }>({
    fullName: user?.fullName || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    mobile: (user as any)?.mobile || '',
    city: user?.city || 'Hamirpur',
    disabilityType: 'none',
  });

  // Volunteer specifics
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'Sign Language (ASL/ISL)',
    'First Aid & CPR',
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'disability',
    'elderly',
  ]);
  const [selectedDays, setSelectedDays] = useState<string[]>([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
  ]);
  const [selectedShift, setSelectedShift] = useState<{ start: string; end: string }>({
    start: '08:00',
    end: '20:00',
  });
  const [address, setAddress] = useState('Hamirpur, HP');
  const [coords, setCoords] = useState<Coordinates>({ latitude: 31.7061, longitude: 76.5266 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mutation to create volunteer profile
  const volunteerProfileMutation = useMutation({
    mutationFn: (body: RegisterVolunteerInput) => volunteers.register(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-profile'] });
      // Update local user state
      if (user) {
        useAuthStore.getState().setAuth({ ...user, isVolunteer: true }, localStorage.getItem('accessToken') || '');
      }
      router.push('/volunteer-portal');
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          'Failed to setup volunteer responder profile.'
      );
    },
  });

  // Mutation to create new user + then volunteer profile
  const fullOnboardingMutation = useMutation({
    mutationFn: async () => {
      let currentUser = user;
      let token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      if (!currentUser) {
        if (accountForm.password !== accountForm.confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        if (accountForm.password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }

        const { confirmPassword, ...body } = accountForm;
        const res: any = await auth.register({
          ...body,
        } as any);

        currentUser = res.data.data.user;
        token = res.data.data.accessToken;
        setAuth(currentUser!, token!);
      }

      // Register volunteer profile
      await volunteers.register({
        skills: selectedSkills,
        preferredCategories: selectedCategories,
        availability: {
          days: selectedDays.map((d) => d.toLowerCase()),
          hours: selectedShift,
        },
        location: coords,
        address: address.trim(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['volunteer-profile'] });
      const current = useAuthStore.getState().user;
      if (current) {
        useAuthStore.getState().setAuth(
          { ...current, isVolunteer: true },
          localStorage.getItem('accessToken') || ''
        );
      }
      router.push('/volunteer-portal');
    },
    onError: (err: any) => {
      setErrorMsg(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Registration failed. Please check your details.'
      );
    },
  });

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 bg-surface font-body-md text-body-md text-on-surface antialiased">
      <div className="max-w-2xl mx-auto px-gutter flex flex-col gap-space-lg">
        {/* Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-[32px]">how_to_reg</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg font-extrabold text-on-surface tracking-tight">
            Join the HelpCorps Civic Responder Force
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-lg mx-auto mt-1">
            Register your verified skills, receive live neighbor dispatches, and earn Kindness Points with 70% direct volunteer rewards.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErrorMsg(null);
            fullOnboardingMutation.mutate();
          }}
          className="bg-surface-container-lowest rounded-2xl p-space-xl shadow-md border border-surface-container-high space-y-space-lg"
        >
          {/* Section 1: Account Credentials (only if not logged in) */}
          {!user && (
            <div>
              <h2 className="font-label-lg text-label-lg font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs flex items-center justify-center font-bold">1</span>
                <span>Personal & Account Details</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                <div className="sm:col-span-2">
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountForm.fullName}
                    onChange={(e) => setAccountForm({ ...accountForm, fullName: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full bg-surface-container-low text-on-surface p-space-sm rounded-xl border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary text-body-md"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    placeholder="name@helpcorps.community"
                    className="w-full bg-surface-container-low text-on-surface p-space-sm rounded-xl border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary text-body-md"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Mobile Number (SMS alerts)
                  </label>
                  <input
                    type="tel"
                    value={accountForm.mobile}
                    onChange={(e) => setAccountForm({ ...accountForm, mobile: e.target.value })}
                    placeholder="+91 98160 00000"
                    className="w-full bg-surface-container-low text-on-surface p-space-sm rounded-xl border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary text-body-md"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={accountForm.password}
                    onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full bg-surface-container-low text-on-surface p-space-sm rounded-xl border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary text-body-md"
                  />
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={accountForm.confirmPassword}
                    onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter password"
                    className="w-full bg-surface-container-low text-on-surface p-space-sm rounded-xl border border-surface-container-high focus:outline-none focus:ring-2 focus:ring-primary text-body-md"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Responder Skills */}
          <div className="pt-space-sm border-t border-surface-container">
            <h2 className="font-label-lg text-label-lg font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs flex items-center justify-center font-bold">{user ? '1' : '2'}</span>
              <span>Select Your Responder Skills</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_SKILLS.map((skill) => {
                const selected = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`p-3 rounded-xl text-left border flex items-center justify-between transition-all ${
                      selected
                        ? 'bg-primary-container text-on-primary border-primary font-bold shadow-xs'
                        : 'bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container'
                    }`}
                  >
                    <span className="text-xs font-semibold">{skill}</span>
                    <span className="material-symbols-outlined text-[18px]">
                      {selected ? 'check_box' : 'check_box_outline_blank'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Preferred Categories */}
          <div className="pt-space-sm border-t border-surface-container">
            <h2 className="font-label-lg text-label-lg font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs flex items-center justify-center font-bold">{user ? '2' : '3'}</span>
              <span>Preferred Assistance Categories</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PREFERRED_CATEGORIES.map((cat) => {
                const selected = selectedCategories.includes(cat.value);
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleCategory(cat.value)}
                    className={`p-2.5 rounded-xl text-center text-xs border font-semibold transition-all ${
                      selected
                        ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                        : 'bg-surface-container-low text-on-surface-variant border-surface-container-high hover:bg-surface-container'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Availability Schedule */}
          <div className="pt-space-sm border-t border-surface-container">
            <h2 className="font-label-lg text-label-lg font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-on-primary text-xs flex items-center justify-center font-bold">{user ? '3' : '4'}</span>
              <span>Availability (Days & Shifts)</span>
            </h2>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {DAYS.map((day) => {
                const selected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                      selected
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SHIFTS.map((shift, i) => {
                const active = selectedShift.start === shift.start && selectedShift.end === shift.end;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedShift({ start: shift.start, end: shift.end })}
                    className={`p-2.5 rounded-xl text-left border text-xs font-semibold transition-all ${
                      active
                        ? 'bg-surface-container-high border-primary text-primary ring-2 ring-primary/20'
                        : 'bg-surface-container-low border-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {shift.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Base Coordinates & Area */}
          <div className="pt-space-sm border-t border-surface-container">
            <GPSLocationInput
              label="Base Dispatch Station / City Area"
              value={address}
              onChange={(val, newCoords) => {
                setAddress(val);
                if (newCoords) setCoords(newCoords);
              }}
              autoDetectOnMount={true}
              helperText="Determines which neighborhood help requests reach your dispatch radar"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-error-container/20 border border-error/30 text-error font-body-sm text-body-sm">
              {errorMsg}
            </div>
          )}

          <div className="pt-space-md border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-space-md">
            <Link
              href="/volunteer-portal/login"
              className="text-xs text-on-surface-variant hover:text-primary underline"
            >
              Already registered? Sign in here →
            </Link>
            <button
              type="submit"
              disabled={fullOnboardingMutation.isPending}
              className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
            >
              <span className="material-symbols-outlined text-[20px]">badge</span>
              {fullOnboardingMutation.isPending ? 'Onboarding Responder...' : 'Complete Volunteer Onboarding'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
