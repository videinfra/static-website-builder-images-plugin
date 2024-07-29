const getImageSize = require('../gulp/util/get-image-size');

test('getImageSize scale down using multiplier', () => {
    const size = getImageSize({ width: 1000, height: 500 }, { multiplier: 0.5 });

    expect(size).toEqual({
        width: 500,
        height: 250,
        cropWidth: 500,
        cropHeight: 250,
        crop: false,
    });
});

test('getImageSize multiplier must be in range of 0 to 1, excluding', () => {
    const sizeLarger = getImageSize({ width: 1000, height: 500 }, { multiplier: 2 });
    const sizeSmaller = getImageSize({ width: 1000, height: 500 }, { multiplier: 0 });

    expect(sizeLarger).toEqual({
        width: 1000,
        height: 500,
        cropWidth: 1000,
        cropHeight: 500,
        crop: false,
    });
    expect(sizeSmaller).toEqual(null);
});

test('getImageSize resize using width', () => {
    const sizeUsingWidthInvalid = getImageSize({ width: 1000, height: 500 }, { width: -500 });
    const sizeUsingWidthSmaller = getImageSize({ width: 1000, height: 500 }, { width: 500 });
    const sizeUsingHeightLarger = getImageSize({ width: 1000, height: 500 }, { width: 2000 });

    expect(sizeUsingWidthInvalid).toEqual(null);

    expect(sizeUsingWidthSmaller).toEqual({
        width: 500,
        height: 250,
        cropWidth: 500,
        cropHeight: 250,
        crop: false,
    });

    expect(sizeUsingHeightLarger).toEqual({
        width: 1000,
        height: 500,
        cropWidth: 1000,
        cropHeight: 500,
        crop: false,
    });
});

test('getImageSize resize using height', () => {
    const sizeUsingHeightInvalid = getImageSize({ width: 1000, height: 500 }, { height: -250 });
    const sizeUsingHeightSmaller = getImageSize({ width: 1000, height: 500 }, { height: 250 });
    const sizeUsingHeightLarger = getImageSize({ width: 1000, height: 500 }, { height: 1000 });

    expect(sizeUsingHeightInvalid).toEqual(null);

    expect(sizeUsingHeightSmaller).toEqual({
        width: 500,
        height: 250,
        cropWidth: 500,
        cropHeight: 250,
        crop: false,
    });

    expect(sizeUsingHeightLarger).toEqual({
        width: 1000,
        height: 500,
        cropWidth: 1000,
        cropHeight: 500,
        crop: false,
    });
});

test('getImageSize resize using width and height', () => {
    const sizeKeepRatio = getImageSize({ width: 1000, height: 500 }, { width: 500, height: 250 });
    const sizeChangeRatio = getImageSize({ width: 1000, height: 500 }, { width: 500, height: 500 });
    const sizeChangeRatioDownSize = getImageSize({ width: 1000, height: 500 }, { width: 400, height: 300 });
    const sizeChangeRatioDownSizeOverflow = getImageSize({ width: 1000, height: 500 }, { width: 350, height: 700 });

    expect(sizeKeepRatio).toEqual({
        width: 500,
        height: 250,
        cropWidth: 500,
        cropHeight: 250,
        crop: false,
    });
    expect(sizeChangeRatio).toEqual({
        width: 1000,
        height: 500,
        cropWidth: 500,
        cropHeight: 500,
        crop: true,
    });
    expect(sizeChangeRatioDownSize).toEqual({
        width: 600,
        height: 300,
        cropWidth: 400,
        cropHeight: 300,
        crop: true,
    });
    expect(sizeChangeRatioDownSizeOverflow).toEqual({
        width: 1000,
        height: 500,
        cropWidth: 250,
        cropHeight: 500,
        crop: true,
    });
});

test('getImageSize size using min/max', () => {
    const sizeHeight = getImageSize({ width: 1000, height: 500 }, { height: 250, minWidth: 600 });
    const sizeWidth = getImageSize({ width: 1000, height: 500 }, { width: 250, minHeight: 300 });
    const sizeMaxWidthMinHeight = getImageSize({ width: 1000, height: 500 }, { maxWidth: 250, minHeight: 300 });

    expect(sizeHeight).toEqual({
        width: 600,
        height: 300,
        cropWidth: 600,
        cropHeight: 250,
        crop: true,
    });

    expect(sizeWidth).toEqual({
        width: 600,
        height: 300,
        cropWidth: 250,
        cropHeight: 300,
        crop: true,
    });

    expect(sizeMaxWidthMinHeight).toEqual({
        width: 600,
        height: 300,
        cropWidth: 250,
        cropHeight: 300,
        crop: true,
    });
});

test('getImageSize size round down', () => {
    const size = getImageSize({ width: 1000, height: 333 }, { height: 200 });

    expect(size).toEqual({
        width: 600,
        height: 200,
        cropWidth: 600,
        cropHeight: 200,
        crop: false,
    });
});

test('getImageSize skip crop if ratio is similar', () => {
    const size = getImageSize({ width: 10000, height: 3333 }, { width: 8000, height: 2666.399 });
    
    expect(size).toEqual({
        width: 8000,
        height: 2666,
        cropWidth: 8000,
        cropHeight: 2666,
        crop: false,
    });
});