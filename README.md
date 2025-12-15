# protobuf.js-rslux

High-performance Rust native module for Protocol Buffers using NAPI-RS, providing 100% API compatibility with protobuf.js minimal version.

## 🚀 Features

- **High Performance**: Rust-powered encoding/decoding with ~70k ops/sec throughput
- **100% API Compatible**: Drop-in replacement for protobuf.js minimal version
- **Zero Dependencies**: Pure Rust implementation with minimal JavaScript wrapper
- **Full Protocol Buffers Support**: All wire types and encoding schemes
- **Cross-Platform**: Works on Linux, macOS, and Windows

## 📦 Installation

```bash
npm install protobuf-rslux
```

## 🎯 Supported API

### Core Message API

```javascript
const { Message } = require('protobuf-rslux/message');

// Static methods
Message.create(properties)           // Create message instance
Message.encode(message, writer?)     // Encode message to binary
Message.encodeDelimited(message, writer?)  // Encode with length prefix
Message.decode(reader)               // Decode from binary
Message.decodeDelimited(reader)      // Decode length-prefixed message
Message.verify(message)              // Validate message structure
Message.fromObject(object)           // Convert plain object to message
Message.toObject(message, options?)  // Convert message to plain object

// Instance methods
message.toJSON()                     // Convert to JSON representation
```

### Reader/Writer API

```javascript
const { Reader, Writer } = require('protobuf-rslux');

// Writer methods
const writer = new Writer();
writer.writeTag(fieldNumber, wireType)
writer.writeVarint32(value)
writer.writeVarint64(value)
writer.writeSint32(value)           // ZigZag encoded
writer.writeSint64(value)           // ZigZag encoded
writer.writeFixed32(value)
writer.writeFixed64(value)
writer.writeSfixed32(value)
writer.writeSfixed64(value)
writer.writeFloat(value)
writer.writeDouble(value)
writer.writeBool(value)
writer.writeString(value)
writer.writeBytes(value)
writer.fork()                       // For nested messages
writer.ldelim()                     // Finish nested message
const buffer = writer.finish()      // Get final buffer

// Reader methods
const reader = new Reader(buffer);
reader.readVarint32()
reader.readVarint64()
reader.readSint32()                 // ZigZag decoded
reader.readSint64()                 // ZigZag decoded
reader.readFixed32()
reader.readFixed64()
reader.readSfixed32()
reader.readSfixed64()
reader.readFloat()
reader.readDouble()
reader.readBool()
reader.readString()
reader.readBytes()
reader.readRawBytes(length)         // Read exact bytes
reader.skipType(wireType)           // Skip unknown field
reader.hasMore()                    // Check if more data available
```

## 📖 Usage Example

```javascript
const {
  Message,
  Reader,
  Writer,
  WIRE_TYPE_VARINT,
  WIRE_TYPE_LENGTH_DELIMITED,
} = require('protobuf-rslux/message');

// Define a message class (normally generated from .proto)
class Person extends Message {
  constructor(properties) {
    super(properties);
    this.id = properties?.id || 0;
    this.name = properties?.name || '';
    this.email = properties?.email || '';
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
        case 1: message.id = reader.readVarint32(); break;
        case 2: message.name = reader.readString(); break;
        case 3: message.email = reader.readString(); break;
        default: reader.skipType(wireType); break;
      }
    }
    
    return message;
  }
}

// Usage
const person = Person.create({
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
});

// Encode
const buffer = Person.encode(person).finish();

// Decode
const decoded = Person.decode(buffer);

console.log(decoded.toJSON());
// { id: 1, name: 'John Doe', email: 'john@example.com' }
```

## 🔧 Supported Data Types

| Protobuf Type | Rust Type | Wire Type | JavaScript |
|--------------|-----------|-----------|------------|
| int32, uint32 | i32, u32 | Varint | number |
| int64, uint64 | i64, u64 | Varint | number |
| sint32 | i32 | Varint | number (zigzag) |
| sint64 | i64 | Varint | number (zigzag) |
| fixed32, sfixed32 | u32, i32 | Fixed32 | number |
| fixed64, sfixed64 | u64, i64 | Fixed64 | number |
| float | f32 | Fixed32 | number |
| double | f64 | Fixed64 | number |
| bool | bool | Varint | boolean |
| string | String | Length-delimited | string |
| bytes | Vec<u8> | Length-delimited | Buffer |
| message | - | Length-delimited | object |

## 🎯 Wire Type Constants

```javascript
const {
  WIRE_TYPE_VARINT,           // 0
  WIRE_TYPE_FIXED64,          // 1
  WIRE_TYPE_LENGTH_DELIMITED, // 2
  WIRE_TYPE_START_GROUP,      // 3 (deprecated)
  WIRE_TYPE_END_GROUP,        // 4 (deprecated)
  WIRE_TYPE_FIXED32,          // 5
} = require('protobuf-rslux');
```

## 🧪 Testing

```bash
# Run basic tests
npm test

# Run Message API tests
node test-message.js

# Run example
node example.js
```

## 📊 Performance

Benchmarked on typical hardware with complex messages (87 bytes, 7 fields):
- **Encoding**: ~95k messages/second
- **Decoding**: ~111k messages/second  
- **Roundtrip**: ~48k messages/second
- **Small messages**: ~128k messages/second
- **Low-level operations**: 230k-387k ops/second
- **Memory**: Minimal allocations due to Rust implementation

Run your own benchmarks:
```bash
node benchmark.js
```

## 🔨 Building from Source

```bash
# Install dependencies
npm install

# Build debug version
npm run build:debug

# Build release version
npm run build
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! This project aims to maintain 100% API compatibility with protobuf.js minimal version while providing superior performance through Rust implementation.

## 🔗 Related Projects

- [protobuf.js](https://github.com/protobufjs/protobuf.js) - Original JavaScript implementation
- [NAPI-RS](https://napi.rs/) - Rust bindings for Node.js