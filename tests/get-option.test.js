import { isNumberOrFalse, getOptionProperty, getOptionFallback } from '../gulp/util/get-option.js';

test('isNumberOrFalse', () => {
    expect(isNumberOrFalse()).toEqual(false);
    expect(isNumberOrFalse(-90)).toEqual(false);
    expect(isNumberOrFalse(90)).toEqual(true);
    expect(isNumberOrFalse(false)).toEqual(true);
    expect(isNumberOrFalse(true)).toEqual(false);
});

test('getOptionProperty from number', () => {
    const qualityAsNumber = 90;
    expect(getOptionProperty(qualityAsNumber, 'quality', 'webp')).toEqual(90);
    expect(getOptionProperty(qualityAsNumber, 'effort', 'webp', false)).toEqual(undefined);
});

test('getOptionProperty from object', () => {
    const qualityAsObject = { webp: 90, avif: false, jpg: 60 };

    expect(getOptionProperty(qualityAsObject, 'quality', 'webp')).toEqual(90);
    expect(getOptionProperty(qualityAsObject, 'quality', 'avif')).toEqual(false);
    expect(getOptionProperty(qualityAsObject, 'quality', 'jpg')).toEqual(60);
    expect(getOptionProperty(qualityAsObject, 'quality', 'png')).toEqual(undefined);

    expect(getOptionProperty(qualityAsObject, 'effort', 'webp', false)).toEqual(undefined);
    expect(getOptionProperty(qualityAsObject, 'effort', 'avif', false)).toEqual(undefined);
    expect(getOptionProperty(qualityAsObject, 'effort', 'jpg', false)).toEqual(undefined);
    expect(getOptionProperty(qualityAsObject, 'effort', 'png', false)).toEqual(undefined);
});

test('getOptionProperty from object with quality and effort', () => {
    const qualityAsObject = { webp: 90, avif: false, jpg: 60 };

    expect(getOptionProperty(qualityAsObject, 'quality', 'webp')).toEqual(90);
    expect(getOptionProperty(qualityAsObject, 'quality', 'avif')).toEqual(false);
    expect(getOptionProperty(qualityAsObject, 'quality', 'jpg')).toEqual(60);
    expect(getOptionProperty(qualityAsObject, 'quality', 'png')).toEqual(undefined);

    expect(getOptionProperty(qualityAsObject, 'effort', 'webp', false)).toEqual(undefined);
    expect(getOptionProperty(qualityAsObject, 'effort', 'avif', false)).toEqual(undefined);
    expect(getOptionProperty(qualityAsObject, 'effort', 'jpg', false)).toEqual(undefined);
    expect(getOptionProperty(qualityAsObject, 'effort', 'png', false)).toEqual(undefined);
});

test('getOptionProperty from object with quality key', () => {
    const qualityAsObject = { quality: { webp: 90, avif: false, jpg: 60 }, effort: { webp: 4 } };

    expect(getOptionProperty(qualityAsObject, 'quality', 'webp')).toEqual(90);
    expect(getOptionProperty(qualityAsObject, 'quality', 'avif')).toEqual(false);
    expect(getOptionProperty(qualityAsObject, 'quality', 'jpg')).toEqual(60);
    expect(getOptionProperty(qualityAsObject, 'quality', 'png')).toEqual(undefined);

    expect(getOptionProperty(qualityAsObject, 'effort', 'webp', false)).toEqual(4);
    expect(getOptionProperty(qualityAsObject, 'effort', 'avif', false)).toEqual(undefined);
    expect(getOptionProperty(qualityAsObject, 'effort', 'jpg', false)).toEqual(undefined);
    expect(getOptionProperty(qualityAsObject, 'effort', 'png', false)).toEqual(undefined);
});

test('getOptionProperty from object with deep quality key', () => {
    const qualityAsObject = { webp: { quality: 90, effort: 4 }, avif: { quality: false, effort: 2 }, jpg: { quality: 60 } };

    expect(getOptionProperty(qualityAsObject, 'quality', 'webp')).toEqual(90);
    expect(getOptionProperty(qualityAsObject, 'quality', 'avif')).toEqual(false);
    expect(getOptionProperty(qualityAsObject, 'quality', 'jpg')).toEqual(60);
    expect(getOptionProperty(qualityAsObject, 'quality', 'png')).toEqual(undefined);

    expect(getOptionProperty(qualityAsObject, 'effort', 'webp', false)).toEqual(4);
    expect(getOptionProperty(qualityAsObject, 'effort', 'avif', false)).toEqual(2);
    expect(getOptionProperty(qualityAsObject, 'effort', 'jpg', false)).toEqual(undefined);
    expect(getOptionProperty(qualityAsObject, 'effort', 'png', false)).toEqual(undefined);
});

test('getOptionFallback as object', () => {
    const qualityAsObject = { webp: 90, avif: false, jpg: 60 };

    expect(getOptionFallback(getOptionProperty(qualityAsObject, 'quality', 'webp'), {}, 'quality', 'webp')).toEqual(90);
    expect(getOptionFallback(getOptionProperty(qualityAsObject, 'quality', 'avif'), {}, 'quality', 'avif')).toEqual(false);
    expect(getOptionFallback(getOptionProperty(qualityAsObject, 'quality', 'jpg'), {}, 'quality', 'jpg')).toEqual(60);
    expect(getOptionFallback(getOptionProperty(qualityAsObject, 'quality', 'png'), {}, 'quality', 'png')).toEqual(false);

    expect(getOptionFallback(getOptionProperty(qualityAsObject, 'effort', 'webp', false), {}, 'effort', 'webp', false)).toEqual(false);
    expect(getOptionFallback(getOptionProperty(qualityAsObject, 'effort', 'avif', false), {}, 'effort', 'avif', false)).toEqual(false);
    expect(getOptionFallback(getOptionProperty(qualityAsObject, 'effort', 'jpg', false), {}, 'effort', 'jpg', false)).toEqual(false);
    expect(getOptionFallback(getOptionProperty(qualityAsObject, 'effort', 'png', false), {}, 'effort', 'png', false)).toEqual(false);
});
