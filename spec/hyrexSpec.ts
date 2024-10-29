import { z } from "zod";

const cronRegex = /^(\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([01]?\d|2[0-9]|3[01])) (\*|(1[0-2]|0?[1-9])) (\*|([0-6]))$/;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const iso8601UtcRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

const ZeroToNineSchema = z.number().int().min(0).max(9);

const CanonicalTaskRunStatusSchema = z.enum([
    "WAITING",
    "QUEUED",
    "RUNNING",
    "UP_FOR_CANCEL",
    "CANCELLED",
    "FAILED",
    "SUCCESS",
]);

const CronExpressionSchema = z.string().regex(cronRegex, "Invalid cron expression");
const UuidSchema = z.string().regex(uuidRegex, "Invalid UUID format");
const Iso8601UtcSchema = z.string().regex(iso8601UtcRegex, "Invalid ISO 8601 UTC datetime format");


type CanonicalTaskRunStatus = z.infer<typeof CanonicalTaskRunStatusSchema>;

const CanonicalTaskRunSchema = z.object({
    id: UuidSchema,
    taskName: z.string(),
    queue: z.string(),
    priority: ZeroToNineSchema,
    queued: Iso8601UtcSchema,
    started: Iso8601UtcSchema,
    finished: Iso8601UtcSchema,
    args: z.record(z.any()),
    attemptNumber: z.number(),
});

const CanonicalTaskRunRequest = z.object({
    cron: CronExpressionSchema
})


