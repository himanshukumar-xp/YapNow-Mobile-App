// Matching logic: score by shared interests + shared languages.
// Picks randomly among top scorers so "Random" still feels smart.

export function getShared(a = [], b = []) {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}

export function scoreCandidate(me, candidate) {
  const sharedInterests = getShared(me.interests, candidate.interests);
  const sharedLanguages = getShared(me.languages, candidate.languages);
  const sameCity = me.location === candidate.location ? 1 : 0;
  const score = sharedInterests.length * 2 + sharedLanguages.length * 1 + sameCity;
  return { sharedInterests, sharedLanguages, sameCity, score };
}

export function findRandomMatch(me, allUsers, excludeIds = []) {
  const pool = allUsers.filter((u) => !excludeIds.includes(u.id));
  if (pool.length === 0) return null;

  const scored = pool.map((u) => ({
    user: u,
    ...scoreCandidate(me, u),
  }));

  scored.sort((x, y) => y.score - x.score);
  // Take top 5 (or all if fewer) and pick randomly — best of both worlds
  const top = scored.slice(0, Math.min(5, scored.length));
  const pick = top[Math.floor(Math.random() * top.length)];

  return {
    id: `m_${Date.now()}`,
    peer: pick.user,
    sharedInterests: pick.sharedInterests,
    sharedLanguages: pick.sharedLanguages,
    sameCity: pick.sameCity,
    score: pick.score,
    createdAt: Date.now(),
  };
}

export function matchReason(match) {
  const bits = [];
  if (match.sharedInterests.length > 0) {
    bits.push(`both love ${match.sharedInterests.slice(0, 2).join(' & ')}`);
  }
  if (match.sharedLanguages.length > 0) {
    bits.push(`speak ${match.sharedLanguages.slice(0, 2).join(' & ')}`);
  }
  if (match.sameCity) {
    bits.push(`live in ${match.peer.location}`);
  }
  if (bits.length === 0) return 'Someone new to explore with';
  return `You ${bits.join(' · ')}`;
}
