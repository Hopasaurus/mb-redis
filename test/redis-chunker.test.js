const {describe, it} = require('mocha');
const assert = require('assert');

const {Chunker} = require('../src/redis-chunker');

describe('redis-chunker', function () {
    it('can be built', function () {
        new Chunker();
    });

    it('accepts buffers as message parts', function () {
        const testData = Buffer.from("test data");
        const chunker = new Chunker();
        chunker.data(testData);
    });

    it('calls callback with string', function () {
        const testData = Buffer.from('+test\r\n');
        const callbackData = [];
        const callback = chunk => callbackData.push(chunk);
        const chunker = new Chunker(callback);
        chunker.data(testData);
        assert.deepEqual(callbackData, [Buffer.from('+test\r\n')]);
    });

    it('does not call callback with partial string', function () {
        const testData = Buffer.from('+test\r');
        const callbackData = [];
        const callback = chunk => callbackData.push(chunk);
        const chunker = new Chunker(callback);
        chunker.data(testData);
        assert.equal(callbackData.length, 0);
    });

    it('calls callback with string spread across multiple data calls', function () {
        const callbackData = [];
        const callback = chunk => callbackData.push(chunk);
        const chunker = new Chunker(callback);
        chunker.data(Buffer.from('+test\r'));
        chunker.data(Buffer.from('\n'));
        assert.deepEqual(callbackData, [Buffer.from('+test\r\n')]);
    });

    it('calls callback multiple times for multiple strings', function () {
        const callbackData = [];
        const callback = chunk => callbackData.push(chunk);
        const chunker = new Chunker(callback);
        chunker.data(Buffer.from('+test\r\n'));
        chunker.data(Buffer.from('+test2\r\n'));
        assert.deepEqual(callbackData, [Buffer.from('+test\r\n'), Buffer.from('+test2\r\n')]);
    });

    it('calls callback multiple times for multiple strings sent in a single chunk', function () {
        const callbackData = [];
        const callback = chunk => callbackData.push(chunk);
        const chunker = new Chunker(callback);
        chunker.data(Buffer.from('+test\r\n+test2\r\n'));
        assert.deepEqual(callbackData, [Buffer.from('+test\r\n'), Buffer.from('+test2\r\n')]);
    });

    it('calls callback for null string (bulk string)', function () {
        const callbackData = [];
        const callback = chunk => callbackData.push(chunk);
        const chunker = new Chunker(callback);
        chunker.data(Buffer.from('$-1\r\n'));
        assert.deepEqual(callbackData, [Buffer.from('$-1\r\n')]);
    });

    it('calls callback for empty bulk string', function () {
        const callbackData = [];
        const callback = chunk => callbackData.push(chunk);
        const chunker = new Chunker(callback);
        chunker.data(Buffer.from('$0\r\n\r\n'));
        assert.deepEqual(callbackData, [Buffer.from('$0\r\n\r\n')]);
    });

    it('calls callback with an error type message', function () {
        const testData = Buffer.from('-test\r\n');
        const callbackData = [];
        const callback = chunk => callbackData.push(chunk);
        const chunker = new Chunker(callback);
        chunker.data(testData);
        assert.deepEqual(callbackData, [Buffer.from('-test\r\n')]);
    });

    it('calls callback with an integer type message', function () {
        const testData = Buffer.from(':1234\r\n');
        const callbackData = [];
        const callback = chunk => callbackData.push(chunk);
        const chunker = new Chunker(callback);
        chunker.data(testData);
        assert.deepEqual(callbackData, [Buffer.from(':1234\r\n')]);
    });

    it('calls callback with a null array', function () {
        const testData = Buffer.from('*-1\r\n');
        const callbackData = [];
        const callback = chunk => callbackData.push(chunk);
        const chunker = new Chunker(callback);
        chunker.data(testData);
        assert.deepEqual(callbackData, [Buffer.from('*-1\r\n')]);
    });

    it('calls callback with an empty array', function () {
        const testData = Buffer.from('*0\r\n');
        const callbackData = [];
        const callback = chunk => callbackData.push(chunk);
        const chunker = new Chunker(callback);
        chunker.data(testData);
        assert.deepEqual(callbackData, [Buffer.from('*0\r\n')]);
    });

    it('calls callback with an array with a single string', function () {
        const testData = Buffer.from('*1\r\n+foo\r\n');
        const callbackData = [];
        const callback = chunk => callbackData.push(chunk);
        const chunker = new Chunker(callback);
        chunker.data(testData);
        assert.deepEqual(callbackData, [Buffer.from('*1\r\n+foo\r\n')]);
    });

    it('calls callback with an array with a single string spread over two messages', function () {
        const testData = Buffer.from('*1\r\n');
        const testData2 = Buffer.from('+foo\r\n');
        const callbackData = [];
        const callback = chunk => callbackData.push(chunk);
        const chunker = new Chunker(callback);
        chunker.data(testData);
        chunker.data(testData2);
        assert.deepEqual(callbackData, [Buffer.from('*1\r\n+foo\r\n')]);
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
        const testData = Buffer.from(arrayWithArrayEmbedded);
        const callbackData = [];
        const callback = chunk => callbackData.push(chunk);
        const chunker = new Chunker(callback);
        chunker.data(testData);
        assert.deepEqual(callbackData, [Buffer.from(arrayWithArrayEmbedded)]);
    });

});