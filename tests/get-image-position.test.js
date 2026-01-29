import getImagePosition from '../gulp/util/get-image-position.js';

test('getImagePosition', () => {
    const size = { width: 1000, height: 500, cropWidth: 400, cropHeight: 400, crop: true };

    expect(getImagePosition(size, { position: [0, 0] })).toEqual({
        resize: {
            width: 1000,
            height: 500,
        },
        extract: {
            left: 0,
            top: 0,
            width: 400,
            height: 400,
        },
    });

    expect(getImagePosition(size, { position: [1, 1] })).toEqual({
        resize: {
            width: 1000,
            height: 500,
        },
        extract: {
            left: 600,
            top: 100,
            width: 400,
            height: 400,
        },
    });

    expect(getImagePosition(size, { position: [0.5, 0.5] })).toEqual({
        resize: {
            width: 1000,
            height: 500,
        },
        extract: {
            left: 300,
            top: 50,
            width: 400,
            height: 400,
        },
    });
});
