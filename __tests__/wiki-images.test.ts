import { extractPageImages, requestWikiImage, useWikiImages } from '@/lib/wiki-images';

const flush = async () => {
  jest.advanceTimersByTime(100);
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

beforeEach(() => {
  jest.useFakeTimers();
  useWikiImages.setState({ found: {} });
});

afterEach(() => {
  jest.useRealTimers();
});

test('extractPageImages follows normalization and redirects', () => {
  const images = extractPageImages({
    query: {
      normalized: [{ from: 'chocolate Rabbit Family', to: 'Chocolate Rabbit Family' }],
      redirects: [{ from: 'Chocolate Rabbit Family', to: 'Chocolate Rabbit Family (UK)' }],
      pages: [{ title: 'Chocolate Rabbit Family (UK)', thumbnail: { source: 'https://img/choco.png' } }, { title: 'Hedgehog Family' }],
    },
  });
  expect(images.get('chocolate Rabbit Family')).toBe('https://img/choco.png');
  expect(images.get('Chocolate Rabbit Family')).toBe('https://img/choco.png');
  expect(images.has('Hedgehog Family')).toBe(false);
});

test('requests made together are sent in one call and saved, found or not', async () => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      query: { pages: [{ title: 'Koala Family', thumbnail: { source: 'https://img/koala.png' } }, { title: 'Otter Family' }] },
    }),
  });
  global.fetch = fetchMock;

  requestWikiImage('Koala Family');
  requestWikiImage('Otter Family');
  requestWikiImage('Koala Family');
  await flush();

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const url = new URL(fetchMock.mock.calls[0][0]);
  expect(url.searchParams.get('titles')).toBe('Koala Family|Otter Family');
  expect(url.searchParams.get('prop')).toBe('pageimages');
  const found = useWikiImages.getState().found;
  expect(found['Koala Family'].url).toBe('https://img/koala.png');
  expect(found['Otter Family']).toEqual({ url: undefined, checkedAt: expect.any(Number) });

  // Déjà connues : pas de nouvelle requête.
  requestWikiImage('Koala Family');
  requestWikiImage('Otter Family');
  await flush();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('a network error is not saved and is not retried during the session', async () => {
  const fetchMock = jest.fn().mockRejectedValue(new Error('offline'));
  global.fetch = fetchMock;

  requestWikiImage('Sheep Family');
  await flush();
  requestWikiImage('Sheep Family');
  await flush();

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(useWikiImages.getState().found['Sheep Family']).toBeUndefined();
});
