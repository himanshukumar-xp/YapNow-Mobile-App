// Local rule-based "AI" — no API key, works offline.
// Picks a starter from shared interests > shared language > location.

const STARTERS_BY_INTEREST = {
  Cricket: [
    'IPL or Test cricket — if you could only watch one forever, which one?',
    'Who is the most underrated Indian cricketer right now in your opinion?',
  ],
  Music: [
    'What song is on repeat for you this week?',
    'If you could only listen to one artist for a year, who would it be?',
  ],
  Coding: [
    'What are you building or learning in code right now?',
    'Tabs or spaces — and what editor won your heart?',
  ],
  Travel: [
    'What is the best trip you have taken so far, and why?',
    'Beach, mountains, or city break — pick one for your next trip?',
  ],
  Food: [
    'What is your comfort food that never fails?',
    'Best street food in your city — where should a visitor go first?',
  ],
  Cinema: [
    'Last movie you watched that you would actually recommend?',
    'Bollywood, Hollywood, or regional cinema — what wins for you?',
  ],
  Gaming: [
    'What game are you playing right now?',
    'Mobile, PC, or console — where do you do most of your gaming?',
  ],
  Yoga: [
    'Morning or evening practice — what works better for you?',
    'How did you get into yoga? Any tip for a beginner?',
  ],
  Photography: [
    'Phone or camera — what do you shoot with mostly?',
    'What is your favourite photo you have ever taken?',
  ],
  Books: [
    'What book are you reading right now?',
    'One book you think everyone should read once?',
  ],
};

const LANGUAGE_STARTERS = [
  'What language do you think in when you are excited — and why?',
  'Teach me one slang word from your language that I must know!',
  'Do you prefer chatting in {lang} or English for fun conversations?',
];

const LOCATION_STARTERS = [
  'What is one hidden gem in {city} that tourists miss?',
  'What does a perfect weekend in {city} look like for you?',
];

const GENERIC_STARTERS = [
  'What is something small that made you smile this week?',
  'What is a passion you could talk about for hours?',
  'If you had one extra hour every day, how would you spend it?',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getIcebreaker(me, peer, match) {
  const list = getIcebreakerList(me, peer, match, 3);
  return list[0];
}

export function getIcebreakerList(me, peer, match, count = 3) {
  const out = [];
  const shared = (match && match.sharedInterests) || [];
  const langs = (match && match.sharedLanguages) || [];

  // 1. Interest-based
  shared.forEach((interest) => {
    const templates = STARTERS_BY_INTEREST[interest] || [];
    templates.forEach((t) =>
      out.push({ text: t, reason: `Shared interest: ${interest}` })
    );
  });

  // 2. Language-based
  if (langs.length > 0) {
    LANGUAGE_STARTERS.forEach((t) =>
      out.push({
        text: t.replace('{lang}', langs[0]),
        reason: `Shared language: ${langs[0]}`,
      })
    );
  }

  // 3. Location-based
  if (me.location === peer.location) {
    LOCATION_STARTERS.forEach((t) =>
      out.push({
        text: t.replace('{city}', peer.location),
        reason: `Same city: ${peer.location}`,
      })
    );
  }

  // 4. Fallback
  GENERIC_STARTERS.forEach((t) => out.push({ text: t, reason: 'Get to know each other' }));

  // Shuffle + dedupe + slice
  const seen = new Set();
  const shuffled = out
    .filter((x) => {
      if (seen.has(x.text)) return false;
      seen.add(x.text);
      return true;
    })
    .sort(() => Math.random() - 0.5);

  return shuffled.slice(0, count);
}

// Simulated peer replies for demo chat (feels alive without backend)
const REPLIES_BY_INTEREST = {
  Cricket: [
    'No way, same! Did you watch the last match? That finish was insane.',
    'Okay hot take: Test cricket > everything. Agree or disagree?',
  ],
  Music: [
    'Nice taste! Have you been to any live gigs recently?',
    'Same here — send me your playlist, I need new songs!',
  ],
  Coding: [
    'Haha same struggle. What stack are you on right now?',
    'Nice! I just broke my build at 2am yesterday. Classic.',
  ],
  Travel: [
    'That sounds amazing! Where to next on your list?',
    'Same! I just added two new places to my bucket list.',
  ],
  Food: [
    'Yesss, now I am hungry. Best spot in your city for that?',
    'Totally agree. Sweet or spicy — pick one side!',
  ],
  Cinema: [
    'Good pick! What did you think of the ending though?',
    'Same! Any hidden gem movies you would recommend?',
  ],
  Gaming: [
    'GG! What is your rank/level right now?',
    'Haha same. One more match? It is never just one more...',
  ],
  Yoga: [
    'Same! Morning flows hit different, right?',
    'Nice, consistency is the hardest part. How long have you practiced?',
  ],
  Photography: [
    'Love that! Golden hour or blue hour — your pick?',
    'Same! What is your dream place to shoot?',
  ],
  Books: [
    'Adding that to my list! Fiction or non-fiction for you mostly?',
    'Same! Which book changed how you think?',
  ],
};

const GENERIC_REPLIES = [
  'Haha exactly! Tell me more about that.',
  'Interesting — I have never thought of it that way.',
  'Same here! What got you into that?',
  'Nice! How long have you been into that?',
  'That is cool. What is your favourite part about it?',
];

export function getMockReply(me, peer, match) {
  const shared = (match && match.sharedInterests) || peer.interests || [];
  const interest = shared[0];
  const pool = (interest && REPLIES_BY_INTEREST[interest]) || GENERIC_REPLIES;
  return pick(pool);
}
