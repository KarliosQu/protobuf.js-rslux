/**
 * Message API layer compatible with protobuf.js
 * This provides a high-level API on top of the Rust Reader/Writer
 */

const {
  Reader,
  Writer,
  WIRE_TYPE_VARINT,
  WIRE_TYPE_FIXED32,
  WIRE_TYPE_FIXED64,
  WIRE_TYPE_LENGTH_DELIMITED,
} = require('./index.js');

/**
 * Base Message class
 * This is meant to be extended by generated message classes
 */
class Message {
  constructor(properties) {
    if (properties) {
      for (const key in properties) {
        if (properties.hasOwnProperty(key)) {
          this[key] = properties[key];
        }
      }
    }
  }

  /**
   * Create a new message instance
   * @param {Object} properties - Initial properties
   * @returns {Message} Message instance
   */
  static create(properties) {
    return new this(properties);
  }

  /**
   * Encode a message
   * @param {Message|Object} message - Message to encode
   * @param {Writer} writer - Optional writer to use
   * @returns {Writer} Writer instance
   */
  static encode(message, writer) {
    if (!writer) {
      writer = new Writer();
    }
    
    // This should be overridden by generated classes
    if (this.$type && this.$type.encode) {
      this.$type.encode(message, writer);
    }
    
    return writer;
  }

  /**
   * Encode a message with length prefix
   * @param {Message|Object} message - Message to encode
   * @param {Writer} writer - Optional writer to use
   * @returns {Writer} Writer instance
   */
  static encodeDelimited(message, writer) {
    if (!writer) {
      writer = new Writer();
    }
    
    writer.fork();
    this.encode(message, writer);
    writer.ldelim();
    
    return writer;
  }

  /**
   * Decode a message from buffer
   * @param {Reader|Uint8Array|Buffer} reader - Reader or buffer
   * @returns {Message} Decoded message
   */
  static decode(reader) {
    if (!(reader instanceof Reader)) {
      reader = new Reader(Buffer.from(reader));
    }
    
    // This should be overridden by generated classes
    if (this.$type && this.$type.decode) {
      return this.$type.decode(reader);
    }
    
    return new this();
  }

  /**
   * Decode a length-delimited message
   * @param {Reader|Uint8Array|Buffer} reader - Reader or buffer
   * @returns {Message} Decoded message
   */
  static decodeDelimited(reader) {
    if (!(reader instanceof Reader)) {
      reader = new Reader(Buffer.from(reader));
    }
    
    // Read the length prefix
    const length = reader.readVarint32();
    
    // Read exactly 'length' bytes for the message (without another length prefix)
    const messageBytes = reader.readRawBytes(length);
    
    return this.decode(messageBytes);
  }

  /**
   * Verify a message
   * @param {Object} message - Message to verify
   * @returns {string|null} Error message or null if valid
   */
  static verify(message) {
    // This should be overridden by generated classes
    if (this.$type && this.$type.verify) {
      return this.$type.verify(message);
    }
    
    return null; // No validation by default
  }

  /**
   * Create a message from a plain object
   * @param {Object} object - Plain object
   * @returns {Message} Message instance
   */
  static fromObject(object) {
    // This should be overridden by generated classes
    if (this.$type && this.$type.fromObject) {
      return this.$type.fromObject(object);
    }
    
    return new this(object);
  }

  /**
   * Convert message to plain object
   * @param {Message} message - Message instance
   * @param {Object} options - Conversion options
   * @returns {Object} Plain object
   */
  static toObject(message, options) {
    options = options || {};
    const object = {};
    
    // This should be overridden by generated classes
    if (this.$type && this.$type.toObject) {
      return this.$type.toObject(message, options);
    }
    
    // Default: copy all enumerable properties
    for (const key in message) {
      if (message.hasOwnProperty(key) && !key.startsWith('$')) {
        object[key] = message[key];
      }
    }
    
    return object;
  }

  /**
   * Convert to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return this.constructor.toObject(this, {
      longs: String,
      enums: String,
      bytes: String,
    });
  }
}

/**
 * Field types enum (for reference)
 */
const types = {
  double: 1,
  float: 2,
  int64: 3,
  uint64: 4,
  int32: 5,
  fixed64: 6,
  fixed32: 7,
  bool: 8,
  string: 9,
  group: 10,
  message: 11,
  bytes: 12,
  uint32: 13,
  enum: 14,
  sfixed32: 15,
  sfixed64: 16,
  sint32: 17,
  sint64: 18,
};

/**
 * Helper to create a field encoder
 */
function createFieldEncoder(fieldNumber, wireType, writeFunc) {
  return function(message, writer, value) {
    writer.writeTag(fieldNumber, wireType);
    writeFunc.call(writer, value);
  };
}

/**
 * Helper to create a field decoder
 */
function createFieldDecoder(readFunc) {
  return function(message, reader, field) {
    message[field] = readFunc.call(reader);
  };
}

/**
 * Utility functions
 */

/**
 * Test if a value is an integer
 */
function isInteger(value) {
  return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
}

/**
 * Test if a value is a string
 */
function isString(value) {
  return typeof value === 'string' || value instanceof String;
}

/**
 * Test if a value is a valid protobuf message
 */
function isMessage(value) {
  return value && typeof value === 'object' && typeof value.constructor === 'function';
}

/**
 * Create a basic decoder for a field
 */
function field(fieldNumber, wireType, readMethod) {
  return {
    fieldNumber,
    wireType,
    readMethod,
  };
}

module.exports = {
  Message,
  Reader,
  Writer,
  types,
  WIRE_TYPE_VARINT,
  WIRE_TYPE_FIXED32,
  WIRE_TYPE_FIXED64,
  WIRE_TYPE_LENGTH_DELIMITED,
  createFieldEncoder,
  createFieldDecoder,
  isInteger,
  isString,
  isMessage,
  field,
};
