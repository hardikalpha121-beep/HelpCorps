"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { users, volunteers, helpRequests, kindness, RegisterVolunteerInput } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import Link from "next/link";
import GPSLocationInput from "@/components/GPSLocationInput";
import { Coordinates } from "@/lib/location";

const SKILL_OPTIONS = [
  "Sign Language (ASL)",
  "First Aid & CPR",
  "Mobility Transport",
  "Licensed Driver",
  "Elderly Companion",
  "Tech Tutor",
  "Crisis De-escalation",
  "Reading & Vision Guide",
];

const CATEGORY_OPTIONS = [
  "Disability Support",
  "Elderly Care",
  "Women Safety Escort",
  "General Assistance",
];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS_OF_DAY = ["Morning (8am-12pm)", "Afternoon (12pm-5pm)", "Evening (5pm-9pm)", "On-Call Emergency"];

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const qc = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [disabilityType, setDisabilityType] = useState("none");

  // Volunteer Profile State
  const [volSkills, setVolSkills] = useState<string[]>([]);
  const [volDays, setVolDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [volHours, setVolHours] = useState<string[]>(["Morning (8am-12pm)"]);
  const [volCategories, setVolCategories] = useState<string[]>(["General Assistance"]);
  const [volAddress, setVolAddress] = useState("");
  const [volCoords, setVolCoords] = useState<Coordinates | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"profile" | "volunteer" | "requests">("profile");

  // Fetch full user data
  const { data: userData, refetch: refetchUser } = useQuery({
    queryKey: ["user-me"],
    queryFn: () => users.getMe(),
    enabled: !!user,
  });

  // Fetch volunteer profile
  const { data: volData, refetch: refetchVol } = useQuery({
    queryKey: ["volunteer-me"],
    queryFn: () => volunteers.myProfile(),
    enabled: !!user?.isVolunteer,
  });

  // Fetch user's help requests
  const { data: myRequestsData } = useQuery({
    queryKey: ["my-requests-profile"],
    queryFn: () => helpRequests.myRequests(),
    enabled: !!user,
  });

  // Fetch kindness points / transactions
  const { data: kindnessData } = useQuery({
    queryKey: ["my-kindness"],
    queryFn: () => kindness.myTransactions(),
    enabled: !!user,
  });

  const currentUser = (userData as any)?.data?.data?.user ?? user;
  const currentVol = (volData as any)?.data?.data?.volunteer;
  const myRequests = (myRequestsData as any)?.data?.data ?? [];
  const kindnessBalance = (kindnessData as any)?.data?.data?.balance ?? (currentUser?.kindnessScore ?? 140);

  // Populate state on load
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName || "");
      setMobile(currentUser.mobile || "");
      setCity(currentUser.city || "");
      setAge(currentUser.age || "");
      setProfilePhoto(currentUser.profilePhoto || "");
      setDisabilityType(currentUser.disabilityType || "none");
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentVol) {
      if (currentVol.skills) setVolSkills(currentVol.skills);
      if (currentVol.availability?.days) setVolDays(currentVol.availability.days);
      if (currentVol.preferredCategories) setVolCategories(currentVol.preferredCategories);
      if (currentVol.address) setVolAddress(currentVol.address);
    }
  }, [currentVol]);

  // Update User Mutation
  const updateUserMutation = useMutation({
    mutationFn: (body: any) => users.updateMe(body),
    onSuccess: (res: any) => {
      const updated = res.data.data.user;
      const token = localStorage.getItem("accessToken") || "";
      setAuth(updated, token);
      qc.invalidateQueries({ queryKey: ["user-me"] });
      setIsEditing(false);
      setSuccessMsg("Personal information updated successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error?.message ?? err.response?.data?.message ?? "Update failed.");
    },
  });

  // Volunteer Onboarding / Update Mutation
  const volMutation = useMutation({
    mutationFn: (body: RegisterVolunteerInput) => volunteers.register(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user-me"] });
      qc.invalidateQueries({ queryKey: ["volunteer-me"] });
      refetchUser();
      setSuccessMsg("Volunteer credentials updated successfully!");
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error?.message ?? err.response?.data?.message ?? "Volunteer update failed.");
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    updateUserMutation.mutate({
      fullName,
      mobile: mobile || undefined,
      city: city || undefined,
      age: age ? Number(age) : undefined,
      disabilityType: disabilityType as any,
      profilePhoto: profilePhoto || undefined,
    });
  };

  const handleSaveVolunteer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const coords = volCoords ?? { latitude: 31.7061, longitude: 76.5266 };
    volMutation.mutate({
      skills: volSkills.length > 0 ? volSkills : ["General Assistance"],
      availability: {
        days: volDays.map((d) => d.toLowerCase()),
        hours: volHours,
      },
      preferredCategories: volCategories.map((c) =>
        c.toLowerCase().includes("disability") ? "disability" :
        c.toLowerCase().includes("elderly") ? "elderly" :
        c.toLowerCase().includes("women") ? "womenSafety" : "general"
      ),
      location: coords,
      address: volAddress || city || "Local Community Base",
    });
  };

  const toggleArrayItem = (list: string[], setList: (l: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-28 pb-16 px-gutter bg-surface flex items-center justify-center">
        <div className="bg-surface-container-lowest max-w-md w-full p-space-xl rounded-2xl border border-surface-container shadow-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">account_circle</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold">Sign In Required</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 mb-6">
            Please log in or create an account to view and manage your HelpCorps profile and civic credentials.
          </p>
          <Link
            href="/volunteer-portal"
            className="w-full inline-flex justify-center items-center gap-2 py-3 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg font-bold shadow-md transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">login</span>
            Go to Volunteer Portal / Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Calculate 70/30 kindness points split
  const volunteerShare = Math.round(kindnessBalance * 0.7);
  const platformShare = Math.round(kindnessBalance * 0.3);

  return (
    <div className="min-h-screen pt-24 pb-20 bg-surface font-body-md text-body-md text-on-surface antialiased">
      <div className="max-w-6xl mx-auto px-gutter flex flex-col gap-space-lg">
        {/* Alerts */}
        {successMsg && (
          <div className="p-space-sm bg-secondary-fixed/50 text-secondary border border-secondary/30 rounded-xl flex items-center gap-2 font-label-md">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-space-sm bg-error-container/30 text-error border border-error/30 rounded-xl flex items-center gap-2 font-label-md">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {errorMsg}
          </div>
        )}

        {/* Profile Header Banner */}
        <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-primary-container/20 border-2 border-primary/30 flex items-center justify-center overflow-hidden text-primary font-bold text-headline-lg shadow-sm">
                {profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profilePhoto} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{fullName.slice(0, 2).toUpperCase() || "HC"}</span>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-secondary border-2 border-surface flex items-center justify-center text-on-secondary text-[10px]">
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-headline-lg text-headline-lg font-extrabold text-on-surface">
                  {currentUser.fullName || "HelpCorps Member"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold uppercase tracking-wider">
                  {currentUser.isVolunteer ? "Civic Volunteer" : "Citizen Requester"}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 flex items-center gap-2">
                <span>{currentUser.email}</span>
                {currentUser.city && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                      {currentUser.city}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isEditing ? "close" : "edit"}
              </span>
              {isEditing ? "Cancel Editing" : "Edit Profile"}
            </button>
            <Link
              href="/volunteer-portal"
              className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
              Volunteer Portal
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-surface-container-high pb-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl font-label-lg text-label-lg font-bold flex items-center gap-2 transition-all ${
              activeTab === "profile"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            Personal Info
          </button>
          <button
            onClick={() => setActiveTab("volunteer")}
            className={`px-4 py-2 rounded-xl font-label-lg text-label-lg font-bold flex items-center gap-2 transition-all ${
              activeTab === "volunteer"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">handshake</span>
            Volunteer Credentials & Skills
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded-xl font-label-lg text-label-lg font-bold flex items-center gap-2 transition-all ${
              activeTab === "requests"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            My Requests ({myRequests.length})
          </button>
        </div>

        {/* Tab 1: Personal Profile */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
            {/* Left Column: Information Card */}
            <div className="lg:col-span-8 bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high">
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-md flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">contact_page</span>
                Personal Information (main plan.txt specs)
              </h3>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-space-md">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Full Legal Name *</label>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full bg-surface text-on-surface p-space-sm rounded-lg border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Email Address (Immutable)</label>
                      <input
                        value={currentUser.email}
                        disabled
                        className="w-full bg-surface-container text-on-surface-variant p-space-sm rounded-lg opacity-70 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Mobile Number (SMS alerts)</label>
                      <input
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="+91..."
                        className="w-full bg-surface text-on-surface p-space-sm rounded-lg border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Age or Age Group</label>
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                        placeholder="e.g. 28"
                        min={1}
                        max={120}
                        className="w-full bg-surface text-on-surface p-space-sm rounded-lg border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <GPSLocationInput
                        label="City or Area (with GPS Auto-Detect)"
                        placeholder="e.g. Hamirpur, Himachal Pradesh"
                        value={city}
                        onChange={(val) => setCity(val)}
                        helperText="1-click GPS detection automatically resolves your city and area"
                      />
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Disability Accommodation</label>
                      <select
                        value={disabilityType}
                        onChange={(e) => setDisabilityType(e.target.value)}
                        className="w-full bg-surface text-on-surface p-space-sm rounded-lg border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none"
                      >
                        <option value="none">None (Standard)</option>
                        <option value="deaf">Deaf & ASL Assistance</option>
                        <option value="blind">Blind & Vision Audio Guidance</option>
                        <option value="handicapped">Mobility / Physical Disability</option>
                        <option value="elderly">Elderly Senior Citizen</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface mb-1 font-semibold">Profile Photo URL (optional)</label>
                      <input
                        value={profilePhoto}
                        onChange={(e) => setProfilePhoto(e.target.value)}
                        placeholder="https://images... or leave empty"
                        className="w-full bg-surface text-on-surface p-space-sm rounded-lg border border-surface-container-highest focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateUserMutation.isPending}
                      className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      {updateUserMutation.isPending ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="p-space-sm bg-surface rounded-xl border border-surface-container">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Full Name</span>
                    <p className="font-body-lg text-body-lg font-bold text-on-surface mt-0.5">{currentUser.fullName}</p>
                  </div>
                  <div className="p-space-sm bg-surface rounded-xl border border-surface-container">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Email Address</span>
                    <p className="font-body-lg text-body-lg font-bold text-on-surface mt-0.5">{currentUser.email}</p>
                  </div>
                  <div className="p-space-sm bg-surface rounded-xl border border-surface-container">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Mobile Number</span>
                    <p className="font-body-lg text-body-lg font-bold text-on-surface mt-0.5">{currentUser.mobile || "Not specified"}</p>
                  </div>
                  <div className="p-space-sm bg-surface rounded-xl border border-surface-container">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">City / Area</span>
                    <p className="font-body-lg text-body-lg font-bold text-on-surface mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                      {currentUser.city || "Not specified"}
                    </p>
                  </div>
                  <div className="p-space-sm bg-surface rounded-xl border border-surface-container">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Age</span>
                    <p className="font-body-lg text-body-lg font-bold text-on-surface mt-0.5">{currentUser.age ? `${currentUser.age} years` : "Not specified"}</p>
                  </div>
                  <div className="p-space-sm bg-surface rounded-xl border border-surface-container">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Accommodation</span>
                    <p className="font-body-lg text-body-lg font-bold text-on-surface mt-0.5 capitalize">{currentUser.disabilityType || "None"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Kindness Score & Civic Economics */}
            <div className="lg:col-span-4 flex flex-col gap-space-md">
              <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-secondary/20 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-secondary-container/10">
                <div className="flex items-center justify-between mb-space-sm">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px]">loyalty</span>
                    Kindness Economics (main plan.txt)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-on-secondary text-[11px] font-bold">
                    Active
                  </span>
                </div>

                <div className="my-space-md text-center">
                  <span className="text-4xl font-extrabold text-on-surface">{kindnessBalance}</span>
                  <span className="font-label-md text-label-md text-secondary block font-bold uppercase mt-1">Total Kindness Points</span>
                </div>

                {/* 70% Volunteer / 30% Admin Split Breakdown */}
                <div className="space-y-3 pt-space-sm border-t border-surface-container">
                  <div>
                    <div className="flex justify-between font-label-sm text-label-sm mb-1 font-semibold">
                      <span className="text-secondary flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-secondary" />
                        70% Volunteer Earnings
                      </span>
                      <span className="text-on-surface">{volunteerShare} pts</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full" style={{ width: "70%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-label-sm text-label-sm mb-1 font-semibold">
                      <span className="text-primary flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        30% Civic Platform Pool
                      </span>
                      <span className="text-on-surface">{platformShare} pts</span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: "30%" }} />
                    </div>
                  </div>
                </div>

                <p className="font-body-sm text-body-sm text-on-surface-variant mt-4 text-center">
                  Upon completion of missions, points are automatically split according to the HelpCorps community charter.
                </p>
              </div>

              {/* Status Card */}
              <div className="bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container shadow-sm flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">verified_user</span>
                </div>
                <div>
                  <h4 className="font-label-lg text-label-lg text-on-surface font-bold">Verified Civic Participant</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Member ID: {currentUser._id?.slice(-8) || "Active"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Volunteer Credentials & Preferences */}
        {activeTab === "volunteer" && (
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high flex flex-col gap-space-lg">
            <div>
              <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">Community Response Profile</span>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface mt-1">Volunteer Credentials & Availability</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Configure your skills, response categories, and active operational hours as outlined in the HelpCorps deployment guide.
              </p>
            </div>

            <form onSubmit={handleSaveVolunteer} className="space-y-space-lg">
              {/* Skills and Interests */}
              <div>
                <label className="block font-label-lg text-label-lg font-bold text-on-surface mb-2">
                  Skills & Interests (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((skill) => {
                    const active = volSkills.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => toggleArrayItem(volSkills, setVolSkills, skill)}
                        className={`px-3 py-1.5 rounded-lg font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 ${
                          active
                            ? "bg-secondary text-on-secondary shadow-sm"
                            : "bg-surface text-on-surface border border-surface-container hover:bg-surface-container"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {active ? "check" : "add"}
                        </span>
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Categories */}
              <div>
                <label className="block font-label-lg text-label-lg font-bold text-on-surface mb-2">
                  Preferred Volunteering Categories
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const active = volCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleArrayItem(volCategories, setVolCategories, cat)}
                        className={`p-3 rounded-xl border text-left font-label-md text-label-md font-bold transition-all flex items-center justify-between ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-surface-container bg-surface text-on-surface hover:bg-surface-container"
                        }`}
                      >
                        <span>{cat}</span>
                        <span className="material-symbols-outlined text-[18px]">
                          {active ? "check_circle" : "radio_button_unchecked"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability: Days */}
              <div>
                <label className="block font-label-lg text-label-lg font-bold text-on-surface mb-2">
                  Available Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const active = volDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleArrayItem(volDays, setVolDays, day)}
                        className={`w-12 h-10 rounded-lg font-label-md text-label-md font-bold transition-all ${
                          active
                            ? "bg-primary text-on-primary"
                            : "bg-surface text-on-surface border border-surface-container hover:bg-surface-container"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability: Hours */}
              <div>
                <label className="block font-label-lg text-label-lg font-bold text-on-surface mb-2">
                  Available Hours
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {HOURS_OF_DAY.map((h) => {
                    const active = volHours.includes(h);
                    return (
                      <button
                        type="button"
                        key={h}
                        onClick={() => toggleArrayItem(volHours, setVolHours, h)}
                        className={`p-2.5 rounded-xl border text-left font-label-sm text-label-sm font-semibold transition-all ${
                          active
                            ? "border-secondary bg-secondary/10 text-secondary"
                            : "border-surface-container bg-surface text-on-surface hover:bg-surface-container"
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Base Location with GPS */}
              <div>
                <GPSLocationInput
                  label="Volunteer Base / Coverage Location (with GPS Auto-Detect)"
                  placeholder="e.g. Hamirpur City Center or Home Area"
                  value={volAddress}
                  onChange={(val, coords) => {
                    setVolAddress(val);
                    if (coords) setVolCoords(coords);
                  }}
                  autoDetectOnMount={false}
                  helperText="Your base coordinates determine nearby alert dispatches"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-surface-container">
                <button
                  type="submit"
                  disabled={volMutation.isPending}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-label-lg text-label-lg font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                  {volMutation.isPending ? "Updating Credentials..." : "Save Volunteer Credentials"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: My Requests History */}
        {activeTab === "requests" && (
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-surface-container-high flex flex-col gap-space-md">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">My Active & Past Help Requests</h2>
            {myRequests.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] block mb-2 text-outline">inbox</span>
                <p className="font-body-md text-body-md">You have not created any help requests yet.</p>
                <Link href="/" className="inline-block mt-3 px-4 py-1.5 rounded-lg bg-primary text-on-primary font-label-md text-label-md">
                  Request Assistance
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-surface-container">
                {myRequests.map((req: any) => (
                  <div key={req._id} className="py-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md font-bold text-on-surface capitalize">
                          {req.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          req.status === "completed" ? "bg-secondary-fixed text-on-secondary-fixed-variant" :
                          req.status === "accepted" ? "bg-primary-container text-on-primary" :
                          "bg-surface-container text-on-surface-variant"
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{req.description}</p>
                      {req.address && (
                        <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                          {req.address}
                        </p>
                      )}
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
