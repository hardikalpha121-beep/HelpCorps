import Volunteer from '../volunteers/volunteer.model.js';
import HelpRequest from '../helpRequests/helpRequest.model.js';
import { env } from '../../config/env.js';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestPayload {
  message: string;
  history?: ChatMessage[];
  location?: { latitude: number; longitude: number };
  userId?: string;
  bookVolunteerId?: string;
  bookingServiceType?: string;
}

export async function processChat({
  message,
  history = [],
  location = { latitude: 31.7061, longitude: 76.5266 },
  userId,
  bookVolunteerId,
  bookingServiceType,
}: ChatRequestPayload) {
  // 1. Fetch active online volunteers from DB to give live context
  const activeVolunteers = await Volunteer.find({
    isDeleted: false,
    activeStatus: { $ne: 'offline' },
  })
    .populate('userId', 'fullName email mobile city profilePhoto')
    .limit(10)
    .lean();

  const formattedVolunteers = activeVolunteers.map((v: any) => ({
    id: v._id.toString(),
    name: v.userId?.fullName || 'Volunteer',
    city: v.userId?.city || 'Local Area',
    mobile: v.userId?.mobile || 'Confidential',
    skills: v.skills || [],
    rating: v.rating || 5.0,
    kindnessScore: v.kindnessScore || 100,
    preferredCategories: v.preferredCategories || [],
    address: v.address || 'Hamirpur, HP',
  }));

  // 2. Check for explicit or detected booking action
  let bookingResult: any = null;

  // Direct booking trigger or intent detection
  const lowerMsg = message.toLowerCase();
  const isBookingIntent =
    bookVolunteerId ||
    ((lowerMsg.includes('book') || lowerMsg.includes('hire') || lowerMsg.includes('assign') || lowerMsg.includes('request volunteer')) &&
      formattedVolunteers.some((v) => lowerMsg.includes(v.name.toLowerCase())));

  let targetVolunteer = bookVolunteerId
    ? formattedVolunteers.find((v) => v.id === bookVolunteerId)
    : formattedVolunteers.find((v) => lowerMsg.includes(v.name.toLowerCase()));

  if (isBookingIntent && targetVolunteer) {
    try {
      let category: 'disability' | 'elderly' | 'womenSafety' | 'general' = 'general';
      if (lowerMsg.includes('elder') || lowerMsg.includes('senior') || lowerMsg.includes('grocery')) {
        category = 'elderly';
      } else if (lowerMsg.includes('deaf') || lowerMsg.includes('sign') || lowerMsg.includes('blind') || lowerMsg.includes('wheelchair') || lowerMsg.includes('mobility')) {
        category = 'disability';
      } else if (lowerMsg.includes('safety') || lowerMsg.includes('emergency') || lowerMsg.includes('women')) {
        category = 'womenSafety';
      }

      // Create booking request if user exists, or civic dispatch
      const requesterId = userId || targetVolunteer.id;
      const newHelpRequest: any = await HelpRequest.create({
        requesterId,
        category,
        serviceType: bookingServiceType || 'Volunteer Direct Booking',
        description: `Direct booking with ${targetVolunteer.name}: ${message.slice(0, 200)}`,
        address: targetVolunteer.address || 'Hamirpur, HP',
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
        },
        status: 'accepted',
        assignedVolunteers: [targetVolunteer.id],
      });

      bookingResult = {
        bookingId: newHelpRequest._id?.toString() || 'REQ-CONFIRMED',
        volunteerName: targetVolunteer.name,
        volunteerId: targetVolunteer.id,
        skills: targetVolunteer.skills,
        rating: targetVolunteer.rating,
        category,
        status: 'confirmed',
        message: `Direct volunteer booking confirmed for ${targetVolunteer.name}.`,
      };
    } catch (err) {
      console.error('Error creating booking request:', err);
    }
  }

  // 3. Construct System Prompt with live DB context
  const systemPrompt = `You are "HelpCorps AI", the friendly, highly intelligent, and compassionate assistant of HelpCorps (a self-help and civic mutual aid community platform).

YOUR MISSION & CAPABILITIES:
1. Track Volunteers: You know ALL live active volunteers registered in the database, their real names, skills, ratings, and locations.
2. Volunteer Booking: Help users find the right volunteer and book assistance directly.
3. Full Platform Knowledge:
   - "Disability Assistance": Tailored support for Deaf/Hard of Hearing (ASL/ISL interpreters), Blind/Low-Vision (human scribes, braille), and Mobility (wheelchair transport).
   - "Elderly Care": Doorstep grocery runs, companion visits, medical transport, vital check-ins.
   - "Women Safety SOS": Live emergency dispatch with automatic GPS broadcast. No login or signup required — completely open for emergency safety.
   - "Kindness Points & Economics": 70% of points go directly to volunteer responder rewards, 30% are pooled for community safety gear and civic initiatives.
   - "Citizen vs Volunteer": Citizens sign in to get help at /auth. Volunteers register their skills and availability at /volunteer-portal.

CURRENT LIVE VERIFIED VOLUNTEERS IN DATABASE:
${formattedVolunteers
  .map(
    (v, i) =>
      `${i + 1}. **${v.name}** (Rating: ${v.rating}★ | Kindness Score: ${v.kindnessScore} pts)
   - Skills: ${v.skills.join(', ')}
   - Location: ${v.address} (${v.city})
   - ID: ${v.id}`
  )
  .join('\n')}

${
  bookingResult
    ? `\nIMPORTANT NOTIFICATION: You have just successfully created a confirmed booking with ${bookingResult.volunteerName} (Booking ID: ${bookingResult.bookingId})! Congratulate the user and explain that ${bookingResult.volunteerName} has been assigned to their assistance request.`
    : ''
}

GUIDELINES FOR YOUR REPLIES:
- Be warm, helpful, and concise. Use clear formatting with bullet points and bold names.
- When the user asks about available volunteers or who can help with a specific task, list the matching volunteers from the list above with their skills.
- If the user wants to book a volunteer, encourage them and explain they can say "Book [Name]" or click the booking action.
- When asked about SOS, remind them that emergency help is always free and needs no login at /women-safety-sos.
- If asked about voice commands, inform them they can speak anytime by clicking the microphone button!`;

  // 4. Call OpenRouter API
  const messagesToSend = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8), // Keep recent conversation context
    { role: 'user', content: message },
  ];

  const apiKey = env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';
  const model = env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct';

  let replyText = 'Hello! I am your HelpCorps Assistant. How can I help you today?';

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://helpcorps.community',
        'X-Title': 'HelpCorps Community Assistant',
      },
      body: JSON.stringify({
        model,
        messages: messagesToSend,
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error response:', response.status, errText);
      // Fallback response with volunteer list if upstream times out
      replyText = `Here are the verified volunteers available near you:\n\n${formattedVolunteers
        .map((v) => `• **${v.name}** (${v.rating}★) — ${v.skills.join(', ')} [${v.city}]`)
        .join('\n')}\n\nYou can book any of these volunteers directly!`;
    } else {
      const data: any = await response.json();
      replyText = data?.choices?.[0]?.message?.content || replyText;
    }
  } catch (error) {
    console.error('Failed to query OpenRouter:', error);
    replyText = `I am having trouble reaching the AI network right now, but here are our top active volunteers ready to assist you:\n\n${formattedVolunteers
      .map((v) => `• **${v.name}** (${v.rating}★) — ${v.skills.join(', ')}`)
      .join('\n')}`;
  }

  return {
    reply: replyText,
    volunteers: formattedVolunteers,
    booking: bookingResult,
  };
}
