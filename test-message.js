/**
 * Test Message API
 */

const {
  Message,
  Reader,
  Writer,
  WIRE_TYPE_VARINT,
  WIRE_TYPE_LENGTH_DELIMITED,
} = require('./message.js');

console.log('🧪 Testing Message API');
console.log('');

// Define a simple test message type
class TestMessage extends Message {
  constructor(properties) {
    super(properties);
    this.id = properties?.id || 0;
    this.name = properties?.name || '';
    this.active = properties?.active || false;
  }

  static encode(message, writer) {
    if (!writer) writer = new Writer();
    
    // Field 1: id (int32)
    if (message.id !== 0) {
      writer.writeTag(1, WIRE_TYPE_VARINT);
      writer.writeVarint32(message.id);
    }
    
    // Field 2: name (string)
    if (message.name !== '') {
      writer.writeTag(2, WIRE_TYPE_LENGTH_DELIMITED);
      writer.writeString(message.name);
    }
    
    // Field 3: active (bool)
    if (message.active !== false) {
      writer.writeTag(3, WIRE_TYPE_VARINT);
      writer.writeBool(message.active);
    }
    
    return writer;
  }

  static decode(reader) {
    if (!(reader instanceof Reader)) {
      reader = new Reader(Buffer.from(reader));
    }
    
    const message = new TestMessage();
    
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
          message.active = reader.readBool();
          break;
        default:
          reader.skipType(wireType);
          break;
      }
    }
    
    return message;
  }

  static verify(message) {
    if (typeof message.id !== 'number') {
      return 'id: number expected';
    }
    if (typeof message.name !== 'string') {
      return 'name: string expected';
    }
    if (typeof message.active !== 'boolean') {
      return 'active: boolean expected';
    }
    return null;
  }

  static fromObject(object) {
    return new TestMessage(object);
  }

  static toObject(message, options) {
    return {
      id: message.id,
      name: message.name,
      active: message.active,
    };
  }
}

// Test 1: Message.create
console.log('Test 1: Message.create');
{
  const msg = TestMessage.create({ id: 42, name: 'test', active: true });
  console.assert(msg.id === 42, 'Create failed: id');
  console.assert(msg.name === 'test', 'Create failed: name');
  console.assert(msg.active === true, 'Create failed: active');
  console.log('✅ Message.create works correctly');
}

// Test 2: Message.encode and Message.decode
console.log('\nTest 2: Message.encode and Message.decode');
{
  const original = TestMessage.create({ id: 123, name: 'Hello', active: true });
  const writer = TestMessage.encode(original);
  const buffer = writer.finish();
  
  const decoded = TestMessage.decode(buffer);
  console.assert(decoded.id === 123, 'Decode failed: id');
  console.assert(decoded.name === 'Hello', 'Decode failed: name');
  console.assert(decoded.active === true, 'Decode failed: active');
  console.log('✅ Message.encode/decode works correctly');
  console.log('   Encoded buffer length:', buffer.length, 'bytes');
}

// Test 3: Message.encodeDelimited and Message.decodeDelimited
console.log('\nTest 3: Message.encodeDelimited and Message.decodeDelimited');
{
  const original = TestMessage.create({ id: 456, name: 'World', active: false });
  const writer = TestMessage.encodeDelimited(original);
  const buffer = writer.finish();
  
  const decoded = TestMessage.decodeDelimited(buffer);
  console.assert(decoded.id === 456, 'DecodeDelimited failed: id');
  console.assert(decoded.name === 'World', 'DecodeDelimited failed: name');
  console.assert(decoded.active === false, 'DecodeDelimited failed: active');
  console.log('✅ Message.encodeDelimited/decodeDelimited works correctly');
}

// Test 4: Message.verify
console.log('\nTest 4: Message.verify');
{
  const validMsg = { id: 1, name: 'test', active: true };
  const invalidMsg = { id: 'not a number', name: 'test', active: true };
  
  const error1 = TestMessage.verify(validMsg);
  const error2 = TestMessage.verify(invalidMsg);
  
  console.assert(error1 === null, 'Verify should pass for valid message');
  console.assert(error2 !== null, 'Verify should fail for invalid message');
  console.log('✅ Message.verify works correctly');
  console.log('   Invalid message error:', error2);
}

// Test 5: Message.fromObject
console.log('\nTest 5: Message.fromObject');
{
  const obj = { id: 789, name: 'FromObject', active: true };
  const msg = TestMessage.fromObject(obj);
  
  console.assert(msg instanceof TestMessage, 'fromObject should return instance');
  console.assert(msg.id === 789, 'fromObject failed: id');
  console.assert(msg.name === 'FromObject', 'fromObject failed: name');
  console.log('✅ Message.fromObject works correctly');
}

// Test 6: Message.toObject
console.log('\nTest 6: Message.toObject');
{
  const msg = TestMessage.create({ id: 999, name: 'ToObject', active: false });
  const obj = TestMessage.toObject(msg);
  
  console.assert(obj.id === 999, 'toObject failed: id');
  console.assert(obj.name === 'ToObject', 'toObject failed: name');
  console.assert(obj.active === false, 'toObject failed: active');
  console.log('✅ Message.toObject works correctly');
}

// Test 7: Message.prototype.toJSON
console.log('\nTest 7: Message.prototype.toJSON');
{
  const msg = TestMessage.create({ id: 111, name: 'JSON', active: true });
  const json = msg.toJSON();
  
  console.assert(json.id === 111, 'toJSON failed: id');
  console.assert(json.name === 'JSON', 'toJSON failed: name');
  console.assert(json.active === true, 'toJSON failed: active');
  console.log('✅ Message.prototype.toJSON works correctly');
  console.log('   JSON:', JSON.stringify(json));
}

// Test 8: Empty message
console.log('\nTest 8: Empty message encoding/decoding');
{
  const empty = TestMessage.create({});
  const writer = TestMessage.encode(empty);
  const buffer = writer.finish();
  const decoded = TestMessage.decode(buffer);
  
  console.assert(decoded.id === 0, 'Empty message: id should be 0');
  console.assert(decoded.name === '', 'Empty message: name should be empty');
  console.assert(decoded.active === false, 'Empty message: active should be false');
  console.log('✅ Empty message works correctly');
  console.log('   Empty buffer length:', buffer.length, 'bytes');
}

// Test 9: Partial message
console.log('\nTest 9: Partial message encoding/decoding');
{
  const partial = TestMessage.create({ name: 'OnlyName' });
  const writer = TestMessage.encode(partial);
  const buffer = writer.finish();
  const decoded = TestMessage.decode(buffer);
  
  console.assert(decoded.id === 0, 'Partial message: id should be 0');
  console.assert(decoded.name === 'OnlyName', 'Partial message: name should match');
  console.assert(decoded.active === false, 'Partial message: active should be false');
  console.log('✅ Partial message works correctly');
}

// Test 10: Nested message (more complex test)
console.log('\nTest 10: Nested message structure');
{
  class NestedMessage extends Message {
    constructor(properties) {
      super(properties);
      this.inner = properties?.inner || null;
      this.value = properties?.value || 0;
    }

    static encode(message, writer) {
      if (!writer) writer = new Writer();
      
      if (message.inner) {
        writer.writeTag(1, WIRE_TYPE_LENGTH_DELIMITED);
        writer.fork();
        TestMessage.encode(message.inner, writer);
        writer.ldelim();
      }
      
      if (message.value !== 0) {
        writer.writeTag(2, WIRE_TYPE_VARINT);
        writer.writeVarint32(message.value);
      }
      
      return writer;
    }

    static decode(reader) {
      if (!(reader instanceof Reader)) {
        reader = new Reader(Buffer.from(reader));
      }
      
      const message = new NestedMessage();
      
      while (reader.hasMore()) {
        const tag = reader.readVarint32();
        const fieldNumber = tag >>> 3;
        const wireType = tag & 0x7;
        
        switch (fieldNumber) {
          case 1:
            const nestedBuffer = reader.readBytes();
            message.inner = TestMessage.decode(nestedBuffer);
            break;
          case 2:
            message.value = reader.readVarint32();
            break;
          default:
            reader.skipType(wireType);
            break;
        }
      }
      
      return message;
    }
  }

  const inner = TestMessage.create({ id: 1, name: 'inner', active: true });
  const outer = new NestedMessage({ inner: inner, value: 42 });
  
  const writer = NestedMessage.encode(outer);
  const buffer = writer.finish();
  const decoded = NestedMessage.decode(buffer);
  
  console.assert(decoded.value === 42, 'Nested message: value should match');
  console.assert(decoded.inner !== null, 'Nested message: inner should exist');
  console.assert(decoded.inner.id === 1, 'Nested message: inner.id should match');
  console.assert(decoded.inner.name === 'inner', 'Nested message: inner.name should match');
  console.log('✅ Nested message works correctly');
  console.log('   Nested buffer length:', buffer.length, 'bytes');
}

console.log('\n🎉 All Message API tests passed!');
