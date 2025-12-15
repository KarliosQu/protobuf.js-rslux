/**
 * TypeScript definitions for protobuf-rslux Message API
 */

import { Reader, Writer } from './index';

export { Reader, Writer };

/**
 * Conversion options for toObject
 */
export interface ConversionOptions {
  /**
   * Whether to include default values
   */
  defaults?: boolean;
  
  /**
   * Whether to include arrays even if empty
   */
  arrays?: boolean;
  
  /**
   * Whether to include objects even if empty
   */
  objects?: boolean;
  
  /**
   * Long conversion type
   */
  longs?: 'String' | 'Number';
  
  /**
   * Enum conversion type
   */
  enums?: 'String' | 'Number';
  
  /**
   * Bytes conversion type
   */
  bytes?: 'String' | 'Array' | 'Buffer';
  
  /**
   * Whether to include oneofs
   */
  oneofs?: boolean;
}

/**
 * Base Message class
 */
export declare class Message {
  /**
   * Create a new message instance
   */
  constructor(properties?: Record<string, any>);
  
  /**
   * Create a new message instance
   */
  static create<T extends Message>(this: new (properties?: any) => T, properties?: Record<string, any>): T;
  
  /**
   * Encode a message
   */
  static encode<T extends Message>(message: T | Record<string, any>, writer?: Writer): Writer;
  
  /**
   * Encode a message with length prefix
   */
  static encodeDelimited<T extends Message>(message: T | Record<string, any>, writer?: Writer): Writer;
  
  /**
   * Decode a message from buffer
   */
  static decode<T extends Message>(this: new () => T, reader: Reader | Uint8Array | Buffer): T;
  
  /**
   * Decode a length-delimited message
   */
  static decodeDelimited<T extends Message>(this: new () => T, reader: Reader | Uint8Array | Buffer): T;
  
  /**
   * Verify a message
   */
  static verify(message: Record<string, any>): string | null;
  
  /**
   * Create a message from a plain object
   */
  static fromObject<T extends Message>(this: new (properties?: any) => T, object: Record<string, any>): T;
  
  /**
   * Convert message to plain object
   */
  static toObject<T extends Message>(message: T, options?: ConversionOptions): Record<string, any>;
  
  /**
   * Convert to JSON
   */
  toJSON(): Record<string, any>;
}

/**
 * Field types enum
 */
export declare const types: {
  double: 1;
  float: 2;
  int64: 3;
  uint64: 4;
  int32: 5;
  fixed64: 6;
  fixed32: 7;
  bool: 8;
  string: 9;
  group: 10;
  message: 11;
  bytes: 12;
  uint32: 13;
  enum: 14;
  sfixed32: 15;
  sfixed64: 16;
  sint32: 17;
  sint64: 18;
};

/**
 * Wire type constants
 */
export declare const WIRE_TYPE_VARINT: number;
export declare const WIRE_TYPE_FIXED64: number;
export declare const WIRE_TYPE_LENGTH_DELIMITED: number;
export declare const WIRE_TYPE_START_GROUP: number;
export declare const WIRE_TYPE_END_GROUP: number;
export declare const WIRE_TYPE_FIXED32: number;

/**
 * Helper to create a field encoder
 */
export declare function createFieldEncoder(
  fieldNumber: number,
  wireType: number,
  writeFunc: (this: Writer, value: any) => void
): (message: any, writer: Writer, value: any) => void;

/**
 * Helper to create a field decoder
 */
export declare function createFieldDecoder(
  readFunc: (this: Reader) => any
): (message: any, reader: Reader, field: string) => void;
