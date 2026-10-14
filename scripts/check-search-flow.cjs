const assert = require('node:assert/strict');

async function verifySearchDetails(base, request = fetch) {
  const query = new URLSearchParams({q: '東京駅', category: 'railway', prefecture: '東京都'});
  const search = await request(`${base}/api/search?${query}`, {signal: AbortSignal.timeout(25000), redirect: 'error'});
  assert.equal(search.status, 200, 'Search API failed');
  assert.match(search.headers.get('content-type') || '', /application\/json/, 'Search API did not return JSON');
  const results = await search.json();
  assert.ok(Array.isArray(results.places), 'Search results are malformed');
  const station = results.places.find(place => place && place.name === '東京駅' && place.category_slug === 'railway' && place.prefecture_name === '東京都');
  assert.ok(station, 'Tokyo station missing from filtered search');
  assert.ok(Number.isSafeInteger(station.id) && station.id > 0, 'Invalid search result ID');
  assert.ok(Number.isFinite(station.latitude) && station.latitude >= 20 && station.latitude <= 46, 'Invalid search latitude');
  assert.ok(Number.isFinite(station.longitude) && station.longitude >= 122 && station.longitude <= 154, 'Invalid search longitude');
  const response = await request(`${base}/api/place-details?id=${station.id}`, {signal: AbortSignal.timeout(25000), redirect: 'error'});
  assert.equal(response.status, 200, 'Selected facility details API failed');
  assert.match(response.headers.get('content-type') || '', /application\/json/, 'Details API did not return JSON');
  const {details} = await response.json();
  for (const field of ['routes', 'operators']) {
    assert.ok(Array.isArray(details?.[field]) && details[field].length > 0 && details[field].every(value => typeof value === 'string' && value.trim()), `Missing or malformed station ${field}`);
  }
  return station.id;
}

module.exports = {verifySearchDetails};
