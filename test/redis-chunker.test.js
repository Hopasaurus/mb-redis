const {describe, it} = require('mocha');
const assert = require('assert');

const {Chunker} = require('../src/redis-chunker');

describe('redis-chunker', function () {
    it('can be built', function () {
        new Chunker();
    });

    it('accepts buffers as message parts', function () {
        const testData = Buffer.from('test data');
        const chunker = new Chunker();
        chunker.data(testData);
    });

    it('calls callback with string', function () {
        const result = processTestData([Buffer.from('+test\r\n')]);
        assert.deepEqual(result, [Buffer.from('+test\r\n')]);
    });

    const processTestData = (data) => {
        const callbackData = [];
        const chunker = new Chunker(chunk => callbackData.push(chunk));
        data.forEach(d => chunker.data(d));
        return callbackData;
    };

    it('does not call callback with partial string', function () {
        const result = processTestData([Buffer.from('+test\r')]);
        assert.equal(result.length, 0);
    });

    it('calls callback with string spread across multiple data calls', function () {
        const result = processTestData([Buffer.from('+test\r'), Buffer.from('\n')]);
        assert.deepEqual(result, [Buffer.from('+test\r\n')]);
    });

    it('calls callback multiple times for multiple strings', function () {
        const result = processTestData([Buffer.from('+test\r\n'), Buffer.from('+test2\r\n')]);
        assert.deepEqual(result, [Buffer.from('+test\r\n'), Buffer.from('+test2\r\n')]);
    });

    it('calls callback multiple times for multiple strings sent in a single chunk', function () {
        const result = processTestData([Buffer.from('+test\r\n+test2\r\n')]);
        assert.deepEqual(result, [Buffer.from('+test\r\n'), Buffer.from('+test2\r\n')]);
    });

    it('calls callback for null string (bulk string)', function () {
        const result = processTestData([Buffer.from('$-1\r\n')]);
        assert.deepEqual(result, [Buffer.from('$-1\r\n')]);
    });

    it('calls callback for empty bulk string', function () {
        const result = processTestData([Buffer.from('$0\r\n\r\n')]);
        assert.deepEqual(result, [Buffer.from('$0\r\n\r\n')]);
    });

    it('calls callback with an error type message', function () {
        const result = processTestData([Buffer.from('-test\r\n')]);
        assert.deepEqual(result, [Buffer.from('-test\r\n')]);
    });

    it('calls callback with an integer type message', function () {
        const result = processTestData([Buffer.from(':1234\r\n')]);
        assert.deepEqual(result, [Buffer.from(':1234\r\n')]);
    });

    it('calls callback with a null array', function () {
        const result = processTestData([Buffer.from('*-1\r\n')]);
        assert.deepEqual(result, [Buffer.from('*-1\r\n')]);
    });

    it('calls callback with an empty array', function () {
        const result = processTestData([Buffer.from('*0\r\n')]);
        assert.deepEqual(result, [Buffer.from('*0\r\n')]);
    });

    it('calls callback with an array with a single string', function () {
        const result = processTestData([Buffer.from('*1\r\n+foo\r\n')]);
        assert.deepEqual(result, [Buffer.from('*1\r\n+foo\r\n')]);
    });

    it('calls callback with an array with a single string spread over two messages', function () {
        const result = processTestData([Buffer.from('*1\r\n+foo\r\n')]);
        assert.deepEqual(result, [Buffer.from('*1\r\n+foo\r\n')]);
    });

    it('calls callback with an array with embedded array', function () {
        const arrayWithArrayEmbedded = '*2\r\n' +
            '*3\r\n' +
            ':1\r\n' +
            ':2\r\n' +
            ':3\r\n' +
            '*2\r\n' +
            '+Foo\r\n' +
            '-Bar\r\n';
        const result = processTestData([Buffer.from(arrayWithArrayEmbedded)]);
        assert.deepEqual(result, [Buffer.from(arrayWithArrayEmbedded)]);
    });
});
