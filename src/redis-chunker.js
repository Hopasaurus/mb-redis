// just enough redis parsing to split stream of incoming data into separate messages

const BULK_STRING_NULL_PAD = 3;
const BULK_STRING_PAD = 4;
const BULK_STRING_TYPE_INDICATOR = '$';

const ARRAY_TYPE_INDICATOR = '*';
const ERROR_TYPE_INDICATOR = '-';
const INTEGER_TYPE_INDICATOR = ':';
const STRING_TYPE_INDICATOR = '+';

class Chunker {
    constructor(callback = () => {
    }) {
        this.callback = callback;
        this.buffer = Buffer.alloc(0);
    }

    data(input) {
        this.buffer = Buffer.concat([this.buffer, input]);
        this.processBuffer();
    }

    processBuffer() {
        const processedMessage = Chunker.processByType(this.buffer);

        if (processedMessage) {
            this.buffer = this.buffer.slice(processedMessage.length);
            this.callback(processedMessage);
            this.processBuffer();
        }
    }

    static processByType(buffer) {
        const messageType = buffer.toString('utf8', 0, 1);

        switch (messageType) {
            case ARRAY_TYPE_INDICATOR:
                return Chunker.processArray(buffer);
            case BULK_STRING_TYPE_INDICATOR:
                return Chunker.processBulkString(buffer);
            case STRING_TYPE_INDICATOR:
            case ERROR_TYPE_INDICATOR:
            case INTEGER_TYPE_INDICATOR:
                return Chunker.processStringLikeThings(buffer);
        }
    }

    static processArray(buffer) {
        if (buffer.includes('\r\n')) {
            const endOfLength = buffer.indexOf('\r\n', 0, 'utf8') + 2;
            const itemCount = parseInt(buffer.toString('utf8', 1, endOfLength));

            if (itemCount < 1) {
                return buffer;
            }

            const captured = this.captureArrayElements(itemCount, buffer.slice(endOfLength));
            if (captured) {
                return Buffer.concat([
                    Buffer.from(`*${itemCount}\r\n`),
                    captured
                ]);
            }
        }
    }

    static captureArrayElements(itemCount, buffer) {
        if (itemCount > 0) {
            const nextElement = Chunker.processByType(buffer);

            if (nextElement) {
                return Buffer.concat([nextElement, Chunker.captureArrayElements(itemCount - 1, buffer.slice(nextElement.length))]);
            }
            return undefined;
        }
        return Buffer.alloc(0);
    }

    static processBulkString(buffer) {
        if (buffer.includes('\r\n')) {
            const endOfLength = buffer.indexOf("\r\n", 0, 'utf8');
            const length = parseInt(buffer.toString('utf8', 1, endOfLength));

            const lastChar = length + endOfLength + (length === -1 ? BULK_STRING_NULL_PAD : BULK_STRING_PAD);

            if (buffer.length >= lastChar) {
                return buffer.slice(0, lastChar);
            }
        }
    }

    static processStringLikeThings(buffer) {
        if (buffer.includes('\r\n')) {
            const end = buffer.indexOf('\r\n', 0, 'utf8') + 2;
            return buffer.slice(0, end);
        }
    }
}

module.exports = {Chunker};
