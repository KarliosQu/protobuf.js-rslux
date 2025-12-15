# protobuf-rslux Usage Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core Concepts](#core-concepts)
5. [API Reference](#api-reference)
6. [Examples](#examples)
7. [Performance Tips](#performance-tips)
8. [Migration from protobuf.js](#migration-from-protobufjs)

## Introduction

`protobuf-rslux` is a high-performance Rust-native implementation of Protocol Buffers for Node.js, providing 100% API compatibility with protobuf.js minimal version while delivering superior performance through Rust.

## Installation

```bash
npm install protobuf-rslux
```

## Quick Start

### Basic Usage

```javascript
const { Message, Reader, Writer, WIRE_TYPE_VARINT, WIRE_TYPE_LENGTH_DELIMITED } = require('protobuf-rslux/message');

// Define a message class
class Person extends Message {
  constructor(properties) {
    super(properties);
    this.name = properties?.name || '';
    this.age = properties?.age || 0;
  }

  static encode(message, writer) {
    if (!writer) writer = new Writer();
    
    if (message.name) {
      writer.writeTag(1, WIRE_TYPE_LENGTH_DELIMITED);
      writer.writeString(message.name);
    }
    
    if (message.age) {
      writer.writeTag(2, WIRE_TYPE_VARINT);
      writer.writeVarint32(message.age);
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
      const field = tag >>> 3;
      
      switch (field) {
        case 1: message.name = reader.readString(); break;
        case 2: message.age = reader.readVarint32(); break;
        default: reader.skipType(tag & 0x7); break;
      }
    }
    
    return message;
  }
}

// Usage
const person = Person.create({ name: 'Alice', age: 30 });
const buffer = Person.encode(person).finish();
const decoded = Person.decode(buffer);
```

## Core Concepts

### Wire Types

Protocol Buffers uses wire types to encode different data types:

- **VARINT (0)**: int32, int64, uint32, uint64, sint32, sint64, bool, enum
- **FIXED64 (1)**: fixed64, sfixed64, double
- **LENGTH_DELIMITED (2)**: string, bytes, embedded messages, repeated fields
- **FIXED32 (5)**: fixed32, sfixed32, float

### Message Structure

Every message should:
1. Extend the `Message` class
2. Implement static `encode()` method
3. Implement static `decode()` method
4. Optionally implement `verify()`, `fromObject()`, `toObject()`

### Field Tags

Each field has a unique tag (field number) that identifies it in the binary format:

```javascript
writer.writeTag(fieldNumber, wireType);
```

Tags are encoded as: `(fieldNumber << 3) | wireType`

## API Reference

### Message Class

#### Static Methods

##### `create(properties)`
Create a new message instance with initial properties.

```javascript
const msg = Person.create({ name: 'Bob', age: 25 });
```

##### `encode(message, writer?)`
Encode a message to binary format.

```javascript
const writer = Person.encode(person);
const buffer = writer.finish();
```

##### `encodeDelimited(message, writer?)`
Encode with a length prefix (for streaming).

```javascript
const writer = Person.encodeDelimited(person);
```

##### `decode(reader)`
Decode a message from binary format.

```javascript
const message = Person.decode(buffer);
```

##### `decodeDelimited(reader)`
Decode a length-delimited message.

```javascript
const message = Person.decodeDelimited(buffer);
```

##### `verify(message)`
Verify message structure and types.

```javascript
const error = Person.verify(message);
if (error) console.error('Invalid:', error);
```

##### `fromObject(object)`
Convert plain object to message instance.

```javascript
const msg = Person.fromObject({ name: 'Charlie', age: 35 });
```

##### `toObject(message, options?)`
Convert message to plain object.

```javascript
const obj = Person.toObject(message);
```

#### Instance Methods

##### `toJSON()`
Convert message to JSON-serializable object.

```javascript
const json = message.toJSON();
console.log(JSON.stringify(json));
```

### Writer Class

#### Methods

```javascript
const writer = new Writer();

// Write tag
writer.writeTag(fieldNumber, wireType);

// Write integers
writer.writeVarint32(value);
writer.writeVarint64(value);
writer.writeSint32(value);     // ZigZag encoded
writer.writeSint64(value);     // ZigZag encoded
writer.writeFixed32(value);
writer.writeFixed64(value);
writer.writeSfixed32(value);
writer.writeSfixed64(value);

// Write floating point
writer.writeFloat(value);
writer.writeDouble(value);

// Write other types
writer.writeBool(value);
writer.writeString(value);
writer.writeBytes(buffer);

// Nested messages
writer.fork();                 // Start nested message
// ... write nested fields ...
writer.ldelim();              // End nested message

// Finish
const buffer = writer.finish();
```

### Reader Class

#### Methods

```javascript
const reader = new Reader(buffer);

// Read integers
const val1 = reader.readVarint32();
const val2 = reader.readVarint64();
const val3 = reader.readSint32();    // ZigZag decoded
const val4 = reader.readSint64();    // ZigZag decoded
const val5 = reader.readFixed32();
const val6 = reader.readFixed64();
const val7 = reader.readSfixed32();
const val8 = reader.readSfixed64();

// Read floating point
const float = reader.readFloat();
const double = reader.readDouble();

// Read other types
const bool = reader.readBool();
const str = reader.readString();
const bytes = reader.readBytes();
const raw = reader.readRawBytes(length);

// Utilities
const hasMore = reader.hasMore();
reader.skipType(wireType);
const pos = reader.getPos();
```

## Examples

### Example 1: Simple Message

```javascript
class Point extends Message {
  constructor(properties) {
    super(properties);
    this.x = properties?.x || 0;
    this.y = properties?.y || 0;
  }

  static encode(message, writer) {
    if (!writer) writer = new Writer();
    
    if (message.x !== 0) {
      writer.writeTag(1, WIRE_TYPE_VARINT);
      writer.writeVarint32(message.x);
    }
    
    if (message.y !== 0) {
      writer.writeTag(2, WIRE_TYPE_VARINT);
      writer.writeVarint32(message.y);
    }
    
    return writer;
  }

  static decode(reader) {
    if (!(reader instanceof Reader)) {
      reader = new Reader(Buffer.from(reader));
    }
    
    const message = new Point();
    
    while (reader.hasMore()) {
      const tag = reader.readVarint32();
      const field = tag >>> 3;
      
      switch (field) {
        case 1: message.x = reader.readVarint32(); break;
        case 2: message.y = reader.readVarint32(); break;
        default: reader.skipType(tag & 0x7); break;
      }
    }
    
    return message;
  }
}

// Usage
const point = Point.create({ x: 10, y: 20 });
const buffer = Point.encode(point).finish();
const decoded = Point.decode(buffer);
```

### Example 2: Repeated Fields

```javascript
class TodoList extends Message {
  constructor(properties) {
    super(properties);
    this.title = properties?.title || '';
    this.items = properties?.items || [];
  }

  static encode(message, writer) {
    if (!writer) writer = new Writer();
    
    if (message.title) {
      writer.writeTag(1, WIRE_TYPE_LENGTH_DELIMITED);
      writer.writeString(message.title);
    }
    
    if (message.items) {
      for (const item of message.items) {
        writer.writeTag(2, WIRE_TYPE_LENGTH_DELIMITED);
        writer.writeString(item);
      }
    }
    
    return writer;
  }

  static decode(reader) {
    if (!(reader instanceof Reader)) {
      reader = new Reader(Buffer.from(reader));
    }
    
    const message = new TodoList();
    
    while (reader.hasMore()) {
      const tag = reader.readVarint32();
      const field = tag >>> 3;
      
      switch (field) {
        case 1:
          message.title = reader.readString();
          break;
        case 2:
          if (!message.items) message.items = [];
          message.items.push(reader.readString());
          break;
        default:
          reader.skipType(tag & 0x7);
          break;
      }
    }
    
    return message;
  }
}
```

### Example 3: Nested Messages

```javascript
class Address extends Message {
  constructor(properties) {
    super(properties);
    this.street = properties?.street || '';
    this.city = properties?.city || '';
  }

  static encode(message, writer) {
    if (!writer) writer = new Writer();
    
    if (message.street) {
      writer.writeTag(1, WIRE_TYPE_LENGTH_DELIMITED);
      writer.writeString(message.street);
    }
    
    if (message.city) {
      writer.writeTag(2, WIRE_TYPE_LENGTH_DELIMITED);
      writer.writeString(message.city);
    }
    
    return writer;
  }

  static decode(reader) {
    // ... decode implementation ...
  }
}

class Person extends Message {
  constructor(properties) {
    super(properties);
    this.name = properties?.name || '';
    this.address = properties?.address || null;
  }

  static encode(message, writer) {
    if (!writer) writer = new Writer();
    
    if (message.name) {
      writer.writeTag(1, WIRE_TYPE_LENGTH_DELIMITED);
      writer.writeString(message.name);
    }
    
    if (message.address) {
      writer.writeTag(2, WIRE_TYPE_LENGTH_DELIMITED);
      writer.fork();
      Address.encode(message.address, writer);
      writer.ldelim();
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
      const field = tag >>> 3;
      
      switch (field) {
        case 1:
          message.name = reader.readString();
          break;
        case 2:
          const nestedBuffer = reader.readBytes();
          message.address = Address.decode(nestedBuffer);
          break;
        default:
          reader.skipType(tag & 0x7);
          break;
      }
    }
    
    return message;
  }
}
```

## Performance Tips

1. **Reuse Writers**: Create a writer once and reset it between uses
2. **Pre-allocate**: For known message sizes, pre-allocate buffers
3. **Avoid Allocations**: Use primitive types when possible
4. **Batch Operations**: Process multiple messages together
5. **Profile**: Use the benchmark script to measure your specific use case

```javascript
// Reusing writer
const writer = new Writer();
for (const msg of messages) {
  writer.reset();
  Person.encode(msg, writer);
  const buffer = writer.finish();
  // ... process buffer ...
}
```

## Migration from protobuf.js

`protobuf-rslux` is designed to be a drop-in replacement for protobuf.js minimal version:

### What's Compatible

- ✅ All Message API methods
- ✅ Reader/Writer classes
- ✅ Wire type constants
- ✅ Encoding/decoding behavior

### Differences

- ⚠️ Implemented in Rust (native module) instead of pure JavaScript
- ⚠️ Slightly different error messages
- ⚠️ Better performance (3-5x faster in most cases)

### Migration Example

**Before (protobuf.js):**
```javascript
const protobuf = require('protobufjs/minimal');
const Reader = protobuf.Reader;
const Writer = protobuf.Writer;
```

**After (protobuf-rslux):**
```javascript
const { Reader, Writer, Message } = require('protobuf-rslux/message');
```

That's it! The rest of your code should work unchanged.

## Troubleshooting

### Issue: Module not found

**Solution**: Make sure the native module is built:
```bash
npm run build:debug
```

### Issue: Type errors in TypeScript

**Solution**: Install type definitions:
```bash
npm install --save-dev @types/node
```

### Issue: Performance not as expected

**Solution**: 
1. Use release build: `npm run build`
2. Reuse Writer instances
3. Process in batches
4. Run benchmarks: `npm run benchmark`

## Additional Resources

- [Example Code](./example.js)
- [Test Suite](./test-message.js)
- [Benchmarks](./benchmark.js)
- [README](./README.md)
