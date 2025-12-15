/**
 * Example: Using protobuf-rslux with a simple Person message
 * 
 * This demonstrates the complete API compatible with protobuf.js
 */

const {
  Message,
  Reader,
  Writer,
  WIRE_TYPE_VARINT,
  WIRE_TYPE_LENGTH_DELIMITED,
} = require('./message.js');

// Define a Person message (equivalent to .proto):
// message Person {
//   int32 id = 1;
//   string name = 2;
//   string email = 3;
//   repeated string phones = 4;
// }
class Person extends Message {
  constructor(properties) {
    super(properties);
    this.id = properties?.id || 0;
    this.name = properties?.name || '';
    this.email = properties?.email || '';
    this.phones = properties?.phones || [];
  }

  static encode(message, writer) {
    if (!writer) writer = new Writer();
    
    if (message.id !== 0) {
      writer.writeTag(1, WIRE_TYPE_VARINT);
      writer.writeVarint32(message.id);
    }
    
    if (message.name !== '') {
      writer.writeTag(2, WIRE_TYPE_LENGTH_DELIMITED);
      writer.writeString(message.name);
    }
    
    if (message.email !== '') {
      writer.writeTag(3, WIRE_TYPE_LENGTH_DELIMITED);
      writer.writeString(message.email);
    }
    
    // Repeated field
    if (message.phones && message.phones.length) {
      for (const phone of message.phones) {
        writer.writeTag(4, WIRE_TYPE_LENGTH_DELIMITED);
        writer.writeString(phone);
      }
    }
    
    return writer;
  }

  static decode(reader) {
    if (!(reader instanceof Reader)) {
      reader = new Reader(Buffer.from(reader));
    }
    
    const message = new Person();
    
    while (reader.hasMore()) {
      const tag = reader.readVarint32();
      const fieldNumber = tag >>> 3;
      const wireType = tag & 0x7;
      
      switch (fieldNumber) {
        case 1:
          message.id = reader.readVarint32();
          break;
        case 2:
          message.name = reader.readString();
          break;
        case 3:
          message.email = reader.readString();
          break;
        case 4:
          if (!message.phones) message.phones = [];
          message.phones.push(reader.readString());
          break;
        default:
          reader.skipType(wireType);
          break;
      }
    }
    
    return message;
  }

  static verify(message) {
    if (typeof message.id !== 'number') return 'id: number expected';
    if (typeof message.name !== 'string') return 'name: string expected';
    if (typeof message.email !== 'string') return 'email: string expected';
    if (!Array.isArray(message.phones)) return 'phones: array expected';
    for (const phone of message.phones) {
      if (typeof phone !== 'string') return 'phones: string[] expected';
    }
    return null;
  }

  static toObject(message, options) {
    return {
      id: message.id,
      name: message.name,
      email: message.email,
      phones: message.phones,
    };
  }
}

console.log('📦 protobuf-rslux Example: Person Message');
console.log('='.repeat(50));
console.log('');

// Create a person
const person = Person.create({
  id: 1001,
  name: 'John Doe',
  email: 'john.doe@example.com',
  phones: ['+1-555-1234', '+1-555-5678'],
});

console.log('1️⃣  Created Person:');
console.log(JSON.stringify(person.toJSON(), null, 2));
console.log('');

// Encode to binary
const writer = Person.encode(person);
const encoded = writer.finish();

console.log('2️⃣  Encoded to binary:');
console.log('   Buffer length:', encoded.length, 'bytes');
console.log('   Buffer (hex):', encoded.toString('hex'));
console.log('');

// Decode from binary
const decoded = Person.decode(encoded);

console.log('3️⃣  Decoded Person:');
console.log(JSON.stringify(decoded.toJSON(), null, 2));
console.log('');

// Verify the decoded message
const error = Person.verify(decoded);
console.log('4️⃣  Verification:', error === null ? '✅ Valid' : `❌ ${error}`);
console.log('');

// Test with length-delimited encoding
const writerDelimited = Person.encodeDelimited(person);
const encodedDelimited = writerDelimited.finish();

console.log('5️⃣  Length-delimited encoding:');
console.log('   Buffer length:', encodedDelimited.length, 'bytes');
console.log('   Buffer (hex):', encodedDelimited.toString('hex'));
console.log('');

const decodedDelimited = Person.decodeDelimited(encodedDelimited);
console.log('6️⃣  Decoded (length-delimited):');
console.log(JSON.stringify(decodedDelimited.toJSON(), null, 2));
console.log('');

// Test roundtrip
const matches = 
  person.id === decoded.id &&
  person.name === decoded.name &&
  person.email === decoded.email &&
  JSON.stringify(person.phones) === JSON.stringify(decoded.phones);

console.log('7️⃣  Roundtrip test:', matches ? '✅ Success' : '❌ Failed');
console.log('');

// Performance test
console.log('8️⃣  Performance test (10,000 encode/decode cycles):');
const start = Date.now();
for (let i = 0; i < 10000; i++) {
  const w = Person.encode(person);
  const buf = w.finish();
  Person.decode(buf);
}
const elapsed = Date.now() - start;
console.log('   Time:', elapsed, 'ms');
console.log('   Throughput:', Math.round(10000 / elapsed * 1000), 'ops/sec');
console.log('');

console.log('🎉 Example completed successfully!');
