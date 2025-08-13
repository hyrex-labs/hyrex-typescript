import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createUuid7FunctionQuery = `-- name: CreateUuid7Function :exec
CREATE OR REPLACE FUNCTION uuid7() RETURNS uuid
    LANGUAGE plpgsql
    VOLATILE  -- ← must be VOLATILE
AS $$
DECLARE
    ts         bigint;
    hex_ts     text;
    rand_hex   text;
    u          text;
    var_nibble text := to_hex((8 + floor(random()*4))::int)::text; -- 8–B → RFC 4122 "10xx" variant
BEGIN
    -- 48-bit millisecond Unix epoch
    ts      := floor(extract(epoch FROM clock_timestamp()) * 1000);
    hex_ts  := lpad(to_hex(ts), 12, '0');

    -- 80 bits of random-ish hex (you’ll use 74 of them, per RFC 9562 §6.9)  [oai_citation:0‡rfc-editor.org](https://www.rfc-editor.org/rfc/rfc9562.html?utm_source=chatgpt.com)
    rand_hex := substr(md5(random()::text), 1, 20);

    -- Assemble UUIDv7:  time_hi | time_mid | ver+randA | var+randB | randC
    u :=
            substr(hex_ts,1,8)               || '-' ||
            substr(hex_ts,9,4)               || '-' ||
            '7'       || substr(rand_hex,1,3)   || '-' ||
            var_nibble|| substr(rand_hex,4,3)   || '-' ||
            substr(rand_hex,7,12);

    RETURN u::uuid;
END;
$$`;

export async function createUuid7Function(client: Client): Promise<void> {
    await client.query({
        text: createUuid7FunctionQuery,
        values: [],
        rowMode: "array"
    });
}

