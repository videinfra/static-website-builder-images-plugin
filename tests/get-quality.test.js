const { isNumberOrFalse, getQuality, qualityFallback } = require('../gulp/util/get-quality');

test('isNumberOrFalse', () => {
    expect(isNumberOrFalse()).toEqual(false);
    expect(isNumberOrFalse(-90)).toEqual(false);
    expect(isNumberOrFalse(90)).toEqual(true);
    expect(isNumberOrFalse(false)).toEqual(true);
    expect(isNumberOrFalse(true)).toEqual(false);
});

test('getQuality from number', () => {
    const qualityAsNumber = 90;
    expect(getQuality(qualityAsNumber, 'webp')).toEqual(90);
});

test('getQuality from object', () => {
    const qualityAsObject = { webp: 90, avif: false, jpg: 60 };

    expect(getQuality(qualityAsObject, 'webp')).toEqual(90);
    expect(getQuality(qualityAsObject, 'avif')).toEqual(false);
    expect(getQuality(qualityAsObject, 'jpg')).toEqual(60);
    expect(getQuality(qualityAsObject, 'png')).toEqual(undefined);
});

test('getQuality from object with quality key', () => {
    const qualityAsObject = { quality: { webp: 90, avif: false, jpg: 60 }};

    expect(getQuality(qualityAsObject, 'webp')).toEqual(90);
    expect(getQuality(qualityAsObject, 'avif')).toEqual(false);
    expect(getQuality(qualityAsObject, 'jpg')).toEqual(60);
    expect(getQuality(qualityAsObject, 'png')).toEqual(undefined);
});

test('getQuality from object with deep quality key', () => {
    const qualityAsObject = { webp: { quality: 90 }, avif: { quality: false }, jpg: { quality: 60 } };

    expect(getQuality(qualityAsObject, 'webp')).toEqual(90);
    expect(getQuality(qualityAsObject, 'avif')).toEqual(false);
    expect(getQuality(qualityAsObject, 'jpg')).toEqual(60);
    expect(getQuality(qualityAsObject, 'png')).toEqual(undefined);
});

test('qualityFallback as object', () => {
    const qualityAsObject = { webp: 90, avif: false, jpg: 60 };

    expect(qualityFallback(getQuality(qualityAsObject, 'webp'), {}, 'webp')).toEqual(90);
    expect(qualityFallback(getQuality(qualityAsObject, 'avif'), {}, 'avif')).toEqual(false);
    expect(qualityFallback(getQuality(qualityAsObject, 'jpg'), {}, 'jpg')).toEqual(60);
    expect(qualityFallback(getQuality(qualityAsObject, 'png'), {}, 'png')).toEqual(false);
});