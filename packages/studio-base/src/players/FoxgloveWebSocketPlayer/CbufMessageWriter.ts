// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import * as Cbuf from "@verdant-robotics/cbuf";
import { CbufMessage, CbufMessageDefinition, CbufValue } from "@verdant-robotics/cbuf/dist/types";

import { MessageWriter } from "./MessageWriter";

export class CbufMessageWriter implements MessageWriter {
  #schemaMap: Map<string, CbufMessageDefinition>;
  #msgdef: CbufMessageDefinition;

  public constructor(schemaText: string, messageType: string) {
    const res = parseCBufSchema(schemaText);
    if (res instanceof Error) {
      throw new Error(`Error parsing cbuf schema: ${res.message}\n\n${schemaText}`);
    }
    const [schemaMap, _hashMap] = Cbuf.createSchemaMaps(res);
    this.#schemaMap = schemaMap;
    const msgdef = this.#schemaMap.get(messageType);
    if (!msgdef) {
      throw new Error(`Message type ${messageType} not found in schema`);
    }
    this.#msgdef = msgdef;
  }

  public writeMessage(message: unknown): Uint8Array {
    const msgEvent: CbufMessage = {
      typeName: this.#msgdef.name,
      size: 0,
      variant: 0,
      hashValue: this.#msgdef.hashValue,
      timestamp: Date.now() / 1000,
      message: message as Record<string, CbufValue>,
    };
    msgEvent.size = Cbuf.serializedMessageSize(this.#schemaMap, msgEvent);

    const buffer = Cbuf.serializeMessage(this.#schemaMap, msgEvent);
    return new Uint8Array(buffer);
  }
}

function parseCBufSchema(schema: string): CbufMessageDefinition[] | Error {
  try {
    const stripped = Cbuf.preprocessSchema(schema);
    return Cbuf.parseSchema(stripped);
  } catch (unk) {
    return unk as Error;
  }
}
